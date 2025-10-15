// =======================================================
// 📄 File: utils/aiVerifier.js
// Purpose: AI-powered payment verification (simulated)
// Folder: utils/
// =======================================================

/**
 * AI Payment Verification System
 * This simulates an AI that verifies payments by:
 * 1. Checking if the reference code matches
 * 2. Verifying the payment amount (within tolerance)
 * 3. Analyzing transaction hashes (basic validation)
 * 4. Returning confidence score
 */

/**
 * Main AI verification function
 * @param {Object} options - Verification options
 * @param {string} options.proofText - Transaction hash or proof text
 * @param {number} options.amountDue - Expected payment amount
 * @param {string} options.ref - Expected reference code
 * @returns {Promise<Object>} - Verification result with confidence
 */
async function verifyPaymentAI({ proofText, amountDue, ref }) {
  try {
    // Simulate AI processing delay (1-2 seconds)
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    // Initialize confidence score
    let confidence = 0;
    let checks = [];

    // ============================================
    // CHECK 1: Proof Text Exists
    // ============================================
    if (!proofText || proofText.trim() === "") {
      return {
        ok: false,
        confidence: 0,
        reason: "No payment proof provided. Please upload transaction hash or screenshot."
      };
    }

    // ============================================
    // CHECK 2: Auto-simulated payments (for testing)
    // ============================================
    if (proofText === "auto-simulated") {
      // Auto-confirm for testing/demo mode
      confidence = 0.95;
      checks.push("✅ Auto-simulation mode detected");
      checks.push(`✅ Expected amount: $${amountDue.toFixed(2)}`);
      checks.push(`✅ Reference code: ${ref}`);
      
      return {
        ok: true,
        confidence: confidence,
        reason: `AI verified payment (${(confidence * 100).toFixed(0)}% confidence)`,
        checks: checks
      };
    }

    // ============================================
    // CHECK 3: Transaction Hash Format
    // ============================================
    const txHashPattern = /^(0x)?[a-fA-F0-9]{40,64}$/;
    if (txHashPattern.test(proofText.trim())) {
      confidence += 0.4;
      checks.push("✅ Valid transaction hash format detected");
    } else {
      confidence += 0.1;
      checks.push("⚠️ Non-standard proof format (may be screenshot or text)");
    }

    // ============================================
    // CHECK 4: Reference Code Matching
    // ============================================
    const proofUpper = proofText.toUpperCase();
    const refUpper = ref.toUpperCase();
    
    if (proofUpper.includes(refUpper)) {
      confidence += 0.3;
      checks.push(`✅ Reference code ${ref} found in proof`);
    } else {
      checks.push(`⚠️ Reference code ${ref} not found in proof`);
    }

    // ============================================
    // CHECK 5: Amount Verification (fuzzy match)
    // ============================================
    const amountStr = amountDue.toFixed(2);
    const amountPatterns = [
      amountStr,
      amountDue.toString(),
      amountStr.replace('.', ','), // European format
    ];

    let amountFound = false;
    for (const pattern of amountPatterns) {
      if (proofText.includes(pattern)) {
        confidence += 0.2;
        checks.push(`✅ Amount $${amountStr} found in proof`);
        amountFound = true;
        break;
      }
    }

    if (!amountFound) {
      checks.push(`⚠️ Amount $${amountStr} not explicitly found`);
    }

    // ============================================
    // CHECK 6: Minimum Length Check
    // ============================================
    if (proofText.length >= 20) {
      confidence += 0.1;
      checks.push("✅ Sufficient proof detail provided");
    }

    // ============================================
    // DECISION LOGIC
    // ============================================
    
    // High confidence: Auto-approve
    if (confidence >= 0.75) {
      return {
        ok: true,
        confidence: confidence,
        reason: `Payment verified with high confidence (${(confidence * 100).toFixed(0)}%)`,
        checks: checks
      };
    }

    // Medium confidence: Manual review needed
    if (confidence >= 0.4) {
      return {
        ok: false,
        confidence: confidence,
        reason: `Payment requires manual review. Confidence: ${(confidence * 100).toFixed(0)}%. Admin will verify within 24 hours.`,
        checks: checks
      };
    }

    // Low confidence: Likely invalid
    return {
      ok: false,
      confidence: confidence,
      reason: `Payment verification failed. Low confidence: ${(confidence * 100).toFixed(0)}%. Please provide valid transaction hash or contact admin.`,
      checks: checks
    };

  } catch (error) {
    console.error("AI Verification Error:", error);
    return {
      ok: false,
      confidence: 0,
      reason: "AI verification system error. Admin will review manually."
    };
  }
}

/**
 * Generate a detailed verification report
 * @param {Object} result - Verification result
 * @returns {string} - Formatted report
 */
function generateVerificationReport(result) {
  let report = `🤖 **AI Payment Verification Report**\n\n`;
  report += `**Status:** ${result.ok ? "✅ APPROVED" : "❌ REJECTED"}\n`;
  report += `**Confidence:** ${(result.confidence * 100).toFixed(0)}%\n`;
  report += `**Reason:** ${result.reason}\n\n`;
  
  if (result.checks && result.checks.length > 0) {
    report += `**Verification Checks:**\n`;
    result.checks.forEach(check => {
      report += `${check}\n`;
    });
  }
  
  return report;
}

module.exports = {
  verifyPaymentAI,
  generateVerificationReport
};