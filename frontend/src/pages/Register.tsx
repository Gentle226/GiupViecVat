import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import LocationInput from "../components/LocationInput";
import Logo from "../components/Logo";
import type { LocationSuggestion } from "../services/locationService";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle,
  DollarSign,
} from "lucide-react";

const Register: React.FC = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    isTasker: false,
    location: {
      address: "",
      coordinates: [0, 0] as [number, number],
    },
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const { register, isAuthenticated, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "isTasker") {
      setFormData((prev) => ({
        ...prev,
        isTasker: value === "true",
      }));
    } else if (name === "address") {
      setFormData((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          address: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleLocationSelect = (location: LocationSuggestion) => {
    setFormData((prev) => ({
      ...prev,
      location: {
        address: location.display_name,
        coordinates: [location.lon, location.lat] as [number, number],
      },
    }));
  };
  const validatePassword = (password: string, confirmPassword: string) => {
    if (password.length < 6) {
      setPasswordError(t("auth.register.passwordTooShort"));
      return false;
    }
    if (password !== confirmPassword) {
      setPasswordError(t("auth.register.passwordMismatch"));
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword(formData.password, formData.confirmPassword)) {
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
    } catch (error) {
      // Error is handled by the auth context
      console.error("Registration error:", error);
    }
  };

  const isFormValid = () => {
    return (
      formData.firstName &&
      formData.lastName &&
      formData.email &&
      formData.password &&
      formData.confirmPassword &&
      formData.location.address &&
      !passwordError
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {" "}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          {/* Logo component */}
          <div className="flex justify-center mb-4">
            <Logo size="large" />
          </div>{" "}
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {t("auth.register.title")}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t("auth.register.haveAccount")}{" "}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              {t("auth.register.signInHere")}
            </Link>
          </p>
        </div>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {" "}
            {/* Role Selection */}
            <div>
              {" "}
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t("auth.register.mainGoal")} *
              </label>{" "}
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`relative cursor-pointer rounded-lg border-2 p-4 focus:outline-none ${
                    !formData.isTasker
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 bg-white hover:bg-gray-50"
                  }`}
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, isTasker: false }))
                  }
                >
                  <div className="flex flex-col items-center text-center">
                    <CheckCircle className="h-8 w-8 text-blue-600 mb-2" />{" "}
                    <div className="text-sm font-medium text-gray-900 whitespace-nowrap">
                      {t("auth.register.getThingsDone")}
                    </div>
                    <div className="text-xs text-gray-500">
                      {t("auth.register.client")}
                    </div>
                    <div
                      className={`mt-3 h-4 w-4 rounded-full border-2 ${
                        !formData.isTasker
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300"
                      }`}
                    >
                      {!formData.isTasker && (
                        <div className="h-2 w-2 rounded-full bg-white m-0.5" />
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className={`relative cursor-pointer rounded-lg border-2 p-4 focus:outline-none ${
                    formData.isTasker
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 bg-white hover:bg-gray-50"
                  }`}
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, isTasker: true }))
                  }
                >
                  <div className="flex flex-col items-center text-center">
                    <DollarSign className="h-8 w-8 text-green-600 mb-2" />{" "}
                    <div className="text-sm font-medium text-gray-900 whitespace-nowrap">
                      {t("auth.register.earnMoney")}
                    </div>
                    <div className="text-xs text-gray-500">
                      {t("auth.register.tasker")}
                    </div>
                    <div
                      className={`mt-3 h-4 w-4 rounded-full border-2 ${
                        formData.isTasker
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300"
                      }`}
                    >
                      {formData.isTasker && (
                        <div className="h-2 w-2 rounded-full bg-white m-0.5" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                {" "}
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t("auth.register.firstName")}
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder={t("auth.register.firstNamePlaceholder")}
                    value={formData.firstName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                {" "}
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t("auth.register.lastName")}
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={t("auth.register.lastNamePlaceholder")}
                  value={formData.lastName}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            {/* Email */}
            <div>
              {" "}
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                {t("auth.register.email")}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={t("auth.register.emailPlaceholder")}
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
            </div>{" "}
            {/* Address */}
            <div>
              {" "}
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("auth.register.address")}
              </label>
              <LocationInput
                value={formData.location.address}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    location: { ...prev.location, address: value },
                  }))
                }
                onLocationSelect={handleLocationSelect}
                placeholder={t("auth.register.addressPlaceholder")}
                className="border-gray-300"
              />
              <p className="mt-1 text-xs text-gray-500">
                {t("auth.register.addressHelp")}
              </p>
            </div>
            {/* Password */}
            <div>
              {" "}
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                {t("auth.register.password")}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={t("auth.register.passwordPlaceholder")}
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            {/* Confirm Password */}
            <div>
              {" "}
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                {t("auth.register.confirmPassword")}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={t("auth.register.confirmPasswordPlaceholder")}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  onBlur={() =>
                    validatePassword(
                      formData.password,
                      formData.confirmPassword
                    )
                  }
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="mt-1 text-sm text-red-600">{passwordError}</p>
              )}
            </div>
            <div>
              <button
                type="submit"
                disabled={isLoading || !isFormValid()}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {" "}
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  t("auth.register.createAccount")
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
