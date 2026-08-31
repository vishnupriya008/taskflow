import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function JoinProject() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const [status, setStatus] = useState("Processing invite...");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing invite link.");
      return;
    }

    const authToken = localStorage.getItem("taskflow_token") || localStorage.getItem("token");
    if (!authToken) {
      // User is not logged in. Save token and redirect to login
      localStorage.setItem("pending_invite_token", token);
      navigate("/login");
      return;
    }

    // Join the project
    const joinProject = async () => {
      try {
        const response = await fetch("/api/projects/join", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus("Successfully joined! Redirecting...");
          setTimeout(() => {
            navigate(`/project/${data.project.id}`);
          }, 1500);
        } else {
          setError(data.error || "Failed to join project.");
        }
      } catch (err) {
        console.error("Error joining project:", err);
        setError("Network error occurred.");
      }
    };

    joinProject();
  }, [token, navigate]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#e0f2f1]">
        <div className="rounded-lg bg-[#ffffff] p-8 text-center shadow-lg">
          <h2 className="mb-4 text-2xl font-bold text-[#d97706]">Invite Error</h2>
          <p className="text-[#475569]">{error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-6 rounded bg-[#fbbf24] px-4 py-2 font-semibold text-[#ffffff] hover:bg-[#d97706]"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-[#e0f2f1]">
      <div className="rounded-lg bg-[#ffffff] p-8 text-center shadow-lg">
        <h2 className="mb-4 text-2xl font-bold text-[#1e293b]">Joining Project</h2>
        <p className="text-[#475569]">{status}</p>
        <div className="mx-auto mt-4 h-8 w-8 animate-spin rounded-full border-4 border-[#fbbf24] border-t-transparent"></div>
      </div>
    </div>
  );
}
