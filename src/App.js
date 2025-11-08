import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import faviconLogo from './1630654323517-removebg-preview.png';

// Import all pages
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import EventsPage from './pages/EventsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';

function App() {
  const [, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);

  // Set favicon and apple-touch-icon to use the src logo without renaming/moving
  useEffect(() => {
    const setIcon = (rel) => {
      let link = document.querySelector(`link[rel="${rel}"]`);
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        document.head.appendChild(link);
      }
      link.href = faviconLogo;
    };
    setIcon('icon');
    setIcon('apple-touch-icon');
  }, []);

  const addToCart = (item) => {
    if (!item || !item.id) return;
    setCart((prev) => (prev.some((i) => i.id === item.id) ? prev : [...prev, item]));
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          {/* Default route - Login page as first page */}
          <Route path="/" element={<LoginPage setIsLoggedIn={setIsLoggedIn} setUser={setUser} />} />
          
          {/* All other routes */}
          <Route path="/login" element={<LoginPage setIsLoggedIn={setIsLoggedIn} setUser={setUser} />} />
          <Route path="/student-dashboard" element={<StudentDashboard user={user} setUser={setUser} handleLogout={handleLogout} />} />
          <Route path="/admin-dashboard" element={<AdminDashboard user={user} setUser={setUser} handleLogout={handleLogout} />} />
          <Route
            path="/cart"
            element={user?.role === 'student'
              ? <CartPage cart={cart} removeFromCart={removeFromCart} user={user} setUser={setUser} handleLogout={handleLogout} />
              : <Navigate to="/admin-dashboard" replace />}
          />
          <Route
            path="/checkout"
            element={user?.role === 'student'
              ? <CheckoutPage user={user} cart={cart} setUser={setUser} handleLogout={handleLogout} />
              : <Navigate to="/admin-dashboard" replace />}
          />
          <Route
            path="/events"
            element={<Navigate to={user?.role === 'admin' ? '/admin-dashboard' : '/student-dashboard'} replace />}
          />
          <Route path="/profile" element={<ProfilePage user={user} setUser={setUser} handleLogout={handleLogout} />} />
          <Route path="/settings" element={<SettingsPage user={user} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
