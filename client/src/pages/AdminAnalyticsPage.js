import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNav from '../components/TopNav';
import ProfileOverlay from '../components/ProfileOverlay';
import SettingsOverlay from '../components/SettingsOverlay';
import Icon from '../components/Icon';
import { CountUp, greeting } from '../components/flair';
import { Donut, StatusBars, AreaChart, Heatmap, Legend, Meter, STATUS_META, STATUS_ORDER } from '../components/charts';
import { EmptyState, Skeleton, money, downloadCSV } from '../components/ui';
import { useToast } from '../components/Toast';
import { adminLinks } from '../components/navLinks';
import { adminAPI } from '../services/api';
import appLogo from '../1630654323517.jpg';

const PAGE = 20;

const AdminAnalyticsPage = ({ user, setUser, handleLogout }) => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [branch, setBranch] = useState('all');
  const [batch, setBatch] = useState('all');
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState({ key: 'outstanding', dir: -1 });
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(null);
  const [showAllClasses, setShowAllClasses] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await adminAPI.getAnalytics();
      if (d && !d.error) setData(d); else error(d?.error || 'Could not load the report');
    } catch { error('Could not reach the server'); } finally { setLoading(false); }
  }, [error]);

  useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t); }, [load]);
  useEffect(() => { setPage(0); }, [branch, batch, status, query, sort]);

  const students = useMemo(() => data?.students || [], [data]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = students.filter((s) => (branch === 'all' || s.branch === branch) && (batch === 'all' || String(s.batch) === batch)
      && (status === 'all' || s.status === status) && (!q || `${s.usn} ${s.name} ${s.email}`.toLowerCase().includes(q)));
    const { key, dir } = sort;
    return [...rows].sort((a, b) => (typeof a[key] === 'string' ? a[key].localeCompare(b[key]) : a[key] - b[key]) * dir);
  }, [students, branch, batch, status, query, sort]);

  const branchList = data?.branches || [];
  const batchList = data?.batches || [];
  const sm = data?.summary;
  const classesByRate = useMemo(() => [...(data?.classes || [])].sort((a, b) => a.rate - b.rate), [data]);
  const pageRows = filtered.slice(page * PAGE, page * PAGE + PAGE);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));

  const pickClass = (b, y) => { setBranch(b); setBatch(String(y)); setStatus('all'); document.getElementById('roster')?.scrollIntoView({ behavior: 'smooth' }); };
  const reset = () => { setBranch('all'); setBatch('all'); setStatus('all'); setQuery(''); };
  const th = (key, label, right) => (
    <th className={`sortable${right ? ' r' : ''}`} onClick={() => setSort((s) => ({ key, dir: s.key === key ? -s.dir : -1 }))}>{label}{sort.key === key ? (sort.dir === -1 ? ' ▼' : ' ▲') : ''}</th>
  );

  const exportRoster = () => downloadCSV('payment-roster.csv', [
    ['USN', 'Name', 'Email', 'Branch', 'Batch', 'Class', 'Status', 'Due', 'Paid', 'Under review', 'Outstanding'],
    ...filtered.map((s) => [s.usn, s.name, s.email, s.branchName, s.batch, s.classLabel, STATUS_META[s.status].label, s.due, s.collected, s.pendingAmount, s.outstanding]),
  ]);
  const exportFull = () => downloadCSV('full-payment-report.csv', [
    ['SECTION: BY BRANCH'], ['Branch', 'Students', 'Paid in full', 'Under review', 'Partial', 'Rejected', 'Not paid', 'Due', 'Collected', 'Outstanding', 'Collected %'],
    ...data.branches.map((g) => [g.name, g.students, g.paid, g.review, g.partial, g.rejected, g.unpaid, g.due, g.collected, g.outstanding, g.rate]), [],
    ['SECTION: BY CLASS'], ['Class', 'Students', 'Paid in full', 'Under review', 'Partial', 'Rejected', 'Not paid', 'Due', 'Collected', 'Outstanding', 'Collected %'],
    ...data.classes.map((g) => [g.key, g.students, g.paid, g.review, g.partial, g.rejected, g.unpaid, g.due, g.collected, g.outstanding, g.rate]), [],
    ['SECTION: BY EVENT'], ['Event', 'Type', 'Price', 'Applicable', 'Confirmed', 'Under review', 'Rejected', 'Not paid', 'Collected'],
    ...data.events.map((e) => [e.title, e.type, e.amount, e.applicable, e.confirmed, e.pending, e.rejected, e.unpaid, e.collected]), [],
    ['SECTION: ALL STUDENTS'], ['USN', 'Name', 'Class', 'Status', 'Due', 'Paid', 'Outstanding'],
    ...data.students.map((s) => [s.usn, s.name, s.classLabel, STATUS_META[s.status].label, s.due, s.collected, s.outstanding]),
  ]);
  const copyUnpaid = async () => {
    const list = filtered.filter((s) => s.status === 'unpaid' || s.status === 'partial' || s.status === 'rejected').map((s) => `${s.usn} ${s.name}`).join('\n');
    if (!list) { error('Nobody in this view has an outstanding payment'); return; }
    try { await navigator.clipboard.writeText(list); success('Copied the pending list for reminders'); } catch { error('Copy is not available in this browser'); }
  };

  return (
    <div className="page">
      <TopNav logoSrc={appLogo} title="MITE Admin Dashboard" titleTo="/admin-dashboard" subtitle="Payment reports and analytics" links={adminLinks}
        extraRight={(<>
          <button className="btn btn-outline" onClick={() => setShowProfile(true)}>Profile</button>
          <button className="btn btn-outline" onClick={() => setShowSettings(true)}>Settings</button>
        </>)}
        onLogout={() => { handleLogout(); navigate('/login'); }} />
      <main className="container wide analytics">
        {loading ? <><Skeleton height={190} /><div className="stat-grid"><Skeleton height={92} count={4} /></div><Skeleton height={320} /></> : !data ? (
          <EmptyState icon="chart" title="No report available" action={<button className="btn btn-primary" onClick={load}>Try again</button>} />
        ) : (
          <>
            <section className="hero fade-up">
              <div className="hero-copy">
                <span className="eyebrow">{greeting()} <i className="live-dot" /> live report</span>
                <h2>{sm.paid} of {sm.students} students are fully paid.</h2>
                <p>{money(sm.collected)} collected of {money(sm.due)} due across mandatory fees. {money(sm.outstanding)} is still outstanding and {money(sm.pending)} is waiting for your review.</p>
                <div className="btn-row" style={{ marginTop: 16 }}>
                  <button className="btn btn-primary" onClick={exportFull}><Icon name="download" size={16} /> Download full report</button>
                  <button className="btn btn-outline hero-btn" onClick={() => window.print()}>Print</button>
                  <button className="btn btn-outline hero-btn" onClick={load}><Icon name="refresh" size={16} /> Refresh</button>
                </div>
              </div>
              <div className="rate-ring">
                <Donut counts={sm.statusCounts} total={sm.students} size={188} centre={<CountUp value={sm.rate} />} sub="% collected" />
              </div>
            </section>

            <div className="kpis stagger">
              <div className="kpi k-green"><span>Collected</span><strong><CountUp value={sm.collected} prefix="₹" /></strong><small>{sm.paid} students paid in full</small></div>
              <div className="kpi k-red"><span>Outstanding</span><strong><CountUp value={sm.outstanding} prefix="₹" /></strong><small>{sm.statusCounts.unpaid + sm.statusCounts.partial + sm.statusCounts.rejected} students owe money</small></div>
              <div className="kpi k-blue"><span>Awaiting review</span><strong><CountUp value={sm.pending} prefix="₹" /></strong><small>{sm.statusCounts.review} students fully submitted</small></div>
              <div className="kpi k-amber"><span>Not started</span><strong><CountUp value={sm.statusCounts.unpaid} /></strong><small>students with no payment at all</small></div>
              <div className="kpi k-violet"><span>Optional events</span><strong><CountUp value={sm.optionalRevenue} prefix="₹" /></strong><small>confirmed from opt-ins</small></div>
            </div>

            <div className="an-grid">
              <section className="panel span-4">
                <h3 className="panel-title">Student status</h3>
                <Legend counts={sm.statusCounts} />
                <div className="status-split">
                  {STATUS_ORDER.map((k) => (
                    <button key={k} type="button" className="split-row" onClick={() => { setStatus(k); document.getElementById('roster')?.scrollIntoView({ behavior: 'smooth' }); }}>
                      <span><i style={{ background: STATUS_META[k].color }} />{STATUS_META[k].label}</span>
                      <b>{sm.statusCounts[k]}</b>
                      <Meter value={(sm.statusCounts[k] / sm.students) * 100} color={STATUS_META[k].color} />
                    </button>
                  ))}
                </div>
              </section>
              <section className="panel span-8">
                <div className="panel-head"><h3 className="panel-title">Collections over the last 30 days</h3></div>
                <AreaChart data={data.timeline} />
              </section>

              <section className="panel span-6">
                <h3 className="panel-title">By branch</h3>
                <p className="muted-sm">Share of students by payment status. Click a branch to filter the roster.</p>
                <StatusBars rows={branchList} selected={branch} onSelect={(k) => { setBranch(branch === k ? 'all' : k); document.getElementById('roster')?.scrollIntoView({ behavior: 'smooth' }); }} />
              </section>
              <section className="panel span-6">
                <h3 className="panel-title">By batch</h3>
                <p className="muted-sm">Older batches are usually slower to pay.</p>
                <StatusBars rows={batchList.map((b) => ({ ...b, name: `Joined ${b.key}` }))} selected={batch} onSelect={(k) => { setBatch(batch === k ? 'all' : k); document.getElementById('roster')?.scrollIntoView({ behavior: 'smooth' }); }} />
              </section>

              <section className="panel span-7">
                <h3 className="panel-title">Class heatmap</h3>
                <p className="muted-sm">Percentage of the amount due that has been collected. Red needs attention. Click a cell to see that class.</p>
                <Heatmap classes={data.classes} branches={branchList.map((b) => b.key)} batches={[...batchList.map((b) => b.key)].sort()} onPick={pickClass} active={{ branch, batch }} />
              </section>
              <section className="panel span-5">
                <h3 className="panel-title">Classes needing attention</h3>
                <div className="attn">
                  {classesByRate.slice(0, 6).map((c) => (
                    <button key={c.key} type="button" className="attn-row" onClick={() => pickClass(c.branch, c.batch)}>
                      <b>{c.key}</b><span>{c.unpaid + c.partial + c.rejected} of {c.students} owe money</span><em>{money(c.outstanding)}</em>
                      <Meter value={c.rate} color="#EF4444" />
                    </button>
                  ))}
                </div>
              </section>

              <section className="panel span-12">
                <div className="panel-head"><h3 className="panel-title">By event</h3></div>
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>Event</th><th>Type</th><th className="r">Price</th><th className="r">Confirmed</th><th className="r">Under review</th><th className="r">Rejected</th><th className="r">Not paid</th><th className="r">Collected</th><th style={{ minWidth: 140 }}>Progress</th></tr></thead>
                    <tbody>
                      {data.events.map((e) => (
                        <tr key={e.id} className="clickable" onClick={() => navigate(`/events/${e.id}`)}>
                          <td><b>{e.title}</b></td><td style={{ textTransform: 'capitalize' }}>{e.type}</td><td className="r">{money(e.amount)}</td>
                          <td className="r">{e.confirmed}</td><td className="r">{e.pending}</td><td className="r">{e.rejected}</td><td className="r">{e.type === 'mandatory' ? e.unpaid : '-'}</td>
                          <td className="r"><b>{money(e.collected)}</b></td><td><Meter value={e.rate} /><small>{e.rate}% of {e.applicable}</small></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="panel span-12">
                <div className="panel-head">
                  <h3 className="panel-title">By class</h3>
                  <button className="btn btn-outline" onClick={() => setShowAllClasses((v) => !v)}>{showAllClasses ? 'Show fewer' : `Show all ${data.classes.length}`}</button>
                </div>
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>Class</th><th>Branch</th><th className="r">Students</th><th className="r">Paid</th><th className="r">Review</th><th className="r">Partial</th><th className="r">Rejected</th><th className="r">Not paid</th><th className="r">Collected</th><th className="r">Outstanding</th><th style={{ minWidth: 120 }}>Rate</th></tr></thead>
                    <tbody>
                      {(showAllClasses ? data.classes : classesByRate.slice(0, 8)).map((c) => (
                        <tr key={c.key} className="clickable" onClick={() => pickClass(c.branch, c.batch)}>
                          <td><b>{c.key}</b></td><td>{branchList.find((b) => b.key === c.branch)?.name || c.branch}</td><td className="r">{c.students}</td>
                          <td className="r">{c.paid}</td><td className="r">{c.review}</td><td className="r">{c.partial}</td><td className="r">{c.rejected}</td><td className="r">{c.unpaid}</td>
                          <td className="r">{money(c.collected)}</td><td className="r"><b>{money(c.outstanding)}</b></td><td><Meter value={c.rate} color={c.rate > 66 ? '#22C55E' : c.rate > 40 ? '#F59E0B' : '#EF4444'} /><small>{c.rate}%</small></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="panel span-12" id="roster">
                <div className="panel-head"><h3 className="panel-title">Who has paid and who has not</h3><span className="muted-sm">{filtered.length} of {students.length} students</span></div>
                <div className="toolbar">
                  <input className="input" placeholder="Search USN, name or email" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search students" />
                  <select className="select" value={branch} onChange={(e) => setBranch(e.target.value)} aria-label="Branch"><option value="all">All branches</option>{branchList.map((b) => <option key={b.key} value={b.key}>{b.name}</option>)}</select>
                  <select className="select" value={batch} onChange={(e) => setBatch(e.target.value)} aria-label="Batch"><option value="all">All batches</option>{batchList.map((b) => <option key={b.key} value={b.key}>Batch {b.key}</option>)}</select>
                  <div className="btn-row" style={{ marginLeft: 'auto' }}>
                    <button className="btn btn-outline" onClick={reset}>Reset</button>
                    <button className="btn btn-outline" onClick={copyUnpaid}>Copy pending list</button>
                    <button className="btn btn-primary" onClick={exportRoster}><Icon name="download" size={16} /> Export CSV</button>
                  </div>
                </div>
                <div className="chips" style={{ marginBottom: 14 }}>
                  <button className={`chip${status === 'all' ? ' active' : ''}`} onClick={() => setStatus('all')}>All</button>
                  {STATUS_ORDER.map((k) => <button key={k} className={`chip${status === k ? ' active' : ''}`} onClick={() => setStatus(k)}><i className="chip-dot" style={{ background: STATUS_META[k].color }} />{STATUS_META[k].label}</button>)}
                </div>
                {!filtered.length ? <EmptyState icon="search" title="No students match these filters" action={<button className="btn btn-outline" onClick={reset}>Reset filters</button>} /> : (
                  <>
                    <div className="table-wrap">
                      <table className="table">
                        <thead><tr>{th('usn', 'USN')}{th('name', 'Name')}{th('classLabel', 'Class')}{th('status', 'Status')}{th('due', 'Due', true)}{th('collected', 'Paid', true)}{th('outstanding', 'Outstanding', true)}</tr></thead>
                        <tbody>
                          {pageRows.map((s) => (
                            <tr key={s.id} className="clickable" onClick={() => setOpen(s)}>
                              <td className="mono">{s.usn}</td><td><b>{s.name}</b></td><td>{s.classLabel}</td>
                              <td><span className="pill" style={{ '--c': STATUS_META[s.status].color }}>{STATUS_META[s.status].label}</span></td>
                              <td className="r">{money(s.due)}</td><td className="r">{money(s.collected)}</td><td className="r"><b>{money(s.outstanding)}</b></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="pager">
                      <button className="btn btn-outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</button>
                      <span>Page {page + 1} of {pages}</span>
                      <button className="btn btn-outline" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
                    </div>
                  </>
                )}
              </section>
            </div>
          </>
        )}
      </main>

      {open && (
        <div className="drawer-wrap" onClick={() => setOpen(null)}>
          <aside className="drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`Payments for ${open.name}`}>
            <button className="drawer-x" onClick={() => setOpen(null)} aria-label="Close"><Icon name="x" size={18} /></button>
            <span className="eyebrow">{open.classLabel} · {open.branchName}</span>
            <h3>{open.name}</h3>
            <div className="mono muted-sm">{open.usn} · {open.email}</div>
            <div style={{ margin: '14px 0' }}><span className="pill" style={{ '--c': STATUS_META[open.status].color }}>{STATUS_META[open.status].label}</span></div>
            <div className="tx-tiles small">
              <div><span>Due</span><strong>{money(open.due)}</strong></div>
              <div><span>Paid</span><strong>{money(open.collected)}</strong></div>
              <div><span>Outstanding</span><strong>{money(open.outstanding)}</strong></div>
            </div>
            <h4 className="panel-title sm" style={{ marginTop: 18 }}>Events</h4>
            <ul className="items">
              {open.items.map((it) => (
                <li key={it.eventId}>
                  <div><b>{it.title}</b><small style={{ textTransform: 'capitalize' }}>{it.type} · {money(it.amount)}{it.utr ? ` · UTR ${it.utr}` : ''}</small></div>
                  <span className="pill" style={{ '--c': it.status === 'confirmed' ? '#22C55E' : it.status === 'pending' ? '#3B82F6' : it.status === 'rejected' ? '#EF4444' : '#64748B' }}>{it.status === 'confirmed' ? 'Paid' : it.status === 'pending' ? 'Under review' : it.status === 'rejected' ? 'Rejected' : 'Not paid'}</span>
                </li>
              ))}
              {!open.items.length && <li><small>No payments due for this student.</small></li>}
            </ul>
          </aside>
        </div>
      )}
      {showProfile && <ProfileOverlay user={user} setUser={setUser} onClose={() => setShowProfile(false)} />}
      {showSettings && <SettingsOverlay user={user} onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default AdminAnalyticsPage;
