// migrations/fix_cart_table.js

const db = require('../config/database').db;

db.serialize(() => {
  // Drop old cart table if exists
  db.run(`DROP TABLE IF EXISTS cart`);
  
  // Create new cart table with correct structure
  db.run(`
    CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id TEXT NOT NULL,
      quantity TEXT NOT NULL,
      price REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ Cart table fixed');
});