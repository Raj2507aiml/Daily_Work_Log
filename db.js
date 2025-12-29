const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./worklog.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS worklog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task TEXT NOT NULL,
    hours REAL NOT NULL,
    date TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
});

console.log("SQLite database ready");

module.exports = db;
