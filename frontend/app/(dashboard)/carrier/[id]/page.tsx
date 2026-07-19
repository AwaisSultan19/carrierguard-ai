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
      <div className="flex-1 p-gutter space-y-lg max-w-7xl mx-auto w-full">
        <div className="flex gap-lg items-start">
          <div className="w-20 h-20 rounded-xl skeleton"></div>
          <div className="flex-1 space-y-2">
            <div className="h-8 w-72 skeleton rounded-lg"></div>
            <div className="h-5 w-48 skeleton rounded-lg"></div>
          </div>
        </div>
        <div className="grid grid-cols-12 gap-lg">
          <div className="col-span-12 lg:col-span-8 space-y-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              <div className="h-64 skeleton rounded-xl"></div>
              <div className="h-64 skeleton rounded-xl"></div>
            </div>
            <div className="h-48 skeleton rounded-xl"></div>
          </div>
          <div className="col-span-12 lg:col-span-4 space-y-lg">
            <div className="h-80 skeleton rounded-xl"></div>
            <div className="h-48 skeleton rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-gutter max-w-7xl mx-auto w-full">
        <div className="border border-outline-variant rounded-xl bg-surface-container-lowest p-xl flex flex-col items-center text-center max-w-lg mx-auto">
          <div className="w-14 h-14 bg-error-container rounded-2xl flex items-center justify-center mb-md shadow-md">
            <span className="material-symbols-outlined text-error text-2xl">error_outline</span>
          </div>
          <h3 className="text-lg font-bold text-on-surface mb-1">Carrier Not Found</h3>
          <p className="text-sm text-on-surface-variant mb-md">{error}</p>
          <Link href="/search" className="text-sm text-primary font-semibold hover:underline inline-flex items-center gap-1">
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
  const scoreBg = c.riskScore >= 70 ? 'bg-green-50' : c.riskScore >= 40 ? 'bg-yellow-50' : 'bg-red-50';

  const recStyle = (() => {
    switch (c.recommendation) {
      case 'Approve': return { bg: 'bg-green-500', text: 'text-green-700', bgLight: 'bg-green-50', border: 'border-green-200', icon: 'check_circle' };
      case 'Review': return { bg: 'bg-yellow-500', text: 'text-yellow-700', bgLight: 'bg-yellow-50', border: 'border-yellow-200', icon: 'rate_review' };
      case 'Reject': return { bg: 'bg-red-500', text: 'text-red-700', bgLight: 'bg-red-50', border: 'border-red-200', icon: 'cancel' };
      default: return { bg: 'bg-gray-500', text: 'text-gray-700', bgLight: 'bg-gray-50', border: 'border-gray-200', icon: 'help' };
    }
  })();

  const initials = c.legalName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  const formatDate = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }); }
    catch { return dateStr; }
  };

  return (
    <div className="flex-1 p-gutter space-y-lg max-w-7xl mx-auto w-full">

      {/* ══════════ HEADER ══════════ */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-md border-b border-outline-variant pb-lg">
        <div className="flex gap-lg items-start">
          <div className="w-20 h-20 rounded-xl bg-primary-container flex items-center justify-center text-white text-3xl font-bold shadow-lg shrink-0">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-sm mb-xs flex-wrap">
              <h2 className="font-h1 text-h1 text-on-surface">{c.legalName}</h2>
              {c.authorityStatus === 'ACTIVE' ? (
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  ACTIVE
                </span>
              ) : (
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">block</span>
                  {c.authorityStatus}
                </span>
              )}
            </div>
            {c.dbaName !== c.legalName && (
              <p className="text-body-sm text-on-surface-variant mb-1">DBA: {c.dbaName}</p>
            )}
            <div className="flex items-center gap-md text-on-surface-variant font-body-sm flex-wrap">
              <span className="bg-surface-variant px-2 py-0.5 rounded font-semibold">DOT: {c.dotNumber || '—'}</span>
              <span className="bg-surface-variant px-2 py-0.5 rounded font-semibold">MC: {c.mcNumber || '—'}</span>
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">location_on</span> {c.city}, {c.state}</span>
              {c.phone && (
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">call</span> {c.phone}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-sm">
          <a href={getPdfDownloadUrl(c.dotNumber)} target="_blank" rel="noopener noreferrer"
              className="px-md py-2 border border-outline-variant rounded-lg font-label-md text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
            Export PDF
          </a>
        </div>
      </section>

      {/* ══════════ RISK SCORE + AI INSIGHT ══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-xl flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-1 h-full ${c.riskScore >= 70 ? 'bg-green-500' : c.riskScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
          <h3 className="font-label-sm text-on-surface-variant uppercase tracking-widest mb-md">Aggregate Risk Score</h3>

          <div className="relative w-40 h-40 flex items-center justify-center mb-md">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle className="text-surface-variant" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeWidth="8"></circle>
              <circle className={`risk-gauge ${scoreColor}`} cx="50" cy="50" fill="transparent" r="40" stroke="currentColor"
                strokeDasharray="251.2" strokeDashoffset={dashOffset} strokeLinecap="round" strokeWidth="8"></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-on-surface text-4xl font-bold">{c.riskScore}</span>
              <span className={`font-label-sm ${scoreColor}`}>{scoreLabel}</span>
            </div>
          </div>

          <div className={`inline-flex items-center gap-1 px-4 py-1.5 rounded-full border font-bold text-sm ${recStyle.bgLight} ${recStyle.text} ${recStyle.border}`}>
            <span className="material-symbols-outlined text-lg">{recStyle.icon}</span>
            {c.recommendation}
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-xl flex flex-col relative overflow-hidden">
          <div className="flex items-center gap-2 mb-md">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
            <h3 className="font-h3 text-h3 text-on-surface">AI Compliance Insight</h3>
          </div>
          <p className="font-body-md text-on-surface-variant leading-relaxed">{c.aiSummary}</p>

          <div className="flex flex-wrap items-center gap-x-lg gap-y-1 mt-auto pt-4 border-t border-outline-variant/50 mt-4">
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

      {/* ══════════ SAFETY & COMPLIANCE ══════════ */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
        <div className="px-xl py-md border-b border-outline-variant bg-surface-container flex items-center gap-md">
          <span className="material-symbols-outlined text-primary">shield</span>
          <h3 className="font-h3 text-h3 font-semibold text-on-surface">Safety & Compliance</h3>
        </div>
        <div className="p-xl space-y-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-lg">
            <div className="text-center p-lg bg-surface-container rounded-xl">
              <p className="text-[11px] uppercase text-outline font-bold tracking-wider mb-1">Safety Rating</p>
              <p className={`font-bold text-xl ${c.safetyRating === 'Satisfactory' ? 'text-green-600' : c.safetyRating === 'Conditional' ? 'text-yellow-600' : 'text-red-600'}`}>
                {c.safetyRating}
              </p>
              <p className="text-[10px] text-outline mt-1">{c.safetyRatingDate}</p>
            </div>
            <div className="text-center p-lg bg-surface-container rounded-xl">
              <p className="text-[11px] uppercase text-outline font-bold tracking-wider mb-1">Inspections</p>
              <p className="font-bold text-xl text-on-surface">{c.inspections || 0}</p>
              <p className="text-[10px] text-outline mt-1">{c.vehicleInspections || 0} vehicle / {c.driverInspections || 0} driver</p>
            </div>
            <div className="text-center p-lg bg-surface-container rounded-xl">
              <p className="text-[11px] uppercase text-outline font-bold tracking-wider mb-1">Violations</p>
              <p className="font-bold text-xl text-on-surface">{c.violations || 0}</p>
              <p className="text-[10px] text-outline mt-1">
                {c.inspections > 0 ? `${Math.round(((c.inspections - (c.violations || 0)) / c.inspections) * 100)}% clean rate` : 'on record'}
              </p>
            </div>
            <div className="text-center p-lg bg-surface-container rounded-xl">
              <p className="text-[11px] uppercase text-outline font-bold tracking-wider mb-1">Crashes (24mo)</p>
              <p className="font-bold text-xl text-on-surface">{c.crashTotal || 0}</p>
              <p className="text-[10px] text-outline mt-1">
                {c.crashTotal === 0 ? 'No reported incidents' : `${c.fatalCrashes} fatal · ${c.injuryCrashes} injury · ${c.towCrashes} tow`}
              </p>
            </div>
          </div>

          <div className="bg-surface-container rounded-xl p-lg">
            <p className="text-[11px] uppercase text-outline font-bold tracking-wider mb-3">Out-of-Service Rates</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-md mb-3">
              <div>
                <p className="text-body-sm text-on-surface-variant">Vehicle OOS</p>
                <p className="font-bold text-lg text-on-surface">{c.vehicleOOSRate || '—'}</p>
              </div>
              <div>
                <p className="text-body-sm text-on-surface-variant">Driver OOS</p>
                <p className="font-bold text-lg text-on-surface">{c.driverOOSRate || '—'}</p>
              </div>
              <div>
                <p className="text-body-sm text-on-surface-variant">National Avg (Vehicle)</p>
                <p className="font-bold text-lg text-on-surface">{c.outOfServiceNationalAvg || '—'}</p>
              </div>
            </div>
            {c.oosComparison && (
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${c.oosComparison.includes('Below') ? 'bg-green-50 text-green-700' : c.oosComparison.includes('Above') ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'}`}>
                <span className="material-symbols-outlined text-sm">{c.oosComparison.includes('Below') ? 'arrow_downward' : c.oosComparison.includes('Above') ? 'arrow_upward' : 'remove'}</span>
                {c.oosComparison}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════ FLEET & AUTHORITY ══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
          <div className="px-xl py-md border-b border-outline-variant bg-surface-container flex items-center gap-md">
            <span className="material-symbols-outlined text-primary">local_shipping</span>
            <h3 className="font-h3 text-h3 font-semibold text-on-surface">Fleet Info</h3>
          </div>
          <div className="p-xl">
            <div className="grid grid-cols-2 gap-lg">
              <div>
                <p className="text-[11px] uppercase text-outline font-bold tracking-wider mb-1">Fleet Size</p>
                <p className="font-bold text-xl text-on-surface">{c.powerUnits > 0 ? `${c.powerUnits} units` : 'N/A'}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-outline font-bold tracking-wider mb-1">Drivers</p>
                <p className="font-bold text-xl text-on-surface">{c.drivers > 0 ? c.drivers : 'N/A'}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-outline font-bold tracking-wider mb-1">Operation Type</p>
                <p className="font-bold text-sm text-on-surface">{c.operationType || '—'}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-outline font-bold tracking-wider mb-1">Fleet Ratio</p>
                <p className="font-bold text-sm text-on-surface">
                  {c.powerUnits > 0 && c.drivers > 0
                    ? `${(c.drivers / c.powerUnits).toFixed(1)} drivers per unit`
                    : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
          <div className="px-xl py-md border-b border-outline-variant bg-surface-container flex items-center gap-md">
            <span className="material-symbols-outlined text-primary">verified</span>
            <h3 className="font-h3 text-h3 font-semibold text-on-surface">Authority Details</h3>
          </div>
          <div className="p-xl">
            <div className="grid grid-cols-2 gap-lg">
              <div>
                <p className="text-[11px] uppercase text-outline font-bold tracking-wider mb-1">Operating Status</p>
                <div className="mt-1">
                  {c.authorityStatus === 'ACTIVE' ? (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold uppercase">Active</span>
                  ) : c.authorityStatus === 'NOT_AUTHORIZED' ? (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold uppercase">Not Authorized</span>
                  ) : c.authorityStatus === 'OUT_OF_SERVICE' ? (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold uppercase">Out of Service</span>
                  ) : c.authorityStatus === 'REVOKED' ? (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold uppercase">Revoked</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-[10px] font-bold uppercase">Pending</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-[11px] uppercase text-outline font-bold tracking-wider mb-1">Authority Type</p>
                <p className="font-bold text-sm text-on-surface mt-1">{c.authorityType || '—'}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-outline font-bold tracking-wider mb-1">Authority Age</p>
                <p className="font-bold text-sm text-on-surface mt-1">{c.authorityAge || '—'}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-outline font-bold tracking-wider mb-1">Hazmat Certified</p>
                <p className="font-bold text-sm text-on-surface mt-1">{c.hazmatStatus ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ INSURANCE & CARGO ══════════ */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
        <div className="px-xl py-md border-b border-outline-variant bg-surface-container flex items-center gap-md">
          <span className="material-symbols-outlined text-primary">description</span>
          <h3 className="font-h3 text-h3 font-semibold text-on-surface">Insurance & Cargo</h3>
        </div>
        <div className="p-xl space-y-lg">
          <div className="flex flex-wrap items-center gap-md">
            <p className="text-[11px] uppercase text-outline font-bold tracking-wider">Cargo Authorized:</p>
            {c.cargoTypes && c.cargoTypes.length > 0 ? (
              c.cargoTypes.map((t, i) => (
                <span key={i} className="px-3 py-1 bg-primary-container/30 text-primary rounded text-xs font-semibold">{t}</span>
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
              <p className="text-[11px] uppercase text-outline font-bold tracking-wider mb-3">Insurance Policies</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant/50">
                      <th className="text-left py-2 pr-4 text-outline font-bold text-[11px] uppercase tracking-wider">Type</th>
                      <th className="text-left py-2 pr-4 text-outline font-bold text-[11px] uppercase tracking-wider">Provider</th>
                      <th className="text-left py-2 pr-4 text-outline font-bold text-[11px] uppercase tracking-wider">Coverage</th>
                      <th className="text-left py-2 pr-4 text-outline font-bold text-[11px] uppercase tracking-wider">Expires</th>
                      <th className="text-left py-2 text-outline font-bold text-[11px] uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.insurance.map((p, i) => (
                      <tr key={i} className="border-b border-outline-variant/30 last:border-0">
                        <td className="py-3 pr-4 font-semibold text-on-surface">{p.policyType}</td>
                        <td className="py-3 pr-4 text-on-surface-variant">{p.carrier}</td>
                        <td className="py-3 pr-4 text-on-surface font-medium">{p.limit}</td>
                        <td className="py-3 pr-4 text-on-surface-variant">{p.expiration}</td>
                        <td className="py-3">
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

          {(!c.insurance || c.insurance.length === 0) && (
            <p className="text-body-sm text-on-surface-variant italic">No insurance information on file</p>
          )}
        </div>
      </div>

      {/* ══════════ RISK SCORE BREAKDOWN ══════════ */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
        <div className="px-xl py-md border-b border-outline-variant bg-surface-container flex items-center gap-md">
          <span className="material-symbols-outlined text-primary">analytics</span>
          <h3 className="font-h3 text-h3 font-semibold text-on-surface">Risk Score Breakdown</h3>
        </div>
        <div className="p-xl">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-lg items-start">
            <div className="lg:col-span-2 flex flex-col items-center justify-center p-lg bg-surface-container rounded-xl text-center">
              <div className={`w-32 h-32 rounded-full flex flex-col items-center justify-center shadow-lg mb-md ${c.riskScore >= 70 ? 'bg-green-500' : c.riskScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}>
                <span className="text-4xl font-bold text-white leading-none">{c.riskScore}</span>
                <span className="text-white/70 text-xs mt-0.5">/ 100</span>
              </div>
              <p className="text-sm font-bold text-on-surface">{scoreLabel}</p>
            </div>

            <div className="lg:col-span-3 space-y-2">
              {c.riskBreakdown && c.riskBreakdown.length > 0 ? (
                <>
                  {c.riskBreakdown.map((f, i) => (
                    <div key={i} className="flex items-center justify-between py-2 px-4 rounded-lg bg-surface-container">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${f.impact >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className="text-sm font-medium text-on-surface">{f.factor}</span>
                        <span className="text-xs text-on-surface-variant hidden sm:inline truncate">{f.description}</span>
                      </div>
                      <span className={`text-sm font-bold shrink-0 ml-2 ${f.impact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {f.impact >= 0 ? '+' : ''}{f.impact}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-primary-container/20 border border-primary-container/30 mt-3">
                    <span className="font-bold text-on-surface">Total Risk Score</span>
                    <span className={`text-xl font-bold ${c.riskScore >= 70 ? 'text-green-600' : c.riskScore >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {c.riskScore}/100
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-body-sm text-on-surface-variant">Score: {c.riskScore}/100</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ PAGE FOOTER ══════════ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-md pt-md border-t border-outline-variant/50">
        <div className="flex flex-wrap items-center gap-x-lg gap-y-1 text-xs text-outline">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">schedule</span>
            Last updated: {formatDate(c.lastUpdated)}
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">database</span>
            Data source: {c.dataSource}
          </span>
        </div>
        <Link href="/search" className="text-primary font-label-md hover:underline flex items-center gap-1 text-sm">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Search
        </Link>
      </div>
    </div>
  );
}
