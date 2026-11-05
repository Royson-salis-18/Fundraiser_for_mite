import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import TopNav from '../components/TopNav';
import ProfileOverlay from '../components/ProfileOverlay';
import SettingsOverlay from '../components/SettingsOverlay';
import Icon from '../components/Icon';
import { CoverArt, CountUp } from '../components/flair';
import { StatusBadge, Skeleton, EmptyState, money } from '../components/ui';
import { useToast } from '../components/Toast';
import { adminLinks, studentLinks } from '../components/navLinks';
import { eventsAPI, userAPI } from '../services/api';
import { useHighlights, useNow, Countdown, HypeBadges, badgesFor } from '../components/hype';
import appLogo from '../1630654323517.jpg';

const CAT_COLORS = ['#F58220', '#7FA6F5', '#2DD4BF', '#A78BFA', '#FB7185', '#FBBF24', '#E879F9', '#94A3B8'];
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) : '');

const daysLeft = (d) => {
  if (!d) return null;
  const n = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  return n;
};

const EventDetailsPage = ({ user, setUser, handleLogout, addToCart, cartLength }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [event, setEvent] = useState(null);
  const [tx, setTx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const isAdmin = user?.role === 'admin';
  const { byId: hlById } = useHighlights();
  const now = useNow(1000);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [ev, t] = await Promise.all([eventsAPI.getOne(id), eventsAPI.getTransparency(id)]);
        if (!alive) return;
        setEvent(ev && !ev.error ? ev : null);
        setTx(t && !t.error ? t : null);
      } catch { if (alive) setEvent(null); } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [id]);

  const record = useMemo(() => {
    if (!event || !user?.payments) return null;
    return [...(user.payments.mandatory || []), ...(user.payments.optional || [])].find((p) => String(p.id ?? p._id) === String(event._id)) || null;
  }, [event, user]);

  const status = !record ? 'due' : record.status === 'confirmed' || record.status === 'pending' || record.status === 'rejected' ? record.status : record.paid ? 'confirmed' : 'cart';

  const budget = useMemo(() => (Array.isArray(event?.budget) ? event.budget : []), [event]);
  const total = tx?.budgetTotal || budget.reduce((t, r) => t + (Number(r.amount) || 0), 0);
  const categories = useMemo(() => {
    const m = new Map();
    budget.forEach((r) => m.set(r.category || 'Other', (m.get(r.category || 'Other') || 0) + (Number(r.amount) || 0)));
    return [...m.entries()].map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
  }, [budget]);

  const join = async () => {
    if (!event) return;
    setBusy(true);
    try {
      const key = event.type === 'mandatory' ? 'mandatory' : 'optional';
      const list = user.payments?.[key] || [];
      if (!list.find((p) => String(p.id ?? p._id) === String(event._id))) {
        const updated = { ...user.payments, [key]: [...list, { id: String(event._id), paid: false, status: 'added' }] };
        const r = await userAPI.updatePayments(updated);
        if (r.error) { error(r.error); return; }
        setUser((prev) => ({ ...prev, payments: updated }));
      }
      if (typeof addToCart === 'function') addToCart({ ...event, id: String(event._id) });
      navigate('/cart');
    } catch { error('Could not add this event. Please try again.'); } finally { setBusy(false); }
  };

  const announcement = event ? [
    event.title, event.tagline,
    event.startDate && `Date: ${fmtDate(event.startDate)}`, event.venue && `Venue: ${event.venue}`,
    `Fee: ${money(event.amount)}`, event.deadline && `Register by: ${fmtDate(event.deadline)}`,
    `Details: ${window.location.origin}/events/${event._id}`,
  ].filter(Boolean).join('\n') : '';

  const copy = async () => {
    try { await navigator.clipboard.writeText(announcement); success('Announcement copied'); } catch { error('Copy is not available in this browser'); }
  };

  const left = event ? daysLeft(event.deadline) : null;
  const hl = event ? hlById.get(String(event._id)) : null;
  const startMs = event?.startDate ? new Date(event.startDate).getTime() : 0;
  const hot = hl ? badgesFor(hl, now).find((b) => b.tone === 'hot') : null;
  const nav = isAdmin ? adminLinks : studentLinks(cartLength);

  return (
    <div className="page bg-student">
      <TopNav logoSrc={appLogo} title={isAdmin ? 'MITE Admin Dashboard' : 'MITE Student Portal'} titleTo={isAdmin ? '/admin-dashboard' : '/student-dashboard'}
        subtitle={isAdmin ? 'Event details' : `USN: ${user?.usn}`} links={nav}
        extraRight={(<>
          <button className="btn btn-outline" onClick={() => setShowProfile(true)}>Profile</button>
          <button className="btn btn-outline" onClick={() => setShowSettings(true)}>Settings</button>
        </>)}
        onLogout={() => { handleLogout(); navigate('/login'); }} />
      <main className="container wide detail">
        {loading ? <><Skeleton height={220} /><Skeleton height={300} /></> : !event ? (
          <EmptyState icon="search" title="Event not found" action={<Link className="btn btn-primary" to={isAdmin ? '/admin-dashboard' : '/student-dashboard'}>Back to events</Link>}>This event may have been removed.</EmptyState>
        ) : (
          <>
            <section className="event-hero fade-up">
              {event.poster ? <img className="event-hero-img" src={event.poster} alt={event.title} /> : <CoverArt title={event.title} type={event.type} />}
              <div className="event-hero-body">
                <span className={`badge ${event.type === 'mandatory' ? 'badge-info' : 'badge-muted'}`} style={{ textTransform: 'capitalize' }}>{event.type}</span>
                <HypeBadges h={hl} now={now} />
                <h2>{event.title}</h2>
                {event.tagline && <p className="tagline">{event.tagline}</p>}
                {startMs > now && (
                  <div className="event-cd"><span className="spot-cd-label">Starts in</span><Countdown to={event.startDate} now={now} /></div>
                )}
                <div className="facts">
                  {event.startDate && <div className="fact"><Icon name="calendar" size={18} /><div><span>When</span><b>{fmtDate(event.startDate)}</b></div></div>}
                  {event.venue && <div className="fact"><Icon name="building" size={18} /><div><span>Where</span><b>{event.venue}</b></div></div>}
                  {event.deadline && <div className="fact"><Icon name="clock" size={18} /><div><span>Register by</span><b>{fmtDate(event.deadline)}{left != null && <em className={left < 0 ? 'late' : left <= 3 ? 'soon' : ''}>{left < 0 ? ' closed' : left === 0 ? ' today' : ` ${left} day${left === 1 ? '' : 's'} left`}</em>}</b></div></div>}
                  <div className="fact"><Icon name="wallet" size={18} /><div><span>Fee</span><b>{money(event.amount)}</b></div></div>
                </div>
              </div>
            </section>

            <div className="detail-grid">
              <div className="detail-main">
                <section className="panel fade-up">
                  <h3 className="panel-title">About this event</h3>
                  <p className="prose">{event.overview || event.description}</p>
                  {Array.isArray(event.highlights) && event.highlights.length > 0 && (
                    <ul className="highlights">{event.highlights.map((h) => <li key={h}><Icon name="check" size={18} />{h}</li>)}</ul>
                  )}
                </section>

                {Array.isArray(event.schedule) && event.schedule.length > 0 && (
                  <section className="panel fade-up">
                    <h3 className="panel-title">Schedule</h3>
                    <ol className="timeline">
                      {event.schedule.map((r, i) => (
                        <li key={i}><span className="tl-time">{r.time || `Step ${i + 1}`}</span><div><b>{r.title}</b>{r.note && <p>{r.note}</p>}</div></li>
                      ))}
                    </ol>
                  </section>
                )}

                <section className="panel fade-up" id="cost">
                  <div className="panel-head"><h3 className="panel-title">Where the money goes</h3><span className="badge badge-ok">Published for transparency</span></div>
                  {!budget.length ? (
                    <EmptyState icon="wallet" title="Cost breakdown not published yet">The organisers will list every cost line here.</EmptyState>
                  ) : (
                    <>
                      <div className="tx-tiles">
                        <div><span>Total cost</span><strong><CountUp value={total} prefix="₹" /></strong></div>
                        <div><span>Raised so far</span><strong><CountUp value={tx?.raised || 0} prefix="₹" /></strong></div>
                        <div><span>Budget covered</span><strong>{tx?.coverage != null ? `${Math.min(100, tx.coverage)}%` : '-'}</strong></div>
                        <div><span>Contributors</span><strong><CountUp value={tx?.contributors || 0} /></strong></div>
                      </div>
                      {tx?.coverage != null && <div className="meter big"><span style={{ width: `${Math.min(100, tx.coverage)}%` }} /></div>}
                      <div className="cat-bars">
                        {categories.map((c, i) => (
                          <div key={c.name} className="cat-row">
                            <span className="cat-name"><i style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} />{c.name}</span>
                            <div className="cat-track"><span style={{ width: `${(c.amount / total) * 100}%`, background: CAT_COLORS[i % CAT_COLORS.length] }} /></div>
                            <span className="cat-val">{money(c.amount)}<small>{Math.round((c.amount / total) * 100)}%</small></span>
                          </div>
                        ))}
                      </div>
                      <div className="table-wrap">
                        <table className="table">
                          <thead><tr><th>Category</th><th>Item</th><th style={{ textAlign: 'right' }}>Cost</th><th style={{ textAlign: 'right' }}>Share</th></tr></thead>
                          <tbody>
                            {budget.map((r, i) => (
                              <tr key={i}><td>{r.category}</td><td>{r.item}{r.note && <div className="muted-sm">{r.note}</div>}</td><td style={{ textAlign: 'right' }}>{money(r.amount)}</td><td style={{ textAlign: 'right' }}>{((r.amount / total) * 100).toFixed(1)}%</td></tr>
                            ))}
                            <tr className="total-row"><td colSpan={2}>Total</td><td style={{ textAlign: 'right' }}>{money(total)}</td><td style={{ textAlign: 'right' }}>100%</td></tr>
                          </tbody>
                        </table>
                      </div>
                      <p className="muted-sm">Raised so far counts only payments already confirmed by the fest team. Any surplus carries into next year's budget.</p>
                    </>
                  )}
                </section>
              </div>

              <aside className="detail-side">
                <div className="panel sticky">
                  {hot && <div className="urgent">{hot.text}. Secure your spot now.</div>}
                  <span className="stat-label">Your registration</span>
                  <div className="price big">{money(event.amount)}</div>
                  {hl && hl.joined > 0 && (
                    <div className="proof"><strong>{hl.joined}</strong><span>student{hl.joined === 1 ? ' is' : 's are'} already in{hl.recent > 0 ? `, ${hl.recent} joined this week` : ''}</span></div>
                  )}
                  {isAdmin ? (
                    <>
                      <p className="muted-sm">You are viewing this as an administrator.</p>
                      <Link className="btn btn-primary block" to={`/admin/events/${event._id}`}>Edit details and budget</Link>
                    </>
                  ) : (
                    <>
                      {record && <div style={{ margin: '4px 0 12px' }}><StatusBadge status={status} /></div>}
                      {status === 'rejected' && record?.rejectionReason && <div className="reject-note" style={{ marginBottom: 12 }}>{record.rejectionReason}</div>}
                      {(status === 'due') && <button className="btn btn-primary block" disabled={busy} onClick={join}>{event.type === 'mandatory' ? 'Pay now' : 'Register'}</button>}
                      {status === 'cart' && <button className="btn btn-primary block" onClick={() => navigate('/cart')}>Go to cart</button>}
                      {status === 'rejected' && <button className="btn btn-primary block" onClick={() => navigate('/checkout')}>Resubmit proof</button>}
                      {(status === 'pending' || status === 'confirmed') && <button className="btn btn-outline block" onClick={() => navigate('/my-payments')}>View in My Payments</button>}
                    </>
                  )}
                </div>
                <div className="panel">
                  <h4 className="panel-title sm">Share this event</h4>
                  <div className="promo-text">{announcement}</div>
                  <div className="btn-row">
                    <button className="btn btn-outline" onClick={copy}>Copy announcement</button>
                    <a className="btn btn-accent" href={`https://wa.me/?text=${encodeURIComponent(announcement)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                  </div>
                </div>
                {event.contact && <div className="panel"><h4 className="panel-title sm">Questions?</h4><p className="muted-sm" style={{ margin: 0 }}>{event.contact}</p></div>}
              </aside>
            </div>
          </>
        )}
      </main>
      {showProfile && <ProfileOverlay user={user} setUser={setUser} onClose={() => setShowProfile(false)} />}
      {showSettings && <SettingsOverlay user={user} onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default EventDetailsPage;
