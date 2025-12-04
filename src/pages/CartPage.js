import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TopNav from '../components/TopNav';
import appLogo from '../1630654323517.jpg';
import ProfileOverlay from '../components/ProfileOverlay';
import SettingsOverlay from '../components/SettingsOverlay';

const CartPage = ({ cart, removeFromCart, user, setUser, handleLogout }) => {
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const total = cart.reduce((sum, i) => sum + (i.amount || 0), 0);
  const cartLength = cart?.length || 0;

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
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: '#6B7280' }}>Your cart is empty.</p>
            <span style={{ color: '#6B7280' }}>Browse events on dashboard</span>
          </div>
        ) : (
          <div>
            {cart.map((item) => (
              <div key={item.id} className="card" style={{ display: 'flex', gap: 16, padding: 12, marginBottom: 12 }}>
                <img src={item.poster} alt={item.title} style={{ width: 96, height: 64, objectFit: 'cover', borderRadius: 6 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>{item.title}</h3>
                    <strong>₹{item.amount}</strong>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="btn btn-outline" style={{ marginTop: 8 }}>Remove</button>
                </div>
              </div>
            ))}
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

