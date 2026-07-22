"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

import { useAuth } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(() => {
    setLoading(true);
    getToken().then((token) =>
      getDashboardStats(token)
    ).then((data) => {
      setStats(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [getToken]);

  useEffect(() => {
    loadStats();
  }, [loadStats, pathname]);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar relative bg-gray-950">
          {/* Page Header */}
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-semibold text-gray-100">Compliance Dashboard</h2>
              <p className="text-sm text-gray-400 mt-xs">Real-time carrier vetting and risk assessment overview.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/search" className="flex items-center gap-2 px-5 h-10 bg-orange-500 text-white rounded-lg text-xs hover:bg-orange-400 transition-opacity shadow-sm">
                <span className="material-symbols-outlined text-[18px]">add</span>
                New Search
              </Link>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-900/60 border border-gray-800 p-5 rounded-xl flex flex-col justify-between">
              <div>
                <h4 className="text-[11px] text-gray-400 uppercase tracking-wider mb-xs">Total Carriers Vetted</h4>
                <p className="text-xl font-semibold text-gray-100">{stats?.totalCarriersVetted ?? 0}</p>
              </div>
            </div>
            
            <div className="bg-gray-900/60 border border-gray-800 p-5 rounded-xl flex flex-col justify-between">
              <div>
                <h4 className="text-[11px] text-gray-400 uppercase tracking-wider mb-xs">Avg. Risk Score</h4>
                <p className="text-xl font-semibold text-gray-100">{stats?.averageRiskScore ?? 0}</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="bg-gray-900/60 border border-gray-800 p-5 rounded-xl flex flex-col">
              <div className="h-6 w-40 bg-gray-800 animate-pulse rounded-lg mb-4"></div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-800 animate-pulse rounded-lg mb-3"></div>
              ))}
            </div>
          ) : (
          <div className="bg-gray-900/60 border border-gray-800 p-5 rounded-xl flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-base font-semibold text-gray-100">Recent Carrier Checks</h3>
              <Link href="/history" className="text-orange-400 text-xs hover:underline">View All</Link>
            </div>
            {stats && stats.recentChecks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-xl text-center">
                <span className="material-symbols-outlined text-4xl text-gray-500 mb-3">search_off</span>
                <p className="text-gray-400">No checks yet. Search for a carrier to get started.</p>
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-900 border-b border-gray-800">
                    <th className="px-4 py-4 text-[11px] text-gray-400 uppercase tracking-wider">Carrier Name</th>
                    <th className="px-4 py-4 text-[11px] text-gray-400 uppercase tracking-wider">MC#</th>
                    <th className="px-4 py-4 text-[11px] text-gray-400 uppercase tracking-wider">Vetting Score</th>
                    <th className="px-4 py-4 text-[11px] text-gray-400 uppercase tracking-wider">Last Checked</th>
                    <th className="px-4 py-4 text-[11px] text-gray-400 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {stats?.recentChecks.map((check) => {
                    const initial = (check.carrier_name || '?')[0].toUpperCase();
                    const scoreColor = check.risk_score >= 70 ? 'bg-green-100 text-green-700' : check.risk_score >= 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-700';
                    const scoreLabel = check.risk_score >= 70 ? 'Low Risk' : check.risk_score >= 40 ? 'Caution' : 'Critical';
                    const timeAgo = getTimeAgo(check.created_at);
                    return (
                  <tr key={check.id} className="hover:bg-gray-800/30 transition-colors group">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-gray-800/50 flex items-center justify-center font-bold text-orange-400">{initial}</div>
                        <span className="text-sm text-gray-100 font-semibold">{check.carrier_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-100">{check.mc_number ? `MC-${check.mc_number}` : '—'}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-sm py-xs ${scoreColor} text-[10px] font-bold rounded uppercase`}>{check.risk_score} - {scoreLabel}</span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-400">{timeAgo}</td>
                    <td className="px-4 py-4 text-right">
                      <Link href={`/carrier/${check.dot_number}`} className="p-xs hover:bg-orange-500/10 rounded-full inline-flex transition-colors text-gray-400 hover:text-orange-400">
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
