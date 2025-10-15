// =======================================================
// 📄 File: utils/payments.js
// Purpose: AI-simulated payment verification (dummy mode)
// Folder: utils/
// =======================================================

const crypto = require("crypto");

/**
 * Generates a unique reference code for each checkout.
 * Format: REF + 6 digits + 2 random letters
 */
function createRef() {
  const r = Date.now().toString().slice(-6);
  const rnd = crypto.randomBytes(2).toString("hex").slice(0, 2).toUpperCase();
  return `REF${r}${rnd}`;
}

/**
 * Generates a unique amount by adding random cents (10–99)
 * Helps simulate “unique amount per order” matching.
 */
function createUniqueAmount(total) {
  const base = Number(total) || 0;
  const cents = Math.floor(Math.random() * 90) + 10;
  const amountDue = Number(
    `${Math.floor(base)}.${String(cents).padStart(2, "0")}`
  );
  return { amountDue, centsSuffix: String(cents).padStart(2, "0") };
}

/**
 * Simulated “AI verification” delay.
 * Resolves successfully after 3 seconds.
 */
function simulateVerificationDelay(ms = 3000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  createRef,
  createUniqueAmount,
  simulateVerificationDelay,
};
