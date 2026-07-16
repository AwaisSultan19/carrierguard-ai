"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { searchCarrier, getSearchHistory, getPdfDownloadUrl, type Carrier, type SearchHistoryItem } from '@/lib/api';

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
      const result = await searchCarrier({
        mcNumber: mcNumber.trim() || undefined,
        dotNumber: dotNumber.trim() || undefined,
      }, token);
      setCarrierResult(result);
      setSearchState('results');
      loadHistory();
    } catch (err: any) {
      setErrorMessage(err.message || 'Carrier not found. Check the number and try again.');
      setSearchState('error');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
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
            <div className="w-64 h-64 mb-xl opacity-80">
              <img
                className="w-full h-full object-contain"
                alt="Ready to VET"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNuI3B5u8Ib62NthkEHDohSkngFpZoVE-4DdtTSmRNu53jfD3s3icpRmCwIdjarKzg3lEsrv-3qBNVx_7yog3QgFCuTzHAIIx4W8wV6SJZ_HPn1KMnVCM4CHKtb2bRN_efkVlX55JSZ9MWanZ5MuM1zzHz-Q5yVZYHU7MH9i8iFiaJ2dg4xRnY-3zWwlMeXq4UI2Y5oX7E8_nEge-X6Kux8GezepU5o4gFLdtHCKHzxPV9dRpfBlMuaesY43V30CpMbf2nirN7VFc"
              />
            </div>
            <h3 className="font-h2 text-h2 text-on-surface mb-sm">Ready to VET your next carrier?</h3>
            <p className="text-on-surface-variant max-w-md mx-auto">Enter an MC or DOT number above to pull deep-dive safety data, insurance verifications, and real-time authority status.</p>
          </div>
        )}

        {searchState === 'loading' && (
          <div className="space-y-lg">
            <div className="flex items-center justify-between">
              <div className="h-8 w-48 skeleton rounded-lg"></div>
              <div className="h-8 w-24 skeleton rounded-lg"></div>
            </div>
            <div className="border border-outline-variant rounded-xl overflow-hidden bg-surface-container-lowest">
              <div className="h-12 bg-surface-container skeleton"></div>
              <div className="divide-y divide-outline-variant">
                <div className="p-md flex gap-md">
                  <div className="w-12 h-12 rounded-lg skeleton"></div>
                  <div className="flex-1 space-y-sm">
                    <div className="h-4 w-1/3 skeleton rounded"></div>
                    <div className="h-3 w-1/4 skeleton rounded"></div>
                  </div>
                  <div className="w-24 h-8 skeleton rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {searchState === 'error' && (
          <div className="flex flex-col items-center justify-center py-xl text-center">
            <div className="w-16 h-16 bg-error-container rounded-2xl flex items-center justify-center mb-lg">
              <span className="material-symbols-outlined text-error text-3xl">search_off</span>
            </div>
            <h3 className="font-h3 text-h3 text-on-surface mb-sm">Carrier Not Found</h3>
            <p className="text-on-surface-variant max-w-md">{errorMessage}</p>
            <button onClick={() => setSearchState('empty')} className="mt-lg text-primary font-label-md hover:underline flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">refresh</span> Try Again
            </button>
          </div>
        )}

        {carrierResult && (
          <div className="border border-outline-variant rounded-xl overflow-hidden bg-surface-container-lowest hover:border-primary transition-all">
            <div className="p-lg flex items-start justify-between gap-md">
              <div className="flex gap-lg items-start">
                <div className="w-14 h-14 rounded-xl bg-primary-container flex items-center justify-center text-white text-xl font-bold shadow-md shrink-0">
                  {carrierResult.legalName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-sm mb-1 flex-wrap">
                    <h3 className="font-h3 text-h3 text-on-surface">{carrierResult.legalName}</h3>
                    {getStatusBadge(carrierResult.authorityStatus)}
                  </div>
                  <p className="text-body-sm text-on-surface-variant flex items-center gap-md flex-wrap">
                    <span className="bg-surface-container px-2 py-0.5 rounded font-semibold">DOT: {carrierResult.dotNumber}</span>
                    <span className="bg-surface-container px-2 py-0.5 rounded font-semibold">MC: {carrierResult.mcNumber}</span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      {carrierResult.city}, {carrierResult.state}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className={`px-3 py-1 rounded-lg border font-bold text-sm ${getScoreColor(carrierResult.riskScore)}`}>
                  Risk: {carrierResult.riskScore}/100
                </div>
                <div className="flex items-center gap-md">
                  <Link
                    href={`/carrier/${carrierResult.dotNumber}`}
                    className="text-primary font-label-md hover:underline flex items-center gap-1"
                  >
                    View Full Report
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                  <a
                    href={getPdfDownloadUrl(carrierResult.dotNumber)}
                    target="_blank" rel="noopener noreferrer"
                    className="text-outline font-label-md hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                    PDF
                  </a>
                </div>
              </div>
            </div>

            <div className="border-t border-outline-variant px-lg py-md grid grid-cols-2 md:grid-cols-5 gap-md text-center">
              <div>
                <p className="text-[11px] uppercase text-outline font-bold tracking-wider">Safety Rating</p>
                <p className={`font-bold text-sm mt-1 ${carrierResult.safetyRating === 'Satisfactory' ? 'text-green-600' : carrierResult.safetyRating === 'Conditional' ? 'text-yellow-600' : 'text-red-600'}`}>
                  {carrierResult.safetyRating}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-outline font-bold tracking-wider">Inspections</p>
                <p className="font-bold text-sm mt-1">{carrierResult.inspections}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-outline font-bold tracking-wider">Crashes</p>
                <p className="font-bold text-sm mt-1">{carrierResult.crashTotal}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-outline font-bold tracking-wider">Fleet Size</p>
                <p className="font-bold text-sm mt-1">{carrierResult.powerUnits} units</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-outline font-bold tracking-wider">OOS Rate</p>
                <p className="font-bold text-sm mt-1">{carrierResult.vehicleOOSRate}</p>
              </div>
            </div>

            <div className="border-t border-outline-variant px-lg py-md bg-surface-container-low flex items-start gap-2">
              <span className="material-symbols-outlined text-primary text-lg shrink-0">auto_awesome</span>
              <p className="text-body-sm text-on-surface-variant leading-relaxed">{carrierResult.aiSummary}</p>
            </div>
          </div>
        )}

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
        </section>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-lg">
        <div className="md:col-span-2 p-xl bg-primary-container text-on-primary-container rounded-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <p className="font-label-sm uppercase tracking-widest opacity-80 mb-sm">Platform Statistics</p>
            <h4 className="font-h1 text-h1 mb-md">4.2M+ Verified Carriers</h4>
            <p className="body-sm opacity-90 max-w-sm">CarrierGuard AI connects directly to FMCSA, SAFER, and insurance underwriters to provide sub-second vetting accuracy.</p>
            <button className="mt-xl px-lg py-sm bg-white text-primary font-bold rounded-lg shadow-xl shadow-black/10 transition-transform hover:scale-105">View Global Report</button>
          </div>
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
        </div>

        <div className="p-xl bg-surface-container-high border border-outline-variant rounded-2xl flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-surface rounded-xl flex items-center justify-center text-primary mb-md shadow-sm">
              <span className="material-symbols-outlined">verified</span>
            </div>
            <h4 className="font-h3 text-h3 text-on-surface mb-xs">Authority Watch</h4>
            <p className="text-body-sm text-on-surface-variant">Real-time monitoring of authority status changes.</p>
          </div>
          <div className="mt-md">
            <span className="text-h2 font-bold text-primary">99.9%</span>
            <p className="text-xs text-on-surface-variant">Uptime SLA</p>
          </div>
        </div>

        <div className="p-xl bg-white border border-outline-variant rounded-2xl flex flex-col justify-between shadow-sm">
          <div>
            <div className="w-12 h-12 bg-secondary-container rounded-xl flex items-center justify-center text-on-secondary-container mb-md">
              <span className="material-symbols-outlined">shield_with_heart</span>
            </div>
            <h4 className="font-h3 text-h3 text-on-surface mb-xs">Risk Engine</h4>
            <p className="text-body-sm text-on-surface-variant">Proprietary scoring based on 50+ data points.</p>
          </div>
          <div className="mt-md flex items-center gap-sm">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200"></div>
              <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-300"></div>
              <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-400"></div>
            </div>
            <span className="text-xs font-semibold text-on-surface-variant">+500 users</span>
          </div>
        </div>
      </section>

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
