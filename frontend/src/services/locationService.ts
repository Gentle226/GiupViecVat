export interface LocationSuggestion {
  id: string;
  display_name: string;
  lat: number;
  lon: number;
  type: string;
  address: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city_district?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}

interface NominatimResult {
  place_id?: number;
  lat: string;
  lon: string;
  display_name: string;
  type?: string;
  address?: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city_district?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface GeolocationResult {
  success: boolean;
  position?: LatLng;
  address?: string;
  error?: string;
  errorCode?: GeolocationErrorCode;
}

export const GeolocationErrorCode = {
  PERMISSION_DENIED: 1,
  POSITION_UNAVAILABLE: 2,
  TIMEOUT: 3,
  NOT_SUPPORTED: 4,
} as const;

export type GeolocationErrorCode =
  (typeof GeolocationErrorCode)[keyof typeof GeolocationErrorCode];

// Vietnam major cities for quick suggestions
const VIETNAM_CITIES = [
  { name: "Hà Nội", lat: 21.0285, lng: 105.8542 },
  { name: "Thành phố Hồ Chí Minh", lat: 10.8231, lng: 106.6297 },
  { name: "Đà Nẵng", lat: 16.0471, lng: 108.2068 },
  { name: "Hải Phòng", lat: 20.8449, lng: 106.6881 },
  { name: "Cần Thơ", lat: 10.0452, lng: 105.7469 },
  { name: "Huế", lat: 16.4637, lng: 107.5909 },
  { name: "Nha Trang", lat: 12.2388, lng: 109.1967 },
  { name: "Vũng Tàu", lat: 10.4113, lng: 107.1365 },
  { name: "Đà Lạt", lat: 11.9404, lng: 108.4583 },
  { name: "Quy Nhon", lat: 13.7563, lng: 109.2297 },
];

class LocationService {
  private baseUrl = "https://nominatim.openstreetmap.org";
  private cache = new Map<string, LocationSuggestion[]>();

  // Search for locations in Vietnam
  async searchLocations(query: string): Promise<LocationSuggestion[]> {
    if (!query || query.length < 2) {
      return this.getPopularCities(query);
    }

    // Check cache first
    const cacheKey = query.toLowerCase();
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // Search with Vietnam context
      const params = new URLSearchParams({
        q: query,
        format: "json",
        addressdetails: "1",
        limit: "10",
        countrycodes: "vn", // Restrict to Vietnam
        "accept-language": "vi,en",
        dedupe: "1",
      });

      const response = await fetch(`${this.baseUrl}/search?${params}`);

      if (!response.ok) {
        throw new Error("Search failed");
      }
      const data: NominatimResult[] = await response.json();

      const suggestions: LocationSuggestion[] = data.map(
        (item: NominatimResult) => ({
          id: item.place_id?.toString() || Math.random().toString(),
          display_name: this.formatVietnameseAddress(item),
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          type: item.type || "unknown",
          address: item.address || {},
        })
      );

      // Cache results
      this.cache.set(cacheKey, suggestions);

      return suggestions;
    } catch (error) {
      console.error("Location search error:", error);
      return this.getPopularCities(query);
    }
  }

  // Get popular Vietnam cities that match the query
  private getPopularCities(query: string): LocationSuggestion[] {
    const lowerQuery = query.toLowerCase();
    return VIETNAM_CITIES.filter(
      (city) =>
        city.name.toLowerCase().includes(lowerQuery) ||
        this.removeVietnameseAccents(city.name)
          .toLowerCase()
          .includes(lowerQuery)
    ).map((city) => ({
      id: `city-${city.name}`,
      display_name: city.name,
      lat: city.lat,
      lon: city.lng,
      type: "city",
      address: {
        city: city.name,
        country: "Việt Nam",
      },
    }));
  }
  // Format Vietnamese address for better readability
  private formatVietnameseAddress(item: NominatimResult): string {
    const address = item.address || {};
    const parts: string[] = [];

    // Add house number and road
    if (address.house_number && address.road) {
      parts.push(`${address.house_number} ${address.road}`);
    } else if (address.road) {
      parts.push(address.road);
    }

    // Add district/suburb
    if (address.city_district) {
      parts.push(address.city_district);
    } else if (address.suburb) {
      parts.push(address.suburb);
    } // Add city
    if (address.city || address.town || address.village) {
      const cityName = address.city || address.town || address.village;
      if (cityName) {
        parts.push(cityName);
      }
    }

    // Add state if different from city
    if (address.state && address.state !== (address.city || address.town)) {
      parts.push(address.state);
    }

    return parts.length > 0 ? parts.join(", ") : item.display_name;
  }

  // Remove Vietnamese accents for better search
  private removeVietnameseAccents(str: string): string {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
  }

