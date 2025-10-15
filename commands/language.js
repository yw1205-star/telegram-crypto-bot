// =======================================================
// 📄 File: commands/language.js (FIXED - Keyboard Refresh)
// Purpose: Let users select language and apply instantly
// Folder: commands/
// =======================================================

const { runAsync, getAsync } = require("../config/database");
const { t } = require("../utils/i18n");

// Helper: build keyboard dynamically in chosen language
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

module.exports = (bot) => {
  // /language command
  bot.onText(/^\/language$/, (msg) => {
    sendLanguageMenu(msg.chat.id);
  });

  // Button from main keyboard (any language version)
  bot.on("message", async (msg) => {
    if (!msg.text) return;
    const text = msg.text.trim();
    
    // Check all language versions of the language button
    const languageButtons = ["🌐 Language", "🌐 语言", "🌐 ภาษา", "🌐 Bahasa"];
    
    if (languageButtons.includes(text)) {
      sendLanguageMenu(msg.chat.id);
    }
  });

  // Show the inline selection buttons
  function sendLanguageMenu(chatId) {
    bot.sendMessage(chatId, "🌐 Choose your language:", {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "English", callback_data: "lang|en" },
            { text: "中文", callback_data: "lang|zh" },
          ],
          [
            { text: "ไทย", callback_data: "lang|th" },
            { text: "Bahasa", callback_data: "lang|ms" },
          ],
        ],
      },
    });
  }

  // Handle callback and update language
  bot.on("callback_query", async (q) => {
    if (!q.data?.startsWith("lang|")) return;
    const lang = q.data.split("|")[1];
    const chatId = q.message.chat.id;

    try {
      // Save / update user language in DB
      await runAsync(
        "INSERT OR REPLACE INTO users (user_id, lang) VALUES (?, ?)",
        [chatId, lang]
      );

      // Confirm
      await bot.answerCallbackQuery(q.id, { text: "✅ Language updated!" });

      // Build the new keyboard in the selected language
      const kb = buildKeyboard(lang);
      
      // Send confirmation message with the new keyboard
      await bot.sendMessage(chatId, `✅ ${t(lang, "start")}`, kb);

    } catch (err) {
      console.error("Language save error:", err);
      bot.answerCallbackQuery(q.id, { text: "Error saving language" });
    }
  });
};