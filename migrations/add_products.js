// migrations/add_products.js
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./shop.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      price REAL,
      location TEXT
    )
  `, (err) => {
    if (err) console.error("❌ Error:", err.message);
    else console.log("✅ Products table created successfully!");
  });
});

db.close();
