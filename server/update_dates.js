const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('c:/Users/dolavishnupriya/OneDrive/Desktop/project/CodeAlpha-ProjectManagementTool/server/taskflow.db');

db.serialize(() => {
  db.run("UPDATE tasks SET created_at = datetime(created_at, '+5 hours', '+30 minutes') WHERE created_at LIKE '2026-08-30%'");
  db.run("UPDATE comments SET created_at = datetime(created_at, '+5 hours', '+30 minutes') WHERE created_at LIKE '2026-08-30%'");
  console.log('Updated tasks');
});
