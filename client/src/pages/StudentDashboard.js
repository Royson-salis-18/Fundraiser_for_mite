import { useToast } from '../components/Toast';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { eventsAPI, userAPI } from '../services/api';
import { StatCard, StatusBadge, EmptyState, Skeleton, money } from '../components/ui';
import { greeting, Ring, CoverArt } from '../components/flair';
import appLogo from '../1630654323517.jpg';
import TopNav from '../components/TopNav';
import ProfileOverlay from '../components/ProfileOverlay';
import SettingsOverlay from '../components/SettingsOverlay';


const StudentDashboard = ({ user, setUser, handleLogout, addToCart, cartLength }) => {
  const { error: toastError } = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddedModal, setShowAddedModal] = useState(false);
  const [addedItem, setAddedItem] = useState(null);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
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
            toastError('Failed to add payment: ' + result.error);
            return;
          }

          // Update local state
          setUser(prev => ({
            ...prev,
            payments: updatedPayments
          }));
        } catch (error) {
          console.error('Failed to add mandatory payment:', error);
          toastError('Failed to add payment. Please try again.');
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
          toastError('Failed to add event: ' + result.error);
          return;
        }

        // Update local state
        setUser(prev => ({
          ...prev,
          payments: updatedPayments
        }));
      } catch (error) {
        console.error('Failed to add optional event:', error);
        toastError('Failed to add event. Please try again.');
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
    const q = query.trim().toLowerCase();
    if (q && !`${payment.title} ${payment.description || ''}`.toLowerCase().includes(q)) return false;
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
          { to: '/my-payments', label: 'My Payments' },
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
        {loading && (<><div className="stat-grid"><Skeleton height={92} count={4} /></div><Skeleton height={260} /></>)}
        {!loading && (
        <>
        <section className="hero fade-up">
          <div className="hero-copy">
            <span className="eyebrow">{greeting()}</span>
            <h2>{(user.name || 'there').split(' ')[0]}, here is where you stand.</h2>
            <p>{mandatoryPayments.length - paidMandatory > 0
              ? `You have ${mandatoryPayments.length - paidMandatory} mandatory payment${mandatoryPayments.length - paidMandatory > 1 ? 's' : ''} left, totalling ${money(mandatoryDue)}.`
              : 'All mandatory payments are settled. Browse optional events below.'}</p>
          </div>
          <Ring percent={mandatoryPayments.length ? (paidMandatory / mandatoryPayments.length) * 100 : 100} label="mandatory" />
        </section>

        <div className="stat-grid stagger">
          <StatCard icon="clock" tone="orange" label="Mandatory due" value={money(mandatoryDue)} hint={`${mandatoryPayments.length - paidMandatory} payment(s) pending`} />
          <StatCard icon="ticket" tone="violet" label="Optional selected" value={money(selectedOptional)} hint={`${paidOptional} event(s) selected`} />
          <StatCard icon="check" tone="green" label="Total paid" value={money(totalPaid)} hint={`${paidMandatory + paidOptional} payment(s) completed`} />
          <StatCard icon="calendar" tone="navy" label="Events" value={payments.length} hint="Assigned to you" />
        </div>

        <div className="card">
          <div className="toolbar">
            <input className="input" placeholder="Search events…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search events" />
            <div className="chips">
              {[['all', 'All'], ['mandatory', 'Mandatory'], ['optional', 'Optional'], ['completed', 'Completed']].map(([k, label]) => (
                <button key={k} className={`chip${filter === k ? ' active' : ''}`} onClick={() => setFilter(k)}>{label}</button>
              ))}
            </div>
          </div>

          {filteredPayments.length === 0 && filter !== 'all' ? (
            <EmptyState icon="search" title="Nothing matches">Try a different filter or search term.</EmptyState>
          ) : mandatoryPayments.length === paidMandatory && filter === 'mandatory' ? (
            <EmptyState icon="sparkle" title="All mandatory payments completed!">You have completed all mandatory college fees and funds.</EmptyState>
          ) : (
            <div className="grid-cards">
              {filteredPayments.map((payment) => {
                const eventId = (payment._id || payment.id)?.toString();
                const list = payment.type === 'mandatory' ? user.payments.mandatory : user.payments.optional;
                const rec = list.find((p) => (p.id || p._id)?.toString() === eventId);
                let status = 'due';
                if (rec) status = rec.status === 'confirmed' || rec.status === 'pending' || rec.status === 'rejected' ? rec.status : rec.paid ? 'confirmed' : 'cart';
                return (
                  <div key={eventId} className="card event-card lift">
                    {payment.poster ? <img src={payment.poster} alt={payment.title} className="cover" /> : <CoverArt title={payment.title} type={payment.type} />}
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                      <span className={`badge ${payment.type === 'mandatory' ? 'badge-info' : 'badge-muted'}`} style={{ textTransform: 'capitalize' }}>{payment.type}</span>
                      {rec && <StatusBadge status={status} />}
                    </div>
                    <h3><Link to={`/events/${eventId}`} className="card-link">{payment.title}</Link></h3>
                    <p style={{ color: '#6B7280', margin: 0 }}>{payment.tagline || payment.description}</p>
                    <Link to={`/events/${eventId}`} className="more-link">Details and cost breakdown</Link>
                    {status === 'rejected' && <div className="reject-note">Rejected: {rec.rejectionReason || 'payment could not be verified'}</div>}
                    <div className="event-meta">
                      <div className="price">{money(payment.amount)}</div>
                      {status === 'due' && (
                        <button onClick={() => (payment.type === 'mandatory' ? handlePay(payment) : handleSelectOptional(payment))} className="btn btn-primary">
                          {payment.type === 'mandatory' ? 'Pay' : 'Add'}
                        </button>
                      )}
                      {(status === 'cart' || status === 'rejected') && (
                        <button onClick={() => navigate(status === 'rejected' ? '/checkout' : '/cart')} className="btn btn-outline">{status === 'rejected' ? 'Resubmit' : 'View cart'}</button>
                      )}
                    </div>
                  </div>
                );
              })}
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
