// migrations/fix_orders_table.js

const { db } = require('../config/database');

db.serialize(() => {
  console.log('🔧 Checking orders table...');
  
  // Check if orders table exists
  db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='orders'", (err, tables) => {
    if (err) {
      console.error('Error checking tables:', err);
      return;
    }

    if (tables.length === 0) {
      console.log('Creating orders table...');
      
      // Create orders table with all columns
      db.run(`
        CREATE TABLE orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          items TEXT NOT NULL,
          total REAL NOT NULL,
          currency TEXT DEFAULT 'USD',
          status TEXT DEFAULT 'pending',
          ref_code TEXT,
          amount_due REAL,
          payment_proof TEXT,
          paid_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('❌ Error creating orders table:', err);
        } else {
          console.log('✅ Orders table created successfully');
        }
      });
    } else {
      console.log('✅ Orders table already exists');
      
      // Check columns
      db.all("PRAGMA table_info(orders)", (err, columns) => {
        if (err) {
          console.error('Error checking columns:', err);
          return;
        }
        
        const hasCreatedAt = columns.some(col => col.name === 'created_at');
        
        if (!hasCreatedAt) {
          console.log('Adding created_at column...');
          db.run(`ALTER TABLE orders ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP`, (err) => {
            if (err) {
              console.error('❌ Error adding created_at:', err);
            } else {
              console.log('✅ created_at column added');
            }
          });
        } else {
          console.log('✅ created_at column exists');
        }
      });
    }
  });
});

console.log('Migration complete');