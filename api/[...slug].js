const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const app = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: '10mb' }));

const PORT = 5000;
const JWT_SECRET = process.env.JWT_SECRET || "taskflow_secret_key_2026";

// ===============================
// DATABASE CONNECTION & INITIALIZATION
// ===============================

// Use process.env.DATABASE_URL. Real PG is required for production.
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: connectionString && connectionString.includes('supabase') ? { rejectUnauthorized: false } : (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false)
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ Database connection error:", err.stack);
  } else {
    console.log("📦 Successfully connected to PostgreSQL Database");
    release();
  }
});

// Initialize Tables
async function initializeDB() {
  try {
    // Users Table
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
        avatar TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Projects Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'active',
        invite_token TEXT UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Project Members Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS project_members (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, user_id)
      )
    `);

    // Tasks Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'todo',
        priority TEXT DEFAULT 'medium',
        due_date TEXT,
        assigned_to TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Comments Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_name TEXT,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Team Members Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        role TEXT DEFAULT 'Member',
        department TEXT DEFAULT 'Engineering',
        status TEXT DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log("✅ PostgreSQL tables initialized successfully.");
  } catch (err) {
    console.error("❌ Error initializing PostgreSQL tables:", err);
  }
}

let dbInitPromise = null;
app.use(async (req, res, next) => {
  if (!dbInitPromise) {
    dbInitPromise = initializeDB();
  }
  try {
    await dbInitPromise;
  } catch (err) {
    console.error("DB Init error in middleware:", err);
  }
  next();
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
    
    const sql = `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, role`;
    const result = await pool.query(sql, [name, normalizedEmail, hashedPassword]);
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
  } catch (error) {
    console.error("Registration error:", error);
    if (error.code === '23505') { // Postgres unique violation error code
      return res.status(400).json({ error: "Email is already registered." });
    }
    res.status(500).json({ success: false, error: "Server error." });
  }
});

app.post(["/api/login", "/api/auth/login"], async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [normalizedEmail]);
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
  } catch (error) {
    res.status(500).json({ success: false, error: "Database error." });
  }
});

app.get(["/api/me", "/api/profile"], authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, bio, phone, location, avatar, created_at FROM users WHERE id = $1`,
      [req.user.id]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Database error." });
  }
});

