import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { useTask } from "../contexts/TaskContext";
import LocationInput from "../components/LocationInput";
import LocationMap from "../components/LocationMap";
import type { LocationSuggestion, LatLng } from "../services/locationService";
import type { Task } from "../../../shared/types";
import { TaskCategory, TaskStatus, LocationType } from "../../../shared/types";
import {
  Search,
  MapPin,
  Calendar,
  Navigation,
  Sliders,
  X,
  Map,
  List,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface FilterState {
  search: string;
  categories: TaskCategory[];
  locationType: LocationType | "all";
  location: LatLng | null;
  distance: number;
  priceMin: number;
  priceMax: number;
  availableOnly: boolean;
  noOffersOnly: boolean;
  sortBy:
    | "recommended"
    | "recent"
    | "due_soon"
    | "closest"
    | "price_low"
    | "price_high";
}

const TaskList: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    tasks,
    isLoading,
    error,
    loadTasks,
    setFilters: setContextFilters,
    clearError,
  } = useTask();

  // Local state for enhanced filters
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    categories: [],
    locationType: "all",
    location: null,
    distance: 10,
    priceMin: 5,
    priceMax: 9999,
    availableOnly: false,
    noOffersOnly: false,
    sortBy: "recommended",
  });

  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [locationSearch, setLocationSearch] = useState("");
  const [useMyLocation, setUseMyLocation] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Initialize with user's location if available
  useEffect(() => {
    if (user?.location?.coordinates && user.location.coordinates[0] !== 0) {
      setFilters((prev) => ({
        ...prev,
        location: {
          lat: user.location.coordinates[1],
          lng: user.location.coordinates[0],
        },
      }));
      setLocationSearch(user.location.address);
      setUseMyLocation(true);
    }
  }, [user]); // Load initial tasks only once when component mounts
  useEffect(() => {
    loadTasks(1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply filters to context when they change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const contextFilter: Record<string, unknown> = {};

      if (filters.search) {
        contextFilter.search = filters.search;
      }

      if (filters.categories.length > 0) {
        contextFilter.categories = filters.categories;
      }

      if (filters.locationType !== "all") {
        contextFilter.locationType = filters.locationType;
      }

      if (filters.location) {
        contextFilter.location = {
          lat: filters.location.lat,
          lng: filters.location.lng,
          radius: filters.distance,
        };
      }

      if (filters.priceMin > 5) {
        contextFilter.priceMin = filters.priceMin;
      }

      if (filters.priceMax < 9999) {
        contextFilter.priceMax = filters.priceMax;
      }

      if (filters.availableOnly) {
        contextFilter.availableOnly = filters.availableOnly;
      }

      // Apply filters to context
      setContextFilters(contextFilter);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [
    filters.search,
    filters.categories,
    filters.locationType,
    filters.location,
    filters.distance,
    filters.priceMin,
    filters.priceMax,
    filters.availableOnly,
    setContextFilters,
  ]);

  // Load tasks when context filters change
  useEffect(() => {
    loadTasks(1);
  }, [loadTasks]);
  // Filter and sort tasks client-side for features not yet supported by backend
  const filteredAndSortedTasks = useMemo(() => {
    let result = [...tasks];

    // Apply location type filter
    if (filters.locationType !== "all") {
      result = result.filter(
        (task) => task.locationType === filters.locationType
      );
    }

    // Apply price range filter
    result = result.filter(
      (task) =>
        task.suggestedPrice >= filters.priceMin &&
        task.suggestedPrice <= filters.priceMax
    );

    // Apply available only filter
    if (filters.availableOnly) {
      result = result.filter(
        (task) => task.status === TaskStatus.OPEN && !task.assignedTo
      );
    }

    // Apply no offers only filter (would need backend support for bid count)
    // For now, we'll assume all open tasks might have offers
    if (filters.noOffersOnly) {
      result = result.filter((task) => task.status === TaskStatus.OPEN);
    }

    // Sort tasks
    switch (filters.sortBy) {
      case "recent":
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "due_soon":
        result.sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
        break;
      case "closest":
        if (filters.location) {
          result.sort((a, b) => {
            const distanceA = calculateDistance(a, filters.location!);
            const distanceB = calculateDistance(b, filters.location!);
            if (distanceA === null && distanceB === null) return 0;
            if (distanceA === null) return 1;
            if (distanceB === null) return -1;
            return distanceA - distanceB;
          });
        }
        break;
      case "price_low":
        result.sort((a, b) => a.suggestedPrice - b.suggestedPrice);
        break;
      case "price_high":
        result.sort((a, b) => b.suggestedPrice - a.suggestedPrice);
        break;
      case "recommended":
      default:
        // Keep original order for now (could implement ML-based recommendation later)
        break;
    }

    return result;
  }, [tasks, filters]);

  // Apply pagination to filtered results
  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedTasks.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedTasks, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedTasks.length / itemsPerPage);

  const calculateDistance = (task: Task, location: LatLng): number | null => {
    if (!task.location?.coordinates) return null;

    const [taskLng, taskLat] = task.location.coordinates;
    const { lat, lng } = location;

    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in km
    const dLat = ((taskLat - lat) * Math.PI) / 180;
    const dLng = ((taskLng - lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat * Math.PI) / 180) *
        Math.cos((taskLat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  };

  const handleLocationSelect = (location: LocationSuggestion) => {
    setFilters((prev) => ({
      ...prev,
      location: { lat: location.lat, lng: location.lon },
    }));
    setLocationSearch(location.display_name);
    setUseMyLocation(false);
  };

  const handleUseMyLocation = () => {
    if (user?.location?.coordinates && user.location.coordinates[0] !== 0) {
      setFilters((prev) => ({
        ...prev,
        location: {
          lat: user.location.coordinates[1],
          lng: user.location.coordinates[0],
        },
      }));
      setLocationSearch(user.location.address);
      setUseMyLocation(true);
    }
  };

  const clearLocationFilter = () => {
    setFilters((prev) => ({
      ...prev,
      location: null,
    }));
    setLocationSearch("");
    setUseMyLocation(false);
  };

  const handleCategoryToggle = (category: TaskCategory) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      search: "",
      categories: [],
      locationType: "all",
      location: null,
      distance: 10,
      priceMin: 5,
      priceMax: 9999,
      availableOnly: false,
      noOffersOnly: false,
      sortBy: "recommended",
    });
    setLocationSearch("");
    setUseMyLocation(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const formatCategoryName = (category: TaskCategory) => {
    return t(`tasks.findTasks.categoryNames.${category.toLowerCase()}`);
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.OPEN:
        return "bg-green-100 text-green-800";
      case TaskStatus.ASSIGNED:
        return "bg-blue-100 text-blue-800";
      case TaskStatus.IN_PROGRESS:
        return "bg-yellow-100 text-yellow-800";
      case TaskStatus.COMPLETED:
        return "bg-gray-100 text-gray-800";
      case TaskStatus.CANCELLED:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  // Generate map markers from filtered tasks
  const mapMarkers = filteredAndSortedTasks
    .filter((task) => task.location?.coordinates)
    .map((task) => ({
      position: {
        lat: task.location.coordinates[1],
        lng: task.location.coordinates[0],
      } as LatLng,
      popup: `
        <div class="p-2">
          <h3 class="font-semibold text-sm">${task.title}</h3>
          <p class="text-xs text-gray-600 mb-1">${formatPrice(
            task.suggestedPrice
          )}</p>
          <p class="text-xs">${task.location.address}</p>
        </div>
      `,
      title: task.title,
    }));

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              clearError();
              loadTasks(1);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <style>
        {`
          .slider {
            background: linear-gradient(to right, #3B82F6 0%, #3B82F6 var(--value), #E5E7EB var(--value), #E5E7EB 100%);
          }
          .slider::-webkit-slider-thumb {
            appearance: none;
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background: #3B82F6;
            cursor: pointer;
            border: 2px solid #ffffff;
            box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
          }
          .slider::-moz-range-thumb {
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background: #3B82F6;
            cursor: pointer;
            border: 2px solid #ffffff;
            box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
          }
        `}
      </style>{" "}
      {/* Header */}
      <div className="mb-6">
        {" "}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t("tasks.findTasks.title")}
        </h1>
        <p className="text-gray-600">{t("home.subtitle")}</p>
      </div>
      {/* Search and View Toggle */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />{" "}
            <input
              type="text"
              placeholder={t("tasks.findTasks.searchPlaceholder")}
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* View Toggle */}
          <div className="flex rounded-md border border-gray-300">
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 rounded-l-md transition-colors flex items-center gap-2 ${
                viewMode === "list"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <List className="h-4 w-4" />
              {t("tasks.findTasks.listView")}
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`px-4 py-2 rounded-r-md transition-colors flex items-center gap-2 ${
                viewMode === "map"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Map className="h-4 w-4" />
              {t("tasks.findTasks.mapView")}
            </button>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <Sliders className="h-4 w-4" />
            {t("tasks.findTasks.filters")}
            {(filters.categories.length > 0 ||
              filters.locationType !== "all" ||
              filters.availableOnly ||
              filters.noOffersOnly ||
              filters.priceMin > 5 ||
              filters.priceMax < 9999) && (
              <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                {filters.categories.length +
                  (filters.locationType !== "all" ? 1 : 0) +
                  (filters.availableOnly ? 1 : 0) +
                  (filters.noOffersOnly ? 1 : 0) +
                  (filters.priceMin > 5 || filters.priceMax < 9999 ? 1 : 0)}
              </span>
            )}
          </button>
        </div>
      </div>
      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          {" "}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {t("tasks.findTasks.filters")}
            </h3>
            <div className="flex gap-2">
              {" "}
              <button
                onClick={clearAllFilters}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                {t("tasks.findTasks.clearFilters")}
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {" "}
            {/* Categories */}{" "}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t("tasks.findTasks.categories")}
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {Object.values(TaskCategory).map((category) => (
                  <label key={category} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category)}
                      onChange={() => handleCategoryToggle(category)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {formatCategoryName(category)}
                    </span>
                  </label>
                ))}
              </div>
            </div>{" "}
            {/* Location Type */}{" "}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t("tasks.findTasks.locationType")}
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="locationType"
                    checked={filters.locationType === "all"}
                    onChange={() =>
                      setFilters((prev) => ({ ...prev, locationType: "all" }))
                    }
                    className="text-blue-600 focus:ring-blue-500"
                  />{" "}
                  <span className="ml-2 text-sm text-gray-700">
                    {t("tasks.findTasks.allLocations")}
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="locationType"
                    checked={filters.locationType === LocationType.IN_PERSON}
                    onChange={() =>
                      setFilters((prev) => ({
                        ...prev,
                        locationType: LocationType.IN_PERSON,
                      }))
                    }
                    className="text-blue-600 focus:ring-blue-500"
                  />{" "}
                  <span className="ml-2 text-sm text-gray-700">
                    {t("tasks.findTasks.inPerson")}
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="locationType"
                    checked={filters.locationType === LocationType.ONLINE}
                    onChange={() =>
                      setFilters((prev) => ({
                        ...prev,
                        locationType: LocationType.ONLINE,
                      }))
                    }
                    className="text-blue-600 focus:ring-blue-500"
                  />{" "}
                  <span className="ml-2 text-sm text-gray-700">
                    {t("tasks.findTasks.online")}
                  </span>
                </label>
              </div>
            </div>{" "}
            {/* Location */}{" "}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t("tasks.findTasks.location")}
              </label>
              <div className="space-y-3">
                {" "}
                <LocationInput
                  value={locationSearch}
                  onChange={setLocationSearch}
                  onLocationSelect={handleLocationSelect}
                  placeholder={t("tasks.findTasks.enterLocation")}
                  className="border-gray-300"
                />
                <div className="flex items-center space-x-2">
                  {user?.location?.coordinates &&
                    user.location.coordinates[0] !== 0 && (
                      <button
                        onClick={handleUseMyLocation}
                        className={`flex items-center px-3 py-1 text-xs rounded-full border transition-colors ${
                          useMyLocation
                            ? "bg-blue-100 text-blue-700 border-blue-300"
                            : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
                        }`}
                      >
                        <Navigation className="h-3 w-3 mr-1" />
                        {t("tasks.findTasks.useMyLocation")}
                      </button>
                    )}

                  {filters.location && (
                    <button
                      onClick={clearLocationFilter}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      {t("tasks.findTasks.clearFilters")}
                    </button>
                  )}
                </div>
                {filters.location && (
                  <div>
                    {" "}
                    <label className="block text-xs text-gray-600 mb-1">
                      {t("tasks.findTasks.distance")}: {filters.distance}km
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={filters.distance}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          distance: Number(e.target.value),
                        }))
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>1km</span>
                      <span>100km</span>
                    </div>
                  </div>
                )}
              </div>
            </div>{" "}
            {/* Price Range */}{" "}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t("tasks.findTasks.priceRange")}
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="5"
                  max="9999"
                  value={filters.priceMin}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      priceMin: Number(e.target.value),
                    }))
                  }
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                />{" "}
                <span className="text-sm text-gray-500">
                  {t("tasks.findTasks.to")}
                </span>
                <input
                  type="number"
                  min="5"
                  max="9999"
                  value={filters.priceMax}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      priceMax: Number(e.target.value),
                    }))
                  }
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
            </div>{" "}
            {/* Other Filters */}{" "}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t("tasks.findTasks.options")}
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.availableOnly}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        availableOnly: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />{" "}
                  <span className="ml-2 text-sm text-gray-700">
                    {t("tasks.findTasks.availableOnly")}
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.noOffersOnly}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        noOffersOnly: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />{" "}
                  <span className="ml-2 text-sm text-gray-700">
                    {t("tasks.findTasks.noOffersOnly")}
                  </span>
                </label>
              </div>
            </div>{" "}
            {/* Sort */}{" "}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t("tasks.findTasks.sortBy")}
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    sortBy: e.target.value as FilterState["sortBy"],
                  }))
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="recommended">
                  {t("tasks.findTasks.recommended")}
                </option>
                <option value="recent">{t("tasks.findTasks.recent")}</option>
                <option value="due_soon">{t("tasks.findTasks.dueSoon")}</option>
                <option value="closest">{t("tasks.findTasks.closest")}</option>
                <option value="price_low">
                  {t("tasks.findTasks.priceLow")}
                </option>
                <option value="price_high">
                  {t("tasks.findTasks.priceHigh")}
                </option>
              </select>
            </div>
          </div>
        </div>
      )}
      {/* Results */}
      <div className="flex gap-6">
        {/* Task List */}
        <div
          className={`${
            viewMode === "map" ? "w-1/2" : "w-full"
          } transition-all duration-300`}
        >
          {" "}
          <div className="mb-4 flex justify-between items-center">
            {" "}
            <p className="text-sm text-gray-600">
              {filteredAndSortedTasks.length} {t("tasks.findTasks.results")}
            </p>
          </div>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg shadow-sm border p-6 animate-pulse"
                >
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          ) : paginatedTasks.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t("tasks.findTasks.noTasksFound")}
              </h3>
              <p className="text-gray-600 mb-4">
                {t("tasks.findTasks.adjustFilters")}
              </p>
              <button
                onClick={clearAllFilters}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                {t("tasks.findTasks.clearFilters")}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedTasks.map((task) => {
                const distance = filters.location
                  ? calculateDistance(task, filters.location)
                  : null;

                return (
                  <div
                    key={task._id}
                    className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <Link
                          to={`/tasks/${task._id}`}
                          className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                        >
                          {task.title}
                        </Link>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                task.status
                              )}`}
                            >
                              {task.status.replace(/_/g, " ")}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              {formatCategoryName(task.category)}
                            </span>
                          </div>{" "}
                          {task.locationType === LocationType.ONLINE && (
                            <div className="flex items-center gap-1">
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                                {t("tasks.findTasks.online")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {formatPrice(task.suggestedPrice)}
                        </div>
                        {distance && (
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {t("tasks.findTasks.kmAway", { distance })}
                          </div>
                        )}
                      </div>
                    </div>{" "}
                    <p
                      className="text-gray-700 mb-4 overflow-hidden"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        maxHeight: "3rem",
                      }}
                    >
                      {task.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {task.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{task.location.address}</span>
                          </div>
                        )}
                        {task.dueDate && (
                          <div className="flex items-center gap-1">
                            {" "}
                            <Calendar className="h-4 w-4" />{" "}
                            <span>
                              {t("tasks.findTasks.due")}{" "}
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {" "}
                        <Link
                          to={`/tasks/${task._id}`}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                        >
                          {t("tasks.findTasks.viewDetails")}
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-4 mt-8">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t("tasks.findTasks.previous")}
              </button>

              <div className="flex space-x-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 border rounded-md text-sm font-medium ${
                        currentPage === page
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("tasks.findTasks.next")}
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          )}
        </div>

        {/* Map View */}
        {viewMode === "map" && (
          <div className="w-1/2">
            <div className="sticky top-8">
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                {" "}
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-gray-900">
                    {t("tasks.findTasks.taskLocations")}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {mapMarkers.length} {t("tasks.findTasks.tasksOnMap")}
                  </p>
                </div>
                <LocationMap
                  center={filters.location || { lat: 40.7128, lng: -74.006 }} // Default to NYC
                  zoom={filters.location ? 12 : 10}
                  markers={mapMarkers}
                  height="500px"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskList;
