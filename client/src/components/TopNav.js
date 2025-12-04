import React from 'react';
import { Link } from 'react-router-dom';

const TopNav = ({ logoSrc, title, subtitle, titleTo, links = [], onLogout, extraRight }) => {
  const titleContent = <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{title}</h1>;

  return (
    <header className="header">
      {titleTo ? (
        <Link to={titleTo} style={{ color: 'inherit', textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px',}}>
            {logoSrc && (
              <img src={logoSrc} alt="Logo" style={{ width: '100px', height: 'auto', borderRadius: '8px' }} />
            )}
            <div>
              {titleContent}
              {subtitle && <p style={{ margin: 0 }}>{subtitle}</p>}
            </div>
          </div>
        </Link>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {logoSrc && (
            <img src={logoSrc} alt="Logo" style={{ width: '100px', height: 'auto', borderRadius: '8px' }} />
          )}
          <div>
            {titleContent}
            {subtitle && <p style={{ margin: 0 }}>{subtitle}</p>}
          </div>
        </div>
      )}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {links.map((link) => (
          <Link key={link.to} to={link.to} className="btn btn-outline">
            {link.label}
          </Link>
        ))}
        {extraRight}
        {onLogout && (
          <button className="btn btn-outline" onClick={onLogout}>Logout</button>
        )}
      </nav>
    </header>
  );
};

export default TopNav;
