"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

import { useAuth } from '@clerk/nextjs';
import { getDashboardStats, type DashboardStats } from '@/lib/api';

function getTimeAgo(dateStr: string) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function DashboardPage() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getToken().then((token) =>
      getDashboardStats(token)
    ).then((data) => {
      setStats(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [getToken]);

  return (
    <div className="flex-1 overflow-y-auto p-gutter custom-scrollbar relative">
          {/* Page Header */}
          <div className="flex justify-between items-end mb-xl">
            <div>
              <h2 className="font-h1 text-h1 text-on-surface">Compliance Dashboard</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Real-time carrier vetting and risk assessment overview.</p>
            </div>
            <div className="flex gap-md">
              <Link href="/search" className="flex items-center gap-sm px-lg h-10 bg-primary text-white rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity shadow-md">
                <span className="material-symbols-outlined text-[18px]">add</span>
                New Search
              </Link>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg mb-xl">
            <div className="glass-card p-lg rounded-xl flex flex-col justify-between">
              <div>
                <h4 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-xs">Total Carriers Vetted</h4>
                <p className="font-h2 text-h2 text-on-surface">{stats?.totalCarriersVetted ?? 0}</p>
              </div>
            </div>
            
            <div className="glass-card p-lg rounded-xl flex flex-col justify-between">
              <div>
                <h4 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-xs">Avg. Risk Score</h4>
                <p className="font-h2 text-h2 text-on-surface">{stats?.averageRiskScore ?? 0}</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="glass-card p-lg rounded-xl flex flex-col">
              <div className="h-6 w-40 skeleton rounded-lg mb-lg"></div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 skeleton rounded-lg mb-md"></div>
              ))}
            </div>
          ) : (
          <div className="glass-card p-lg rounded-xl flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-xl">
              <h3 className="font-h3 text-h3 text-on-surface">Recent Carrier Checks</h3>
              <Link href="/history" className="text-primary font-label-md text-label-md hover:underline">View All</Link>
            </div>
            {stats && stats.recentChecks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-xl text-center">
                <span className="material-symbols-outlined text-4xl text-outline mb-md">search_off</span>
                <p className="text-on-surface-variant">No checks yet. Search for a carrier to get started.</p>
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    <th className="px-md py-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Carrier Name</th>
                    <th className="px-md py-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">MC#</th>
                    <th className="px-md py-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Vetting Score</th>
                    <th className="px-md py-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Last Checked</th>
                    <th className="px-md py-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {stats?.recentChecks.map((check) => {
                    const initial = (check.carrier_name || '?')[0].toUpperCase();
                    const scoreColor = check.risk_score >= 70 ? 'bg-green-100 text-green-700' : check.risk_score >= 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-700';
                    const scoreLabel = check.risk_score >= 70 ? 'Low Risk' : check.risk_score >= 40 ? 'Caution' : 'Critical';
                    const timeAgo = getTimeAgo(check.created_at);
                    return (
                  <tr key={check.id} className="hover:bg-surface-container-low transition-colors group">
                    <td className="px-md py-md">
                      <div className="flex items-center gap-sm">
                        <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center font-bold text-primary">{initial}</div>
                        <span className="font-body-sm text-body-sm text-on-surface font-semibold">{check.carrier_name}</span>
                      </div>
                    </td>
                    <td className="px-md py-md font-body-sm text-body-sm text-on-surface">MC-{check.mc_number}</td>
                    <td className="px-md py-md">
                      <span className={`inline-flex items-center px-sm py-xs ${scoreColor} text-[10px] font-bold rounded uppercase`}>{check.risk_score} - {scoreLabel}</span>
                    </td>
                    <td className="px-md py-md font-body-sm text-body-sm text-on-surface-variant">{timeAgo}</td>
                    <td className="px-md py-md text-right">
                      <Link href={`/carrier/${check.dot_number}`} className="p-xs hover:bg-primary/10 rounded-full inline-flex transition-colors text-on-surface-variant hover:text-primary">
                        <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                      </Link>
                    </td>
                  </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            )}
          </div>
          )}

    </div>
  );
}

