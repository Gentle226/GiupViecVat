import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { TaskProvider } from "./contexts/TaskContext";
import { SocketProvider } from "./contexts/SocketContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TaskList from "./pages/TaskList";
import Dashboard from "./pages/Dashboard";
import TaskDetail from "./pages/TaskDetail";
import CreateTask from "./pages/CreateTask";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  console.log("App component is rendering");
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <SocketProvider>
            <TaskProvider>
              <Navbar />
              <main>
                {" "}
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/tasks" element={<TaskList />} />
                  <Route path="/tasks/:id" element={<TaskDetail />} />
                  <Route
                    path="/post-task"
                    element={
                      <ProtectedRoute>
                        <CreateTask />
                      </ProtectedRoute>
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
                  />
                </Routes>
              </main>
            </TaskProvider>
          </SocketProvider>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
