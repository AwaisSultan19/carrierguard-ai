"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { getCarrierById, getPdfDownloadUrl, type Carrier } from '@/lib/api';

export default function CarrierDetailsPage() {
  const params = useParams();
  const carrierId = params?.id as string;
  const { getToken } = useAuth();

  const [carrier, setCarrier] = useState<Carrier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashOffset, setDashOffset] = useState('251.2');

  useEffect(() => {
    if (!carrierId) return;

    setLoading(true);
    setError('');

    getToken().then((token) =>
      getCarrierById(carrierId, undefined, token)
    ).then((data) => {
        setCarrier(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load carrier details');
        setLoading(false);
      });
  }, [carrierId]);

  useEffect(() => {
    if (carrier) {
      const circumference = 251.2;
      const offset = circumference - (carrier.riskScore / 100) * circumference;
      const timer = setTimeout(() => setDashOffset(String(offset)), 300);
      return () => clearTimeout(timer);
    }
  }, [carrier]);

  if (loading) {
    return (
      <div className="flex-1 px-6 py-8 space-y-lg max-w-5xl mx-auto w-full">
        <div className="flex gap-lg items-start">
          <div className="w-20 h-20 rounded-xl bg-gray-800 animate-pulse"></div>
          <div className="flex-1 space-y-2">
            <div className="h-8 w-72 bg-gray-800 animate-pulse rounded-lg"></div>
            <div className="h-5 w-48 bg-gray-800 animate-pulse rounded-lg"></div>
          </div>
        </div>
        <div className="grid grid-cols-12 gap-lg">
          <div className="col-span-12 lg:col-span-8 space-y-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              <div className="h-64 bg-gray-800 animate-pulse rounded-xl"></div>
              <div className="h-64 bg-gray-800 animate-pulse rounded-xl"></div>
            </div>
            <div className="h-48 bg-gray-800 animate-pulse rounded-xl"></div>
          </div>
          <div className="col-span-12 lg:col-span-4 space-y-lg">
            <div className="h-80 bg-gray-800 animate-pulse rounded-xl"></div>
            <div className="h-48 bg-gray-800 animate-pulse rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
        <div className="border border-gray-800 rounded-xl bg-gray-900/60 p-xl flex flex-col items-center text-center max-w-lg mx-auto">
          <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mb-md shadow-md">
            <span className="material-symbols-outlined text-red-400 text-2xl">error_outline</span>
          </div>
          <h3 className="text-lg font-bold text-gray-100 mb-1">Carrier Not Found</h3>
          <p className="text-sm text-gray-400 mb-md">{error}</p>
          <Link href="/search" className="text-sm text-orange-400 font-semibold hover:underline inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Search
          </Link>
        </div>
      </div>
    );
  }

  if (!carrier) return null;

  const c = carrier;
  const scoreColor = c.riskScore >= 70 ? 'text-green-500' : c.riskScore >= 40 ? 'text-yellow-500' : 'text-red-500';
  const scoreLabel = c.riskScore >= 70 ? 'Low Risk' : c.riskScore >= 40 ? 'Moderate Risk' : 'High Risk';
  const scoreBg = c.riskScore >= 70 ? 'bg-green-500/10' : c.riskScore >= 40 ? 'bg-yellow-500/10' : 'bg-red-500/10';

  const recStyle = (() => {
    switch (c.recommendation) {
      case 'Approve': return { bg: 'bg-green-500', text: 'text-green-400', bgLight: 'bg-green-500/10', border: 'border-green-500/30', icon: 'check_circle' };
      case 'Review': return { bg: 'bg-yellow-500', text: 'text-yellow-400', bgLight: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: 'rate_review' };
      case 'Reject': return { bg: 'bg-red-500', text: 'text-red-400', bgLight: 'bg-red-500/10', border: 'border-red-500/30', icon: 'cancel' };
      default: return { bg: 'bg-gray-500', text: 'text-gray-400', bgLight: 'bg-gray-500/10', border: 'border-gray-500/30', icon: 'help' };
    }
  })();

  const initials = c.legalName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  const formatDate = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }); }
    catch { return dateStr; }
  };

  return (
    <div className="flex-1 px-6 py-8 space-y-lg max-w-5xl mx-auto w-full">

      {/* ══════════ HEADER ══════════ */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-md border-b border-gray-800 pb-lg">
        <div className="flex gap-lg items-start">
          <div className="w-20 h-20 rounded-xl bg-orange-500/20 flex items-center justify-center text-white text-3xl font-bold shadow-lg shrink-0">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-sm mb-xs flex-wrap">
              <h2 className="text-2xl font-semibold text-gray-100">{c.legalName}</h2>
              {c.authorityStatus === 'ACTIVE' ? (
                <span className="bg-green-500/10 text-green-400 border border-green-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  ACTIVE
                </span>
              ) : (
                <span className="bg-red-500/10 text-red-400 border border-red-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">block</span>
                  {c.authorityStatus}
                </span>
              )}
            </div>
            {c.dbaName !== c.legalName && (
              <p className="text-sm text-gray-400 mb-1">DBA: {c.dbaName}</p>
            )}
            <div className="flex items-center gap-md text-gray-400 text-sm flex-wrap">
              <span className="bg-gray-800 text-gray-400 px-2 py-0.5 rounded font-semibold">DOT: {c.dotNumber || '—'}</span>
              <span className="bg-gray-800 text-gray-400 px-2 py-0.5 rounded font-semibold">MC: {c.mcNumber || '—'}</span>
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">location_on</span> {c.city}, {c.state}</span>
              {c.phone && (
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">call</span> {c.phone}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-sm">
          <a href={getPdfDownloadUrl(c.dotNumber)} target="_blank" rel="noopener noreferrer"
              className="px-md py-2 border border-gray-800 rounded-lg text-xs font-medium text-gray-100 hover:bg-gray-800/50 transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
            Export PDF
          </a>
        </div>
      </section>

      {/* ══════════ RISK SCORE + AI INSIGHT ══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-xl flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-1 h-full ${c.riskScore >= 70 ? 'bg-green-500' : c.riskScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
          <h3 className="text-[11px] text-gray-400 uppercase tracking-widest mb-md">Aggregate Risk Score</h3>

          <div className="relative w-40 h-40 flex items-center justify-center mb-md">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle className="text-gray-700" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeWidth="8"></circle>
              <circle className={`risk-gauge ${scoreColor}`} cx="50" cy="50" fill="transparent" r="40" stroke="currentColor"
                strokeDasharray="251.2" strokeDashoffset={dashOffset} strokeLinecap="round" strokeWidth="8"></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-gray-100 text-4xl font-bold">{c.riskScore}</span>
              <span className={`text-[11px] ${scoreColor}`}>{scoreLabel}</span>
            </div>
          </div>

          <div className={`inline-flex items-center gap-1 px-4 py-1.5 rounded-full border font-bold text-sm ${recStyle.bgLight} ${recStyle.text} ${recStyle.border}`}>
            <span className="material-symbols-outlined text-lg">{recStyle.icon}</span>
            {c.recommendation}
          </div>
        </div>

        <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-xl flex flex-col relative overflow-hidden">
          <div className="flex items-center gap-2 mb-md">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-orange-400 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
            <h3 className="text-base font-semibold text-gray-100">AI Compliance Insight</h3>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">{c.aiSummary}</p>

          <div className="flex flex-wrap items-center gap-x-lg gap-y-1 mt-auto pt-4 border-t border-gray-800/50 mt-4">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">schedule</span>
              Last updated: {formatDate(c.lastUpdated)}
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">database</span>
              Source: {c.dataSource}
            </span>
          </div>
        </div>
      </div>

      {/* ══════════ SAFETY & COMPLIANCE ══════════ */}
      <div className="bg-gray-900/60 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-xl py-md border-b border-gray-800 bg-gray-900/80 flex items-center gap-md">
          <span className="material-symbols-outlined text-orange-400">shield</span>
          <h3 className="text-base font-semibold text-gray-100">Safety & Compliance</h3>
        </div>
        <div className="p-xl space-y-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-lg">
            <div className="text-center p-lg bg-gray-800/50 rounded-xl">
              <p className="text-[11px] uppercase text-gray-500 font-semibold tracking-wider mb-1">Safety Rating</p>
              <p className={`font-bold text-xl ${c.safetyRating === 'Satisfactory' ? 'text-green-400' : c.safetyRating === 'Conditional' ? 'text-yellow-400' : 'text-red-400'}`}>
                {c.safetyRating}
              </p>
              <p className="text-[10px] text-gray-500 mt-1">{c.safetyRatingDate}</p>
            </div>
            <div className="text-center p-lg bg-gray-800/50 rounded-xl">
              <p className="text-[11px] uppercase text-gray-500 font-semibold tracking-wider mb-1">Inspections</p>
              <p className="font-bold text-xl text-gray-100">{c.inspections || 0}</p>
              <p className="text-[10px] text-gray-500 mt-1">{c.vehicleInspections || 0} vehicle / {c.driverInspections || 0} driver</p>
            </div>
            <div className="text-center p-lg bg-gray-800/50 rounded-xl">
              <p className="text-[11px] uppercase text-gray-500 font-semibold tracking-wider mb-1">Violations</p>
              <p className="font-bold text-xl text-gray-100">{c.violations || 0}</p>
              <p className="text-[10px] text-gray-500 mt-1">
                {c.inspections > 0 ? `${Math.round(((c.inspections - (c.violations || 0)) / c.inspections) * 100)}% clean rate` : 'on record'}
              </p>
            </div>
            <div className="text-center p-lg bg-gray-800/50 rounded-xl">
              <p className="text-[11px] uppercase text-gray-500 font-semibold tracking-wider mb-1">Crashes (24mo)</p>
              <p className="font-bold text-xl text-gray-100">{c.crashTotal || 0}</p>
              <p className="text-[10px] text-gray-500 mt-1">
                {c.crashTotal === 0 ? 'No reported incidents' : `${c.fatalCrashes} fatal · ${c.injuryCrashes} injury · ${c.towCrashes} tow`}
              </p>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-lg">
            <p className="text-[11px] uppercase text-gray-500 font-semibold tracking-wider mb-3">Out-of-Service Rates</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-md mb-3">
              <div>
                <p className="text-sm text-gray-400">Vehicle OOS</p>
                <p className="font-bold text-lg text-gray-100">{c.vehicleOOSRate || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Driver OOS</p>
                <p className="font-bold text-lg text-gray-100">{c.driverOOSRate || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">National Avg (Vehicle)</p>
                <p className="font-bold text-lg text-gray-100">{c.outOfServiceNationalAvg || '—'}</p>
              </div>
            </div>
            {c.oosComparison && (
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${c.oosComparison.includes('Below') ? 'bg-green-500/10 text-green-400' : c.oosComparison.includes('Above') ? 'bg-red-500/10 text-red-400' : 'bg-gray-500/10 text-gray-400'}`}>
                <span className="material-symbols-outlined text-sm">{c.oosComparison.includes('Below') ? 'arrow_downward' : c.oosComparison.includes('Above') ? 'arrow_upward' : 'remove'}</span>
                {c.oosComparison}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════ FLEET & AUTHORITY ══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        <div className="bg-gray-900/60 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-xl py-md border-b border-gray-800 bg-gray-900/80 flex items-center gap-md">
            <span className="material-symbols-outlined text-orange-400">local_shipping</span>
            <h3 className="text-base font-semibold text-gray-100">Fleet Info</h3>
          </div>
          <div className="p-xl">
            <div className="grid grid-cols-2 gap-lg">
              <div>
                <p className="text-[11px] uppercase text-gray-500 font-semibold tracking-wider mb-1">Fleet Size</p>
                <p className="font-bold text-xl text-gray-100">{c.powerUnits > 0 ? `${c.powerUnits} units` : 'N/A'}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-gray-500 font-semibold tracking-wider mb-1">Drivers</p>
                <p className="font-bold text-xl text-gray-100">{c.drivers > 0 ? c.drivers : 'N/A'}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-gray-500 font-semibold tracking-wider mb-1">Operation Type</p>
                <p className="font-bold text-sm text-gray-100">{c.operationType || '—'}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-gray-500 font-semibold tracking-wider mb-1">Fleet Ratio</p>
                <p className="font-bold text-sm text-gray-100">
                  {c.powerUnits > 0 && c.drivers > 0
                    ? `${(c.drivers / c.powerUnits).toFixed(1)} drivers per unit`
                    : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/60 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-xl py-md border-b border-gray-800 bg-gray-900/80 flex items-center gap-md">
            <span className="material-symbols-outlined text-orange-400">verified</span>
            <h3 className="text-base font-semibold text-gray-100">Authority Details</h3>
          </div>
          <div className="p-xl">
            <div className="grid grid-cols-2 gap-lg">
              <div>
                <p className="text-[11px] uppercase text-gray-500 font-semibold tracking-wider mb-1">Operating Status</p>
                <div className="mt-1">
                  {c.authorityStatus === 'ACTIVE' ? (
                    <span className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded text-[10px] font-bold uppercase">Active</span>
                  ) : c.authorityStatus === 'NOT_AUTHORIZED' ? (
                    <span className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded text-[10px] font-bold uppercase">Not Authorized</span>
                  ) : c.authorityStatus === 'OUT_OF_SERVICE' ? (
                    <span className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded text-[10px] font-bold uppercase">Out of Service</span>
                  ) : c.authorityStatus === 'REVOKED' ? (
                    <span className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded text-[10px] font-bold uppercase">Revoked</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded text-[10px] font-bold uppercase">Pending</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-[11px] uppercase text-gray-500 font-semibold tracking-wider mb-1">Authority Type</p>
                <p className="font-bold text-sm text-gray-100 mt-1">{c.authorityType || '—'}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-gray-500 font-semibold tracking-wider mb-1">Authority Age</p>
                <p className="font-bold text-sm text-gray-100 mt-1">{c.authorityAge || '—'}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-gray-500 font-semibold tracking-wider mb-1">Hazmat Certified</p>
                <p className="font-bold text-sm text-gray-100 mt-1">{c.hazmatStatus ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ INSURANCE & CARGO ══════════ */}
      <div className="bg-gray-900/60 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-xl py-md border-b border-gray-800 bg-gray-900/80 flex items-center gap-md">
          <span className="material-symbols-outlined text-orange-400">description</span>
          <h3 className="text-base font-semibold text-gray-100">Insurance & Cargo</h3>
        </div>
        <div className="p-xl space-y-lg">
          <div className="flex flex-wrap items-center gap-md">
            <p className="text-[11px] uppercase text-gray-500 font-semibold tracking-wider">Cargo Authorized:</p>
            {c.cargoTypes && c.cargoTypes.length > 0 ? (
              c.cargoTypes.map((t, i) => (
                <span key={i} className="px-3 py-1 bg-orange-500/10 text-orange-400 rounded text-xs font-semibold">{t}</span>
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
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-900 border-b border-gray-800">
                      <th className="text-left py-2 pr-4 text-gray-500 font-bold text-[11px] uppercase tracking-wider">Type</th>
                      <th className="text-left py-2 pr-4 text-gray-500 font-bold text-[11px] uppercase tracking-wider">Provider</th>
                      <th className="text-left py-2 pr-4 text-gray-500 font-bold text-[11px] uppercase tracking-wider">Coverage</th>
                      <th className="text-left py-2 pr-4 text-gray-500 font-bold text-[11px] uppercase tracking-wider">Expires</th>
                      <th className="text-left py-2 text-gray-500 font-bold text-[11px] uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.insurance.map((p, i) => (
                      <tr key={i} className="border-b border-gray-800/30 last:border-0">
                        <td className="py-3 pr-4 font-semibold text-gray-100">{p.policyType}</td>
                        <td className="py-3 pr-4 text-gray-400">{p.carrier}</td>
                        <td className="py-3 pr-4 text-gray-100 font-medium">{p.limit}</td>
                        <td className="py-3 pr-4 text-gray-400">{p.expiration}</td>
                        <td className="py-3">
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

          {(!c.insurance || c.insurance.length === 0) && (
            <p className="text-sm text-gray-400 italic">No insurance information on file</p>
          )}
        </div>
      </div>

      {/* ══════════ RISK SCORE BREAKDOWN ══════════ */}
      <div className="bg-gray-900/60 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-xl py-md border-b border-gray-800 bg-gray-900/80 flex items-center gap-md">
          <span className="material-symbols-outlined text-orange-400">analytics</span>
          <h3 className="text-base font-semibold text-gray-100">Risk Score Breakdown</h3>
        </div>
        <div className="p-xl">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-lg items-start">
            <div className="lg:col-span-2 flex flex-col items-center justify-center p-lg bg-gray-800/50 rounded-xl text-center">
              <div className={`w-32 h-32 rounded-full flex flex-col items-center justify-center shadow-lg mb-md ${c.riskScore >= 70 ? 'bg-green-500' : c.riskScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}>
                <span className="text-4xl font-bold text-white leading-none">{c.riskScore}</span>
                <span className="text-white/70 text-xs mt-0.5">/ 100</span>
              </div>
              <p className="text-sm font-bold text-gray-100">{scoreLabel}</p>
            </div>

            <div className="lg:col-span-3 space-y-2">
              {c.riskBreakdown && c.riskBreakdown.length > 0 ? (
                <>
                  {c.riskBreakdown.map((f, i) => (
                    <div key={i} className="flex items-center justify-between py-2 px-4 rounded-lg bg-gray-800/50">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${f.impact >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className="text-sm font-medium text-gray-100">{f.factor}</span>
                        <span className="text-xs text-gray-400 hidden sm:inline truncate">{f.description}</span>
                      </div>
                      <span className={`text-sm font-bold shrink-0 ml-2 ${f.impact >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {f.impact >= 0 ? '+' : ''}{f.impact}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-orange-500/10 border border-orange-500/30 mt-3">
                    <span className="font-bold text-gray-100">Total Risk Score</span>
                    <span className={`text-xl font-bold ${c.riskScore >= 70 ? 'text-green-400' : c.riskScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {c.riskScore}/100
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-400">Score: {c.riskScore}/100</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ PAGE FOOTER ══════════ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-md pt-md border-t border-gray-800/50">
        <div className="flex flex-wrap items-center gap-x-lg gap-y-1 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">schedule</span>
            Last updated: {formatDate(c.lastUpdated)}
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">database</span>
            Data source: {c.dataSource}
          </span>
        </div>
        <Link href="/search" className="text-orange-400 text-sm font-medium hover:underline flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Search
        </Link>
      </div>
    </div>
  );
}
