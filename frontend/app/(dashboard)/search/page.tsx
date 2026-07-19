"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { searchCarrier, getSearchHistory, getPdfDownloadUrl, clearSearchHistory, type Carrier, type SearchHistoryItem } from '@/lib/api';

export default function CarrierSearchPage() {
  const { getToken } = useAuth();
  const [mcNumber, setMcNumber] = useState('');
  const [dotNumber, setDotNumber] = useState('');
  const [searchState, setSearchState] = useState<'idle' | 'empty' | 'loading' | 'results' | 'error'>('empty');
  const [carrierResult, setCarrierResult] = useState<Carrier | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [scanStep, setScanStep] = useState(0);
  const [apiResolved, setApiResolved] = useState(false);
  const [apiSuccess, setApiSuccess] = useState(false);

  const SCAN_STEPS = [
    { icon: 'search', label: 'Searching FMCSA records...' },
    { icon: 'verified_user', label: 'Verifying carrier authority...' },
    { icon: 'description', label: 'Checking insurance & compliance...' },
    { icon: 'analytics', label: 'Calculating risk score...' },
    { icon: 'auto_awesome', label: 'Generating AI compliance insight...' },
    { icon: 'task_alt', label: 'Preparing carrier report...' },
  ];

  // Advance scan steps
  useEffect(() => {
    if (searchState !== 'loading') { setScanStep(0); return; }
    if (scanStep >= SCAN_STEPS.length) return;
    const delay = scanStep === 0 ? 200 : 450;
    const timer = setTimeout(() => setScanStep(prev => prev + 1), delay);
    return () => clearTimeout(timer);
  }, [searchState, scanStep]);

  // Transition when scan finishes + API resolved
  useEffect(() => {
    if (searchState !== 'loading') return;
    if (scanStep >= SCAN_STEPS.length && apiResolved) {
      const timer = setTimeout(() => {
        if (apiSuccess) { setSearchState('results'); loadHistory(); }
        else { setSearchState('error'); }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [scanStep, apiResolved, apiSuccess, searchState]);

  const showError = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };

  const loadHistory = useCallback(async () => {
    try {
      const token = await getToken();
      const history = await getSearchHistory(6, token);
      setRecentSearches(history);
    } catch {
      // Silently fail - history is optional
    }
  }, [getToken]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSearch = async () => {
    if (!mcNumber.trim() && !dotNumber.trim()) {
      showError('Enter an MC or DOT number to search');
      return;
    }

    setSearchState('loading');
    setErrorMessage('');
    setCarrierResult(null);

    try {
      const token = await getToken();
      const mc = mcNumber.trim();
      const dot = dotNumber.trim();
      const result = await searchCarrier({
        ...(mc ? { mcNumber: mc } : { dotNumber: dot }),
      }, token);
      setCarrierResult(result);
      setApiResolved(true);
      setApiSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Carrier not found. Check the number and try again.');
      setApiResolved(true);
      setApiSuccess(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleClearHistory = async () => {
    try {
      const token = await getToken();
      await clearSearchHistory(token);
      setRecentSearches([]);
    } catch {
      showError('Failed to clear history');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold uppercase">Active</span>;
      case 'NOT_AUTHORIZED':
        return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold uppercase">Not Authorized</span>;
      case 'OUT_OF_SERVICE':
        return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold uppercase">Out of Service</span>;
      case 'REVOKED':
        return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold uppercase">Revoked</span>;
      default:
        return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-[10px] font-bold uppercase">Pending</span>;
    }
  };

  const getRecommendationStyle = (rec: string) => {
    switch (rec) {
      case 'Approve': return { bg: 'bg-green-500', text: 'text-green-700', bgLight: 'bg-green-50', border: 'border-green-200', icon: 'check_circle' };
      case 'Review': return { bg: 'bg-yellow-500', text: 'text-yellow-700', bgLight: 'bg-yellow-50', border: 'border-yellow-200', icon: 'rate_review' };
      case 'Reject': return { bg: 'bg-red-500', text: 'text-red-700', bgLight: 'bg-red-50', border: 'border-red-200', icon: 'cancel' };
      default: return { bg: 'bg-gray-500', text: 'text-gray-700', bgLight: 'bg-gray-50', border: 'border-gray-200', icon: 'help' };
    }
  };

  const formatDate = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }); }
    catch { return dateStr; }
  };

  return (
    <div className="flex-1 p-gutter max-w-7xl mx-auto w-full space-y-xl">
      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-xl shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-xl items-end">
          <div className="md:col-span-4 space-y-sm">
            <label className="font-label-md text-on-surface-variant flex items-center gap-xs">
              MC Number
              <span className="material-symbols-outlined text-sm">info</span>
            </label>
            <div className="relative">
              <span className="absolute left-md top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">tag</span>
              <input
                type="text"
                value={mcNumber}
                onChange={(e) => setMcNumber(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full h-12 pl-11 pr-md bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-outline/50"
                placeholder="e.g. 1234567"
              />
            </div>
          </div>
          <div className="md:col-span-4 space-y-sm">
            <label className="font-label-md text-on-surface-variant flex items-center gap-xs">
              DOT Number
              <span className="material-symbols-outlined text-sm">info</span>
            </label>
            <div className="relative">
              <span className="absolute left-md top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">domain</span>
              <input
                type="text"
                value={dotNumber}
                onChange={(e) => setDotNumber(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full h-12 pl-11 pr-md bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-outline/50"
                placeholder="e.g. 0987654"
              />
            </div>
          </div>
          <div className="md:col-span-4">
            <button
              onClick={handleSearch}
              disabled={searchState === 'loading'}
              className="w-full h-12 bg-primary-container hover:brightness-110 text-on-primary font-bold rounded-lg shadow-lg shadow-primary-container/20 transition-all flex items-center justify-center gap-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">{searchState === 'loading' ? 'hourglass_top' : 'search'}</span>
              {searchState === 'loading' ? 'Searching...' : 'Search Carrier'}
            </button>
          </div>
        </div>
        <div className="mt-md flex flex-wrap gap-md items-center text-body-sm text-on-surface-variant">
          <span className="font-semibold">Quick Filters:</span>
          <button className="px-md py-1 bg-surface-container rounded-full hover:bg-secondary-container transition-colors border border-outline-variant/30">Active Authority</button>
          <button className="px-md py-1 bg-surface-container rounded-full hover:bg-secondary-container transition-colors border border-outline-variant/30">Safety Rating: Satisfactory</button>
          <button className="px-md py-1 bg-surface-container rounded-full hover:bg-secondary-container transition-colors border border-outline-variant/30">Hazmat Certified</button>
        </div>
      </section>

      <div className="space-y-xl">
        {searchState === 'empty' && !carrierResult && (
          <div className="flex flex-col items-center justify-center py-2xl text-center">
            <div className="w-18 h-18 bg-primary-container rounded-3xl flex items-center justify-center mb-xl shadow-lg shadow-primary-container/30">
              <span className="material-symbols-outlined text-primary text-4xl">search_insights</span>
            </div>
            <h2 className="font-h2 text-h2 text-on-surface mb-sm font-bold">Ready to VET your next carrier?</h2>
            <p className="text-on-surface-variant max-w-lg mx-auto leading-relaxed text-body-md">
              Enter an MC or DOT number above to pull deep-dive safety data, insurance verifications, and real-time authority status.
            </p>
          </div>
        )}

        {searchState === 'loading' && (
          <div className="border border-outline-variant/80 rounded-xl bg-surface-container-lowest overflow-hidden relative shadow-lg shadow-primary/5">
            <style>{`
              @keyframes scanGlow {
                0%, 100% { box-shadow: 0 0 20px rgba(37,99,235,0.08), 0 0 60px rgba(37,99,235,0.03); }
                50% { box-shadow: 0 0 30px rgba(37,99,235,0.15), 0 0 80px rgba(37,99,235,0.05); }
              }
              @keyframes scanLine {
                0% { transform: translateY(-100%); }
                100% { transform: translateY(100vh); }
              }
              @keyframes stepFadeIn {
                from { opacity: 0; transform: translateY(6px); }
                to { opacity: 1; transform: translateY(0); }
              }
              .scan-glow { animation: scanGlow 2s ease-in-out infinite; }
              .scan-line { animation: scanLine 1.8s linear infinite; }
              .step-enter { animation: stepFadeIn 0.3s ease-out forwards; }
            `}</style>
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
              <div className="scan-line absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent"></div>
            </div>
            <div className="scan-glow absolute inset-0 rounded-xl pointer-events-none"></div>

            <div className="relative z-10 px-xl py-lg border-b border-outline-variant bg-surface-container flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">radar</span>
              <div>
                <h3 className="font-h3 text-h3 font-semibold text-on-surface">Verifying Carrier</h3>
                <p className="text-xs text-on-surface-variant">Checking {mcNumber || dotNumber || 'carrier'} against FMCSA database</p>
              </div>
            </div>

            <div className="h-1 bg-surface-variant relative overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500 ease-out"
                style={{ width: `${Math.min(((scanStep) / SCAN_STEPS.length) * 100, 100)}%` }} />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                style={{ width: `${Math.min(((scanStep) / SCAN_STEPS.length) * 100, 100)}%` }} />
            </div>

            <div className="p-xl space-y-1">
              {SCAN_STEPS.map((step, i) => {
                const isActive = scanStep === i;
                const isDone = scanStep > i;
                return (
                  <div key={i} className={`step-enter flex items-center gap-4 py-2.5 px-4 rounded-xl transition-all duration-300 ${
                    isActive ? 'bg-primary/5' : ''
                  }`} style={{ animationDelay: `${i * 80}ms` }}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 ${
                      isDone ? 'bg-green-100 text-green-600 scale-100' :
                      isActive ? 'bg-primary-container text-primary scale-110 shadow-md' :
                      'bg-surface-container text-outline scale-100'
                    }`}>
                      <span className="material-symbols-outlined text-xl">
                        {isDone ? 'check_circle' : step.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium transition-colors duration-500 ${
                        isDone ? 'text-green-700' :
                        isActive ? 'text-on-surface font-semibold' :
                        'text-on-surface-variant/60'
                      }`}>{step.label}</p>
                    </div>
                    <div className="shrink-0">
                      {isActive && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-primary font-bold">{Math.round(((i + 1) / SCAN_STEPS.length) * 100)}%</span>
                          <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                        </div>
                      )}
                      {isDone && (
                        <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {searchState === 'error' && (
          <div className="border border-outline-variant rounded-xl bg-surface-container-lowest overflow-hidden">
            <div className="p-xl flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-error-container rounded-2xl flex items-center justify-center mb-lg shadow-md">
                <span className="material-symbols-outlined text-error text-3xl">search_off</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">Carrier Not Found</h3>
              <p className="text-sm text-on-surface-variant max-w-sm">We couldn't find a carrier with this MC or DOT number. Please check the number and try again.</p>
              <button
                onClick={() => setSearchState('empty')}
                className="mt-lg h-11 px-6 bg-primary hover:brightness-110 text-on-primary font-bold rounded-xl shadow-md shadow-primary/20 transition-all flex items-center gap-2 active:scale-[0.98] text-sm"
              >
                <span className="material-symbols-outlined text-lg">refresh</span>
                Search Again
              </button>
            </div>
          </div>
        )}

        {carrierResult && (() => {
          const c = carrierResult;
          const recStyle = getRecommendationStyle(c.recommendation);
          const initials = c.legalName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
          return (
          <div className="space-y-lg">

            {/* ────── Section 1: Carrier Overview ────── */}
            <div className="border border-outline-variant rounded-xl overflow-hidden bg-surface-container-lowest">
              <div className="px-lg py-md border-b border-outline-variant bg-surface-container flex items-center gap-md">
                <span className="material-symbols-outlined text-primary">local_shipping</span>
                <h3 className="font-h3 text-h3 font-semibold text-on-surface">Carrier Overview</h3>
              </div>
              <div className="p-lg">
                <div className="flex items-start justify-between gap-md flex-wrap">
                  <div className="flex gap-lg items-start min-w-0">
                    <div className="w-14 h-14 rounded-xl bg-primary-container flex items-center justify-center text-white text-xl font-bold shadow-md shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-sm mb-1 flex-wrap">
                        <h2 className="font-h2 text-h2 text-on-surface font-bold truncate">{c.legalName}</h2>
                        {getStatusBadge(c.authorityStatus)}
                      </div>
                      {c.dbaName !== c.legalName && (
                        <p className="text-body-sm text-on-surface-variant mb-1">DBA: {c.dbaName}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-lg gap-y-1 text-body-sm text-on-surface-variant mt-1">
                        <span className="bg-surface-container px-2 py-0.5 rounded font-semibold">DOT: {c.dotNumber || '—'}</span>
                        <span className="bg-surface-container px-2 py-0.5 rounded font-semibold">MC: {c.mcNumber || '—'}</span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">location_on</span>
                          {c.city}, {c.state}
                        </span>
                        {c.phone && (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">call</span>
                            {c.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className={`px-3 py-1 rounded-lg border font-bold text-sm ${getScoreColor(c.riskScore)}`}>
                      Risk: {c.riskScore}/100
                    </div>
                    <div className="flex items-center gap-md">
                      <Link href={`/carrier/${c.dotNumber}`}
                        className="text-primary font-label-md hover:underline flex items-center gap-1">
                        View Full Report
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </Link>
                      <a href={getPdfDownloadUrl(c.dotNumber)}
                        target="_blank" rel="noopener noreferrer"
                        className="text-outline font-label-md hover:text-primary transition-colors flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                        PDF
                      </a>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-lg mt-lg pt-lg border-t border-outline-variant/50">
                  <div>
                    <p className="text-[11px] uppercase text-outline font-bold tracking-wider mb-1">Authority Type</p>
                    <p className="font-bold text-sm text-on-surface">{c.authorityType || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase text-outline font-bold tracking-wider mb-1">Authority Age</p>
                    <p className="font-bold text-sm text-on-surface">{c.authorityAge || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase text-outline font-bold tracking-wider mb-1">Fleet Size</p>
                    <p className="font-bold text-sm text-on-surface">{c.powerUnits > 0 ? `${c.powerUnits} units` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase text-outline font-bold tracking-wider mb-1">Drivers</p>
                    <p className="font-bold text-sm text-on-surface">{c.drivers > 0 ? c.drivers : 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ────── Section 2: Safety & Compliance ────── */}
            <div className="border border-outline-variant rounded-xl overflow-hidden bg-surface-container-lowest">
              <div className="px-lg py-md border-b border-outline-variant bg-surface-container flex items-center gap-md">
                <span className="material-symbols-outlined text-primary">shield</span>
                <h3 className="font-h3 text-h3 font-semibold text-on-surface">Safety & Compliance</h3>
              </div>
              <div className="p-lg space-y-lg">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-lg">
                  <div className="text-center p-md bg-surface-container rounded-xl">
                    <p className="text-[11px] uppercase text-outline font-bold tracking-wider mb-1">Safety Rating</p>
                    <p className={`font-bold text-lg ${c.safetyRating === 'Satisfactory' ? 'text-green-600' : c.safetyRating === 'Conditional' ? 'text-yellow-600' : 'text-red-600'}`}>
                      {c.safetyRating}
                    </p>
                    <p className="text-[10px] text-outline mt-1">{c.safetyRatingDate}</p>
                  </div>
                  <div className="text-center p-md bg-surface-container rounded-xl">
                    <p className="text-[11px] uppercase text-outline font-bold tracking-wider mb-1">Inspections</p>
                    <p className="font-bold text-lg text-on-surface">{c.inspections || 0}</p>
                    <p className="text-[10px] text-outline mt-1">{c.vehicleInspections || 0} vehicle / {c.driverInspections || 0} driver</p>
                  </div>
                  <div className="text-center p-md bg-surface-container rounded-xl">
                    <p className="text-[11px] uppercase text-outline font-bold tracking-wider mb-1">Violations</p>
                    <p className="font-bold text-lg text-on-surface">{c.violations || 0}</p>
                    <p className="text-[10px] text-outline mt-1">on record</p>
                  </div>
                  <div className="text-center p-md bg-surface-container rounded-xl">
                    <p className="text-[11px] uppercase text-outline font-bold tracking-wider mb-1">Crashes (24mo)</p>
                    <p className="font-bold text-lg text-on-surface">{c.crashTotal || 0}</p>
                    <p className="text-[10px] text-outline mt-1">{c.fatalCrashes > 0 && `${c.fatalCrashes} fatal`}{c.fatalCrashes > 0 && c.injuryCrashes > 0 ? ' · ' : ''}{c.injuryCrashes > 0 && `${c.injuryCrashes} injury`}{c.fatalCrashes === 0 && c.injuryCrashes === 0 && c.towCrashes > 0 && `${c.towCrashes} tow`}</p>
                  </div>
                </div>

                <div className="bg-surface-container rounded-xl p-lg">
                  <p className="text-[11px] uppercase text-outline font-bold tracking-wider mb-3">Out-of-Service Rates</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
                    <div>
                      <p className="text-body-sm text-on-surface-variant">Vehicle OOS</p>
                      <p className="font-bold text-sm text-on-surface">{c.vehicleOOSRate || '—'}</p>
                    </div>
                    <div>
                      <p className="text-body-sm text-on-surface-variant">Driver OOS</p>
                      <p className="font-bold text-sm text-on-surface">{c.driverOOSRate || '—'}</p>
                    </div>
                    <div>
                      <p className="text-body-sm text-on-surface-variant">National Avg (Vehicle)</p>
                      <p className="font-bold text-sm text-on-surface">{c.outOfServiceNationalAvg || '—'}</p>
                    </div>
                  </div>
                  {c.oosComparison && (
                    <div className={`mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${c.oosComparison.includes('Below') ? 'bg-green-50 text-green-700' : c.oosComparison.includes('Above') ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'}`}>
                      <span className="material-symbols-outlined text-sm">{c.oosComparison.includes('Below') ? 'arrow_downward' : c.oosComparison.includes('Above') ? 'arrow_upward' : 'remove'}</span>
                      {c.oosComparison}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ────── Section 3: Insurance & Authority ────── */}
            <div className="border border-outline-variant rounded-xl overflow-hidden bg-surface-container-lowest">
              <div className="px-lg py-md border-b border-outline-variant bg-surface-container flex items-center gap-md">
                <span className="material-symbols-outlined text-primary">verified</span>
                <h3 className="font-h3 text-h3 font-semibold text-on-surface">Insurance & Authority</h3>
              </div>
              <div className="p-lg space-y-lg">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-lg">
                  <div>
                    <p className="text-[11px] uppercase text-outline font-bold tracking-wider mb-1">Authority Status</p>
                    <div className="mt-1">{getStatusBadge(c.authorityStatus)}</div>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase text-outline font-bold tracking-wider mb-1">Authority Type</p>
                    <p className="font-bold text-sm text-on-surface mt-1">{c.authorityType || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase text-outline font-bold tracking-wider mb-1">Authority Age</p>
                    <p className="font-bold text-sm text-on-surface mt-1">{c.authorityAge || '—'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-md">
                  <p className="text-[11px] uppercase text-outline font-bold tracking-wider">Cargo Authorized:</p>
                  {c.cargoTypes && c.cargoTypes.length > 0 ? (
                    c.cargoTypes.map((t, i) => (
                      <span key={i} className="px-2 py-0.5 bg-primary-container/30 text-primary rounded text-xs font-semibold">{t}</span>
                    ))
                  ) : (
                    <span className="text-body-sm text-on-surface-variant">—</span>
                  )}
                  {c.hazmatStatus && (
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-bold uppercase flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">warning</span>
                      Hazmat
                    </span>
                  )}
                </div>

                {c.insurance && c.insurance.length > 0 && (
                  <div>
                    <p className="text-[11px] uppercase text-outline font-bold tracking-wider mb-2">Insurance Policies</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-outline-variant/50">
                            <th className="text-left py-2 pr-3 text-outline font-bold text-[11px] uppercase tracking-wider">Type</th>
                            <th className="text-left py-2 pr-3 text-outline font-bold text-[11px] uppercase tracking-wider">Provider</th>
                            <th className="text-left py-2 pr-3 text-outline font-bold text-[11px] uppercase tracking-wider">Coverage</th>
                            <th className="text-left py-2 pr-3 text-outline font-bold text-[11px] uppercase tracking-wider">Expires</th>
                            <th className="text-left py-2 text-outline font-bold text-[11px] uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {c.insurance.map((p, i) => (
                            <tr key={i} className="border-b border-outline-variant/30 last:border-0">
                              <td className="py-2 pr-3 font-semibold text-on-surface">{p.policyType}</td>
                              <td className="py-2 pr-3 text-on-surface-variant">{p.carrier}</td>
                              <td className="py-2 pr-3 text-on-surface">{p.limit}</td>
                              <td className="py-2 pr-3 text-on-surface-variant">{p.expiration}</td>
                              <td className="py-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${p.status === 'VALID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {p.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ────── Section 4: Risk Analysis ────── */}
            <div className="border border-outline-variant rounded-xl overflow-hidden bg-surface-container-lowest">
              <div className="px-lg py-md border-b border-outline-variant bg-surface-container flex items-center gap-md">
                <span className="material-symbols-outlined text-primary">analytics</span>
                <h3 className="font-h3 text-h3 font-semibold text-on-surface">Risk Analysis</h3>
              </div>
              <div className="p-lg">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-lg items-start">
                  <div className="lg:col-span-2 flex flex-col items-center justify-center p-xl bg-surface-container rounded-xl text-center">
                    <div className={`w-28 h-28 rounded-full ${getScoreBg(c.riskScore)} flex flex-col items-center justify-center shadow-lg mb-md`}>
                      <span className="text-3xl font-bold text-white leading-none">{c.riskScore}</span>
                      <span className="text-white/70 text-xs mt-0.5">/ 100</span>
                    </div>
                    <div className={`inline-flex items-center gap-1 px-4 py-1.5 rounded-full border font-bold text-sm ${recStyle.bgLight} ${recStyle.text} ${recStyle.border}`}>
                      <span className="material-symbols-outlined text-lg">{recStyle.icon}</span>
                      {c.recommendation}
                    </div>
                  </div>

                  <div className="lg:col-span-3 space-y-3">
                    <p className="text-[11px] uppercase text-outline font-bold tracking-wider mb-2">Score Breakdown</p>
                    {c.riskBreakdown && c.riskBreakdown.length > 0 ? (
                      <div className="space-y-1.5">
                        {c.riskBreakdown.map((f, i) => (
                          <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-surface-container">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${f.impact >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                              <span className="text-sm font-medium text-on-surface truncate">{f.factor}</span>
                              <span className="text-xs text-on-surface-variant hidden sm:inline truncate">{f.description}</span>
                            </div>
                            <span className={`text-sm font-bold shrink-0 ml-2 ${f.impact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {f.impact >= 0 ? '+' : ''}{f.impact}
                            </span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-primary-container/20 border border-primary-container/30 mt-2">
                          <span className="text-sm font-bold text-on-surface">Total Risk Score</span>
                          <span className={`text-lg font-bold ${c.riskScore >= 70 ? 'text-green-600' : c.riskScore >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {c.riskScore}/100
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-body-sm text-on-surface-variant">Score: {c.riskScore}/100</p>
                    )}

                    {c.oosComparison && (
                      <div className="flex items-center gap-2 pt-2">
                        <span className="text-[11px] uppercase text-outline font-bold tracking-wider">OOS vs National Avg:</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${c.oosComparison.includes('Below') ? 'bg-green-50 text-green-700' : c.oosComparison.includes('Above') ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'}`}>
                          <span className="material-symbols-outlined text-sm">{c.oosComparison.includes('Below') ? 'check_circle' : c.oosComparison.includes('Above') ? 'error' : 'remove_circle'}</span>
                          {c.oosComparison}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ────── Section 5: AI Recommendation ────── */}
            <div className="border border-outline-variant rounded-xl overflow-hidden bg-surface-container-lowest">
              <div className="px-lg py-md border-b border-outline-variant bg-surface-container flex items-center gap-md">
                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                <h3 className="font-h3 text-h3 font-semibold text-on-surface">AI Recommendation</h3>
              </div>
              <div className="p-lg">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full ${recStyle.bgLight} flex items-center justify-center shrink-0`}>
                    <span className={`material-symbols-outlined ${recStyle.text}`}>psychology</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm text-on-surface leading-relaxed">{c.aiSummary}</p>
                    <div className="flex flex-wrap items-center gap-x-lg gap-y-1 mt-4 pt-3 border-t border-outline-variant/50">
                      <span className="text-xs text-outline flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">schedule</span>
                        Last updated: {formatDate(c.lastUpdated)}
                      </span>
                      <span className="text-xs text-outline flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">database</span>
                        Source: {c.dataSource}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
          );
        })()}

        <section className="space-y-md">
          <div className="flex items-center justify-between">
            <h3 className="font-h3 text-h3 font-semibold text-on-surface flex items-center gap-sm">
              <span className="material-symbols-outlined text-primary">history</span>
              Recent Searches
            </h3>
          </div>
          {recentSearches.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
              {[
                { name: 'Swift Trans Corp', mc: '882319', dot: '2910331', status: 'Active', statusClass: 'bg-green-100 text-green-700', time: '2h ago' },
                { name: 'Apex Logistics LLC', mc: '991204', dot: '3310928', status: 'Pending', statusClass: 'bg-yellow-100 text-yellow-700', time: '5h ago' },
                { name: 'Red Line Hauling', mc: '552101', dot: '1120485', status: 'Revoked', statusClass: 'bg-red-100 text-red-700', time: '1d ago' },
              ].map((item, i) => (
                <Link key={i} href={`/carrier/${item.dot}`} className="p-md bg-surface-container-low border border-outline-variant rounded-xl hover:border-primary transition-all cursor-pointer group">
                  <div className="flex items-start justify-between mb-sm">
                    <div className="w-10 h-10 bg-surface-container-highest rounded-lg flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">local_shipping</span>
                    </div>
                    <span className={`px-2 py-0.5 ${item.statusClass} rounded text-[10px] font-bold uppercase`}>{item.status}</span>
                  </div>
                  <p className="font-label-md text-on-surface mb-xs group-hover:text-primary transition-colors">{item.name}</p>
                  <p className="text-xs text-on-surface-variant flex items-center gap-xs">
                    <span className="font-semibold">MC:</span> {item.mc} • <span className="font-semibold ml-1">DOT:</span> {item.dot}
                  </p>
                  <div className="mt-md pt-md border-t border-outline-variant/30 flex items-center justify-between">
                    <span className="text-[10px] text-outline">{item.time}</span>
                    <span className="material-symbols-outlined text-sm text-outline group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
              {recentSearches.map((item) => (
                <Link key={item.id} href={`/carrier/${item.dot_number}`} className="p-md bg-surface-container-low border border-outline-variant rounded-xl hover:border-primary transition-all cursor-pointer group">
                  <div className="flex items-start justify-between mb-sm">
                    <div className="w-10 h-10 bg-surface-container-highest rounded-lg flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">local_shipping</span>
                    </div>
                    {item.risk_score >= 70 ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold uppercase">Active</span>
                    ) : item.risk_score >= 40 ? (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-[10px] font-bold uppercase">Caution</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold uppercase">High Risk</span>
                    )}
                  </div>
                  <p className="font-label-md text-on-surface mb-xs group-hover:text-primary transition-colors truncate">{item.carrier_name}</p>
                  <p className="text-xs text-on-surface-variant flex items-center gap-xs">
                    <span className="font-semibold">MC:</span> {item.mc_number} • <span className="font-semibold ml-1">DOT:</span> {item.dot_number}
                  </p>
                  <div className="mt-md pt-md border-t border-outline-variant/30 flex items-center justify-between">
                    <span className="text-[10px] text-outline">{new Date(item.created_at).toLocaleDateString()}</span>
                    <span className="material-symbols-outlined text-sm text-outline group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {recentSearches.length > 0 && (
            <div className="flex justify-center pt-sm">
              <button
                onClick={handleClearHistory}
                className="text-sm text-outline hover:text-error transition-colors flex items-center gap-1 px-lg py-2 rounded-lg hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                Clear History
              </button>
            </div>
          )}
        </section>
      </div>
      {showToast && (
        <div className="fixed bottom-lg right-lg z-50">
          <div className="bg-inverse-surface text-inverse-on-surface px-lg py-md rounded-xl shadow-2xl flex items-center gap-md border border-outline-variant toast-entrance">
            <span className="material-symbols-outlined text-error">error</span>
            <div>
              <p className="font-label-md">Search Error</p>
              <p className="text-xs opacity-80">{toastMessage}</p>
            </div>
            <button className="ml-xl hover:opacity-70" onClick={() => setShowToast(false)}>
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
