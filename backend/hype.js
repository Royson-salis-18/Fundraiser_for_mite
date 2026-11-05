// Public, aggregate-only "momentum" numbers used to promote events (no student information).
const DAY = 86400000;
const idOf = (r) => String(r?.id ?? r?._id ?? '');

function buildHighlights(events, users, { now = new Date(), limit = 8 } = {}) {
  const t = now.getTime();
  const students = users.filter((u) => u.role === 'student');
  const stats = new Map(events.map((e) => [String(e._id), { joined: 0, recent: 0 }]));

  for (const u of students) {
    for (const r of [...(u.payments?.mandatory || []), ...(u.payments?.optional || [])]) {
      const s = stats.get(idOf(r));
      if (!s) continue;
      if (r.status !== 'confirmed' && r.status !== 'pending') continue;
      s.joined += 1;
      const when = new Date(r.paidDate || r.confirmedAt || 0).getTime();
      if (when && t - when <= 7 * DAY && when <= t) s.recent += 1;
    }
  }

  const upcoming = events.filter((e) => {
    const start = e.startDate ? new Date(e.startDate).getTime() : null;
    const dl = e.deadline ? new Date(e.deadline).getTime() : null;
    return (start && start >= t) || (dl && dl >= t);
  }).map((e) => {
    const s = stats.get(String(e._id));
    const start = e.startDate ? new Date(e.startDate).getTime() : null;
    const dl = e.deadline ? new Date(e.deadline).getTime() : null;
    return {
      id: String(e._id), title: e.title, tagline: e.tagline || e.description || '', type: e.type,
      amount: Number(e.amount) || 0, startDate: e.startDate || '', deadline: e.deadline || '', venue: e.venue || '',
      joined: s.joined, recent: s.recent, eligible: e.type === 'mandatory' ? students.length : null,
      _sort: Math.min(start && start >= t ? start : Infinity, dl && dl >= t ? dl : Infinity),
    };
  }).sort((a, b) => a._sort - b._sort).slice(0, limit).map(({ _sort, ...rest }) => rest);

  const maxRecent = Math.max(0, ...upcoming.map((e) => e.recent));
  return upcoming.map((e) => ({ ...e, trending: maxRecent >= 3 && e.recent === maxRecent }));
}

module.exports = { buildHighlights };
