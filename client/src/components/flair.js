import React, { useEffect, useRef, useState } from 'react';

export const greeting = () => {
  const h = new Date().getHours();
  return h < 5 ? 'Working late' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

// Animated number that eases up to its value; honours reduced-motion.
export const CountUp = ({ value, prefix = '', duration = 900 }) => {
  const [shown, setShown] = useState(0);
  const raf = useRef();
  useEffect(() => {
    const target = Number(value) || 0;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(target); return undefined; }
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      setShown(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);
  const n = Math.round(shown * 100) / 100;
  return <>{prefix}{n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</>;
};

// Circular progress ring (0-100)
export const Ring = ({ percent, size = 92, label }) => {
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, percent));
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-track" />
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-fill" strokeDasharray={c} strokeDashoffset={c - (c * p) / 100} />
      </svg>
      <div className="ring-label"><strong>{Math.round(p)}%</strong>{label && <span>{label}</span>}</div>
    </div>
  );
};

// Deterministic gradient cover for events that have no poster.
const PALETTES = [
  ['#12306B', '#2A5BB5'], ['#C85F00', '#F58220'], ['#0F766E', '#2DD4BF'],
  ['#5B21B6', '#8B5CF6'], ['#9F1239', '#FB7185'], ['#1E3A8A', '#38BDF8'],
];
export const CoverArt = ({ title = '', type }) => {
  const seed = [...title].reduce((s, ch) => s + ch.charCodeAt(0), 0);
  const [a, b] = PALETTES[seed % PALETTES.length];
  const initials = title.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <div className="cover-art" style={{ background: `linear-gradient(135deg, ${a}, ${b})` }} aria-hidden="true">
      <svg viewBox="0 0 200 80" preserveAspectRatio="none">
        <circle cx={150 + (seed % 30)} cy="20" r="60" fill="rgba(255,255,255,.10)" />
        <circle cx={30 + (seed % 40)} cy="90" r="50" fill="rgba(255,255,255,.08)" />
      </svg>
      <span className="cover-initials">{initials}</span>
      <span className="cover-type">{type}</span>
    </div>
  );
};
