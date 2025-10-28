// commands/products.js - COMPLETE & WORKING

const { getProductsByCountry, getProductById } = require('../data/products');
const { runAsync } = require('../config/database');

module.exports = function(bot) {
  
  // Listen for "Shop Products" button text
  bot.onText(/Shop Products|🛍️|shop/i, async (msg) => {
    const chatId = msg.chat.id;

    const keyboard = {
      inline_keyboard: [
        [{ text: '🇲🇾 Malaysia', callback_data: 'country_malaysia' }],
        [{ text: '🇸🇬 Singapore', callback_data: 'country_singapore' }],
        [{ text: '🇹🇭 Thailand', callback_data: 'country_thailand' }]
      ]
    };

    await bot.sendMessage(
      chatId,
      `📍 Choose your country:`,
      { reply_markup: keyboard }
    );
  });

  // /products command
  bot.onText(/\/products/, async (msg) => {
    const chatId = msg.chat.id;

    const keyboard = {
      inline_keyboard: [
        [{ text: '🇲🇾 Malaysia', callback_data: 'country_malaysia' }],
        [{ text: '🇸🇬 Singapore', callback_data: 'country_singapore' }],
        [{ text: '🇹🇭 Thailand', callback_data: 'country_thailand' }]
      ]
    };

    await bot.sendMessage(
      chatId,
      `📍 Choose your country:`,
      { reply_markup: keyboard }
    );
  });

  // Handle all product-related callbacks
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const data = query.data;

    try {
      // Country selection
      if (data.startsWith('country_')) {
        const country = data.replace('country_', '');
        const products = getProductsByCountry(country);

        if (products.length === 0) {
          await bot.answerCallbackQuery(query.id, { 
            text: 'No products available' 
          });
          return;
        }

        const productButtons = products.map(product => [
          {
            text: `${product.image} ${product.name}`,
            callback_data: `product_${product.id}`
          }
        ]);

        productButtons.push([
          { text: '« Back', callback_data: 'back_to_countries' }
        ]);

        const keyboard = { inline_keyboard: productButtons };

        await bot.editMessageText(
          `📍 *${country.charAt(0).toUpperCase() + country.slice(1)}*\n\n` +
          `Select a product:`,
          {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: keyboard
          }
        );

        await bot.answerCallbackQuery(query.id);
        return;
      }

      // Product selection
      if (data.startsWith('product_')) {
        const productId = data.replace('product_', '');
        const product = getProductById(productId);

        if (!product) {
          await bot.answerCallbackQuery(query.id, { text: 'Product not found' });
          return;
        }

        const quantityButtons = Object.keys(product.price).map(quantity => [
          {
            text: `${quantity} - ${product.currency} ${product.price[quantity]}`,
            callback_data: `addcart_${productId}_${quantity}`
          }
        ]);

        quantityButtons.push([
          { text: '« Back', callback_data: `country_${productId.split('_')[0]}` }
        ]);

        const keyboard = { inline_keyboard: quantityButtons };

        await bot.editMessageText(
          `${product.image} *${product.name}*\n\n` +
          `${product.description}\n\n` +
          `Select quantity:`,
          {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: keyboard
          }
        );

        await bot.answerCallbackQuery(query.id);
        return;
      }

      // Back to countries
      if (data === 'back_to_countries') {
        const keyboard = {
          inline_keyboard: [
            [{ text: '🇲🇾 Malaysia', callback_data: 'country_malaysia' }],
            [{ text: '🇸🇬 Singapore', callback_data: 'country_singapore' }],
            [{ text: '🇹🇭 Thailand', callback_data: 'country_thailand' }]
          ]
        };

        await bot.editMessageText(
          `📍 Choose your country:`,
          {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: keyboard
          }
        );

        await bot.answerCallbackQuery(query.id);
        return;
      }

      // Add to cart - FIXED VERSION
      if (data.startsWith('addcart_')) {
        const parts = data.replace('addcart_', '');
        const lastUnderscore = parts.lastIndexOf('_');
        const productId = parts.substring(0, lastUnderscore);
        const quantity = parts.substring(lastUnderscore + 1);
        
        const product = getProductById(productId);

        if (!product) {
          await bot.answerCallbackQuery(query.id, { text: 'Product not found' });
          return;
        }

        // Add to cart in database
        await runAsync(
          `INSERT INTO cart (user_id, product_id, quantity, price) 
           VALUES (?, ?, ?, ?)`,
          [chatId, productId, quantity, product.price[quantity]]
        );

        await bot.answerCallbackQuery(query.id, { 
          text: `✅ Added ${quantity} ${product.name}!`,
          show_alert: false
        });

        await bot.sendMessage(
          chatId,
          `✅ *Added to cart:*\n\n` +
          `${product.image} ${product.name}\n` +
          `📏 Quantity: ${quantity}\n` +
          `💰 Price: ${product.currency} ${product.price[quantity]}\n\n` +
          `Tap "View Cart" button to checkout!`,
          { parse_mode: 'Markdown' }
        );
        return;
      }

    } catch (error) {
      console.error('Error in products callback:', error);
      await bot.answerCallbackQuery(query.id, { 
        text: 'An error occurred. Please try again.' 
      });
    }
  });
};