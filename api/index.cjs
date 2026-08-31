const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const crypto = require("crypto");

const app = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: '10mb' }));

const PORT = 5000;
const JWT_SECRET = process.env.JWT_SECRET || "taskflow_secret_key_2026";

// ===============================
// DATABASE CONNECTION & INITIALIZATION
// ===============================

const dbPath = process.env.NODE_ENV === 'production' 
  ? path.join('/tmp', 'taskflow.db') 
  : path.join(__dirname, "taskflow.db");

const db = new sqlite3.Database(
  dbPath,
  (err) => {
    if (err) {
      console.error("❌ Database connection error:", err);
    } else {
      console.log("📦 Connected to SQLite Database");
    }
  }
);

db.serialize(() => {
  // Users Table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'Member',
      bio TEXT,
      phone TEXT,
      location TEXT,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Safely add avatar column to existing users table
  db.run(`ALTER TABLE users ADD COLUMN avatar TEXT`, (err) => {
    // Ignore error if column already exists
  });

  // Projects Table
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'active',
      invite_token TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Try adding invite_token column to existing projects table (will fail silently if already exists)
  db.run(`ALTER TABLE projects ADD COLUMN invite_token TEXT`, (err) => {
    db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_invite_token ON projects(invite_token)`);
  });

  // Project Members Table (for collaborative access)
  db.run(`
    CREATE TABLE IF NOT EXISTS project_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(project_id, user_id)
    )
  `);

  // Tasks Table
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'todo',
      priority TEXT DEFAULT 'medium',
      due_date TEXT,
      assigned_to TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`ALTER TABLE tasks ADD COLUMN assigned_to TEXT`, (err) => {
    // Ignore error if column already exists
  });

  // Comments Table
  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      user_name TEXT,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Team Members Table
  db.run(`
    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      role TEXT DEFAULT 'Member',
      department TEXT DEFAULT 'Engineering',
      status TEXT DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
});

// ===============================
// AUTH MIDDLEWARE
// ===============================

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required." });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token." });
    }
    req.user = user;
    next();
  });
}

// ===============================
// AUTH & PROFILE ROUTES
// ===============================

