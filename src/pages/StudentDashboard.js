import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { payments } from '../mockData';
import appLogo from '../1630654323517.jpg';
import TopNav from '../components/TopNav';
import ProfileOverlay from '../components/ProfileOverlay';
import SettingsOverlay from '../components/SettingsOverlay';


const StudentDashboard = ({ user, setUser, handleLogout, addToCart, cartLength }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showAddedModal, setShowAddedModal] = useState(false);
  const [addedItem, setAddedItem] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Show success modal if coming from checkout with success flag
  React.useEffect(() => {
    if (location.state?.showPaymentSuccess) {
      setShowSuccessModal(true);
      // Clear the navigation state so modal doesn't reappear on refresh
      navigate('/student-dashboard', { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // Validate required props after hooks
  if (!user || !setUser) {
    console.error('StudentDashboard: Missing required props - user or setUser');
    return <div style={{ padding: '20px', textAlign: 'center' }}>Error: Missing user data</div>;
  }

  const handlePay = (payment) => {
    if (!payment || !payment.id || !payment.amount) {
      console.error('Invalid payment data:', payment);
      alert('Error: Invalid payment data');
      return;
    }
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

  const handleProceedToPay = () => {
    // Mock payment processing
    const updatedUser = { ...user };
    if (selectedPayment.type === 'mandatory') {
      updatedUser.payments.mandatory.push({ id: selectedPayment.id, paid: true });
    } else {
      updatedUser.payments.optional.push({ id: selectedPayment.id, paid: true });
    }
    setUser(updatedUser);
    setShowPaymentModal(false);
  };

  const handleSelectOptional = (payment) => {
    if (!payment || !payment.id) return;
    if (!user?.payments?.optional?.find((p) => p.id === payment.id)) {
      const updatedUser = {
        ...user,
        payments: {
          ...user.payments,
          optional: [...user.payments.optional, { id: payment.id, paid: false }],
        },
      };
      setUser(updatedUser);
    }
    if (typeof addToCart === 'function') {
      addToCart(payment);
    }
    setAddedItem(payment);
    setShowAddedModal(true);
  };

  // Settings handled via Settings page; logout handled via prop

  const filteredPayments = payments.filter(payment => {
    if (filter === 'mandatory') return payment.type === 'mandatory';
    if (filter === 'optional') return payment.type === 'optional';
    if (filter === 'completed') {
      const paid = [...(user.payments.mandatory || []), ...(user.payments.optional || [])].map(p => p.id);
      return paid.includes(payment.id);
    }
    return true;
  });
  // Validate user data structure
  if (!user.payments || !Array.isArray(user.payments.mandatory) || !Array.isArray(user.payments.optional)) {
    console.error('Invalid user payments structure:', user.payments);
    return <div style={{ padding: '20px', textAlign: 'center' }}>Error: Invalid user data structure</div>;
  }

  const mandatoryPayments = payments.filter((p) => p.type === 'mandatory');
  const optionalPayments = payments.filter((p) => p.type === 'optional');

  // Validate user data structure after defining payments
  if (!user.payments || !Array.isArray(user.payments.mandatory) || !Array.isArray(user.payments.optional)) {
    console.error('Invalid user payments structure:', user.payments);
    return <div style={{ padding: '20px', textAlign: 'center' }}>Error: Invalid user data structure</div>;
  }

  const paidMandatory = user.payments.mandatory.filter((p) => p.paid).length;
  const paidOptional = user.payments.optional.filter((p) => p.paid).length;

  const mandatoryDue = mandatoryPayments.reduce((acc, p) => {
    if (!user.payments.mandatory.find((paid) => paid.id === p.id)) {
      return acc + p.amount;
    }
    return acc;
  }, 0);

  const selectedOptional = optionalPayments.reduce((acc, p) => {
    if (user.payments.optional.find((paid) => paid.id === p.id)) {
      return acc + p.amount;
    }
    return acc;
  }, 0);

  const totalPaid = mandatoryPayments.reduce((acc, p) => {
    if (user.payments.mandatory.find((paid) => paid.id === p.id)) {
      return acc + p.amount;
    }
    return acc;
  }, 0) + optionalPayments.reduce((acc, p) => {
    if (user.payments.optional.find((paid) => paid.id === p.id)) {
      return acc + p.amount;
    }
    return acc;
  }, 0);

  return (
    <div className="page bg-student">
      <TopNav
        logoSrc={appLogo}
        title="MITE Student Portal"
        titleTo="/student-dashboard"
        subtitle={`USN: ${user.usn}`}
        links={[
          { to: '/cart', label: cartLength != null ? `Cart (${cartLength})` : 'Cart' },
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '20px' }}>
          <div className="card">
            <h2 style={{ color: '#EF7100' }}>Mandatory Payments Due</h2>
            <p style={{ fontSize: '36px', fontWeight: 'bold' }}>₹{mandatoryDue}</p>
            <p>{mandatoryPayments.length - paidMandatory} payment(s) pending</p>
          </div>
          <div className="card">
            <h2 style={{ color: '#EF7100' }}>Selected Optional Events</h2>
            <p style={{ fontSize: '36px', fontWeight: 'bold' }}>₹{selectedOptional}</p>
            <p>{paidOptional} event(s) selected</p>
          </div>
          <div className="card">
            <h2 style={{ color: '#EF7100' }}>Total Paid</h2>
            <p style={{ fontSize: '36px', fontWeight: 'bold' }}>₹{totalPaid}</p>
            <p>{paidMandatory + paidOptional} payment(s) completed</p>
          </div>
          <div className="card">
            <h2 style={{ color: '#EF7100' }}>Total Events</h2>
            <p style={{ fontSize: '36px', fontWeight: 'bold' }}>{payments.length}</p>
            <p>Assigned to you</p>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', borderBottom: '1px solid #D1D5DB', marginBottom: '20px' }}>
            <button onClick={() => setFilter('all')} className="btn btn-outline" style={{ marginRight: 8 }}>All</button>
            <button onClick={() => setFilter('mandatory')} className="btn btn-outline" style={{ marginRight: 8 }}>Mandatory</button>
            <button onClick={() => setFilter('optional')} className="btn btn-outline" style={{ marginRight: 8 }}>Optional</button>
            <button onClick={() => setFilter('completed')} className="btn btn-outline">Completed</button>
          </div>

          {filteredPayments.length === 0 && filter !== 'all' ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ fontSize: '24px', color: '#1A4E9B' }}>No payments found for this filter.</p>
            </div>
          ) : mandatoryPayments.length === paidMandatory && filter === 'mandatory' ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ fontSize: '24px', color: '#1A4E9B' }}>All mandatory payments completed!</p>
              <p style={{ color: '#6B7280' }}>You have completed all mandatory college fees and funds</p>
            </div>
          ) : (
            <div className="grid-cards">
              {filteredPayments.map((payment) => (
                <div key={payment.id} className="card">
                  <img src={payment.poster} alt={payment.title} className="cover" />
                  <div style={{ padding: 0, marginTop: 12 }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{payment.title}</h3>
                    <p style={{ color: '#6B7280', marginBottom: '10px' }}>{payment.description}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1A4E9B' }}>₹{payment.amount}</p>
                      {payment.type === 'mandatory' ? (
                        !user.payments.mandatory.find((p) => p.id === payment.id) ? (
                          <button onClick={() => handlePay(payment)} className="btn btn-primary">Pay</button>
                        ) : (
                          <p style={{ color: 'green' }}>Paid</p>
                        )
                      ) : (
                        (() => {
                          const opt = user.payments.optional.find((p) => p.id === payment.id);
                          if (!opt) {
                            return <button onClick={() => handleSelectOptional(payment)} className="btn btn-primary">Add</button>;
                          }
                          if (opt.paid) {
                            return <p style={{ color: 'green', margin: 0 }}>Paid</p>;
                          }
                          return <p style={{ color: '#6B7280', margin: 0 }}>Added</p>;
                        })()
                      )}
                    </div>
                  </div>
                </div>
              ))}
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

      {showPaymentModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="card" style={{ maxWidth: '420px', width: '100%' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Complete Payment</h2>
            <p style={{ marginBottom: '20px' }}>You will be redirected to Razorpay payment gateway</p>
            <div className="card" style={{ padding: '16px', background: '#F9FAFB', border: '1px solid #E5E7EB', boxShadow: 'none' }}>
              <p style={{ fontWeight: 'bold' }}>{selectedPayment.title}</p>
              <p>Amount: ₹{selectedPayment.amount}</p>
              <p>Student USN: {user.usn}</p>
              {selectedPayment.payeeUpiId && (
                <div style={{ marginTop: 8 }}>
                  <p style={{ margin: 0 }}>Payee: {selectedPayment.payeeName || '—'}</p>
                  <p style={{ margin: 0 }}>UPI: <span style={{ fontFamily: 'monospace' }}>{selectedPayment.payeeUpiId}</span></p>
                </div>
              )}
            </div>
            <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '20px', textAlign: 'center' }}>This is a demo. In production, you will be redirected to Razorpay's secure payment gateway.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setShowPaymentModal(false)} className="btn btn-outline">Cancel</button>
              <button onClick={handleProceedToPay} className="btn btn-primary">Proceed to Pay</button>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.45)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="card" style={{ maxWidth: 420, width: '100%' }}>
            <h2 style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>Payment Successful</h2>
            <p style={{ color: '#6B7280', marginTop: 0 }}>Your proof was submitted and the event status has been updated.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button className="btn btn-primary" onClick={() => setShowSuccessModal(false)}>OK</button>
            </div>
          </div>
        </div>
      )}

      {showAddedModal && addedItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="card" style={{ maxWidth: '420px', width: '100%' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '12px' }}>Added to Cart</h2>
            <div className="card" style={{ padding: '12px', background: '#F9FAFB', border: '1px solid #E5E7EB', boxShadow: 'none' }}>
              <p style={{ fontWeight: 'bold', margin: 0 }}>{addedItem.title}</p>
              <p style={{ marginTop: 6, marginBottom: 0 }}>Amount: ₹{addedItem.amount}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
              <button onClick={() => { setShowAddedModal(false); setAddedItem(null); }} className="btn btn-outline">Close</button>
              <button onClick={() => { setShowAddedModal(false); navigate('/cart'); }} className="btn btn-primary">Go to Cart</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
