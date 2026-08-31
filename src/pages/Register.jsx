import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // Check passwords match
    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.error || data.message || "Registration failed.");
        setLoading(false);
        return;
      }

      // Save user session locally
      localStorage.setItem("taskflow_token", data.token);
      localStorage.setItem("token", data.token);
      localStorage.setItem("taskflow_user", JSON.stringify(data.user));

      alert("Registration successful!");
      
      const pendingInviteToken = localStorage.getItem("pending_invite_token");
      if (pendingInviteToken) {
        localStorage.removeItem("pending_invite_token");
        navigate(`/join?token=${pendingInviteToken}`);
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setMessage(
        "Cannot connect to the backend server. Make sure node index.js is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "system-ui, sans-serif",
        backgroundColor: "#e0f2f1",
      }}
    >
      {/* LEFT SIDE */}
      <div
        style={{
          flex: 1,
          backgroundColor: "#ffffff",
          padding: "60px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              backgroundColor: "#fbbf24",
              color: "#ffffff",
              padding: "8px 12px",
              borderRadius: "8px",
              fontWeight: "bold",
            }}
          >
            ✓ TaskFlow
          </div>
        </div>

        <span
          style={{
            color: "#fbbf24",
            fontWeight: "600",
            fontSize: "14px",
            letterSpacing: "1px",
          }}
        >
          WELCOME TO TASKFLOW
        </span>

        <h1
          style={{
            fontSize: "48px",
            color: "#1e293b",
            margin: "16px 0",
            lineHeight: 1.2,
          }}
        >
          Organize your work. Achieve more.
        </h1>

        <p
          style={{
            color: "#475569",
            fontSize: "18px",
            marginBottom: "32px",
            maxWidth: "480px",
          }}
        >
          Create projects, manage tasks, collaborate with your team, and track
          your progress from one simple workspace.
        </p>

        <ul
          style={{
            listStyle: "none",
            padding: 0,
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <li>✓ Manage projects easily</li>
          <li>✓ Collaborate with your team</li>
          <li>✓ Track every task</li>
        </ul>
      </div>

      {/* RIGHT SIDE */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "420px",
            backgroundColor: "#ffffff",
            padding: "40px",
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
        >
          <h2
            style={{
              fontSize: "28px",
              color: "#1e293b",
              marginBottom: "8px",
            }}
          >
            Create your account
          </h2>

          <p
            style={{
              color: "#475569",
              fontSize: "14px",
              marginBottom: "28px",
            }}
          >
            Start managing your projects with TaskFlow.
          </p>

          {message && (
            <div
              style={{
                backgroundColor: "#fee2e2",
                color: "#b91c1c",
                padding: "10px",
                borderRadius: "8px",
                marginBottom: "18px",
                fontSize: "14px",
              }}
            >
              {message}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            <div>
              <label style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>Full Name</label>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                placeholder="Enter your full name"
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  marginTop: "6px",
                  borderRadius: "8px",
                  border: "1px solid #99f6e4",
                  backgroundColor: "#e0f2f1",
                  color: "#1e293b",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>Email Address</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                placeholder="Enter your email"
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  marginTop: "6px",
                  borderRadius: "8px",
                  border: "1px solid #99f6e4",
                  backgroundColor: "#e0f2f1",
                  color: "#1e293b",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>Password</label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                placeholder="Enter password"
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  marginTop: "6px",
                  borderRadius: "8px",
                  border: "1px solid #99f6e4",
                  backgroundColor: "#e0f2f1",
                  color: "#1e293b",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                placeholder="Confirm password"
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  marginTop: "6px",
                  borderRadius: "8px",
                  border: "1px solid #99f6e4",
                  backgroundColor: "#e0f2f1",
                  color: "#1e293b",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: "#fbbf24",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                marginTop: "10px",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p
            style={{
              marginTop: "24px",
              textAlign: "center",
              fontSize: "14px",
              color: "#475569",
            }}
          >
            Already have an account?{" "}
            <Link
              to="/login"
              style={{
                color: "#fbbf24",
                textDecoration: "none",
                fontWeight: "600",
              }}
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
