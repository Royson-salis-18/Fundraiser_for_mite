import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { eventsAPI, userAPI } from '../services/api';
import appLogo from '../1630654323517.jpg';
import TopNav from '../components/TopNav';
import ProfileOverlay from '../components/ProfileOverlay';
import SettingsOverlay from '../components/SettingsOverlay';


const StudentDashboard = ({ user, setUser, handleLogout, addToCart, cartLength }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddedModal, setShowAddedModal] = useState(false);
  const [addedItem, setAddedItem] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch events from database
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        const events = await eventsAPI.getAll();
        setPayments(events || []);
      } catch (error) {
        console.error('Failed to load events:', error);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, []);

  // Refresh user data from database
  useEffect(() => {
    const loadUserData = async () => {
      if (user?.id) {
        try {
          const paymentsData = await userAPI.getPayments();
          if (paymentsData.payments) {
            console.log('Loaded user payments from DB:', paymentsData.payments);
            setUser(prev => ({
              ...prev,
              payments: paymentsData.payments
            }));
          }
        } catch (error) {
          console.error('Failed to load user payments:', error);
        }
      }
    };
    if (user?.id) {
      loadUserData();
    }
  }, [user?.id]);

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

  const handlePay = async (payment) => {
    if (!payment || (!payment.id && !payment._id)) return;
    
    // Add to cart instead of marking as paid
    if (typeof addToCart === 'function') {
      // First ensure the payment is in the user's mandatory payments
      const eventId = payment._id || payment.id;
      if (!user?.payments?.mandatory?.find((p) => (p.id || p._id) === eventId)) {
        try {
          const updatedPayments = {
            ...user.payments,
            mandatory: [...(user.payments?.mandatory || []), { 
              id: eventId, 
              paid: false,
              status: 'added' // Add status field
            }],
          };
          
          // Save to database
          const result = await userAPI.updatePayments(updatedPayments);
          if (result.error) {
            alert('Failed to add payment: ' + result.error);
            return;
          }

          // Update local state
          setUser(prev => ({
            ...prev,
            payments: updatedPayments
          }));
        } catch (error) {
          console.error('Failed to add mandatory payment:', error);
          alert('Failed to add payment. Please try again.');
          return;
        }
      }
      
      // Add to cart
      addToCart(payment);
      setAddedItem(payment);
      setShowAddedModal(true);
    }
  };

  const handleSelectOptional = async (payment) => {
    if (!payment || (!payment.id && !payment._id)) return;
    const eventId = payment._id || payment.id;
    
    if (!user?.payments?.optional?.find((p) => (p.id || p._id) === eventId)) {
      try {
        const updatedPayments = {
          ...user.payments,
          optional: [...(user.payments.optional || []), { 
            id: eventId, 
            paid: false,
            status: 'added' // Add status field
          }],
        };
        
        // Save to database
        const result = await userAPI.updatePayments(updatedPayments);
        if (result.error) {
          alert('Failed to add event: ' + result.error);
          return;
        }

        // Update local state
        setUser(prev => ({
          ...prev,
          payments: updatedPayments
        }));
      } catch (error) {
        console.error('Failed to add optional event:', error);
        alert('Failed to add event. Please try again.');
        return;
      }
    }
    
    if (typeof addToCart === 'function') {
      addToCart(payment);
    }
    setAddedItem(payment);
    setShowAddedModal(true);
  };

  // Settings handled via Settings page; logout handled via prop

  const filteredPayments = payments.filter(payment => {
    const eventId = payment._id || payment.id;
    if (filter === 'mandatory') return payment.type === 'mandatory';
    if (filter === 'optional') return payment.type === 'optional';
    if (filter === 'completed') {
      const paid = [...(user.payments.mandatory || []), ...(user.payments.optional || [])]
        .map(p => (p.id || p._id)?.toString());
      return paid.includes(eventId?.toString());
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

  // Helper function to normalize IDs for comparison
  const normalizeId = (id) => {
    if (!id) return null;
    const str = id.toString();
    // Remove any ObjectId wrapper if present
    return str;
  };

  // Helper function to check if user has a payment for an event
  const hasPayment = (eventId, paymentArray) => {
    if (!eventId || !paymentArray || paymentArray.length === 0) return false;
    const normalizedEventId = normalizeId(eventId);
    return paymentArray.some(paid => {
      const paidId = normalizeId(paid.id || paid._id);
      return paidId === normalizedEventId;
    });
  };

  // Helper function to check if user has paid for an event
  const hasPaid = (eventId, paymentArray) => {
    if (!eventId || !paymentArray || paymentArray.length === 0) return false;
    const normalizedEventId = normalizeId(eventId);
    return paymentArray.some(paid => {
      const paidId = normalizeId(paid.id || paid._id);
      const isPaid = paid.paid === true || paid.status === 'confirmed';
      return paidId === normalizedEventId && isPaid;
    });
  };

  // Calculate statistics with safe array access
  const paidMandatory = (user.payments?.mandatory || []).filter((p) => p.paid === true || p.status === 'confirmed').length;
  const paidOptional = (user.payments?.optional || []).filter((p) => p.paid === true || p.status === 'confirmed').length;

  // Calculate mandatory payments due (events user hasn't paid for)
  const mandatoryDue = mandatoryPayments.reduce((acc, event) => {
    const eventId = event._id || event.id;
    if (!hasPaid(eventId, user.payments?.mandatory || [])) {
      const amount = Number(event.amount) || 0;
      return acc + amount;
    }
    return acc;
  }, 0);

  // Calculate selected optional events total (events user has selected, paid or not)
  const selectedOptional = optionalPayments.reduce((acc, event) => {
    const eventId = event._id || event.id;
    if (hasPayment(eventId, user.payments?.optional || [])) {
      const amount = Number(event.amount) || 0;
      return acc + amount;
    }
    return acc;
  }, 0);

  // Calculate total paid (both mandatory and optional)
  const totalPaid = mandatoryPayments.reduce((acc, event) => {
    const eventId = event._id || event.id;
    if (hasPaid(eventId, user.payments?.mandatory || [])) {
      const amount = Number(event.amount) || 0;
      return acc + amount;
    }
    return acc;
  }, 0) + optionalPayments.reduce((acc, event) => {
    const eventId = event._id || event.id;
    if (hasPaid(eventId, user.payments?.optional || [])) {
      const amount = Number(event.amount) || 0;
      return acc + amount;
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
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Loading events...</p>
          </div>
        )}
        {!loading && (
        <>
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
                        (() => {
                          const eventId = (payment._id || payment.id)?.toString();
                          const paymentRecord = user.payments.mandatory.find((p) => (p.id || p._id)?.toString() === eventId);
                          if (!paymentRecord) {
                            return <button onClick={() => handlePay(payment)} className="btn btn-primary">Pay</button>;
                          }
                          if (paymentRecord.status === 'pending') {
                            return <p style={{ color: '#F59E0B', margin: 0 }}>Waiting for Confirmation</p>;
                          }
                          if (paymentRecord.status === 'confirmed' || paymentRecord.paid) {
                            return <p style={{ color: 'green' }}>Paid</p>;
                          }
                          return <p style={{ color: '#3B82F6' }}>Added to Cart</p>;
                        })()
                      ) : (
                        (() => {
                          const eventId = (payment._id || payment.id)?.toString();
                          const opt = user.payments.optional.find((p) => (p.id || p._id)?.toString() === eventId);
                          if (!opt) {
                            return <button onClick={() => handleSelectOptional(payment)} className="btn btn-primary">Add</button>;
                          }
                          if (opt.status === 'pending') {
                            return <p style={{ color: '#F59E0B', margin: 0 }}>Waiting for Confirmation</p>;
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
        </>
        )}
      </main>
      {showProfile && (
        <ProfileOverlay user={user} setUser={setUser} onClose={() => setShowProfile(false)} />
      )}
      {showSettings && (
        <SettingsOverlay user={user} onClose={() => setShowSettings(false)} />
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
