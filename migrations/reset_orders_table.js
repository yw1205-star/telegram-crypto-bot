// migrations/reset_orders_table.js
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./shop.db");

db.serialize(() => {
  console.log("🧹 Resetting 'orders' table...");

  // Drop the old table if exists
  db.run("DROP TABLE IF EXISTS orders", (err) => {
    if (err) console.error("Drop failed:", err.message);
  });

  // Create the correct structure
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      status TEXT DEFAULT 'pending',
      amount REAL,
      currency TEXT DEFAULT 'USD',
      payment_id TEXT,
      payment_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `, (err) => {
    if (err) console.error("Create failed:", err.message);
    else console.log("✅ 'orders' table recreated successfully.");
  });
});

db.close();
