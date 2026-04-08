import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

interface MarketingShellProps {
  children: React.ReactNode;
}

export const MarketingShell: React.FC<MarketingShellProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="landing-root">
      <header className="landing-header">
        <nav className="landing-nav">
          <NavLink to="/" className="landing-logo-wrap" onClick={() => setMobileOpen(false)}>
            <img alt="ISEA Logo" className="landing-logo" src="/landing-images/logo.jpg" />
          </NavLink>

          <button
            type="button"
            className="landing-menu-btn"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-controls="landing-nav-list"
            aria-label="Toggle navigation menu"
          >
            ☰
          </button>

          <ul id="landing-nav-list" className={`landing-nav-list ${mobileOpen ? 'open' : ''}`}>
            <li>
              <NavLink to="/" end onClick={() => setMobileOpen(false)}>Home</NavLink>
            </li>
            <li>
              <NavLink to="/about" onClick={() => setMobileOpen(false)}>About Us</NavLink>
            </li>
            <li>
              <NavLink to="/refund" onClick={() => setMobileOpen(false)}>Refund Policy</NavLink>
            </li>
            <li>
              <NavLink to="/testimonials" onClick={() => setMobileOpen(false)}>Testimonials</NavLink>
            </li>
            <li>
              <NavLink to="/contact" onClick={() => setMobileOpen(false)}>Contact Us</NavLink>
            </li>
          </ul>
        </nav>
      </header>

      <main className="marketing-main">
        {children}
      </main>

      <footer className="landing-footer">
        <p>Contact: support@isea-secure.com</p>
        <p>© 2026 ISEA. All rights reserved.</p>
      </footer>
    </div>
  );
};
