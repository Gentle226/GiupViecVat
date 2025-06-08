import React from "react";
import { Link } from "react-router-dom";
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
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: Search,
      title: "Easy Job Posting",
      description:
        "Post your task in minutes with detailed descriptions and budget requirements.",
    },
    {
      icon: Users,
      title: "Skilled Taskers",
      description:
        "Connect with verified local freelancers with the right skills for your needs.",
    },
    {
      icon: MessageCircle,
      title: "Real-time Chat",
      description:
        "Communicate directly with Taskers through our built-in messaging system.",
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description:
        "Pay safely through GiupViecVat Pay with buyer protection guaranteed.",
    },
    {
      icon: Star,
      title: "Rating System",
      description:
        "Make informed decisions with transparent reviews and ratings.",
    },
    {
      icon: MapPin,
      title: "Location-based",
      description:
        "Find local Taskers in your area for quick and convenient service.",
    },
  ];

  const categories = [
    "Home Cleaning",
    "Handyman",
    "Moving & Delivery",
    "Gardening",
    "Pet Care",
    "Tech Support",
    "Tutoring",
    "Photography",
  ];

  const stats = [
    { number: "50K+", label: "Tasks Completed" },
    { number: "25K+", label: "Happy Customers" },
    { number: "10K+", label: "Skilled Taskers" },
    { number: "4.8/5", label: "Average Rating" },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Get Things Done with{" "}
              <span className="text-blue-200">GiupViecVat</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Connect with local Taskers for all your daily needs. From cleaning
              to repairs, find skilled professionals in your area.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {" "}
              {isAuthenticated ? (
                <>
                  <Link
                    to="/find-tasks"
                    className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    Find Tasks
                  </Link>
                  <Link
                    to="/post-task"
                    className="bg-blue-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-400 border-2 border-blue-400 transition-colors inline-flex items-center justify-center"
                  >
                    <Clock className="w-5 h-5 mr-2" />
                    Post a Task
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
                  >
                    Get Started
                  </Link>
                  <Link
                    to="/find-tasks"
                    className="bg-blue-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-400 border-2 border-blue-400 transition-colors inline-flex items-center justify-center"
                  >
                    Browse Tasks
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
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose GiupViecVat?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We make it easy to connect with local professionals and get your
              tasks completed safely and efficiently.
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
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Popular Categories
            </h2>
            <p className="text-xl text-gray-600">
              Find Taskers for any job category
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
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get your task done in 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Post Your Task
              </h3>
              <p className="text-gray-600">
                Describe what you need done, set your budget, and post your
                task.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Choose a Tasker
              </h3>
              <p className="text-gray-600">
                Review offers from qualified Taskers and select the best one for
                your needs.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Get It Done
              </h3>
              <p className="text-gray-600">
                Your chosen Tasker completes the work, and you pay securely
                through the app.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust GiupViecVat for
            their daily tasks.
          </p>
          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors"
              >
                Sign Up Now
              </Link>
              <Link
                to="/login"
                className="bg-blue-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-400 border-2 border-blue-400 transition-colors"
              >
                Already have an account?
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
