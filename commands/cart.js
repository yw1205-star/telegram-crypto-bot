// commands/cart.js - COMPLETE & WORKING

const { getAsync, allAsync, runAsync } = require('../config/database');
const { getProductById } = require('../data/products');

module.exports = function(bot) {

  // Listen for "View Cart" button
  bot.onText(/View Cart|🛒|cart/i, async (msg) => {
    await showCart(bot, msg.chat.id);
  });

  // /cart command
  bot.onText(/\/cart/, async (msg) => {
    await showCart(bot, msg.chat.id);
  });

  // Show cart function
  async function showCart(bot, chatId) {
    try {
      const cartItems = await allAsync(
        `SELECT * FROM cart WHERE user_id = ?`,
        [chatId]
      );

      if (!cartItems || cartItems.length === 0) {
        await bot.sendMessage(chatId, '🛒 Your cart is empty.');
        return;
      }

      let cartMessage = '🛒 *Your Cart:*\n\n';
      let total = 0;
      let currency = '';

      for (const item of cartItems) {
        const product = getProductById(item.product_id);
        
        if (product) {
          cartMessage += `${product.image} ${product.name}\n`;
          cartMessage += `   📏 ${item.quantity}\n`;
          cartMessage += `   💰 ${product.currency} ${item.price}\n\n`;
          
          total += item.price;
          currency = product.currency;
        }
      }

      cartMessage += `━━━━━━━━━━━━━━━\n`;
      cartMessage += `*Total: ${currency} ${total}*`;

      const keyboard = {
        inline_keyboard: [
          [{ text: '✅ Checkout', callback_data: 'checkout' }],
          [{ text: '🗑️ Clear Cart', callback_data: 'clear_cart' }],
          [{ text: '« Continue Shopping', callback_data: 'back_to_countries' }]
        ]
      };

      await bot.sendMessage(chatId, cartMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });

    } catch (error) {
      console.error('Error showing cart:', error);
      await bot.sendMessage(chatId, '❌ Error loading cart. Please try again.');
    }
  }

  // Handle cart callbacks
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    try {
      // Clear cart
      if (data === 'clear_cart') {
        await runAsync(`DELETE FROM cart WHERE user_id = ?`, [chatId]);
        
        await bot.answerCallbackQuery(query.id, { 
          text: '🗑️ Cart cleared!',
          show_alert: false
        });

        await bot.editMessageText(
          '🛒 Your cart is empty.',
          {
            chat_id: chatId,
            message_id: query.message.message_id
          }
        );
        return;
      }

      // Checkout
      if (data === 'checkout') {
        const cartItems = await allAsync(
          `SELECT * FROM cart WHERE user_id = ?`,
          [chatId]
        );

        if (!cartItems || cartItems.length === 0) {
          await bot.answerCallbackQuery(query.id, { 
            text: 'Cart is empty!',
            show_alert: true
          });
          return;
        }

        // Generate order reference
        const orderRef = 'REF' + Date.now().toString().slice(-8);
        let total = 0;
        let currency = '';

        for (const item of cartItems) {
          const product = getProductById(item.product_id);
          if (product) {
            total += item.price;
            currency = product.currency;
          }
        }

        // Create order
        await runAsync(
          `INSERT INTO orders (user_id, reference, total_amount, currency, status, created_at)
           VALUES (?, ?, ?, ?, 'pending', datetime('now'))`,
          [chatId, orderRef, total, currency]
        );

        // Clear cart
        await runAsync(`DELETE FROM cart WHERE user_id = ?`, [chatId]);

        await bot.answerCallbackQuery(query.id);

        await bot.sendMessage(
          chatId,
          `✅ *Order Created!*\n\n` +
          `📝 Reference: \`${orderRef}\`\n` +
          `💰 Total: ${currency} ${total}\n\n` +
          `━━━━━━━━━━━━━━━\n\n` +
          `*Payment Instructions:*\n\n` +
          `Please transfer to:\n` +
          `💳 Trust Wallet\n` +
          `📱 Address: \`0x123...ABC\`\n\n` +
          `⚠️ *IMPORTANT:* Include reference \`${orderRef}\` in payment note!\n\n` +
          `After payment, send screenshot here for verification.`,
          { parse_mode: 'Markdown' }
        );
        return;
      }

    } catch (error) {
      console.error('Error in cart callback:', error);
      await bot.answerCallbackQuery(query.id, { 
        text: 'An error occurred. Please try again.' 
      });
    }
  });
};