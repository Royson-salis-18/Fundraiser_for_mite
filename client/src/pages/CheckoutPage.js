import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { eventsAPI, userAPI } from '../services/api';
import TopNav from '../components/TopNav';
import appLogo from '../1630654323517.jpg';
import ProfileOverlay from '../components/ProfileOverlay';
import SettingsOverlay from '../components/SettingsOverlay';

const CheckoutPage = ({ user, cart, clearCart, setUser, handleLogout }) => {
  const [processing, setProcessing] = useState(false);
  const [proofById, setProofById] = useState({}); // { [id]: { utr: string, screenshot: dataURL } }
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Load cart from database
  useEffect(() => {
    const loadCart = async () => {
      if (!user?.id || !user?.payments) return;
      
      try {
        setLoading(true);
        const events = await eventsAPI.getAll();
        const paymentsData = await userAPI.getPayments();
        
        if (paymentsData.payments?.optional) {
          const selectedOptional = paymentsData.payments.optional
            .filter(p => !p.paid && p.status !== 'confirmed')
            .map(payment => {
              const eventId = (payment.id || payment._id)?.toString();
              const event = events.find(e => 
                (e._id?.toString() === eventId) || (e.id?.toString() === eventId)
              );
              return event ? { ...event, paymentId: payment.id || payment._id } : null;
            })
            .filter(Boolean);
          
          setCartItems(selectedOptional);
        }
      } catch (error) {
        console.error('Failed to load cart:', error);
        setCartItems([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadCart();
    }
  }, [user?.id, user?.payments]);

  const total = cartItems.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

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

  const handleConfirm = async () => {
    setProcessing(true);
    
    try {
      // Get current payments from database
      const paymentsData = await userAPI.getPayments();
      const updatedPayments = { ...paymentsData.payments };
      
      // Update each cart item with payment proof
      for (const item of cartItems) {
        const eventId = (item._id || item.id)?.toString();
        const proof = proofById[eventId] || {};
        
        // Find and update the payment record
        const paymentIndex = updatedPayments.optional.findIndex(p => {
          const paidId = (p.id || p._id)?.toString();
          return paidId === eventId;
        });
        
        if (paymentIndex !== -1) {
          updatedPayments.optional[paymentIndex] = {
            ...updatedPayments.optional[paymentIndex],
            id: eventId,
            paid: true,
            status: 'pending', // Admin needs to confirm
            utr: proof.utr || '',
            screenshot: proof.screenshot || '',
            paidDate: new Date().toISOString()
          };
        } else {
          // Add new payment if not found
          updatedPayments.optional.push({
            id: eventId,
            paid: true,
            status: 'pending',
            utr: proof.utr || '',
            screenshot: proof.screenshot || '',
            paidDate: new Date().toISOString()
          });
        }
      }

      // Save to database
      const result = await userAPI.updatePayments(updatedPayments);
      
      if (result.error) {
        alert('Failed to submit payment: ' + result.error);
        setProcessing(false);
        return;
      }

      // Update local state
      if (setUser) {
        setUser(prev => ({
          ...prev,
          payments: updatedPayments
        }));
      }

      if (clearCart) {
        clearCart();
      }

      // Navigate to dashboard and trigger success popup
      navigate('/student-dashboard', { state: { showPaymentSuccess: true } });
    } catch (error) {
      console.error('Payment submission error:', error);
      alert('Failed to submit payment. Please try again.');
      setProcessing(false);
    }
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
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: '#6B7280' }}>Loading checkout...</p>
          </div>
        ) : cartItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: '#6B7280' }}>Your cart is empty.</p>
            <button onClick={() => navigate('/student-dashboard')} className="btn btn-primary" style={{ marginTop: 16 }}>
              Browse Events
            </button>
          </div>
        ) : (
          <>
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ marginTop: 0 }}>Order Summary</h3>
              {cartItems.map((i) => {
                const itemId = (i._id || i.id)?.toString();
                return (
                  <div key={itemId} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center', paddingBottom: 8, marginBottom: 16, borderBottom: '1px solid #E5E7EB' }}>
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
                          <label className="label">UTR/UTI Number <span style={{ color: 'red' }}>*</span></label>
                          <input 
                            className="input" 
                            value={(proofById[itemId]?.utr) || ''} 
                            onChange={(e) => setProofById((prev) => ({ ...prev, [itemId]: { ...(prev[itemId] || {}), utr: e.target.value } }))} 
                            placeholder="Enter UTR" 
                            required
                          />
                        </div>
                        <div className="field">
                          <label className="label">Screenshot <span style={{ color: 'red' }}>*</span></label>
                          <input 
                            className="input" 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleFile(itemId, e)} 
                            required
                          />
                          {proofById[itemId]?.screenshot && (
                            <img 
                              src={proofById[itemId].screenshot} 
                              alt="Payment Screenshot" 
                              style={{ display: 'block', marginTop: 10, maxWidth: '100%', borderRadius: 6, border: '1px solid #E5E7EB' }} 
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E5E7EB', paddingTop: 8, marginTop: 8 }}>
                <span>Total</span>
                <strong>₹{total}</strong>
              </div>
            </div>
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ marginTop: 0 }}>Instructions</h3>
              <p style={{ color: '#6B7280', marginTop: 0 }}>For each event, pay to the listed UPI and provide its unique UTR and screenshot. Your payment will be reviewed by an admin.</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <button 
                disabled={processing || cartItems.length === 0 || cartItems.some((i) => {
                  const itemId = (i._id || i.id)?.toString();
                  return !(proofById[itemId]?.utr) || !(proofById[itemId]?.screenshot);
                })} 
                onClick={handleConfirm} 
                className="btn btn-primary" 
                style={{ opacity: processing ? 0.7 : 1 }}
              >
                {processing ? 'Processing...' : 'Submit Proof'}
              </button>
            </div>
          </>
        )}
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
