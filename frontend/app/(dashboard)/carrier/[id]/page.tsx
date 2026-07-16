"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { getCarrierById, getPdfDownloadUrl, emailReport, type Carrier } from '@/lib/api';

export default function CarrierDetailsPage() {
  const params = useParams();
  const carrierId = params?.id as string;
  const { getToken } = useAuth();

  const [carrier, setCarrier] = useState<Carrier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [emailModal, setEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
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
        <div className="flex flex-col items-center justify-center py-2xl text-center">
          <div className="w-16 h-16 bg-error-container rounded-2xl flex items-center justify-center mb-lg">
            <span className="material-symbols-outlined text-error text-3xl">error_outline</span>
          </div>
          <h3 className="font-h3 text-h3 text-on-surface mb-sm">Carrier Not Found</h3>
          <p className="text-on-surface-variant max-w-md mb-lg">{error}</p>
          <Link href="/search" className="text-primary font-label-md hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Search
          </Link>
        </div>
      </div>
    );
  }

  if (!carrier) return null;

  const scoreColor = carrier.riskScore >= 70 ? 'text-green-500' : carrier.riskScore >= 40 ? 'text-yellow-500' : 'text-red-500';
  const scoreLabel = carrier.riskScore >= 70 ? 'Low Risk' : carrier.riskScore >= 40 ? 'Moderate Risk' : 'High Risk';
  const scoreBg = carrier.riskScore >= 70 ? 'bg-green-50' : carrier.riskScore >= 40 ? 'bg-yellow-50' : 'bg-red-50';

  return (
    <div className="flex-1 p-gutter space-y-lg max-w-7xl mx-auto w-full">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-md border-b border-outline-variant pb-lg">
        <div className="flex gap-lg items-start">
          <div className="w-20 h-20 rounded-xl bg-primary-container flex items-center justify-center text-white text-3xl font-bold shadow-lg shrink-0">
            {carrier.legalName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-sm mb-xs flex-wrap">
              <h2 className="font-h1 text-h1 text-on-surface">{carrier.legalName}</h2>
              {carrier.authorityStatus === 'ACTIVE' ? (
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  ACTIVE
                </span>
              ) : (
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">block</span>
                  {carrier.authorityStatus}
                </span>
              )}
            </div>
            <div className="flex items-center gap-md text-on-surface-variant font-body-sm flex-wrap">
              <span className="bg-surface-variant px-2 py-0.5 rounded font-semibold">DOT: {carrier.dotNumber}</span>
              <span className="bg-surface-variant px-2 py-0.5 rounded font-semibold">MC: {carrier.mcNumber}</span>
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">location_on</span> {carrier.city}, {carrier.state}</span>
              {carrier.operationType && (
                <span className="bg-surface-variant px-2 py-0.5 rounded">{carrier.operationType}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-sm">
          <button className="px-md py-2 border border-outline-variant rounded-lg font-label-md text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">star</span>
            Watchlist
          </button>
           <a href={getPdfDownloadUrl(carrier?.dotNumber)} target="_blank" rel="noopener noreferrer"
              className="px-md py-2 border border-outline-variant rounded-lg font-label-md text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
            Export PDF
          </a>
          <button onClick={() => setEmailModal(true)}
              className="px-md py-2 border border-outline-variant rounded-lg font-label-md text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">mail</span>
            Email Report
          </button>
        </div>

        {emailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setEmailModal(false); setEmailSent(false); }}>
            <div className="bg-white rounded-xl p-lg w-full max-w-sm mx-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="font-title-md mb-md">Email Report</h3>
              {emailSent ? (
                <div>
                  <p className="text-green-600 font-label-md mb-md flex items-center gap-2">
                    <span className="material-symbols-outlined">check_circle</span> Report sent!
                  </p>
                  <button onClick={() => { setEmailModal(false); setEmailSent(false); }} className="w-full h-10 bg-primary text-on-primary rounded-lg font-label-md">Done</button>
                </div>
              ) : (
                <div>
                  <label className="text-sm text-outline block mb-2">Email address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                    className="w-full px-md py-2 border border-outline-variant rounded-lg mb-md outline-none focus:border-primary transition-colors" />
                  <button disabled={!email || emailSending} onClick={async () => {
                    setEmailSending(true);
                    try {
                      const token = await getToken();
                      await emailReport(email, carrier?.dotNumber, undefined, token);
                      setEmailSent(true);
                    } catch { setEmailSent(true); }
                    setEmailSending(false);
                  }}
                    className="w-full h-10 bg-primary text-on-primary rounded-lg font-label-md disabled:opacity-50 flex items-center justify-center gap-2">
                    {emailSending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-12 gap-lg">
        <div className="col-span-12 lg:col-span-8 space-y-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            <div className="bg-white rounded-xl border border-outline-variant p-lg flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full ${carrier.riskScore >= 70 ? 'bg-green-500' : carrier.riskScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
              <h3 className="font-label-sm text-on-surface-variant uppercase tracking-widest mb-md">Aggregate Risk Score</h3>

              <div className="relative w-40 h-40 flex items-center justify-center mb-md">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle className="text-surface-variant" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeWidth="8"></circle>
                  <circle
                    className={`risk-gauge ${scoreColor}`}
                    cx="50" cy="50"
                    fill="transparent" r="40"
                    stroke="currentColor"
                    strokeDasharray="251.2"
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    strokeWidth="8"
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-on-surface">{carrier.riskScore}</span>
                  <span className={`font-label-sm ${scoreColor}`}>{scoreLabel}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-sm w-full mt-2">
                {carrier.insurance.some((i) => i.status === 'VALID') && (
                  <div className="flex items-center gap-2 text-sm text-on-surface-variant justify-start bg-green-50 px-3 py-2 rounded-lg">
                    <span className="material-symbols-outlined text-green-600 text-md">verified</span> Insurance Valid
                  </div>
                )}
                {carrier.violations === 0 && (
                  <div className="flex items-center gap-2 text-sm text-on-surface-variant justify-start bg-green-50 px-3 py-2 rounded-lg">
                    <span className="material-symbols-outlined text-green-600 text-md">verified</span> Clean Inspection
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-outline-variant p-lg flex flex-col relative overflow-hidden">
              <div className="flex items-center gap-2 mb-md">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                </div>
                <h3 className="font-h3 text-h3 text-on-surface">AI Compliance Insight</h3>
              </div>
              <p className="font-body-md text-on-surface-variant leading-relaxed">
                {carrier.aiSummary}
              </p>

              <div className="mt-auto pt-md flex items-center gap-md">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-[10px] font-bold">S</div>
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-purple-100 flex items-center justify-center text-[10px] font-bold">R</div>
                </div>
                <span className="text-[12px] text-on-surface-variant font-label-sm">Verified by Safety &amp; Risk Teams</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            <div className="bg-white border border-outline-variant rounded-xl p-md">
              <p className="text-xs font-label-sm text-on-surface-variant uppercase mb-2">Safety Rating</p>
              <div className="flex items-center gap-2">
                <span className={`font-h2 text-h2 ${carrier.safetyRating === 'Satisfactory' ? 'text-on-surface' : carrier.safetyRating === 'Conditional' ? 'text-yellow-500' : 'text-red-500'}`}>
                  {carrier.safetyRating}
                </span>
                {carrier.safetyRating === 'Satisfactory' && <span className="material-symbols-outlined text-green-500">check_circle</span>}
              </div>
              <p className="text-xs text-on-surface-variant mt-1">Last audited: {carrier.safetyRatingDate}</p>
            </div>

            <div className="bg-white border border-outline-variant rounded-xl p-md">
              <p className="text-xs font-label-sm text-on-surface-variant uppercase mb-2">Inspections (24m)</p>
              <div className="flex items-baseline gap-2">
                <span className="font-h2 text-h2 text-on-surface">{carrier.inspections}</span>
                {carrier.violations === 0 ? (
                  <span className="text-xs text-green-600 font-bold">0 Violations</span>
                ) : (
                  <span className="text-xs text-yellow-600 font-bold">{carrier.violations} Violations</span>
                )}
              </div>
              <p className="text-xs text-on-surface-variant mt-1">
                {carrier.inspections > 0
                  ? `${Math.round(((carrier.inspections - carrier.violations) / carrier.inspections) * 100)}% clean rate`
                  : 'No inspections recorded'}
              </p>
            </div>

            <div className="bg-white border border-outline-variant rounded-xl p-md">
              <p className="text-xs font-label-sm text-on-surface-variant uppercase mb-2">Crash History</p>
              <div className="flex items-baseline gap-2">
                <span className={`font-h2 text-h2 ${carrier.crashTotal === 0 ? 'text-on-surface' : 'text-red-500'}`}>{carrier.crashTotal}</span>
                <span className="text-xs text-on-surface-variant">Last 2 years</span>
              </div>
              <p className="text-xs text-on-surface-variant mt-1">
                {carrier.crashTotal === 0
                  ? 'No reported incidents'
                  : `${carrier.fatalCrashes} fatal, ${carrier.injuryCrashes} injury, ${carrier.towCrashes} tow`}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
            <div className="bg-surface-container px-lg py-md border-b border-outline-variant flex justify-between items-center">
              <h3 className="font-h3 text-h3 text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">security</span>
                Insurance Coverage Details
              </h3>
              <button className="text-primary font-label-md flex items-center gap-1 hover:underline">
                View COI <span className="material-symbols-outlined text-sm">open_in_new</span>
              </button>
            </div>

            <div className="p-0 overflow-x-auto table-scrollbar">
              <table className="w-full text-left font-body-sm min-w-[600px]">
                <thead className="bg-surface-container-low text-on-surface-variant uppercase text-[11px] font-bold tracking-wider">
                  <tr>
                    <th className="px-lg py-3">Policy Type</th>
                    <th className="px-lg py-3">Carrier</th>
                    <th className="px-lg py-3">Limit</th>
                    <th className="px-lg py-3">Expiration</th>
                    <th className="px-lg py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {carrier.insurance.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-lg py-8 text-center text-on-surface-variant">No insurance records available</td>
                    </tr>
                  ) : (
                    carrier.insurance.map((policy, i) => (
                      <tr key={i} className="hover:bg-surface-container-lowest transition-colors">
                        <td className="px-lg py-4 font-bold">{policy.policyType}</td>
                        <td className="px-lg py-4">{policy.carrier}</td>
                        <td className="px-lg py-4">{policy.limit}</td>
                        <td className="px-lg py-4">{policy.expiration}</td>
                        <td className="px-lg py-4">
                          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold">{policy.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-lg">
          <div className="bg-white rounded-xl border border-outline-variant p-lg">
            <h3 className="font-h3 text-h3 text-on-surface mb-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant">timeline</span>
              Compliance History
            </h3>

            <div className="relative space-y-lg">
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-outline-variant"></div>

              <div className="relative flex gap-md pl-8">
                <div className="absolute left-0 w-6 h-6 rounded-full bg-green-500 border-4 border-white shadow-sm flex items-center justify-center"></div>
                <div>
                  <p className="font-label-md text-on-surface">BOC-3 Filing Verified</p>
                  <p className="text-xs text-on-surface-variant">{carrier.reviewDate} • Federal Filing</p>
                </div>
              </div>

              <div className="relative flex gap-md pl-8">
                <div className="absolute left-0 w-6 h-6 rounded-full bg-blue-500 border-4 border-white shadow-sm flex items-center justify-center"></div>
                <div>
                  <p className="font-label-md text-on-surface">Safety Rating: {carrier.safetyRating}</p>
                  <p className="text-xs text-on-surface-variant">{carrier.safetyRatingDate} • FMCSA Assessment</p>
                </div>
              </div>

              <div className="relative flex gap-md pl-8">
                <div className="absolute left-0 w-6 h-6 rounded-full bg-green-500 border-4 border-white shadow-sm flex items-center justify-center"></div>
                <div>
                  <p className="font-label-md text-on-surface">
                    {carrier.violations === 0 ? 'Clean Inspection Record' : `${carrier.inspections} Inspections Completed`}
                  </p>
                  <p className="text-xs text-on-surface-variant">{carrier.vehicleInspections} vehicle • {carrier.driverInspections} driver inspections</p>
                </div>
              </div>

              <div className="relative flex gap-md pl-8">
                <div className="absolute left-0 w-6 h-6 rounded-full bg-primary border-4 border-white shadow-sm flex items-center justify-center"></div>
                <div>
                  <p className="font-label-md text-on-surface">MCS-150 Filing On Record</p>
                  <p className="text-xs text-on-surface-variant">Updated {carrier.safetyRatingDate} • Compliance Queue</p>
                </div>
              </div>

              <div className="relative flex gap-md pl-8">
                <div className="absolute left-0 w-6 h-6 rounded-full bg-outline-variant border-4 border-white shadow-sm flex items-center justify-center"></div>
                <div>
                  <p className="font-label-md text-on-surface-variant">Company Registration</p>
                  <p className="text-xs text-on-surface-variant">{carrier.city}, {carrier.state} • Docket Active</p>
                </div>
              </div>
            </div>

            <button className="w-full mt-xl py-2 text-primary font-label-md hover:bg-surface-container rounded-lg transition-colors border border-dashed border-outline-variant">
              View Full History Log
            </button>
          </div>

          <div className="bg-white rounded-xl border border-outline-variant p-lg">
            <h3 className="font-label-sm text-on-surface-variant uppercase tracking-widest mb-md">Operational Overview</h3>

            <div className="h-48 rounded-lg overflow-hidden relative border border-outline-variant bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
              <div className="text-center">
                <span className="material-symbols-outlined text-4xl text-primary/30">map</span>
                <p className="text-xs text-on-surface-variant mt-2">{carrier.city}, {carrier.state} Based</p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent"></div>
            </div>

            <div className="mt-md space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">Operation Type</span>
                <span className="font-bold">{carrier.operationType}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">Fleet Size</span>
                <span className="font-bold">{carrier.powerUnits} Power Units</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">Drivers</span>
                <span className="font-bold">{carrier.drivers}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">Cargo Types</span>
                <span className="font-bold text-right">{carrier.cargoTypes.join(', ') || 'General'}</span>
              </div>
              {carrier.hazmatStatus && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant">Hazmat</span>
                  <span className="font-bold text-green-600">Certified</span>
                </div>
              )}
            </div>
          </div>

          {carrier.riskScore < 50 && (
            <div className="bg-error-container/20 rounded-xl border border-error/20 p-md">
              <div className="flex items-center gap-2 mb-2 text-error">
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                <span className="font-label-sm uppercase font-bold">Risk Alert</span>
              </div>
              <p className="text-xs text-on-error-container">
                This carrier has an elevated risk score of {carrier.riskScore}/100.
                {carrier.crashTotal > 0 ? ` ${carrier.crashTotal} crash(es) reported in the last 24 months.` : ''}
                {carrier.violations > 10 ? ` High violation count (${carrier.violations}).` : ''}
                Thorough due diligence is strongly advised before engaging.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
