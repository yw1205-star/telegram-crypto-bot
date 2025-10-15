// =======================================================
// 📄 File: utils/i18n.js
// Purpose: Multi-language dictionary + helper
// Supports: English, 中文, ไทย, Bahasa Melayu
// =======================================================

const translations = {
  en: {
    start: "👋 Welcome to the Shop Bot! What would you like to do?",
    shop: "🛒 Shop Products",
    faq: "❓ FAQ",
    support: "📞 Support",
    language: "🌐 Language",
    viewCart: "🎁 View Cart",
    emptyCart: "🧺 Your cart is empty.",
    cartTitle: "🎁 *Your Cart:*",
    total: "💰 *Total:*",
    checkout: "🧾 Checkout",
    empty: "🗑️ Empty Cart",
    back: "⬅️ Back",
    confirmPaid: "✅ I have paid",
    cancel: "❌ Cancel",
    paymentConfirmed: "✅ *Payment received!* Your order is confirmed.",
  },

  zh: {
    start: "👋 欢迎来到商店机器人！您想做什么？",
    shop: "🛒 浏览商品",
    faq: "❓ 常见问题",
    support: "📞 客服支持",
    language: "🌐 语言",
    viewCart: "🎁 查看购物车",
    emptyCart: "🧺 您的购物车是空的。",
    cartTitle: "🎁 *您的购物车:*",
    total: "💰 *总计:*",
    checkout: "🧾 结账",
    empty: "🗑️ 清空购物车",
    back: "⬅️ 返回",
    confirmPaid: "✅ 我已付款",
    cancel: "❌ 取消",
    paymentConfirmed: "✅ *已收到付款！订单确认成功。*",
  },

  th: {
    start: "👋 ยินดีต้อนรับ! ต้องการทำอะไร?",
    shop: "🛒 สินค้า",
    faq: "❓ คำถามที่พบบ่อย",
    support: "📞 ติดต่อฝ่ายช่วยเหลือ",
    language: "🌐 ภาษา",
    viewCart: "🎁 ดูตะกร้า",
    emptyCart: "🧺 ตะกร้าว่างเปล่า",
    cartTitle: "🎁 *ตะกร้าของคุณ:*",
    total: "💰 *ยอดรวม:*",
    checkout: "🧾 ชำระเงิน",
    empty: "🗑️ ล้างตะกร้า",
    back: "⬅️ กลับ",
    confirmPaid: "✅ ชำระเงินแล้ว",
    cancel: "❌ ยกเลิก",
    paymentConfirmed: "✅ *ชำระเงินเรียบร้อย!*",
  },

  ms: {
    start: "👋 Selamat datang ke Shop Bot! Apa yang anda ingin lakukan?",
    shop: "🛒 Produk",
    faq: "❓ Soalan Lazim",
    support: "📞 Sokongan",
    language: "🌐 Bahasa",
    viewCart: "🎁 Lihat Troli",
    emptyCart: "🧺 Troli anda kosong.",
    cartTitle: "🎁 *Troli Anda:*",
    total: "💰 *Jumlah:*",
    checkout: "🧾 Bayar Sekarang",
    empty: "🗑️ Kosongkan Troli",
    back: "⬅️ Kembali",
    confirmPaid: "✅ Saya sudah bayar",
    cancel: "❌ Batal",
    paymentConfirmed: "✅ *Bayaran diterima!* Pesanan anda disahkan.",
  },
};

// Helper to fetch text with fallback
function t(lang, key) {
  const dict = translations[lang] || translations.en;
  return dict[key] || translations.en[key] || key;
}

module.exports = { t };

// =======================================================
// 🔧 Add this at the bottom of utils/i18n.js
// Purpose: Allow any-language keyword recognition
// =======================================================

function matchesButton(text, key) {
  text = text?.trim();
  if (!text) return false;
  for (const langCode of Object.keys(translations)) {
    if (translations[langCode][key] === text) return true;
  }
  return false;
}

module.exports = { t, matchesButton };
