import React, { useState } from "react";
import {
  locationService,
  GeolocationErrorCode,
} from "../services/locationService";
import type {
  LocationSuggestion,
  GeolocationResult,
} from "../services/locationService";

interface GPSLocationButtonProps {
  onLocationDetected?: (location: LocationSuggestion) => void;
  onError?: (error: string) => void;
  className?: string;
  variant?: "primary" | "secondary" | "minimal";
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const GPSLocationButton: React.FC<GPSLocationButtonProps> = ({
  onLocationDetected,
  onError,
  className = "",
  variant = "secondary",
  size = "md",
  showText = true,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGetLocation = async () => {
    if (!locationService.isGeolocationAvailable()) {
      const error = "GPS is not supported by your browser";
      onError?.(error);
      return;
    }

    setIsLoading(true);

    try {
      const result: GeolocationResult =
        await locationService.getCurrentLocation({
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000, // 1 minute
        });

      if (result.success && result.position && result.address) {
        // Convert to LocationSuggestion format
        const locationSuggestion: LocationSuggestion = {
          id: `gps-${Date.now()}`,
          display_name: result.address,
          lat: result.position.lat,
          lon: result.position.lng,
          type: "gps_location",
          address: {
            country: "Vietnam", // Assuming Vietnam context
          },
        };

        onLocationDetected?.(locationSuggestion);
      } else {
        const errorMessage = getErrorMessage(result.errorCode, result.error);
        onError?.(errorMessage);
      }
    } catch (error) {
      console.error("GPS location error:", error);
      onError?.("Failed to get your location. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorMessage = (
    errorCode?: GeolocationErrorCode,
    fallbackError?: string
  ): string => {
    switch (errorCode) {
      case GeolocationErrorCode.PERMISSION_DENIED:
        return "Location access denied. Please enable location permissions and try again.";
      case GeolocationErrorCode.POSITION_UNAVAILABLE:
        return "Your location is currently unavailable. Please check your GPS settings.";
      case GeolocationErrorCode.TIMEOUT:
        return "Location request timed out. Please try again.";
      case GeolocationErrorCode.NOT_SUPPORTED:
        return "GPS is not supported by your browser.";
      default:
        return (
          fallbackError || "Failed to get your location. Please try again."
        );
    }
  };

  const getButtonStyles = () => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-lg border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

    const sizeStyles = {
      sm: "px-2.5 py-1.5 text-xs",
      md: "px-3 py-2 text-sm",
      lg: "px-4 py-2 text-base",
    };

    const variantStyles = {
      primary:
        "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300",
      secondary:
        "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400",
      minimal:
        "bg-transparent text-blue-600 border-transparent hover:bg-blue-50 focus:ring-blue-500 disabled:text-blue-300",
    };

    return `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`;
  };

  const getIconSize = () => {
    switch (size) {
      case "sm":
        return "h-3 w-3";
      case "md":
        return "h-4 w-4";
      case "lg":
        return "h-5 w-5";
      default:
        return "h-4 w-4";
    }
  };

  return (
    <button
      onClick={handleGetLocation}
      disabled={isLoading}
      className={getButtonStyles()}
      title="Use my current location"
    >
      {isLoading ? (
        <>
          <div
            className={`animate-spin rounded-full border-2 border-current border-t-transparent ${getIconSize()} ${
              showText ? "mr-2" : ""
            }`}
          />
          {showText && "Getting location..."}
        </>
      ) : (
        <>
          <svg
            className={`${getIconSize()} ${showText ? "mr-2" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {showText && "Use my location"}
        </>
      )}
    </button>
  );
};

export default GPSLocationButton;
