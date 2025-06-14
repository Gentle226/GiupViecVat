import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { tasksAPI } from "../services/api";
import LocationInput from "../components/LocationInputWithGPS";
import LocationMap from "../components/LocationMap";
import ImageUpload from "../components/ImageUpload";
import type { LocationSuggestion, LatLng } from "../services/locationService";
import {
  TaskCategory,
  TimingType,
  TimeOfDay,
  LocationType,
} from "../../../shared/types";
import {
  MapPin,
  Calendar,
  DollarSign,
  Tag,
  Plus,
  X,
  AlertCircle,
} from "lucide-react";

const CreateTask: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: TaskCategory.OTHER,
    budget: "",
    location: "",
    locationType: LocationType.IN_PERSON as string,
    dueDate: "",
    requirements: [] as string[],
    tags: [] as string[], // New timing fields
    timingType: TimingType.FLEXIBLE as string,
    specificDate: "",
    needsSpecificTime: false,
    timeOfDay: [] as string[],
  });
  const [newRequirement, setNewRequirement] = useState("");
  const [newTag, setNewTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedLocation, setSelectedLocation] = useState<LatLng | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  // Redirect taskers away from task creation (after hooks)
  if (user?.isTasker) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />{" "}
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            {t("createTask.accessRestricted")}
          </h1>
          <p className="text-gray-600 mb-4">
            {t("createTask.taskersCannotPost")}
          </p>
          <button
            onClick={() => navigate("/tasks")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t("createTask.browseTasks")}
          </button>
        </div>
      </div>
    );
  }

  const categories = Object.values(TaskCategory);
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };
  const handleTimeOfDayChange = (time: string) => {
    setFormData((prev) => {
      const currentTimes = prev.timeOfDay;
      const isSelected = currentTimes.includes(time);

      const newTimes = isSelected
        ? currentTimes.filter((t) => t !== time)
        : [...currentTimes, time];

      return {
        ...prev,
        timeOfDay: newTimes,
      };
    });

    // Clear error when user makes selection
    if (errors.timeOfDay) {
      setErrors((prev) => ({
        ...prev,
        timeOfDay: "",
      }));
    }
  };

  const handleLocationSelect = (location: LocationSuggestion) => {
    setSelectedLocation({ lat: location.lat, lng: location.lon });
  };

  const handleMapClick = (latLng: LatLng) => {
    setSelectedLocation(latLng);
  };

  const handleLocationChange = (address: string, latLng: LatLng) => {
    setFormData({ ...formData, location: address });
    setSelectedLocation(latLng);
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setFormData((prev) => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()],
      }));
      setNewRequirement("");
    }
  };

  const removeRequirement = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) {
      newErrors.title = t("createTask.validation.titleRequired");
    }

    if (!formData.description.trim()) {
      newErrors.description = t("createTask.validation.descriptionRequired");
    } else if (formData.description.trim().length < 10) {
      newErrors.description = t("createTask.validation.descriptionTooShort");
    }
    if (!formData.budget || parseFloat(formData.budget) <= 0) {
      newErrors.budget = t("createTask.validation.budgetRequired");
    }
    if (
      formData.locationType === LocationType.IN_PERSON &&
      !formData.location.trim()
    ) {
      newErrors.location = t("createTask.validation.locationRequired");
    } // Validate timing fields
    if (
      formData.timingType === TimingType.ON_DATE ||
      formData.timingType === TimingType.BEFORE_DATE
    ) {
      if (!formData.specificDate) {
        newErrors.specificDate = t("createTask.validation.dateRequired");
      } else {
        const selectedDate = new Date(formData.specificDate);
        const today = new Date();
        if (selectedDate <= today) {
          newErrors.specificDate = t("createTask.validation.dateFuture");
        }
      }
    }
    if (formData.needsSpecificTime && formData.timeOfDay.length === 0) {
      newErrors.timeOfDay = t("createTask.validation.timeOfDayRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!user) {
      alert(t("createTask.alerts.loginRequired"));
      return;
    }

    try {
      setLoading(true);

      // Create FormData for file upload
      const formDataToSend = new FormData();

      // Add all the task data
      formDataToSend.append("title", formData.title.trim());
      formDataToSend.append("description", formData.description.trim());
      formDataToSend.append("category", formData.category);
      formDataToSend.append("suggestedPrice", formData.budget);
      formDataToSend.append("locationType", formData.locationType);

      // Add location data
      const locationData = {
        address:
          formData.locationType === LocationType.IN_PERSON
            ? formData.location.trim()
            : "Online",
        coordinates: selectedLocation
          ? [selectedLocation.lng, selectedLocation.lat]
          : [0, 0],
      };
      formDataToSend.append("location", JSON.stringify(locationData));

      // Add timing data
      formDataToSend.append("timingType", formData.timingType);
      if (formData.specificDate) {
        formDataToSend.append("specificDate", formData.specificDate);
      }
      formDataToSend.append(
        "needsSpecificTime",
        formData.needsSpecificTime.toString()
      );
      if (formData.timeOfDay.length > 0) {
        formDataToSend.append("timeOfDay", JSON.stringify(formData.timeOfDay));
      }

      // Add images
      selectedImages.forEach((image) => {
        formDataToSend.append("images", image);
      });

      const response = await tasksAPI.createTaskWithImages(formDataToSend);
      alert(t("createTask.alerts.taskCreated"));
      if (response.data?._id) {
        navigate(`/tasks/${response.data._id}`);
      } else {
        navigate("/tasks");
      }
    } catch (err) {
      alert(t("createTask.alerts.createFailed"));
      console.error("Error creating task:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            {" "}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {t("createTask.pageTitle")}
            </h1>
            <p className="text-gray-600">{t("createTask.pageSubtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              {" "}
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("createTask.form.title")}
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.title ? "border-red-500" : "border-gray-300"
                }`}
                placeholder={t("createTask.form.titlePlaceholder")}
                maxLength={100}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.title}
                </p>
              )}
            </div>
            {/* Description */}
            <div>
              {" "}
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("createTask.form.description")}
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.description ? "border-red-500" : "border-gray-300"
                }`}
                placeholder={t("createTask.form.descriptionPlaceholder")}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.description}
                </p>
              )}{" "}
            </div>
            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("createTask.form.images")}
              </label>
              <p className="text-sm text-gray-500 mb-3">
                {t("createTask.form.imagesDescription")}
              </p>
              <ImageUpload
                images={selectedImages}
                onImagesChange={setSelectedImages}
                maxImages={5}
              />
            </div>
            {/* Category and Budget */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                {" "}
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t("createTask.form.category")}
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {" "}
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {t(`createTask.categories.${category}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                {" "}
                <label
                  htmlFor="budget"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t("createTask.form.budget")}
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    id="budget"
                    name="budget"
                    value={formData.budget}
                    onChange={handleInputChange}
                    min="1"
                    step="0.01"
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.budget ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder={t("createTask.form.budgetPlaceholder")}
                  />
                </div>
                {errors.budget && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.budget}
                  </p>
                )}
              </div>{" "}
            </div>{" "}
            {/* Location Type */}
            <div>
              {" "}
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t("createTask.form.tellUsWhere")}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label
                  className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.locationType === LocationType.IN_PERSON
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="locationType"
                    value={LocationType.IN_PERSON}
                    checked={formData.locationType === LocationType.IN_PERSON}
                    onChange={handleInputChange}
                    className="mt-1 mr-3"
                  />{" "}
                  <div>
                    <div className="font-medium text-gray-900">
                      {t("createTask.form.inPerson")}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {t("createTask.descriptions.inPersonDesc")}
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.locationType === LocationType.ONLINE
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="locationType"
                    value={LocationType.ONLINE}
                    checked={formData.locationType === LocationType.ONLINE}
                    onChange={handleInputChange}
                    className="mt-1 mr-3"
                  />{" "}
                  <div>
                    <div className="font-medium text-gray-900">
                      {t("createTask.form.online")}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {t("createTask.descriptions.onlineDesc")}
                    </div>
                  </div>
                </label>
              </div>
            </div>{" "}
            {/* Location and Timing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {" "}
              {formData.locationType === LocationType.IN_PERSON && (
                <div className="space-y-4">
                  <div>
                    {" "}
                    <label
                      htmlFor="location"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      {t("createTask.form.location")}
                    </label>
                    <LocationInput
                      value={formData.location}
                      onChange={(value) =>
                        setFormData({ ...formData, location: value })
                      }
                      onLocationSelect={handleLocationSelect}
                      placeholder={t("createTask.form.locationPlaceholder")}
                      className={
                        errors.location ? "border-red-500" : "border-gray-300"
                      }
                    />
                    {errors.location && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.location}
                      </p>
                    )}
                  </div>

                  {/* Map Toggle */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowMap(!showMap)}
                      className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                    >
                      {" "}
                      <MapPin className="h-4 w-4 mr-1" />
                      {showMap
                        ? t("createTask.form.hideMap")
                        : t("createTask.form.showMap")}
                    </button>
                  </div>

                  {/* Map Display */}
                  {showMap && (
                    <div className="mt-4">
                      <LocationMap
                        center={selectedLocation || undefined}
                        zoom={selectedLocation ? 15 : 6}
                        markers={
                          selectedLocation
                            ? [
                                {
                                  position: selectedLocation,
                                  popup:
                                    formData.location ||
                                    t("createTask.form.selectedLocation"),
                                  title: t("createTask.form.taskLocation"),
                                },
                              ]
                            : []
                        }
                        onClick={handleMapClick}
                        onLocationChange={handleLocationChange}
                        height="300px"
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              )}
              <div
                className={
                  formData.locationType === LocationType.ONLINE
                    ? "md:col-span-2"
                    : ""
                }
              >
                {" "}
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("createTask.form.whenNeedDone")}
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    {" "}
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="timingType"
                        value={TimingType.ON_DATE}
                        checked={formData.timingType === TimingType.ON_DATE}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      {t("createTask.form.onDate")}
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="timingType"
                        value={TimingType.BEFORE_DATE}
                        checked={formData.timingType === TimingType.BEFORE_DATE}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      {t("createTask.form.beforeDate")}
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="timingType"
                        value={TimingType.FLEXIBLE}
                        checked={formData.timingType === TimingType.FLEXIBLE}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      {t("createTask.form.flexible")}
                    </label>
                  </div>
                </div>
              </div>
            </div>{" "}
            {/* Specific Date (shown when On Date or Before Date is selected) */}
            {(formData.timingType === TimingType.ON_DATE ||
              formData.timingType === TimingType.BEFORE_DATE) && (
              <div>
                <label
                  htmlFor="specificDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {" "}
                  {formData.timingType === TimingType.ON_DATE
                    ? t("createTask.form.selectDate")
                    : t("createTask.form.completeBefore")}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    id="specificDate"
                    name="specificDate"
                    value={formData.specificDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split("T")[0]}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.specificDate ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                </div>
                {errors.specificDate && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.specificDate}
                  </p>
                )}
              </div>
            )}
            {/* Time of Day Preference */}
            <div>
              <div className="mb-2">
                <label className="flex items-center">
                  {" "}
                  <input
                    type="checkbox"
                    name="needsSpecificTime"
                    checked={formData.needsSpecificTime}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        needsSpecificTime: e.target.checked,
                        timeOfDay: e.target.checked ? prev.timeOfDay : [],
                      }))
                    }
                    className="mr-2"
                  />
                  {t("createTask.form.needSpecificTime")}
                </label>
              </div>

              {formData.needsSpecificTime && (
                <div>
                  {" "}
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("createTask.form.preferredTimeOfDay")}
                  </label>{" "}
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        value={TimeOfDay.MORNING}
                        checked={formData.timeOfDay.includes(TimeOfDay.MORNING)}
                        onChange={() =>
                          handleTimeOfDayChange(TimeOfDay.MORNING)
                        }
                        className="mr-2"
                      />{" "}
                      <div>
                        {" "}
                        <div className="font-medium">
                          {t("createTask.form.morning")}
                        </div>
                        <div className="text-sm text-gray-500">
                          {t("createTask.form.morningTime")}
                        </div>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        value={TimeOfDay.MIDDAY}
                        checked={formData.timeOfDay.includes(TimeOfDay.MIDDAY)}
                        onChange={() => handleTimeOfDayChange(TimeOfDay.MIDDAY)}
                        className="mr-2"
                      />{" "}
                      <div>
                        {" "}
                        <div className="font-medium">
                          {t("createTask.form.midday")}
                        </div>
                        <div className="text-sm text-gray-500">
                          {t("createTask.form.middayTime")}
                        </div>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        value={TimeOfDay.AFTERNOON}
                        checked={formData.timeOfDay.includes(
                          TimeOfDay.AFTERNOON
                        )}
                        onChange={() =>
                          handleTimeOfDayChange(TimeOfDay.AFTERNOON)
                        }
                        className="mr-2"
                      />{" "}
                      <div>
                        {" "}
                        <div className="font-medium">
                          {t("createTask.form.afternoon")}
                        </div>
                        <div className="text-sm text-gray-500">
                          {t("createTask.form.afternoonTime")}
                        </div>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        value={TimeOfDay.EVENING}
                        checked={formData.timeOfDay.includes(TimeOfDay.EVENING)}
                        onChange={() =>
                          handleTimeOfDayChange(TimeOfDay.EVENING)
                        }
                        className="mr-2"
                      />{" "}
                      <div>
                        {" "}
                        <div className="font-medium">
                          {t("createTask.form.evening")}
                        </div>
                        <div className="text-sm text-gray-500">
                          {t("createTask.form.eveningTime")}
                        </div>
                      </div>
                    </label>
                  </div>
                  {errors.timeOfDay && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.timeOfDay}
                    </p>
                  )}
                </div>
              )}
            </div>
            {/* Requirements */}
            <div>
              {" "}
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("createTask.form.requirements")}
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addRequirement())
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={t("createTask.form.addRequirement")}
                />
                <button
                  type="button"
                  onClick={addRequirement}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              {formData.requirements.length > 0 && (
                <div className="space-y-2">
                  {formData.requirements.map((req, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md"
                    >
                      <span className="text-sm text-gray-700">{req}</span>
                      <button
                        type="button"
                        onClick={() => removeRequirement(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Tags */}
            <div>
              {" "}
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("createTask.form.tags")}
              </label>
              <div className="flex gap-2 mb-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addTag())
                    }
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={t("createTask.form.addTag")}
                  />
                </div>
                <button
                  type="button"
                  onClick={addTag}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-indigo-600 hover:text-indigo-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? t("createTask.form.creatingTask")
                  : t("createTask.form.postTask")}
              </button>
              <button
                type="button"
                onClick={() => navigate("/tasks")}
                className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
              >
                {t("createTask.form.cancel")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTask;
