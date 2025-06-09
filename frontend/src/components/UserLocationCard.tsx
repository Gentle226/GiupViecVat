import React, { useState } from "react";
import GPSLocationButton from "./GPSLocationButton";
import type { LocationSuggestion } from "../services/locationService";

interface UserLocationCardProps {
  currentLocation?: {
    address: string;
    coordinates: [number, number];
  };
  onLocationUpdate?: (location: LocationSuggestion) => void;
  onError?: (error: string) => void;
  isUpdating?: boolean;
  className?: string;
}

const UserLocationCard: React.FC<UserLocationCardProps> = ({
  currentLocation,
  onLocationUpdate,
  onError,
  isUpdating = false,
  className = "",
}) => {
  const [showUpdateOptions, setShowUpdateOptions] = useState(false);

  const handleGPSLocationDetected = (location: LocationSuggestion) => {
    onLocationUpdate?.(location);
    setShowUpdateOptions(false);
  };

  const handleGPSError = (error: string) => {
    onError?.(error);
    setShowUpdateOptions(false);
  };

  const hasLocation = currentLocation && currentLocation.coordinates[0] !== 0;

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            📍 Your Location
          </h3>

          {hasLocation ? (
            <div className="space-y-1">
              <p className="text-sm text-gray-700">{currentLocation.address}</p>
              <p className="text-xs text-gray-500">
                {currentLocation.coordinates[1].toFixed(6)},{" "}
                {currentLocation.coordinates[0].toFixed(6)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No location set. Add your location to find nearby tasks.
            </p>
          )}
        </div>

        <div className="ml-4">
          {!showUpdateOptions ? (
            <button
              onClick={() => setShowUpdateOptions(true)}
              disabled={isUpdating}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
            >
              {hasLocation ? "Update" : "Add Location"}
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <GPSLocationButton
                onLocationDetected={handleGPSLocationDetected}
                onError={handleGPSError}
                variant="primary"
                size="sm"
                showText={true}
              />
              <button
                onClick={() => setShowUpdateOptions(false)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* GPS accuracy info */}
      {showUpdateOptions && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start">
            <svg
              className="h-4 w-4 text-blue-400 mt-0.5 mr-2 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-1">GPS Location Tips:</p>
              <ul className="space-y-0.5">
                <li>• Enable location services for best accuracy</li>
                <li>• Make sure you're not in a building for better signal</li>
                <li>• This helps you find tasks near you</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserLocationCard;
