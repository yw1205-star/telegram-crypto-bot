require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

// Express health check
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Bot running' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Health check on port ${PORT}`);
});

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN missing');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });
console.log('✅ Bot starting…');
console.log('💰 Payment mode:', process.env.PAYMENT_MODE || 'LIVE');

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

// CENTRALIZED CALLBACK ROUTER
bot.on('callback_query', async (query) => {
  const data = query.data;
  
  try {
    // Route to products
    if (data.startsWith('p')) {
      if (bot._handleProductCallback) {
        const handled = await bot._handleProductCallback(query);
        if (handled) return;
      }
    }
    
    // Route to cart
    if (data.startsWith('cart_')) {
      if (bot._handleCartCallback) {
        const handled = await bot._handleCartCallback(query);
        if (handled) return;
      }
    }
    
    // Route to orders
    if (data === 'checkout_from_cart' || data.startsWith('paid_') || data === 'cancel_checkout') {
      if (bot._handleOrderCallback) {
        const handled = await bot._handleOrderCallback(query);
        if (handled) return;
      }
    }
    
  } catch (error) {
    console.error('Callback routing error:', error);
    try {
      await bot.answerCallbackQuery(query.id, { 
        text: 'An error occurred', 
        show_alert: true 
      });
    } catch (e) {}
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

console.log