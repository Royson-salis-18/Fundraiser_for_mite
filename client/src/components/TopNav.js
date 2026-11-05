import React from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const TopNav = ({ logoSrc, title, subtitle, titleTo, links = [], onLogout, extraRight }) => {
  const brand = (
    <div className="brand">
      {logoSrc && <img src={logoSrc} alt="MITE logo" className="brand-logo" />}
      <div className="brand-text">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <header className="header">
      {titleTo ? <Link to={titleTo} className="brand-link">{brand}</Link> : brand}
      <nav className="nav">
        {links.map((link) => (
          <Link key={link.to} to={link.to} className="nav-link">{link.label}</Link>
        ))}
        {extraRight}
        <ThemeToggle />
        {onLogout && <button className="btn btn-ghost" onClick={onLogout}>Logout</button>}
      </nav>
    </header>
  );
};

export default TopNav;
