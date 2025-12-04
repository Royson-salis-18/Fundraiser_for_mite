import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TopNav from '../components/TopNav';
import appLogo from '../1630654323517.jpg';
import ProfileOverlay from '../components/ProfileOverlay';
import SettingsOverlay from '../components/SettingsOverlay';

const CheckoutPage = ({ user, cart, clearCart, setUser, handleLogout }) => {
  const [processing, setProcessing] = useState(false);
  const [proofById, setProofById] = useState({}); // { [id]: { utr: string, screenshot: dataURL } }
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const navigate = useNavigate();
  const total = cart.reduce((sum, i) => sum + (i.amount || 0), 0);

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin-dashboard');
    }
  }, [user, navigate]);

  const buildUpiUrl = (item) => {
    if (!item?.payeeUpiId) return '';
    const params = new URLSearchParams({
      pa: item.payeeUpiId,
      pn: item.payeeName || 'Payee',
      am: String(item.amount || 0),
      cu: 'INR',
      tn: item.title || 'Event',
    });
    return `upi://pay?${params.toString()}`;
  };

  const buildQrSrc = (upiUrl) => upiUrl ? `https://chart.googleapis.com/chart?cht=qr&chs=220x220&chl=${encodeURIComponent(upiUrl)}` : '';

  const handleFile = (id, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setProofById((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), screenshot: ev.target.result } }));
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    setProcessing(true);
    setTimeout(() => {
      const updatedUser = { ...user };
      if (!updatedUser.payments) updatedUser.payments = { mandatory: [], optional: [] };
      for (const item of cart) {
        const proof = proofById[item.id] || {};
        if (!updatedUser.payments.optional.find((p) => p.id === item.id)) {
          updatedUser.payments.optional.push({ id: item.id, paid: true, utr: proof.utr, screenshot: proof.screenshot });
        }
      }
      setUser(updatedUser);
      clearCart();
      setProcessing(false);
      // Navigate to dashboard and trigger success popup there
      navigate('/student-dashboard', { state: { showPaymentSuccess: true } });
    }, 800);
  };

  return (
    <div className="page">
      <TopNav
        logoSrc={appLogo}
        title={'MITE Student Portal'}
        subtitle={user?.usn ? `USN: ${user.usn}` : undefined}
        titleTo={'/student-dashboard'}
        links={[
          { to: '/cart', label: 'Cart' },
        ]}
        extraRight={(
          <>
            <button className="btn btn-outline" onClick={() => setShowProfile(true)}>Profile</button>
            <button className="btn btn-outline" onClick={() => setShowSettings(true)}>Settings</button>
          </>
        )}
        onLogout={() => { handleLogout && handleLogout(); navigate('/login'); }}
      />
      <main className="container wide" style={{ maxWidth: 900 }}>
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>Order Summary</h3>
          {cart.map((i) => (
            <div key={i.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center', paddingBottom: 8, marginBottom: 16, borderBottom: '1px solid #E5E7EB' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{i.title}</span>
                  <strong>₹{i.amount}</strong>
                </div>
                {i.payeeUpiId && (
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>Payee</div>
                      <div style={{ fontWeight: 600 }}>{i.payeeName || '—'}</div>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>UPI</div>
                      <div style={{ fontFamily: 'monospace' }}>{i.payeeUpiId}</div>
                    </div>
                    {buildUpiUrl(i) && (
                      <img src={buildQrSrc(buildUpiUrl(i))} alt="UPI QR" style={{ width: 92, height: 92, borderRadius: 8, border: '1px solid #E5E7EB' }} />
                    )}
                  </div>
                )}
                <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
                  <div className="field">
                    <label className="label">UTR/UTI Number</label>
                    <input className="input" value={(proofById[i.id]?.utr) || ''} onChange={(e) => setProofById((prev) => ({ ...prev, [i.id]: { ...(prev[i.id] || {}), utr: e.target.value } }))} placeholder="Enter UTR" />
                  </div>
                  <div className="field">
                    <label className="label">Screenshot</label>
                    <input className="input" type="file" accept="image/*" onChange={(e) => handleFile(i.id, e)} />
                    {proofById[i.id]?.screenshot && <img src={proofById[i.id].screenshot} alt="Payment Screenshot" style={{ display: 'block', marginTop: 10, maxWidth: '100%', borderRadius: 6, border: '1px solid #E5E7EB' }} />}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E5E7EB', paddingTop: 8, marginTop: 8 }}>
            <span>Total</span>
            <strong>₹{total}</strong>
          </div>
        </div>
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>Instructions</h3>
          <p style={{ color: '#6B7280', marginTop: 0 }}>For each event, pay to the listed UPI and provide its unique UTR and screenshot.</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <button disabled={processing || cart.length === 0 || cart.some((i) => !(proofById[i.id]?.utr) || !(proofById[i.id]?.screenshot))} onClick={handleConfirm} className="btn btn-primary" style={{ opacity: processing ? 0.7 : 1 }}>
            {processing ? 'Processing...' : 'Submit Proof'}
          </button>
        </div>
      </main>
      {showProfile && (
        <ProfileOverlay user={user} setUser={setUser} onClose={() => setShowProfile(false)} />
      )}
      {showSettings && (
        <SettingsOverlay user={user} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};

export default CheckoutPage;
