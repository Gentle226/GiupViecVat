import React, { useState, useRef } from "react";
import { Send, Image as ImageIcon, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface MessageInputProps {
  onSendMessage: (content: string, images: File[]) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "Type a message...",
}) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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

    const totalImages = selectedImages.length + newFiles.length;
    if (totalImages > 3) {
      alert(t("imageUpload.tooManyImages", { max: 3 }));
      return;
    }

    const updatedImages = [...selectedImages, ...newFiles];
    setSelectedImages(updatedImages);

    // Generate previews
    const newPreviews: string[] = [];
    updatedImages.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newPreviews.push(e.target.result as string);
          if (newPreviews.length === updatedImages.length) {
            setImagePreviews([...newPreviews]);
          }
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((!message.trim() && selectedImages.length === 0) || sending) return;

    try {
      setSending(true);
      await onSendMessage(message.trim(), selectedImages);
      setMessage("");
      setSelectedImages([]);
      setImagePreviews([]);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t bg-white p-4">
      {/* Image Previews */}
      {imagePreviews.length > 0 && (
        <div className="mb-3 flex gap-2 flex-wrap">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="relative group">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-16 h-16 object-cover rounded-lg border"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || sending}
            rows={1}
            className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            style={{
              minHeight: "44px",
              maxHeight: "120px",
              height: "auto",
            }}
          />

          {/* Image Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || sending || selectedImages.length >= 3}
            className={`absolute right-2 bottom-2 p-1 rounded transition-colors ${
              selectedImages.length >= 3
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-500 hover:text-blue-500"
            }`}
          >
            <ImageIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={
            (!message.trim() && selectedImages.length === 0) ||
            disabled ||
            sending
          }
          className={`p-2 rounded-lg transition-colors ${
            (!message.trim() && selectedImages.length === 0) ||
            disabled ||
            sending
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          <Send className="h-5 w-5" />
        </button>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
      </form>
    </div>
  );
};

export default MessageInput;
