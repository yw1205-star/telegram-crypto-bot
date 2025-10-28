// commands/products.js

const { countries, getProductsByCountry, getProductById } = require('../data/products');
const { translate } = require('../utils/i18n');

module.exports = function(bot) {
  
  // Listen for "Shop Products" button text (NEW!)
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

  // Handle country selection callbacks
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const data = query.data;

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

      // Create product buttons
      const productButtons = products.map(product => [
        {
          text: `${product.name}`,
          callback_data: `product_${product.id}`
        }
      ]);

      productButtons.push([
        { text: '« Back', callback_data: 'back_to_countries' }
      ]);

      const keyboard = { inline_keyboard: productButtons };

      await bot.editMessageText(
        `📍 *${country.charAt(0).toUpperCase() + country.slice(1)}*\n\n` +
        `Available products:`,
        {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: keyboard
        }
      );

      await bot.answerCallbackQuery(query.id);
    }

    // Product selection
    if (data.startsWith('product_')) {
      const productId = data.replace('product_', '');
      const product = getProductById(productId);

      if (!product) {
        await bot.answerCallbackQuery(query.id, { text: 'Product not found' });
        return;
      }

      // Show quantity options
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
        `📦 *${product.name}*\n\n` +
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
    }

    // Add to cart
    if (data.startsWith('addcart_')) {
      const [, productId, quantity] = data.split('_');
      const product = getProductById(productId);

      if (!product) {
        await bot.answerCallbackQuery(query.id, { text: 'Product not found' });
        return;
      }

      await bot.answerCallbackQuery(query.id, { 
        text: `Added ${quantity} ${product.name} to cart!` 
      });

      await bot.sendMessage(
        chatId,
        `✅ Added to cart:\n\n` +
        `📦 ${product.name}\n` +
        `📏 ${quantity}\n` +
        `💰 ${product.currency} ${product.price[quantity]}\n\n` +
        `Use /cart to view your cart`
      );
    }
  });
};