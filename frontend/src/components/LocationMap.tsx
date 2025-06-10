import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { locationService } from "../services/locationService";
import type { LatLng } from "../services/locationService";

// Fix for default markers in Leaflet with Webpack
delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface LocationMapProps {
  center?: LatLng;
  zoom?: number;
  markers?: Array<{
    position: LatLng;
    popup?: string;
    title?: string;
  }>;
  onClick?: (latLng: LatLng) => void;
  onLocationChange?: (address: string, latLng: LatLng) => void;
  className?: string;
  height?: string;
  interactive?: boolean;
}

const LocationMap: React.FC<LocationMapProps> = ({
  center,
  zoom = 10,
  markers = [],
  onClick,
  onLocationChange,
  className = "",
  height = "400px",
  interactive = true,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    const defaultCenter = center || locationService.getDefaultCenter();

    // Create map instance
    const map = L.map(mapRef.current, {
      center: [defaultCenter.lat, defaultCenter.lng],
      zoom: zoom,
      zoomControl: interactive,
      dragging: interactive,
      touchZoom: interactive,
      doubleClickZoom: interactive,
      scrollWheelZoom: interactive,
      boxZoom: interactive,
      keyboard: interactive,
    });

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    // Add click handler
    if (interactive && onClick) {
      map.on("click", async (e: L.LeafletMouseEvent) => {
        const latLng = { lat: e.latlng.lat, lng: e.latlng.lng };
        onClick(latLng);

        // Optionally get address and call onLocationChange
        if (onLocationChange) {
          try {
            const address = await locationService.reverseGeocode(
              latLng.lat,
              latLng.lng
            );
            onLocationChange(address, latLng);
          } catch (error) {
            console.error("Error getting address:", error);
          }
        }
      });
    }

    mapInstanceRef.current = map; // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Update center
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView([center.lat, center.lng], zoom);
    }
  }, [center, zoom]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      mapInstanceRef.current?.removeLayer(marker);
    });
    markersRef.current = [];

    // Add new markers
    markers.forEach((markerData) => {
      if (mapInstanceRef.current) {
        const marker = L.marker([
          markerData.position.lat,
          markerData.position.lng,
        ]).addTo(mapInstanceRef.current);

        if (markerData.popup) {
          marker.bindPopup(markerData.popup);
        }

        if (markerData.title) {
          marker.bindTooltip(markerData.title);
        }

        markersRef.current.push(marker);
      }
    });

    // Fit bounds if multiple markers
    if (markers.length > 1 && mapInstanceRef.current) {
      const group = new L.FeatureGroup(markersRef.current);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [markers]);

  return (
    <div className={`relative ${className}`}>
      <div
        ref={mapRef}
        style={{ height }}
        className="w-full rounded-lg border border-gray-300"
      />

      {/* Vietnam bounds helper */}
      {interactive && (
        <div className="absolute top-2 right-2 z-[1000]">
          <button
            onClick={() => {
              if (mapInstanceRef.current) {
                const bounds = locationService.getVietnamBounds();
                mapInstanceRef.current.fitBounds([
                  [bounds.south, bounds.west],
                  [bounds.north, bounds.east],
                ]);
              }
            }}
            className="bg-white border border-gray-300 rounded px-2 py-1 text-xs shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Zoom to Vietnam"
          >
            🇻🇳 Việt Nam
          </button>
        </div>
      )}

      {/* Instructions for interactive map */}
      {interactive && onClick && (
        <div className="absolute bottom-2 left-2 z-[1000]">
          <div className="bg-white bg-opacity-90 border border-gray-300 rounded px-2 py-1 text-xs text-gray-600">
            Nhấp vào bản đồ để chọn vị trí
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationMap;
