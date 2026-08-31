import React from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#1e293b", fontFamily: "sans-serif" }}>
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 48px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", fontSize: "20px", color: "#fbbf24" }}>
          <span style={{ backgroundColor: "#fbbf24", color: "#ffffff", padding: "4px 8px", borderRadius: "6px" }}>✓</span> TaskFlow
        </div>
        <div style={{ display: "flex", gap: "24px", color: "#475569", fontWeight: "500" }}>
          <span>Home</span>
          <span>Features</span>
          <span>How It Works</span>
          <span>About</span>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={() => navigate("/login")} style={{ padding: "8px 18px", border: "1px solid #99f6e4", borderRadius: "8px", background: "#ffffff", cursor: "pointer", fontWeight: "600" }}>
            Login
          </button>
          <button onClick={() => navigate("/register")} style={{ padding: "8px 18px", border: "none", borderRadius: "8px", background: "#fbbf24", color: "#ffffff", cursor: "pointer", fontWeight: "600" }}>
            Get Started
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: "1100px", margin: "40px auto", padding: "0 24px", display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "48px", alignItems: "center" }}>
        <div>
          <span style={{ display: "inline-block", background: "#ede9fe", color: "#fbbf24", padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "bold", marginBottom: "16px" }}>
            🚀 Smart Project Management
          </span>
          <h1 style={{ fontSize: "52px", lineHeight: "1.15", fontWeight: "800", color: "#1e1b4b", margin: "0 0 20px 0" }}>
            Manage Projects.<br />Empower Your Team.
          </h1>
          <p style={{ color: "#475569", fontSize: "16px", lineHeight: "1.6", marginBottom: "32px" }}>
            TaskFlow helps teams organize projects, assign tasks, collaborate efficiently, and track progress — all in one simple workspace.
          </p>
          <div style={{ display: "flex", gap: "16px", marginBottom: "40px" }}>
            <button onClick={() => navigate("/register")} style={{ padding: "12px 24px", background: "#fbbf24", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
              Get Started →
            </button>
            <button onClick={() => navigate("/login")} style={{ padding: "12px 24px", background: "#ffffff", border: "1px solid #99f6e4", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}>
              Explore Features
            </button>
          </div>
          <div style={{ display: "flex", gap: "32px" }}>
            <div><strong style={{ display: "block", color: "#1e293b" }}>Easy</strong><small style={{ color: "#475569" }}>Project Management</small></div>
            <div><strong style={{ display: "block", color: "#1e293b" }}>Fast</strong><small style={{ color: "#475569" }}>Task Tracking</small></div>
            <div><strong style={{ display: "block", color: "#1e293b" }}>Smart</strong><small style={{ color: "#475569" }}>Team Collaboration</small></div>
          </div>
        </div>

        {/* Hero Card */}
        <div style={{ background: "#ffffff", padding: "28px", borderRadius: "20px", boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <strong style={{ fontSize: "17px", color: "#1e293b" }}>Project Dashboard</strong>
              <div style={{ fontSize: "12px", color: "#475569" }}>Team Workspace</div>
            </div>
            <div style={{ width: "32px", height: "32px", background: "#ede9fe", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "#fbbf24" }}>V</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "20px" }}>
            <div style={{ background: "#e0f2f1", padding: "12px", borderRadius: "8px" }}><small style={{ color: "#475569" }}>Projects</small><div style={{ fontSize: "20px", fontWeight: "bold" }}>12</div></div>
            <div style={{ background: "#e0f2f1", padding: "12px", borderRadius: "8px" }}><small style={{ color: "#475569" }}>Total Tasks</small><div style={{ fontSize: "20px", fontWeight: "bold" }}>48</div></div>
            <div style={{ background: "#e0f2f1", padding: "12px", borderRadius: "8px" }}><small style={{ color: "#475569" }}>Completed</small><div style={{ fontSize: "20px", fontWeight: "bold" }}>31</div></div>
          </div>
          <div style={{ background: "#e0f2f1", padding: "16px", borderRadius: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "14px", marginBottom: "8px" }}>
              <span>Website Redesign</span><span style={{ color: "#fbbf24" }}>75%</span>
            </div>
            <div style={{ width: "100%", height: "6px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ width: "75%", height: "100%", background: "#fbbf24" }}></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
