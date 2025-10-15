const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./shop.db");

console.log("Setting up database...");

db.serialize(() => {
  // 🛍 Products table
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      crypto_type TEXT DEFAULT 'USDT',
      image_url TEXT,
      active INTEGER DEFAULT 1
    )
  `);

  // 🛒 Cart table (unique per user + product)
  db.run(`
    CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      price REAL NOT NULL,
      UNIQUE(user_id, product_name)
    )
  `);

  // 🧾 Orders table (to be used later for checkout/payment)
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      items TEXT NOT NULL,
      total REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("✅ Database tables are ready!");
});

db.close();
