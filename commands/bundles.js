// =======================================================
// 📄 File: commands/bundles.js
// Purpose: Bundle purchase with real discounted add-to-cart
// Folder: commands/
// =======================================================

const { db } = require("../config/database");
const { bundlePrices } = require("../data/products");

module.exports = (bot) => {
  bot.on("callback_query", (q) => {
    if (!q.data || !q.data.startsWith("bundle|")) return;
    const chatId = q.message?.chat?.id;
    if (!chatId) return;
    const name = decodeURIComponent(q.data.split("|")[1]);
    const bundles = bundlePrices[name];
    if (!bundles) return bot.sendMessage(chatId, "❌ No bundle available.");

    const text = `📦 *Bundle Options for ${name}:*\nSelect one below for discounted price.`;
    const buttons = Object.keys(bundles).map((qty) => [
      {
        text: `${qty}x - $${bundles[qty].toFixed(2)}`,
        callback_data: `bundlebuy|${encodeURIComponent(name)}|${qty}`,
      },
    ]);
    bot.sendMessage(chatId, text, {
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: buttons },
    });
  });

  // handle actual bundle buy
  bot.on("callback_query", (q) => {
    if (!q.data || !q.data.startsWith("bundlebuy|")) return;
    const chatId = q.message?.chat?.id;
    const parts = q.data.split("|");
    const name = decodeURIComponent(parts[1]);
    const qty = parseInt(parts[2], 10);
    const bundles = bundlePrices[name];
    const price = bundles?.[qty];
    if (!price) return bot.sendMessage(chatId, "⚠️ Invalid bundle.");

    db.run(
      `INSERT INTO cart (user_id, product_name, price, quantity)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, product_name)
       DO UPDATE SET quantity = quantity + excluded.quantity`,
      [String(chatId), `${name} (Bundle ${qty}x)`, price / qty, qty],
      (err) => {
        if (err) {
          console.error("Bundle add error:", err);
          return bot.sendMessage(chatId, "⚠️ DB error adding bundle.");
        }
        bot.sendMessage(
          chatId,
          `✅ Bundle added: *${qty}× ${name}* at discounted price $${price.toFixed(
            2
          )}.`,
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [[{ text: "🛒 View Cart", callback_data: "cart|view" }]],
            },
          }
        );
      }
    );
  });
};
