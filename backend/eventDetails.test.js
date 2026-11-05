const test = require('node:test');
const assert = require('node:assert');
const { sanitizeDetails, withSanitizedDetails } = require('./eventDetails');

test('caps lengths, drops empty rows and totals the budget', () => {
  const d = sanitizeDetails({
    tagline: 'x'.repeat(500),
    highlights: ['One', '', '  Two  ', 5],
    schedule: [{ time: '9:00', title: 'Kick-off' }, { title: '' }],
    budget: [{ category: 'Venue', item: 'Hall', amount: '1000.5' }, { item: 'Prizes', amount: 2000 }, { item: 'Bad', amount: -5 }],
  });
  assert.strictEqual(d.tagline.length, 140);
  assert.deepStrictEqual(d.highlights, ['One', 'Two']);
  assert.strictEqual(d.schedule.length, 1);
  assert.strictEqual(d.budget.length, 3);
  assert.strictEqual(d.budget[2].amount, 0);
  assert.strictEqual(d.budget[1].category, 'Other');
  assert.strictEqual(d.budgetTotal, 3000.5);
});

test('ignores unknown keys and bad dates, never trusts client budgetTotal', () => {
  const d = withSanitizedDetails({ title: 'T', budgetTotal: 999999, startDate: 'not a date', budget: [{ item: 'A', amount: 10 }], extra: 1 });
  assert.strictEqual(d.startDate, '');
  assert.strictEqual(d.budgetTotal, 10);
  assert.strictEqual(d.title, 'T');
});
