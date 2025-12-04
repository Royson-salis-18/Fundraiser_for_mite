import React from 'react';
import OverlayCard from './OverlayCard';

const SettingsOverlay = ({ user, onClose }) => {
  return (
    <OverlayCard title="Settings" onClose={onClose}>
      <div className="card" style={{ boxShadow: 'none', border: 'none', padding: 0 }}>
        <p style={{ color: '#6B7280' }}>General preferences</p>
        <div className="field">
          <label className="label">Theme</label>
          <div>
            <button className="btn btn-outline" disabled>Light</button>
            <button className="btn btn-outline" disabled style={{ marginLeft: 8 }}>Dark</button>
          </div>
        </div>
        <div className="field">
          <label className="label">Notifications</label>
          <div>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" disabled /> Email alerts
            </label>
          </div>
        </div>
      </div>
    </OverlayCard>
  );
};

export default SettingsOverlay;