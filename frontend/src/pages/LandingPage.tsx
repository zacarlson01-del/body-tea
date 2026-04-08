import React from 'react';
import { Link } from 'react-router-dom';
import { MarketingShell } from '../components/MarketingShell';
import './LandingPage.css';

const membershipCards = [
  {
    image: '/landing-images/membership1.jpg',
    alt: 'General Member Benefits',
    title: 'General Membership',
    body1:
      'Members gain access to professional benefits that support credibility, protection, and development, including liability coverage, education resources, and partner discounts.',
    body2:
      'Certified members receive expanded advantages with flexible payment options, broader education access, and enhanced discount programs.',
  },
  {
    image: '/landing-images/membership2.jpg',
    alt: 'Student Membership',
    title: 'Student Membership',
    body1:
      'Student members receive benefits for learning and early professional development, including liability coverage, educational resources, and partner benefits.',
    body2:
      'Certified student members get expanded support with flexible payments and additional learning opportunities.',
  },
  {
    image: '/landing-images/membership3.jpg',
    alt: 'Body Practitioner Membership',
    title: 'Body Practitioner Membership',
    body1:
      'Body practitioners get benefits designed for long-term professional practice, client trust, and accountability.',
    body2:
      'Certified body practitioner members receive additional education and discount opportunities for stronger professional positioning.',
  },
  {
    image: '/landing-images/membership4.jpg',
    alt: 'Professional Membership',
    title: 'Professional Membership',
    body1:
      'Professional members receive comprehensive support for operational confidence, ethics, and growth.',
    body2:
      'Certified professional members are eligible for enhanced value, including expanded resources and additional partner benefits.',
  },
];

export const LandingPage: React.FC = () => {
  return (
    <MarketingShell>
      <section id="home" className="landing-hero">
          <div className="landing-hero-container">
            <div className="landing-hero-text">
              <h1>Simons William John</h1>
              <h3>Board Member | Escrow Chapter Oversight &amp; Professional Standards</h3>
              <p>
                Bridging professional healthcare and ethical governance, Simons leads with integrity and experience in
                massage therapy oversight and industry development.
              </p>
              <Link className="landing-cta" to="/about">Meet Simons</Link>
            </div>
            <div className="landing-hero-image">
              <img alt="Simons William John in Suit" src="/landing-images/suit.jpg" />
            </div>
          </div>
      </section>

      <section
        className="landing-hero-banner"
        aria-label="ISEA featured banner"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.55)), url('/landing-images/isea-hero.jpg')",
        }}
      />

      <section id="about" className="landing-join">
        <h2>Join the Nation&apos;s Leading Massage and Bodywork Community</h2>
        <p>
          Massage therapists, body practitioners, students, and educators are supported through ISEA&apos;s structured
          network of professional oversight, resources, and member protection.
        </p>
        <p>
          Discover why members expect higher standards and receive greater value through transparent systems and
          dedicated professional support.
        </p>

        <div className="landing-join-actions">
          <Link className="landing-main-btn" to="/signup">Join ISEA Today</Link>
          <Link className="landing-main-btn secondary" to="/signin">Sign In to Your Account</Link>
        </div>
      </section>

      <section id="membership" className="landing-membership">
        <h2>Membership Tiers &amp; Benefits</h2>
        {membershipCards.map((card) => (
          <article key={card.title} className="landing-membership-box">
            <img alt={card.alt} src={card.image} />
            <div className="landing-membership-text">
              <h4>{card.title}</h4>
              <p>{card.body1}</p>
              <p>{card.body2}</p>
            </div>
          </article>
        ))}
      </section>
    </MarketingShell>
  );
};
