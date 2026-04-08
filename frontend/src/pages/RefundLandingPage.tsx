import React from 'react';
import { MarketingShell } from '../components/MarketingShell';
import './LandingPage.css';

export const RefundLandingPage: React.FC = () => {
  return (
    <MarketingShell>
      <section className="marketing-section">
        <div className="content-wrap legal-copy">
          <h2 className="page-title">Refund Policy</h2>

          <h3>Refund Eligibility</h3>
          <p>
            Refund requests may be considered under clearly defined circumstances to ensure fairness, accountability,
            and protection for all parties.
          </p>
          <ul>
            <li>Provider fails to appear for a scheduled appointment without prior notice.</li>
            <li>Provider cancels a confirmed appointment with at least 24 hours&apos; notice causing service disruption.</li>
            <li>Service delivered materially deviates from agreed terms (scope, duration, or nature of service).</li>
            <li>Documented evidence shows unprofessional or unethical conduct inconsistent with standards.</li>
          </ul>
          <p>All requests are subject to review and verification under ISEA protocols.</p>

          <hr />

          <h3>Request for Refund</h3>
          <ul>
            <li>Sign in to your ISEA account and open the escrow dashboard.</li>
            <li>Select the relevant transaction and choose the refund request option.</li>
            <li>Provide clear details and upload supporting evidence.</li>
            <li>Verify the information before final submission.</li>
          </ul>
          <p>Incomplete requests may result in delays or denial.</p>

          <hr />

          <h3>Review Process</h3>
          <ul>
            <li>Submitted details and evidence are examined for accuracy and legitimacy.</li>
            <li>Additional clarification may be requested from either party.</li>
            <li>Each case is reviewed on its own merits against escrow and compliance standards.</li>
            <li>Reviews are completed promptly once required information is available.</li>
          </ul>

          <hr />

          <h3>Outcome of Resolution</h3>
          <ul>
            <li>If approved, escrowed funds are returned according to ISEA procedures.</li>
            <li>A formal confirmation is sent once processing is completed.</li>
            <li>If denied, the customer receives the decision and a brief explanation.</li>
          </ul>
        </div>
      </section>
    </MarketingShell>
  );
};
