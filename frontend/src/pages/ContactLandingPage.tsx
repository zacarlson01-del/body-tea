import React, { useState } from 'react';
import { MarketingShell } from '../components/MarketingShell';
import './LandingPage.css';

export const ContactLandingPage: React.FC = () => {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSent(true);
    e.currentTarget.reset();
  };

  return (
    <MarketingShell>
      <section className="marketing-section">
        <div className="content-wrap">
          <h2 className="page-title">Contact Us</h2>
          <p className="page-intro">
            Have questions or need assistance? Fill out the form below and our team will respond promptly.
          </p>

          <form className="card-form" onSubmit={handleSubmit}>
            <label htmlFor="name">Full Name</label>
            <input id="name" type="text" placeholder="Your Name" required />

            <label htmlFor="email">Email Address</label>
            <input id="email" type="email" placeholder="your@email.com" required />

            <label htmlFor="subject">Subject</label>
            <input id="subject" type="text" placeholder="What's this about?" required />

            <label htmlFor="message">Message</label>
            <textarea id="message" rows={5} placeholder="Your message here..." required />

            {sent && <p className="form-success">Message received. Our team will follow up shortly.</p>}

            <button type="submit" className="gold-btn">Send Message</button>
          </form>

          <div className="info-grid">
            <article className="info-card">
              <h3>Email</h3>
              <p>simonsjohnwilliam@gmail.com</p>
            </article>
            <article className="info-card">
              <h3>Phone</h3>
              <p>+1 907 405 2260</p>
            </article>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
};
