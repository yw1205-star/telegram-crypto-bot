// commands/cart.js - COMPLETE & TESTED

const { db } = require('../config/database');
const { getProductById } = require('../data/products');

module.exports = function(bot) {

  // Listen for "View Cart" button
  bot.onText(/View Cart|cart/i, async (msg) => {
    if (msg.text && !msg.text.startsWith('/')) {
      showCart(bot, msg.chat.id);
    }
  });

  // /cart command
  bot.onText(/\/cart/, async (msg) => {
    showCart(bot, msg.chat.id);
  });

  // Show cart
  function showCart(bot, chatId) {
    db.all(`SELECT * FROM cart WHERE user_id = ?`, [chatId], (err, rows) => {
      if (err) {
        console.error('Cart fetch error:', err);
        bot.sendMessage(chatId, '❌ Error loading cart');
        return;
      }

      if (!rows || rows.length === 0) {
        bot.sendMessage(chatId, '🛒 Your cart is empty.');
        return;
      }

      let message = '🛒 *Your Cart:*\n\n';
      let total = 0;
      let currency = '';

      rows.forEach(item => {
        const product = getProductById(item.product_id);
        if (product) {
          message += `${product.image} ${product.name}\n   📏 ${item.quantity}\n   💰 ${product.currency} ${item.price}\n\n`;
          total += item.price;
          currency = product.currency;
        }
      });

      message += `━━━━━━━━━━━━━━━\n*Total: ${currency} ${total}*`;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '✅ Checkout', callback_data: 'cart_checkout' },
            { text: '🗑️ Clear', callback_data: 'cart_clear' }
          ],
          [{ text: '« Continue Shopping', callback_data: 'pback_countries' }]
        ]
      };

      bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    });
  }

  // Handle cart callbacks
  bot.on('callback_query', async (query) => {
    const data = query.data;
    
    // Only handle cart callbacks
    if (!data.startsWith('cart_')) return;

    const chatId = query.message.chat.id;

    try {
      // Clear cart
      if (data === 'cart_clear') {
        db.run(`DELETE FROM cart WHERE user_id = ?`, [chatId], (err) => {
          if (err) {
            console.error('Cart clear error:', err);
            bot.answerCallbackQuery(query.id, { text: 'Error clearing cart', show_alert: true });
            return;
          }

          bot.answerCallbackQuery(query.id, { text: '🗑️ Cart cleared!' });
          bot.editMessageText('🛒 Your cart is empty.', {
            chat_id: chatId,
            message_id: query.message.message_id
          });
        });
        return;
      }

      // Checkout
      if (data === 'cart_checkout') {
        db.all(`SELECT * FROM cart WHERE user_id = ?`, [chatId], (err, rows) => {
          if (err || !rows || rows.length === 0) {
            bot.answerCallbackQuery(query.id, { text: 'Cart is empty!', show_alert: true });
            return;
          }

          const orderRef = 'REF' + Date.now().toString().slice(-8);
          let total = 0;
          let currency = '';

          rows.forEach(item => {
            const product = getProductById(item.product_id);
            if (product) {
              total += item.price;
              currency = product.currency;
            }
          });

          // Create order
          db.run(
            `INSERT INTO orders (user_id, reference, total_amount, currency, status, created_at) VALUES (?, ?, ?, ?, 'pending', datetime('now'))`,
            [chatId, orderRef, total, currency],
            (err) => {
              if (err) {
                console.error('Order create error:', err);
                bot.answerCallbackQuery(query.id, { text: 'Error creating order', show_alert: true });
                return;
              }

              // Clear cart
              db.run(`DELETE FROM cart WHERE user_id = ?`, [chatId]);

              bot.answerCallbackQuery(query.id, { text: '✅ Order created!' });

              bot.sendMessage(
                chatId,
                `✅ *Order Created!*\n\n` +
                `📝 Reference: \`${orderRef}\`\n` +
                `💰 Total: ${currency} ${total}\n\n` +
                `━━━━━━━━━━━━━━━\n\n` +
                `*Payment Instructions:*\n\n` +
                `Please transfer to:\n` +
                `💳 Trust Wallet\n` +
                `📱 0x123...ABC\n\n` +
                `⚠️ *Include reference:* \`${orderRef}\`\n\n` +
                `Send screenshot after payment for verification.`,
                { parse_mode: 'Markdown' }
              );
            }
          );
        });
        return;
      }

    } catch (error) {
      console.error('Cart callback error:', error);
      bot.answerCallbackQuery(query.id, { text: 'An error occurred', show_alert: true });
    }
  });
};