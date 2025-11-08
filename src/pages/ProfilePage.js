import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TopNav from '../components/TopNav';
import appLogo from '../1630654323517.jpg';

const ProfilePage = ({ user, setUser, handleLogout }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    dob: user?.dob || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const ddmmyyyyRegex = /^\d{8}$/;
    if (form.dob && !ddmmyyyyRegex.test(form.dob)) {
      alert('DOB must be DDMMYYYY');
      return;
    }
    const updated = { ...user, name: form.name, email: form.email, dob: form.dob, password: form.dob || user.password };
    setUser(updated);
    alert('Profile updated');
  };

  return (
    <div className="page">
      <TopNav
        logoSrc={appLogo}
        title={user?.role === 'admin' ? 'MITE Admin Dashboard' : 'MITE Student Portal'}
        subtitle={user?.role === 'admin' ? 'Manage fees and fundraising events' : (user?.usn ? `USN: ${user.usn}` : undefined)}
        titleTo={user?.role === 'admin' ? '/admin-dashboard' : '/student-dashboard'}
        links={[
          { to: '/events', label: 'Events' },
          { to: '/cart', label: 'Cart' },
          { to: '/profile', label: 'Profile' },
          { to: '/settings', label: 'Settings' },
        ]}
        onLogout={() => { handleLogout && handleLogout(); navigate('/login'); }}
      />
      <main className="container" style={{ maxWidth: 720 }}>
        <div className="card">
          <div className="field">
            <label className="label">USN</label>
            <input className="input" value={user?.usn || ''} readOnly />
          </div>
          <div className="field">
            <label className="label">Name</label>
            <input className="input" name="name" value={form.name} onChange={handleChange} />
          </div>
          <div className="field">
            <label className="label">Email</label>
            <input className="input" name="email" value={form.email} onChange={handleChange} />
          </div>
          <div className="field">
            <label className="label">DOB (DDMMYYYY)</label>
            <input className="input" name="dob" value={form.dob} onChange={handleChange} placeholder="e.g., 01012003" />
          </div>
          <div style={{ textAlign: 'right' }}>
            <button onClick={handleSave} className="btn btn-primary">Save Changes</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;

