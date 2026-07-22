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

  useEffect(() => {
    if (searchState !== 'loading') { setScanStep(0); return; }
    if (scanStep >= SCAN_STEPS.length) return;
    const delay = scanStep === 0 ? 200 : 450;
    const timer = setTimeout(() => setScanStep(prev => prev + 1), delay);
    return () => clearTimeout(timer);
  }, [searchState, scanStep]);

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
    } catch {}
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
    setApiResolved(false);
    setApiSuccess(false);

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
    if (score >= 70) return 'text-green-400 bg-green-500/10 border-green-500/30';
    if (score >= 40) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    return 'text-red-400 bg-red-500/10 border-red-500/30';
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded text-[10px] font-bold uppercase">Active</span>;
      case 'NOT_AUTHORIZED':
        return <span className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded text-[10px] font-bold uppercase">Not Authorized</span>;
      case 'OUT_OF_SERVICE':
        return <span className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded text-[10px] font-bold uppercase">Out of Service</span>;
      case 'REVOKED':
        return <span className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded text-[10px] font-bold uppercase">Revoked</span>;
      default:
        return <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded text-[10px] font-bold uppercase">Pending</span>;
    }
  };

  const getRecommendationStyle = (rec: string) => {
    switch (rec) {
      case 'Approve': return { bg: 'bg-green-500', text: 'text-green-400', bgLight: 'bg-green-500/10', border: 'border-green-500/30', icon: 'check_circle' };
      case 'Review': return { bg: 'bg-yellow-500', text: 'text-yellow-400', bgLight: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: 'rate_review' };
      case 'Reject': return { bg: 'bg-red-500', text: 'text-red-400', bgLight: 'bg-red-500/10', border: 'border-red-500/30', icon: 'cancel' };
      default: return { bg: 'bg-gray-500', text: 'text-gray-400', bgLight: 'bg-gray-800', border: 'border-gray-700', icon: 'help' };
    }
  };

  const formatDate = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }); }
    catch { return dateStr; }
  };

  return (
    <div className="flex-1 px-6 py-8 w-full bg-gray-950">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-100 tracking-tight">Search Carriers</h1>
        <p className="text-sm text-gray-400 mt-1.5">
          Look up any carrier by MC or DOT number for a full compliance report.
        </p>
      </div>

      <div className="bg-gray-900/60 border border-gray-800 rounded-xl shadow-sm mb-8">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end flex-1 w-full">
              <div className="sm:col-span-5">
                <label className="block text-[11px] uppercase text-gray-500 font-semibold tracking-wider mb-1.5">
                  MC Number
                </label>
                <input
                  type="text"
                  value={mcNumber}
                  onChange={(e) => setMcNumber(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="block w-full h-10 px-3.5 text-sm text-gray-100 placeholder:text-gray-500 bg-gray-900/80 border border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
                  placeholder="1234567"
                />
              </div>
              <div className="sm:col-span-5">
                <label className="block text-[11px] uppercase text-gray-500 font-semibold tracking-wider mb-1.5">
                  DOT Number
                </label>
                <input
                  type="text"
                  value={dotNumber}
                  onChange={(e) => setDotNumber(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="block w-full h-10 px-3.5 text-sm text-gray-100 placeholder:text-gray-500 bg-gray-900/80 border border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
                  placeholder="0987654"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  onClick={handleSearch}
                  disabled={searchState === 'loading'}
                  className="w-full h-10 text-sm font-medium text-white bg-orange-500 hover:bg-orange-400 active:scale-[0.98] rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {searchState === 'loading' ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-800">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Quick:</span>
            <button className="px-3 py-1 text-xs font-medium text-gray-400 bg-gray-800/50 border border-gray-700 rounded-full hover:bg-gray-700 transition-colors">Active Authority</button>
            <button className="px-3 py-1 text-xs font-medium text-gray-400 bg-gray-800/50 border border-gray-700 rounded-full hover:bg-gray-700 transition-colors">Safety: Satisfactory</button>
            <button className="px-3 py-1 text-xs font-medium text-gray-400 bg-gray-800/50 border border-gray-700 rounded-full hover:bg-gray-700 transition-colors">Hazmat Certified</button>
          </div>
        </div>
      </div>

      {searchState === 'empty' && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-gray-400 text-3xl">search_insights</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-100 mb-2">Ready to vet a carrier?</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Enter an MC or DOT number above to pull safety data, insurance records, and real-time authority status.
          </p>
        </div>
      )}

      <div className="space-y-8">
        {searchState === 'loading' && (
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden shadow-sm relative">
            <style>{`
              @keyframes scanGlow {
                0%, 100% { box-shadow: 0 0 20px rgba(249,115,22,0.08), 0 0 60px rgba(249,115,22,0.03); }
                50% { box-shadow: 0 0 30px rgba(249,115,22,0.15), 0 0 80px rgba(249,115,22,0.05); }
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
              <div className="scan-line absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500/40 to-transparent"></div>
            </div>
            <div className="scan-glow absolute inset-0 rounded-xl pointer-events-none"></div>

            <div className="relative z-10 px-6 py-4 border-b border-gray-800 bg-gray-900/80 flex items-center gap-3">
              <span className="material-symbols-outlined text-orange-400">radar</span>
              <div>
                <h3 className="text-sm font-semibold text-gray-100">Verifying Carrier</h3>
                <p className="text-xs text-gray-400">Checking {mcNumber || dotNumber || 'carrier'} against FMCSA database</p>
              </div>
            </div>

            <div className="h-1 bg-gray-800 relative overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-500 ease-out"
                style={{ width: `${Math.min(((scanStep) / SCAN_STEPS.length) * 100, 100)}%` }} />
            </div>

            <div className="p-6 space-y-1">
              {SCAN_STEPS.map((step, i) => {
                const isActive = scanStep === i;
                const isDone = scanStep > i;
                return (
                  <div key={i} className={`step-enter flex items-center gap-4 py-2.5 px-4 rounded-xl transition-all duration-300 ${
                    isActive ? 'bg-orange-500/10' : ''
                  }`} style={{ animationDelay: `${i * 80}ms` }}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 ${
                      isDone ? 'bg-green-500/10 text-green-400' :
                      isActive ? 'bg-orange-500/10 text-orange-400 scale-110 shadow-sm' :
                      'bg-gray-800 text-gray-400'
                    }`}>
                      <span className="material-symbols-outlined text-xl">
                        {isDone ? 'check_circle' : step.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm transition-colors duration-500 ${
                        isDone ? 'text-green-400 font-medium' :
                        isActive ? 'text-gray-100 font-medium' :
                        'text-gray-400'
                      }`}>{step.label}</p>
                    </div>
                    <div className="shrink-0">
                      {isActive && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-orange-400 font-bold">{Math.round(((i + 1) / SCAN_STEPS.length) * 100)}%</span>
                          <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
                        </div>
                      )}
                      {isDone && (
                        <span className="material-symbols-outlined text-green-400 text-lg">check_circle</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {searchState === 'error' && (
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-red-400 text-3xl">search_off</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">Carrier Not Found</h3>
              <p className="text-sm text-gray-400">
              
                We couldn't find <span className="font-semibold text-gray-200">{(mcNumber || dotNumber || 'this number').trim()}</span> in the FMCSA database.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Double-check for typos. MC numbers are 7 digits, DOT numbers are 7-8 digits.
              </p>
              <button
                onClick={() => setSearchState('empty')}
                className="mt-6 h-10 px-5 text-sm font-medium text-white bg-orange-500 hover:bg-orange-400 rounded-lg transition-all shadow-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">refresh</span>
                Try Again
              </button>
            </div>
          </div>
        )}

        {searchState === 'results' && carrierResult && (() => {
          const c = carrierResult;
          const recStyle = getRecommendationStyle(c.recommendation);
          const initials = c.legalName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
          return (
          <div className="space-y-6">

            <div className="bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-3.5 border-b border-gray-800 bg-gray-900/80 flex items-center gap-2.5">
                <span className="material-symbols-outlined text-orange-400 text-lg">local_shipping</span>
                <h3 className="text-sm font-semibold text-gray-100">Carrier Overview</h3>
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex gap-4 items-start min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center text-white text-base font-bold shadow-sm shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h2 className="text-lg font-semibold text-gray-100 truncate">{c.legalName}</h2>
                        {getStatusBadge(c.authorityStatus)}
                      </div>
                      {c.dbaName !== c.legalName && (
                        <p className="text-sm text-gray-400 mb-1">DBA: {c.dbaName}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400 mt-1">
                        <span className="bg-gray-800 text-gray-400 px-2 py-0.5 rounded text-xs font-medium">DOT: {c.dotNumber || '—'}</span>
                        <span className="bg-gray-800 text-gray-400 px-2 py-0.5 rounded text-xs font-medium">MC: {c.mcNumber || '—'}</span>
                        <span className="flex items-center gap-1 text-xs">
                          <span className="material-symbols-outlined text-sm">location_on</span>
                          {c.city}, {c.state}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className={`px-3 py-1 rounded-lg border text-sm font-bold ${getScoreColor(c.riskScore)}`}>
                      Risk: {c.riskScore}/100
                    </div>
                    <div className="flex items-center gap-3">
                      <Link href={`/carrier/${c.dotNumber}`}
                        className="text-sm font-medium text-orange-400 hover:text-orange-500 flex items-center gap-1">
                        View Full Report
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </Link>
                      <a href={getPdfDownloadUrl(c.dotNumber)}
                        target="_blank" rel="noopener noreferrer"
                        className="text-sm text-gray-400 hover:text-gray-200 transition-colors flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                        PDF
                      </a>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-gray-800">
                  <div>
                    <p className="text-[11px] uppercase text-gray-500 font-semibold tracking-wider mb-1">Authority Type</p>
                    <p className="text-sm font-semibold text-gray-100">{c.authorityType || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase text-gray-500 font-semibold tracking-wider mb-1">Authority Age</p>
                    <p className="text-sm font-semibold text-gray-100">{c.authorityAge || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase text-gray-500 font-semibold tracking-wider mb-1">Fleet Size</p>
                    <p className="text-sm font-semibold text-gray-100">{c.powerUnits > 0 ? `${c.powerUnits} units` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase text-gray-500 font-semibold tracking-wider mb-1">Drivers</p>
                    <p className="text-sm font-semibold text-gray-100">{c.drivers > 0 ? c.drivers : 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-3.5 border-b border-gray-800 bg-gray-900/80 flex items-center gap-2.5">
                <span className="material-symbols-outlined text-orange-400 text-lg">shield</span>
                <h3 className="text-sm font-semibold text-gray-100">Safety & Compliance</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                    <p className="text-[11px] uppercase text-gray-500 font-semibold tracking-wider mb-1">Safety Rating</p>
                    <p className={`text-lg font-bold ${c.safetyRating === 'Satisfactory' ? 'text-green-400' : c.safetyRating === 'Conditional' ? 'text-yellow-400' : 'text-red-400'}`}>
                      {c.safetyRating}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">{c.safetyRatingDate}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                    <p className="text-[11px] uppercase text-gray-500 font-semibold tracking-wider mb-1">Inspections</p>
                    <p className="text-lg font-bold text-gray-100">{c.inspections || 0}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{c.vehicleInspections || 0} vehicle / {c.driverInspections || 0} driver</p>
                  </div>
                  <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                    <p className="text-[11px] uppercase text-gray-500 font-semibold tracking-wider mb-1">Violations</p>
                    <p className="text-lg font-bold text-gray-100">{c.violations || 0}</p>
                    <p className="text-[10px] text-gray-400 mt-1">on record</p>
                  </div>
                  <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                    <p className="text-[11px] uppercase text-gray-500 font-semibold tracking-wider mb-1">Crashes (24mo)</p>
                    <p className="text-lg font-bold text-gray-100">{c.crashTotal || 0}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{c.fatalCrashes > 0 && `${c.fatalCrashes} fatal`}{c.fatalCrashes > 0 && c.injuryCrashes > 0 ? ' · ' : ''}{c.injuryCrashes > 0 && `${c.injuryCrashes} injury`}{c.fatalCrashes === 0 && c.injuryCrashes === 0 && c.towCrashes > 0 && `${c.towCrashes} tow`}</p>
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-xl p-5">
                  <p className="text-[11px] uppercase text-gray-500 font-semibold tracking-wider mb-3">Out-of-Service Rates</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Vehicle OOS</p>
                      <p className="text-sm font-semibold text-gray-100">{c.vehicleOOSRate || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Driver OOS</p>
                      <p className="text-sm font-semibold text-gray-100">{c.driverOOSRate || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">National Avg (Vehicle)</p>
                      <p className="text-sm font-semibold text-gray-100">{c.outOfServiceNationalAvg || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-3.5 border-b border-gray-800 bg-gray-900/80 flex items-center gap-2.5">
                <span className="material-symbols-outlined text-orange-400 text-lg">verified</span>
                <h3 className="text-sm font-semibold text-gray-100">Insurance & Authority</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[11px] uppercase text-gray-500 font-semibold tracking-wider mb-1">Authority Status</p>
                    <div className="mt-1">{getStatusBadge(c.authorityStatus)}</div>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase text-gray-500 font-semibold tracking-wider mb-1">Authority Type</p>
                    <p className="text-sm font-semibold text-gray-100 mt-1">{c.authorityType || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase text-gray-500 font-semibold tracking-wider mb-1">Authority Age</p>
                    <p className="text-sm font-semibold text-gray-100 mt-1">{c.authorityAge || '—'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] uppercase text-gray-500 font-semibold tracking-wider mr-1">Cargo:</span>
                  {c.cargoTypes && c.cargoTypes.length > 0 ? (
                    c.cargoTypes.map((t, i) => (
                      <span key={i} className="px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded text-xs font-medium">{t}</span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                  {c.hazmatStatus && (
                    <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded text-xs font-bold uppercase flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">warning</span>
                      Hazmat
                    </span>
                  )}
                </div>

                {c.insurance && c.insurance.length > 0 && (
                  <div>
                    <p className="text-[11px] uppercase text-gray-500 font-semibold tracking-wider mb-3">Insurance Policies</p>
                    <div className="overflow-x-auto rounded-lg border border-gray-800">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-900 border-b border-gray-800">
                            <th className="text-left py-2.5 px-4 text-gray-400 font-semibold text-[11px] uppercase tracking-wider">Type</th>
                            <th className="text-left py-2.5 px-4 text-gray-400 font-semibold text-[11px] uppercase tracking-wider">Provider</th>
                            <th className="text-left py-2.5 px-4 text-gray-400 font-semibold text-[11px] uppercase tracking-wider">Coverage</th>
                            <th className="text-left py-2.5 px-4 text-gray-400 font-semibold text-[11px] uppercase tracking-wider">Expires</th>
                            <th className="text-left py-2.5 px-4 text-gray-400 font-semibold text-[11px] uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {c.insurance.map((p, i) => (
                            <tr key={i} className="border-b border-gray-800/50 last:border-0">
                              <td className="py-2.5 px-4 font-medium text-gray-100">{p.policyType}</td>
                              <td className="py-2.5 px-4 text-gray-400">{p.carrier}</td>
                              <td className="py-2.5 px-4 text-gray-100">{p.limit}</td>
                              <td className="py-2.5 px-4 text-gray-400">{p.expiration}</td>
                              <td className="py-2.5 px-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${p.status === 'VALID' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
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

            <div className="bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-3.5 border-b border-gray-800 bg-gray-900/80 flex items-center gap-2.5">
                <span className="material-symbols-outlined text-orange-400 text-lg">analytics</span>
                <h3 className="text-sm font-semibold text-gray-100">Risk Analysis</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                  <div className="lg:col-span-2 flex flex-col items-center justify-center p-6 bg-gray-800/50 rounded-xl text-center">
                    <div className={`w-24 h-24 rounded-full ${getScoreBg(c.riskScore)} flex flex-col items-center justify-center shadow-sm mb-4`}>
                      <span className="text-2xl font-bold text-white leading-none">{c.riskScore}</span>
                      <span className="text-white/70 text-xs mt-0.5">/ 100</span>
                    </div>
                    <div className={`inline-flex items-center gap-1 px-4 py-1.5 rounded-full border text-sm font-bold ${recStyle.bgLight} ${recStyle.text} ${recStyle.border}`}>
                      <span className="material-symbols-outlined text-lg">{recStyle.icon}</span>
                      {c.recommendation}
                    </div>
                  </div>

                  <div className="lg:col-span-3 space-y-3">
                    <p className="text-[11px] uppercase text-gray-500 font-semibold tracking-wider mb-2">Score Breakdown</p>
                    {c.riskBreakdown && c.riskBreakdown.length > 0 ? (
                      <div className="space-y-1.5">
                        {c.riskBreakdown.map((f, i) => (
                          <div key={i} className="flex items-center justify-between py-2 px-3.5 rounded-lg bg-gray-800/50">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${f.impact >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                              <span className="text-sm font-medium text-gray-100 truncate">{f.factor}</span>
                              <span className="text-xs text-gray-400 hidden sm:inline truncate">{f.description}</span>
                            </div>
                            <span className={`text-sm font-bold shrink-0 ml-2 ${f.impact >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {f.impact >= 0 ? '+' : ''}{f.impact}
                            </span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between py-2.5 px-3.5 rounded-lg bg-orange-500/10 border border-orange-500/30 mt-2">
                          <span className="text-sm font-bold text-gray-100">Total Risk Score</span>
                          <span className={`text-lg font-bold ${c.riskScore >= 70 ? 'text-green-400' : c.riskScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {c.riskScore}/100
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">Score: {c.riskScore}/100</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-3.5 border-b border-gray-800 bg-gray-900/80 flex items-center gap-2.5">
                <span className="material-symbols-outlined text-orange-400 text-lg">auto_awesome</span>
                <h3 className="text-sm font-semibold text-gray-100">AI Recommendation</h3>
              </div>
              <div className="p-6">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full ${recStyle.bgLight} flex items-center justify-center shrink-0`}>
                    <span className={`material-symbols-outlined ${recStyle.text}`}>psychology</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 leading-relaxed">{c.aiSummary}</p>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-4 pt-3.5 border-t border-gray-800">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">schedule</span>
                        Last updated: {formatDate(c.lastUpdated)}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
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

        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-gray-400 text-lg">history</span>
              <h3 className="text-base font-semibold text-gray-100">Recent Searches</h3>
            </div>
          </div>
          {recentSearches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 bg-gray-800/60 rounded-xl flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-gray-500 text-2xl">manage_search</span>
              </div>
              <p className="text-sm text-gray-400">No recent searches yet. Your last 6 lookups will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentSearches.map((item) => (
                <Link key={item.id} href={`/carrier/${item.dot_number}`} className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl hover:border-orange-500 transition-all cursor-pointer group shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400">
                      <span className="material-symbols-outlined">local_shipping</span>
                    </div>
                    {item.risk_score >= 70 ? (
                      <span className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded text-[10px] font-bold uppercase">Active</span>
                    ) : item.risk_score >= 40 ? (
                      <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded text-[10px] font-bold uppercase">Caution</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded text-[10px] font-bold uppercase">High Risk</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-100 mb-1.5 group-hover:text-orange-400 transition-colors truncate">{item.carrier_name}</p>
                  <p className="text-xs text-gray-400">
                    <span className="font-medium">MC:</span> {item.mc_number} &middot; <span className="font-medium">DOT:</span> {item.dot_number}
                  </p>
                  <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">{new Date(item.created_at).toLocaleDateString()}</span>
                    <span className="material-symbols-outlined text-sm text-gray-400 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {recentSearches.length > 0 && (
            <div className="flex justify-center mt-4">
              <button
                onClick={handleClearHistory}
                className="text-sm text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1.5 px-4 py-2 rounded-lg hover:bg-gray-800/50"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                Clear History
              </button>
            </div>
          )}
        </section>
      </div>
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-gray-900 border border-gray-700 text-gray-100 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border-gray-700 toast-entrance">
            <span className="material-symbols-outlined text-red-400">error</span>
            <div>
              <p className="text-sm font-medium">Search Error</p>
              <p className="text-xs text-gray-400">{toastMessage}</p>
            </div>
            <button className="ml-4 hover:opacity-70" onClick={() => setShowToast(false)}>
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
