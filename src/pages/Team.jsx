import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function Team() {
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const getToken = () => localStorage.getItem("taskflow_token") || localStorage.getItem("token");

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/team`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await response.json();
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching team members:", err);
    } finally {
      setLoading(false);
    }
  };

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [invitedMember, setInvitedMember] = useState(null);

  const addMember = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) return;

    const newMemberPayload = {
      name,
      email,
      phone: phone || "Not provided",
      role: role || "Team Member",
      department: "General",
      project: "Unassigned",
      status: "Online",
    };

    try {
      const response = await fetch(`${API_BASE_URL}/team`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMemberPayload),
      });

      if (response.ok) {
        const addedMember = await response.json();
        setMembers([...members, addedMember]);
        setName("");
        setEmail("");
        setPhone("");
        setRole("");
        setInvitedMember(addedMember);
      } else {
        console.error("Failed to add member");
      }
    } catch (err) {
      console.error("Failed to add team member", err);
    }
  };

  const deleteMember = async (id) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/team/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (response.ok) {
        setMembers(members.filter((m) => m.id !== id));
      } else {
        console.error("Failed to delete member");
      }
    } catch (err) {
      console.error("Error deleting member:", err);
    }
  };

  const handleWhatsAppShare = () => {
    if (!invitedMember) return;
    const inviteLink = `${window.location.origin}/join?email=${encodeURIComponent(invitedMember.email)}`;
    const text = `Hi ${invitedMember.name}, you've been invited to join our workspace on TaskFlow as a ${invitedMember.role}! Click here to join: ${inviteLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
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
          <span style={{ color: "#475569", fontSize: "13px" }}>
            Team Workspace
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
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "40px 24px",
        }}
      >
        {/* TITLE */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
          }}
        >
          <div>
            <p
              style={{
                color: "#fbbf24",
                fontWeight: "700",
                fontSize: "14px",
                marginBottom: "6px",
              }}
            >
              TEAM MANAGEMENT
            </p>

            <h1 style={{ fontSize: "32px", margin: "0 0 8px" }}>
              Team Members
            </h1>

            <p style={{ color: "#475569", margin: 0 }}>
              Manage your team and view member information.
            </p>
          </div>

          <button
            onClick={() => {
              setShowForm(!showForm);
              setInvitedMember(null);
            }}
            style={{
              background: "#fbbf24",
              color: "#ffffff",
              border: "none",
              padding: "12px 20px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            {showForm ? "Cancel Invite" : "+ Invite Member"}
          </button>
        </div>

        {/* SUMMARY */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "18px",
            marginBottom: "30px",
          }}
        >
          <div style={summaryCard}>
            <span style={label}>Total Members</span>
            <strong style={number}>{members.length}</strong>
          </div>

          <div style={summaryCard}>
            <span style={label}>Online</span>
            <strong style={{ ...number, color: "#16a34a" }}>
              {members.filter((m) => m.status === "Online").length}
            </strong>
          </div>

          <div style={summaryCard}>
            <span style={label}>Departments</span>
            <strong style={{ ...number, color: "#2563eb" }}>
              {new Set(members.map((m) => m.department)).size}
            </strong>
          </div>
        </div>

        {/* INVITE FORM OR SUCCESS */}
        {showForm && (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #99f6e4",
              borderRadius: "12px",
              padding: "22px",
              marginBottom: "25px",
            }}
          >
            {invitedMember ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: "0 0 8px", color: "#16a34a" }}>✓ Member Added!</h3>
                  <p style={{ margin: 0, color: "#475569" }}>
                    Share this link with {invitedMember.name}: 
                    <br />
                    <code style={{ background: "#e0f2f1", padding: "4px 8px", borderRadius: "4px", display: "inline-block", marginTop: "8px" }}>
                      {window.location.origin}/join?email={invitedMember.email}
                    </code>
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={handleWhatsAppShare}
                    style={{
                      background: "#25D366",
                      color: "#ffffff",
                      border: "none",
                      padding: "10px 16px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    📱 Share via WhatsApp
                  </button>
                  <button
                    onClick={() => {
                      setInvitedMember(null);
                      setShowForm(false);
                    }}
                    style={{
                      background: "#e2e8f0",
                      color: "#1e293b",
                      border: "none",
                      padding: "10px 16px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={addMember}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  alignItems: "center",
                }}
              >
                <input
                  type="text"
                  placeholder="Member name *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={inputStyle}
                />

                <input
                  type="email"
                  placeholder="Email address *"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={inputStyle}
                />
                
                <input
                  type="text"
                  placeholder="Phone number (optional)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={inputStyle}
                />

                <input
                  type="text"
                  placeholder="Role (e.g. Developer)"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={inputStyle}
                />

                <button
                  type="submit"
                  style={{
                    gridColumn: "1 / -1",
                    background: "#16a34a",
                    color: "#ffffff",
                    border: "none",
                    padding: "12px 18px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    marginTop: "8px"
                  }}
                >
                  Save & Invite
                </button>
              </form>
            )}
          </div>
        )}

        {/* TEAM GRID */}
        {loading ? (
          <p style={{ color: "#475569", textAlign: "center" }}>Loading team members...</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "20px",
            }}
          >
            {members.map((member) => (
            <div
              key={member.id}
              style={{
                background: "#ffffff",
                border: "1px solid #99f6e4",
                borderRadius: "14px",
                padding: "24px",
                boxShadow: "0 3px 12px rgba(15,23,42,0.05)",
              }}
            >
              {/* PROFILE HEADER */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    background: "#fbbf24",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "700",
                    fontSize: "19px",
                  }}
                >
                  {member.name ? member.name.charAt(0).toUpperCase() : "?"}
                </div>

                <div style={{ flex: 1 }}>
                  <h2
                    style={{
                      margin: "0 0 4px",
                      fontSize: "19px",
                    }}
                  >
                    {member.name}
                  </h2>

                  <p
                    style={{
                      margin: 0,
                      color: "#475569",
                      fontSize: "14px",
                    }}
                  >
                    {member.role}
                  </p>
                </div>

                <span
                  style={{
                    background:
                      member.status === "Online"
                        ? "#dcfce7"
                        : member.status === "Away"
                        ? "#fef3c7"
                        : "#f1f5f9",
                    color:
                      member.status === "Online"
                        ? "#15803d"
                        : member.status === "Away"
                        ? "#d97706"
                        : "#64748b",
                    padding: "6px 10px",
                    borderRadius: "20px",
                    fontSize: "11px",
                    fontWeight: "700",
                  }}
                >
                  ● {member.status}
                </span>
              </div>

              {/* DETAILS */}
              <div
                style={{
                  borderTop: "1px solid #e2e8f0",
                  paddingTop: "18px",
                  display: "grid",
                  gap: "13px",
                }}
              >
                <div>
                  <small style={detailLabel}>EMAIL</small>
                  <p style={detailValue}>✉ {member.email}</p>
                </div>

                <div>
                  <small style={detailLabel}>PHONE</small>
                  <p style={detailValue}>☎ {member.phone}</p>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "15px",
                  }}
                >
                  <div>
                    <small style={detailLabel}>DEPARTMENT</small>
                    <p style={detailValue}>🏢 {member.department}</p>
                  </div>

                  <div>
                    <small style={detailLabel}>PROJECT</small>
                    <p style={detailValue}>📁 {member.project}</p>
                  </div>
                </div>
              </div>

              {/* BUTTONS */}
              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button
                  onClick={() =>
                    alert(
                      `Profile: ${member.name}\nEmail: ${member.email}\nPhone: ${member.phone}`
                    )
                  }
                  style={{
                    flex: 1,
                    padding: "11px",
                    background: "#e0f2f1",
                    color: "#fbbf24",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "700",
                  }}
                >
                  View Profile
                </button>

                <button
                  onClick={() => deleteMember(member.id)}
                  style={{
                    padding: "11px 16px",
                    background: "#fee2e2",
                    color: "#dc2626",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "700",
                  }}
                  title="Remove Member"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
        )}
      </main>
    </div>
  );
}

const summaryCard = {
  background: "#ffffff",
  border: "1px solid #99f6e4",
  borderRadius: "12px",
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const label = {
  color: "#475569",
  fontSize: "13px",
  fontWeight: "600",
};

const number = {
  fontSize: "28px",
  color: "#fbbf24",
};

const inputStyle = {
  flex: 1,
  padding: "12px",
  border: "1px solid #99f6e4",
  borderRadius: "8px",
  fontSize: "14px",
};

const detailLabel = {
  color: "#475569",
  fontSize: "10px",
  fontWeight: "700",
  letterSpacing: "0.5px",
};

const detailValue = {
  margin: "4px 0 0",
  color: "#1e293b",
  fontSize: "14px",
  fontWeight: "500",
};
