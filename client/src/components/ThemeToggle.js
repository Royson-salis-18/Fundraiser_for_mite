import React, { useEffect, useState } from 'react';
import Icon from './Icon';

const read = () => { try { return localStorage.getItem('theme'); } catch { return null; } };

const ThemeToggle = () => {
  const [dark, setDark] = useState(() => read() === 'dark');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch { /* ignore */ }
  }, [dark]);
  return (
    <button className="btn btn-icon" onClick={() => setDark((d) => !d)} aria-label="Toggle dark mode" title="Toggle dark mode">
      <Icon name={dark ? 'sun' : 'moon'} size={18} />
    </button>
  );
};

export default ThemeToggle;
