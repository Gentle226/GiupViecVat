import React, { useState } from "react";
import { Star, X, User } from "lucide-react";
import { reviewsAPI } from "../services/api";
import type { Task } from "../../../shared/types";

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  revieweeId: string;
  revieweeName: string;
  onReviewSubmitted?: () => void;
}

const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  task,
  revieweeId,
  revieweeName,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      alert("Please select a rating");
      return;
    }

    if (!comment.trim()) {
      alert("Please add a comment");
      return;
    }

    try {
      setSubmitting(true);

      await reviewsAPI.createReview({
        taskId: task._id,
        rating,
        comment: comment.trim(),
        revieweeId,
      });

      alert("Review submitted successfully!");

      // Reset form
      setRating(0);
      setComment("");

      // Call callback if provided
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
      onClose();
    } catch (error: unknown) {
      console.error("Error submitting review:", error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: {
            status?: number;
            data?: { message?: string };
          };
        };
        if (axiosError.response?.status === 400) {
          alert(axiosError.response?.data?.message || "Invalid review data");
        } else if (axiosError.response?.status === 403) {
          alert("You are not authorized to review this task");
        } else {
          alert("Failed to submit review. Please try again.");
        }
      } else {
        alert("Failed to submit review. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  const handleStarHover = (starRating: number) => {
    setHoveredRating(starRating);
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= (hoveredRating || rating);
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => handleStarClick(i)}
          onMouseEnter={() => handleStarHover(i)}
          onMouseLeave={handleStarLeave}
          className={`p-1 transition-colors ${
            isFilled ? "text-yellow-400" : "text-gray-300"
          } hover:text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 rounded`}
        >
          <Star className={`h-8 w-8 ${isFilled ? "fill-current" : ""}`} />
        </button>
      );
    }
    return stars;
  };

  const getRatingText = (ratingValue: number) => {
    switch (ratingValue) {
      case 1:
        return "Poor";
      case 2:
        return "Fair";
      case 3:
        return "Good";
      case 4:
        return "Very Good";
      case 5:
        return "Excellent";
      default:
        return "Rate your experience";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            Rate Your Experience
          </h3>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Task Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
          <div className="flex items-center text-sm text-gray-600">
            <User className="h-4 w-4 mr-2" />
            <span>Rating: {revieweeName}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Star Rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How would you rate this experience?
            </label>
            <div className="flex items-center justify-center mb-2">
              {renderStars()}
            </div>
            <p className="text-center text-sm text-gray-600">
              {getRatingText(hoveredRating || rating)}
            </p>
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label
              htmlFor="review-comment"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Share your experience
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Tell others about your experience with this task..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {comment.length}/500 characters
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RatingModal;
