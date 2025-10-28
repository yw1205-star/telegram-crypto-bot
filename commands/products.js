// commands/products.js - NO callback_query listener

const { getProductsByCountry, getProductById } = require('../data/products');
const { db } = require('../config/database');

module.exports = function(bot) {
  
  // Ensure cart table exists
  db.run(`
    CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      quantity TEXT NOT NULL,
      price REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Listen for "Shop Products" text button
  bot.onText(/Shop Products|shop/i, async (msg) => {
    if (msg.text && !msg.text.startsWith('/')) {
      showCountrySelection(bot, msg.chat.id);
    }
  });

  // /products command
  bot.onText(/\/products/, async (msg) => {
    showCountrySelection(bot, msg.chat.id);
  });

  // Show country selection
  function showCountrySelection(bot, chatId) {
    const keyboard = {
      inline_keyboard: [
        [{ text: '🇲🇾 Malaysia', callback_data: 'pcountry_malaysia' }],
        [{ text: '🇸🇬 Singapore', callback_data: 'pcountry_singapore' }],
        [{ text: '🇹🇭 Thailand', callback_data: 'pcountry_thailand' }]
      ]
    };

    bot.sendMessage(chatId, '📍 Choose your country:', { reply_markup: keyboard });
  }

  // Export handler for callback routing
  bot._handleProductCallback = async function(query) {
    const data = query.data;
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;

    try {
      // Country selection
      if (data.startsWith('pcountry_')) {
        const country = data.replace('pcountry_', '');
        const products = getProductsByCountry(country);

        const productButtons = products.map(product => [{
          text: `${product.image} ${product.name}`,
          callback_data: `pproduct_${product.id}`
        }]);

        productButtons.push([{ text: '« Back', callback_data: 'pback_countries' }]);

        await bot.editMessageText(
          `📍 *${country.charAt(0).toUpperCase() + country.slice(1)}*\n\nSelect a product:`,
          {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: productButtons }
          }
        );
        await bot.answerCallbackQuery(query.id);
        return true;
      }

      // Product selection
      if (data.startsWith('pproduct_')) {
        const productId = data.replace('pproduct_', '');
        const product = getProductById(productId);

        if (!product) {
          await bot.answerCallbackQuery(query.id, { text: 'Product not found', show_alert: true });
          return true;
        }

        const quantityButtons = Object.keys(product.price).map(qty => [{
          text: `${qty} - ${product.currency} ${product.price[qty]}`,
          callback_data: `padd_${productId}_${qty}`
        }]);

        quantityButtons.push([{ text: '« Back', callback_data: `pcountry_${productId.split('_')[0]}` }]);

        await bot.editMessageText(
          `${product.image} *${product.name}*\n\n${product.description}\n\nSelect quantity:`,
          {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: quantityButtons }
          }
        );
        await bot.answerCallbackQuery(query.id);
        return true;
      }

      // Add to cart
      if (data.startsWith('padd_')) {
        const parts = data.replace('padd_', '');
        const lastUnderscore = parts.lastIndexOf('_');
        const productId = parts.substring(0, lastUnderscore);
        const quantity = parts.substring(lastUnderscore + 1);
        
        const product = getProductById(productId);

        if (!product) {
          await bot.answerCallbackQuery(query.id, { text: 'Product not found', show_alert: true });
          return true;
        }

        // Insert into cart with product_name
        db.run(
          `INSERT INTO cart (user_id, product_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?)`,
          [chatId, productId, product.name, quantity, product.price[quantity]],
          (err) => {
            if (err) {
              console.error('Cart insert error:', err);
              bot.answerCallbackQuery(query.id, { text: 'Error adding to cart', show_alert: true });
              return;
            }

            bot.answerCallbackQuery(query.id, { text: `✅ Added ${quantity} ${product.name}!` });
            
            bot.sendMessage(
              chatId,
              `✅ *Added to cart:*\n\n${product.image} ${product.name}\n📏 ${quantity}\n💰 ${product.currency} ${product.price[quantity]}\n\nTap "View Cart" to checkout!`,
              { parse_mode: 'Markdown' }
            );
          }
        );
        return true;
      }

      // Back to countries
      if (data === 'pback_countries') {
        showCountrySelection(bot, chatId);
        await bot.answerCallbackQuery(query.id);
        return true;
      }

      return false;

    } catch (error) {
      console.error('Product callback error:', error);
      await bot.answerCallbackQuery(query.id, { text: 'An error occurred', show_alert: true });
      return true;
    }
  };
};