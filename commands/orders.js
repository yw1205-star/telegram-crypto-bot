// commands/orders.js - FIXED

const { runAsync, allAsync, getAsync } = require("../config/database");
const payments = require("../utils/payments");
const { verifyPaymentAI } = require("../utils/aiVerifier");
const { t } = require("../utils/i18n");

// UPDATED WALLET ADDRESS
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

      if (data === "paid_claim") {
        await askProofOptions(bot, chatId, query);
        return true;
      }

      if (data === "paid_auto") {
        await handleAutoConfirm(bot, chatId, query);
        return true;
      }

      if (data === "paid_upload") {
        await handleUploadProof(bot, chatId, query);
        return true;
      }

      if (data === "cancel_checkout") {
        try { await bot.answerCallbackQuery(query.id, { text: t("en","cancel") }); } catch {}
        bot.sendMessage(chatId, t("en","cancel"));
        return true;
      }

      return false;

    } catch (err) {
      console.error("Orders callback error:", err);
      try { bot.answerCallbackQuery(query.id, { text: "Error processing request" }); } catch {}
      bot.sendMessage(chatId, "⚠️ An error occurred while processing checkout.");
      return true;
    }
  };
};

async function startCheckout(bot, chatId, q) {
  const u = await getAsync("SELECT lang FROM users WHERE user_id = ?", [chatId]);
  const lang = u?.lang || "en";

  const items = await allAsync(
    "SELECT product_name, quantity, price FROM cart WHERE user_id = ?",
    [String(chatId)]
  );

  if (!items || items.length === 0) {
    try { await bot.answerCallbackQuery(q.id, { text: t(lang, "emptyCart") }); } catch {}
    return bot.sendMessage(chatId, t(lang, "emptyCart"));
  }

  // FIX: Properly calculate total
  const total = items.reduce((s, r) => {
    const qty = 1; // quantity is already in the price from cart
    return s + (r.price * qty);
  }, 0);
  
  const summary = items.map(r => {
    return `• ${r.product_name} x${r.quantity} = $${(r.price).toFixed(2)}`;
  }).join("\n");

  const ref = payments.createRef();
  const { amountDue, centsSuffix } = payments.createUniqueAmount(total);

  await runAsync(
    `INSERT INTO orders (user_id, items, total, currency, status, ref_code, cents_suffix, amount_due)
     VALUES (?, ?, ?, ?, 'verifying', ?, ?, ?)`,
    [chatId, JSON.stringify(items), total, "USD", ref, centsSuffix, amountDue]
  );

  const textLines = [
    `🧾 *Checkout*`,
    `${summary}`,
    ``,
    `💰 *Total:* $${total.toFixed(2)} USD`,
    ``,
    `Please pay: *$${amountDue.toFixed(2)}*`,
    `*Reference:* \`${ref}\``,
    ``,
    `*Trust Wallet Address:*`,
    `\`${TRUST_WALLET_ADDRESS}\``,
    ``,
    `After payment, tap the button below.`
  ].join("\n");

  await bot.sendMessage(chatId, textLines, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "✅ I have paid", callback_data: "paid_claim" }],
        [{ text: "❌ Cancel", callback_data: "cancel_checkout" }]
      ]
    }
  });

  try { await bot.answerCallbackQuery(q.id, { text: "Checkout created" }); } catch {}
}

async function askProofOptions(bot, chatId, q) {
  const u = await getAsync("SELECT lang FROM users WHERE user_id = ?", [chatId]);
  const lang = u?.lang || "en";

  try { await bot.answerCallbackQuery(q.id, { text: "Confirm payment" }); } catch {}

  await bot.sendMessage(chatId, "How would you like to confirm payment?", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🟢 Auto-confirm (AI)", callback_data: "paid_auto" }],
        [{ text: "📤 Upload Proof", callback_data: "paid_upload" }]
      ]
    }
  });
}

async function handleAutoConfirm(bot, chatId, q) {
  try { await bot.answerCallbackQuery(q.id, { text: "Auto-confirm started" }); } catch {}
  await payments.simulateVerificationDelay(2500);
  await verifyAndConfirm(bot, chatId, "auto-simulated");
}

async function handleUploadProof(bot, chatId, q) {
  try { await bot.answerCallbackQuery(q.id, { text: "Upload proof selected" }); } catch {}

  await bot.sendMessage(chatId, "Please reply with the transaction hash or attach a photo.", {
    parse_mode: "Markdown",
    reply_markup: { force_reply: true }
  });

  const handler = async (msg) => {
    if (msg.chat.id !== chatId) return;
    bot.removeListener("message", handler);
    const proofText = msg.text || (msg.photo && msg.photo.length ? "[photo-attached]" : "");
    try {
      await verifyAndConfirm(bot, chatId, proofText);
    } catch (e) {
      console.error("verifyAndConfirm error:", e);
      bot.sendMessage(chatId, "Verification failed.");
    }
  };

  bot.on("message", handler);
}

async function verifyAndConfirm(bot, chatId, proofText) {
  const order = await getAsync(
    "SELECT * FROM orders WHERE user_id = ? AND status IN ('verifying','pending') ORDER BY id DESC LIMIT 1",
    [chatId]
  );

  if (!order) {
    return bot.sendMessage(chatId, "⚠️ No pending order found.");
  }

  const aiResult = await verifyPaymentAI({
    proofText,
    amountDue: order.amount_due,
    ref: order.ref_code
  });

  if (!aiResult.ok) {
    await runAsync("UPDATE orders SET status = ? WHERE id = ?", ["pending_review", order.id]);
    await bot.sendMessage(chatId, `⚠️ ${aiResult.reason || "Payment not auto-confirmed. Admin will review."}`);

    const items = JSON.parse(order.items || "[]");
    const summary = items.map(r => `• ${r.product_name} x${r.quantity} = $${r.price.toFixed(2)}`).join("\n");
    const adminMsg = [
      `⚠️ *Manual review required*`,
      `Order ID: ${order.id}`,
      `User: ${chatId}`,
      `Ref: ${order.ref_code}`,
      `Amount Due: $${order.amount_due}`,
      `Reason: ${aiResult.reason}`,
      ``,
      `Items:\n${summary}`,
      `Proof: ${proofText}`
    ].join("\n");

    try { await bot.sendMessage(ADMIN_CHAT_ID, adminMsg, { parse_mode: "Markdown" }); } catch (e) { console.error("Admin notify error:", e); }
    return;
  }

  await runAsync("UPDATE orders SET status='paid', paid_at=CURRENT_TIMESTAMP, payment_proof=? WHERE id=?", [proofText, order.id]);
  await runAsync("DELETE FROM cart WHERE user_id = ?", [String(chatId)]);

  const items = JSON.parse(order.items || "[]");
  const summary = items.map(r => `• ${r.product_name} x${r.quantity} = $${r.price.toFixed(2)}`).join("\n");
  
  await bot.sendMessage(chatId, `✅ *Payment confirmed!* (AI ${(aiResult.confidence || 0)*100}% confidence)\n\n${summary}\n\nYour order #${order.id} is confirmed.`, { parse_mode: "Markdown" });

  const adminMsg = [
    `📥 *New Paid Order*`,
    `Order ID: ${order.id}`,
    `User: ${chatId}`,
    `Ref: ${order.ref_code}`,
    `Amount Paid: $${order.amount_due}`,
    ``,
    `Items:\n${summary}`,
    `Payment proof: ${proofText}`
  ].join("\n");

  try { await bot.sendMessage(ADMIN_CHAT_ID, adminMsg, { parse_mode: "Markdown" }); } catch (e) { console.error("Admin notify error:", e); }
}