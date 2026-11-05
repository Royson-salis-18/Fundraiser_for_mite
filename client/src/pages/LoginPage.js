import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import appLogo from '../1630654323517.jpg';
import loginBg from '../Wallpaper para cll.jpg';

const LoginPage = ({ setIsLoggedIn, setUser }) => {
  const [usn, setUsn] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError('');
    const trimmedUsn = usn.trim();
    const trimmedPassword = password.trim();
    const ddmmyyyyRegex = /^\d{8}$/;

    if (!trimmedUsn || !trimmedPassword) {
      setError('Please enter both USN and password');
      return;
    }

    if (!ddmmyyyyRegex.test(trimmedPassword)) {
      setError('Password must be in DDMMYYYY format');
      return;
    }

    setLoading(true);

    try {
      // Try student role first
      let data = await authAPI.login(trimmedUsn, trimmedPassword, 'student');
      
      // If student login fails, try admin role
      if (data.error) {
        data = await authAPI.login(trimmedUsn, trimmedPassword, 'admin');
      }

      if (data.error) {
        setError(data.error || 'Invalid USN or password');
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
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="page login-split">
      <aside className="login-brand">
        <span className="orb orb-a" aria-hidden="true" /><span className="orb orb-b" aria-hidden="true" /><span className="grid-lines" aria-hidden="true" />
        <div className="login-brand-inner">
          <span className="eyebrow">Mangalore Institute of Technology &amp; Engineering</span>
          <h2>Pay for fests, events and fees <em>in one place.</em></h2>
          <p>Pay securely by UPI, track every payment in real time and download receipts the moment they are confirmed.</p>
          <ul className="login-points">
            <li><strong>Transparent pricing</strong><span>Event price and service fee shown before you pay.</span></li>
            <li><strong>Verified by the fest team</strong><span>Every payment is reviewed and confirmed by an administrator.</span></li>
            <li><strong>Instant receipts</strong><span>Printable receipts with a unique number for each payment.</span></li>
          </ul>
        </div>
      </aside>
      <div className="login-form-side">
      <div className="card narrow">
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <img src={appLogo} alt="Main Logo" style={{ width: '150px', height: 'auto', borderRadius: '15px', marginBottom: '15px' }} />
          <h1 style={{ color: 'var(--color-navy)', fontSize: '24px', fontWeight: 'bold', marginTop: '10px' }}>MITE Fundraiser Portal</h1>
          <p style={{ color: '#6B7280' }}>Sign in with your USN and password</p>
        </div>
        <div>
          <label className="label">University Seat Number (USN)</label>
          <input className="input" type="text" placeholder="e.g., 1MS21CS001" value={usn} onChange={(e) => setUsn(e.target.value)} />
          <label className="label">Password (DDMMYYYY)</label>
          <input 
            className="input" 
            type="password" 
            placeholder="e.g., 01012003" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !loading) {
                handleLogin();
              }
            }}
            disabled={loading}
          />
          <p style={{ color: '#6B7280', fontSize: '12px', marginBottom: 20 }}>Default password is your date of birth (DDMMYYYY)</p>
          {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}
          <button 
            onClick={handleLogin} 
            className="btn btn-primary" 
            style={{ width: '100%', marginBottom: '15px' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
          
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#6B7280', fontSize: '14px' }}>
              Don't have an account?{' '}
              <span 
                onClick={() => navigate('/register')} 
                style={{ color: 'var(--color-navy)', cursor: 'pointer', textDecoration: 'underline', fontWeight: '500' }}
              >
                Create account here
              </span>
            </p>
          </div>
        </div>
        <div style={{ marginTop: 20, textAlign: 'center', color: '#6B7280', fontSize: '14px' }}>
          <p>Use your USN and DOB as password (DDMMYYYY). Example: 1MS21CS001 / 01012003</p>
        </div>
      </div>
      </div>
    </div>
  );
};

export default LoginPage;