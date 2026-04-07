import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/apiClient';

export const DashboardPage: React.FC = () => {
  const { user, escrowAccount, transactions, isLoading, getCurrentUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'security' | 'transactions' | 'support'>('dashboard');
  const [pendingHourglass, setPendingHourglass] = useState<'⏳' | '⌛'>('⏳');
  const [supportMessage, setSupportMessage] = useState('');
  const [isSupportSubmitting, setIsSupportSubmitting] = useState(false);
  const [supportStatus, setSupportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [supportError, setSupportError] = useState('');

  useEffect(() => {
    getCurrentUser();
  }, [getCurrentUser]);

  const handleLogout = async () => {
    await logout();
    navigate('/signin');
  };

  // ──────────────────────────────────────────────────────────────────────
  // ─ SECTION 1: HELPER CONSTANTS & DERIVATIONS ─────────────────────────
  // ──────────────────────────────────────────────────────────────────────

  // Account status mapping
  const STATUS_LABEL_MAP: Record<string, { label: string; icon: string }> = {
    pending: { label: 'Pending', icon: '⏳' },
    active: { label: 'Account Active', icon: '✓' },
    completed: { label: 'Completed', icon: '✓' },
  };

  const accountId = escrowAccount?.account_id ?? '—';
  const status = escrowAccount?.account_status ?? 'pending';
  const statusInfo = STATUS_LABEL_MAP[status] ?? { label: status, icon: '●' };
  const latestTransaction = transactions.length > 0 ? transactions[0] : null;

  const rawDepositAmount = escrowAccount?.escrow_deposit_amount;
  const depositAmount = typeof rawDepositAmount === 'number'
    ? rawDepositAmount
    : Number(rawDepositAmount || 0);
  const rawNxtAmount = latestTransaction?.nxt_amount;
  const nxtAmount = typeof rawNxtAmount === 'number'
    ? rawNxtAmount
    : Number(rawNxtAmount || 0);
  const releaseAmountLabel = `$${nxtAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const releaseConditionDisplay = `${releaseAmountLabel} - Compliance`;

  useEffect(() => {
    if (status !== 'pending') {
      setPendingHourglass('⏳');
      return;
    }
    const timer = window.setInterval(() => {
      setPendingHourglass(prev => (prev === '⏳' ? '⌛' : '⏳'));
    }, 800);
    return () => window.clearInterval(timer);
  }, [status]);

  // Verification step derivation
  type VerificationStep = 1 | 2 | 3;

  const STEP_FROM_STATUS: Record<string, VerificationStep> = {
    pending: 2,
    active: 3,
    completed: 3,
  };

  const currentStep: VerificationStep = STEP_FROM_STATUS[status] ?? 1;

  const STEP_LABELS: [string, string, string] = [
    'Identity Submitted',
    'Compliance Review',
    'Activation',
  ];

  const STEP_STATUS_LINE: Record<string, string> = {
    pending: 'Your identity documents have been received and are under compliance review.',
    active: 'Verification complete. Your escrow account is active.',
    completed: 'All verification stages have been completed.',
  };

  const stepStatusLine = STEP_STATUS_LINE[status] ?? 'Verification is in progress.';
  const estimatedCompletion = status === 'pending' ? 'Est. completion: 3–5 business days' : null;
  const statusUpdatedAt = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const primaryAction = status === 'pending'
    ? {
        title: 'Complete Verification',
        description: 'Your account is under compliance review. Check your submitted details and contact support if you need to update anything.',
        cta: 'Review Profile Details',
        onClick: () => setIsProfileOpen(true),
      }
    : {
        title: 'Account Is Active',
        description: 'Your verification is complete. You can now monitor account activity in this demo environment.',
        cta: 'View Account Activity',
        onClick: () => setActiveTab('transactions'),
      };

  const fullName = [user?.first_name, user?.last_name]
    .filter((s): s is string => typeof s === 'string' && s.length > 0)
    .join(' ') || 'Member';
  const supportName = fullName !== 'Member' ? fullName : 'Account Holder';
  const supportEmail = user?.email?.trim() || '';
  const avatarUrl = user?.profile_picture_url?.trim() || null;
  const initials = [user?.first_name, user?.last_name]
    .filter((s): s is string => typeof s === 'string' && s.length > 0)
    .map(s => s[0].toUpperCase())
    .join('') || '?';

  const detailPairs = [
    { label: 'Email', value: user?.email || '—' },
    { label: 'Phone', value: user?.phone || '—' },
    { label: 'Gender', value: user?.gender || '—' },
    { label: 'Date of Birth', value: user?.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString('en-US') : '—' },
    { label: 'Affiliated Authorities', value: user?.affiliated_authorities || '—' },
    { label: 'Postal Code', value: user?.postal_code || '—' },
    { label: 'Duration (Days)', value: escrowAccount?.duration_days != null ? String(escrowAccount.duration_days) : '—' },
    { label: 'Personal Item', value: escrowAccount?.personal_item || '—' },
  ];

  const handleSupportSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSupportStatus('idle');
    setSupportError('');

    try {
      setIsSupportSubmitting(true);
      await authService.createSupportMessage({
        name: supportName,
        email: supportEmail,
        message: supportMessage,
      });
      setSupportStatus('success');
      setSupportMessage('');
    } catch (error) {
      setSupportStatus('error');
      setSupportError(error instanceof Error ? error.message : 'Failed to submit support request');
    } finally {
      setIsSupportSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-purple-400" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'linear-gradient(135deg, #0d1b2a 0%, #0d2137 40%, #0a2e38 100%)' }}>

      {/* ─ SKIP LINK ─ */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-700 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>

      {/* ── Sidebar (hidden on mobile, visible on md+) ───────────────────────────────────────────── */}
      <aside
        className="hidden md:flex w-56 flex-shrink-0 flex-col py-6 px-4"
        style={{ background: 'rgba(10,20,35,0.7)', borderRight: '1px solid rgba(255,255,255,0.07)' }}
      >

        {/* Logo */}
        <div className="mb-10">
          <img
            src="/logo.png"
            alt="ISEA: International Secure Escrow Account - Logo"
            className="h-14 w-auto object-contain"
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              e.currentTarget.style.display = 'none';
            }}
          />
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

        {/* User Identity Block */}
        <button
          type="button"
          onClick={() => setIsProfileOpen(true)}
          aria-label="Open profile details"
          className="w-full flex items-center gap-3 mb-8 px-2 py-2 rounded-lg border border-white/10 hover:bg-white/10 transition-colors text-left"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${fullName} avatar`}
              className="w-10 h-10 rounded-full object-cover border border-white/20 flex-shrink-0"
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-purple-700/60 border border-purple-400/40 flex items-center justify-center font-semibold text-purple-100 text-sm flex-shrink-0">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{fullName}</p>
          </div>
        </button>

        {/* Nav */}
        <nav className="flex-1 space-y-2">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            aria-current={activeTab === 'dashboard' ? 'page' : undefined}
            className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-blue-600/80 border-blue-400/40 text-white'
                : 'border-white/10 text-gray-300 hover:bg-white/10'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-300" />
            <span className="text-white text-sm font-medium">Dashboard</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            aria-current={activeTab === 'security' ? 'page' : undefined}
            className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors ${
              activeTab === 'security'
                ? 'bg-yellow-700/40 border-yellow-400/40 text-white'
                : 'border-white/10 text-gray-300 hover:bg-white/10'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-yellow-300/80" />
            <span className="text-sm font-medium">Security &amp; Compliance</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            aria-current={activeTab === 'transactions' ? 'page' : undefined}
            className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors ${
              activeTab === 'transactions'
                ? 'bg-cyan-700/50 border-cyan-400/40 text-white'
                : 'border-white/10 text-gray-300 hover:bg-white/10'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-300/80" />
            <span className="text-sm font-medium">Transactions</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('support')}
            aria-current={activeTab === 'support' ? 'page' : undefined}
            className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors ${
              activeTab === 'support'
                ? 'bg-emerald-700/50 border-emerald-400/40 text-white'
                : 'border-white/10 text-gray-300 hover:bg-white/10'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-300/80" />
            <span className="text-sm font-medium">Support</span>
          </button>
        </nav>

      </aside>

      {/* ── Main content ─────────────────────────────────────── */}
      <main id="main-content" className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto pb-20 md:pb-0">

        {/* Header row */}
        <div className="mb-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                Welcome, {user?.first_name || 'Member'}
              </h1>
            </div>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {['ISEA Member Portal', 'Secure', 'Confidential', 'Compliant', 'Demo Environment'].map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-xs font-medium border border-white/20 text-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <>
            {/* Primary Action */}
            <section
              className="rounded-2xl p-5 sm:p-6 mb-5 border border-blue-400/25"
              style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.18), rgba(109,40,217,0.12))' }}
            >
              <p className="text-xs font-semibold tracking-widest text-blue-200 uppercase mb-2">Recommended Next Step</p>
              <h2 className="text-xl sm:text-2xl font-semibold text-white">{primaryAction.title}</h2>
              <p className="text-sm text-blue-100/90 mt-2 max-w-3xl">{primaryAction.description}</p>
              <button
                onClick={primaryAction.onClick}
                className="mt-4 px-4 py-2.5 rounded-lg text-sm font-semibold text-white border border-white/25 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 transition-colors"
              >
                {primaryAction.cta}
              </button>
            </section>

            {/* ── Card grid ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 mt-6">

          {/* Account Overview — spans 2 cols */}
          <div
            className="lg:col-span-3 rounded-2xl p-6"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >

            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-semibold tracking-widest text-gray-300 uppercase">Account Overview</span>
              <span
                role="status"
                aria-label={`Account status: ${statusInfo.label}`}
                className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${
                  status === 'pending'
                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30 animate-pulse'
                    : 'bg-green-500/20 text-green-300 border-green-500/30'
                }`}
              >
                <span aria-hidden="true">{status === 'pending' ? pendingHourglass : statusInfo.icon}</span>
                {statusInfo.label}
              </span>
            </div>

            {/* Available Balance — MOVED TO TOP */}
            <div className="mb-6">
              <p className="text-xs font-semibold tracking-widest text-gray-300 uppercase mb-1">
                Available Balance
              </p>
              <p className="text-xs text-gray-400 mb-3">
                Demo balance shown for verification workflow preview.
              </p>
              <div className="flex items-end">
                <p className="text-3xl font-bold text-white">
                  ${depositAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* 4-field grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: 'Account Type', value: 'Membership • Individual' },
                { label: 'Account ID', value: accountId },
                { label: 'Currency', value: 'USD' },
                { label: 'Region', value: 'International' },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded-xl p-4"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <p className="text-xs text-gray-300 mb-1">{label}</p>
                  <p className="text-sm font-semibold text-white font-mono">{value}</p>
                </div>
              ))}
            </div>

            {/* Release Condition from escrow_accounts table */}
            <div className="mt-4 rounded-xl border border-white/15 px-4 py-3 bg-white/5">
              <p className="text-sm text-white font-medium">
                {releaseConditionDisplay}
              </p>
            </div>

            {/* Status Gradient Pill */}
            <div className="mt-4">
              <span
                className="px-6 py-2 rounded-full text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(90deg,#6d28d9,#2563eb)' }}
              >
                {statusInfo.label}
              </span>
            </div>
          </div>

          {/* Verification Progress */}
          <div
            className="rounded-2xl p-6"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold tracking-widest text-gray-300 uppercase">
                Verification
              </span>
              <span
                role="progressbar"
                aria-valuenow={currentStep}
                aria-valuemin={1}
                aria-valuemax={3}
                aria-label="Verification progress"
                className="text-xs font-semibold text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full"
              >
                Step {currentStep} of 3
              </span>
            </div>

            <p className="text-xs text-gray-400 mb-2">{stepStatusLine}</p>
            <p className="text-xs text-blue-200/80 mb-5">Last updated: {statusUpdatedAt}</p>

            {/* Step Indicators */}
            <div
              role="list"
              aria-label="Verification stages"
              className="space-y-0 mb-4"
            >
              {STEP_LABELS.map((label, idx) => {
                const stepNum = (idx + 1) as VerificationStep;
                const isDone = currentStep > stepNum;
                const isCurrent = currentStep === stepNum;
                const isLast = idx === STEP_LABELS.length - 1;

                const symbol = isDone ? '✓' : isCurrent ? '⟳' : '○';

                const circleClass = isDone
                  ? 'bg-green-500/80 border-green-400 text-white'
                  : isCurrent
                    ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 animate-pulse'
                    : 'bg-transparent border-gray-600 text-gray-500';

                const labelClass = isDone
                  ? 'text-green-300 font-semibold'
                  : isCurrent
                    ? 'text-yellow-300 font-semibold'
                    : 'text-gray-500';

                return (
                  <div key={label} role="listitem" className="flex items-stretch gap-3">
                    {/* Left column: circle + connector */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${circleClass}`}
                        aria-hidden="true"
                      >
                        {symbol}
                      </div>
                      {!isLast && (
                        <div
                          className={`w-px flex-1 mt-1 mb-0 ${isDone ? 'bg-green-500/40' : 'bg-white/10'}`}
                          style={{ minHeight: '1.5rem' }}
                        />
                      )}
                    </div>
                    {/* Right column: label */}
                    <div className="pt-1 pb-4">
                      <span className={`text-sm ${labelClass}`}>{label}</span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {isDone ? 'Completed' : isCurrent ? 'In progress' : 'Pending'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Estimated Completion */}
            {estimatedCompletion && (
              <p className="text-xs text-blue-300/70 mt-1">
                {estimatedCompletion}
              </p>
            )}
          </div>

            </div>
          </>
        )}

        {activeTab === 'transactions' && (
          <section
            className="rounded-2xl p-4 sm:p-5 mt-5"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] sm:text-xs font-semibold tracking-widest text-gray-300 uppercase">Transaction History</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">Latest</span>
                </div>
              </div>

              <div className="sm:hidden grid grid-cols-4 gap-2 text-[10px] font-semibold text-gray-300 uppercase mb-2 px-2 tracking-[0.05em]">
                {['Date', 'Reference', 'Description', 'Amount'].map((h) => (
                  <span key={h} className={h === 'Amount' ? 'text-right pr-1' : ''}>
                    {h}
                  </span>
                ))}
              </div>

              <div className="hidden sm:block overflow-x-auto pb-1">
                <div className="min-w-[460px] grid grid-cols-[1fr_1fr_1.2fr_1fr] gap-3 text-[11px] font-semibold text-gray-300 uppercase mb-2 px-2 tracking-[0.06em]">
                  {['Date', 'Reference', 'Description', 'Amount'].map((h) => (
                    <span key={h} className={h === 'Amount' ? 'text-right pr-1.5' : ''}>
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-white/10 flex items-center justify-center py-4 overflow-x-auto">
                {transactions.length === 0 ? (
                  <div className="text-center px-4">
                    <p className="text-gray-300 text-sm font-medium">No transactions available yet</p>
                    <p className="text-gray-500 text-xs mt-1">Transactions will appear here after account activation and activity.</p>
                  </div>
                ) : (
                  <div className="w-full min-w-[460px] px-2 space-y-1.5">
                    {transactions.map((tx) => {
                      const amountNum = typeof tx.amount === 'number' ? tx.amount : Number(tx.amount || 0);
                      const formattedDateDesktop = tx.transaction_date
                        ? new Date(tx.transaction_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—';
                      const formattedDateMobile = tx.transaction_date
                        ? new Date(tx.transaction_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : '—';
                      return (
                        <React.Fragment key={`${tx.reference}-${tx.transaction_date}`}>
                          <div className="sm:hidden grid grid-cols-4 gap-2 text-[10px] text-gray-200 px-2 py-1.5 rounded-md border border-white/10 bg-white/5">
                            <span>{formattedDateMobile}</span>
                            <span className="truncate">{tx.reference}</span>
                            <span className="truncate">{tx.description}</span>
                            <span className="text-right pr-1">${amountNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="hidden sm:grid grid-cols-[1fr_1fr_1.2fr_1fr] gap-3 text-xs text-gray-200 px-2 py-1.5 rounded-md border border-white/10 bg-white/5">
                            <span>{formattedDateDesktop}</span>
                            <span className="truncate">{tx.reference}</span>
                            <span className="truncate pr-1">{tx.description}</span>
                            <span className="text-right pr-1.5">${amountNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'security' && (
          <section
            className="rounded-2xl p-6 mt-6"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-semibold tracking-widest text-gray-300 uppercase">
                Security &amp; Compliance
              </span>
              <span className="text-xs text-gray-400">Active</span>
            </div>

            <div className="space-y-3">
              {(
                [
                  { label: 'Encryption', value: 'Active', symbol: '✓', color: 'text-green-300', bg: 'bg-green-500/10 border-green-500/30' },
                  { label: 'Compliance', value: 'Under Review', symbol: '⟳', color: 'text-yellow-300', bg: 'bg-yellow-500/10 border-yellow-500/30' },
                  { label: 'Two-Factor Auth', value: 'Enabled', symbol: '✓', color: 'text-green-300', bg: 'bg-green-500/10 border-green-500/30' },
                ] as const
              ).map(({ label, value, symbol, color, bg }) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-lg px-3 py-2 border"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <span className="text-gray-300 text-sm">{label}</span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${bg} ${color}`}
                  >
                    <span aria-hidden="true">{symbol}</span>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'support' && (
          <section
            className="rounded-2xl p-6 mt-6"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-semibold tracking-widest text-gray-300 uppercase">
                Support
              </span>
              <span className="text-xs text-emerald-300">Online</span>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-white text-sm font-semibold">Need help with your escrow account?</p>
                <p className="text-gray-300 text-sm mt-1">
                  Our support team can help with account verification updates, deposit questions, release conditions, and dispute guidance.
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-gray-400 text-xs uppercase tracking-wide">Email</p>
                <p className="text-white text-sm mt-1">support@isea-secure.com</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-gray-400 text-xs uppercase tracking-wide">Phone</p>
                <p className="text-white text-sm mt-1">+1 (800) 555-0129</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-gray-400 text-xs uppercase tracking-wide">Hours</p>
                <p className="text-white text-sm mt-1">Monday-Friday, 9:00 AM-6:00 PM (PT)</p>
              </div>
            </div>

            <form onSubmit={handleSupportSubmit} className="mt-5 space-y-3">
              <p className="text-xs font-semibold tracking-widest text-gray-300 uppercase">Send Message</p>
              <textarea
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                placeholder="How can we help you?"
                rows={4}
                minLength={10}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                required
              />
              {supportStatus === 'error' && (
                <p className="text-red-300 text-xs">{supportError}</p>
              )}
              {supportStatus === 'success' && (
                <p className="text-emerald-300 text-xs">Support request sent successfully.</p>
              )}
              <button
                type="submit"
                disabled={isSupportSubmitting}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600/90 hover:bg-emerald-600 disabled:opacity-60"
              >
                {isSupportSubmitting ? 'Sending...' : 'Send to Support'}
              </button>
            </form>
          </section>
        )}
      </main>

      {/* ── Mobile Bottom Navigation Bar ────────────────────────────────────────────── */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 py-2 border-t border-white/10"
        style={{ background: 'rgba(10,20,35,0.95)', backdropFilter: 'blur(12px)' }}
      >
        {/* Dashboard */}
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          aria-label="Dashboard"
          aria-current={activeTab === 'dashboard' ? 'page' : undefined}
          className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors ${
            activeTab === 'dashboard' ? 'text-blue-300' : 'text-gray-400'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span className="text-xs font-medium">Dashboard</span>
        </button>

        {/* Transactions */}
        <button
          type="button"
          onClick={() => setActiveTab('transactions')}
          aria-label="Transactions"
          aria-current={activeTab === 'transactions' ? 'page' : undefined}
          className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors ${
            activeTab === 'transactions' ? 'text-cyan-300' : 'text-gray-400'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 8h10M7 12h8m-8 4h6M5 5h14a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z"
            />
          </svg>
          <span className="text-xs">Transactions</span>
        </button>

        {/* Support */}
        <button
          type="button"
          onClick={() => setActiveTab('support')}
          aria-label="Support"
          aria-current={activeTab === 'support' ? 'page' : undefined}
          className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors ${
            activeTab === 'support' ? 'text-emerald-300' : 'text-gray-400'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-xs">Support</span>
        </button>

        {/* Profile */}
        <button
          type="button"
          onClick={() => setIsProfileOpen(true)}
          aria-label="Profile details"
          aria-current={isProfileOpen ? 'page' : undefined}
          className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors ${
            isProfileOpen ? 'text-purple-300' : 'text-gray-400'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span className="text-xs">Profile</span>
        </button>

      </nav>

      {/* ── Profile Drawer ─────────────────────────────────────────── */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close profile drawer"
            onClick={() => setIsProfileOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <aside
            aria-label="Profile details panel"
            className="absolute right-0 top-0 h-full w-full sm:w-[26rem] p-5 sm:p-6 overflow-y-auto"
            style={{ background: 'linear-gradient(180deg, rgba(12,24,42,0.98), rgba(8,34,48,0.98))', borderLeft: '1px solid rgba(255,255,255,0.12)' }}
          >
            <div className="sticky top-0 z-10 pb-4 mb-4 flex items-center justify-between border-b border-white/10 bg-transparent">
              <h2 className="text-white text-lg font-semibold">Profile Details</h2>
              <button
                type="button"
                onClick={() => setIsProfileOpen(false)}
                aria-label="Close profile details"
                className="p-2 rounded-md border border-white/20 text-gray-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              {detailPairs.map(({ label, value }) => (
                <div key={label} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
                  <p className="text-gray-400 text-xs uppercase tracking-wide">{label}</p>
                  <p className="text-white text-sm mt-1 break-words">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Log out of your account"
                className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-red-100 border border-red-300/40 bg-red-500/20 hover:bg-red-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 transition-colors"
              >
                Log out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── Contact Support Floating Action Button ─────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setActiveTab('support')}
        aria-label="Contact support for disputes or help"
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-30 w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform"
        style={{ background: 'linear-gradient(135deg, #6d28d9, #2563eb)' }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      </button>
    </div>
  );
};
