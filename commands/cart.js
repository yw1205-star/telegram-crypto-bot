// commands/cart.js - Remove checkout handling

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
            { text: '✅ Checkout', callback_data: 'checkout_from_cart' }
          ],
          [
            { text: '🗑️ Clear Cart', callback_data: 'cart_clear' }
          ],
          [
            { text: '« Continue Shopping', callback_data: 'pback_countries' }
          ]
        ]
      };

      bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    });
  }

  // Export handler for callback routing - ONLY HANDLE cart_clear
  bot._handleCartCallback = async function(query) {
    const data = query.data;
    const chatId = query.message.chat.id;

    try {
      // ONLY handle cart_clear - NOT checkout!
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
        return true;
      }

      return false;

    } catch (error) {
      console.error('Cart callback error:', error);
      try {
        await bot.answerCallbackQuery(query.id, { text: 'An error occurred', show_alert: true });
      } catch (e) {}
      return true;
    }
  };
};