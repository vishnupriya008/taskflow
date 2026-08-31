import React, { useState, useEffect } from "react";

export default function Profile() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    role: "",
    bio: "",
    avatar: "",
  });

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const getToken = () => localStorage.getItem("taskflow_token") || localStorage.getItem("token");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/me", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await response.json();
      if (data.id) {
        setProfile({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          location: data.location || "",
          role: data.role || "",
          bio: data.bio || "",
          avatar: data.avatar || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/me", {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(profile)
      });
      const data = await response.json();
      if (data.id) { // Backend returns the updated user object directly
        setMessage("Profile updated successfully!");
        setEditing(false);
        localStorage.setItem("taskflow_user", JSON.stringify(data));
        setTimeout(() => setMessage(""), 3000);
      } else if (data.success) { // Fallback if it returns {success: true}
        setMessage("Profile updated successfully!");
        setEditing(false);
        if (data.user) localStorage.setItem("taskflow_user", JSON.stringify(data.user));
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage("Failed to save profile.");
    }
  };

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#e0f2f1",
        fontFamily: "system-ui, sans-serif",
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
        <h2>✓ TaskFlow</h2>

        <button
          onClick={() => window.history.back()}
          style={{
            background: "#99f6e4",
            color: "#ffffff",
            border: "none",
            padding: "10px 16px",
            borderRadius: "7px",
            cursor: "pointer",
          }}
        >
          ← Back
        </button>
      </header>

      {/* CONTENT */}
      <main
        style={{
          maxWidth: "1000px",
          margin: "35px auto",
          padding: "0 20px",
        }}
      >
        <h1 style={{ color: "#1e293b", marginBottom: "6px" }}>
          My Profile
        </h1>

        <p style={{ color: "#475569", marginBottom: "15px" }}>
          Manage your personal information and account details.
        </p>

        {message && (
          <div style={{ padding: "10px", marginBottom: "15px", background: "#dcfce7", color: "#16a34a", borderRadius: "8px" }}>
            {message}
          </div>
        )}

        <div
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            overflow: "hidden",
            boxShadow: "0 8px 30px rgba(15,23,42,0.08)",
          }}
        >
          {/* PROFILE TOP */}
          <div
            style={{
              background: "linear-gradient(135deg,#fbbf24,#7c3aed)",
              height: "150px",
            }}
          />

          <div style={{ padding: "0 35px 35px" }}>
            {/* PHOTO */}
            <div
              style={{
                marginTop: "-65px",
                display: "flex",
                alignItems: "end",
                gap: "20px",
              }}
            >
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt="Profile"
                  style={{
                    width: "130px",
                    height: "130px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "5px solid #ffffff",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "130px",
                    height: "130px",
                    borderRadius: "50%",
                    background: "#e0e7ff",
                    border: "5px solid #ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "45px",
                    fontWeight: "bold",
                    color: "#fbbf24",
                  }}
                >
                  V
                </div>
              )}

              <div style={{ paddingBottom: "12px" }}>
                <h2 style={{ margin: 0, color: "#1e293b" }}>
                  {profile.name}
                </h2>

                <p style={{ margin: "5px 0", color: "#475569" }}>
                  {profile.role}
                </p>
              </div>
            </div>

            {/* UPLOAD */}
            <div style={{ marginTop: "20px" }}>
              <label
                style={{
                  display: "inline-block",
                  background: "#eef2ff",
                  color: "#fbbf24",
                  padding: "9px 14px",
                  borderRadius: "7px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                📷 Upload Profile Picture
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImage}
                  style={{ display: "none" }}
                />
              </label>
            </div>

            {/* DETAILS */}
            <div
              style={{
                marginTop: "30px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "22px",
              }}
            >
              <div>
                <label>Full Name</label>
                <input
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  disabled={!editing}
                />
              </div>

              <div>
                <label>Email Address</label>
                <input
                  name="email"
                  value={profile.email}
                  onChange={handleChange}
                  disabled={!editing}
                />
              </div>

              <div>
                <label>Mobile Number</label>
                <input
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  disabled={!editing}
                />
              </div>

              <div>
                <label>Location</label>
                <input
                  name="location"
                  value={profile.location}
                  onChange={handleChange}
                  disabled={!editing}
                />
              </div>

              <div>
                <label>Role</label>
                <input
                  name="role"
                  value={profile.role}
                  onChange={handleChange}
                  disabled={!editing}
                />
              </div>
            </div>

            {/* BIO */}
            <div style={{ marginTop: "22px" }}>
              <label>About Me</label>

              <textarea
                name="bio"
                value={profile.bio}
                onChange={handleChange}
                disabled={!editing}
                rows="4"
              />
            </div>

            {/* BUTTONS */}
            <div
              style={{
                marginTop: "25px",
                display: "flex",
                gap: "12px",
              }}
            >
              <button
                onClick={() => {
                  if (editing) {
                    saveProfile();
                  } else {
                    setEditing(true);
                  }
                }}
                style={{
                  background: "#fbbf24",
                  color: "#1e293b",
                  border: "none",
                  padding: "12px 22px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                {editing ? "Save Changes" : "Edit Profile"}
              </button>

              <button
                onClick={() => window.history.back()}
                style={{
                  background: "#ffffff",
                  color: "#1e293b",
                  border: "1px solid #99f6e4",
                  padding: "12px 22px",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* INPUT STYLES */}
      <style>
        {`
          label {
            display: block;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 7px;
          }

          input, textarea {
            width: 100%;
            box-sizing: border-box;
            padding: 12px;
            border: 1px solid #99f6e4;
            border-radius: 8px;
            font-size: 14px;
            font-family: inherit;
            background: #ffffff;
            color: #1e293b;
          }

          input:disabled,
          textarea:disabled {
            background: #e0f2f1;
            color: #475569;
          }

          @media (max-width: 700px) {
            main div[style*="grid-template-columns"] {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>
    </div>
  );
}