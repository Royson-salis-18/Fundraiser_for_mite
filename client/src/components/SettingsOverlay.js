import React, { useState } from 'react';
import { userAPI } from '../services/api';
import OverlayCard from './OverlayCard';

const SettingsOverlay = ({ user, onClose }) => {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleChangePassword = async () => {
    setError('');
    setSuccess('');

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setError('All password fields are required');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    const ddmmyyyyRegex = /^\d{8}$/;
    if (!ddmmyyyyRegex.test(passwordForm.newPassword)) {
      setError('Password must be in DDMMYYYY format (Date of Birth)');
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setLoading(true);

    try {
      const result = await userAPI.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      setSuccess('Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setShowPasswordSection(false);
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Change password error:', error);
      setError('Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OverlayCard title="Settings" onClose={onClose}>
      <div className="card" style={{ boxShadow: 'none', border: 'none', padding: 0 }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1A4E9B' }}>
          Account Settings
        </h3>

        {/* Change Password Section */}
        <div style={{ marginBottom: '24px' }}>
          {!showPasswordSection ? (
            <button 
              onClick={() => setShowPasswordSection(true)}
              className="btn btn-outline"
              style={{ width: '100%' }}
            >
              Change Password
            </button>
          ) : (
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px', backgroundColor: '#F9FAFB' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 'bold' }}>Change Password</h4>
                <button 
                  onClick={() => {
                    setShowPasswordSection(false);
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setError('');
                    setSuccess('');
                  }}
                  className="btn btn-outline"
                  style={{ padding: '4px 12px', fontSize: '14px' }}
                >
                  Cancel
                </button>
              </div>

              <div className="field">
                <label className="label">Current Password</label>
                <input 
                  className="input" 
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password (DDMMYYYY)"
                  disabled={loading}
                />
              </div>

              <div className="field">
                <label className="label">New Password</label>
                <input 
                  className="input" 
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password (DDMMYYYY)"
                  disabled={loading}
                />
                <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                  Must be in DDMMYYYY format (Date of Birth)
                </p>
              </div>

              <div className="field">
                <label className="label">Confirm New Password</label>
                <input 
                  className="input" 
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Re-enter new password"
                  disabled={loading}
                />
              </div>

              {error && <p style={{ color: 'red', marginBottom: '10px', fontSize: '14px' }}>{error}</p>}
              {success && <p style={{ color: 'green', marginBottom: '10px', fontSize: '14px' }}>{success}</p>}

              <button 
                onClick={handleChangePassword}
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? 'Changing Password...' : 'Change Password'}
              </button>
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '16px', marginTop: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1A4E9B' }}>
            Account Information
          </h3>
          
          <div style={{ backgroundColor: '#F9FAFB', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0' }}>
              <strong>Role:</strong> {user?.role === 'admin' ? 'Administrator' : 'Student'}
            </p>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0' }}>
              <strong>{user?.role === 'admin' ? 'Admin ID' : 'USN'}:</strong> {user?.usn || 'N/A'}
            </p>
            {user?.email && (
              <p style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0' }}>
                <strong>Email:</strong> {user.email}
              </p>
            )}
            {user?.department && (
              <p style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0' }}>
                <strong>Department:</strong> {user.department}
              </p>
            )}
            {user?.year && (
              <p style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0' }}>
                <strong>Year:</strong> {user.year}
              </p>
            )}
          </div>

          <p style={{ fontSize: '12px', color: '#6B7280', fontStyle: 'italic' }}>
            To update your profile information, use the Profile section.
          </p>
        </div>
      </div>
    </OverlayCard>
  );
};

export default SettingsOverlay;