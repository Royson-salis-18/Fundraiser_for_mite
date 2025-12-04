import React from 'react';

const SettingsPage = ({ user }) => {
  return (
    <div className="page">
      <main className="container">
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Settings</h1>
        <p style={{ color: '#6B7280' }}>Manage your account preferences. This page is a placeholder and will be expanded.</p>
        {user && (
          <div style={{ marginTop: 16 }}>
            <p>Signed in as: <strong>{user.name || user.usn || 'User'}</strong></p>
          </div>
        )}
      </main>
    </div>
  );
};

export default SettingsPage;