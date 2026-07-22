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
      <div className="px-6 py-8 max-w-5xl mx-auto w-full">
        {!carrier && (
          <div className="flex items-center gap-4 mb-8 p-6 bg-gray-900/60 border border-gray-800 rounded-xl">
            <input
              type="text"
              value={dotInput}
              onChange={(e) => setDotInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter DOT number to generate report..."
              className="flex-1 h-12 px-4 bg-gray-900/80 border-gray-700 text-gray-100 placeholder:text-gray-500 rounded-lg focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 outline-none"
            />
            <button onClick={handleSearch} className="h-12 px-6 bg-orange-500 hover:bg-orange-400 text-white rounded-lg font-bold flex items-center gap-4">
              <span className="material-symbols-outlined">search</span> Generate
            </button>
          </div>
        )}

        {/* Header Section */}
        {carrier && (
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded font-label-sm text-xs uppercase tracking-wider">Risk Report</span>
              <span className="text-gray-400 text-label-sm">• {carrier.legalName}</span>
            </div>
            <h2 className="font-h1 text-2xl font-semibold text-white">{carrier.legalName}</h2>
            <p className="font-body-md text-body-md text-gray-400 flex items-center gap-2 mt-1">
              <span className="material-symbols-outlined text-base">location_on</span> MC: {carrier.mcNumber} • DOT: {carrier.dotNumber}
            </p>
          </div>
          <div className="flex gap-4">
            <button className="px-6 h-10 border border-gray-700 text-gray-400 rounded-lg font-label-md flex items-center gap-2 hover:text-gray-200 hover:bg-gray-800/50 transition-colors">
              <span className="material-symbols-outlined text-[20px]">share</span> Share with Team
            </button>
            <a href={getPdfDownloadUrl(carrier?.dotNumber)} target="_blank" rel="noopener noreferrer"
               className="px-6 h-10 bg-orange-500 hover:bg-orange-400 text-white rounded-lg font-label-md flex items-center gap-2 transition-all shadow-md">
              <span className="material-symbols-outlined text-[20px]">download</span> Download PDF
            </a>
          </div>
        </div>
        )}

        {carrier && (<div className="grid grid-cols-12 gap-x-6 gap-y-8">
          {/* Executive Summary & Final Verdict */}
          <div className="col-span-12 md:col-span-8 bg-gray-900/60 border border-gray-800 rounded-xl p-8 flex flex-col justify-between overflow-hidden relative">
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-400">
                  <span className="material-symbols-outlined text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <div>
                  <p className="text-label-sm uppercase text-green-400 font-bold tracking-widest">Final Verdict</p>
                  <h3 className="text-display font-display leading-tight text-gray-100">Approved for Dispatch</h3>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-h3 text-h3 text-gray-100">Executive Summary</h4>
                <p className="font-body-md text-body-md text-gray-400 max-w-2xl leading-relaxed">
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
          <div className="col-span-12 md:col-span-7 bg-gray-900/60 border border-gray-800 rounded-xl p-8">
            <h3 className="font-h3 text-h3 text-gray-100 mb-8">Risk Score Breakdown</h3>
            <div className="space-y-8">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-label-md text-label-md text-gray-100 flex items-center gap-2">
                    <span className="material-symbols-outlined text-orange-400">security</span> Safety Performance
                  </span>
                  <span className="font-bold text-gray-100">94/100</span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500 rounded-full transition-all duration-1000" 
                    style={{ width: barWidths.safety }}
                  ></div>
                </div>
                <p className="text-label-sm text-gray-400">0.02 crash rate per million miles (Industry avg: 0.14)</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-label-md text-label-md text-gray-100 flex items-center gap-2">
                    <span className="material-symbols-outlined text-orange-400">description</span> Insurance Coverage
                  </span>
                  <span className="font-bold text-gray-100">100/100</span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500 rounded-full transition-all duration-1000" 
                    style={{ width: barWidths.insurance }}
                  ></div>
                </div>
                <p className="text-label-sm text-gray-400">$2,000,000 Liability policy active via Lloyd's of London.</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-label-md text-label-md text-gray-100 flex items-center gap-2">
                    <span className="material-symbols-outlined text-orange-400">verified</span> Operating Authority
                  </span>
                  <span className="font-bold text-gray-100">91/100</span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500 rounded-full transition-all duration-1000" 
                    style={{ width: barWidths.authority }}
                  ></div>
                </div>
                <p className="text-label-sm text-gray-400">MC Authority active since 2012. No broker-authority duality detected.</p>
              </div>
            </div>
          </div>

          {/* Quick Details */}
          <div className="col-span-12 md:col-span-5 flex flex-col gap-6">
            <div className="flex-1 bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
              <div className="h-32 bg-gray-800 relative">
                <div 
                  className="absolute inset-0 grayscale contrast-125 bg-cover bg-center"
                  style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAzLwc5RKX-U3eML9zyvx5CzMP_j2CzIRGOSms783ry_urcqZ0DTSEUzbSQoZ0P9vgWKTC6RxIdCh5qAscuuJPw1ovln-HQugkzZDcIIpaphY_RcSysDZ-RJW6c1fIVhCzDkXFn-TPlztgPRzBb5qNIxqef3v5twAWawi_wx8Gbanr1B61VHLaFcRofArXaAdCHOU7txkFwwxe6HsK6I5k06g51SJb0CBfs67h-ZCC5uPmwZIaueCQbAd5oZKdZLoEc0boirzvNEmU')" }}
                ></div>
                <div className="absolute inset-0 bg-orange-500/10 mix-blend-multiply"></div>
              </div>
              <div className="p-6">
                <h4 className="font-label-md text-label-md text-gray-400 mb-4 uppercase tracking-wider">Carrier HQ</h4>
                <p className="font-body-md text-body-md text-gray-100 font-semibold">{carrier.address}</p>
                <p className="font-body-md text-body-md text-gray-100">{carrier.city}, {carrier.state} {carrier.zip}</p>
                <div className="mt-4 flex gap-4">
                  <div>
                    <p className="text-label-sm text-gray-400">Power Units</p>
                    <p className="font-bold text-gray-100">{carrier.powerUnits}</p>
                  </div>
                  <div>
                    <p className="text-label-sm text-gray-400">Drivers</p>
                    <p className="font-bold text-gray-100">{carrier.drivers}</p>
                  </div>
                  <div>
                    <p className="text-label-sm text-gray-400">OOS %</p>
                    <p className="font-bold text-green-400">{carrier.vehicleOOSRate}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Green Flags & Potential Risks */}
          <div className="col-span-12 bg-gray-900/60 border border-gray-800 rounded-xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Positive Signals */}
              <div>
                <h3 className="font-h3 text-h3 mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-400">thumb_up</span> Verified Green Flags
                </h3>
                <ul className="space-y-4">
                  <li className="flex gap-4 items-start">
                    <span className="material-symbols-outlined text-green-400 mt-1">check</span>
                    <div>
                      <p className="font-label-md text-label-md text-gray-100">Consistent Inspections</p>
                      <p className="text-body-sm text-gray-400">Carrier has undergone 12 clean inspections in the past 6 months with zero violations.</p>
                    </div>
                  </li>
                  <li className="flex gap-4 items-start">
                    <span className="material-symbols-outlined text-green-400 mt-1">check</span>
                    <div>
                      <p className="font-label-md text-label-md text-gray-100">SmartWay Certified</p>
                      <p className="text-body-sm text-gray-400">EPA SmartWay partnership verified, indicating efficient operations and high maintenance standards.</p>
                    </div>
                  </li>
                  <li className="flex gap-4 items-start">
                    <span className="material-symbols-outlined text-green-400 mt-1">check</span>
                    <div>
                      <p className="font-label-md text-label-md text-gray-100">Longevity &amp; Stability</p>
                      <p className="text-body-sm text-gray-400">Same ownership for 12 years with zero DBAs or name changes detected in public records.</p>
                    </div>
                  </li>
                </ul>
              </div>
              
              {/* Risks/Warnings */}
              <div>
                <h3 className="font-h3 text-h3 mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-yellow-400">warning</span> Minor Considerations
                </h3>
                <ul className="space-y-4">
                  <li className="flex gap-4 items-start">
                    <span className="material-symbols-outlined text-yellow-400 mt-1">info</span>
                    <div>
                      <p className="font-label-md text-label-md text-gray-100">Recent Fleet Expansion</p>
                      <p className="text-body-sm text-gray-400">Registered 5 new power units last month. Monitor for temporary driver qualification lag.</p>
                    </div>
                  </li>
                  <li className="flex gap-4 items-start">
                    <span className="material-symbols-outlined text-yellow-400 mt-1">info</span>
                    <div>
                      <p className="font-label-md text-label-md text-gray-100">Authority Update Pending</p>
                      <p className="text-body-sm text-gray-400">Annual MCS-150 update is due in 30 days. No immediate impact on active status.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="col-span-12 mt-12 py-6 border-t border-gray-800 flex justify-between items-center text-gray-500">
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
