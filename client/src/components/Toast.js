import Icon from './Icon';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext({ toast: () => {} });
export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  const toast = useCallback((message, type = 'info', ms = 4000) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), ms);
  }, []);

  const value = useMemo(() => ({
    toast,
    success: (m) => toast(m, 'success'),
    error: (m) => toast(m, 'error', 6000),
  }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span className="toast-icon">{t.type === 'success' ? <Icon name="check" size={14} /> : t.type === 'error' ? '!' : 'i'}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
