require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN missing in .env');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });
console.log('✅ Bot starting…');
console.log('💰 Payment mode:', process.env.PAYMENT_MODE || 'LIVE');

// Database will auto-initialize from database.js
// No need for setupDatabase() call

// Auto-load commands
const commandsDir = path.join(__dirname, 'commands');
fs.readdirSync(commandsDir).forEach((file) => {
  if (file.endsWith('.js')) {
    try {
      const register = require(path.join(commandsDir, file));
      if (typeof register === 'function') {
        register(bot);
        console.log('🟢 Loaded command:', file);
      }
    } catch (e) {
      console.error('❌ Failed to load', file, e.message);
    }
  }
});

// Error handlers
bot.on('polling_error', (err) => {
  console.error('❌ polling_error:', err?.message || err);
});

process.on('unhandledRejection', (r) => {
  console.error('❌ UnhandledRejection:', r);
});

process.on('uncaughtException', (e) => { 
  console.error('💥 UncaughtException:', e); 
  process.exit(1); 
});

console.log('🚀 Bot is now running!');