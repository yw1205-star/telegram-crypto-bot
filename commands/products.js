// =======================================================
// 📄 File: commands/products.js (FINAL FIX - Clean)
// Purpose: Country → product list → detail → qty → add / buy / bundle
// Folder: commands/
// =======================================================

const { db, getAsync } = require("../config/database");
const { t, matchesButton } = require("../utils/i18n");
const { productsByLocation, productUpdate } = require("../data/products");
const { bundlePrices } = require("../data/products");

function qtyKeyboard(lang, loc, name, qty) {
  const encL = encodeURIComponent(loc);
  const encN = encodeURIComponent(name);
  const q = Math.max(1, parseInt(qty, 10) || 1);
  return {
    inline_keyboard: [
      [
        { text: "➖", callback_data: `qty_dec|${encL}|${encN}|${q}` },
        { text: `${q}`, callback_data: `qty_nop|${encL}|${encN}|${q}` },
        { text: "➕", callback_data: `qty_inc|${encL}|${encN}|${q}` },
      ],
      [
        { text: "🛒 Add to Cart", callback_data: `add|${encL}|${encN}|${q}` },
        { text: "💳 Checkout Now", callback_data: `buy|${encL}|${encN}|${q}` },
      ],
      [{ text: "📦 Bundle Purchase", callback_data: `bundle|${encN}` }],
      [{ text: t(lang, "back"), callback_data: "shop|back" }],
    ],
  };
}

function safeEdit(bot, msg, text, markup) {
  bot.editMessageText(text, {
    chat_id: msg.chat.id,
    message_id: msg.message_id,
    parse_mode: "Markdown",
    reply_markup: markup,
  }).catch((e) => {
    const d = e?.response?.body?.description;
    if (!String(d).includes("message is not modified")) console.error(d);
  });
}

module.exports = (bot) => {
  const openCountries = async (chatId) => {
    const u = await getAsync("SELECT lang FROM users WHERE user_id = ?", [chatId]);
    const lang = u?.lang || "en";
    const last = productUpdate?.date
      ? `\n🗓️ ${productUpdate.date} ⏰ ${productUpdate.time}`
      : "";
    const locations = Object.keys(productsByLocation);
    bot.sendMessage(chatId, `${t(lang, "shop")}\n📍 *Choose your country:*${last}`, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: locations.map((c) => [
          { text: c, callback_data: `loc|${encodeURIComponent(c)}` },
        ]),
      },
    });
  };

  // Handle /shop command
  bot.onText(/^\/shop$/, (msg) => openCountries(msg.chat.id));

  // Handle shop button clicks from keyboard (any language)
  bot.on("message", async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;
    
    // Only handle if it's a shop button in any language
    if (matchesButton(msg.text.trim(), "shop")) {
      openCountries(msg.chat.id);
    }
  });

  bot.on("callback_query", async (q) => {
    const chatId = q.message?.chat?.id;
    const data = q.data;
    if (!chatId || !data) return;
    const u = await getAsync("SELECT lang FROM users WHERE user_id = ?", [chatId]);
    const lang = u?.lang || "en";

    // Back to country selection
    if (data === "shop|back") return openCountries(chatId);

    // Country → product list
    if (data.startsWith("loc|")) {
      const loc = decodeURIComponent(data.split("|")[1]);
      const list = productsByLocation[loc] || [];
      if (!list.length) return bot.sendMessage(chatId, "❌ No products found.");
      const last = productUpdate?.date
        ? `\n🗓️ ${productUpdate.date} ⏰ ${productUpdate.time}`
        : "";
      const buttons = list.map((p) => [
        {
          text: `${p.name} - $${p.price.toFixed(2)}`,
          callback_data: `prod|${encodeURIComponent(loc)}|${encodeURIComponent(p.name)}`,
        },
      ]);
      return bot.sendMessage(chatId, `📦 *Products in ${loc}:*${last}`, {
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: buttons },
      });
    }

    // Product detail
    if (data.startsWith("prod|")) {
      const [, l, n] = data.split("|");
      const loc = decodeURIComponent(l);
      const name = decodeURIComponent(n);
      const p = (productsByLocation[loc] || []).find((x) => x.name === name);
      if (!p) return bot.sendMessage(chatId, "❌ Not found.");
      const text = `🛒 *${p.name}*\n💵 $${p.price.toFixed(2)}\n\n${p.desc}\n\nSelect quantity:`;
      return bot.sendMessage(chatId, text, {
        parse_mode: "Markdown",
        reply_markup: qtyKeyboard(lang, loc, name, 1),
      });
    }

    // Quantity changes
    if (data.startsWith("qty_")) {
      const [verb, locEnc, nameEnc, qtyStr] = data.split("|");
      const loc = decodeURIComponent(locEnc);
      const name = decodeURIComponent(nameEnc);
      const list = productsByLocation[loc] || [];
      const p = list.find((x) => x.name === name);
      if (!p) return;
      let qty = Math.max(1, parseInt(qtyStr, 10) || 1);
      if (verb === "qty_inc") qty++;
      else if (verb === "qty_dec") qty = Math.max(1, qty - 1);
      const text = `🛒 *${p.name}*\n💵 $${p.price.toFixed(
        2
      )}\n\n${p.desc}\n\nSelect quantity:`;
      return safeEdit(bot, q.message, text, qtyKeyboard(lang, loc, name, qty));
    }

    // Add to cart
    if (data.startsWith("add|")) {
      const [, locEnc, nameEnc, qStr] = data.split("|");
      const name = decodeURIComponent(nameEnc);
      const qty = Math.max(1, parseInt(qStr, 10) || 1);
      const loc = decodeURIComponent(locEnc);
      const p = (productsByLocation[loc] || []).find((x) => x.name === name);
      if (!p) return bot.sendMessage(chatId, "⚠️ Product not found.");
      db.run(
        `INSERT INTO cart (user_id, product_name, price, quantity)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(user_id, product_name)
         DO UPDATE SET quantity = quantity + excluded.quantity`,
        [String(chatId), name, p.price, qty],
        (err) => {
          if (err) {
            console.error(err);
            return bot.sendMessage(chatId, "⚠️ DB error.");
          }
          bot.sendMessage(
            chatId,
            `✅ Added *${qty}× ${name}* to cart.`,
            {
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [[{ text: "🛒 View Cart", callback_data: "cart|view" }]],
              },
            }
          );
        }
      );
      return;
    }

    // Quick buy = add then checkout
    if (data.startsWith("buy|")) {
      const [, locEnc, nameEnc, qStr] = data.split("|");
      const name = decodeURIComponent(nameEnc);
      const qty = Math.max(1, parseInt(qStr, 10) || 1);
      const loc = decodeURIComponent(locEnc);
      const p = (productsByLocation[loc] || []).find((x) => x.name === name);
      if (!p) return bot.sendMessage(chatId, "⚠️ Product not found.");
      db.run(
        `INSERT INTO cart (user_id, product_name, price, quantity)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(user_id, product_name)
         DO UPDATE SET quantity = quantity + excluded.quantity`,
        [String(chatId), name, p.price, qty],
        (err) => {
          if (err) {
            console.error(err);
            return bot.sendMessage(chatId, "⚠️ DB error.");
          }
          bot.sendMessage(
            chatId,
            `🧾 Ready to checkout *${name} × ${qty}*.`,
            {
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [[{ text: "🛒 View Cart", callback_data: "cart|view" }]],
              },
            }
          );
        }
      );
      return;
    }
  });
};