import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { publicAPI } from '../services/api';
import { paletteFor } from './flair';
import Icon from './Icon';

const fmtShort = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

export const useHighlights = () => {
  const [list, setList] = useState([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let alive = true;
    publicAPI.getHighlights().then((h) => { if (alive) { setList(h); setLoaded(true); } });
    return () => { alive = false; };
  }, []);
  const byId = useMemo(() => new Map(list.map((h) => [h.id, h])), [list]);
  return { list, byId, loaded };
};

export const useNow = (ms = 1000) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t); }, [ms]);
  return now;
};

export const split = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
};

export const Countdown = ({ to, now }) => {
  const t = split(new Date(to).getTime() - now);
  return (
    <div className="cd" role="timer" aria-label="Countdown">
      {[['d', 'days'], ['h', 'hrs'], ['m', 'min'], ['s', 'sec']].map(([k, label]) => (
        <div key={k} className="cd-cell"><strong>{String(t[k]).padStart(2, '0')}</strong><span>{label}</span></div>
      ))}
    </div>
  );
};

// Honest urgency / social-proof badges: each one is only shown when the underlying number supports it.
export const badgesFor = (h, now = Date.now()) => {
  if (!h) return [];
  const out = [];
  const dl = h.deadline ? new Date(h.deadline).getTime() : null;
  const st = h.startDate ? new Date(h.startDate).getTime() : null;
  if (dl) {
    const days = Math.ceil((dl - now) / 86400000);
    if (days < 0) out.push({ text: 'Registration closed', tone: 'late' });
    else if (days === 0) out.push({ text: 'Closes today', tone: 'hot' });
    else if (days <= 5) out.push({ text: `Closes in ${days} day${days === 1 ? '' : 's'}`, tone: 'hot' });
  }
  if (h.trending) out.push({ text: 'Trending', tone: 'trend' });
  if (h.recent >= 5) out.push({ text: `${h.recent} joined this week`, tone: 'ok' });
  else if (h.joined >= 10) out.push({ text: `${h.joined} students in`, tone: 'ok' });
  if (st && st >= now) {
    const days = Math.ceil((st - now) / 86400000);
    if (days <= 30) out.push({ text: days === 0 ? 'Starts today' : `Starts in ${days} day${days === 1 ? '' : 's'}`, tone: 'info' });
  }
  return out.slice(0, 3);
};

export const HypeBadges = ({ h, now }) => {
  const list = badgesFor(h, now);
  if (!list.length) return null;
  return <div className="hype-badges">{list.map((b) => <span key={b.text} className={`hype hype-${b.tone}`}>{b.text}</span>)}</div>;
};

// Rotating spotlight of the next events, with a live countdown.
export const Spotlight = ({ items }) => {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const now = useNow(1000);
  const navigate = useNavigate();
  const slides = items.slice(0, 4);

  useEffect(() => {
    if (paused || slides.length < 2) return undefined;
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 7000);
    return () => clearInterval(t);
  }, [paused, slides.length]);

  if (!slides.length) return null;
  const h = slides[i % slides.length];
  const [c1, c2] = paletteFor(h.title);
  const target = h.startDate && new Date(h.startDate).getTime() > now ? h.startDate : h.deadline;
  const label = target === h.startDate ? 'Starts in' : 'Registration closes in';
  const initials = h.title.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  return (
    <section className="spot fade-up" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      style={{ '--c1': c1, '--c2': c2 }} aria-roledescription="carousel" aria-label="Featured events">
      <div className="spot-bg" aria-hidden="true"><span className="spot-initials">{initials}</span></div>
      <div className="spot-body" key={h.id}>
        <div className="spot-eyebrow"><span className="eyebrow">{i === 0 ? 'Up next' : 'Coming up'}</span><HypeBadges h={h} now={now} /></div>
        <h2>{h.title}</h2>
        {h.tagline && <p className="spot-tag">{h.tagline}</p>}
        <div className="spot-meta">
          {h.startDate && <span><Icon name="calendar" size={16} />{fmtShort(h.startDate)}</span>}
          {h.venue && <span><Icon name="building" size={16} />{h.venue}</span>}
          <span><Icon name="users" size={16} />{h.joined} student{h.joined === 1 ? '' : 's'} in</span>
        </div>
        <div className="spot-foot">
          {target && <div><span className="spot-cd-label">{label}</span><Countdown to={target} now={now} /></div>}
          <div className="btn-row">
            <button className="btn btn-primary" onClick={() => navigate(`/events/${h.id}`)}>View event and join</button>
            <Link className="btn btn-outline hero-btn" to={`/events/${h.id}#cost`}>See where the money goes</Link>
          </div>
        </div>
      </div>
      {slides.length > 1 && (
        <div className="spot-dots" role="tablist">
          {slides.map((s, k) => <button key={s.id} role="tab" aria-selected={k === i} aria-label={`Show ${s.title}`} className={k === i ? 'on' : ''} onClick={() => setI(k)} />)}
        </div>
      )}
    </section>
  );
};

// Login page: compact "coming up" list
export const ComingUp = ({ items }) => {
  const now = useNow(1000);
  if (!items.length) return null;
  return (
    <div className="comingup">
      <span className="eyebrow">Coming up</span>
      {items.slice(0, 3).map((h) => {
        const target = h.startDate && new Date(h.startDate).getTime() > now ? h.startDate : h.deadline;
        const t = target ? split(new Date(target).getTime() - now) : null;
        return (
          <div key={h.id} className="cu-row">
            <div><b>{h.title}</b><small>{h.joined} students already in{h.trending ? ' · Trending' : ''}</small></div>
            {t && <span className="cu-time">{t.d}d {String(t.h).padStart(2, '0')}h {String(t.m).padStart(2, '0')}m</span>}
          </div>
        );
      })}
    </div>
  );
};
