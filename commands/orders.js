// =======================================================
// 📄 File: commands/orders.js
// Purpose: Dummy checkout flow + AI-simulated payment confirmation
// Folder: commands/
// =======================================================

const { runAsync, allAsync, getAsync } = require("../config/database");
const payments = require("../utils/payments");        // createRef, createUniqueAmount, simulateVerificationDelay
const { verifyPaymentAI } = require("../utils/aiVerifier"); // safe AI simulation
const { t } = require("../utils/i18n");

// 🔧 EDIT THIS: replace with your real wallet address later
const TRUST_WALLET_ADDRESS = "0xFAKE1234ABCD5678EF9012345678FAKE";

// Admin Telegram ID (where order notifications will be sent)
const ADMIN_CHAT_ID = 6328508264;

module.exports = (bot) => {
  // Central callback handler for checkout-related flows
  bot.on("callback_query", async (q) => {
    if (!q?.data) return;
    const data = q.data;
    const chatId = q.message?.chat?.id;
    if (!chatId) {
      // safety
      try { bot.answerCallbackQuery(q.id, { text: "No chat context" }); } catch {}
      return;
    }

    try {
      if (data === "checkout_from_cart") {
        return await startCheckout(bot, chatId, q);
      }

      if (data === "paid_claim") {
        return await askProofOptions(bot, chatId, q);
      }

      if (data === "paid_auto") {
        return await handleAutoConfirm(bot, chatId, q);
      }

      if (data === "paid_upload") {
        return await handleUploadProof(bot, chatId, q);
      }

      if (data === "cancel_checkout") {
        try { await bot.answerCallbackQuery(q.id, { text: t("en","cancel") }); } catch {}
        return bot.sendMessage(chatId, t("en","cancel"));
      }
    } catch (err) {
      console.error("Orders callback error:", err);
      try { bot.answerCallbackQuery(q.id, { text: "Error processing request" }); } catch {}
      bot.sendMessage(chatId, "⚠️ An error occurred while processing checkout.");
    }
  });
};

// ---------------- Start checkout: read cart, create order ----------------
async function startCheckout(bot, chatId, q) {
  const u = await getAsync("SELECT lang FROM users WHERE user_id = ?", [chatId]);
  const lang = u?.lang || "en";

  // read cart when starting checkout
  const items = await allAsync(
  "SELECT product_name, quantity, price FROM cart WHERE user_id = ?",
  [String(chatId)]
  );

  if (!items || items.length === 0) {
    try { await bot.answerCallbackQuery(q.id, { text: t(lang, "emptyCart") }); } catch {}
    return bot.sendMessage(chatId, t(lang, "emptyCart"));
  }

  const total = items.reduce((s, r) => s + r.price * r.quantity, 0);
  const summary = items.map(r => `• ${r.product_name} x${r.quantity} = $${(r.price * r.quantity).toFixed(2)}`).join("\n");

  // generate unique ref and unique amount (adds cents)
  const ref = payments.createRef();
  const { amountDue, centsSuffix } = payments.createUniqueAmount(total);

  // Insert order record with status 'verifying'
  await runAsync(
    `INSERT INTO orders (user_id, items, total, currency, status, ref_code, cents_suffix, amount_due)
     VALUES (?, ?, ?, ?, 'verifying', ?, ?, ?)`,
    [chatId, JSON.stringify(items), total, "USD", ref, centsSuffix, amountDue]
  );

  // Build message
  const textLines = [
    `🧾 *${t(lang,"checkout") || "Checkout"}*`,
    `${summary}`,
    ``,
    `${t(lang,"total") || "Total:"} $${total.toFixed(2)} USD`,
    ``,
    `${t(lang,"checkoutPayPrompt") || "Please pay"} *$${amountDue.toFixed(2)}*`,
    `*Reference:* ${ref}`,
    ``,
    `${t(lang,"trustWalletLabel") || "Trust Wallet Address:"}`,
    `\`${TRUST_WALLET_ADDRESS}\``,
    ``,
    `${t(lang,"checkoutAfterPay") || "After payment, tap the button below and choose confirmation method."}`
  ].join("\n");

  await bot.sendMessage(chatId, textLines, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: t(lang, "confirmPaid") || "✅ I have paid", callback_data: "paid_claim" }],
        [{ text: t(lang, "cancel") || "❌ Cancel", callback_data: "cancel_checkout" }]
      ]
    }
  });

  try { await bot.answerCallbackQuery(q.id, { text: "Checkout created" }); } catch {}
}

// ---------------- Ask proof options (Auto or Upload) ----------------
async function askProofOptions(bot, chatId, q) {
  const u = await getAsync("SELECT lang FROM users WHERE user_id = ?", [chatId]);
  const lang = u?.lang || "en";

  try { await bot.answerCallbackQuery(q.id, { text: t(lang, "confirmPaid") || "Confirm payment" }); } catch {}

  await bot.sendMessage(chatId, t(lang, "chooseVerifyMethod") || "How would you like to confirm payment?", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🟢 Auto-confirm (AI)", callback_data: "paid_auto" }],
        [{ text: "📤 Upload Proof", callback_data: "paid_upload" }]
      ]
    }
  });
}

