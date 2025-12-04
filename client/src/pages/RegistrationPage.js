import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import appLogo from '../1630654323517.jpg';

const RegistrationPage = ({ setIsLoggedIn, setUser }) => {
  const [formData, setFormData] = useState({
    usn: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async () => {
    setError('');
    setLoading(true);

    // Validation
    if (!formData.usn.trim() || !formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    // Validate password format (DDMMYYYY)
    const ddmmyyyyRegex = /^\d{8}$/;
    if (!ddmmyyyyRegex.test(formData.password)) {
      setError('Password must be in DDMMYYYY format (Date of Birth)');
      setLoading(false);
      return;
    }

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      // Call the registration API
      const data = await authAPI.register({
        usn: formData.usn.trim(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password.trim(),
        role: formData.role
      });

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Update app state
      setIsLoggedIn(true);
      setUser(data.user);

      // Navigate based on role
      if (data.user.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/student-dashboard');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Registration failed. Please try again.');
      setLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleRegister();
    }
  };

  return (
    <div className="page bg-login" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="card narrow" style={{ maxWidth: '450px' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <img src={appLogo} alt="Main Logo" style={{ width: '150px', height: 'auto', borderRadius: '15px', marginBottom: '15px' }} />
          <h1 style={{ color: '#1A4E9B', fontSize: '24px', fontWeight: 'bold', marginTop: '10px' }}>Create Account</h1>
          <p style={{ color: '#6B7280' }}>Register for the Fundraiser Portal</p>
        </div>
        
        <div>
          <label className="label">Role</label>
          <select 
            className="input" 
            name="role"
            value={formData.role}
            onChange={handleChange}
            disabled={loading}
            style={{ marginBottom: '15px' }}
          >
            <option value="student">Student</option>
            <option value="admin">Admin</option>
          </select>

          <label className="label">University Seat Number (USN)</label>
          <input 
            className="input" 
            type="text" 
            name="usn"
            placeholder="e.g., 1MS21CS001" 
            value={formData.usn} 
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />

          <label className="label">Full Name</label>
          <input 
            className="input" 
            type="text" 
            name="name"
            placeholder="e.g., John Doe" 
            value={formData.name} 
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />

          <label className="label">Email Address</label>
          <input 
            className="input" 
            type="email" 
            name="email"
            placeholder="e.g., john@example.com" 
            value={formData.email} 
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />

          <label className="label">Password (Date of Birth - DDMMYYYY)</label>
          <input 
            className="input" 
            type="password" 
            name="password"
            placeholder="e.g., 01012003" 
            value={formData.password} 
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />

          <label className="label">Confirm Password</label>
          <input 
            className="input" 
            type="password" 
            name="confirmPassword"
            placeholder="Re-enter your password" 
            value={formData.confirmPassword} 
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />

          <p style={{ color: '#6B7280', fontSize: '12px', marginBottom: 20 }}>
            Password must be your date of birth in DDMMYYYY format
          </p>

          {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}

          <button 
            onClick={handleRegister} 
            className="btn btn-primary" 
            style={{ width: '100%', marginBottom: '15px' }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#6B7280', fontSize: '14px' }}>
              Already have an account?{' '}
              <span 
                onClick={() => navigate('/login')} 
                style={{ color: '#1A4E9B', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Sign in here
              </span>
            </p>
          </div>
        </div>

        <div style={{ marginTop: 20, textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>
          <p>Use your USN and date of birth as password (DDMMYYYY format)</p>
          <p>Example: 1MS21CS001 / 01012003</p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;