const { customAlphabet } = require('nanoid');
const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

function shortRef(prefix = 'ORD') {
  return `${prefix}-${nanoid()}`;
}

function formatCurrency(amount, currency = process.env.CURRENCY || 'USD') {
  return `${currency} ${Number(amount).toFixed(2)}`;
}

function pickCentsSuffix(used = new Set()) {
  // pick from 1..29 to reduce rounding mistakes (you can widen later)
  for (let i = 1; i <= 29; i++) {
    if (!used.has(i)) return i;
  }
  return Math.floor(1 + Math.random() * 29);
}

module.exports = { shortRef, formatCurrency, pickCentsSuffix };
