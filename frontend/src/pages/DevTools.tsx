import React, { useState, useEffect } from "react";
import { tasksAPI } from "../services/api";
import { Link } from "react-router-dom";
import { Copy, ExternalLink, RefreshCw } from "lucide-react";
import type { Task } from "../../../shared/types";

const DevTools: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await tasksAPI.getTasks();
      if (response.success && response.data?.tasks) {
        setTasks(response.data.tasks);
      } else {
        setError("Failed to fetch tasks");
      }
    } catch (err) {
      setError("Error fetching tasks");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert(`Copied: ${text}`);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Developer Tools
              </h1>
              <p className="text-gray-600">
                Quick access to all task IDs for development and testing
              </p>
            </div>
            <button
              onClick={fetchTasks}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Available Tasks ({tasks.length})
            </h2>

            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No tasks available</p>
                <Link
                  to="/post-task"
                  className="text-indigo-600 hover:text-indigo-700 mt-2 inline-block"
                >
                  Create a task
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {tasks.map((task) => (
                  <div
                    key={task._id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {task._id}
                          </span>
                          <button
                            onClick={() => copyToClipboard(task._id)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Copy task ID"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">
                          {task.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {task.description.length > 100
                            ? `${task.description.substring(0, 100)}...`
                            : task.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Status: {task.status}</span>
                          <span>Price: ${task.suggestedPrice}</span>
                          <span>Category: {task.category}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Link
                          to={`/tasks/${task._id}`}
                          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View
                        </Link>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              `http://localhost:5173/tasks/${task._id}`
                            )
                          }
                          className="text-gray-500 hover:text-gray-700 text-sm"
                        >
                          Copy URL
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Test URLs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Valid Task</h4>
                <div className="space-y-2">
                  {tasks.slice(0, 2).map((task) => (
                    <div key={task._id} className="flex items-center gap-2">
                      <code className="text-sm bg-white px-2 py-1 rounded border flex-1">
                        /tasks/{task._id}
                      </code>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            `http://localhost:5173/tasks/${task._id}`
                          )
                        }
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  Invalid Task (for testing error handling)
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-white px-2 py-1 rounded border flex-1">
                      /tasks/invalidtask
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          "http://localhost:5173/tasks/invalidtask"
                        )
                      }
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-white px-2 py-1 rounded border flex-1">
                      /tasks/at68ncbot
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard("http://localhost:5173/tasks/at68ncbot")
                      }
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevTools;
