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

  // Load cart from database (both mandatory and optional events that are not paid)
  useEffect(() => {
    const loadCart = async () => {
      if (!user?.id || !user?.payments) return;
      
      try {
        setLoading(true);
        const events = await eventsAPI.getAll();
        const paymentsData = await userAPI.getPayments();
        
        // Combine both mandatory and optional payments that need payment
        const allPayments = [
          ...(paymentsData.payments?.mandatory || []).filter(p => !p.paid && p.status !== 'confirmed'),
          ...(paymentsData.payments?.optional || []).filter(p => !p.paid && p.status !== 'confirmed')
        ];
        
        const selectedPayments = allPayments
          .map(payment => {
            const eventId = (payment.id || payment._id)?.toString();
            const event = events.find(e => 
              (e._id?.toString() === eventId) || (e.id?.toString() === eventId)
            );
            return event ? { 
              ...event, 
              paymentId: payment.id || payment._id, 
              isMandatory: payment.type === 'mandatory' || payment.isMandatory
            } : null;
          })
          .filter(Boolean);
        
        setCartItems(selectedPayments);
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
          { to: '/student-dashboard', label: 'Dashboard' },
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
              const isMandatory = item.type === 'mandatory' || item.isMandatory;
              
              return (
                <div 
                  key={itemId} 
                  className="card" 
                  style={{ 
                    padding: 16, 
                    marginBottom: 16,
                    borderLeft: `4px solid ${isMandatory ? '#EF4444' : '#3B82F6'}`
                  }}
                >
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    {item.poster && (
                      <img 
                        src={item.poster} 
                        alt={item.title} 
                        style={{ 
                          width: 120, 
                          height: 80, 
                          objectFit: 'cover', 
                          borderRadius: 6,
                          border: '1px solid #E5E7EB'
                        }} 
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div>
                          <h3 style={{ 
                            margin: 0, 
                            marginBottom: 8,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                          }}>
                            {item.title}
                            {isMandatory && (
                              <span style={{
                                fontSize: 12,
                                background: '#FEE2E2',
                                color: '#B91C1C',
                                padding: '2px 8px',
                                borderRadius: 4,
                                fontWeight: 500
                              }}>
                                Mandatory
                              </span>
                            )}
                          </h3>
                          {item.description && (
                            <p style={{ 
                              color: '#6B7280', 
                              fontSize: '14px', 
                              margin: '8px 0',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {item.description}
                            </p>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <strong style={{ fontSize: '18px', color: '#1F2937' }}>₹{item.amount}</strong>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                        <span style={{ 
                          fontSize: '14px', 
                          color: isMandatory ? '#B91C1C' : '#1D4ED8',
                          fontWeight: 500
                        }}>
                          {isMandatory ? 'Required Payment' : 'Optional Event'}
                        </span>
                        <button 
                          onClick={() => handleRemoveFromCart(itemId)} 
                          className="btn btn-outline" 
                          style={{ 
                            padding: '6px 12px',
                            fontSize: '14px',
                            borderColor: isMandatory ? '#FCA5A5' : '#93C5FD',
                            color: isMandatory ? '#B91C1C' : '#1D4ED8'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
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

