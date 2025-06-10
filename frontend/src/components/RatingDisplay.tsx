import React from "react";
import { Star, User } from "lucide-react";
import type { Review } from "../../../shared/types";

interface RatingDisplayProps {
  reviews: Review[];
  showAll?: boolean;
  maxToShow?: number;
}

// Helper interfaces for populated data
interface PopulatedReviewer {
  firstName: string;
  lastName: string;
}

interface PopulatedTask {
  title: string;
}

const RatingDisplay: React.FC<RatingDisplayProps> = ({
  reviews,
  showAll = false,
  maxToShow = 5,
}) => {
  const displayedReviews = showAll ? reviews : reviews.slice(0, maxToShow);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };
  const getReviewerName = (review: Review): string => {
    if (typeof review.reviewerId === "string") {
      return "Anonymous Reviewer";
    }
    const reviewer = review.reviewerId as PopulatedReviewer;
    return `${reviewer.firstName} ${reviewer.lastName}`;
  };

  const getTaskTitle = (review: Review): string => {
    if (typeof review.taskId === "string") {
      return "Task Review";
    }
    const task = review.taskId as PopulatedTask;
    return task.title || "Task Review";
  };

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="flex flex-col items-center">
          <Star className="h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg font-medium">No reviews yet</p>
          <p className="text-gray-400 text-sm">
            Reviews will appear here after completing tasks
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayedReviews.map((review) => (
        <div
          key={review._id}
          className="border border-gray-200 rounded-lg p-6 bg-white hover:shadow-md transition-shadow"
        >
          {/* Review Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <div className="font-medium text-gray-900">
                  {getReviewerName(review)}
                </div>
                <div className="text-sm text-gray-500 mb-1">
                  For: {getTaskTitle(review)}
                </div>
                {renderStars(review.rating)}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {formatDate(review.createdAt.toString())}
            </div>
          </div>

          {/* Review Content */}
          <div className="mb-4">
            <p className="text-gray-700 leading-relaxed">{review.comment}</p>
          </div>

          {/* Rating Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm text-gray-500">Rating:</span>
              <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                {review.rating}/5 stars
              </span>
            </div>
          </div>
        </div>
      ))}

      {/* Show More Button */}
      {!showAll && reviews.length > maxToShow && (
        <div className="text-center pt-4">
          <p className="text-gray-500 text-sm">
            Showing {maxToShow} of {reviews.length} reviews
          </p>
        </div>
      )}
    </div>
  );
};

export default RatingDisplay;
