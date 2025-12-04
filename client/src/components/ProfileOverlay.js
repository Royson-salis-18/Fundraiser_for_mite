import React, { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import OverlayCard from './OverlayCard';

const ProfileOverlay = ({ user, setUser, onClose }) => {
  const isStudent = user?.role === 'student';
  const isAdmin = user?.role === 'admin';

  const [form, setForm] = useState({
    name: '',
    email: '',
    dob: '',
    phone: '',
    address: '',
    department: '',
    year: '',
    section: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load fresh user data
    const loadProfile = async () => {
      try {
        const data = await userAPI.getProfile();
        if (data.user) {
          setForm({
            name: data.user.name || '',
            email: data.user.email || '',
            dob: data.user.dob || '',
            phone: data.user.phone || '',
            address: data.user.address || '',
            department: data.user.department || '',
            year: data.user.year || '',
            section: data.user.section || '',
          });
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    };
    if (user?.id) {
      loadProfile();
    }
  }, [user?.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setError('');
    
    // Validation
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!form.email.trim()) {
      setError('Email is required');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (isStudent && form.dob && !/^\d{8}$/.test(form.dob)) {
      setError('DOB must be in DDMMYYYY format');
      return;
    }
    if (form.phone && !/^[0-9]{10}$/.test(form.phone.replace(/\D/g, ''))) {
      setError('Phone number must be 10 digits');
      return;
    }

    setLoading(true);
    
    try {
      const result = await userAPI.updateProfile(form);
      
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // Update local state
      if (setUser && result.user) {
        setUser(prev => ({
          ...prev,
          ...result.user
        }));
      }
      onClose();
    } catch (error) {
      console.error('Update error:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OverlayCard title={`${isAdmin ? 'Admin' : 'Student'} Profile`} onClose={onClose}>
      <div className="card" style={{ boxShadow: 'none', border: 'none', padding: 0 }}>
        <div className="field">
          <label className="label">{isAdmin ? 'Admin ID' : 'USN'}</label>
          <input className="input" value={user?.usn || ''} readOnly style={{ backgroundColor: '#F3F4F6' }} />
        </div>
        
        <div className="field">
          <label className="label">Full Name <span style={{ color: 'red' }}>*</span></label>
          <input 
            className="input" 
            name="name" 
            value={form.name} 
            onChange={handleChange}
            placeholder="Enter your full name"
            required
          />
        </div>
        
        <div className="field">
          <label className="label">Email Address <span style={{ color: 'red' }}>*</span></label>
          <input 
            className="input" 
            type="email"
            name="email" 
            value={form.email} 
            onChange={handleChange}
            placeholder="your.email@example.com"
            required
          />
        </div>

        {isStudent && (
          <>
            <div className="field">
              <label className="label">Date of Birth (DDMMYYYY)</label>
              <input 
                className="input" 
                name="dob" 
                value={form.dob} 
                onChange={handleChange} 
                placeholder="e.g., 01012003"
                maxLength={8}
              />
              <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                Format: DDMMYYYY (used as default password)
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="field" style={{ flex: 1 }}>
                <label className="label">Department</label>
                <select 
                  className="input" 
                  name="department" 
                  value={form.department} 
                  onChange={handleChange}
                >
                  <option value="">Select Department</option>
                  <option value="CSE">Computer Science & Engineering</option>
                  <option value="ECE">Electronics & Communication</option>
                  <option value="ME">Mechanical Engineering</option>
                  <option value="CE">Civil Engineering</option>
                  <option value="EE">Electrical Engineering</option>
                  <option value="ISE">Information Science & Engineering</option>
                </select>
              </div>

              <div className="field" style={{ flex: 1 }}>
                <label className="label">Year</label>
                <select 
                  className="input" 
                  name="year" 
                  value={form.year} 
                  onChange={handleChange}
                >
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label className="label">Section</label>
              <input 
                className="input" 
                name="section" 
                value={form.section} 
                onChange={handleChange}
                placeholder="e.g., A, B, C"
                maxLength={1}
              />
            </div>
          </>
        )}

        {isAdmin && (
          <div className="field">
            <label className="label">Department</label>
            <select 
              className="input" 
              name="department" 
              value={form.department} 
              onChange={handleChange}
            >
              <option value="">Select Department</option>
              <option value="CSE">Computer Science & Engineering</option>
              <option value="ECE">Electronics & Communication</option>
              <option value="ME">Mechanical Engineering</option>
              <option value="CE">Civil Engineering</option>
              <option value="EE">Electrical Engineering</option>
              <option value="ISE">Information Science & Engineering</option>
              <option value="Admin">Administration</option>
            </select>
          </div>
        )}

        <div className="field">
          <label className="label">Phone Number</label>
          <input 
            className="input" 
            type="tel"
            name="phone" 
            value={form.phone} 
            onChange={handleChange}
            placeholder="10-digit mobile number"
            maxLength={10}
          />
        </div>

        <div className="field">
          <label className="label">Address</label>
          <textarea 
            className="textarea" 
            name="address" 
            value={form.address} 
            onChange={handleChange}
            placeholder="Enter your address"
            rows={3}
          />
        </div>

        {error && <p style={{ color: 'red', marginBottom: '10px', fontSize: '14px' }}>{error}</p>}
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
          <button onClick={onClose} className="btn btn-outline" disabled={loading}>
            Cancel
          </button>
          <button onClick={handleSave} className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </OverlayCard>
  );
};

export default ProfileOverlay;