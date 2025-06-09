import React, { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageGalleryProps {
  images: string[];
  className?: string;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  className = "",
}) => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  if (!images || images.length === 0) {
    return null;
  }

  const openModal = (index: number) => {
    setSelectedImage(index);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  const nextImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (selectedImage !== null) {
      setSelectedImage(
        selectedImage === 0 ? images.length - 1 : selectedImage - 1
      );
    }
  };

  const getImageUrl = (imagePath: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    return imagePath.startsWith("http") ? imagePath : `${baseUrl}${imagePath}`;
  };

  return (
    <>
      <div className={`grid gap-3 ${className}`}>
        {images.length === 1 && (
          <div className="w-full">
            <img
              src={getImageUrl(images[0])}
              alt="Task image"
              className="w-full h-64 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => openModal(0)}
            />
          </div>
        )}

        {images.length === 2 && (
          <div className="grid grid-cols-2 gap-3">
            {images.map((image, index) => (
              <img
                key={index}
                src={getImageUrl(image)}
                alt={`Task image ${index + 1}`}
                className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => openModal(index)}
              />
            ))}
          </div>
        )}

        {images.length >= 3 && (
          <div className="grid grid-cols-2 gap-3">
            <img
              src={getImageUrl(images[0])}
              alt="Task image 1"
              className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => openModal(0)}
            />
            <div className="grid grid-rows-2 gap-3">
              <img
                src={getImageUrl(images[1])}
                alt="Task image 2"
                className="w-full h-[calc(6rem-0.375rem)] object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => openModal(1)}
              />
              {images.length > 3 ? (
                <div
                  className="relative w-full h-[calc(6rem-0.375rem)] rounded-lg cursor-pointer overflow-hidden"
                  onClick={() => openModal(2)}
                >
                  <img
                    src={getImageUrl(images[2])}
                    alt="Task image 3"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      +{images.length - 2}
                    </span>
                  </div>
                </div>
              ) : (
                <img
                  src={getImageUrl(images[2])}
                  alt="Task image 3"
                  className="w-full h-[calc(6rem-0.375rem)] object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => openModal(2)}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedImage !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-full p-4">
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 bg-white bg-opacity-20 text-white p-2 rounded-full hover:bg-opacity-30 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Navigation arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white bg-opacity-20 text-white p-2 rounded-full hover:bg-opacity-30 transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white bg-opacity-20 text-white p-2 rounded-full hover:bg-opacity-30 transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Image */}
            <img
              src={getImageUrl(images[selectedImage])}
              alt={`Task image ${selectedImage + 1}`}
              className="max-w-full max-h-full object-contain"
            />

            {/* Image counter */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-20 text-white px-3 py-1 rounded-full">
                {selectedImage + 1} / {images.length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ImageGallery;
