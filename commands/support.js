// =======================================================
// 📄 File: commands/support.js (NO DUPLICATES)
// Purpose: Provide admin contact info
// =======================================================

const { getAsync } = require("../config/database");
const { t, matchesButton } = require("../utils/i18n");

module.exports = (bot) => {
  const ADMIN_ID = 6328508264;
  const ADMIN_LINK = `https://t.me/${ADMIN_ID}`;

  // /support command
  bot.onText(/^\/support$/, async (msg) => {
    const chatId = msg.chat.id;
    await sendSupport(bot, chatId);
  });

  // Handle support button from keyboard
  bot.on("message", async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;
    const text = msg.text.trim();
    
    // Only handle support button
    if (matchesButton(text, "support")) {
      await sendSupport(bot, msg.chat.id);
    }
  });

  // Helper function
  async function sendSupport(bot, chatId) {
    const user = await getAsync("SELECT lang FROM users WHERE user_id = ?", [chatId]);
    const lang = user?.lang || "en";
    bot.sendMessage(chatId, `📧 ${t(lang, "support")}\n${ADMIN_LINK}`);
  }
};