app.put(["/api/me", "/api/profile"], authenticateToken, async (req, res) => {
  try {
    const { name, bio, phone, location, role, avatar } = req.body;
    const sql = `
      UPDATE users 
      SET name = COALESCE($1, name),
          bio = COALESCE($2, bio),
          phone = COALESCE($3, phone),
          location = COALESCE($4, location),
          role = COALESCE($5, role),
          avatar = COALESCE($6, avatar)
      WHERE id = $7
      RETURNING id, name, email, role, bio, phone, location, avatar
    `;

    const result = await pool.query(sql, [name, bio, phone, location, role, avatar, req.user.id]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to update profile." });
  }
});

// ===============================
// PROJECTS ROUTES
// ===============================

app.get("/api/projects", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*,
          (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as total_tasks,
          (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND LOWER(status) = 'completed') as completed_tasks
       FROM projects p
       LEFT JOIN project_members pm ON p.id = pm.project_id
       WHERE p.user_id = $1 OR pm.user_id = $2
       GROUP BY p.id
       ORDER BY p.id DESC`,
      [req.user.id, req.user.id]
    );
    
    // Postgres COUNT() returns strings (bigint), parse them for the frontend
    const projects = result.rows.map(p => ({
      ...p,
      total_tasks: parseInt(p.total_tasks || 0, 10),
      completed_tasks: parseInt(p.completed_tasks || 0, 10)
    }));
    
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/projects/:id", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.* FROM projects p
       LEFT JOIN project_members pm ON p.id = pm.project_id
       WHERE p.id = $1 AND (p.user_id = $2 OR pm.user_id = $3)`,
      [req.params.id, req.user.id, req.user.id]
    );
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: "Project not found or access denied." });
    res.json(row);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/projects/join", authenticateToken, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Invite token is required." });

    const result = await pool.query(`SELECT id, user_id FROM projects WHERE invite_token = $1`, [token]);
    const project = result.rows[0];
    
    if (!project) return res.status(404).json({ error: "Invalid invite link." });
    if (project.user_id === req.user.id) {
      return res.json({ success: true, message: "You are the owner of this project.", project });
    }

    try {
      await pool.query(
        `INSERT INTO project_members (project_id, user_id) VALUES ($1, $2)`,
        [project.id, req.user.id]
      );
      res.json({ success: true, message: "Successfully joined project.", project });
    } catch (insertError) {
      if (insertError.code === '23505') { // unique violation
        res.json({ success: true, message: "Successfully joined project.", project });
      } else {
        throw insertError;
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/projects", authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: "Project name is required." });

    const inviteToken = crypto.randomUUID();
    const sql = `INSERT INTO projects (user_id, name, description, status, invite_token) VALUES ($1, $2, $3, 'active', $4) RETURNING *`;
    
    const result = await pool.query(sql, [req.user.id, name, description || "", inviteToken]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/projects/:id", authenticateToken, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM projects WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    res.json({ success: true, message: "Project deleted." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// TASKS ROUTES
// ===============================

app.get("/api/tasks", authenticateToken, async (req, res) => {
  try {
    const { project_id } = req.query;
    let sql, params;
    
    if (project_id) {
      sql = `
        SELECT t.* FROM tasks t
        JOIN projects p ON t.project_id = p.id
        LEFT JOIN project_members pm ON p.id = pm.project_id
        WHERE t.project_id = $1 AND (p.user_id = $2 OR pm.user_id = $3)
        GROUP BY t.id
        ORDER BY t.id DESC
      `;
      params = [project_id, req.user.id, req.user.id];
    } else {
      sql = `
        SELECT t.* FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN project_members pm ON p.id = pm.project_id
        WHERE t.user_id = $1 OR p.user_id = $2 OR pm.user_id = $3
        GROUP BY t.id
        ORDER BY t.id DESC
      `;
      params = [req.user.id, req.user.id, req.user.id];
    }
    
    const result = await pool.query(sql, params);
    res.json(result.rows || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/tasks", authenticateToken, async (req, res) => {
  try {
    const { project_id, title, description, status, priority, due_date, assigned_to, created_at } = req.body;
    if (!title) return res.status(400).json({ error: "Task title is required." });

    if (project_id) {
      const accessCheck = await pool.query(
        `SELECT p.id FROM projects p LEFT JOIN project_members pm ON p.id = pm.project_id WHERE p.id = $1 AND (p.user_id = $2 OR pm.user_id = $3)`,
        [project_id, req.user.id, req.user.id]
      );
      if (!accessCheck.rows[0]) return res.status(403).json({ error: "Access denied to add tasks to this project." });
    }

    const sql = `
      INSERT INTO tasks (project_id, user_id, title, description, status, priority, due_date, assigned_to, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, CURRENT_TIMESTAMP))
      RETURNING *
    `;
    const result = await pool.query(sql, [
      project_id || null, req.user.id, title, description || "", status || "todo", priority || "medium", due_date || "", assigned_to || "", created_at || null
    ]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/tasks/:id", authenticateToken, async (req, res) => {
  try {
    const { title, description, status, priority, due_date, assigned_to } = req.body;
    const sql = `
      UPDATE tasks 
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          status = COALESCE($3, status),
          priority = COALESCE($4, priority),
          due_date = COALESCE($5, due_date),
          assigned_to = COALESCE($6, assigned_to)
      WHERE id = $7 AND user_id = $8
      RETURNING *
    `;

    const result = await pool.query(sql, [title, description, status, priority, due_date, assigned_to, req.params.id, req.user.id]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/tasks/:id", authenticateToken, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM tasks WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    res.json({ success: true, message: "Task deleted." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// COMMENTS ROUTES
// ===============================

app.get("/api/tasks/:id/comments", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM comments WHERE task_id = $1 ORDER BY id ASC`, [req.params.id]);
    res.json(result.rows || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/tasks/:id/comments", authenticateToken, async (req, res) => {
  try {
    const { content, created_at } = req.body;
    if (!content) return res.status(400).json({ error: "Comment content is required." });

    const sql = `INSERT INTO comments (task_id, user_id, user_name, content, created_at) VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_TIMESTAMP)) RETURNING *`;
    const result = await pool.query(sql, [req.params.id, req.user.id, req.user.name || "User", content, created_at || null]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// TEAM & ANALYTICS ROUTES
// ===============================

app.get("/api/team", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, phone, role, department, status FROM team_members WHERE user_id = $1`,
      [req.user.id]
    );
    res.json(result.rows || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/team", authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, role, department } = req.body;
    if (!name || !email) return res.status(400).json({ error: "Name and email are required." });

    const sql = `
      INSERT INTO team_members (user_id, name, email, phone, role, department, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'Active')
      RETURNING *
    `;
    const result = await pool.query(sql, [req.user.id, name, email, phone || "", role || "Member", department || "Engineering"]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/team/:id", authenticateToken, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM team_members WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    res.json({ success: true, message: "Member deleted." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/analytics", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM projects WHERE user_id = $1) as total_projects,
        (SELECT COUNT(*) FROM tasks WHERE user_id = $2) as total_tasks,
        (SELECT COUNT(*) FROM tasks WHERE user_id = $3 AND status = 'completed') as completed_tasks,
        (SELECT COUNT(*) FROM tasks WHERE user_id = $4 AND status != 'completed') as open_tasks
      `,
      [userId, userId, userId, userId]
    );
    
    const statsRow = result.rows[0];
    const total_projects = parseInt(statsRow.total_projects || 0, 10);
    const total_tasks = parseInt(statsRow.total_tasks || 0, 10);
    const completed_tasks = parseInt(statsRow.completed_tasks || 0, 10);
    const open_tasks = parseInt(statsRow.open_tasks || 0, 10);

    const velocity = total_tasks > 0
      ? Math.round((completed_tasks / total_tasks) * 100)
      : 0;

    res.json({ total_projects, total_tasks, completed_tasks, open_tasks, velocity: `${velocity}%` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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