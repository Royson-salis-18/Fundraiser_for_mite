// Platform fee helpers. All money math is done in integer paise to avoid
// floating point drift (₹ amounts are converted to paise, fee rounded to nearest paisa).

const DEFAULT_FEE_PERCENT = 2;

function getFeePercent(env = process.env) {
  const raw = Number(env.PLATFORM_FEE_PERCENT);
  if (!Number.isFinite(raw) || raw < 0 || raw > 20) return DEFAULT_FEE_PERCENT;
  return raw;
}

// Returns { baseAmount, feeAmount, totalAmount } in rupees (2 decimals).
function computeFee(baseRupees, percent = getFeePercent()) {
  const basePaise = Math.round((Number(baseRupees) || 0) * 100);
  if (basePaise <= 0) return { baseAmount: 0, feeAmount: 0, totalAmount: 0 };
  const feePaise = Math.round((basePaise * percent) / 100);
  return {
    baseAmount: basePaise / 100,
    feeAmount: feePaise / 100,
    totalAmount: (basePaise + feePaise) / 100,
  };
}

module.exports = { computeFee, getFeePercent, DEFAULT_FEE_PERCENT };
