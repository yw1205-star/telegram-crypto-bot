// =======================================================
// 📄 File: commands/start.js
// Purpose: Welcome message and main keyboard (English only)
// =======================================================

const { db } = require("../config/database");

module.exports = (bot) => {
  
  // Build keyboard (English only)
  function buildKeyboard() {
    return {
      keyboard: [
        [{ text: "🛍️ Shop Products" }],
        [{ text: "🛒 View Cart" }],
        [{ text: "❓ FAQ" }, { text: "💬 Support" }]
      ],
      resize_keyboard: true,
      persistent: true
    };
  }

  // /start command
  bot.onText(/^\/start$/, async (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || "there";

    // Save user to database
    db.run(
      `INSERT OR REPLACE INTO users (user_id, username, first_name, lang) VALUES (?, ?, ?, 'en')`,
      [chatId, msg.from.username || "", firstName],
      (err) => {
        if (err) console.error("Error saving user:", err);
      }
    );

    const welcomeMessage = 
      `🌿 *Welcome to Club Green!*\n\n` +
      `Hi ${firstName}! 👋\n\n` +
      `Your trusted source for premium quality products.\n\n` +
      `✨ *What we offer:*\n` +
      `🌿 Premium strains from Malaysia, Singapore & Thailand\n` +
      `💰 Competitive pricing\n` +
      `🔒 Secure crypto payments\n` +
      `📦 Discreet packaging\n` +
      `⚡ Fast delivery\n\n` +
      `Use the buttons below to get started! ⬇️`;

    bot.sendMessage(chatId, welcomeMessage, {
      parse_mode: "Markdown",
      reply_markup: buildKeyboard()
    });
  });

  // Export keyboard builder for other commands
  bot._buildKeyboard = buildKeyboard;
};