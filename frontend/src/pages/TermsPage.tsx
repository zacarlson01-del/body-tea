import React from 'react';
import { Link } from 'react-router-dom';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900">Terms of Service</h1>
        <p className="text-sm text-gray-500 mt-1">Effective: April 7, 2026</p>

        <div className="mt-6 space-y-4 text-sm text-gray-700 leading-6">
          <p>
            These Terms govern access to this demo application. This website is a demonstration environment and is not
            a licensed financial institution or custodial service.
          </p>
          <p>
            1. Eligibility: You must be legally permitted to use this site in your jurisdiction.
          </p>
          <p>
            2. Account Security: You are responsible for protecting your credentials and activity on your account.
          </p>
          <p>
            3. Service Scope: Features may simulate onboarding and transaction workflows for demonstration and testing.
          </p>
          <p>
            4. Prohibited Use: Fraud, abuse, unauthorized access attempts, and unlawful activity are prohibited.
          </p>
          <p>
            5. Contact: support@isea-secure.com
          </p>
        </div>

        <Link to="/signin" className="inline-block mt-6 text-sm text-purple-700 hover:underline">
          Back to Sign In
        </Link>
      </div>
    </div>
  );
};

