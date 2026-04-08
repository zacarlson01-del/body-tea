import React, { useState } from 'react';
import { MarketingShell } from '../components/MarketingShell';
import './LandingPage.css';

const reviews = [
  { title: 'Trusted and Confidential', stars: '★★★★★', text: 'The process was structured, secure, and handled with complete discretion from start to finish.', name: 'John' },
  { title: 'Reliable and Professional', stars: '★★★★★', text: 'Communication remained clear throughout the process, and outcomes aligned with what was described.', name: 'Jesse' },
  { title: 'Strong Professional Oversight', stars: '★★★★☆', text: 'Expectations were managed clearly and the review process felt organized and secure.', name: 'Daniel' },
  { title: 'Secure and Well Managed', stars: '★★★★★', text: 'The experience was smooth and confidential, with consistent support during each stage.', name: 'Brandon' },
  { title: 'Complete Transparency', stars: '★★★☆☆', text: 'The process prioritized accountability and clear communication from submission to resolution.', name: 'Scott' },
  { title: 'Refund Successfully Completed', stars: '★★★★☆', text: 'The process worked as stated and the final outcome was handled properly and professionally.', name: 'Jake' },
  { title: 'Confidence and Reassurance', stars: '★★★★☆', text: 'Regular updates and clear timelines improved confidence and reduced uncertainty.', name: 'James' },
  { title: 'Satisfied Member', stars: '★★★☆☆', text: 'The service process was legitimate and maintained confidentiality throughout.', name: 'Nicole' },
];

export const TestimonialsLandingPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    e.currentTarget.reset();
  };

  return (
    <MarketingShell>
      <section className="marketing-section">
        <div className="content-wrap">
          <h2 className="page-title">Share Your Experience</h2>
          <p className="page-intro">
            Your feedback helps strengthen transparency, accountability, and trust within our escrow system.
          </p>

          <form className="card-form light" onSubmit={onSubmit}>
            <label htmlFor="rating">Overall Rating</label>
            <input id="rating" type="text" placeholder="e.g. 5 Stars" required />

            <label htmlFor="title">Review Title</label>
            <input id="title" type="text" placeholder="e.g. Professional and Secure" required />

            <label htmlFor="experience">Your Experience</label>
            <textarea id="experience" rows={4} placeholder="Describe your interaction with our escrow process..." required />

            <label htmlFor="reviewer">Your Name</label>
            <input id="reviewer" type="text" placeholder="e.g. James" required />

            <p className="form-note">
              By submitting this review, you confirm that the information reflects your personal experience and honest opinion.
            </p>
            {submitted && <p className="form-success">Thank you. Your review has been received successfully.</p>}
            <button type="submit" className="gold-btn">Submit Review</button>
          </form>

          <hr className="section-divider" />
          <h2 className="page-title compact">What Our Clients Say</h2>

          <div className="review-wrapper">
            {reviews.map((review, idx) => (
              <article key={`${review.name}-${idx}`} className="review-card">
                <div className="review-title">{review.title}</div>
                <div className="review-stars">{review.stars}</div>
                <p>{review.text}</p>
                <div className="review-name">{review.name}</div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
};
