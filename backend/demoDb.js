// Minimal in-memory stand-in for the MongoDB driver surface used by server.js.
// Enabled with DEMO_MODE=true so the app can be demoed without a database.
// Not for production: data lives in memory and is lost on restart.
const { ObjectId } = require('mongodb');

const clone = (v) => {
  if (v instanceof ObjectId) return v;
  if (v instanceof Date) return new Date(v);
  if (Array.isArray(v)) return v.map(clone);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clone(x)]));
  return v;
};

const sameValue = (a, b) => String(a) === String(b);

function matches(doc, query = {}) {
  return Object.entries(query).every(([key, cond]) => {
    if (key === '$or') return cond.some((q) => matches(doc, q));
    const val = doc[key];
    if (cond instanceof RegExp) return typeof val === 'string' && cond.test(val);
    if (cond && typeof cond === 'object' && !(cond instanceof ObjectId) && !(cond instanceof Date)) {
      if ('$regex' in cond) return typeof val === 'string' && new RegExp(cond.$regex).test(val);
      return false;
    }
    return sameValue(val, cond);
  });
}

function setPath(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  parts.slice(0, -1).forEach((p) => { cur[p] = cur[p] ?? {}; cur = cur[p]; });
  cur[parts[parts.length - 1]] = clone(value);
}

function project(doc, projection) {
  const out = clone(doc);
  if (!projection) return out;
  const excl = Object.entries(projection).filter(([, v]) => v === 0).map(([k]) => k);
  const incl = Object.entries(projection).filter(([, v]) => v === 1).map(([k]) => k);
  if (excl.length) { excl.forEach((k) => delete out[k]); return out; }
  if (incl.length) return Object.fromEntries(Object.entries(out).filter(([k]) => k === '_id' || incl.some((i) => i === k || i.startsWith(`${k}.`))));
  return out;
}

class Cursor {
  constructor(rows) { this.rows = rows; }
  sort(spec) {
    const [[k, dir]] = Object.entries(spec);
    this.rows.sort((a, b) => ((a[k] > b[k]) - (a[k] < b[k])) * dir);
    return this;
  }
  limit(n) { this.rows = this.rows.slice(0, n); return this; }
  async toArray() { return this.rows.map((r) => clone(r)); }
}

class Collection {
  constructor() { this.docs = []; }
  find(query = {}, opts = {}) { return new Cursor(this.docs.filter((d) => matches(d, query)).map((d) => project(d, opts.projection))); }
  async findOne(query = {}, opts = {}) {
    const d = this.docs.find((x) => matches(x, query));
    return d ? project(d, opts.projection) : null;
  }
  async insertOne(doc) {
    const stored = { _id: new ObjectId(), ...clone(doc) };
    this.docs.push(stored);
    return { insertedId: stored._id, acknowledged: true };
  }
  async updateOne(query, update, opts = {}) {
    let doc = this.docs.find((x) => matches(x, query));
    let upserted = false;
    if (!doc && opts.upsert) {
      doc = { _id: new ObjectId(), ...Object.fromEntries(Object.entries(query).filter(([k]) => !k.startsWith('$'))) };
      Object.entries(update.$setOnInsert || {}).forEach(([k, v]) => setPath(doc, k, v));
      this.docs.push(doc);
      upserted = true;
    }
    if (!doc) return { matchedCount: 0, modifiedCount: 0 };
    Object.entries(update.$set || {}).forEach(([k, v]) => setPath(doc, k, v));
    return { matchedCount: upserted ? 0 : 1, modifiedCount: 1, upsertedCount: upserted ? 1 : 0 };
  }
  async deleteOne(query) {
    const i = this.docs.findIndex((x) => matches(x, query));
    if (i >= 0) this.docs.splice(i, 1);
    return { deletedCount: i >= 0 ? 1 : 0 };
  }
}

function createDemoClient() {
  const cols = {};
  const db = { collection: (n) => (cols[n] = cols[n] || new Collection()) };
  return {
    connect: async () => {},
    db: () => db,
    startSession: () => ({
      startTransaction() {}, async commitTransaction() {}, async abortTransaction() {}, endSession() {},
    }),
  };
}

