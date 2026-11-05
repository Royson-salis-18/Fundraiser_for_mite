const test = require('node:test');
const assert = require('node:assert');
const { computeFee, getFeePercent } = require('./fees');

test('computes 2% fee', () => {
  assert.deepStrictEqual(computeFee(500, 2), { baseAmount: 500, feeAmount: 10, totalAmount: 510 });
});
test('rounds to nearest paisa without float drift', () => {
  assert.deepStrictEqual(computeFee(199.99, 2.5), { baseAmount: 199.99, feeAmount: 5, totalAmount: 204.99 });
});
test('zero / invalid amounts', () => {
  assert.deepStrictEqual(computeFee(0, 2), { baseAmount: 0, feeAmount: 0, totalAmount: 0 });
  assert.deepStrictEqual(computeFee('abc', 2), { baseAmount: 0, feeAmount: 0, totalAmount: 0 });
});
test('fee percent falls back to default when invalid', () => {
  assert.strictEqual(getFeePercent({ PLATFORM_FEE_PERCENT: '-1' }), 2);
  assert.strictEqual(getFeePercent({ PLATFORM_FEE_PERCENT: '3' }), 3);
  assert.strictEqual(getFeePercent({}), 2);
});
