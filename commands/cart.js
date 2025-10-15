// =======================================================
// 📄 File: commands/cart.js (NO DUPLICATES)
// Purpose: Display cart contents and trigger checkout
// =======================================================

const { allAsync, runAsync, getAsync } = require("../config/database");
const { t, matchesButton } = require("../utils/i18n");

module.exports = (bot) => {
  // ------------------- /cart command -------------------
  bot.onText(/^\/cart$/, async (msg) => {
    const chatId = msg.chat.id;
    await displayCart(bot, chatId);
  });

  // ------------------- Handle cart button from keyboard -------------------
  bot.on("message", async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;
    const text = msg.text.trim();
    
    // Only handle cart button
    if (matchesButton(text, "viewCart")) {
      await displayCart(bot, msg.chat.id);
    }
  });

  // ------------------- Inline buttons -------------------
  bot.on("callback_query", async (q) => {
    if (!q.data) return;
    const chatId = q.message?.chat?.id;
    const data = q.data;
    if (!chatId) return;

    try {
      // Empty cart
      if (data === "empty_cart") {
        await runAsync("DELETE FROM cart WHERE user_id = ?", [String(chatId)]);
        await bot.answerCallbackQuery(q.id, { text: "🗑️ Cart emptied." });
        return bot.sendMessage(chatId, "🧺 Your cart has been cleared.");
      }

      // View Cart from inline button
      if (data === "cart|view") {
        await bot.answerCallbackQuery(q.id, { text: "Opening cart..." });
        return displayCart(bot, chatId);
      }

      // Checkout - pass through to orders.js
      if (data === "checkout_from_cart") {
        await bot.answerCallbackQuery(q.id, { text: "Proceeding to checkout..." });
        // The orders.js handler will catch this
        return;
      }
    } catch (err) {
      console.error("Cart button error:", err);
      bot.answerCallbackQuery(q.id, { text: "Error", show_alert: false });
    }
  });
};

// Helper function to display cart
async function displayCart(bot, chatId) {
  try {
    const u = await getAsync("SELECT lang FROM users WHERE user_id = ?", [chatId]);
    const lang = u?.lang || "en";

    const rows = await allAsync(
      "SELECT product_name, quantity, price FROM cart WHERE user_id = ?",
      [String(chatId)]
    );
    
    if (!rows || rows.length === 0) {
      return bot.sendMessage(chatId, t(lang, "emptyCart"));
    }

    let total = 0;
    const lines = rows.map((r) => {
      total += r.price * r.quantity;
      return `• ${r.product_name} ×${r.quantity} = $${(r.price * r.quantity).toFixed(2)}`;
    });

    const text =
      `${t(lang, "cartTitle")}\n${lines.join("\n")}\n\n${t(lang, "total")} $${total.toFixed(2)}`;

    bot.sendMessage(chatId, text, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: t(lang, "checkout"), callback_data: "checkout_from_cart" }],
          [{ text: t(lang, "empty"), callback_data: "empty_cart" }],
        ],
      },
    });
  } catch (err) {
    console.error("Cart error:", err);
    bot.sendMessage(chatId, "⚠️ Failed to load your cart.\n" + err.message);
  }
}