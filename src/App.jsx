import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProjectBoard from "./pages/ProjectBoard";
import MyTasks from "./pages/MyTasks";
import Team from "./pages/Team";
import Profile from "./pages/Profile";
import JoinProject from "./pages/JoinProject";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Main Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Projects / Boards */}
        <Route path="/projects" element={<Dashboard />} />
        <Route path="/project/:id" element={<ProjectBoard />} />
        
        {/* Other Pages */}
        <Route path="/my-tasks" element={<MyTasks />} />
        <Route path="/team" element={<Team />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/join" element={<JoinProject />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}