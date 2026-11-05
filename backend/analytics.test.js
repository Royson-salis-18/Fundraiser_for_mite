const test = require('node:test');
const assert = require('node:assert');
const { buildAnalytics, parseUSN, studentStatus } = require('./analytics');

const ev = (id, type, amount, targetClass = '') => ({ _id: id, title: id, type, amount, targetClass });
const stu = (usn, mandatory = [], optional = []) => ({ _id: usn, role: 'student', usn, name: usn, payments: { mandatory, optional } });

test('parses USN into branch and batch', () => {
  assert.deepStrictEqual(parseUSN('4mt22cs001'), { college: '4MT', batch: 2022, branch: 'CS', roll: '001' });
  assert.strictEqual(parseUSN('garbage').branch, 'NA');
});

test('student status rules', () => {
  const m = (s) => ({ type: 'mandatory', status: s });
  assert.strictEqual(studentStatus([m('confirmed'), m('confirmed')]), 'paid');
  assert.strictEqual(studentStatus([m('confirmed'), m('rejected')]), 'rejected');
  assert.strictEqual(studentStatus([m('pending'), m('confirmed')]), 'review');
  assert.strictEqual(studentStatus([m('confirmed'), m('unpaid')]), 'partial');
  assert.strictEqual(studentStatus([m('unpaid'), m('unpaid')]), 'unpaid');
  assert.strictEqual(studentStatus([]), 'paid');
});

test('aggregates by branch and class with correct money', () => {
  const events = [ev('E1', 'mandatory', 500), ev('E2', 'mandatory', 1000), ev('O1', 'optional', 300)];
  const users = [
    stu('4MT22CS001', [{ id: 'E1', paid: true, status: 'confirmed', confirmedAt: '2026-11-04T10:00:00Z' }, { id: 'E2', paid: true, status: 'confirmed', confirmedAt: '2026-11-04T10:00:00Z' }], [{ id: 'O1', paid: true, status: 'confirmed' }]),
    stu('4MT22CS002', [{ id: 'E1', paid: true, status: 'pending' }]),
    stu('4MT23ME001', []),
    { _id: 'a', role: 'admin', usn: 'admin' },
  ];
  const a = buildAnalytics(users, events, { now: new Date('2026-11-05T00:00:00Z'), days: 5 });
  assert.strictEqual(a.summary.students, 3);
  assert.strictEqual(a.summary.due, 4500);
  assert.strictEqual(a.summary.collected, 1500);
  assert.strictEqual(a.summary.pending, 500);
  assert.strictEqual(a.summary.outstanding, 3000);
  assert.deepStrictEqual(a.summary.statusCounts, { paid: 1, review: 0, partial: 1, rejected: 0, unpaid: 1 });
  const cs = a.branches.find((b) => b.key === 'CS');
  assert.strictEqual(cs.students, 2);
  assert.strictEqual(cs.collected, 1500);
  assert.strictEqual(a.classes.length, 2);
  assert.strictEqual(a.summary.optionalRevenue, 300);
  assert.strictEqual(a.events.find((e) => e.id === 'O1').applicable, 1);
  assert.strictEqual(a.timeline.at(-2).amount, 1500); // 500 + 1000 confirmed on 4 Nov
  assert.strictEqual(a.timeline.at(-1).amount, 300); // undated optional confirmation falls back to 'now'
});

test('targetClass restricts a mandatory event', () => {
  const events = [ev('E1', 'mandatory', 100, 'CS 2022')];
  const users = [stu('4MT22CS001'), stu('4MT22ME001'), stu('4MT23CS001')];
  const a = buildAnalytics(users, events);
  assert.strictEqual(a.events[0].applicable, 1);
  assert.strictEqual(a.students.find((s) => s.usn === '4MT22ME001').items.length, 0);
  assert.strictEqual(a.summary.due, 100);
});
