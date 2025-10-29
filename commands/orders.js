// commands/orders.js - Simple manual verification

const { runAsync, allAsync, getAsync } = require("../config/database");

const TRUST_WALLET_ADDRESS = "0xBEDA1c97d4d1bAc06AE7C278b920261576176937";
const ADMIN_CHAT_ID = 6328508264;

module.exports = (bot) => {
  
  bot._handleOrderCallback = async function(query) {
    const data = query.data;
    const chatId = query.message?.chat?.id;
    
    if (!chatId) return false;

    try {
      if (data === "checkout_from_cart") {
        await startCheckout(bot, chatId, query);
        return true;
      }

      if (data === "paid_upload") {
        await handleUploadProof(bot, chatId, query);
        return true;
      }

      if (data === "cancel_checkout") {
        try { await bot.answerCallbackQuery(query.id, { text: "Cancelled" }); } catch {}
        bot.sendMessage(chatId, "❌ Order cancelled.");
        return true;
      }

      return false;

    } catch (err) {
      console.error("Orders callback error:", err);
      try { bot.answerCallbackQuery(query.id, { text: "Error" }); } catch {}
      bot.sendMessage(chatId, "⚠️ An error occurred.");
      return true;
    }
  };
};

async function startCheckout(bot, chatId, q) {
  const items = await allAsync(
    "SELECT product_name, quantity, price FROM cart WHERE user_id = ?",
    [String(chatId)]
  );

  if (!items || items.length === 0) {
    try { await bot.answerCallbackQuery(q.id, { text: "Cart is empty" }); } catch {}
    return bot.sendMessage(chatId, "🛒 Your cart is empty.");
  }

  // Simple total - NO unique cents
  const total = items.reduce((s, r) => s + r.price, 0);
  const summary = items.map(r => `• ${r.product_name} x${r.quantity} = $${r.price.toFixed(2)}`).join("\n");

  // Generate reference for tracking only
  const ref = 'REF' + Date.now().toString().slice(-8);

  // Insert order
  await runAsync(
    `INSERT INTO orders (user_id, items, total, currency, status, ref_code, amount_due, created_at)
     VALUES (?, ?, ?, ?, 'pending', ?, ?, datetime('now'))`,
    [chatId, JSON.stringify(items), total, "USD", ref, total]
  );

  const textLines = [
    `🧾 *Checkout - Order ${ref}*`,
    ``,
    `${summary}`,
    ``,
    `━━━━━━━━━━━━━━━`,
    `💰 *Total Amount: $${total.toFixed(2)} USD*`,
    `━━━━━━━━━━━━━━━`,
    ``,
    `📝 *Reference Code:* \`${ref}\``,
    ``,
    `💳 *Trust Wallet Address:*`,
    `\`${TRUST_WALLET_ADDRESS}\``,
    ``,
    `⚠️ *Please include reference \`${ref}\` in your payment note!*`,
    ``,
    `After payment, click the button below to submit proof.`
  ].join("\n");

  await bot.sendMessage(chatId, textLines, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "📤 Submit Payment Proof", callback_data: "paid_upload" }],
        [{ text: "❌ Cancel Order", callback_data: "cancel_checkout" }]
      ]
    }
  });

  try { await bot.answerCallbackQuery(q.id, { text: "Order created!" }); } catch {}
}

async function handleUploadProof(bot, chatId, q) {
  try { 
    await bot.answerCallbackQuery(q.id, { text: "Please send payment proof" }); 
  } catch {}

  await bot.sendMessage(
    chatId, 
    "📤 *Submit Payment Proof*\n\n" +
    "Please send:\n" +
    "• Transaction hash/ID, OR\n" +
    "• Screenshot of payment receipt\n\n" +
    "Our team will verify and confirm your order within 24 hours.",
    {
      parse_mode: "Markdown",
      reply_markup: { force_reply: true }
    }
  );

  const handler = async (msg) => {
    if (msg.chat.id !== chatId) return;
    bot.removeListener("message", handler);
    
    const proofText = msg.text || "";
    const hasPhoto = msg.photo && msg.photo.length > 0;
    
    if (!proofText && !hasPhoto) {
      return bot.sendMessage(chatId, "⚠️ Please provide payment proof (transaction hash or screenshot).");
    }

    try {
      await submitToAdmin(bot, chatId, proofText, hasPhoto, msg);
    } catch (e) {
      console.error("Submit error:", e);
      bot.sendMessage(chatId, "⚠️ Error submitting proof. Please contact our customer service.");
    }
  };

  bot.on("message", handler);
}

async function submitToAdmin(bot, chatId, proofText, hasPhoto, msg) {
  const order = await getAsync(
    "SELECT * FROM orders WHERE user_id = ? AND status = 'pending' ORDER BY id DESC LIMIT 1",
    [chatId]
  );

  if (!order) {
    return bot.sendMessage(chatId, "⚠️ No pending order found. Please create an order first.");
  }

  // Update order with proof
  await runAsync(
    "UPDATE orders SET payment_proof = ?, status = 'pending_review' WHERE id = ?", 
    [proofText || "[photo-attached]", order.id]
  );

  const items = JSON.parse(order.items || "[]");
  const summary = items.map(r => `• ${r.product_name} x${r.quantity} = $${r.price.toFixed(2)}`).join("\n");

  // Notify customer
  await bot.sendMessage(
    chatId,
    `✅ *Payment Proof Submitted Successfully!*\n\n` +
    `📝 Order: ${order.ref_code}\n` +
    `💰 Amount: $${order.total.toFixed(2)} USD\n\n` +
    `Your payment is being verified by our team.\n` +
    `You will receive confirmation within 24 hours.\n\n` +
    `Thank you for your order! 🙏`,
    { parse_mode: "Markdown" }
  );

  // Notify admin
  const adminMsg = [
    `🔔 *NEW PAYMENT PROOF RECEIVED*`,
    ``,
    `📝 Order: ${order.ref_code}`,
    `👤 Customer ID: ${chatId}`,
    `💰 Amount: $${order.total.toFixed(2)} USD`,
    ``,
    `📦 *Order Details:*`,
    `${summary}`,
    ``,
    `💳 *Payment Proof:*`,
    `${proofText || "[See photo below]"}`,
    ``,
    `⚠️ *Action Required:* Please verify payment in Trust Wallet and confirm order.`
  ].join("\n");

  try {
    await bot.sendMessage(ADMIN_CHAT_ID, adminMsg, { parse_mode: "Markdown" });
    
    // Forward photo if customer sent one
    if (hasPhoto) {
      await bot.forwardMessage(ADMIN_CHAT_ID, chatId, msg.message_id);
    }
  } catch (e) {
    console.error("Admin notify error:", e);
  }

  // Clear cart after order is created
  await runAsync("DELETE FROM cart WHERE user_id = ?", [String(chatId)]);
}