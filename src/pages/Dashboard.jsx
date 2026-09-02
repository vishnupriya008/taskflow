import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

function Dashboard() {
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");

  const navigate = useNavigate();

  const getAuthToken = () => {
    return localStorage.getItem("taskflow_token") || localStorage.getItem("token");
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("taskflow_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Error parsing user", e);
      }
    }

    const token = getAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }

    loadDashboardData(token);
  }, []);

  const loadDashboardData = async (token) => {
    try {
      const [projectsRes, tasksRes] = await Promise.all([
        fetch(`${API_BASE_URL}/projects`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
        fetch(`${API_BASE_URL}/tasks`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
      ]);

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(Array.isArray(projectsData) ? projectsData : []);
      }
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(Array.isArray(tasksData) ? tasksData : []);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    const token = getAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: projectName.trim(),
          description: projectDesc.trim(),
          progress: 0,
          tasks: 0,
          status: "In Progress",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const newProj = data.project || data;
        setProjects((prev) => [newProj, ...prev]);
        setProjectName("");
        setProjectDesc("");
        setShowModal(false);
      } else {
        alert(data.message || "Failed to create project.");
      }
    } catch (err) {
      console.error("Project creation error:", err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleDeleteProject = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this project and all its tasks?")) return;

    const token = getAuthToken();
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert("Failed to delete project");
      }
    } catch (err) {
      console.error("Delete project error:", err);
    }
  };

  const totalProjects = projects.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const pendingTasks = tasks.filter((t) => t.status !== "Completed").length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="dashboard-layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="dashboard-logo">
          <span className="logo-icon">✓</span>
          <span>TaskFlow</span>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-label">MAIN MENU</p>
          {["Dashboard", "Projects", "My Tasks", "Team"].map((item) => (
            <button
              key={item}
              className={`sidebar-item ${activeMenu === item ? "active" : ""}`}
              onClick={() => {
                setActiveMenu(item);
                if (item === "Dashboard") navigate("/dashboard");
                if (item === "Projects") navigate("/projects");
                if (item === "My Tasks") navigate("/my-tasks");
                if (item === "Team") navigate("/team");
              }}
            >
              <span>
                {item === "Dashboard" && "▦"}
                {item === "Projects" && "📁"}
                {item === "My Tasks" && "✓"}
                {item === "Team" && "👥"}
              </span>
              {item}
            </button>
          ))}
        </div>

        <div className="sidebar-section sidebar-bottom">
          <p className="sidebar-label">ACCOUNT</p>
          <button
            className={`sidebar-item ${activeMenu === "Profile" ? "active" : ""}`}
            onClick={() => {
              setActiveMenu("Profile");
              navigate("/profile");
            }}
          >
            <span>👤</span>
            Profile
          </button>

          <button className="sidebar-item logout" onClick={handleLogout}>
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="dashboard-main">
        {/* HEADER */}
        <header className="dashboard-header">
          <div>
            <p className="dashboard-date">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <h1>Good morning, {user?.name || "Vishnu"}! 👋</h1>
            <p className="dashboard-subtitle">
              Here's what's happening with your projects today.
            </p>
          </div>

          <div className="user-profile">
            <div className="user-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : "V"}
            </div>
            <div>
              <strong>{user?.name || "Vishnu"}</strong>
              <span>Project Manager</span>
            </div>
          </div>
        </header>

        {/* METRICS */}
        <section className="dashboard-stats">
          <div className="stat-card" onClick={() => navigate("/projects")} style={{ cursor: "pointer" }}>
            <div className="stat-icon purple">📁</div>
            <div>
              <span>Total Projects</span>
              <strong>{totalProjects}</strong>
              <small>Active workspaces</small>
            </div>
          </div>

          <div className="stat-card" onClick={() => navigate("/my-tasks")} style={{ cursor: "pointer" }}>
            <div className="stat-icon blue">✓</div>
            <div>
              <span>Total Tasks</span>
              <strong>{totalTasks}</strong>
              <small>All assigned</small>
            </div>
          </div>

          <div className="stat-card" onClick={() => navigate("/my-tasks")} style={{ cursor: "pointer" }}>
            <div className="stat-icon green">✓</div>
            <div>
              <span>Completed</span>
              <strong>{completedTasks}</strong>
              <small>{completionRate}% completion</small>
            </div>
          </div>

          <div className="stat-card" onClick={() => navigate("/my-tasks")} style={{ cursor: "pointer" }}>
            <div className="stat-icon orange">⏱️</div>
            <div>
              <span>Pending Tasks</span>
              <strong>{pendingTasks}</strong>
              <small>Need attention</small>
            </div>
          </div>
        </section>

        {/* PANELS */}
        <section className="dashboard-content">
          <div className="dashboard-panel">
            <div className="panel-header">
              <div>
                <h2>Recent Projects</h2>
                <p>Your active projects</p>
              </div>
              <button className="view-button" onClick={() => setShowModal(true)}>
                + New Project
              </button>
            </div>

            <div className="project-list">
              {projects.length === 0 ? (
                <p style={{ padding: "20px", color: "#475569" }}>
                  No projects created yet. Click "+ Create Project" below to add one!
                </p>
              ) : (
                projects.map((project) => {
                  const total = project.total_tasks || 0;
                  const completed = project.completed_tasks || 0;
                  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

                  return (
                    <div
                      className="dashboard-project"
                      key={project.id}
                      onClick={() => navigate(`/project/${project.id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="project-info">
                        <div className="project-title-row">
                          <h3>{project.name}</h3>
                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <span className="project-status">
                              {project.status || "In Progress"}
                            </span>
                            <button 
                              onClick={(e) => handleDeleteProject(e, project.id)}
                              style={{ background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "4px", padding: "4px 8px", cursor: "pointer", fontWeight: "bold" }}
                              title="Delete Project"
                            >
                              X
                            </button>
                          </div>
                        </div>
                        <p>{project.description || "No description provided."}</p>
                        <div className="project-progress-info">
                          <span>{completed} / {total} tasks</span>
                          <strong>{progress}%</strong>
                        </div>
                        <div className="dashboard-progress">
                          <div style={{ width: `${progress}%` }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="dashboard-panel">
            <div className="panel-header">
              <div>
                <h2>My Tasks</h2>
                <p>Latest assigned tasks</p>
              </div>
              <button className="view-button" onClick={() => navigate("/my-tasks")}>
                View All →
              </button>
            </div>

            <div className="task-list">
              {tasks.length === 0 ? (
                <p style={{ padding: "20px", color: "#475569" }}>
                  No tasks assigned yet.
                </p>
              ) : (
                tasks.slice(0, 5).map((task) => (
                  <div className="dashboard-task" key={task.id}>
                    <div className="task-left">
                      <span
                        className={`task-circle ${
                          task.status === "Completed" ? "task-completed" : ""
                        }`}
                      >
                        {task.status === "Completed" ? "✓" : ""}
                      </span>
                      <div>
                        <strong>{task.title}</strong>
                        <small>Assigned: {task.assigned_to}</small>
                      </div>
                    </div>

                    <span
                      className={`dashboard-task-status ${task.status
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {task.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section className="quick-actions">
          <div>
            <h2>Quick Actions</h2>
          </div>
          <div className="quick-buttons">
            <button className="quick-button" onClick={() => setShowModal(true)}>
              <span>＋</span>
              Create Project
            </button>
            <button className="quick-button" onClick={() => setShowModal(true)}>
              <span>✓</span>
              Add Task
            </button>
            <button className="quick-button" onClick={() => navigate("/team")}>
              <span>👥</span>
              Invite Member
            </button>
          </div>
        </section>
      </main>

      {/* CREATE PROJECT MODAL */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "32px",
              width: "100%",
              maxWidth: "450px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h2 style={{ marginTop: 0, fontSize: "20px", color: "#1e293b" }}>
              Create New Project
            </h2>
            <form onSubmit={handleCreateProject}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#1e293b", marginBottom: "6px" }}>
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Website Redesign"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "6px",
                    border: "1px solid #99f6e4",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#1e293b", marginBottom: "6px" }}>
                  Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Short project overview..."
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "6px",
                    border: "1px solid #99f6e4",
                    fontSize: "14px",
                    outline: "none",
                    resize: "vertical",
                  }}
                ></textarea>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "6px",
                    border: "1px solid #99f6e4",
                    backgroundColor: "#1e293b",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 18px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: "#fbbf24",
                    color: "#ffffff",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
