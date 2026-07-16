"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { getSearchHistory, type SearchHistoryItem } from '@/lib/api';

export default function HistoryPage() {
  const { getToken } = useAuth();
  const [checks, setChecks] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getToken().then((token) => getSearchHistory(50, token)).then((data) => {
      setChecks(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [getToken]);
  return (
    <div className="p-gutter space-y-lg overflow-y-auto">
      {/* Filter Bar & Export Actions */}
      <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-md">
        <div className="flex flex-wrap items-center gap-md">
          {/* Search Bar */}
          <div className="relative min-w-[280px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input 
              type="text"
              className="w-full pl-10 pr-4 py-2 bg-surface border border-outline-variant rounded-lg font-body-sm text-body-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" 
              placeholder="Search by Carrier or MC#" 
            />
          </div>
          
          {/* Date Range */}
          <div className="flex items-center gap-sm bg-surface border border-outline-variant rounded-lg px-md py-2">
            <span className="material-symbols-outlined text-on-surface-variant">calendar_today</span>
            <span className="font-body-sm text-body-sm text-on-surface">Oct 01 - Oct 31, 2023</span>
            <span className="material-symbols-outlined text-outline cursor-pointer">expand_more</span>
          </div>
          
          {/* Status Dropdown */}
          <div className="flex items-center gap-sm bg-surface border border-outline-variant rounded-lg px-md py-2 cursor-pointer hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">filter_list</span>
            <span className="font-body-sm text-body-sm text-on-surface">All Results</span>
            <span className="material-symbols-outlined text-outline">expand_more</span>
          </div>
        </div>
        
        <div className="flex items-center gap-sm">
          <button className="flex items-center gap-sm px-md py-2 bg-surface border border-outline-variant text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-container transition-colors shadow-sm">
            <span className="material-symbols-outlined">upload_file</span>
            Export PDF
          </button>
          <button className="flex items-center gap-sm px-md py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity shadow-md">
            <span className="material-symbols-outlined">download</span>
            Export CSV
          </button>
        </div>
      </div>
      
      {/* Audit Data Table */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="overflow-x-auto table-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high border-b border-outline-variant">
                <th className="px-lg py-md font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Date &amp; Time</th>
                <th className="px-lg py-md font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Carrier Name</th>
                <th className="px-lg py-md font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">MC/DOT#</th>
                <th className="px-lg py-md font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Vetting Result</th>
                <th className="px-lg py-md font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Vetted By</th>
                <th className="px-lg py-md font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-lg py-md"><div className="h-12 skeleton rounded-lg"></div></td></tr>
                ))
              ) : checks.length === 0 ? (
                <tr><td colSpan={6} className="px-lg py-xl text-center text-on-surface-variant">No search history yet.</td></tr>
              ) : checks.map((check) => {
                const scoreColor = check.risk_score >= 70 ? 'bg-green-100 text-green-800' : check.risk_score >= 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
                const scoreLabel = check.risk_score >= 70 ? 'Low Risk' : check.risk_score >= 40 ? 'Caution' : 'High Risk';
                return (
              <tr key={check.id} className="hover:bg-surface-container-low transition-colors cursor-pointer">
                <td className="px-lg py-md">
                  <p className="font-body-sm text-body-sm text-on-surface font-medium">{new Date(check.created_at).toLocaleDateString()}</p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">{new Date(check.created_at).toLocaleTimeString()}</p>
                </td>
                <td className="px-lg py-md font-body-md text-body-md text-on-surface font-semibold">{check.carrier_name}</td>
                <td className="px-lg py-md">
                  <p className="font-body-sm text-body-sm text-on-surface">MC-{check.mc_number}</p>
                  <p className="font-label-sm text-label-sm text-outline">DOT: {check.dot_number}</p>
                </td>
                <td className="px-lg py-md">
                  <span className={`inline-flex items-center gap-xs px-2.5 py-0.5 rounded-full ${scoreColor} font-label-sm text-label-sm`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    {scoreLabel}
                  </span>
                </td>
                <td className="px-lg py-md">
                  <span className="font-body-sm text-body-sm text-on-surface">Auto</span>
                </td>
                <td className="px-lg py-md text-right">
                  <Link href={`/carrier/${check.dot_number}`} className="material-symbols-outlined text-outline hover:text-primary transition-colors p-1 inline-block">visibility</Link>
                </td>
              </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Section */}
        <div className="px-lg py-md flex items-center justify-between border-t border-outline-variant bg-surface-container-low">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Showing <span className="font-bold text-on-surface">{checks.length}</span> result{checks.length !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-xs">
            <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed transition-colors" disabled>
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary text-on-primary font-bold text-body-sm shadow-sm">1</button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container font-body-sm text-on-surface transition-colors">2</button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container font-body-sm text-on-surface transition-colors">3</button>
            <span className="px-2 text-outline">...</span>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container font-body-sm text-on-surface transition-colors">44</button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
          <div className="flex items-center gap-md">
            <p className="font-label-sm text-label-sm text-on-surface-variant">Rows per page:</p>
            <select className="bg-surface border border-outline-variant rounded-lg font-label-sm text-label-sm px-2 py-1 outline-none focus:ring-1 focus:ring-primary">
              <option>10</option>
              <option>25</option>
              <option>50</option>
              <option>100</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Bento Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        <div className="bg-surface-container-low p-lg rounded-xl border border-outline-variant flex flex-col gap-sm">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Total Audits</span>
            <span className="material-symbols-outlined text-primary">assessment</span>
          </div>
          <p className="font-h1 text-h1 text-on-surface">1,284</p>
          <p className="font-label-sm text-label-sm text-green-600 flex items-center gap-xs">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            +12% from last month
          </p>
        </div>
        
        <div className="bg-surface-container-low p-lg rounded-xl border border-outline-variant flex flex-col gap-sm">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Rejection Rate</span>
            <span className="material-symbols-outlined text-error">cancel</span>
          </div>
          <p className="font-h1 text-h1 text-on-surface">4.2%</p>
          <p className="font-label-sm text-label-sm text-error flex items-center gap-xs">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            +0.5% security risk increase
          </p>
        </div>
        
        <div className="bg-surface-container-low p-lg rounded-xl border border-outline-variant flex flex-col gap-sm">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Manual Interventions</span>
            <span className="material-symbols-outlined text-tertiary">person_search</span>
          </div>
          <p className="font-h1 text-h1 text-on-surface">86</p>
          <p className="font-label-sm text-label-sm text-on-surface-variant">Avg. resolution time: 14m</p>
        </div>
      </div>
    </div>
  );
}
