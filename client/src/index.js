import React from 'react';
import ReactDOM from 'react-dom/client';
import { ToastProvider } from './components/Toast';
import './index.css';
import App from './App';

try { document.documentElement.setAttribute('data-theme', localStorage.getItem('theme') || 'light'); } catch { /* ignore */ }
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
);

