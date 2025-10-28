// commands/bundles.js

const { getProductsByCountry } = require('../data/products');
const { translate } = require('../utils/i18n');

async function bundlesCommand(bot, msg) {
  const chatId = msg.chat.id;
  const lang = msg.from.language_code || 'en';

  // Get user's selected country from database (you'll need to implement this)
  // For now, defaulting to Malaysia
  const userCountry = 'malaysia'; // TODO: Get from database

  const products = getProductsByCountry(userCountry);

  if (products.length === 0) {
    await bot.sendMessage(chatId, translate('no_products', lang));
    return;
  }

  // Create bundle options keyboard
  const keyboard = {
    inline_keyboard: products.map(product => [
      {
        text: `${product.name}`,
        callback_data: `bundle_${product.id}`
      }
    ])
  };

  await bot.sendMessage(
    chatId,
    translate('select_product_bundle', lang),
    { reply_markup: keyboard }
  );
}

// Handle bundle selection
async function handleBundleSelection(bot, query) {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const lang = query.from.language_code || 'en';
  
  const productId = query.data.replace('bundle_', '');
  const { getProductById } = require('../data/products');
  const product = getProductById(productId);

  if (!product) {
    await bot.answerCallbackQuery(query.id, { text: 'Product not found' });
    return;
  }

  // Create bundle quantity options
  const bundleOptions = Object.keys(product.price).map(quantity => {
    const price = product.price[quantity];
    const discount = calculateDiscount(quantity, price);
    
    return [
      {
        text: `${quantity} - ${product.currency} ${price}${discount ? ` (Save ${discount}%)` : ''}`,
        callback_data: `buy_${productId}_${quantity}`
      }
    ];
  });

  bundleOptions.push([
    { text: translate('back', lang), callback_data: 'bundles' }
  ]);

  const keyboard = { inline_keyboard: bundleOptions };

  await bot.editMessageText(
    `${translate('bundle_options', lang)}\n\n` +
    `📦 *${product.name}*\n` +
    `${product.description}\n\n` +
    `${translate('select_quantity', lang)}:`,
    {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      reply_markup: keyboard
    }
  );

  await bot.answerCallbackQuery(query.id);
}

// Calculate discount percentage
function calculateDiscount(quantity, price) {
  // Base price per gram (1g price)
  const basePrice = 120; // Malaysia base
  const quantityNum = parseInt(quantity.replace('g', ''));
  const expectedPrice = basePrice * quantityNum;
  const discount = Math.round(((expectedPrice - price) / expectedPrice) * 100);
  
  return discount > 0 ? discount : 0;
}

module.exports = {
  bundlesCommand,
  handleBundleSelection
};