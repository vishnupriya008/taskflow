import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? "https://taskflow-ni7n.onrender.com/api" : "http://localhost:5000/api");

export default function ProjectBoard() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  
  // Add task state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");

  // Modal State
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const getToken = () => localStorage.getItem("taskflow_token") || localStorage.getItem("token");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }
    if (id) {
      fetchProject();
    }
    fetchTasks();
  }, [id]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (response.ok) {
        const data = await response.json();
        setProject(data);
      }
    } catch (err) {
      console.error("Failed to fetch project details:", err);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    setError("");
    const token = getToken();

    try {
      const url = id ? `${API_BASE_URL}/tasks?project_id=${id}` : `${API_BASE_URL}/tasks`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Could not fetch tasks");
      const data = await response.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Could not connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const now = new Date();
    const localDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const taskPayload = {
      title: newTaskTitle.trim(),
      assigned_to: assignedTo.trim() || "Unassigned",
      status: "To Do",
      priority: "Medium",
      due_date: "No deadline",
      project_id: id ? parseInt(id, 10) : null,
      created_at: localDateStr,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskPayload),
      });
      if (response.ok) {
        const createdTask = await response.json();
        setTasks((prev) => [createdTask, ...prev]);
        setNewTaskTitle("");
        setAssignedTo("");
      } else {
        setError("Failed to create task");
      }
    } catch (err) {
      setError("Failed to save task");
    }
  };

  const updateTask = async (taskId, updates) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        const updatedTask = await response.json();
        setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
        if (selectedTask?.id === taskId) {
          setSelectedTask(updatedTask);
        }
      }
    } catch (err) {
      console.error("Error updating task:", err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (response.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error("Delete task error", err);
    }
  };

  // Comments
  const fetchComments = async (taskId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/comments`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (response.ok) {
        setComments(await response.json());
      }
    } catch (err) {
      console.error("Failed to fetch comments", err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTask) return;

    const now = new Date();
    const localDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${selectedTask.id}/comments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newComment.trim(), created_at: localDateStr }),
      });
      if (response.ok) {
        const addedComment = await response.json();
        setComments([...comments, addedComment]);
        setNewComment("");
      }
    } catch (err) {
      console.error("Failed to add comment", err);
    }
  };

  const openTaskModal = (task) => {
    setSelectedTask(task);
    setComments([]);
    fetchComments(task.id);
    setIsModalOpen(true);
  };

  // Metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "Completed").length;
  const inProgressTasks = tasks.filter(t => t.status === "In Progress").length;
  const inReviewTasks = tasks.filter(t => t.status === "In Review").length;
  const todoTasks = tasks.filter(t => t.status === "To Do").length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Derived arrays
  const assignees = ["All", ...new Set(tasks.map((t) => t.assigned_to).filter(Boolean))];

  // Filtering
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAssignee = filterAssignee === "All" || t.assigned_to === filterAssignee;
    const matchesPriority = filterPriority === "All" || t.priority.toLowerCase() === filterPriority.toLowerCase();
    return matchesSearch && matchesAssignee && matchesPriority;
  });

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high": return "#ef4444";
      case "medium": return "#f59e0b";
      case "low": return "#10b981";
      default: return "#6b7280";
    }
  };

  const getInitials = (name) => {
    if (!name || name === "Unassigned") return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  };

  const isOverdue = (dateStr) => {
    if (!dateStr || dateStr === "No deadline") return false;
    const due = new Date(dateStr);
    return due < new Date();
  };

  const renderColumn = (colTitle, statusKey) => {
    const colTasks = filteredTasks.filter((t) => t.status === statusKey);

    return (
      <div
        style={{
          flex: 1,
          backgroundColor: "#f1f5f9",
          borderRadius: "12px",
          padding: "16px",
          minHeight: "500px",
          display: "flex",
          flexDirection: "column",
          border: "1px solid #99f6e4"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b", textTransform: "uppercase", margin: 0 }}>
            {colTitle}
          </h3>
          <span style={{ background: "#e2e8f0", color: "#475569", padding: "2px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" }}>
            {colTasks.length}
          </span>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
          {colTasks.length === 0 ? (
            <p style={{ color: "#475569", fontSize: "13px", margin: "auto" }}>Empty</p>
          ) : (
            colTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => openTaskModal(task)}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  padding: "14px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                  borderLeft: `4px solid ${getPriorityColor(task.priority)}`,
                  cursor: "pointer",
                  transition: "transform 0.1s, box-shadow 0.1s",
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.5)"; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.3)"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: getPriorityColor(task.priority), background: `${getPriorityColor(task.priority)}15`, padding: "2px 6px", borderRadius: "4px", textTransform: "uppercase" }}>
                    {task.priority || "Medium"}
                  </span>
                  {isOverdue(task.due_date) && task.status !== "Completed" && (
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#ef4444", background: "#fef2f2", padding: "2px 6px", borderRadius: "4px" }}>
                      Overdue
                    </span>
                  )}
                </div>
                
                <h4 style={{ fontWeight: "600", color: "#1e293b", margin: "0 0 12px 0", fontSize: "15px", lineHeight: "1.3" }}>
                  {task.title}
                </h4>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#e0e7ff", color: "#fbbf24", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "bold" }} title={task.assigned_to}>
                      {getInitials(task.assigned_to)}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "10px", color: "#475569", fontSize: "12px" }}>
                    <span title="Comments">💬</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#e0f2f1", fontFamily: "system-ui, sans-serif" }}>
      {/* Top Navbar */}
      <div style={{ backgroundColor: "#009688", color: "#ffffff", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", fontSize: "18px" }}>
          <span>⚡</span>
          <span>{project ? project.name : "TaskFlow Board"}</span>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {project && project.invite_token && (
            <button
              onClick={() => {
                const inviteUrl = `${window.location.origin}/join?token=${project.invite_token}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(`Join my project "${project.name}" on TaskFlow: ${inviteUrl}`)}`, "_blank");
              }}
              style={{ backgroundColor: "#25D366", color: "#ffffff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px" }}
            >
              📱 Invite via WhatsApp
            </button>
          )}
          <button
            onClick={() => navigate("/dashboard")}
            style={{ backgroundColor: "#ffffff", color: "#1e293b", border: "1px solid #99f6e4", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px" }}>
        
        {/* Top Metrics */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#1e293b", margin: "0 0 8px 0" }}>
              Project Board #{id || "All Tasks"}
            </h1>
            <div style={{ display: "flex", gap: "16px", color: "#475569", fontSize: "14px", fontWeight: "500" }}>
              <span>Total: {totalTasks}</span>
              <span>To Do: {todoTasks}</span>
              <span>In Progress: {inProgressTasks}</span>
              <span>In Review: {inReviewTasks}</span>
              <span>Completed: {completedTasks}</span>
            </div>
          </div>
          <div style={{ width: "200px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "bold", color: "#fbbf24", marginBottom: "4px" }}>
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div style={{ height: "8px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progressPercent}%`, background: "#fbbf24", borderRadius: "4px", transition: "width 0.3s" }}></div>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ backgroundColor: "#fee2e2", color: "#b91c1c", padding: "12px", borderRadius: "6px", marginBottom: "20px", fontSize: "14px" }}>
            {error}
          </div>
        )}

        {/* Filters and Add Task */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "24px", background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #99f6e4", alignItems: "center" }}>
          {/* Quick Add */}
          <form onSubmit={handleAddTask} style={{ display: "flex", gap: "8px", flex: 1 }}>
            <input
              type="text"
              placeholder="New Task Title..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              style={{ flex: 2, padding: "10px", border: "1px solid #99f6e4", borderRadius: "6px", outline: "none", fontSize: "14px" }}
            />
            <input
              type="text"
              placeholder="Assignee"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              style={{ flex: 1, padding: "10px", border: "1px solid #99f6e4", borderRadius: "6px", outline: "none", fontSize: "14px" }}
            />
            <button type="submit" style={{ backgroundColor: "#fbbf24", color: "#1e293b", border: "none", padding: "10px 16px", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}>
              Add Task
            </button>
          </form>

          <div style={{ width: "1px", height: "30px", background: "#e2e8f0" }}></div>

          {/* Filters */}
          <input
            type="text"
            placeholder="🔍 Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: "10px", border: "1px solid #99f6e4", borderRadius: "6px", outline: "none", fontSize: "14px", width: "200px" }}
          />
          
          <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} style={{ padding: "10px", border: "1px solid #99f6e4", borderRadius: "6px", outline: "none", fontSize: "14px", background: "#ffffff" }}>
            {assignees.map(a => <option key={a} value={a}>{a === "All" ? "All Assignees" : a}</option>)}
          </select>

          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} style={{ padding: "10px", border: "1px solid #99f6e4", borderRadius: "6px", outline: "none", fontSize: "14px", background: "#ffffff" }}>
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Board Columns */}
        {loading ? (
          <p style={{ color: "#475569", textAlign: "center", padding: "40px" }}>Loading board tasks...</p>
        ) : (
          <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
            {renderColumn("To Do", "To Do")}
            {renderColumn("In Progress", "In Progress")}
            {renderColumn("In Review", "In Review")}
            {renderColumn("Completed", "Completed")}
          </div>
        )}
      </div>

      {/* Task Details Modal */}
      {isModalOpen && selectedTask && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#ffffff", width: "800px", maxWidth: "90%", maxHeight: "90vh", borderRadius: "16px", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            
            {/* Modal Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                  <select
                    value={selectedTask.status}
                    onChange={(e) => updateTask(selectedTask.id, { status: e.target.value })}
                    style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #99f6e4", fontSize: "12px", fontWeight: "bold", background: "#e0f2f1", cursor: "pointer" }}
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="In Review">In Review</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <select
                    value={selectedTask.priority}
                    onChange={(e) => updateTask(selectedTask.id, { priority: e.target.value })}
                    style={{ padding: "4px 8px", borderRadius: "4px", border: "none", fontSize: "12px", fontWeight: "bold", color: getPriorityColor(selectedTask.priority), background: `${getPriorityColor(selectedTask.priority)}15`, cursor: "pointer" }}
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>
                <h2 style={{ margin: 0, fontSize: "22px", color: "#1e293b" }}>{selectedTask.title}</h2>
              </div>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <button onClick={() => handleDeleteTask(selectedTask.id)} style={{ background: "transparent", color: "#ef4444", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}>Delete Task</button>
                <button onClick={() => setIsModalOpen(false)} style={{ background: "#e0f2f1", border: "none", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", color: "#1e293b" }}>✕</button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
              {/* Left Column: Details */}
              <div style={{ flex: 2, padding: "24px", borderRight: "1px solid #e2e8f0", overflowY: "auto" }}>
                <h3 style={{ fontSize: "14px", color: "#475569", margin: "0 0 8px 0", textTransform: "uppercase" }}>Description</h3>
                <textarea
                  value={selectedTask.description || ""}
                  onChange={(e) => updateTask(selectedTask.id, { description: e.target.value })}
                  placeholder="Add a more detailed description..."
                  style={{ width: "100%", minHeight: "120px", padding: "12px", border: "1px solid #99f6e4", borderRadius: "8px", outline: "none", resize: "vertical", fontSize: "14px", fontFamily: "inherit", marginBottom: "24px" }}
                />

                <h3 style={{ fontSize: "14px", color: "#475569", margin: "0 0 12px 0", textTransform: "uppercase" }}>Activity & Comments</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "20px" }}>
                  {comments.length === 0 ? (
                    <p style={{ color: "#475569", fontSize: "14px" }}>No comments yet.</p>
                  ) : (
                    comments.map(c => (
                      <div key={c.id} style={{ display: "flex", gap: "12px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#e2e8f0", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", flexShrink: 0 }}>
                          {getInitials(c.user_name)}
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "4px" }}>
                            <span style={{ fontWeight: "700", fontSize: "14px", color: "#1e293b" }}>{c.user_name}</span>
                            <span style={{ fontSize: "11px", color: "#475569" }}>
                              {c.created_at ? (() => {
                                const [date, time] = c.created_at.replace("T", " ").split(" ");
                                if (!date) return c.created_at;
                                const parts = date.split("-");
                                return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}${time ? `, ${time}` : ''}` : c.created_at;
                              })() : "Unknown"}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: "14px", color: "#1e293b", background: "#e0f2f1", padding: "10px 14px", borderRadius: "0 8px 8px 8px", border: "1px solid #99f6e4" }}>
                            {c.content}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <form onSubmit={handleAddComment} style={{ display: "flex", gap: "12px" }}>
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    style={{ flex: 1, padding: "10px 14px", border: "1px solid #99f6e4", borderRadius: "20px", outline: "none", fontSize: "14px" }}
                  />
                  <button type="submit" style={{ background: "#fbbf24", color: "#1e293b", border: "none", padding: "8px 16px", borderRadius: "20px", fontWeight: "600", cursor: "pointer" }}>Send</button>
                </form>
              </div>

              {/* Right Column: Meta */}
              <div style={{ flex: 1, padding: "24px", background: "#e0f2f1", overflowY: "auto" }}>
                <h3 style={{ fontSize: "14px", color: "#475569", margin: "0 0 16px 0", textTransform: "uppercase" }}>Details</h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#475569", fontWeight: "600", marginBottom: "4px" }}>ASSIGNEE</label>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#e0e7ff", color: "#fbbf24", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "bold" }}>
                        {getInitials(selectedTask.assigned_to)}
                      </div>
                      <input 
                        type="text" 
                        value={selectedTask.assigned_to || ""} 
                        onChange={(e) => updateTask(selectedTask.id, { assigned_to: e.target.value })}
                        style={{ border: "1px solid transparent", background: "transparent", fontSize: "14px", color: "#1e293b", fontWeight: "500", padding: "4px", width: "100%", outline: "none" }}
                        placeholder="Unassigned"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#475569", fontWeight: "600", marginBottom: "4px" }}>DUE DATE</label>
                    <input 
                      type="date" 
                      value={selectedTask.due_date && selectedTask.due_date !== "No deadline" ? selectedTask.due_date.split('T')[0] : ""} 
                      onChange={(e) => updateTask(selectedTask.id, { due_date: e.target.value || "No deadline" })}
                      style={{ border: "1px solid #99f6e4", borderRadius: "4px", padding: "6px 8px", fontSize: "13px", color: "#1e293b", width: "100%", outline: "none" }}
                    />
                  </div>

                  <div style={{ paddingTop: "16px", borderTop: "1px solid #e2e8f0", marginTop: "16px" }}>
                    <label style={{ display: "block", fontSize: "12px", color: "#475569", fontWeight: "600", marginBottom: "4px" }}>CREATED</label>
                    <span style={{ fontSize: "13px", color: "#475569" }}>
                      {selectedTask.created_at ? (() => {
                        const date = selectedTask.created_at.replace("T", " ").split(" ")[0];
                        if (!date) return selectedTask.created_at;
                        const parts = date.split("-");
                        return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : selectedTask.created_at;
                      })() : "Unknown"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
