import React from "react";
// Import your logo
import logoImage from "../assets/logo.png";

interface LogoProps {
  size?: "small" | "medium" | "large";
  className?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({
  size = "medium",
  className = "",
  showText = true,
}) => {
  const sizeClasses = {
    small: "h-6 w-6",
    medium: "h-8 w-8",
    large: "h-12 w-12",
  };

  const textSizeClasses = {
    small: "text-lg",
    medium: "text-xl",
    large: "text-3xl",
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Custom logo image */}
      <img src={logoImage} alt="HomeEasy" className={sizeClasses[size]} />

      {showText && (
        <span className={`font-bold text-gray-900 ${textSizeClasses[size]}`}>
          HomeEasy
        </span>
      )}
    </div>
  );
};

export default Logo;
