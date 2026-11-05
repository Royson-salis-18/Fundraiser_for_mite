// Payment analytics: pure functions over users + events (no database access), so they are easy to test.
const { computeFee } = require('./fees');

const BRANCHES = {
  CS: 'Computer Science', IS: 'Information Science', EC: 'Electronics & Communication', EE: 'Electrical & Electronics',
  ME: 'Mechanical', CV: 'Civil', AI: 'AI & Machine Learning', AD: 'AI & Data Science', CD: 'Computer Science (Data Science)',
  CY: 'Cyber Security', BT: 'Biotechnology', CH: 'Chemical', RA: 'Robotics & Automation', MD: 'Medical Electronics',
};

// 4MT22CS001 -> { college: '4MT', batch: 2022, branch: 'CS', roll: '001' }. Lateral-entry suffix (CS4xx) is tolerated.
function parseUSN(usn = '') {
  const m = String(usn).trim().toUpperCase().match(/^(\d[A-Z]{2})(\d{2})([A-Z]{2,3})(\d{1,4})$/);
  if (!m) return { college: '', batch: null, branch: 'NA', roll: '' };
  return { college: m[1], batch: 2000 + Number(m[2]), branch: m[3], roll: m[4] };
}

const idOf = (p) => String(p?.id ?? p?._id ?? '');

// An event's free-text targetClass (e.g. "CS 2022", "all", "ME") narrows who owes it.
// Branch tokens and batch-year tokens must BOTH match when both are present; text we cannot
// interpret (e.g. "final year") applies to everyone rather than silently excluding students.
function targets(event, student) {
  const t = String(event.targetClass || '').toLowerCase().trim();
  if (!t || /\ball\b/.test(t)) return true;
  const tokens = t.split(/[^a-z0-9]+/).filter(Boolean);
  const branches = tokens.filter((x) => BRANCHES[x.toUpperCase()]).map((x) => x.toUpperCase());
  const years = tokens.filter((x) => /^(20)?\d{2}$/.test(x)).map((x) => (x.length === 2 ? 2000 + Number(x) : Number(x)));
  if (!branches.length && !years.length) return true;
  return (!branches.length || branches.includes(student.branch)) && (!years.length || years.includes(student.batch));
}

const recordStatus = (rec) => {
  if (!rec) return 'unpaid';
  if (rec.status === 'confirmed') return 'confirmed';
  if (rec.status === 'rejected') return 'rejected';
  if (rec.status === 'pending' || rec.paid) return rec.status === 'pending' || rec.paid ? 'pending' : 'unpaid';
  return 'unpaid';
};

function studentStatus(items) {
  const mand = items.filter((i) => i.type === 'mandatory');
  if (!mand.length) return 'paid';
  if (mand.every((i) => i.status === 'confirmed')) return 'paid';
  if (mand.some((i) => i.status === 'rejected')) return 'rejected';
  const unpaid = mand.filter((i) => i.status === 'unpaid').length;
  const progressed = mand.filter((i) => i.status === 'confirmed' || i.status === 'pending').length;
  if (unpaid === 0) return 'review';
  return progressed > 0 ? 'partial' : 'unpaid';
}

const pct = (a, b) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);
const r2 = (n) => Math.round(n * 100) / 100;

function emptyGroup(key, extra = {}) {
  return { key, ...extra, students: 0, paid: 0, review: 0, partial: 0, rejected: 0, unpaid: 0, due: 0, collected: 0, pending: 0, outstanding: 0 };
}

function addToGroup(g, s) {
  g.students += 1;
  g[s.status] += 1;
  g.due += s.due; g.collected += s.collected; g.pending += s.pendingAmount; g.outstanding += s.outstanding;
}

function finishGroup(g) {
  g.due = r2(g.due); g.collected = r2(g.collected); g.pending = r2(g.pending); g.outstanding = r2(g.outstanding);
  g.rate = pct(g.collected, g.due);
  g.paidRate = pct(g.paid, g.students);
  return g;
}