  // Reverse geocoding - get address from coordinates
  async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lon: lng.toString(),
        format: "json",
        addressdetails: "1",
        "accept-language": "vi,en",
      });

      const response = await fetch(`${this.baseUrl}/reverse?${params}`);

      if (!response.ok) {
        throw new Error("Reverse geocoding failed");
      }

      const data = await response.json();
      return this.formatVietnameseAddress(data);
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }

  // Get Vietnam bounds for map initialization
  getVietnamBounds() {
    return {
      north: 23.393395,
      south: 8.560699,
      east: 109.464638,
      west: 102.144847,
    };
  }

  // Get default center (Vietnam center)
  getDefaultCenter(): LatLng {
    return { lat: 16.0, lng: 107.0 };
  }
  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get current GPS location
  async getCurrentLocation(
    options?: PositionOptions
  ): Promise<GeolocationResult> {
    return new Promise((resolve) => {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        resolve({
          success: false,
          error: "Geolocation is not supported by this browser",
          errorCode: GeolocationErrorCode.NOT_SUPPORTED,
        });
        return;
      }

      const defaultOptions: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds
        maximumAge: 300000, // 5 minutes
      };

      const finalOptions = { ...defaultOptions, ...options };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = position.coords;
          const latLng: LatLng = {
            lat: coords.latitude,
            lng: coords.longitude,
          };

          try {
            // Get address from coordinates
            const address = await this.reverseGeocode(
              coords.latitude,
              coords.longitude
            );

            resolve({
              success: true,
              position: latLng,
              address: address,
            });
          } catch {
            // Even if reverse geocoding fails, we still have coordinates
            resolve({
              success: true,
              position: latLng,
              address: `${coords.latitude.toFixed(
                6
              )}, ${coords.longitude.toFixed(6)}`,
            });
          }
        },
        (error) => {
          let errorMessage: string;
          let errorCode: GeolocationErrorCode;

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied by user";
              errorCode = GeolocationErrorCode.PERMISSION_DENIED;
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable";
              errorCode = GeolocationErrorCode.POSITION_UNAVAILABLE;
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out";
              errorCode = GeolocationErrorCode.TIMEOUT;
              break;
            default:
              errorMessage = "An unknown error occurred";
              errorCode = GeolocationErrorCode.POSITION_UNAVAILABLE;
              break;
          }

          resolve({
            success: false,
            error: errorMessage,
            errorCode: errorCode,
          });
        },
        finalOptions
      );
    });
  }

  // Watch user position (for real-time tracking)
  watchPosition(
    onSuccess: (result: GeolocationResult) => void,
    onError: (result: GeolocationResult) => void,
    options?: PositionOptions
  ): number | null {
    if (!navigator.geolocation) {
      onError({
        success: false,
        error: "Geolocation is not supported by this browser",
        errorCode: GeolocationErrorCode.NOT_SUPPORTED,
      });
      return null;
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000, // 1 minute
    };

    const finalOptions = { ...defaultOptions, ...options };

    return navigator.geolocation.watchPosition(
      async (position) => {
        const coords = position.coords;
        const latLng: LatLng = {
          lat: coords.latitude,
          lng: coords.longitude,
        };

        try {
          const address = await this.reverseGeocode(
            coords.latitude,
            coords.longitude
          );

          onSuccess({
            success: true,
            position: latLng,
            address: address,
          });
        } catch {
          onSuccess({
            success: true,
            position: latLng,
            address: `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(
              6
            )}`,
          });
        }
      },
      (error) => {
        let errorMessage: string;
        let errorCode: GeolocationErrorCode;

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user";
            errorCode = GeolocationErrorCode.PERMISSION_DENIED;
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable";
            errorCode = GeolocationErrorCode.POSITION_UNAVAILABLE;
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            errorCode = GeolocationErrorCode.TIMEOUT;
            break;
          default:
            errorMessage = "An unknown error occurred";
            errorCode = GeolocationErrorCode.POSITION_UNAVAILABLE;
            break;
        }

        onError({
          success: false,
          error: errorMessage,
          errorCode: errorCode,
        });
      },
      finalOptions
    );
  }

  // Stop watching position
  clearWatch(watchId: number): void {
    if (navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  }

  // Check if geolocation is available
  isGeolocationAvailable(): boolean {
    return "geolocation" in navigator;
  }

  // Request location permission (returns promise)
  async requestLocationPermission(): Promise<PermissionState> {
    if (!navigator.permissions) {
      // Fallback for browsers without permissions API
      try {
        await this.getCurrentLocation({ timeout: 1000 });
        return "granted";
      } catch {
        return "denied";
      }
    }

    try {
      const result = await navigator.permissions.query({ name: "geolocation" });
      return result.state;
    } catch (error) {
      console.error("Error checking geolocation permission:", error);
      return "prompt";
    }
  }
}

export const locationService = new LocationService();