app.post(["/api/register", "/api/auth/register"], async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`;

    db.run(sql, [name, normalizedEmail, hashedPassword], function (err) {
      if (err) {
        if (err.message.includes("UNIQUE")) {
          return res.status(400).json({ error: "Email is already registered." });
        }
        return res.status(500).json({ error: "Database error." });
      }

      const token = jwt.sign(
        { id: this.lastID, email: normalizedEmail, name },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.status(201).json({
        success: true,
        token,
        user: { id: this.lastID, name, email: normalizedEmail, role: "Member" }
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error." });
  }
});

app.post(["/api/login", "/api/auth/login"], (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: "Email and password are required." });
  }

  const normalizedEmail = email.trim().toLowerCase();

  db.get(`SELECT * FROM users WHERE email = ?`, [normalizedEmail], async (err, user) => {
    if (err) return res.status(500).json({ success: false, error: "Database error." });
    if (!user) return res.status(401).json({ success: false, error: "Invalid email or password." });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, error: "Invalid email or password." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        phone: user.phone,
        location: user.location
      }
    });
  });
});

app.get(["/api/me", "/api/profile"], authenticateToken, (req, res) => {
  db.get(
    `SELECT id, name, email, role, bio, phone, location, avatar, created_at FROM users WHERE id = ?`,
    [req.user.id],
    (err, user) => {
      if (err) return res.status(500).json({ error: "Database error." });
      if (!user) return res.status(404).json({ error: "User not found." });
      res.json(user);
    }
  );
});

app.put(["/api/me", "/api/profile"], authenticateToken, (req, res) => {
  const { name, bio, phone, location, role, avatar } = req.body;
  const sql = `
    UPDATE users 
    SET name = COALESCE(?, name),
        bio = COALESCE(?, bio),
        phone = COALESCE(?, phone),
        location = COALESCE(?, location),
        role = COALESCE(?, role),
        avatar = COALESCE(?, avatar)
    WHERE id = ?
  `;

  db.run(sql, [name, bio, phone, location, role, avatar, req.user.id], function (err) {
    if (err) return res.status(500).json({ error: "Failed to update profile." });
    db.get(
      `SELECT id, name, email, role, bio, phone, location, avatar FROM users WHERE id = ?`,
      [req.user.id],
      (err, updatedUser) => res.json(updatedUser)
    );
  });
});

// ===============================
// PROJECTS ROUTES
// ===============================

app.get("/api/projects", authenticateToken, (req, res) => {
  db.all(
    `SELECT p.*,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as total_tasks,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND LOWER(status) = 'completed') as completed_tasks
     FROM projects p
     LEFT JOIN project_members pm ON p.id = pm.project_id
     WHERE p.user_id = ? OR pm.user_id = ?
     GROUP BY p.id
     ORDER BY p.id DESC`,
    [req.user.id, req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows || []);
    }
  );
});

app.get("/api/projects/:id", authenticateToken, (req, res) => {
  db.get(
    `SELECT p.* FROM projects p
     LEFT JOIN project_members pm ON p.id = pm.project_id
     WHERE p.id = ? AND (p.user_id = ? OR pm.user_id = ?)`,
    [req.params.id, req.user.id, req.user.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Project not found or access denied." });
      res.json(row);
    }
  );
});

app.post("/api/projects/join", authenticateToken, (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Invite token is required." });

  db.get(`SELECT id, user_id FROM projects WHERE invite_token = ?`, [token], (err, project) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!project) return res.status(404).json({ error: "Invalid invite link." });

    if (project.user_id === req.user.id) {
      return res.json({ success: true, message: "You are the owner of this project.", project });
    }

    db.run(
      `INSERT INTO project_members (project_id, user_id) VALUES (?, ?)`,
      [project.id, req.user.id],
      function (err) {
        if (err && err.code !== 'SQLITE_CONSTRAINT') {
          return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, message: "Successfully joined project.", project });
      }
    );
  });
});

app.post("/api/projects", authenticateToken, (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: "Project name is required." });

  const inviteToken = crypto.randomUUID();
  const sql = `INSERT INTO projects (user_id, name, description, status, invite_token) VALUES (?, ?, ?, 'active', ?)`;
  db.run(sql, [req.user.id, name, description || "", inviteToken], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({
      id: this.lastID,
      user_id: req.user.id,
      name,
      description: description || "",
      status: "active",
      invite_token: inviteToken
    });
  });
});

app.delete("/api/projects/:id", authenticateToken, (req, res) => {
  db.run(
    `DELETE FROM projects WHERE id = ? AND user_id = ?`,
    [req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: "Project deleted." });
    }
  );
});

// ===============================
// TASKS ROUTES
// ===============================

app.get("/api/tasks", authenticateToken, (req, res) => {
  const { project_id } = req.query;
  
  if (project_id) {
    const sql = `
      SELECT t.* FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE t.project_id = ? AND (p.user_id = ? OR pm.user_id = ?)
      GROUP BY t.id
      ORDER BY t.id DESC
    `;
    db.all(sql, [project_id, req.user.id, req.user.id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows || []);
    });
  } else {
    const sql = `
      SELECT t.* FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE t.user_id = ? OR p.user_id = ? OR pm.user_id = ?
      GROUP BY t.id
      ORDER BY t.id DESC
    `;
    db.all(sql, [req.user.id, req.user.id, req.user.id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows || []);
    });
  }
});

app.post("/api/tasks", authenticateToken, (req, res) => {
  const { project_id, title, description, status, priority, due_date, assigned_to, created_at } = req.body;
  if (!title) return res.status(400).json({ error: "Task title is required." });

  const insertTask = () => {
    const sql = `
      INSERT INTO tasks (project_id, user_id, title, description, status, priority, due_date, assigned_to, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now', 'localtime')))
    `;
    db.run(
      sql,
      [project_id || null, req.user.id, title, description || "", status || "todo", priority || "medium", due_date || "", assigned_to || "", created_at || null],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({
          id: this.lastID,
          project_id: project_id || null,
          user_id: req.user.id,
          title,
          description: description || "",
          status: status || "todo",
          priority: priority || "medium",
          due_date: due_date || "",
          assigned_to: assigned_to || "",
          created_at: created_at || new Date().toLocaleString()
        });
      }
    );
  };

  if (project_id) {
    db.get(
      `SELECT p.id FROM projects p LEFT JOIN project_members pm ON p.id = pm.project_id WHERE p.id = ? AND (p.user_id = ? OR pm.user_id = ?)`,
      [project_id, req.user.id, req.user.id],
      (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(403).json({ error: "Access denied to add tasks to this project." });
        insertTask();
      }
    );
  } else {
    insertTask();
  }
});

app.put("/api/tasks/:id", authenticateToken, (req, res) => {
  const { title, description, status, priority, due_date, assigned_to } = req.body;
  const sql = `
    UPDATE tasks 
    SET title = COALESCE(?, title),
        description = COALESCE(?, description),
        status = COALESCE(?, status),
        priority = COALESCE(?, priority),
        due_date = COALESCE(?, due_date),
        assigned_to = COALESCE(?, assigned_to)
    WHERE id = ? AND user_id = ?
  `;

  db.run(
    sql,
    [title, description, status, priority, due_date, assigned_to, req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get(`SELECT * FROM tasks WHERE id = ?`, [req.params.id], (err, row) => {
        res.json(row);
      });
    }
  );
});

app.delete("/api/tasks/:id", authenticateToken, (req, res) => {
  db.run(
    `DELETE FROM tasks WHERE id = ? AND user_id = ?`,
    [req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: "Task deleted." });
    }
  );
});

// ===============================
// COMMENTS ROUTES
// ===============================

app.get("/api/tasks/:id/comments", authenticateToken, (req, res) => {
  db.all(
    `SELECT * FROM comments WHERE task_id = ? ORDER BY id ASC`,
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows || []);
    }
  );
});

app.post("/api/tasks/:id/comments", authenticateToken, (req, res) => {
  const { content, created_at } = req.body;
  if (!content) return res.status(400).json({ error: "Comment content is required." });

  const sql = `INSERT INTO comments (task_id, user_id, user_name, content, created_at) VALUES (?, ?, ?, ?, COALESCE(?, datetime('now', 'localtime')))`;
  db.run(sql, [req.params.id, req.user.id, req.user.name || "User", content, created_at || null], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    
    // Fetch the newly inserted comment to return the correct local timestamp
    db.get(`SELECT * FROM comments WHERE id = ?`, [this.lastID], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json(row);
    });
  });
});

// ===============================
// TEAM & ANALYTICS ROUTES
// ===============================

app.get("/api/team", authenticateToken, (req, res) => {
  db.all(
    `SELECT id, name, email, phone, role, department, status FROM team_members WHERE user_id = ?`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows || []);
    }
  );
});

app.post("/api/team", authenticateToken, (req, res) => {
  const { name, email, phone, role, department } = req.body;
  if (!name || !email) return res.status(400).json({ error: "Name and email are required." });

  const sql = `
    INSERT INTO team_members (user_id, name, email, phone, role, department, status)
    VALUES (?, ?, ?, ?, ?, ?, 'Active')
  `;
  db.run(
    sql,
    [req.user.id, name, email, phone || "", role || "Member", department || "Engineering"],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({
        id: this.lastID,
        name,
        email,
        phone,
        role: role || "Member",
        department: department || "Engineering",
        status: "Active"
      });
    }
  );
});

app.delete("/api/team/:id", authenticateToken, (req, res) => {
  db.run(
    `DELETE FROM team_members WHERE id = ? AND user_id = ?`,
    [req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: "Member deleted." });
    }
  );
});

app.get("/api/analytics", authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.get(
    `SELECT 
      (SELECT COUNT(*) FROM projects WHERE user_id = ?) as total_projects,
      (SELECT COUNT(*) FROM tasks WHERE user_id = ?) as total_tasks,
      (SELECT COUNT(*) FROM tasks WHERE user_id = ? AND status = 'completed') as completed_tasks,
      (SELECT COUNT(*) FROM tasks WHERE user_id = ? AND status != 'completed') as open_tasks
    `,
    [userId, userId, userId, userId],
    (err, stats) => {
      if (err) return res.status(500).json({ error: err.message });
      const velocity = stats.total_tasks > 0
        ? Math.round((stats.completed_tasks / stats.total_tasks) * 100)
        : 0;

      res.json({ ...stats, velocity: `${velocity}%` });
    }
  );
});

// ===============================
// START SERVER
// ===============================

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;