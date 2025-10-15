// =======================================================
// 📄 File: config/database.js
// Purpose: Central SQLite connection + async helpers
// =======================================================

const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const dbPath = path.join(__dirname, "..", "shop.db");

// Single shared DB instance
const db = new sqlite3.Database(dbPath);

// --- Async helper wrappers ---
function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}

// --- Initialize required tables on load ---
(async () => {
  await runAsync(`CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      lang TEXT DEFAULT 'en'
    )`);

  await runAsync(`CREATE TABLE IF NOT EXISTS cart (
      user_id TEXT,
      product_name TEXT,
      price REAL,
      quantity INTEGER,
      PRIMARY KEY(user_id, product_name)
    )`);

  await runAsync(`CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      items TEXT,
      total REAL,
      currency TEXT,
      status TEXT,
      ref_code TEXT,
      cents_suffix TEXT,
      amount_due REAL,
      paid_at DATETIME,
      payment_proof TEXT
    )`);
})().catch((e) => console.error("DB init error:", e));

module.exports = { db, runAsync, allAsync, getAsync };
