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
  if (incl.length) return Object.fromEntries(Object.entries(out).filter(([k]) => k === '_id' || incl.includes(k)));
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

async function seed(db, hashPassword) {
  if (await db.collection('users').findOne({ role: 'admin' })) return;
  const admin = { usn: 'admin', name: 'Meera Rao', email: 'admin@mite.demo', role: 'admin', password: await hashPassword('01011990'), payments: { mandatory: [], optional: [] } };
  const students = [
    { usn: '4MT22CS001', name: 'Aarav Shetty', email: 'aarav@mite.demo' },
    { usn: '4MT22CS002', name: 'Diya Rao', email: 'diya@mite.demo' },
  ];
  await db.collection('users').insertOne(admin);
  for (const s of students) {
    await db.collection('users').insertOne({ ...s, role: 'student', password: await hashPassword('01012004'), payments: { mandatory: [], optional: [] }, createdAt: new Date() });
  }
  const base = { payeeName: 'MITE Cultural Committee', payeeUpiId: 'mite.fest@upi', poster: '', qrCode: '', createdAt: new Date(), updatedAt: new Date() };
  const events = [
    { title: 'Annual Tech Fest 2026', description: 'Two days of hackathons, robotics and talks.', amount: 500, type: 'mandatory', targetClass: 'All' },
    { title: 'Cultural Night', description: 'Music, dance and a live band.', amount: 300, type: 'optional', targetClass: 'All' },
    { title: 'Industrial Visit – Bengaluru', description: 'Full-day visit with transport and lunch.', amount: 850, type: 'optional', targetClass: 'All' },
  ];
  for (const e of events) await db.collection('events').insertOne({ ...base, ...e });
  console.log('🎭 DEMO_MODE: seeded admin / 01011990, students 4MT22CS001 & 4MT22CS002 / 01012004');
}

module.exports = { createDemoClient, seed };
