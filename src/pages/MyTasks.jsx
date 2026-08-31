import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "/api";

export default function MyTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getToken = () => localStorage.getItem("taskflow_token") || localStorage.getItem("token");

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    setError("");

    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }

      const data = await response.json();
      setTasks(data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError("Could not connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async (taskId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
        );
      }
    } catch (err) {
      console.error("Status update error", err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });
      if (response.ok) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
      } else {
        alert("Failed to delete task");
      }
    } catch (err) {
      console.error("Delete task error", err);
    }
  };

  const completed = tasks.filter((t) => t.status === "Completed").length;
  const inProgress = tasks.filter((t) => t.status === "In Progress").length;
  const todo = tasks.filter((t) => t.status === "To Do").length;

  const priorityStyle = (priority) => {
    if (priority === "High") return { background: "#fee2e2", color: "#dc2626" };
    if (priority === "Medium") return { background: "#fef3c7", color: "#d97706" };
    return { background: "#dcfce7", color: "#16a34a" };
  };

  const statusStyle = (status) => {
    if (status === "Completed") return { background: "#dcfce7", color: "#15803d" };
    if (status === "In Progress") return { background: "#dbeafe", color: "#2563eb" };
    return { background: "#e0f2f1", color: "#475569" };
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#e0f2f1",
        fontFamily: "system-ui, sans-serif",
        color: "#1e293b",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          background: "#e0f2f1",
          color: "#ffffff",
          padding: "18px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>✓ TaskFlow</h2>
          <span style={{ fontSize: "13px", color: "#475569" }}>
            My Workspace
          </span>
        </div>

        <button
          onClick={() => navigate("/dashboard")}
          style={{
            background: "#99f6e4",
            color: "#ffffff",
            border: "none",
            padding: "10px 18px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          ← Dashboard
        </button>
      </header>

      {/* MAIN */}
      <main
        style={{
          maxWidth: "1150px",
          margin: "0 auto",
          padding: "40px 24px",
        }}
      >
        {/* TITLE */}
        <div style={{ marginBottom: "30px" }}>
          <p
            style={{
              color: "#fbbf24",
              fontWeight: "700",
              fontSize: "14px",
              marginBottom: "6px",
            }}
          >
            TASK MANAGEMENT
          </p>

          <h1 style={{ fontSize: "32px", margin: "0 0 8px" }}>My Tasks</h1>

          <p style={{ color: "#475569", margin: 0 }}>
            Manage and track all tasks assigned to you.
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: "#fee2e2",
              color: "#b91c1c",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {/* SUMMARY CARDS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "18px",
            marginBottom: "30px",
          }}
        >
          <div style={cardStyle}>
            <span style={labelStyle}>Total Tasks</span>
            <strong style={numberStyle}>{tasks.length}</strong>
          </div>

          <div style={cardStyle}>
            <span style={labelStyle}>Completed</span>
            <strong style={{ ...numberStyle, color: "#16a34a" }}>
              {completed}
            </strong>
          </div>

          <div style={cardStyle}>
            <span style={labelStyle}>In Progress</span>
            <strong style={{ ...numberStyle, color: "#2563eb" }}>
              {inProgress}
            </strong>
          </div>

          <div style={cardStyle}>
            <span style={labelStyle}>To Do</span>
            <strong style={{ ...numberStyle, color: "#d97706" }}>{todo}</strong>
          </div>
        </div>

        {/* TASK LIST */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #99f6e4",
            borderRadius: "14px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "22px 24px",
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <h2 style={{ margin: "0 0 5px" }}>Assigned Tasks</h2>
            <p style={{ margin: 0, color: "#475569", fontSize: "14px" }}>
              Update the status of your tasks as you work.
            </p>
          </div>

          {loading ? (
            <div style={{ padding: "30px", textAlign: "center", color: "#475569" }}>
              Loading tasks...
            </div>
          ) : tasks.length === 0 ? (
            <div style={{ padding: "30px", textAlign: "center", color: "#475569" }}>
              No tasks found. Create a task in the Project Board!
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                style={{
                  padding: "20px 24px",
                  borderBottom: "1px solid #f1f5f9",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "20px",
                }}
              >
                {/* TASK INFORMATION */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "7px",
                    }}
                  >
                    <span
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background:
                          task.status === "Completed"
                            ? "#16a34a"
                            : task.status === "In Progress"
                            ? "#2563eb"
                            : "#475569",
                      }}
                    ></span>

                    <h3 style={{ margin: 0, fontSize: "16px" }}>{task.title}</h3>
                  </div>

                  <p
                    style={{
                      margin: "0 0 10px 20px",
                      color: "#475569",
                      fontSize: "14px",
                    }}
                  >
                    👤 Assigned to: {task.assigned_to || "Unassigned"}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      marginLeft: "20px",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        ...priorityStyle(task.priority),
                        padding: "5px 9px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "700",
                      }}
                    >
                      {task.priority || "Medium"} Priority
                    </span>

                    <span style={{ color: "#475569", fontSize: "12px" }}>
                      📅 Due {task.dueDate || "No deadline"}
                    </span>
                  </div>
                </div>

                {/* STATUS */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <span
                    style={{
                      ...statusStyle(task.status),
                      padding: "7px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "700",
                    }}
                  >
                    {task.status}
                  </span>

                  <select
                    value={task.status}
                    onChange={(e) => changeStatus(task.id, e.target.value)}
                    style={{
                      padding: "9px",
                      border: "1px solid #99f6e4",
                      borderRadius: "7px",
                      background: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    style={{
                      background: "#fee2e2",
                      color: "#ef4444",
                      border: "none",
                      padding: "9px 12px",
                      borderRadius: "7px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                    title="Delete Task"
                  >
                    X
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #99f6e4",
  borderRadius: "12px",
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const labelStyle = {
  color: "#475569",
  fontSize: "13px",
  fontWeight: "600",
};

const numberStyle = {
  fontSize: "28px",
  color: "#fbbf24",
};
