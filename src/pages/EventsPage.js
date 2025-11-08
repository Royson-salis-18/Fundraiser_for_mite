import React from 'react';
import { payments } from '../mockData';
import { Link, useNavigate } from 'react-router-dom';
import TopNav from '../components/TopNav';
import appLogo from '../1630654323517.jpg';

const EventsPage = ({ user, addToCart, cart, handleLogout }) => {
  const optionalEvents = payments.filter((p) => p.type === 'optional');
  const cartLength = cart?.length || 0;
  const navigate = useNavigate();

  return (
    <div className="page">
      <TopNav
        logoSrc={appLogo}
        title={user?.role === 'admin' ? 'MITE Admin Dashboard' : 'MITE Student Portal'}
        subtitle={user?.role === 'admin' ? 'Manage fees and fundraising events' : (user?.usn ? `USN: ${user.usn}` : undefined)}
        titleTo={user?.role === 'admin' ? '/admin-dashboard' : '/student-dashboard'}
        links={[
          { to: '/events', label: 'Events' },
          { to: '/cart', label: `Cart (${cartLength})` },
          { to: '/profile', label: 'Profile' },
          { to: '/settings', label: 'Settings' },
        ]}
        onLogout={() => { handleLogout && handleLogout(); navigate('/login'); }}
      />
      <main className="container wide">
        <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {optionalEvents.map((evt) => {
            const inCart = !!cart?.find((c) => c.id === evt.id);
            const alreadyPaid = user?.payments?.optional?.find((p) => p.id === evt.id);
            return (
              <div key={evt.id} className="card">
                <img src={evt.poster} alt={evt.title} className="cover" style={{ height: 180 }} />
                <div style={{ padding: 0, marginTop: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 18 }}>{evt.title}</h3>
                  <p style={{ color: '#6B7280', minHeight: 48 }}>{evt.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: '#1A4E9B' }}>₹{evt.amount}</strong>
                    {alreadyPaid ? (
                      <span style={{ color: 'green', fontWeight: 'bold' }}>Paid</span>
                    ) : inCart ? (
                      <span style={{ color: '#EF7100', fontWeight: 'bold' }}>In Cart</span>
                    ) : (
                      <button onClick={() => addToCart({ id: evt.id, title: evt.title, amount: evt.amount, poster: evt.poster, payeeName: evt.payeeName, payeeUpiId: evt.payeeUpiId })} className="btn btn-primary">Add</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default EventsPage;

