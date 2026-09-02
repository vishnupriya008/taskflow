const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL || "https://codealpha-pm-tool.vercel.app"
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "taskflow_secret_key_2026";

// ===============================
// DATABASE CONNECTION & INITIALIZATION
// ===============================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ Database connection error:", err);
  } else {
    console.log("📦 Connected to PostgreSQL Database");
    release();
  }
});

const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'Member',
        bio TEXT,
        phone TEXT,
        location TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        project_id INTEGER,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'todo',
        priority TEXT DEFAULT 'medium',
        due_date TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        user_name TEXT,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        role TEXT DEFAULT 'Member',
        department TEXT DEFAULT 'Engineering',
        status TEXT DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log("✅ PostgreSQL tables initialized");
  } catch (error) {
    console.error("❌ Error initializing tables:", error);
  }
};

initDB();

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

    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, role`;

    pool.query(sql, [name, email, hashedPassword], (err, result) => {
      if (err) {
        if (err.code === "23505") { // PostgreSQL unique violation code
          return res.status(400).json({ error: "Email is already registered." });
        }
        console.error(err);
        return res.status(500).json({ error: "Database error." });
      }

      const user = result.rows[0];
      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.status(201).json({
        success: true,
        token,
        user
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server error." });
  }
});

app.post(["/api/login", "/api/auth/login"], (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: "Email and password are required." });
  }

  pool.query(`SELECT * FROM users WHERE email = $1`, [email], async (err, result) => {
    if (err) return res.status(500).json({ success: false, error: "Database error." });
    
    const user = result.rows[0];
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
  pool.query(
    `SELECT id, name, email, role, bio, phone, location, created_at FROM users WHERE id = $1`,
    [req.user.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Database error." });
      const user = result.rows[0];
      if (!user) return res.status(404).json({ error: "User not found." });
      res.json(user);
    }
  );
});

app.put(["/api/me", "/api/profile"], authenticateToken, (req, res) => {
  const { name, bio, phone, location, role } = req.body;
  const sql = `
    UPDATE users 
    SET name = COALESCE($1, name),
        bio = COALESCE($2, bio),
        phone = COALESCE($3, phone),
        location = COALESCE($4, location),
        role = COALESCE($5, role)
    WHERE id = $6
    RETURNING id, name, email, role, bio, phone, location
  `;

  pool.query(sql, [name, bio, phone, location, role, req.user.id], (err, result) => {
    if (err) return res.status(500).json({ error: "Failed to update profile." });
    res.json(result.rows[0]);
  });
});

// ===============================
// PROJECTS ROUTES
// ===============================

app.get("/api/projects", authenticateToken, (req, res) => {
  pool.query(
    `SELECT * FROM projects WHERE user_id = $1 ORDER BY id DESC`,
    [req.user.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result.rows || []);
    }
  );
});

app.post("/api/projects", authenticateToken, (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: "Project name is required." });

  const sql = `INSERT INTO projects (user_id, name, description, status) VALUES ($1, $2, $3, 'active') RETURNING *`;
  pool.query(sql, [req.user.id, name, description || ""], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json(result.rows[0]);
  });
});

app.delete("/api/projects/:id", authenticateToken, (req, res) => {
  pool.query(
    `DELETE FROM projects WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.user.id],
    (err, result) => {
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
  let sql = `SELECT * FROM tasks WHERE user_id = $1`;
  const params = [req.user.id];

  if (project_id) {
    sql += ` AND project_id = $2`;
    params.push(project_id);
  }
  sql += ` ORDER BY id DESC`;

  pool.query(sql, params, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result.rows || []);
  });
});

app.post("/api/tasks", authenticateToken, (req, res) => {
  const { project_id, title, description, status, priority, due_date, created_at } = req.body;
  if (!title) return res.status(400).json({ error: "Task title is required." });

  const sql = `
    INSERT INTO tasks (project_id, user_id, title, description, status, priority, due_date, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, NOW()))
    RETURNING *
  `;
  pool.query(
    sql,
    [
      project_id || null,
      req.user.id,
      title,
      description || "",
      status || "todo",
      priority || "medium",
      due_date || "",
      created_at || null
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json(result.rows[0]);
    }
  );
});

