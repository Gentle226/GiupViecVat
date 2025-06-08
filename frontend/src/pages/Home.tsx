import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import {
  Search,
  Clock,
  Shield,
  Star,
  Users,
  MapPin,
  MessageCircle,
} from "lucide-react";

const Home: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const features = [
    {
      icon: Search,
      title: t("home.features.easyPosting.title"),
      description: t("home.features.easyPosting.description"),
    },
    {
      icon: Users,
      title: t("home.features.skilledTaskers.title"),
      description: t("home.features.skilledTaskers.description"),
    },
    {
      icon: MessageCircle,
      title: t("home.features.realTimeChat.title"),
      description: t("home.features.realTimeChat.description"),
    },
    {
      icon: Shield,
      title: t("home.features.securePayments.title"),
      description: t("home.features.securePayments.description"),
    },
    {
      icon: Star,
      title: t("home.features.ratingSystem.title"),
      description: t("home.features.ratingSystem.description"),
    },
    {
      icon: MapPin,
      title: t("home.features.locationBased.title"),
      description: t("home.features.locationBased.description"),
    },
  ];

  const categories = [
    t("home.categories.homeCleaning"),
    t("home.categories.handyman"),
    t("home.categories.movingDelivery"),
    t("home.categories.gardening"),
    t("home.categories.petCare"),
    t("home.categories.techSupport"),
    t("home.categories.tutoring"),
    t("home.categories.photography"),
  ];

  const stats = [
    { number: "50K+", label: t("home.stats.tasksCompleted") },
    { number: "25K+", label: t("home.stats.happyCustomers") },
    { number: "10K+", label: t("home.stats.skilledTaskers") },
    { number: "4.8/5", label: t("home.stats.averageRating") },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {" "}
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {t("home.title")}{" "}
              <span className="text-blue-200">{t("home.brandName")}</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              {t("home.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {" "}
              {isAuthenticated ? (
                <>
                  {" "}
                  <Link
                    to="/tasks"
                    className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    {t("home.findTasks")}
                  </Link>
                  <Link
                    to="/post-task"
                    className="bg-blue-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-400 border-2 border-blue-400 transition-colors inline-flex items-center justify-center"
                  >
                    <Clock className="w-5 h-5 mr-2" />
                    {t("home.postTask")}
                  </Link>
                </>
              ) : (
                <>
                  {" "}
                  <Link
                    to="/register"
                    className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
                  >
                    {t("home.signUp")}
                  </Link>{" "}
                  <Link
                    to="/tasks"
                    className="bg-blue-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-400 border-2 border-blue-400 transition-colors inline-flex items-center justify-center"
                  >
                    {t("home.findTasks")}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 text-sm md:text-base">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {" "}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t("home.featuresSection.title")}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t("home.featuresSection.subtitle")}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-sm border hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {" "}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t("home.categoriesSection.title")}
            </h2>
            <p className="text-xl text-gray-600">
              {t("home.categoriesSection.subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category, index) => (
              <Link
                key={index}
                to={`/tasks?category=${category
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
                className="bg-white p-6 rounded-lg text-center hover:shadow-md transition-shadow border"
              >
                <div className="text-lg font-semibold text-gray-900">
                  {category}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {" "}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t("home.howItWorks.title")}
            </h2>
            <p className="text-xl text-gray-600">
              {t("home.howItWorks.subtitle")}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {" "}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t("home.howItWorks.steps.postTask.title")}
              </h3>
              <p className="text-gray-600">
                {t("home.howItWorks.steps.postTask.description")}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t("home.howItWorks.steps.chooseTasker.title")}
              </h3>
              <p className="text-gray-600">
                {t("home.howItWorks.steps.chooseTasker.description")}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t("home.howItWorks.steps.getItDone.title")}
              </h3>
              <p className="text-gray-600">
                {t("home.howItWorks.steps.getItDone.description")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        {" "}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t("home.cta.title")}
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            {t("home.cta.subtitle")}
          </p>
          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors"
              >
                {t("home.cta.signUpNow")}
              </Link>
              <Link
                to="/login"
                className="bg-blue-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-400 border-2 border-blue-400 transition-colors"
              >
                {t("home.cta.alreadyHaveAccount")}
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
