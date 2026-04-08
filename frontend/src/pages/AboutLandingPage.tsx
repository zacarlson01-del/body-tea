import React from 'react';
import { MarketingShell } from '../components/MarketingShell';
import './LandingPage.css';

export const AboutLandingPage: React.FC = () => {
  return (
    <MarketingShell>
      <section className="marketing-section about-us-section">
        <div className="about-header">
          <img src="/landing-images/logo.jpg" alt="Escrow Chapter Logo" className="about-logo" />
          <h2>About Us</h2>
        </div>

        <h3>Escrow Chapter Oversight and Professional Standards</h3>
        <p>
          The Escrow Chapter operates as a structured oversight body dedicated to maintaining professional accountability,
          ethical compliance, and operational integrity. It was established to respond to practitioner verification,
          liability exposure, and trust concerns between providers and clients.
        </p>
        <p>
          Originally developed to address malpractice coverage and practitioner credibility challenges, the program
          expanded from regional scope into a broader national framework focused on long-term professional stability.
        </p>
        <p>
          The standards framework is supported by experienced insurance and compliance partners, with emphasis on
          claims guidance, legal support, and practitioner protection.
        </p>

        <h4>Core Values</h4>
        <ul>
          <li>Trustworthiness</li>
          <li>High integrity</li>
          <li>Commitment to professional excellence</li>
          <li>National and global operational reach</li>
        </ul>

        <h4>Objective</h4>
        <p>
          The objective is to establish a secure and transparent environment where professionals and clients can engage
          with confidence through structured verification, accountability controls, and clear standards.
        </p>

        <h4>Purpose</h4>
        <p>
          The Escrow Chapter exists to uphold professional standards, protect ethical practice, and reinforce public
          trust through consistent oversight and credential verification.
        </p>

        <h4>Benefits</h4>
        <ul>
          <li>Professionalism</li>
          <li>Integrity</li>
          <li>Privacy</li>
        </ul>
      </section>
    </MarketingShell>
  );
};