app.put("/api/tasks/:id", authenticateToken, (req, res) => {
  const { title, description, status, priority, due_date } = req.body;
  const sql = `
    UPDATE tasks 
    SET title = COALESCE($1, title),
        description = COALESCE($2, description),
        status = COALESCE($3, status),
        priority = COALESCE($4, priority),
        due_date = COALESCE($5, due_date)
    WHERE id = $6 AND user_id = $7
    RETURNING *
  `;

  pool.query(
    sql,
    [title, description, status, priority, due_date, req.params.id, req.user.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result.rows[0]);
    }
  );
});

app.delete("/api/tasks/:id", authenticateToken, (req, res) => {
  pool.query(
    `DELETE FROM tasks WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.user.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: "Task deleted." });
    }
  );
});

// ===============================
// COMMENTS ROUTES
// ===============================

app.get("/api/tasks/:id/comments", authenticateToken, (req, res) => {
  pool.query(
    `SELECT * FROM comments WHERE task_id = $1 ORDER BY id ASC`,
    [req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result.rows || []);
    }
  );
});

app.post("/api/tasks/:id/comments", authenticateToken, (req, res) => {
  const { content, created_at } = req.body;
  if (!content) return res.status(400).json({ error: "Comment content is required." });

  const sql = `INSERT INTO comments (task_id, user_id, user_name, content, created_at) VALUES ($1, $2, $3, $4, COALESCE($5, NOW())) RETURNING *`;
  pool.query(sql, [req.params.id, req.user.id, req.user.name || "User", content, created_at || null], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json(result.rows[0]);
  });
});

// ===============================
// TEAM & ANALYTICS ROUTES
// ===============================

app.get("/api/team", authenticateToken, (req, res) => {
  pool.query(
    `SELECT id, name, email, phone, role, department, status FROM team_members WHERE user_id = $1`,
    [req.user.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result.rows || []);
    }
  );
});

app.post("/api/team", authenticateToken, (req, res) => {
  const { name, email, phone, role, department } = req.body;
  if (!name || !email) return res.status(400).json({ error: "Name and email are required." });

  const sql = `
    INSERT INTO team_members (user_id, name, email, phone, role, department, status)
    VALUES ($1, $2, $3, $4, $5, $6, 'Active')
    RETURNING *
  `;
  pool.query(
    sql,
    [req.user.id, name, email, phone || "", role || "Member", department || "Engineering"],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json(result.rows[0]);
    }
  );
});

app.get("/api/analytics", authenticateToken, (req, res) => {
  const userId = req.user.id;

  pool.query(
    `SELECT 
      (SELECT COUNT(*) FROM projects WHERE user_id = $1) as total_projects,
      (SELECT COUNT(*) FROM tasks WHERE user_id = $2) as total_tasks,
      (SELECT COUNT(*) FROM tasks WHERE user_id = $3 AND status = 'completed') as completed_tasks,
      (SELECT COUNT(*) FROM tasks WHERE user_id = $4 AND status != 'completed') as open_tasks
    `,
    [userId, userId, userId, userId],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      const stats = result.rows[0];
      
      const total_tasks = parseInt(stats.total_tasks, 10) || 0;
      const completed_tasks = parseInt(stats.completed_tasks, 10) || 0;
      const open_tasks = parseInt(stats.open_tasks, 10) || 0;
      const total_projects = parseInt(stats.total_projects, 10) || 0;

      const velocity = total_tasks > 0
        ? Math.round((completed_tasks / total_tasks) * 100)
        : 0;

      res.json({
        total_projects,
        total_tasks,
        completed_tasks,
        open_tasks,
        velocity: `${velocity}%`
      });
    }
  );
});

// ===============================
// START SERVER
// ===============================

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});