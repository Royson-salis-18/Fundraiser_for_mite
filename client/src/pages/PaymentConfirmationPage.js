import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNav from '../components/TopNav';
import appLogo from '../1630654323517.jpg';
import ProfileOverlay from '../components/ProfileOverlay';
import SettingsOverlay from '../components/SettingsOverlay';
import { adminAPI } from '../services/api';

const PaymentConfirmationPage = ({ user, setUser, handleLogout }) => {
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/admin-dashboard');
    }
  }, [user, navigate]);

  const loadPendingPayments = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading pending payments...');
      const data = await adminAPI.getPendingPayments();
      console.log('📥 Received data:', data);
      console.log('📥 Data type:', typeof data);
      console.log('📥 Data keys:', data ? Object.keys(data) : 'null');
      console.log('📥 pendingPayments type:', data?.pendingPayments ? typeof data.pendingPayments : 'undefined');
      console.log('📥 pendingPayments is array?', Array.isArray(data?.pendingPayments));
      
      if (data && !data.error) {
        if (data.pendingPayments && Array.isArray(data.pendingPayments)) {
          console.log(`✅ Found ${data.pendingPayments.length} pending payments`);
          if (data.pendingPayments.length > 0) {
            console.log('📋 First payment sample:', JSON.stringify(data.pendingPayments[0], null, 2));
          }
          setPendingPayments(data.pendingPayments);
        } else {
          console.log('⚠️  No pendingPayments array in response');
          console.log('⚠️  Response structure:', JSON.stringify(data, null, 2));
          setPendingPayments([]);
        }
      } else {
        console.error('❌ API returned error:', data?.error);
        if (data?.error) {
          console.error('Error details:', data.error);
          alert(`Failed to load pending payments: ${data.error}`);
        }
        setPendingPayments([]);
      }
    } catch (error) {
      console.error('❌ Failed to load pending payments:', error);
      console.error('❌ Error stack:', error.stack);
      // Check if it's a JSON parse error
      if (error.message && error.message.includes('JSON')) {
        console.error('JSON parse error - server may be returning HTML instead of JSON');
        console.error('This usually means the endpoint does not exist or there is a server error');
        alert('Server returned invalid response. Check console for details.');
      } else {
        alert(`Failed to load pending payments: ${error.message}`);
      }
      setPendingPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingPayments();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadPendingPayments, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleConfirmPayment = async (payment) => {
    const key = `${payment.studentId}-${payment.paymentId}`;
    setProcessing({ ...processing, [key]: 'confirming' });
    
    try {
      const result = await adminAPI.confirmPayment(
        payment.studentId,
        payment.paymentId,
        'confirmed',
        payment.eventType
      );
      
      if (result.error) {
        alert('Failed to confirm payment: ' + result.error);
        setProcessing({ ...processing, [key]: null });
        return;
      }

      // Remove from pending list and reload to refresh counts
      await loadPendingPayments();
      
      setProcessing({ ...processing, [key]: null });
      alert('Payment confirmed successfully!');
    } catch (error) {
      console.error('Confirm payment error:', error);
      alert('Failed to confirm payment. Please try again.');
      setProcessing({ ...processing, [key]: null });
    }
  };

  return (
    <div className="page">
      <TopNav
        logoSrc={appLogo}
        title="MITE Admin Dashboard"
        titleTo="/admin-dashboard"
        subtitle="Payment Confirmation"
        links={[
          { to: '/admin-dashboard', label: 'Dashboard' },
        ]}
        extraRight={(
          <>
            <button className="btn btn-outline" onClick={() => setShowProfile(true)}>Profile</button>
            <button className="btn btn-outline" onClick={() => setShowSettings(true)}>Settings</button>
          </>
        )}
        onLogout={() => { handleLogout(); navigate('/login'); }}
      />
      <main className="container wide">
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>Payment Confirmation</h1>
            <button onClick={loadPendingPayments} className="btn btn-outline" disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <p style={{ color: '#6B7280' }}>Loading pending payments...</p>
            </div>
          ) : pendingPayments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <p style={{ fontSize: '20px', color: '#1A4E9B', marginBottom: 8 }}>No pending payments</p>
              <p style={{ color: '#6B7280' }}>All payments have been reviewed.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {pendingPayments.map((payment) => {
                const key = `${payment.studentId}-${payment.paymentId}`;
                const isProcessing = processing[key];
                
                return (
                  <div key={key} className="card" style={{ border: '1px solid #E5E7EB', padding: 20 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 24 }}>
                      {/* Student Details */}
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: 16, color: '#1A4E9B' }}>Student Details</h3>
                        <div style={{ display: 'grid', gap: 12 }}>
                          <div>
                            <span style={{ color: '#6B7280', fontSize: '14px', display: 'block', marginBottom: 4 }}>USN:</span>
                            <strong style={{ fontSize: '16px' }}>{payment.studentUSN}</strong>
                          </div>
                          <div>
                            <span style={{ color: '#6B7280', fontSize: '14px', display: 'block', marginBottom: 4 }}>Name:</span>
                            <strong style={{ fontSize: '16px' }}>{payment.studentName}</strong>
                          </div>
                          <div>
                            <span style={{ color: '#6B7280', fontSize: '14px', display: 'block', marginBottom: 4 }}>Email:</span>
                            <span style={{ fontSize: '14px' }}>{payment.studentEmail}</span>
                          </div>
                        </div>
                      </div>

                      {/* Event Details */}
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: 16, color: '#1A4E9B' }}>Event Details</h3>
                        <div style={{ display: 'grid', gap: 12 }}>
                          <div>
                            <span style={{ color: '#6B7280', fontSize: '14px', display: 'block', marginBottom: 4 }}>Event:</span>
                            <strong style={{ fontSize: '16px' }}>{payment.eventTitle}</strong>
                          </div>
                          <div>
                            <span style={{ color: '#6B7280', fontSize: '14px', display: 'block', marginBottom: 4 }}>Type:</span>
                            <span style={{ fontSize: '14px', textTransform: 'capitalize' }}>{payment.eventType}</span>
                          </div>
                          <div>
                            <span style={{ color: '#6B7280', fontSize: '14px', display: 'block', marginBottom: 4 }}>Amount:</span>
                            <strong style={{ fontSize: '18px', color: '#EF7100' }}>₹{payment.eventAmount}</strong>
                          </div>
                        </div>
                      </div>

                      {/* UTR and Confirm Button */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 250 }}>
                        <div style={{ padding: 16, background: '#F9FAFB', borderRadius: 8 }}>
                          <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: 8, color: '#6B7280' }}>UTR Number</h4>
                          <div style={{ 
                            fontSize: '18px', 
                            fontFamily: 'monospace', 
                            fontWeight: 'bold',
                            color: '#1A4E9B',
                            wordBreak: 'break-all'
                          }}>
                            {payment.utr || 'N/A'}
                          </div>
                        </div>

                        {payment.screenshot && (
                          <div style={{ marginTop: 8 }}>
                            <span style={{ color: '#6B7280', fontSize: '12px', display: 'block', marginBottom: 8 }}>Payment Screenshot:</span>
                            <img 
                              src={payment.screenshot} 
                              alt="Payment Screenshot" 
                              style={{ 
                                maxWidth: '100%', 
                                maxHeight: '200px', 
                                borderRadius: 8, 
                                border: '1px solid #E5E7EB',
                                cursor: 'pointer'
                              }}
                              onClick={() => {
                                const newWindow = window.open();
                                newWindow.document.write(`<img src="${payment.screenshot}" style="max-width:100%; height:auto;" />`);
                              }}
                            />
                          </div>
                        )}

                        <button
                          onClick={() => handleConfirmPayment(payment)}
                          className="btn btn-primary"
                          disabled={!!isProcessing}
                          style={{ width: '100%', padding: '12px', fontSize: '16px', fontWeight: 'bold' }}
                        >
                          {isProcessing === 'confirming' ? 'Confirming...' : 'Confirm Payment'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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

export default PaymentConfirmationPage;

