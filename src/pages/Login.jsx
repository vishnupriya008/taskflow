import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.error || data.message || "Invalid email or password.");
        setLoading(false);
        return;
      }

      // Save JWT token under both key names for compatibility
      localStorage.setItem("token", data.token);
      localStorage.setItem("taskflow_token", data.token);

      // Save logged-in user details
      localStorage.setItem("taskflow_user", JSON.stringify(data.user));

      alert("Login successful!");

      const pendingInviteToken = localStorage.getItem("pending_invite_token");
      if (pendingInviteToken) {
        localStorage.removeItem("pending_invite_token");
        navigate(`/join?token=${pendingInviteToken}`);
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);

      setErrorMessage(
        "Cannot connect to the backend. Make sure node index.js is running."
      );
    }

    setLoading(false);
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
          WELCOME BACK
        </span>

        <h1
          style={{
            fontSize: "48px",
            color: "#1e293b",
            margin: "16px 0",
            lineHeight: 1.2,
          }}
        >
          Log in to continue managing your workspace.
        </h1>

        <p
          style={{
            color: "#475569",
            fontSize: "18px",
            maxWidth: "480px",
          }}
        >
          Track tasks, coordinate with team members, and keep your projects
          running smoothly.
        </p>
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
            Sign in to TaskFlow
          </h2>

          <p
            style={{
              color: "#475569",
              fontSize: "14px",
              marginBottom: "20px",
            }}
          >
            Enter your credentials to access your account.
          </p>

          {/* ERROR */}
          {errorMessage && (
            <div
              style={{
                backgroundColor: "#fef2f2",
                color: "#dc2626",
                padding: "10px",
                borderRadius: "6px",
                fontSize: "14px",
                marginBottom: "16px",
              }}
            >
              {errorMessage}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {/* EMAIL */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#1e293b",
                  marginBottom: "6px",
                }}
              >
                Email Address
              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                required
                placeholder="your.email@example.com"
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  border: "1px solid #99f6e4",
                  backgroundColor: "#e0f2f1",
                  color: "#1e293b",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#1e293b",
                  marginBottom: "6px",
                }}
              >
                Password
              </label>

              <input
                type="password"
                name="password"
                value={formData.password}
                required
                placeholder="••••••••"
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  border: "1px solid #99f6e4",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            {/* LOGIN BUTTON */}
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
              }}
            >
              {loading ? "Logging in..." : "Log In"}
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
            Don't have an account?{" "}
            <Link
              to="/register"
              style={{
                color: "#fbbf24",
                textDecoration: "none",
                fontWeight: "600",
              }}
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
