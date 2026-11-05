import React from 'react';
import Icon from './Icon';
import { CountUp } from './flair';

const STATUS = {
  pending:   { label: 'Awaiting review', cls: 'badge-warn' },
  confirmed: { label: 'Confirmed', cls: 'badge-ok' },
  rejected:  { label: 'Rejected', cls: 'badge-bad' },
  due:       { label: 'Payment due', cls: 'badge-info' },
  cart:      { label: 'In cart', cls: 'badge-muted' },
};

export const StatusBadge = ({ status }) => {
  const s = STATUS[status] || STATUS.due;
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
};

export const StatCard = ({ icon, label, value, hint, tone = 'navy' }) => (
  <div className={`card stat stat-${tone}`}>
    <div className="stat-icon" aria-hidden="true"><Icon name={icon} /></div>
    <div className="stat-body">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{typeof value === 'number' ? <CountUp value={value} /> : value}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  </div>
);

export const EmptyState = ({ icon = 'inbox', title, children, action }) => (
  <div className="empty">
    <div className="empty-icon" aria-hidden="true"><Icon name={icon} size={36} /></div>
    <h3>{title}</h3>
    {children && <p>{children}</p>}
    {action}
  </div>
);

export const Skeleton = ({ height = 120, count = 1 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => <div key={i} className="skeleton" style={{ height }} />)}
  </>
);

export const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export function downloadCSV(filename, rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = rows.map((r) => r.map(esc).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function printReceipt({ receiptNo, studentName, usn, eventTitle, baseAmount, feeAmount, feePercent, totalAmount, utr, confirmedAt }) {
  const w = window.open('', '_blank', 'width=720,height=900');
  if (!w) return false;
  const e = (v) => String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  w.document.write(`<!doctype html><title>Receipt ${e(receiptNo)}</title>
  <style>body{font-family:Inter,system-ui,sans-serif;max-width:560px;margin:40px auto;color:#0F172A}
  h1{color:#12306B;margin:0}.bar{height:4px;background:#EF7100;margin:12px 0 24px}
  table{width:100%;border-collapse:collapse}td{padding:8px 0;border-bottom:1px solid #E2E8F0}td:last-child{text-align:right}
  .tot td{font-weight:700;font-size:18px;border-bottom:0}.muted{color:#64748B;font-size:13px}</style>
  <h1>Payment Receipt</h1><div class="muted">Mangalore Institute of Technology &amp; Engineering</div><div class="bar"></div>
  <p><b>Receipt No:</b> ${e(receiptNo)}<br><b>Date:</b> ${e(new Date(confirmedAt).toLocaleString('en-IN'))}<br>
  <b>Student:</b> ${e(studentName)} (${e(usn)})<br><b>UTR:</b> ${e(utr || '—')}</p>
  <table><tr><td>${e(eventTitle)}</td><td>${e(money(baseAmount))}</td></tr>
  <tr><td>Platform service fee (${e(feePercent)}%)</td><td>${e(money(feeAmount))}</td></tr>
  <tr class="tot"><td>Total paid</td><td>${e(money(totalAmount))}</td></tr></table>
  <p class="muted">This is a computer-generated receipt confirmed by the fest administrator.</p>
  <script>window.onload=()=>window.print()</script>`);
  w.document.close();
  return true;
}
