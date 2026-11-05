import React, { useMemo, useState } from 'react';

export const STATUS_META = {
  paid:     { label: 'Paid in full',    color: '#22C55E' },
  review:   { label: 'Under review',    color: '#3B82F6' },
  partial:  { label: 'Partially paid',  color: '#F59E0B' },
  rejected: { label: 'Rejected',        color: '#EF4444' },
  unpaid:   { label: 'Not paid',        color: '#64748B' },
};
export const STATUS_ORDER = ['paid', 'review', 'partial', 'rejected', 'unpaid'];

export const Legend = ({ counts }) => (
  <div className="legend">
    {STATUS_ORDER.map((k) => (
      <span key={k} className="legend-item"><i style={{ background: STATUS_META[k].color }} />{STATUS_META[k].label}{counts ? <b>{counts[k] ?? 0}</b> : null}</span>
    ))}
  </div>
);

// ---- Donut: student status mix
export const Donut = ({ counts, total, size = 200, centre, sub }) => {
  const r = size / 2 - 16; const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(148,163,184,.14)" strokeWidth="18" />
        {STATUS_ORDER.map((k) => {
          const v = counts[k] || 0; if (!v || !total) return null;
          const len = (v / total) * c;
          const el = (
            <circle key={k} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={STATUS_META[k].color} strokeWidth="18"
              strokeDasharray={`${Math.max(0, len - 3)} ${c - Math.max(0, len - 3)}`} strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`} strokeLinecap="butt" className="donut-seg">
              <title>{`${STATUS_META[k].label}: ${v} students`}</title>
            </circle>
          );
          offset += len; return el;
        })}
      </svg>
      <div className="donut-centre"><strong>{centre}</strong><span>{sub}</span></div>
    </div>
  );
};

// ---- Stacked status bars, one row per group (branch / batch / class)
export const StatusBars = ({ rows, onSelect, selected }) => (
  <div className="sbars">
    {rows.map((g) => (
      <button key={g.key} className={`sbar-row${selected === g.key ? ' active' : ''}`} onClick={() => onSelect && onSelect(g.key)} type="button">
        <div className="sbar-label"><strong>{g.key}</strong>{g.name && <span>{g.name}</span>}</div>
        <div className="sbar-track" role="img" aria-label={`${g.key}: ${g.paid} of ${g.students} students paid in full`}>
          {STATUS_ORDER.map((k) => g[k] > 0 && (
            <span key={k} style={{ width: `${(g[k] / g.students) * 100}%`, background: STATUS_META[k].color }} title={`${STATUS_META[k].label}: ${g[k]}`} />
          ))}
        </div>
        <div className="sbar-val"><strong>{g.rate}%</strong><span>{g.paid}/{g.students} paid</span></div>
      </button>
    ))}
  </div>
);

// ---- Cumulative collections area chart
export const AreaChart = ({ data, height = 220 }) => {
  const [hover, setHover] = useState(null);
  const W = 720; const padL = 8; const padR = 8; const padT = 16; const padB = 26;
  const { pts, max, bars } = useMemo(() => {
    const maxC = Math.max(1, ...data.map((d) => d.cumulative));
    const maxD = Math.max(1, ...data.map((d) => d.amount));
    const step = (W - padL - padR) / Math.max(1, data.length - 1);
    return {
      max: maxC,
      pts: data.map((d, i) => [padL + i * step, padT + (1 - d.cumulative / maxC) * (height - padT - padB)]),
      bars: data.map((d, i) => ({ x: padL + i * step, h: (d.amount / maxD) * (height - padT - padB) * 0.45 })),
    };
  }, [data, height]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${pts.at(-1)[0]},${height - padB} L${pts[0][0]},${height - padB} Z`;
  const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const step = (W - padL - padR) / Math.max(1, data.length - 1);
  return (
    <div className="area">
      <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F58220" stopOpacity=".55" /><stop offset="100%" stopColor="#F58220" stopOpacity="0" /></linearGradient>
          <linearGradient id="areaLine" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#7FA6F5" /><stop offset="100%" stopColor="#F58220" /></linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((t) => <line key={t} x1={padL} x2={W - padR} y1={padT + t * (height - padT - padB)} y2={padT + t * (height - padT - padB)} stroke="rgba(148,163,184,.14)" strokeDasharray="3 5" />)}
        {bars.map((b, i) => <rect key={i} x={b.x - 3} y={height - padB - b.h} width="6" height={b.h} rx="2" fill="rgba(127,166,245,.35)" />)}
        <path d={area} fill="url(#areaFill)" />
        <path d={line} fill="none" stroke="url(#areaLine)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => <rect key={d.date} x={pts[i][0] - step / 2} y="0" width={step} height={height} fill="transparent" onMouseEnter={() => setHover(i)} />)}
        {hover != null && <g><line x1={pts[hover][0]} x2={pts[hover][0]} y1={padT} y2={height - padB} stroke="rgba(255,255,255,.35)" /><circle cx={pts[hover][0]} cy={pts[hover][1]} r="5" fill="#F58220" stroke="#fff" strokeWidth="2" /></g>}
        <text x={padL} y={height - 6} className="axis">{fmt(data[0].date)}</text>
        <text x={W / 2} y={height - 6} className="axis" textAnchor="middle">{fmt(data[Math.floor(data.length / 2)].date)}</text>
        <text x={W - padR} y={height - 6} className="axis" textAnchor="end">{fmt(data.at(-1).date)}</text>
      </svg>
      <div className="area-tip">
        {hover != null
          ? <><b>{fmt(data[hover].date)}</b> &nbsp; +₹{data[hover].amount.toLocaleString('en-IN')} &nbsp;·&nbsp; total ₹{data[hover].cumulative.toLocaleString('en-IN')}</>
          : <>Confirmed in this window (mandatory and optional): <b>₹{max.toLocaleString('en-IN')}</b>. Hover to inspect a day.</>}
      </div>
    </div>
  );
};

// ---- Heatmap: collection % per branch x batch
const heat = (rate) => `hsl(${Math.round((Math.max(0, Math.min(100, rate)) / 100) * 125)} 70% ${rate > 50 ? 38 : 40}%)`;
export const Heatmap = ({ classes, branches, batches, onPick, active }) => {
  const get = (b, y) => classes.find((c) => c.branch === b && String(c.batch) === String(y));
  return (
    <div className="heat" style={{ gridTemplateColumns: `88px repeat(${batches.length}, 1fr)` }}>
      <span />
      {batches.map((y) => <span key={y} className="heat-h">{y}</span>)}
      {branches.map((b) => (
        <React.Fragment key={b}>
          <span className="heat-h left">{b}</span>
          {batches.map((y) => {
            const c = get(b, y);
            if (!c) return <span key={y} className="heat-cell empty">-</span>;
            const on = active && active.branch === b && String(active.batch) === String(y);
            return (
              <button key={y} type="button" className={`heat-cell${on ? ' on' : ''}`} style={{ background: heat(c.rate) }} onClick={() => onPick && onPick(b, y)}
                title={`${c.key}: ${c.rate}% collected, ${c.paid}/${c.students} paid in full, ${c.unpaid} not paid`}>
                <strong>{Math.round(c.rate)}%</strong><span>{c.paid}/{c.students}</span>
              </button>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
};

// ---- Tiny horizontal progress bar
export const Meter = ({ value, color = '#22C55E' }) => (
  <div className="meter"><span style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} /></div>
);
