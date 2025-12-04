import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import faviconLogo from './1630654323517-removebg-preview.png';

// Import all pages
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentConfirmationPage from './pages/PaymentConfirmationPage';
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

  const clearCart = () => {
    setCart([]);
  };

  // CHANGE THIS FUNCTION - Add setCart([]) here
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setCart([]); // ADD THIS LINE - Clear cart on logout
  };

  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          {/* Default route - Login page as first page */}
          <Route path="/" element={<LoginPage setIsLoggedIn={setIsLoggedIn} setUser={setUser} />} />
          
          {/* All other routes */}
          <Route path="/login" element={<LoginPage setIsLoggedIn={setIsLoggedIn} setUser={setUser} />} />
          <Route path="/register" element={<RegistrationPage setIsLoggedIn={setIsLoggedIn} setUser={setUser} />} />
          
          {/* CHANGE THESE TWO ROUTES - Add authentication check */}
          <Route 
            path="/student-dashboard" 
            element={user ? 
              <StudentDashboard user={user} setUser={setUser} handleLogout={handleLogout} addToCart={addToCart} cartLength={cart.length} /> 
              : <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/admin-dashboard" 
            element={user ? 
              <AdminDashboard user={user} setUser={setUser} handleLogout={handleLogout} /> 
              : <Navigate to="/login" replace />
            } 
          />
          
          <Route
            path="/payment-confirmation"
            element={user?.role === 'admin'
              ? <PaymentConfirmationPage user={user} setUser={setUser} handleLogout={handleLogout} />
              : <Navigate to="/student-dashboard" replace />}
          />
          <Route
            path="/cart"
            element={user?.role === 'student'
              ? <CartPage cart={cart} removeFromCart={removeFromCart} user={user} setUser={setUser} handleLogout={handleLogout} />
              : <Navigate to="/admin-dashboard" replace />}
          />
          <Route
            path="/checkout"
            element={user?.role === 'student'
              ? <CheckoutPage user={user} cart={cart} clearCart={clearCart} setUser={setUser} handleLogout={handleLogout} />
              : <Navigate to="/admin-dashboard" replace />}
          />
          <Route
            path="/events"
            element={<Navigate to={user?.role === 'admin' ? '/admin-dashboard' : '/student-dashboard'} replace />}
          />
          
          <Route path="/settings" element={<SettingsPage user={user} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;