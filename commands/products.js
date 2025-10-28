// commands/products.js

const { countries, getProductsByCountry } = require('../data/products');
const { translate } = require('../utils/i18n');

async function productsCommand(bot, msg) {
  const chatId = msg.chat.id;
  const lang = msg.from.language_code || 'en';

  // Show country selection
  const keyboard = {
    inline_keyboard: [
      [{ text: '🇲🇾 Malaysia', callback_data: 'country_malaysia' }],
      [{ text: '🇸🇬 Singapore', callback_data: 'country_singapore' }],
      [{ text: '🇹🇭 Thailand', callback_data: 'country_thailand' }]
    ]
  };

  await bot.sendMessage(
    chatId,
    `${translate('choose_country', lang) || 'Choose your country:'}`,
    { reply_markup: keyboard }
  );
}

// Handle country selection
async function handleCountrySelection(bot, query) {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const lang = query.from.language_code || 'en';
  
  const country = query.data.replace('country_', '');
  const products = getProductsByCountry(country);

  if (products.length === 0) {
    await bot.answerCallbackQuery(query.id, { 
      text: 'No products available for this country' 
    });
    return;
  }

  // Create product list
  const productButtons = products.map(product => [
    {
      text: `${product.name} - ${product.currency} ${product.price['1g']}`,
      callback_data: `product_${product.id}`
    }
  ]);

  productButtons.push([
    { text: translate('back', lang) || '« Back', callback_data: 'products' }
  ]);

  const keyboard = { inline_keyboard: productButtons };

  await bot.editMessageText(
    `📍 *${country.charAt(0).toUpperCase() + country.slice(1)}*\n\n` +
    `${translate('available_products', lang) || 'Available products:'}`,
    {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      reply_markup: keyboard
    }
  );

  await bot.answerCallbackQuery(query.id);
}

// Handle product selection
async function handleProductSelection(bot, query) {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const lang = query.from.language_code || 'en';
  
  const productId = query.data.replace('product_', '');
  const { getProductById } = require('../data/products');
  const product = getProductById(productId);

  if (!product) {
    await bot.answerCallbackQuery(query.id, { text: 'Product not found' });
    return;
  }

  // Show product details with quantity options
  const quantityButtons = Object.keys(product.price).map(quantity => [
    {
      text: `${quantity} - ${product.currency} ${product.price[quantity]}`,
      callback_data: `addcart_${productId}_${quantity}`
    }
  ]);

  quantityButtons.push([
    { text: translate('back', lang) || '« Back', callback_data: `country_${productId.split('_')[0]}` }
  ]);

  const keyboard = { inline_keyboard: quantityButtons };

  await bot.editMessageText(
    `📦 *${product.name}*\n\n` +
    `${product.description}\n\n` +
    `${translate('select_quantity', lang) || 'Select quantity:'}`,
    {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      reply_markup: keyboard
    }
  );

  await bot.answerCallbackQuery(query.id);
}

module.exports = {
  productsCommand,
  handleCountrySelection,
  handleProductSelection
};