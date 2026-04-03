import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export const DashboardPage: React.FC = () => {
  const { user, escrowAccount, isLoading, getCurrentUser, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    getCurrentUser();
  }, [getCurrentUser]);

  const handleLogout = async () => {
    await logout();
    navigate('/signin');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-purple-400" />
      </div>
    );
  }

  const accountId = escrowAccount?.account_id ?? '—';
  const status = escrowAccount?.account_status ?? 'pending';
  const depositAmount = escrowAccount?.escrow_deposit_amount ?? 0;

  return (
    <div className="flex min-h-screen" style={{ background: 'linear-gradient(135deg, #0d1b2a 0%, #0d2137 40%, #0a2e38 100%)' }}>

      {/* ── Sidebar (hidden on mobile, visible on md+) ───────────────────────────────────────────── */}
      <aside className="hidden md:flex w-56 flex-shrink-0 flex-col py-6 px-4"
        style={{ background: 'rgba(10,20,35,0.7)', borderRight: '1px solid rgba(255,255,255,0.07)' }}>

        {/* Logo */}
        <div className="mb-10">
          <img src="/logo.png" alt="ISEA"
            className="h-14 w-auto object-contain"
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              e.currentTarget.style.display = 'none';
            }} />
          {/* Fallback brand */}
          <div className="flex items-center gap-2 mt-1">
            <div className="w-9 h-9 rounded-full border border-purple-400 flex items-center justify-center">
              <span className="text-purple-300 font-bold text-xs">ISEA</span>
            </div>
            <div className="leading-none">
              <p className="text-purple-200 text-xs font-semibold">International</p>
              <p className="text-purple-200 text-xs font-semibold">Secure Escrow Account</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-2">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-600/80 cursor-pointer">
            <span className="w-2 h-2 rounded-full bg-blue-300" />
            <span className="text-white text-sm font-medium">Dashboard</span>
          </div>
        </nav>

        {/* Logout */}
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-sm mt-4">
          <span className="w-2 h-2 rounded-full bg-gray-500" />
          Log out
        </button>
      </aside>

      {/* ── Main content ─────────────────────────────────────── */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">

        {/* Header row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
              Welcome, {user?.first_name ?? ''}
            </h1>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {['ISEA Member Portal', 'Secure', 'Confidential', 'Compliant'].map(tag => (
                <span key={tag}
                  className="px-3 py-1 rounded-full text-xs font-medium border border-white/20 text-gray-300">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <button className="px-4 py-2 rounded-full text-sm font-medium text-white border border-white/20 hover:bg-white/10 transition-colors">
            Download Statement
          </button>
        </div>

        {/* ── Card grid ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 mt-6">

          {/* Account Overview — spans 2 cols */}
          <div className="lg:col-span-2 rounded-2xl p-6"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>

            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Account Overview</span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 uppercase">
                {status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: 'Account Type', value: 'Membership • Individual' },
                { label: 'Account ID', value: accountId },
                { label: 'Currency', value: 'USD' },
                { label: 'Region', value: 'International' },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl p-4"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <p className="text-sm font-semibold text-white font-mono">{value}</p>
                </div>
              ))}
            </div>

            {/* Balance row */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2">
                  Available Balance
                </p>
                <p className="text-2xl font-bold text-white">
                  ${depositAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              {/* Chart placeholder */}
              <div className="w-32 h-20 rounded-lg border-2 border-blue-500/50"
                style={{ background: 'rgba(59,130,246,0.05)' }} />
            </div>

            <div className="mt-4">
              <span className="px-6 py-2 rounded-full text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(90deg,#6d28d9,#2563eb)' }}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </div>
          </div>

          {/* Verification Progress */}
          <div className="rounded-2xl p-6"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>

            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Verification</span>
              <span className="text-xs text-gray-400">Progress</span>
            </div>

            <div className="space-y-3">
              <div className="px-4 py-2 rounded-full border border-green-500/40 bg-green-500/10 text-green-300 text-sm font-medium text-center">
                Identity Submitted
              </div>
              <div className="px-4 py-2 rounded-full border border-yellow-500/40 bg-yellow-500/10 text-yellow-300 text-sm font-medium text-center">
                Compliance Review
              </div>
              <div className="px-4 py-2 rounded-full border border-gray-600 bg-transparent text-gray-400 text-sm font-medium text-center">
                Activation
              </div>
            </div>

            <p className="text-gray-400 text-sm mt-5 leading-relaxed">
              Your verification is being reviewed.
            </p>
          </div>

          {/* Security & Compliance */}
          <div className="lg:col-span-1 rounded-2xl p-6"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>

            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Security & Compliance</span>
              <span className="text-xs text-gray-400">Protection</span>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Encryption', value: 'Active', color: 'text-white' },
                { label: 'Compliance', value: 'Under Review', color: 'text-white' },
                { label: 'Two-Factor Auth', value: 'Enabled', color: 'text-white' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="text-gray-400 text-sm">{label}</span>
                  <span className={`text-sm font-bold ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction History */}
          <div className="lg:col-span-2 rounded-2xl p-6"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>

            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Transaction History</span>
              <span className="text-xs text-gray-400">Latest</span>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-5 gap-2 text-xs font-semibold text-gray-500 uppercase mb-3 px-2">
              {['Date', 'Reference', 'Description', 'Amount', 'Status'].map(h => (
                <span key={h}>{h}</span>
              ))}
            </div>

            <div className="rounded-xl border border-dashed border-white/10 flex items-center justify-center py-8">
              <p className="text-gray-500 text-sm">No transactions available</p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};
