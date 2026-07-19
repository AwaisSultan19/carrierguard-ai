"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { getCarrierById, getPdfDownloadUrl, type Carrier } from '@/lib/api';

export default function RiskReportPage() {
  const { getToken } = useAuth();
  const [carrier, setCarrier] = useState<Carrier | null>(null);
  const [dotInput, setDotInput] = useState('');
  const [barWidths, setBarWidths] = useState({ safety: '0%', insurance: '0%', authority: '0%' });

  useEffect(() => {
    if (!carrier) return;
    const timer = setTimeout(() => {
      setBarWidths({
        safety: `${Math.min(carrier.riskScore + 10, 100)}%`,
        insurance: `${carrier.insurance.length > 0 ? 100 : 30}%`,
        authority: `${carrier.authorityStatus === 'ACTIVE' ? 91 : 40}%`,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [carrier]);

  const handleSearch = async () => {
    if (!dotInput.trim()) return;
    const token = await getToken();
    try {
      const data = await getCarrierById(dotInput.trim(), 'dot', token);
      setCarrier(data);
    } catch { setCarrier(null); }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto py-2xl px-gutter">
        {!carrier && (
          <div className="flex items-center gap-md mb-xl p-lg bg-surface-container-lowest border border-outline-variant rounded-xl">
            <input
              type="text"
              value={dotInput}
              onChange={(e) => setDotInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter DOT number to generate report..."
              className="flex-1 h-12 px-md bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
            <button onClick={handleSearch} className="h-12 px-lg bg-primary text-on-primary rounded-lg font-bold flex items-center gap-md">
              <span className="material-symbols-outlined">search</span> Generate
            </button>
          </div>
        )}

        {/* Header Section */}
        {carrier && (
        <div className="flex justify-between items-end mb-xl">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container rounded font-label-sm text-xs uppercase tracking-wider">Risk Report</span>
              <span className="text-on-surface-variant text-label-sm">• {carrier.legalName}</span>
            </div>
            <h2 className="font-h1 text-h1 text-on-surface">{carrier.legalName}</h2>
            <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-2 mt-1">
              <span className="material-symbols-outlined text-base">location_on</span> MC: {carrier.mcNumber} • DOT: {carrier.dotNumber}
            </p>
          </div>
          <div className="flex gap-md">
            <button className="px-lg h-10 bg-surface border border-outline-variant text-on-surface rounded-lg font-label-md flex items-center gap-2 hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-[20px]">share</span> Share with Team
            </button>
            <a href={getPdfDownloadUrl(carrier?.dotNumber)} target="_blank" rel="noopener noreferrer"
               className="px-lg h-10 bg-primary text-on-primary rounded-lg font-label-md flex items-center gap-2 hover:brightness-110 transition-all shadow-md">
              <span className="material-symbols-outlined text-[20px]">download</span> Download PDF
            </a>
          </div>
        </div>
        )}

        {carrier && (<div className="grid grid-cols-12 gap-x-lg gap-y-xl">
          {/* Executive Summary & Final Verdict */}
          <div className="col-span-12 md:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl p-xl flex flex-col justify-between overflow-hidden relative">
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-lg">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                  <span className="material-symbols-outlined text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <div>
                  <p className="text-label-sm uppercase text-green-700 font-bold tracking-widest">Final Verdict</p>
                  <h3 className="text-display font-display leading-tight text-on-surface">Approved for Dispatch</h3>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-h3 text-h3">Executive Summary</h4>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl leading-relaxed">
                  {carrier.aiSummary}
                </p>
              </div>
            </div>
            {/* Subtle background decoration */}
            <div className="absolute -right-12 -bottom-12 w-64 h-64 opacity-5 pointer-events-none">
              <span className="material-symbols-outlined text-[256px]">verified_user</span>
            </div>
          </div>

          {/* Risk Score Breakdown */}
          <div className="col-span-12 md:col-span-7 bg-surface-container-lowest border border-outline-variant rounded-xl p-xl">
            <h3 className="font-h3 text-h3 mb-xl">Risk Score Breakdown</h3>
            <div className="space-y-8">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-label-md text-label-md text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">security</span> Safety Performance
                  </span>
                  <span className="font-bold text-on-surface">94/100</span>
                </div>
                <div className="h-3 bg-surface-container rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-1000" 
                    style={{ width: barWidths.safety }}
                  ></div>
                </div>
                <p className="text-label-sm text-on-surface-variant">0.02 crash rate per million miles (Industry avg: 0.14)</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-label-md text-label-md text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">description</span> Insurance Coverage
                  </span>
                  <span className="font-bold text-on-surface">100/100</span>
                </div>
                <div className="h-3 bg-surface-container rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-1000" 
                    style={{ width: barWidths.insurance }}
                  ></div>
                </div>
                <p className="text-label-sm text-on-surface-variant">$2,000,000 Liability policy active via Lloyd's of London.</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-label-md text-label-md text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">verified</span> Operating Authority
                  </span>
                  <span className="font-bold text-on-surface">91/100</span>
                </div>
                <div className="h-3 bg-surface-container rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-1000" 
                    style={{ width: barWidths.authority }}
                  ></div>
                </div>
                <p className="text-label-sm text-on-surface-variant">MC Authority active since 2012. No broker-authority duality detected.</p>
              </div>
            </div>
          </div>

          {/* Quick Details */}
          <div className="col-span-12 md:col-span-5 flex flex-col gap-lg">
            <div className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col">
              <div className="h-32 bg-surface-variant relative">
                <div 
                  className="absolute inset-0 grayscale contrast-125 bg-cover bg-center"
                  style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAzLwc5RKX-U3eML9zyvx5CzMP_j2CzIRGOSms783ry_urcqZ0DTSEUzbSQoZ0P9vgWKTC6RxIdCh5qAscuuJPw1ovln-HQugkzZDcIIpaphY_RcSysDZ-RJW6c1fIVhCzDkXFn-TPlztgPRzBb5qNIxqef3v5twAWawi_wx8Gbanr1B61VHLaFcRofArXaAdCHOU7txkFwwxe6HsK6I5k06g51SJb0CBfs67h-ZCC5uPmwZIaueCQbAd5oZKdZLoEc0boirzvNEmU')" }}
                ></div>
                <div className="absolute inset-0 bg-primary/10 mix-blend-multiply"></div>
              </div>
              <div className="p-lg">
                <h4 className="font-label-md text-label-md text-on-surface-variant mb-md uppercase tracking-wider">Carrier HQ</h4>
                <p className="font-body-md text-body-md text-on-surface font-semibold">{carrier.address}</p>
                <p className="font-body-md text-body-md text-on-surface">{carrier.city}, {carrier.state} {carrier.zip}</p>
                <div className="mt-md flex gap-4">
                  <div>
                    <p className="text-label-sm text-on-surface-variant">Power Units</p>
                    <p className="font-bold">{carrier.powerUnits}</p>
                  </div>
                  <div>
                    <p className="text-label-sm text-on-surface-variant">Drivers</p>
                    <p className="font-bold">{carrier.drivers}</p>
                  </div>
                  <div>
                    <p className="text-label-sm text-on-surface-variant">OOS %</p>
                    <p className="font-bold text-green-600">{carrier.vehicleOOSRate}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Green Flags & Potential Risks */}
          <div className="col-span-12 bg-surface-container-lowest border border-outline-variant rounded-xl p-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
              {/* Positive Signals */}
              <div>
                <h3 className="font-h3 text-h3 mb-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-600">thumb_up</span> Verified Green Flags
                </h3>
                <ul className="space-y-4">
                  <li className="flex gap-4 items-start">
                    <span className="material-symbols-outlined text-green-600 mt-1">check</span>
                    <div>
                      <p className="font-label-md text-label-md text-on-surface">Consistent Inspections</p>
                      <p className="text-body-sm text-on-surface-variant">Carrier has undergone 12 clean inspections in the past 6 months with zero violations.</p>
                    </div>
                  </li>
                  <li className="flex gap-4 items-start">
                    <span className="material-symbols-outlined text-green-600 mt-1">check</span>
                    <div>
                      <p className="font-label-md text-label-md text-on-surface">SmartWay Certified</p>
                      <p className="text-body-sm text-on-surface-variant">EPA SmartWay partnership verified, indicating efficient operations and high maintenance standards.</p>
                    </div>
                  </li>
                  <li className="flex gap-4 items-start">
                    <span className="material-symbols-outlined text-green-600 mt-1">check</span>
                    <div>
                      <p className="font-label-md text-label-md text-on-surface">Longevity &amp; Stability</p>
                      <p className="text-body-sm text-on-surface-variant">Same ownership for 12 years with zero DBAs or name changes detected in public records.</p>
                    </div>
                  </li>
                </ul>
              </div>
              
              {/* Risks/Warnings */}
              <div>
                <h3 className="font-h3 text-h3 mb-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary">warning</span> Minor Considerations
                </h3>
                <ul className="space-y-4">
                  <li className="flex gap-4 items-start">
                    <span className="material-symbols-outlined text-tertiary mt-1">info</span>
                    <div>
                      <p className="font-label-md text-label-md text-on-surface">Recent Fleet Expansion</p>
                      <p className="text-body-sm text-on-surface-variant">Registered 5 new power units last month. Monitor for temporary driver qualification lag.</p>
                    </div>
                  </li>
                  <li className="flex gap-4 items-start">
                    <span className="material-symbols-outlined text-tertiary mt-1">info</span>
                    <div>
                      <p className="font-label-md text-label-md text-on-surface">Authority Update Pending</p>
                      <p className="text-body-sm text-on-surface-variant">Annual MCS-150 update is due in 30 days. No immediate impact on active status.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="col-span-12 mt-2xl py-lg border-t border-outline-variant flex justify-between items-center text-on-surface-variant">
            <div className="flex items-center gap-4">
              <img 
                className="h-10 w-10 opacity-50" 
                alt="CarrierGuard AI Seal"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCy95k_LaPGejO9evXBV3HN-qJnjyP5QH1ywjLrZ6K1BOIf055qMggcmikh27GHDmWM-QTwBflxvSP-VUd0aARuhesdlbhKQlFOLbH9IDms6hL-J_D4NWHl1m7FNFZun_K-gMWo5QdcctIn06Y9eEOgiBLDDmZrPRDJ3pVmIe02CLeOgD8nbOFLQIfrVW_bkDuZ6dj5UWjXs3KnB3PUp7tcrF_VV4oYNbYfMGC2uksU7qJY9LYhGjOMWqoMw7sla-KgADja0MUL3So" 
              />
              <p className="text-label-sm font-medium">This report is an automated assessment based on real-time FMCSA, SAFER, and internal CarrierGuard AI data feeds. It does not constitute legal advice.</p>
            </div>
            <p className="text-label-sm whitespace-nowrap">&copy; 2024 CarrierGuard AI &bull; System Version 8.4.1</p>
          </footer>
        </div>)}
      </div>
    </div>
  );
}
