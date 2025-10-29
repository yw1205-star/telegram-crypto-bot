// =======================================================
// 📄 File: commands/language.js
// Purpose: Inform users bot is English only
// =======================================================

module.exports = (bot) => {
  
  // If someone tries /language command
  bot.onText(/^\/language$/, async (msg) => {
    await bot.sendMessage(
      msg.chat.id,
      "🇬🇧 *Language: English*\n\n" +
      "Club Green bot is currently available in English only.\n\n" +
      "If you need assistance in another language, please contact our support team.",
      { parse_mode: "Markdown" }
    );
  });

  // Catch any "Language" button presses from old sessions
  bot.on("message", async (msg) => {
    if (!msg.text) return;
    const text = msg.text.trim();
    
    if (text === "🌐 Language" || text === "🌐 语言" || text === "🌐 ภาษา" || text === "🌐 Bahasa") {
      await bot.sendMessage(
        msg.chat.id,
        "🇬🇧 *Language: English*\n\n" +
        "Club Green bot is currently available in English only.",
        { parse_mode: "Markdown" }
      );
    }
  });
};