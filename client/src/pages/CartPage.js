import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { eventsAPI, userAPI } from '../services/api';
import TopNav from '../components/TopNav';
import appLogo from '../1630654323517.jpg';
import ProfileOverlay from '../components/ProfileOverlay';
import SettingsOverlay from '../components/SettingsOverlay';

const CartPage = ({ cart, removeFromCart, user, setUser, handleLogout }) => {
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load cart from database (optional events that are selected but not paid)
  useEffect(() => {
    const loadCart = async () => {
      if (!user?.id || !user?.payments) return;
      
      try {
        setLoading(true);
        // Get all events
        const events = await eventsAPI.getAll();
        // Get user payments
        const paymentsData = await userAPI.getPayments();
        
        if (paymentsData.payments?.optional) {
          // Find optional events that are selected but not paid
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

  const handleRemoveFromCart = async (eventId) => {
    try {
      const paymentsData = await userAPI.getPayments();
      const updatedPayments = {
        ...paymentsData.payments,
        optional: paymentsData.payments.optional.filter(p => {
          const paidId = (p.id || p._id)?.toString();
          const normalizedEventId = eventId?.toString();
          return paidId !== normalizedEventId;
        })
      };

      const result = await userAPI.updatePayments(updatedPayments);
      if (result.error) {
        alert('Failed to remove item: ' + result.error);
        return;
      }

      // Update local state
      if (setUser) {
        setUser(prev => ({
          ...prev,
          payments: updatedPayments
        }));
      }

      // Reload cart
      setCartItems(prev => prev.filter(item => {
        const itemId = (item._id || item.id)?.toString();
        return itemId !== eventId?.toString();
      }));
    } catch (error) {
      console.error('Remove error:', error);
      alert('Failed to remove item. Please try again.');
    }
  };

  const total = cartItems.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const cartLength = cartItems?.length || 0;

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin-dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="page">
      <TopNav
        logoSrc={appLogo}
        title={'MITE Student Portal'}
        subtitle={user?.usn ? `USN: ${user.usn}` : undefined}
        titleTo={'/student-dashboard'}
        links={[
          { to: '/cart', label: `Cart (${cartLength})` },
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
            <p style={{ color: '#6B7280' }}>Loading cart...</p>
          </div>
        ) : cartItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: '#6B7280' }}>Your cart is empty.</p>
            <span style={{ color: '#6B7280' }}>Browse events on dashboard</span>
          </div>
        ) : (
          <div>
            {cartItems.map((item) => {
              const itemId = (item._id || item.id)?.toString();
              return (
                <div key={itemId} className="card" style={{ display: 'flex', gap: 16, padding: 12, marginBottom: 12 }}>
                  {item.poster && (
                    <img src={item.poster} alt={item.title} style={{ width: 96, height: 64, objectFit: 'cover', borderRadius: 6 }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0 }}>{item.title}</h3>
                      <strong>₹{item.amount}</strong>
                    </div>
                    {item.description && (
                      <p style={{ color: '#6B7280', fontSize: '14px', margin: '8px 0' }}>{item.description}</p>
                    )}
                    <button onClick={() => handleRemoveFromCart(itemId)} className="btn btn-outline" style={{ marginTop: 8 }}>Remove</button>
                  </div>
                </div>
              );
            })}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
              <strong>Total: ₹{total}</strong>
              <button onClick={() => navigate('/checkout')} className="btn btn-primary">Checkout</button>
            </div>
          </div>
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

export default CartPage;

