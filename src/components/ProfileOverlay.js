import React, { useState } from 'react';
import OverlayCard from './OverlayCard';

const ProfileOverlay = ({ user, setUser, onClose }) => {
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
    if (setUser) setUser((prev) => ({ ...prev, ...form }));
    onClose();
  };

  return (
    <OverlayCard title="Profile" onClose={onClose}>
      <div className="card" style={{ boxShadow: 'none', border: 'none', padding: 0 }}>
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
    </OverlayCard>
  );
};

export default ProfileOverlay;