function buildAnalytics(users, events, { feePercent = 2, now = new Date(), days = 30 } = {}) {
  const students = users.filter((u) => u.role === 'student');
  const evById = new Map(events.map((e) => [String(e._id), e]));
  const roster = [];
  const eventStats = new Map(events.map((e) => [String(e._id), {
    id: String(e._id), title: e.title, type: e.type, amount: Number(e.amount) || 0, targetClass: e.targetClass || '',
    applicable: 0, confirmed: 0, pending: 0, rejected: 0, unpaid: 0, collected: 0,
  }]));
  const daily = new Map();
  let feesEarned = 0; let optionalRevenue = 0;

  for (const u of students) {
    const parsed = parseUSN(u.usn);
    const s = { ...parsed, id: String(u._id), usn: u.usn, name: u.name, email: u.email };
    const recs = new Map();
    [...(u.payments?.mandatory || []), ...(u.payments?.optional || [])].forEach((r) => recs.set(idOf(r), r));

    const items = [];
    for (const ev of events) {
      const id = String(ev._id);
      const rec = recs.get(id);
      const mandatory = ev.type === 'mandatory';
      if (mandatory && !targets(ev, s)) continue;
      if (!mandatory && !rec) continue; // optional events only count for students who opted in
      const status = recordStatus(rec);
      const amount = Number(ev.amount) || 0;
      items.push({ eventId: id, title: ev.title, type: ev.type, amount, status, utr: rec?.utr || '', at: rec?.confirmedAt || rec?.paidDate || null });
      const st = eventStats.get(id);
      st.applicable += 1; st[status] += 1;
      if (status === 'confirmed') {
        st.collected += amount;
        const fee = rec.feeAmount != null ? Number(rec.feeAmount) : computeFee(amount, feePercent).feeAmount;
        feesEarned += fee;
        if (!mandatory) optionalRevenue += amount;
        const when = new Date(rec.confirmedAt || rec.paidDate || now);
        if (!Number.isNaN(when.getTime())) {
          const k = when.toISOString().slice(0, 10);
          daily.set(k, (daily.get(k) || 0) + amount);
        }
      }
    }

    const mand = items.filter((i) => i.type === 'mandatory');
    s.status = studentStatus(items);
    s.due = mand.reduce((t, i) => t + i.amount, 0);
    s.collected = mand.filter((i) => i.status === 'confirmed').reduce((t, i) => t + i.amount, 0);
    s.pendingAmount = mand.filter((i) => i.status === 'pending').reduce((t, i) => t + i.amount, 0);
    s.outstanding = s.due - s.collected;
    s.classLabel = `${s.branch} ${s.batch || ''}`.trim();
    s.branchName = BRANCHES[s.branch] || s.branch;
    s.items = items;
    roster.push(s);
  }

  const byBranch = new Map(); const byBatch = new Map(); const byClass = new Map(); const overall = emptyGroup('all');
  for (const s of roster) {
    if (!byBranch.has(s.branch)) byBranch.set(s.branch, emptyGroup(s.branch, { name: BRANCHES[s.branch] || s.branch }));
    const batchKey = String(s.batch || 'NA');
    if (!byBatch.has(batchKey)) byBatch.set(batchKey, emptyGroup(batchKey));
    if (!byClass.has(s.classLabel)) byClass.set(s.classLabel, emptyGroup(s.classLabel, { branch: s.branch, batch: s.batch }));
    [byBranch.get(s.branch), byBatch.get(batchKey), byClass.get(s.classLabel), overall].forEach((g) => addToGroup(g, s));
  }

  // collections timeline for the last `days` days (cumulative as well as daily)
  const timeline = [];
  let running = 0;
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now); d.setUTCDate(d.getUTCDate() - i);
    const k = d.toISOString().slice(0, 10);
    const v = daily.get(k) || 0;
    running += v;
    timeline.push({ date: k, amount: v, cumulative: running });
  }

  const sortGroups = (m, by) => [...m.values()].map(finishGroup).sort(by);
  const statusCounts = { paid: 0, review: 0, partial: 0, rejected: 0, unpaid: 0 };
  roster.forEach((s) => { statusCounts[s.status] += 1; });

  return {
    generatedAt: now.toISOString(),
    feePercent,
    summary: {
      ...finishGroup(overall),
      statusCounts,
      feesEarned: r2(feesEarned),
      optionalRevenue: r2(optionalRevenue),
    },
    branches: sortGroups(byBranch, (a, b) => b.rate - a.rate),
    batches: sortGroups(byBatch, (a, b) => Number(b.key) - Number(a.key)),
    classes: sortGroups(byClass, (a, b) => a.key.localeCompare(b.key)),
    events: [...eventStats.values()].map((e) => ({ ...e, collected: r2(e.collected), rate: pct(e.confirmed, e.applicable) })),
    timeline,
    students: roster.sort((a, b) => a.usn.localeCompare(b.usn)),
  };
}

module.exports = { buildAnalytics, parseUSN, studentStatus, BRANCHES };
