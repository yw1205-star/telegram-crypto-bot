// =======================================================
// 📄 File: commands/faq.js (NO DUPLICATES)
// Purpose: Handle FAQ button
// =======================================================

const { matchesButton } = require("../utils/i18n");

module.exports = (bot) => {
  // Handle FAQ button from keyboard
  bot.on('message', (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;
    const text = msg.text.trim();
    
    // Only handle FAQ button
    if (matchesButton(text, 'faq')) {
      bot.sendMessage(msg.chat.id,
`*FAQ*
• How to pay? Choose Checkout → follow instructions.
• How long for confirmation? Usually instant (AI verification).
• How to change language? Tap "🌐 Language".`, { parse_mode: 'Markdown' });
    }
  });
};