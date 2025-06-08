import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTask } from "../contexts/TaskContext";
import LocationInput from "../components/LocationInput";
import type { LocationSuggestion, LatLng } from "../services/locationService";
import type { Task } from "../../../shared/types";
import {
  TaskCategory,
  TaskStatus,
  TimingType,
  TimeOfDay,
} from "../../../shared/types";
import {
  Search,
  Filter,
  MapPin,
  Clock,
  Calendar,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  Navigation,
} from "lucide-react";

const TaskList: React.FC = () => {
  const { user } = useAuth();
  const {
    tasks,
    isLoading,
    error,
    totalPages,
    currentPage,
    filters,
    loadTasks,
    setFilters,
    clearError,
  } = useTask();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<LatLng | null>(null);
  const [searchRadius, setSearchRadius] = useState(10); // km
  const [useMyLocation, setUseMyLocation] = useState(false);
  useEffect(() => {
    loadTasks(1);
  }, [loadTasks]);

  // Initialize with user's location if available
  useEffect(() => {
    if (user?.location?.coordinates && user.location.coordinates[0] !== 0) {
      setSelectedLocation({
        lat: user.location.coordinates[1],
        lng: user.location.coordinates[0],
      });
      setLocationSearch(user.location.address);
      setUseMyLocation(true);
    }
  }, [user]);

  const handleLocationSelect = (location: LocationSuggestion) => {
    setSelectedLocation({ lat: location.lat, lng: location.lon });
    setLocationSearch(location.display_name);
    setUseMyLocation(false);

    // Apply location filter
    const locationFilter = {
      location: {
        lat: location.lat,
        lng: location.lon,
        radius: searchRadius,
      },
    };
    setFilters(locationFilter);
    loadTasks(1);
  };

  const handleUseMyLocation = () => {
    if (user?.location?.coordinates && user.location.coordinates[0] !== 0) {
      setSelectedLocation({
        lat: user.location.coordinates[1],
        lng: user.location.coordinates[0],
      });
      setLocationSearch(user.location.address);
      setUseMyLocation(true);

      // Apply user location filter
      const locationFilter = {
        location: {
          lat: user.location.coordinates[1],
          lng: user.location.coordinates[0],
          radius: searchRadius,
        },
      };
      setFilters(locationFilter);
      loadTasks(1);
    }
  };

  const clearLocationFilter = () => {
    setSelectedLocation(null);
    setLocationSearch("");
    setUseMyLocation(false);

    // Remove location from filters
    const newFilters = { ...filters };
    delete newFilters.location;
    setFilters(newFilters);
    loadTasks(1);
  };
  const calculateDistance = (task: Task): number | null => {
    if (!selectedLocation || !task.location?.coordinates) return null;

    const [taskLng, taskLat] = task.location.coordinates;
    const { lat, lng } = selectedLocation;

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ search: searchTerm });
    loadTasks(1);
  };
  const handleFilterChange = (
    filterType: string,
    value: string | undefined
  ) => {
    setFilters({ [filterType]: value });
    loadTasks(1);
  };

  const handlePageChange = (page: number) => {
    loadTasks(page);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };
  const formatTiming = (task: {
    timingType?: TimingType;
    specificDate?: Date;
    needsSpecificTime?: boolean;
    timeOfDay?: TimeOfDay[];
  }) => {
    if (!task.timingType) return "Timing not specified";

    switch (task.timingType) {
      case TimingType.FLEXIBLE:
        return "Flexible timing";
      case TimingType.ON_DATE:
        if (task.specificDate) {
          const dateStr = new Date(task.specificDate).toLocaleDateString();
          if (
            task.needsSpecificTime &&
            task.timeOfDay &&
            task.timeOfDay.length > 0
          ) {
            const timeLabel = getTimeOfDayLabel(task.timeOfDay);
            return `On ${dateStr} (${timeLabel})`;
          }
          return `On ${dateStr}`;
        }
        return "On specific date";
      case TimingType.BEFORE_DATE:
        if (task.specificDate) {
          const dateStr = new Date(task.specificDate).toLocaleDateString();
          if (
            task.needsSpecificTime &&
            task.timeOfDay &&
            task.timeOfDay.length > 0
          ) {
            const timeLabel = getTimeOfDayLabel(task.timeOfDay);
            return `Before ${dateStr} (${timeLabel})`;
          }
          return `Before ${dateStr}`;
        }
        return "Before specific date";
      default:
        return "Timing not specified";
    }
  };
  const getTimeOfDayLabel = (timeOfDay: TimeOfDay[]): string => {
    if (!timeOfDay || timeOfDay.length === 0) return "Any time";

    const labels = timeOfDay.map((time) => {
      switch (time) {
        case TimeOfDay.MORNING:
          return "Morning";
        case TimeOfDay.MIDDAY:
          return "Midday";
        case TimeOfDay.AFTERNOON:
          return "Afternoon";
        case TimeOfDay.EVENING:
          return "Evening";
        default:
          return time;
      }
    });

    return labels.join(", ");
  };

  const getCategoryIcon = (category: TaskCategory) => {
    // Return appropriate icon based on category
    switch (category) {
      case TaskCategory.HOUSEHOLD:
        return "🏠";
      case TaskCategory.TECH:
        return "💻";
      case TaskCategory.TRANSPORTATION:
        return "🚗";
      case TaskCategory.REPAIRS:
        return "🔧";
      case TaskCategory.CLEANING:
        return "🧹";
      case TaskCategory.GARDENING:
        return "🌱";
      case TaskCategory.MOVING:
        return "📦";
      case TaskCategory.HANDYMAN:
        return "🔨";
      default:
        return "🏠";
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.OPEN:
        return "bg-green-100 text-green-800";
      case TaskStatus.IN_PROGRESS:
        return "bg-blue-100 text-blue-800";
      case TaskStatus.COMPLETED:
        return "bg-gray-100 text-gray-800";
      case TaskStatus.CANCELLED:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
      {" "}
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {user?.isTasker ? "Find Tasks" : "Browse Tasks"}
        </h1>
        <p className="text-lg text-gray-600">
          {user?.isTasker
            ? "Discover tasks in your area and start earning money today"
            : "Browse available tasks and see what services are being requested"}
        </p>
      </div>
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <form onSubmit={handleSearch} className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </form>

        {/* Filter Panel */}
        {showFilters && (
          <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category || ""}
                onChange={(e) =>
                  handleFilterChange("category", e.target.value || undefined)
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {Object.values(TaskCategory).map((category) => (
                  <option key={category} value={category}>
                    {category.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>{" "}
              <select
                value={filters.status || ""}
                onChange={(e) =>
                  handleFilterChange("status", e.target.value || undefined)
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                {Object.values(TaskStatus)
                  .filter((status) => status !== TaskStatus.IN_PROGRESS)
                  .map((status) => (
                    <option key={status} value={status}>
                      {status.replace(/_/g, " ")}
                    </option>
                  ))}
              </select>
            </div>{" "}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tìm theo vị trí
              </label>
              <div className="space-y-2">
                <LocationInput
                  value={locationSearch}
                  onChange={setLocationSearch}
                  onLocationSelect={handleLocationSelect}
                  placeholder="Nhập địa chỉ để tìm việc gần đó..."
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
                        Gần tôi
                      </button>
                    )}

                  {selectedLocation && (
                    <div className="flex items-center space-x-2">
                      <select
                        value={searchRadius}
                        onChange={(e) =>
                          setSearchRadius(Number(e.target.value))
                        }
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value={5}>5km</option>
                        <option value={10}>10km</option>
                        <option value={20}>20km</option>
                        <option value={50}>50km</option>
                      </select>

                      <button
                        onClick={clearLocationFilter}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Xóa
                      </button>
                    </div>
                  )}
                </div>

                {selectedLocation && (
                  <p className="text-xs text-green-600">
                    🎯 Đang hiển thị việc trong bán kính {searchRadius}km
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Task Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      ) : tasks.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No tasks found
          </h3>
          <p className="text-gray-600 mb-4">
            {user?.isTasker
              ? "No tasks match your criteria. Try adjusting your search or check back later for new opportunities."
              : "Try adjusting your search criteria or check back later."}
          </p>
          {!user?.isTasker && (
            <Link
              to="/post-task"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Post the First Task
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {tasks.map((task) => (
              <div
                key={task._id}
                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  {/* Task Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {getCategoryIcon(task.category)}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          task.status
                        )}`}
                      >
                        {task.status.replace(/_/g, " ")}
                      </span>
                    </div>{" "}
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {formatPrice(task.suggestedPrice)}
                      </div>
                      <div className="text-xs text-gray-500">Budget</div>
                    </div>
                  </div>{" "}
                  {/* Task Title and Description */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {task.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-3">
                    {task.description}
                  </p>
                  <p className="text-xs text-gray-400 mb-4 font-mono">
                    ID: {task._id}
                  </p>{" "}
                  {/* Task Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="h-4 w-4" />
                      <span>{task.location.address}</span>
                      {selectedLocation &&
                        (() => {
                          const distance = calculateDistance(task);
                          return distance !== null ? (
                            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {distance}km away
                            </span>
                          ) : null;
                        })()}
                    </div>{" "}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>{formatTiming(task)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>
                        Posted {new Date(task.createdAt).toLocaleDateString()}
                      </span>
                    </div>{" "}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <UserIcon className="h-4 w-4" />
                      <span>
                        Posted by{" "}
                        {typeof task.postedBy === "string" || !task.postedBy
                          ? "User"
                          : `${task.postedBy.firstName} ${task.postedBy.lastName}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>{formatTiming(task)}</span>
                    </div>
                  </div>
                  {/* Action Button */}
                  <Link
                    to={`/tasks/${task._id}`}
                    className="block w-full bg-blue-600 text-white text-center py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded-md text-sm ${
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TaskList;
