import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNav from '../components/TopNav';
import appLogo from '../1630654323517.jpg';
import ProfileOverlay from '../components/ProfileOverlay';
import SettingsOverlay from '../components/SettingsOverlay';
import { EmptyState, Skeleton, StatCard, money, downloadCSV } from '../components/ui';
import { useToast } from '../components/Toast';
import { adminAPI } from '../services/api';

const PaymentConfirmationPage = ({ user, setUser, handleLogout }) => {
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [rejecting, setRejecting] = useState(null); // key of payment being rejected
  const [reason, setReason] = useState('');
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const navigate = useNavigate();
  const { success, error } = useToast();

  useEffect(() => {
    if (user?.role !== 'admin') navigate('/admin-dashboard');
  }, [user, navigate]);

  const load = useCallback(async () => {
    try {
      const data = await adminAPI.getPendingPayments();
      if (data && !data.error && Array.isArray(data.pendingPayments)) setPendingPayments(data.pendingPayments);
      else {
        setPendingPayments([]);
        if (data?.error) error(`Failed to load pending payments: ${data.error}`);
      }
    } catch (e) {
      setPendingPayments([]);
      error('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const decide = async (payment, status, why) => {
    const key = `${payment.studentId}-${payment.paymentId}`;
    setProcessing((p) => ({ ...p, [key]: status }));
    try {
      const result = await adminAPI.confirmPayment(payment.studentId, payment.paymentId, status, payment.eventType, why);
      if (result.error) { error(result.error); return; }
      success(status === 'confirmed' ? 'Payment confirmed — receipt is now available to the student' : 'Payment rejected');
      setRejecting(null); setReason('');
      await load();
    } catch {
      error('Action failed. Please try again.');
    } finally {
      setProcessing((p) => ({ ...p, [key]: null }));
    }
  };

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pendingPayments;
    return pendingPayments.filter((p) => `${p.studentUSN} ${p.studentName} ${p.eventTitle} ${p.utr}`.toLowerCase().includes(q));
  }, [pendingPayments, query]);

  const exportCSV = () => downloadCSV('pending-payments.csv', [
    ['USN', 'Name', 'Email', 'Event', 'Type', 'Amount', 'UTR'],
    ...shown.map((p) => [p.studentUSN, p.studentName, p.studentEmail, p.eventTitle, p.eventType, p.eventAmount, p.utr]),
  ]);

  const pendingTotal = pendingPayments.reduce((s, p) => s + (Number(p.eventAmount) || 0), 0);

  return (
    <div className="page">
      <TopNav
        logoSrc={appLogo} title="MITE Admin Dashboard" titleTo="/admin-dashboard" subtitle="Payment Confirmation"
        links={[{ to: '/admin-dashboard', label: 'Dashboard' }, { to: '/admin-analytics', label: 'Reports' }]}
        extraRight={(<>
          <button className="btn btn-outline" onClick={() => setShowProfile(true)}>Profile</button>
          <button className="btn btn-outline" onClick={() => setShowSettings(true)}>Settings</button>
        </>)}
        onLogout={() => { handleLogout(); navigate('/login'); }}
      />
      <main className="container wide">
        <div className="stat-grid">
          <StatCard icon="clock" tone="orange" label="Awaiting review" value={pendingPayments.length} />
          <StatCard icon="wallet" tone="green" label="Value pending" value={money(pendingTotal)} hint="Before platform fee" />
        </div>

        <div className="card">
          <div className="toolbar">
            <input className="input" placeholder="Search USN, name, event or UTR…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search pending payments" />
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button className="btn btn-outline" onClick={exportCSV} disabled={!shown.length}>Export CSV</button>
              <button className="btn btn-outline" onClick={load}>Refresh</button>
            </div>
          </div>

          {loading ? <Skeleton height={150} count={2} /> : shown.length === 0 ? (
            <EmptyState icon="sparkle" title="You're all caught up">{query ? 'No payments match your search.' : 'There are no payments waiting for review.'}</EmptyState>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {shown.map((p) => {
                const key = `${p.studentId}-${p.paymentId}`;
                const busy = processing[key];
                return (
                  <div key={key} className="card" style={{ boxShadow: 'none' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
                      <div>
                        <div className="stat-label">Student</div>
                        <div style={{ fontSize: 17, fontWeight: 700 }}>{p.studentName}</div>
                        <div style={{ color: 'var(--color-muted)' }}>{p.studentUSN}</div>
                        <div style={{ color: 'var(--color-muted)', fontSize: 13 }}>{p.studentEmail}</div>
                      </div>
                      <div>
                        <div className="stat-label">Event</div>
                        <div style={{ fontSize: 17, fontWeight: 700 }}>{p.eventTitle}</div>
                        <span className="badge badge-muted" style={{ textTransform: 'capitalize' }}>{p.eventType}</span>
                        <div className="price" style={{ marginTop: 6 }}>{money(p.eventAmount)}</div>
                      </div>
                      <div>
                        <div className="stat-label">UTR</div>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, wordBreak: 'break-all' }}>{p.utr || 'N/A'}</div>
                        {p.screenshot && (
                          <img src={p.screenshot} alt="Payment screenshot" onClick={() => setPreview(p.screenshot)}
                            style={{ marginTop: 8, maxHeight: 110, maxWidth: '100%', borderRadius: 8, border: '1px solid #E5E7EB', cursor: 'zoom-in' }} />
                        )}
                      </div>
                    </div>

                    {rejecting === key ? (
                      <div style={{ marginTop: 16 }}>
                        <label className="label" htmlFor={`r-${key}`}>Reason shown to the student</label>
                        <input id={`r-${key}`} className="input" value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} placeholder="e.g. UTR doesn't match the screenshot" />
                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                          <button className="btn btn-primary" disabled={!!busy} onClick={() => decide(p, 'rejected', reason)}>{busy === 'rejected' ? 'Rejecting…' : 'Confirm rejection'}</button>
                          <button className="btn btn-outline" onClick={() => { setRejecting(null); setReason(''); }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline" disabled={!!busy} onClick={() => setRejecting(key)}>Reject</button>
                        <button className="btn btn-primary" disabled={!!busy} onClick={() => decide(p, 'confirmed')}>{busy === 'confirmed' ? 'Confirming…' : 'Confirm payment'}</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {preview && (
        <div onClick={() => setPreview(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'grid', placeItems: 'center', zIndex: 900, cursor: 'zoom-out' }}>
          <img src={preview} alt="Payment screenshot full size" style={{ maxWidth: '92vw', maxHeight: '90vh', borderRadius: 12 }} />
        </div>
      )}
      {showProfile && <ProfileOverlay user={user} setUser={setUser} onClose={() => setShowProfile(false)} />}
      {showSettings && <SettingsOverlay user={user} onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default PaymentConfirmationPage;
