// =======================================================
// 📄 File: utils/i18n.js
// Purpose: Simplified English-only translations
// =======================================================

const translations = {
  en: {
    start: "🌿 Welcome to Club Green!\n\nYour trusted source for premium quality products.",
    shop: "🛍️ Shop Products",
    faq: "❓ FAQ",
    support: "💬 Support",
    viewCart: "🛒 View Cart",
    emptyCart: "🛒 Your cart is empty.",
    cartTitle: "🛒 *Your Cart:*",
    total: "💰 *Total:*",
    checkout: "✅ Checkout",
    empty: "🗑️ Clear Cart",
    back: "⬅️ Back",
    confirmPaid: "✅ I have paid",
    cancel: "❌ Cancel",
    paymentConfirmed: "✅ *Payment received!* Your order is confirmed.",
    contactAdmin: "Contact our team if you have any questions.",
    trustWalletLabel: "Trust Wallet Address:",
    checkoutPayPrompt: "Please pay",
    checkoutAfterPay: "After payment, tap the button below.",
    chooseVerifyMethod: "How would you like to confirm payment?",
    uploadProofPrompt: "Please send transaction hash or screenshot.",
    verifyError: "Verification failed. Please contact support."
  }
};

// Helper to fetch text (always returns English now)
function t(lang, key) {
  return translations.en[key] || key;
}

// Helper to match button text (simplified for English only)
function matchesButton(text, key) {
  text = text?.trim();
  if (!text) return false;
  return translations.en[key] === text;
}

module.exports = { t, matchesButton };