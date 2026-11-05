const test = require('node:test');
const assert = require('node:assert');
const { buildHighlights } = require('./hype');

const NOW = new Date('2026-11-05T00:00:00Z');
const d = (days) => new Date(NOW.getTime() + days * 86400000).toISOString();
const ev = (id, o = {}) => ({ _id: id, title: id, type: 'optional', amount: 100, ...o });
const stu = (recs) => ({ role: 'student', payments: { mandatory: [], optional: recs } });

test('counts joined and recent, sorts soonest first, drops past events', () => {
  const events = [ev('Late', { startDate: d(30) }), ev('Soon', { startDate: d(5) }), ev('Past', { startDate: d(-3), deadline: d(-5) })];
  const users = [
    stu([{ id: 'Soon', status: 'confirmed', paidDate: d(-1) }, { id: 'Late', status: 'pending', paidDate: d(-20) }]),
    stu([{ id: 'Soon', status: 'pending', paidDate: d(-2) }, { id: 'Soon', status: 'rejected', paidDate: d(-1) }]),
    { role: 'admin' },
  ];
  const h = buildHighlights(events, users, { now: NOW });
  assert.deepStrictEqual(h.map((x) => x.id), ['Soon', 'Late']);
  assert.strictEqual(h[0].joined, 2); // one confirmed + one pending; the rejected record is not counted
  assert.strictEqual(h[0].recent, 2);
});

test('uses deadline when there is no start date and flags trending only with real momentum', () => {
  const events = [ev('A', { deadline: d(3) })];
  const mk = (n) => Array.from({ length: n }, () => stu([{ id: 'A', status: 'confirmed', paidDate: d(-1) }]));
  assert.strictEqual(buildHighlights(events, mk(2), { now: NOW })[0].trending, false);
  assert.strictEqual(buildHighlights(events, mk(4), { now: NOW })[0].trending, true);
  assert.strictEqual(buildHighlights(events, mk(4), { now: NOW })[0].recent, 4);
});

test('never exposes student fields', () => {
  const h = buildHighlights([ev('A', { startDate: d(2) })], [stu([{ id: 'A', status: 'confirmed', paidDate: d(-1), utr: '123' }])], { now: NOW });
  assert.ok(!JSON.stringify(h).includes('123'));
});
