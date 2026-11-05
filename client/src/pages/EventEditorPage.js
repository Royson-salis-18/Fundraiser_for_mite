import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import TopNav from '../components/TopNav';
import ProfileOverlay from '../components/ProfileOverlay';
import SettingsOverlay from '../components/SettingsOverlay';
import { Skeleton, EmptyState, money } from '../components/ui';
import { useToast } from '../components/Toast';
import { adminLinks } from '../components/navLinks';
import { eventsAPI } from '../services/api';
import appLogo from '../1630654323517.jpg';

const CATEGORIES = ['Venue', 'Technical', 'Prizes', 'Speakers', 'Hospitality', 'Marketing', 'Transport', 'Food', 'Decor', 'Safety', 'Contingency', 'Other'];
const toLocal = (iso) => (iso ? new Date(iso).toISOString().slice(0, 16) : '');

const EventEditorPage = ({ user, setUser, handleLogout }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [event, setEvent] = useState(null);
  const [f, setF] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const ev = await eventsAPI.getOne(id);
        if (ev && !ev.error) {
          setEvent(ev);
          setF({
            tagline: ev.tagline || '', overview: ev.overview || '', venue: ev.venue || '', contact: ev.contact || '',
            startDate: toLocal(ev.startDate), deadline: toLocal(ev.deadline),
            highlights: ev.highlights?.length ? ev.highlights : [''],
            schedule: ev.schedule?.length ? ev.schedule : [{ time: '', title: '', note: '' }],
            budget: ev.budget?.length ? ev.budget : [{ category: 'Venue', item: '', amount: '', note: '' }],
          });
        }
      } finally { setLoading(false); }
    })();
  }, [id]);

  const total = useMemo(() => (f ? f.budget.reduce((t, r) => t + (Number(r.amount) || 0), 0) : 0), [f]);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const setRow = (k, i, patch) => setF((p) => ({ ...p, [k]: p[k].map((r, j) => (j === i ? (typeof r === 'string' ? patch : { ...r, ...patch }) : r)) }));
  const addRow = (k, row) => setF((p) => ({ ...p, [k]: [...p[k], row] }));
  const delRow = (k, i) => setF((p) => ({ ...p, [k]: p[k].filter((_, j) => j !== i) }));

  const save = async () => {
    setSaving(true);
    try {
      const body = {
        ...f,
        startDate: f.startDate ? new Date(f.startDate).toISOString() : '',
        deadline: f.deadline ? new Date(f.deadline).toISOString() : '',
        highlights: f.highlights.filter((h) => h.trim()),
        schedule: f.schedule.filter((r) => r.title.trim()),
        budget: f.budget.filter((r) => String(r.item).trim()).map((r) => ({ ...r, amount: Number(r.amount) || 0 })),
      };
      const r = await eventsAPI.update(id, body);
      if (r.error) error(r.error); else success('Event details saved');
    } catch { error('Could not save. Please try again.'); } finally { setSaving(false); }
  };

  return (
    <div className="page">
      <TopNav logoSrc={appLogo} title="MITE Admin Dashboard" titleTo="/admin-dashboard" subtitle="Event details and budget" links={adminLinks}
        extraRight={(<>
          <button className="btn btn-outline" onClick={() => setShowProfile(true)}>Profile</button>
          <button className="btn btn-outline" onClick={() => setShowSettings(true)}>Settings</button>
        </>)}
        onLogout={() => { handleLogout(); navigate('/login'); }} />
      <main className="container wide editor">
        {loading ? <Skeleton height={300} count={2} /> : !event ? <EmptyState icon="search" title="Event not found" /> : (
          <>
            <div className="toolbar" style={{ justifyContent: 'space-between' }}>
              <div><span className="eyebrow">Editing</span><h2 style={{ margin: 0 }}>{event.title}</h2></div>
              <div className="btn-row">
                <Link className="btn btn-outline" to={`/events/${id}`}>Preview as student</Link>
                <button className="btn btn-primary" disabled={saving} onClick={save}>{saving ? 'Saving...' : 'Save changes'}</button>
              </div>
            </div>

            <section className="panel">
              <h3 className="panel-title">Promotion</h3>
              <div className="form-grid">
                <div className="field span2"><label className="label">Tagline</label><input className="input" maxLength={140} value={f.tagline} onChange={(e) => set('tagline', e.target.value)} placeholder="One line that makes people want to join" /></div>
                <div className="field span2"><label className="label">About this event</label><textarea className="textarea" rows={5} maxLength={4000} value={f.overview} onChange={(e) => set('overview', e.target.value)} placeholder="What it is, who it is for, what the fee includes" /></div>
                <div className="field"><label className="label">Date and time</label><input className="input" type="datetime-local" value={f.startDate} onChange={(e) => set('startDate', e.target.value)} /></div>
                <div className="field"><label className="label">Register by</label><input className="input" type="datetime-local" value={f.deadline} onChange={(e) => set('deadline', e.target.value)} /></div>
                <div className="field"><label className="label">Venue</label><input className="input" value={f.venue} onChange={(e) => set('venue', e.target.value)} /></div>
                <div className="field"><label className="label">Contact</label><input className="input" value={f.contact} onChange={(e) => set('contact', e.target.value)} placeholder="Email or phone for questions" /></div>
              </div>
              <label className="label">Highlights</label>
              {f.highlights.map((h, i) => (
                <div key={i} className="row-edit"><input className="input" value={h} maxLength={160} onChange={(e) => setRow('highlights', i, e.target.value)} /><button className="btn btn-outline" type="button" onClick={() => delRow('highlights', i)}>Remove</button></div>
              ))}
              {f.highlights.length < 12 && <button className="btn btn-outline" type="button" onClick={() => addRow('highlights', '')}>Add highlight</button>}
            </section>

            <section className="panel">
              <h3 className="panel-title">Schedule</h3>
              {f.schedule.map((r, i) => (
                <div key={i} className="row-edit three">
                  <input className="input" placeholder="Time, e.g. Day 1, 9:00 AM" value={r.time} onChange={(e) => setRow('schedule', i, { time: e.target.value })} />
                  <input className="input" placeholder="What happens" value={r.title} onChange={(e) => setRow('schedule', i, { title: e.target.value })} />
                  <input className="input" placeholder="Note (optional)" value={r.note} onChange={(e) => setRow('schedule', i, { note: e.target.value })} />
                  <button className="btn btn-outline" type="button" onClick={() => delRow('schedule', i)}>Remove</button>
                </div>
              ))}
              {f.schedule.length < 20 && <button className="btn btn-outline" type="button" onClick={() => addRow('schedule', { time: '', title: '', note: '' })}>Add schedule row</button>}
            </section>

            <section className="panel">
              <div className="panel-head"><h3 className="panel-title">Cost breakdown (shown publicly)</h3><strong className="price">{money(total)}</strong></div>
              <p className="muted-sm">List every cost so students can see where their money goes. The total is calculated for you.</p>
              <datalist id="cats">{CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist>
              {f.budget.map((r, i) => (
                <div key={i} className="row-edit budget">
                  <input className="input" list="cats" placeholder="Category" value={r.category} onChange={(e) => setRow('budget', i, { category: e.target.value })} />
                  <input className="input" placeholder="What is it for" value={r.item} onChange={(e) => setRow('budget', i, { item: e.target.value })} />
                  <input className="input" type="number" min="0" placeholder="Amount" value={r.amount} onChange={(e) => setRow('budget', i, { amount: e.target.value })} />
                  <button className="btn btn-outline" type="button" onClick={() => delRow('budget', i)}>Remove</button>
                </div>
              ))}
              {f.budget.length < 40 && <button className="btn btn-outline" type="button" onClick={() => addRow('budget', { category: 'Other', item: '', amount: '', note: '' })}>Add cost line</button>}
            </section>
            <div className="btn-row" style={{ justifyContent: 'flex-end' }}><button className="btn btn-primary" disabled={saving} onClick={save}>{saving ? 'Saving...' : 'Save changes'}</button></div>
          </>
        )}
      </main>
      {showProfile && <ProfileOverlay user={user} setUser={setUser} onClose={() => setShowProfile(false)} />}
      {showSettings && <SettingsOverlay user={user} onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default EventEditorPage;
