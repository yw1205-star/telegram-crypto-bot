// migrations/fix_orders_table.js
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./shop.db");

db.serialize(() => {
  db.run("ALTER TABLE orders ADD COLUMN currency TEXT", noop);
  db.run("ALTER TABLE orders ADD COLUMN ref_code TEXT", noop);
  db.run("ALTER TABLE orders ADD COLUMN cents_suffix TEXT", noop);
  db.run("ALTER TABLE orders ADD COLUMN amount_due REAL", noop);
  db.run("ALTER TABLE orders ADD COLUMN paid_at TEXT", noop);
  db.run("ALTER TABLE orders ADD COLUMN payment_proof TEXT", noop);
});

db.close();
function noop() {}
