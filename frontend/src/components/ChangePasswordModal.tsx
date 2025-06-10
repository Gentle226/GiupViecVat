import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Eye, EyeOff, Lock, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { changePassword } = useAuth();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const getPasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score < 3)
      return { level: "weak", color: "red", text: t("changePassword.weak") };
    if (score < 5)
      return {
        level: "medium",
        color: "yellow",
        text: t("changePassword.medium"),
      };
    return {
      level: "strong",
      color: "green",
      text: t("changePassword.strong"),
    };
  };

  const passwordStrength = formData.newPassword
    ? getPasswordStrength(formData.newPassword)
    : null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };
  const validateForm = () => {
    if (!formData.currentPassword) {
      setError(t("changePassword.currentPasswordRequired"));
      return false;
    }
    if (!formData.newPassword) {
      setError(t("changePassword.newPasswordRequired"));
      return false;
    }
    if (formData.newPassword.length < 6) {
      setError(t("changePassword.newPasswordTooShort"));
      return false;
    }
    const strength = getPasswordStrength(formData.newPassword);
    if (strength.level === "weak") {
      setError(t("changePassword.chooseStrongerPassword"));
      return false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError(t("changePassword.passwordsMismatch"));
      return false;
    }
    if (formData.currentPassword === formData.newPassword) {
      setError(t("changePassword.newPasswordMustBeDifferent"));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setLoading(true);
    try {
      await changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      setSuccess(true);
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      // Close modal after 2 seconds
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err: unknown) {
      const error = err as {
        message?: string;
        response?: { data?: { message?: string } };
      };
      setError(error.message || t("changePassword.failedToChangePassword"));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setError("");
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        {" "}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {t("changePassword.title")}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>{" "}
        {success ? (
          <div className="text-center py-4">
            <div className="text-green-600 text-lg font-semibold mb-2">
              {t("changePassword.passwordChangedSuccessfully")}
            </div>
            <p className="text-gray-600">
              {t("changePassword.passwordUpdatedMessage")}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}{" "}
            {/* Current Password */}
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("changePassword.currentPassword")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  required
                  className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={t("changePassword.currentPasswordPlaceholder")}
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => togglePasswordVisibility("current")}
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>{" "}
            {/* New Password */}
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("changePassword.newPassword")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  required
                  className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={t("changePassword.newPasswordPlaceholder")}
                  value={formData.newPassword}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => togglePasswordVisibility("new")}
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>{" "}
              {/* Password Strength Indicator */}
              {formData.newPassword && passwordStrength && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {t("changePassword.passwordStrength")}
                    </span>
                    <span
                      className={`font-medium ${
                        passwordStrength.color === "red"
                          ? "text-red-600"
                          : passwordStrength.color === "yellow"
                          ? "text-yellow-600"
                          : "text-green-600"
                      }`}
                    >
                      {passwordStrength.text}
                    </span>
                  </div>
                  <div className="mt-1 h-2 bg-gray-200 rounded-full">
                    <div
                      className={`h-full rounded-full transition-all ${
                        passwordStrength.color === "red"
                          ? "bg-red-500 w-1/3"
                          : passwordStrength.color === "yellow"
                          ? "bg-yellow-500 w-2/3"
                          : "bg-green-500 w-full"
                      }`}
                    />
                  </div>{" "}
                  {/* Password Requirements */}
                  <div className="mt-2 text-xs text-gray-500">
                    {t("changePassword.passwordRequirements")}
                    <ul className="mt-1 space-y-1">
                      <li
                        className={`${
                          formData.newPassword.length >= 6
                            ? "text-green-600"
                            : "text-gray-500"
                        }`}
                      >
                        {t("changePassword.atLeast6Characters")}
                      </li>
                      <li
                        className={`${
                          /[A-Z]/.test(formData.newPassword)
                            ? "text-green-600"
                            : "text-gray-500"
                        }`}
                      >
                        {t("changePassword.oneUppercase")}
                      </li>
                      <li
                        className={`${
                          /[a-z]/.test(formData.newPassword)
                            ? "text-green-600"
                            : "text-gray-500"
                        }`}
                      >
                        {t("changePassword.oneLowercase")}
                      </li>
                      <li
                        className={`${
                          /[0-9]/.test(formData.newPassword)
                            ? "text-green-600"
                            : "text-gray-500"
                        }`}
                      >
                        {t("changePassword.oneNumber")}
                      </li>
                      <li
                        className={`${
                          /[^A-Za-z0-9]/.test(formData.newPassword)
                            ? "text-green-600"
                            : "text-gray-500"
                        }`}
                      >
                        {t("changePassword.oneSpecialCharacter")}
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>{" "}
            {/* Confirm New Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("changePassword.confirmNewPassword")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  required
                  className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={t("changePassword.confirmPasswordPlaceholder")}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => togglePasswordVisibility("confirm")}
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            {/* Buttons */}
            <div className="flex space-x-3 pt-4">
              {" "}
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                {t("changePassword.cancel")}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  </div>
                ) : (
                  t("changePassword.changePassword")
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordModal;