// ---------------- Auto-confirm path (simulate AI verification) ----------------
async function handleAutoConfirm(bot, chatId, q) {
  const u = await getAsync("SELECT lang FROM users WHERE user_id = ?", [chatId]);
  const lang = u?.lang || "en";

  try { await bot.answerCallbackQuery(q.id, { text: "Auto-confirm started" }); } catch {}

  // Small simulated delay so it feels realistic
  await payments.simulateVerificationDelay(2500);

  // We'll pass a dummy proofText to AI verifier so logic uses order reference & amount
  await verifyAndConfirm(bot, chatId, "auto-simulated");
}

// ---------------- Upload proof path (force-reply to collect next message) ----------------
async function handleUploadProof(bot, chatId, q) {
  const u = await getAsync("SELECT lang FROM users WHERE user_id = ?", [chatId]);
  const lang = u?.lang || "en";

  try { await bot.answerCallbackQuery(q.id, { text: "Upload proof selected" }); } catch {}

  await bot.sendMessage(chatId, t(lang, "uploadProofPrompt") || "Please reply with the transaction hash or attach a photo of the slip.", {
    parse_mode: "Markdown",
    reply_markup: { force_reply: true }
  });

  // One-time listener to capture the next message from this user
  const handler = async (msg) => {
    if (msg.chat.id !== chatId) return; // not for this user
    bot.removeListener("message", handler);
    const proofText = msg.text || (msg.photo && msg.photo.length ? "[photo-attached]" : "");
    try {
      await verifyAndConfirm(bot, chatId, proofText);
    } catch (e) {
      console.error("verifyAndConfirm error (upload):", e);
      bot.sendMessage(chatId, t(lang, "verifyError") || "Verification failed; admin will review.");
    }
  };

  bot.on("message", handler);
}

// ---------------- Core: verify by AI simulation and finalize order ----------------
async function verifyAndConfirm(bot, chatId, proofText) {
  // get the most recent pending order for this user
  const order = await getAsync(
    "SELECT * FROM orders WHERE user_id = ? AND status IN ('verifying','pending') ORDER BY id DESC LIMIT 1",
    [chatId]
  );

  if (!order) {
    return bot.sendMessage(chatId, "⚠️ No pending order found.");
  }

  // call the AI verifier (safe, local simulation)
  const aiResult = await verifyPaymentAI({
    proofText,
    amountDue: order.amount_due,
    ref: order.ref_code
  });

  // if AI does not approve, inform user & send admin for manual review
  if (!aiResult.ok) {
    // mark order as 'pending_review'
    await runAsync("UPDATE orders SET status = ? WHERE id = ?", ["pending_review", order.id]);

    // Notify user
    await bot.sendMessage(chatId, `⚠️ ${aiResult.reason || "Payment not auto-confirmed. Admin will review."}`);

    // Notify admin with details
    const items = JSON.parse(order.items || "[]");
    const summary = items.map(r => `• ${r.product_name} x${r.quantity} = $${(r.price * r.quantity).toFixed(2)}`).join("\n");
    const adminMsg = [
      `⚠️ *Manual review required*`,
      `Order ID: ${order.id}`,
      `User: ${chatId}`,
      `Ref: ${order.ref_code || "(n/a)"}`,
      `Amount Due: $${order.amount_due}`,
      `Reason: ${aiResult.reason || "AI could not verify"}`,
      ``,
      `Items:\n${summary}`,
      ``,
      `Proof: ${proofText || "(none)"}`
    ].join("\n");

    try { await bot.sendMessage(ADMIN_CHAT_ID, adminMsg, { parse_mode: "Markdown" }); } catch (e) { console.error("Admin notify error:", e); }

    return;
  }

  // AI approved → mark order paid
  await runAsync("UPDATE orders SET status='paid', paid_at=CURRENT_TIMESTAMP, payment_proof=? WHERE id=?", [proofText || "auto-simulated", order.id]);

  // after payment confirmation, clear cart
  await runAsync("DELETE FROM cart WHERE user_id = ?", [String(chatId)]);

  // notify user
  const items = JSON.parse(order.items || "[]");
  const summary = items.map(r => `• ${r.product_name} x${r.quantity} = $${(r.price * r.quantity).toFixed(2)}`).join("\n");
  await bot.sendMessage(chatId, `✅ *Payment confirmed!* (AI ${(aiResult.confidence || 0)*100}% confidence)\n\n${summary}\n\nYour order #${order.id} is now confirmed.`, { parse_mode: "Markdown" });

  // notify admin
  const adminMsg = [
    `📥 *New Paid Order*`,
    `Order ID: ${order.id}`,
    `User: ${chatId}`,
    `Ref: ${order.ref_code || "(n/a)"}`,
    `Amount Paid: $${order.amount_due}`,
    ``,
    `Items:\n${summary}`,
    ``,
    `Payment proof: ${proofText || "auto-simulated"}`
  ].join("\n");

  try { await bot.sendMessage(ADMIN_CHAT_ID, adminMsg, { parse_mode: "Markdown" }); } catch (e) { console.error("Admin notify error:", e); }

  // provide user a quick link to contact admin if needed
  try {
    const adminLink = `https://t.me/${ADMIN_CHAT_ID}`;
    await bot.sendMessage(chatId, `${t("en","paymentConfirmed") || "Payment received!"}\n\n${t("en","contactAdmin") || "Contact admin:"}`, {
      reply_markup: { inline_keyboard: [[{ text: "💬 Chat with Admin", url: adminLink }]] }
    });
  } catch (e) {
    console.error("Admin link send error:", e);
  }
}