// Deterministic pseudo-random generator so the demo looks the same on every boot.
function rng(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = ['Aarav', 'Diya', 'Rohan', 'Ananya', 'Karthik', 'Meghana', 'Vivek', 'Sneha', 'Arjun', 'Pooja', 'Nikhil', 'Divya', 'Rahul', 'Shreya', 'Manoj', 'Kavya', 'Suraj', 'Nisha', 'Varun', 'Anjali', 'Harsha', 'Ishita', 'Pranav', 'Riya', 'Sachin', 'Tanvi', 'Yash', 'Bhavana', 'Deepak', 'Chaitra', 'Girish', 'Lakshmi', 'Mohan', 'Namrata', 'Omkar', 'Preeti', 'Ritesh', 'Sanjana', 'Tejas', 'Urvi'];
const LAST = ['Shetty', 'Rao', 'Bhat', 'Nayak', 'Kamath', 'Poojary', 'Hegde', 'Pai', 'Acharya', 'Shenoy', 'Naik', 'Salian', 'Kotian', 'Suvarna', 'Prabhu', 'Gowda'];

async function seed(db, hashPassword) {
  if (await db.collection('users').findOne({ role: 'admin' })) return;
  const rand = rng(2026);
  const now = Date.now();
  const hash = await hashPassword('01012004'); // one hash reused for every demo student keeps boot fast

  await db.collection('users').insertOne({ usn: 'admin', name: 'Meera Rao', email: 'admin@mite.demo', role: 'admin', password: await hashPassword('01011990'), payments: { mandatory: [], optional: [] } });

  const base = { payeeName: 'MITE Cultural Committee', payeeUpiId: 'mite.fest@upi', poster: '', qrCode: '', targetClass: 'All', createdAt: new Date(), updatedAt: new Date() };
  const inDays = (d) => new Date(Date.now() + d * 86400000).toISOString();
  const defs = [
    { title: 'Annual Tech Fest 2026', description: 'Two days of hackathons, robotics and talks.', amount: 500, type: 'mandatory',
      tagline: 'Two days. Forty events. One campus that never sleeps.',
      overview: 'The flagship technical festival of MITE brings together hackathons, robotics battles, paper presentations and keynote talks from industry leaders. Every student contributes a flat fee that covers the venue, equipment, prizes and hospitality for all participants, so every competition is free to enter once you have paid.',
      highlights: ['24-hour open hackathon with Rs 40,000 in prizes', 'Robotics arena: line-follower and combat bots', 'Keynotes from alumni at product companies', 'Free entry to every technical event once paid', 'Certificates for every participant'],
      venue: 'MITE Main Auditorium and CSE Block, Moodabidri', startDate: inDays(18), deadline: inDays(10), contact: 'techfest@mite.demo | +91 98765 43210',
      schedule: [
        { time: 'Day 1, 9:00 AM', title: 'Inauguration and keynote', note: 'Main Auditorium' },
        { time: 'Day 1, 11:00 AM', title: 'Hackathon kick-off', note: 'Runs for 24 hours' },
        { time: 'Day 1, 2:00 PM', title: 'Robotics arena preliminaries', note: 'Workshop block' },
        { time: 'Day 2, 10:00 AM', title: 'Paper presentations and tech quiz', note: 'Seminar halls' },
        { time: 'Day 2, 4:00 PM', title: 'Finals, prize distribution and valedictory', note: 'Main Auditorium' }],
      budget: [
        { category: 'Venue', item: 'Auditorium and seminar hall setup', amount: 25000 },
        { category: 'Venue', item: 'Stage, trusses and branding', amount: 30000 },
        { category: 'Technical', item: 'Sound and lighting', amount: 28000 },
        { category: 'Technical', item: 'Live-stream and camera crew', amount: 12000 },
        { category: 'Prizes', item: 'Hackathon prizes', amount: 40000 },
        { category: 'Prizes', item: 'Robotics and quiz prizes', amount: 15000 },
        { category: 'Speakers', item: 'Guest speaker honorarium and travel', amount: 20000 },
        { category: 'Hospitality', item: 'Participant refreshments and water', amount: 18000 },
        { category: 'Marketing', item: 'Posters, standees and social ads', amount: 8000 },
        { category: 'Contingency', item: 'Reserve (about 5 percent)', amount: 7000 }] },
    { title: 'Cultural Night', description: 'Music, dance and a live band.', amount: 300, type: 'optional',
      tagline: 'A night of music, dance and a live band under the open sky.',
      overview: 'An evening showcase of student talent followed by a headline live band. Entry is optional and the pass covers the performance, seating and light refreshments. Any surplus is carried into next year\'s cultural budget.',
      highlights: ['Headline live band from Mangaluru', 'Solo and group dance finals', 'Open-mic slots for students', 'Light refreshments included'],
      venue: 'MITE Open Air Theatre', startDate: inDays(25), deadline: inDays(20), contact: 'culturals@mite.demo',
      schedule: [{ time: '5:30 PM', title: 'Gates open and seating' }, { time: '6:15 PM', title: 'Student performances' }, { time: '8:30 PM', title: 'Headline band' }],
      budget: [
        { category: 'Artists', item: 'Headline band fee', amount: 12000 },
        { category: 'Technical', item: 'Sound, lights and stage', amount: 8000 },
        { category: 'Decor', item: 'Stage decor and lighting', amount: 4000 },
        { category: 'Hospitality', item: 'Light refreshments', amount: 4000 },
        { category: 'Permissions', item: 'Permissions and security', amount: 2000 }] },
    { title: 'Industrial Visit - Bengaluru', description: 'Full-day visit with transport and lunch.', amount: 850, type: 'optional',
      tagline: 'See how real engineering teams build products, in one day.',
      overview: 'A guided day visit to two partner companies in Bengaluru with a facility tour and an interaction with engineers. The fee covers return AC coach travel, lunch, entry formalities and travel insurance. Seats are limited to 100 students.',
      highlights: ['Return AC coach from campus', 'Guided tour and engineer Q&A', 'Lunch included', 'Travel insurance for every student'],
      venue: 'Departure from MITE main gate, 5:00 AM', startDate: inDays(32), deadline: inDays(24), contact: 'visits@mite.demo',
      schedule: [{ time: '5:00 AM', title: 'Departure from campus' }, { time: '11:00 AM', title: 'Company visit 1' }, { time: '2:00 PM', title: 'Lunch' }, { time: '3:00 PM', title: 'Company visit 2' }, { time: '9:30 PM', title: 'Back on campus' }],
      budget: [
        { category: 'Transport', item: 'Two AC coaches (return)', amount: 28000 },
        { category: 'Food', item: 'Lunch for students and faculty', amount: 14000 },
        { category: 'Entry', item: 'Entry formalities and guide', amount: 6000 },
        { category: 'Safety', item: 'Travel insurance', amount: 1500 },
        { category: 'Contingency', item: 'Reserve', amount: 2000 }] },
    { title: 'Library and Lab Development Fund', description: 'Annual contribution towards labs, books and equipment.', amount: 1200, type: 'mandatory',
      tagline: 'Every rupee goes back into the labs and library you use.',
      overview: 'The annual development fund pays for new books and journals, lab equipment, software licences and maintenance. A full breakdown is published below and is reviewed by the department heads each year.',
      highlights: ['New titles and journal subscriptions', 'Upgraded CSE and ECE lab equipment', 'Campus-wide software licences', 'Itemised and published for transparency'],
      venue: 'Accounts section, Administrative Block', startDate: '', deadline: inDays(14), contact: 'accounts@mite.demo',
      schedule: [],
      budget: [
        { category: 'Library', item: 'Books and journals', amount: 80000 },
        { category: 'Labs', item: 'Lab equipment (CSE and ECE)', amount: 90000 },
        { category: 'Software', item: 'Software licences', amount: 25000 },
        { category: 'Maintenance', item: 'Maintenance and repairs', amount: 15000 }] },
    { title: 'Hackathon Entry', description: 'Team entry for the 24-hour hackathon.', amount: 150, type: 'optional',
      tagline: 'Build something real in 24 hours.',
      overview: 'Team entry for the 24-hour hackathon held during the Tech Fest. The fee covers mentoring, cloud credits, swag kits and snacks through the night.',
      highlights: ['Teams of up to four', 'Mentors from industry', 'Cloud credits for every team', 'Swag kit and midnight snacks'],
      venue: 'CSE Block, Lab 3 and 4', startDate: inDays(19), deadline: inDays(12), contact: 'techfest@mite.demo',
      schedule: [{ time: 'Day 1, 11:00 AM', title: 'Problem statements released' }, { time: 'Day 2, 11:00 AM', title: 'Final submissions and judging' }],
      budget: [
        { category: 'Swag', item: 'Swag kits', amount: 4000 },
        { category: 'Mentoring', item: 'Mentor travel and honorarium', amount: 3000 },
        { category: 'Technical', item: 'Cloud credits', amount: 2000 },
        { category: 'Food', item: 'Snacks and drinks', amount: 3000 }] },
  ];
  const events = [];
  for (const e of defs) {
    const r = await db.collection('events').insertOne({ ...base, ...e, budgetTotal: e.budget.reduce((t, x) => t + x.amount, 0) });
    events.push({ ...e, _id: r.insertedId });
  }

  // Branch / batch payment propensities so the reports show real variation
  const branchBase = { CS: 0.80, IS: 0.72, EC: 0.62, EE: 0.55, ME: 0.42, CV: 0.50 };
  const batchBias = { 2022: -0.14, 2023: -0.04, 2024: 0.05, 2025: 0.14 };
  const perClass = 7;
  const dayMs = 86400000;

  const record = (ev, status) => {
    const paidDate = new Date(now - rand() * 27 * dayMs);
    const rec = { id: String(ev._id), paid: status !== 'rejected', status, utr: String(Math.floor(1e11 + rand() * 9e11)), screenshot: '', paidDate: paidDate.toISOString() };
    if (status === 'confirmed') {
      const fee = Math.round(ev.amount * 2) / 100;
      Object.assign(rec, { confirmedAt: new Date(paidDate.getTime() + 3600000 * (1 + rand() * 20)).toISOString(), baseAmount: ev.amount, feeAmount: fee, feePercent: 2, totalAmount: ev.amount + fee, receiptNo: 'MITE-2026-' + String(Math.floor(rand() * 1e8)).padStart(8, '0') });
    }
    if (status === 'rejected') rec.rejectionReason = 'UTR does not match the screenshot';
    return rec;
  };

  let n = 0;
  for (const branch of Object.keys(branchBase)) {
    for (const batch of [2022, 2023, 2024, 2025]) {
      for (let roll = 1; roll <= perClass; roll += 1) {
        const usn = `4MT${String(batch).slice(2)}${branch}${String(roll).padStart(3, '0')}`;
        const isFirstTwo = usn === '4MT22CS001' || usn === '4MT22CS002';
        const name = isFirstTwo ? (roll === 1 ? 'Aarav Shetty' : 'Diya Rao') : `${FIRST[(n * 7 + roll) % FIRST.length]} ${LAST[(n * 3 + batch + roll) % LAST.length]}`;
        n += 1;
        const payments = { mandatory: [], optional: [] };
        if (!isFirstTwo) {
          const p = Math.max(0.1, Math.min(0.95, branchBase[branch] + batchBias[batch]));
          for (const ev of events) {
            if (ev.type === 'mandatory') {
              const adj = ev.amount > 600 ? p - 0.12 : p; // the bigger fund is paid less often
              const r = rand();
              const status = r < adj ? 'confirmed' : r < adj + 0.10 ? 'pending' : r < adj + 0.15 ? 'rejected' : null;
              if (status) payments.mandatory.push(record(ev, status));
            } else if (rand() < 0.35) {
              const r = rand();
              payments.optional.push(record(ev, r < 0.7 ? 'confirmed' : r < 0.9 ? 'pending' : 'rejected'));
            }
          }
        }
        await db.collection('users').insertOne({ usn, name, email: `${usn.toLowerCase()}@mite.demo`, role: 'student', password: hash, payments, createdAt: new Date() });
      }
    }
  }
  console.log(`DEMO_MODE: seeded admin / 01011990 and ${n} students (4MT22CS001 & 4MT22CS002 start unpaid) / 01012004`);
}

module.exports = { createDemoClient, seed };
