import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { students, admins } from '../mockData';
import appLogo from '../1630654323517.jpg';
import loginBg from '../Wallpaper para cll.jpg';

const LoginPage = ({ setIsLoggedIn, setUser }) => {
  const [usn, setUsn] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    setError('');
    const trimmedUsn = usn.trim();
    const trimmedPassword = password.trim();
    const ddmmyyyyRegex = /^\d{8}$/;

    if (!ddmmyyyyRegex.test(trimmedPassword)) {
      setError('Password must be in DDMMYYYY format');
      return;
    }

    const student = students.find((s) => s.usn.toLowerCase() === trimmedUsn.toLowerCase() && (s.dob === trimmedPassword || s.password === trimmedPassword));
    const admin = admins.find((a) => a.usn.toLowerCase() === trimmedUsn.toLowerCase() && (a.dob === trimmedPassword || a.password === trimmedPassword));

    if (student) {
      setIsLoggedIn(true);
      setUser(student);
      navigate('/student-dashboard');
    } else if (admin) {
      setIsLoggedIn(true);
      setUser(admin);
      navigate('/admin-dashboard');
    } else {
      setError('Invalid USN or password (use DDMMYYYY)');
    }
  };

  return (
    <div className="page bg-login" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="card narrow">
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <img src={appLogo} alt="Main Logo" style={{ width: '150px', height: 'auto', borderRadius: '15px', marginBottom: '15px' }} />
          <h1 style={{ color: '#1A4E9B', fontSize: '24px', fontWeight: 'bold', marginTop: '10px' }}>Fundraiser Portal</h1>
          <p style={{ color: '#6B7280' }}>Sign in with your USN and password</p>
        </div>
        <div>
          <label className="label">University Seat Number (USN)</label>
          <input className="input" type="text" placeholder="e.g., 1MS21CS001" value={usn} onChange={(e) => setUsn(e.target.value)} />
          <label className="label">Password (DDMMYYYY)</label>
          <input className="input" type="password" placeholder="e.g., 01012003" value={password} onChange={(e) => setPassword(e.target.value)} />
          <p style={{ color: '#6B7280', fontSize: '12px', marginBottom: 20 }}>Default password is your date of birth (DDMMYYYY)</p>
          {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}
          <button onClick={handleLogin} className="btn btn-primary" style={{ width: '100%' }}>
            Sign in
          </button>
        </div>
        <div style={{ marginTop: 20, textAlign: 'center', color: '#6B7280', fontSize: '14px' }}>
          <p>Use your USN and DOB as password (DDMMYYYY). Example: 1MS21CS001 / 01012003</p>
          <p>Admin example: admin / 01011990</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;