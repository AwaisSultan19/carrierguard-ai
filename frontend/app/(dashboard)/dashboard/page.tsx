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
              <button className="flex items-center gap-sm px-lg h-10 border border-outline-variant bg-white text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-container transition-colors shadow-sm">
                <span className="material-symbols-outlined text-[18px]">file_download</span>
                Export Audit
              </button>
              <button className="flex items-center gap-sm px-lg h-10 bg-primary text-white rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity shadow-md">
                <span className="material-symbols-outlined text-[18px]">add</span>
                New Search
              </button>
            </div>
          </div>

          {/* KPI Cards Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg mb-xl">
            <div className="glass-card p-lg rounded-xl flex flex-col justify-between">
              <div className="flex justify-between items-start mb-md">
                <span className="p-sm bg-primary/10 text-primary rounded-lg">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
                </span>
              </div>
              <div>
                <h4 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-xs">Total Carriers Vetted</h4>
                <p className="font-h2 text-h2 text-on-surface">{stats?.totalCarriersVetted ?? 0}</p>
              </div>
            </div>
            
            <div className="glass-card p-lg rounded-xl flex flex-col justify-between">
              <div className="flex justify-between items-start mb-md">
                <span className="p-sm bg-error/10 text-error rounded-lg">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                </span>
                {stats && stats.highRiskAlerts > 0 && (
                  <span className="font-label-sm text-label-sm px-sm py-xs bg-error-container text-on-error-container rounded-full font-bold">Action Required</span>
                )}
              </div>
              <div>
                <h4 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-xs">High Risk Alerts</h4>
                <p className="font-h2 text-h2 text-on-surface">{stats?.highRiskAlerts ?? 0}</p>
              </div>
            </div>

            <div className="glass-card p-lg rounded-xl flex flex-col justify-between">
              <div className="flex justify-between items-start mb-md">
                <span className="p-sm bg-primary/10 text-primary rounded-lg">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                </span>
              </div>
              <div>
                <h4 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-xs">Compliance Rate</h4>
                <p className="font-h2 text-h2 text-on-surface">{stats?.complianceRate ?? 0}%</p>
              </div>
            </div>

            <div className="glass-card p-lg rounded-xl flex flex-col justify-between">
              <div className="flex justify-between items-start mb-md">
                <span className="p-sm bg-tertiary/10 text-tertiary rounded-lg">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>assignment</span>
                </span>
              </div>
              <div>
                <h4 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-xs">Pending Audits</h4>
                <p className="font-h2 text-h2 text-on-surface">{stats?.pendingAudits ?? 0}</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg mb-xl">
              <div className="lg:col-span-1 glass-card p-lg rounded-xl flex flex-col">
                <div className="h-6 w-32 skeleton rounded-lg mb-lg"></div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-48 h-48 skeleton rounded-full"></div>
                </div>
              </div>
              <div className="lg:col-span-2 glass-card p-lg rounded-xl flex flex-col">
                <div className="h-6 w-40 skeleton rounded-lg mb-lg"></div>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 skeleton rounded-lg mb-md"></div>
                ))}
              </div>
            </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg mb-xl">
            <div className="lg:col-span-1 glass-card p-lg rounded-xl flex flex-col">
              <div className="flex justify-between items-center mb-xl">
                <h3 className="font-h3 text-h3 text-on-surface">Risk Distribution</h3>
              </div>
              {stats && (
              <div className="flex-1 flex flex-col items-center justify-center py-xl relative">
                <div className="w-48 h-48 rounded-full border-[12px] border-surface-container flex items-center justify-center relative">
                  <div className="absolute inset-0 border-[12px] border-primary border-t-transparent border-r-transparent rounded-full"
                    style={{ transform: `rotate(${45 + (stats.riskDistribution.low / Math.max(1, stats.totalCarriersVetted)) * 360}deg)` }}>
                  </div>
                  <div className="absolute inset-0 border-[12px] border-error border-l-transparent border-b-transparent border-t-transparent rounded-full"
                    style={{ transform: `rotate(${45 + ((stats.riskDistribution.low + stats.riskDistribution.moderate) / Math.max(1, stats.totalCarriersVetted)) * 360}deg)` }}>
                  </div>
                  <div className="text-center">
                    <p className="font-h2 text-h2 text-on-surface">{stats.totalCarriersVetted > 0 ? Math.round((stats.riskDistribution.high / stats.totalCarriersVetted) * 100) : 0}%</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">High Risk</p>
                  </div>
                </div>
                <div className="w-full mt-xl space-y-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-sm">
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                      <span className="font-body-sm text-body-sm text-on-surface">Low Risk</span>
                    </div>
                    <span className="font-label-md text-label-md font-bold">{stats.totalCarriersVetted > 0 ? Math.round((stats.riskDistribution.low / stats.totalCarriersVetted) * 1000) / 10 : 0}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-sm">
                      <div className="w-3 h-3 rounded-full bg-tertiary"></div>
                      <span className="font-body-sm text-body-sm text-on-surface">Moderate</span>
                    </div>
                    <span className="font-label-md text-label-md font-bold">{stats.totalCarriersVetted > 0 ? Math.round((stats.riskDistribution.moderate / stats.totalCarriersVetted) * 1000) / 10 : 0}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-sm">
                      <div className="w-3 h-3 rounded-full bg-error"></div>
                      <span className="font-body-sm text-body-sm text-on-surface">High Risk</span>
                    </div>
                    <span className="font-label-md text-label-md font-bold">{stats.totalCarriersVetted > 0 ? Math.round((stats.riskDistribution.high / stats.totalCarriersVetted) * 1000) / 10 : 0}%</span>
                  </div>
                </div>
              </div>
              )}
            </div>

            <div className="lg:col-span-2 glass-card p-lg rounded-xl flex flex-col overflow-hidden">
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
          </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
            {/* Recent Alerts */}
            <div className="lg:col-span-2 glass-card p-lg rounded-xl flex flex-col">
              <h3 className="font-h3 text-h3 text-on-surface mb-xl">Critical Compliance Alerts</h3>
              
              <div className="space-y-md">
                <div className="flex items-start gap-md p-md rounded-lg bg-error-container/30 border border-error-container">
                  <div className="mt-xs p-sm bg-error/10 text-error rounded">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="font-label-md text-label-md font-bold text-on-error-container">Authority Revoked: Swift Carriers LLC</p>
                      <span className="font-label-sm text-label-sm text-on-error-container/60 italic">Critical</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">FMCSA has updated the status of MC-12345 to Inactive. Immediate suspension of all active loads is recommended.</p>
                    <div className="flex gap-md mt-md">
                      <button className="px-md py-1.5 bg-error text-white font-label-sm text-label-sm rounded-lg hover:opacity-90">Freeze Carrier</button>
                      <button className="px-md py-1.5 border border-outline-variant text-on-surface font-label-sm text-label-sm rounded-lg hover:bg-white">Review Audit</button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-md p-md rounded-lg bg-tertiary-fixed/30 border border-tertiary-fixed">
                  <div className="mt-xs p-sm bg-tertiary/10 text-tertiary rounded">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="font-label-md text-label-md font-bold text-on-tertiary-fixed">Insurance Expiring: Atlas Logistics</p>
                      <span className="font-label-sm text-label-sm text-on-tertiary-fixed/60 italic">Warning</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">Auto Liability insurance for MC-67890 expires in 48 hours. No updated certificate on file.</p>
                    <div className="flex gap-md mt-md">
                      <button className="px-md py-1.5 bg-tertiary text-white font-label-sm text-label-sm rounded-lg hover:opacity-90">Request COI</button>
                      <button className="px-md py-1.5 border border-outline-variant text-on-surface font-label-sm text-label-sm rounded-lg hover:bg-white">Dismiss</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions & System Info */}
            <div className="lg:col-span-1 space-y-lg">
              <div className="glass-card p-lg rounded-xl flex flex-col">
                <h3 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-lg">System Management</h3>
                <div className="grid grid-cols-1 gap-md">
                  <button className="w-full flex items-center justify-between p-md rounded-lg border border-outline-variant hover:border-primary hover:bg-primary/5 transition-all text-left group">
                    <div className="flex items-center gap-md">
                      <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">database</span>
                      <div>
                        <p className="font-label-md text-label-md font-bold text-on-surface">Data Refresh</p>
                        <p className="text-[10px] text-on-surface-variant">Sync with FMCSA Registry</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_right</span>
                  </button>
                  <button className="w-full flex items-center justify-between p-md rounded-lg border border-outline-variant hover:border-primary hover:bg-primary/5 transition-all text-left group">
                    <div className="flex items-center gap-md">
                      <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">monitoring</span>
                      <div>
                        <p className="font-label-md text-label-md font-bold text-on-surface">Vetting Parameters</p>
                        <p className="text-[10px] text-on-surface-variant">Adjust score weights</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_right</span>
                  </button>
                  <button className="w-full flex items-center justify-between p-md rounded-lg border border-outline-variant hover:border-primary hover:bg-primary/5 transition-all text-left group">
                    <div className="flex items-center gap-md">
                      <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">group</span>
                      <div>
                        <p className="font-label-md text-label-md font-bold text-on-surface">Team Access</p>
                        <p className="text-[10px] text-on-surface-variant">Manage role permissions</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_right</span>
                  </button>
                </div>
              </div>

              <div className="bg-primary-container p-lg rounded-xl relative overflow-hidden text-on-primary-container shadow-lg">
                <div className="relative z-10">
                  <h3 className="font-h3 text-h3 mb-xs">Enterprise Security</h3>
                  <p className="font-body-sm text-body-sm opacity-90 mb-lg">Your account is protected by 2FA and AI-driven fraud detection.</p>
                  <button className="w-full py-md bg-white text-primary font-bold rounded-lg shadow-sm hover:bg-opacity-95 transition-all">Update Settings</button>
                </div>
                {/* Abstract Design Element */}
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-on-primary-container/10 rounded-full blur-2xl"></div>
                <div className="absolute -left-4 -top-4 w-32 h-32 bg-on-primary-container/5 rounded-full blur-3xl"></div>
              </div>
            </div>
          </div>

          {/* Sticky Interaction FAB */}
          <button className="absolute bottom-gutter right-gutter w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group">
            <span className="material-symbols-outlined text-[28px] group-hover:rotate-12 transition-transform">support_agent</span>
            <div className="absolute right-full mr-md px-md py-2 bg-inverse-surface text-inverse-on-surface rounded-lg font-label-md text-label-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
              Live Support
            </div>
          </button>
    </div>
  );
}

