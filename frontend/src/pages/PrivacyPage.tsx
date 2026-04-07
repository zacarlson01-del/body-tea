import React from 'react';
import { Link } from 'react-router-dom';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mt-1">Effective: April 7, 2026</p>

        <div className="mt-6 space-y-4 text-sm text-gray-700 leading-6">
          <p>
            This Privacy Policy explains how this demo site collects and uses account and usage data.
          </p>
          <p>
            1. Data Collected: Account details, profile metadata, and security logs.
          </p>
          <p>
            2. Use of Data: Operate the demo service, improve security, prevent abuse, and support troubleshooting.
          </p>
          <p>
            3. Data Sharing: Shared only with service providers required to run the platform, or if required by law.
          </p>
          <p>
            4. Security: Reasonable safeguards are used, but no system is guaranteed 100% secure.
          </p>
          <p>
            5. Contact: privacy@isea-secure.com
          </p>
        </div>

        <Link to="/signin" className="inline-block mt-6 text-sm text-purple-700 hover:underline">
          Back to Sign In
        </Link>
      </div>
    </div>
  );
};

