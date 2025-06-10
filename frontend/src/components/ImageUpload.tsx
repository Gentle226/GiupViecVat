import React, { useState, useRef, useCallback } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ImageUploadProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
  maxImages?: number;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onImagesChange,
  maxImages = 5,
  className = "",
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  // Update previews when images change
  React.useEffect(() => {
    const newPreviews: string[] = [];
    images.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            newPreviews.push(e.target.result as string);
            if (newPreviews.length === images.length) {
              setPreviews([...newPreviews]);
            }
          }
        };
        reader.readAsDataURL(file);
      }
    });

    // Clean up if no images
    if (images.length === 0) {
      setPreviews([]);
    }
  }, [images]);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files) return;

      const newFiles = Array.from(files).filter((file) => {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          alert(t("imageUpload.invalidFileType"));
          return false;
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          alert(t("imageUpload.fileTooLarge"));
          return false;
        }

        return true;
      });

      const totalImages = images.length + newFiles.length;
      if (totalImages > maxImages) {
        alert(t("imageUpload.tooManyImages", { max: maxImages }));
        return;
      }

      onImagesChange([...images, ...newFiles]);

      // Reset input value to allow same file selection
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [images, onImagesChange, maxImages, t]
  );

  const removeImage = useCallback(
    (index: number) => {
      const newImages = images.filter((_, i) => i !== index);
      onImagesChange(newImages);
    },
    [images, onImagesChange]
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Button */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={images.length >= maxImages}
          className={`
            flex items-center gap-2 px-4 py-2 border rounded-md transition-colors
            ${
              images.length >= maxImages
                ? "border-gray-300 text-gray-400 cursor-not-allowed"
                : "border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            }
          `}
        >
          <Upload className="h-4 w-4" />
          {t("imageUpload.selectImages")}
        </button>

        <span className="text-sm text-gray-500">
          {t("imageUpload.imageCount", {
            current: images.length,
            max: maxImages,
          })}
        </span>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Image Previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Zone (when no images) */}
      {images.length === 0 && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
        >
          <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">{t("imageUpload.dropZoneText")}</p>
          <p className="text-sm text-gray-500">
            {t("imageUpload.fileRequirements")}
          </p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
