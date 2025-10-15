// =======================================================
// 📄 File: commands/start.js (NO DUPLICATES)
// Purpose: ONLY handles /start command and builds keyboard
// All button handling is done by respective command files
// =======================================================

const { getAsync } = require("../config/database");
const { t } = require("../utils/i18n");

module.exports = (bot) => {
  // Build keyboard dynamically
  function buildKeyboard(lang) {
    return {
      reply_markup: {
        keyboard: [
          [{ text: t(lang, "shop") }, { text: t(lang, "faq") }],
          [{ text: t(lang, "support") }, { text: t(lang, "language") }],
          [{ text: t(lang, "viewCart") }],
        ],
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    };
  }

  // ONLY handle /start command
  bot.onText(/^\/start$/, async (msg) => {
    const chatId = msg.chat.id;
    const user = await getAsync("SELECT lang FROM users WHERE user_id = ?", [chatId]);
    const lang = user?.lang || "en";
    bot.sendMessage(chatId, t(lang, "start"), buildKeyboard(lang));
  });

  // Export the keyboard builder so other files can use it
  bot._buildKeyboard = buildKeyboard;
};