import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    // If the user is already authenticated, smoothly transition to dashboard
    if (localStorage.getItem("token")) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#e0f2f1", color: "#1e293b", fontFamily: "'Inter', sans-serif" }}>
      {/* Sleek Navbar */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 5%", borderBottom: "1px solid #ffffff", background: "rgba(0, 150, 136, 0.95)", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: "800", fontSize: "22px", color: "#ffffff", letterSpacing: "-0.5px" }}>
          <span style={{ backgroundColor: "#fbbf24", color: "#1e293b", padding: "4px 8px", borderRadius: "8px", fontSize: "18px" }}>✦</span> ProjectFlow
        </div>
        <div style={{ display: "flex", gap: "32px", color: "#475569", fontWeight: "500", fontSize: "15px" }}>
          <span style={{ cursor: "pointer", transition: "color 0.2s" }} onMouseOver={e => e.target.style.color = '#ffffff'} onMouseOut={e => e.target.style.color = '#475569'}>Features</span>
          <span style={{ cursor: "pointer", transition: "color 0.2s" }} onMouseOver={e => e.target.style.color = '#ffffff'} onMouseOut={e => e.target.style.color = '#475569'}>How it works</span>
          <span style={{ cursor: "pointer", transition: "color 0.2s" }} onMouseOver={e => e.target.style.color = '#ffffff'} onMouseOut={e => e.target.style.color = '#475569'}>About</span>
        </div>
        <div style={{ display: "flex", gap: "16px" }}>
          <button onClick={() => navigate("/login")} style={{ padding: "10px 20px", border: "none", background: "transparent", color: "#e2e8f0", cursor: "pointer", fontWeight: "600", fontSize: "15px" }}>
            Log In
          </button>
          <button onClick={() => navigate("/register")} style={{ padding: "10px 24px", border: "none", borderRadius: "8px", background: "#fbbf24", color: "#1e293b", cursor: "pointer", fontWeight: "600", fontSize: "15px", boxShadow: "0 4px 14px 0 rgba(99,102,241,0.39)" }}>
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header style={{ maxWidth: "1200px", margin: "0 auto", padding: "100px 5%", textAlign: "center" }}>
        <h1 style={{ fontSize: "64px", lineHeight: "1.1", fontWeight: "800", margin: "0 0 24px 0", letterSpacing: "-1.5px", background: "linear-gradient(to right, #ffffff, #475569)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Plan. Collaborate. Deliver.
        </h1>
        <p style={{ color: "#475569", fontSize: "20px", lineHeight: "1.6", maxWidth: "600px", margin: "0 auto 48px auto", fontWeight: "400" }}>
          The modern project management workspace designed to help your team organize tasks, track progress, and ship faster in one unified platform.
        </p>
        <div style={{ display: "flex", gap: "20px", justifyContent: "center" }}>
          <button onClick={() => navigate("/register")} style={{ padding: "16px 32px", border: "none", borderRadius: "10px", background: "#fbbf24", color: "#1e293b", cursor: "pointer", fontWeight: "700", fontSize: "16px", boxShadow: "0 4px 20px rgba(99,102,241,0.4)", transition: "transform 0.2s" }} onMouseOver={e => e.target.style.transform = 'translateY(-2px)'} onMouseOut={e => e.target.style.transform = 'translateY(0)'}>
            Get Started for Free
          </button>
          <button onClick={() => navigate("/login")} style={{ padding: "16px 32px", border: "1px solid #99f6e4", borderRadius: "10px", background: "#ffffff", color: "#ffffff", cursor: "pointer", fontWeight: "600", fontSize: "16px", transition: "all 0.2s" }} onMouseOver={e => { e.target.style.background = '#99f6e4'; e.target.style.transform = 'translateY(-2px)' }} onMouseOut={e => { e.target.style.background = '#ffffff'; e.target.style.transform = 'translateY(0)' }}>
            View Demo
          </button>
        </div>
      </header>

      {/* Features Section */}
      <section style={{ padding: "80px 5%", background: "#e0f2f1" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <h2 style={{ fontSize: "36px", fontWeight: "700", marginBottom: "16px" }}>Everything you need to succeed</h2>
            <p style={{ color: "#475569", fontSize: "18px", maxWidth: "600px", margin: "0 auto" }}>Powerful tools built for modern teams that want to move fast without breaking things.</p>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "32px" }}>
            <div style={{ background: "#ffffff", padding: "32px", borderRadius: "16px", border: "1px solid #99f6e4" }}>
              <div style={{ width: "48px", height: "48px", background: "rgba(99,102,241,0.1)", color: "#818cf8", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", marginBottom: "20px" }}>
                📋
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "12px", color: "#1e293b" }}>Project Boards</h3>
              <p style={{ color: "#475569", lineHeight: "1.6" }}>
                Visualize your work with dynamic Kanban boards. Move tasks effortlessly through stages from Todo to Completed.
              </p>
            </div>
            
            <div style={{ background: "#ffffff", padding: "32px", borderRadius: "16px", border: "1px solid #99f6e4" }}>
              <div style={{ width: "48px", height: "48px", background: "rgba(16,185,129,0.1)", color: "#34d399", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", marginBottom: "20px" }}>
                🎯
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "12px", color: "#1e293b" }}>Task Assignment</h3>
              <p style={{ color: "#475569", lineHeight: "1.6" }}>
                Assign tasks to specific team members, set deadlines, add tags, and track individual performance with ease.
              </p>
            </div>
            
            <div style={{ background: "#ffffff", padding: "32px", borderRadius: "16px", border: "1px solid #99f6e4" }}>
              <div style={{ width: "48px", height: "48px", background: "rgba(245,158,11,0.1)", color: "#fbbf24", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", marginBottom: "20px" }}>
                💬
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "12px", color: "#1e293b" }}>Team Collaboration</h3>
              <p style={{ color: "#475569", lineHeight: "1.6" }}>
                Communicate directly on tasks with an integrated activity feed. Keep everyone aligned and in the loop.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section style={{ padding: "100px 5%", maxWidth: "1200px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "36px", fontWeight: "700", textAlign: "center", marginBottom: "64px" }}>How it works</h2>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "24px", flexWrap: "wrap" }}>
          {[
            { num: "1", title: "Create a project", desc: "Start by setting up a dedicated workspace for your new initiative." },
            { num: "2", title: "Add your team", desc: "Invite members via share links and assign them roles instantly." },
            { num: "3", title: "Assign tasks", desc: "Break work down into actionable pieces and set strict deadlines." },
            { num: "4", title: "Track progress", desc: "Monitor overall project health through real-time metrics and boards." }
          ].map((step, idx) => (
            <div key={idx} style={{ flex: "1", minWidth: "200px", textAlign: "center" }}>
              <div style={{ width: "64px", height: "64px", background: "linear-gradient(135deg, #fbbf24, #a855f7)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: "bold", color: "#ffffff", margin: "0 auto 24px auto", boxShadow: "0 10px 25px rgba(99,102,241,0.3)" }}>
                {step.num}
              </div>
              <h4 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "12px" }}>{step.title}</h4>
              <p style={{ color: "#475569", fontSize: "14px", lineHeight: "1.5" }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #ffffff", padding: "40px 5%", textAlign: "center", color: "#64748b", fontSize: "14px", background: "#e0f2f1" }}>
        © {new Date().getFullYear()} ProjectFlow. All rights reserved.
      </footer>
    </div>
  );
}
