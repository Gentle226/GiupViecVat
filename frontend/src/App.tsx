import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { TaskProvider } from "./contexts/TaskContext";
import { SocketProvider } from "./contexts/SocketContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TaskList from "./pages/TaskList";
import FindTasks from "./pages/FindTasks";
import Dashboard from "./pages/Dashboard";
import TaskDetail from "./pages/TaskDetail";
import CreateTask from "./pages/CreateTask";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import DevTools from "./pages/DevTools";
import MapDemo from "./pages/MapDemo";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";

function App() {
  console.log("App component is rendering");
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <SocketProvider>
            <NotificationProvider>
              <TaskProvider>
                <Navbar />
                <main>
                  {" "}
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />{" "}
                    <Route path="/tasks" element={<TaskList />} />
                    <Route path="/find-tasks" element={<FindTasks />} />
                    <Route path="/tasks/:id" element={<TaskDetail />} />
                    <Route path="/dev-tools" element={<DevTools />} />
                    <Route path="/map-demo" element={<MapDemo />} />{" "}
                    <Route
                      path="/post-task"
                      element={
                        <RoleProtectedRoute allowedRoles={["client"]}>
                          <CreateTask />
                        </RoleProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/messages"
                      element={
                        <ProtectedRoute>
                          <Messages />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile/:userId?"
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      }
                    />{" "}
                  </Routes>
                </main>
              </TaskProvider>
            </NotificationProvider>
          </SocketProvider>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
