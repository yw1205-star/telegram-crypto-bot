// migrations/fix_cart_table.js
const { db } = require('../config/database');

db.serialize(() => {
  db.run(`DROP TABLE IF EXISTS cart`);
  db.run(`
    CREATE TABLE cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      product_id INTEGER,
      product_name TEXT,
      quantity INTEGER DEFAULT 1,
      price REAL,
      UNIQUE(user_id, product_name)
    )
  `);
  console.log("✅ Cart table recreated with UNIQUE constraint on (user_id, product_name)");
});

db.close();
