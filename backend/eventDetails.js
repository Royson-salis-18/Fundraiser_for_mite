// Validation/sanitising for the rich event fields (promotion copy, schedule, and cost transparency).
// Only these keys are touched; everything is length-capped so a bad payload cannot bloat a document.
const DETAIL_KEYS = ['tagline', 'overview', 'highlights', 'venue', 'startDate', 'deadline', 'contact', 'schedule', 'budget'];

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(Math.min(n, 1e8) * 100) / 100 : 0;
};
const dateOrEmpty = (v) => {
  if (!v) return '';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
};

function sanitizeDetails(body = {}) {
  const out = {};
  if ('tagline' in body) out.tagline = str(body.tagline, 140);
  if ('overview' in body) out.overview = str(body.overview, 4000);
  if ('venue' in body) out.venue = str(body.venue, 160);
  if ('contact' in body) out.contact = str(body.contact, 160);
  if ('startDate' in body) out.startDate = dateOrEmpty(body.startDate);
  if ('deadline' in body) out.deadline = dateOrEmpty(body.deadline);
  if ('highlights' in body) {
    out.highlights = (Array.isArray(body.highlights) ? body.highlights : []).map((h) => str(h, 160)).filter(Boolean).slice(0, 12);
  }
  if ('schedule' in body) {
    out.schedule = (Array.isArray(body.schedule) ? body.schedule : [])
      .map((r) => ({ time: str(r?.time, 40), title: str(r?.title, 120), note: str(r?.note, 200) }))
      .filter((r) => r.title).slice(0, 20);
  }
  if ('budget' in body) {
    out.budget = (Array.isArray(body.budget) ? body.budget : [])
      .map((r) => ({ category: str(r?.category, 40) || 'Other', item: str(r?.item, 120), amount: num(r?.amount), note: str(r?.note, 200) }))
      .filter((r) => r.item).slice(0, 40);
    out.budgetTotal = Math.round(out.budget.reduce((t, r) => t + r.amount, 0) * 100) / 100;
  }
  return out;
}

// Replace raw detail fields on a request body with their sanitised versions.
function withSanitizedDetails(body = {}) {
  const rest = { ...body };
  DETAIL_KEYS.forEach((k) => delete rest[k]);
  delete rest.budgetTotal;
  return { ...rest, ...sanitizeDetails(body) };
}

module.exports = { sanitizeDetails, withSanitizedDetails, DETAIL_KEYS };
