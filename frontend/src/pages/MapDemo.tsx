import React, { useState } from "react";
import LocationInput from "../components/LocationInput";
import LocationMap from "../components/LocationMap";
import type { LocationSuggestion, LatLng } from "../services/locationService";

const MapDemo: React.FC = () => {
  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<LatLng | null>(null);
  const [mapCenter, setMapCenter] = useState<LatLng>({ lat: 16.0, lng: 107.0 }); // Vietnam center

  const handleLocationSelect = (location: LocationSuggestion) => {
    const latLng = { lat: location.lat, lng: location.lon };
    setSelectedLocation(latLng);
    setMapCenter(latLng);
    setSelectedAddress(location.display_name);
  };

  const handleMapClick = (latLng: LatLng) => {
    setSelectedLocation(latLng);
    setMapCenter(latLng);
  };

  const handleLocationChange = (address: string, latLng: LatLng) => {
    setSelectedAddress(address);
    setSelectedLocation(latLng);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🇻🇳 Vietnam Map Demo - HomeEasy
            </h1>
            <p className="text-gray-600">
              Demo tính năng bản đồ và tìm kiếm địa điểm cho ứng dụng HomeEasy
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Location Search */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Tìm Kiếm Địa Điểm
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nhập địa chỉ tại Việt Nam:
                </label>
                <LocationInput
                  value={selectedAddress}
                  onChange={setSelectedAddress}
                  onLocationSelect={handleLocationSelect}
                  placeholder="Tìm kiếm Hà Nội, TP.HCM, Đà Nẵng..."
                />
              </div>

              {selectedLocation && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">
                    Vị trí đã chọn:
                  </h3>
                  <p className="text-blue-800 text-sm mb-1">
                    <strong>Địa chỉ:</strong> {selectedAddress}
                  </p>
                  <p className="text-blue-800 text-sm">
                    <strong>Tọa độ:</strong> {selectedLocation.lat.toFixed(6)},{" "}
                    {selectedLocation.lng.toFixed(6)}
                  </p>
                </div>
              )}

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">Tính năng:</h3>
                <ul className="text-green-800 text-sm space-y-1">
                  <li>✅ Tìm kiếm địa điểm thông minh</li>
                  <li>✅ Gợi ý các thành phố lớn</li>
                  <li>✅ Hỗ trợ tiếng Việt có dấu</li>
                  <li>✅ Tìm kiếm không dấu</li>
                  <li>✅ Hiển thị bản đồ tương tác</li>
                  <li>✅ Click để chọn vị trí</li>
                  <li>✅ Geocoding ngược (tọa độ → địa chỉ)</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-medium text-yellow-900 mb-2">
                  Thử nghiệm:
                </h3>
                <div className="space-y-2 text-sm">
                  <button
                    onClick={() =>
                      handleLocationSelect({
                        id: "hanoi",
                        display_name: "Hà Nội",
                        lat: 21.0285,
                        lon: 105.8542,
                        type: "city",
                        address: { city: "Hà Nội", country: "Việt Nam" },
                      })
                    }
                    className="bg-yellow-100 hover:bg-yellow-200 px-3 py-1 rounded text-yellow-800 mr-2"
                  >
                    Hà Nội
                  </button>
                  <button
                    onClick={() =>
                      handleLocationSelect({
                        id: "hcm",
                        display_name: "Thành phố Hồ Chí Minh",
                        lat: 10.8231,
                        lon: 106.6297,
                        type: "city",
                        address: { city: "TP.HCM", country: "Việt Nam" },
                      })
                    }
                    className="bg-yellow-100 hover:bg-yellow-200 px-3 py-1 rounded text-yellow-800 mr-2"
                  >
                    TP.HCM
                  </button>
                  <button
                    onClick={() =>
                      handleLocationSelect({
                        id: "danang",
                        display_name: "Đà Nẵng",
                        lat: 16.0471,
                        lon: 108.2068,
                        type: "city",
                        address: { city: "Đà Nẵng", country: "Việt Nam" },
                      })
                    }
                    className="bg-yellow-100 hover:bg-yellow-200 px-3 py-1 rounded text-yellow-800"
                  >
                    Đà Nẵng
                  </button>
                </div>
              </div>
            </div>

            {/* Map Display */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Bản Đồ Việt Nam
              </h2>

              <LocationMap
                center={mapCenter}
                zoom={selectedLocation ? 12 : 6}
                markers={
                  selectedLocation
                    ? [
                        {
                          position: selectedLocation,
                          popup: selectedAddress || "Vị trí được chọn",
                          title: "Nhiệm vụ tại đây",
                        },
                      ]
                    : []
                }
                onClick={handleMapClick}
                onLocationChange={handleLocationChange}
                height="400px"
                className="border-2 border-gray-200 rounded-lg"
              />

              <p className="text-sm text-gray-600">
                💡 <strong>Hướng dẫn:</strong> Nhấp vào bản đồ để chọn vị trí
                mới
              </p>
            </div>
          </div>

          {/* Popular Locations */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Địa Điểm Phổ Biến tại Việt Nam
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { name: "Hà Nội", lat: 21.0285, lng: 105.8542 },
                { name: "TP.HCM", lat: 10.8231, lng: 106.6297 },
                { name: "Đà Nẵng", lat: 16.0471, lng: 108.2068 },
                { name: "Hải Phòng", lat: 20.8449, lng: 106.6881 },
                { name: "Cần Thơ", lat: 10.0452, lng: 105.7469 },
                { name: "Huế", lat: 16.4637, lng: 107.5909 },
                { name: "Nha Trang", lat: 12.2388, lng: 109.1967 },
                { name: "Vũng Tàu", lat: 10.4113, lng: 107.1365 },
                { name: "Đà Lạt", lat: 11.9404, lng: 108.4583 },
                { name: "Quy Nhon", lat: 13.7563, lng: 109.2297 },
              ].map((city) => (
                <button
                  key={city.name}
                  onClick={() =>
                    handleLocationSelect({
                      id: city.name,
                      display_name: city.name,
                      lat: city.lat,
                      lon: city.lng,
                      type: "city",
                      address: { city: city.name, country: "Việt Nam" },
                    })
                  }
                  className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg p-3 text-indigo-800 font-medium text-sm transition-colors"
                >
                  {city.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapDemo;
