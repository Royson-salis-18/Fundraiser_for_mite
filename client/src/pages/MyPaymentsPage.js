import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNav from '../components/TopNav';
import ProfileOverlay from '../components/ProfileOverlay';
import SettingsOverlay from '../components/SettingsOverlay';
import { StatusBadge, StatCard, EmptyState, Skeleton, money, printReceipt } from '../components/ui';
import { useToast } from '../components/Toast';
import { eventsAPI, userAPI } from '../services/api';
import appLogo from '../1630654323517.jpg';

const MyPaymentsPage = ({ user, setUser, handleLogout }) => {
  const [events, setEvents] = useState([]);
  const [payments, setPayments] = useState({ mandatory: [], optional: [] });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const navigate = useNavigate();
  const { error } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const [ev, pay] = await Promise.all([eventsAPI.getAll(), userAPI.getPayments()]);
        setEvents(Array.isArray(ev) ? ev : []);
        setPayments(pay.payments || { mandatory: [], optional: [] });
      } catch {
        error('Could not load your payments. Please refresh.');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => {
    const all = [
      ...(payments.mandatory || []).map((p) => ({ ...p, type: 'mandatory' })),
      ...(payments.optional || []).map((p) => ({ ...p, type: 'optional' })),
    ];
    return all
      .filter((p) => p.paid || p.status)
      .map((p) => {
        const id = (p.id || p._id)?.toString();
        const ev = events.find((e) => (e._id || e.id)?.toString() === id);
        const status = p.status || (p.paid ? 'confirmed' : 'cart');
        return { ...p, id, status, title: ev?.title || 'Event', amount: ev?.amount || 0 };
      })
      .sort((a, b) => new Date(b.paidDate || 0) - new Date(a.paidDate || 0));
  }, [payments, events]);

  const shown = rows.filter((r) => filter === 'all' || r.status === filter);
  const confirmed = rows.filter((r) => r.status === 'confirmed');
  const totalPaid = confirmed.reduce((s, r) => s + (r.totalAmount ?? r.amount), 0);

  const receipt = (r) => {
    const ok = printReceipt({
      receiptNo: r.receiptNo || `MITE-${r.id?.slice(-8).toUpperCase()}`,
      studentName: user.name, usn: user.usn, eventTitle: r.title,
      baseAmount: r.baseAmount ?? r.amount, feeAmount: r.feeAmount ?? 0, feePercent: r.feePercent ?? 0,
      totalAmount: r.totalAmount ?? r.amount, utr: r.utr, confirmedAt: r.confirmedAt || r.paidDate || new Date(),
    });
    if (!ok) error('Please allow pop-ups to view your receipt.');
  };

  return (
    <div className="page bg-student">
      <TopNav
        logoSrc={appLogo} title="MITE Student Portal" titleTo="/student-dashboard" subtitle={`USN: ${user.usn}`}
        links={[{ to: '/student-dashboard', label: 'Events' }, { to: '/cart', label: 'Cart' }]}
        extraRight={(<>
          <button className="btn btn-outline" onClick={() => setShowProfile(true)}>Profile</button>
          <button className="btn btn-outline" onClick={() => setShowSettings(true)}>Settings</button>
        </>)}
        onLogout={() => { handleLogout(); navigate('/login'); }}
      />
      <main className="container wide">
        <h2 style={{ margin: '4px 0 16px' }}>My Payments</h2>
        {loading ? <Skeleton height={90} count={3} /> : (
          <>
            <div className="stat-grid">
              <StatCard icon="check" tone="green" label="Confirmed" value={confirmed.length} hint={`${money(totalPaid)} paid`} />
              <StatCard icon="clock" tone="orange" label="Awaiting review" value={rows.filter((r) => r.status === 'pending').length} />
              <StatCard icon="alert" tone="violet" label="Rejected" value={rows.filter((r) => r.status === 'rejected').length} hint="Resubmit from checkout" />
            </div>
            <div className="card">
              <div className="chips" style={{ marginBottom: 16 }}>
                {[['all', 'All'], ['confirmed', 'Confirmed'], ['pending', 'Pending'], ['rejected', 'Rejected']].map(([k, l]) => (
                  <button key={k} className={`chip${filter === k ? ' active' : ''}`} onClick={() => setFilter(k)}>{l}</button>
                ))}
              </div>
              {shown.length === 0 ? (
                <EmptyState icon="receipt" title="No payments yet" action={<button className="btn btn-primary" onClick={() => navigate('/student-dashboard')}>Browse events</button>}>
                  Payments you submit will appear here with their status and receipts.
                </EmptyState>
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>Event</th><th>Type</th><th>Amount</th><th>UTR</th><th>Status</th><th /></tr></thead>
                    <tbody>
                      {shown.map((r) => (
                        <tr key={r.id + r.type}>
                          <td><strong>{r.title}</strong>{r.rejectionReason && <div className="reject-note" style={{ marginTop: 6 }}>{r.rejectionReason}</div>}</td>
                          <td style={{ textTransform: 'capitalize' }}>{r.type}</td>
                          <td>{money(r.totalAmount ?? r.amount)}</td>
                          <td style={{ fontFamily: 'monospace' }}>{r.utr || '—'}</td>
                          <td><StatusBadge status={r.status} /></td>
                          <td style={{ textAlign: 'right' }}>
                            {r.status === 'confirmed' && <button className="btn btn-outline" onClick={() => receipt(r)}>Receipt</button>}
                            {r.status === 'rejected' && <button className="btn btn-primary" onClick={() => navigate('/checkout')}>Resubmit</button>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
      {showProfile && <ProfileOverlay user={user} setUser={setUser} onClose={() => setShowProfile(false)} />}
      {showSettings && <SettingsOverlay user={user} onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default MyPaymentsPage;
