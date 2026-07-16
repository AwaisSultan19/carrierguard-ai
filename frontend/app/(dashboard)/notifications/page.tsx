"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { getAlerts, dismissAlert, type AlertItem } from '@/lib/api';

export default function NotificationsPage() {
  const { getToken } = useAuth();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshText, setRefreshText] = useState('Refresh feed');
  const [refreshIcon, setRefreshIcon] = useState('refresh');
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    getToken().then((token) => getAlerts(token)).then((data) => {
      setAlerts(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [getToken]);

  const handleDismiss = async (id: string) => {
    const token = await getToken();
    await dismissAlert(id);
    setDismissed(prev => [...prev, id]);
  };

  const refreshFeed = async () => {
    setIsRefreshing(true);
    setRefreshIcon('hourglass_top');
    setRefreshText('Refreshing...');
    const token = await getToken();
    const data = await getAlerts(token);
    setAlerts(data || []);
    setTimeout(() => {
      setIsRefreshing(false);
      setRefreshIcon('refresh');
      setRefreshText('Refresh feed');
    }, 1000);
  };

  const simulateAdd = () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    setRefreshText('Checking...');
    setRefreshIcon('refresh'); // with animate-spin below
    
    setTimeout(() => {
      setRefreshText('Refreshed!');
      setRefreshIcon('done');
      
      setTimeout(() => {
        setRefreshText('Refresh feed');
        setRefreshIcon('refresh');
        setIsRefreshing(false);
      }, 2000);
    }, 1000);
  };

  const dismissAlert = (id: string) => {
    setDismissed([...dismissed, id]);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      {/* Notification Feed Container */}
      <section className="max-w-4xl mx-auto w-full px-gutter py-xl flex-1">
        {/* Controls & Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-2xl">
          <div>
            <h1 className="font-h1 text-h1 text-on-surface">System Alerts</h1>
            <p className="text-body-md text-on-surface-variant mt-1">Review critical carrier status updates and compliance alerts.</p>
          </div>
          <div className="flex items-center gap-sm">
            <button className="px-md py-2 bg-surface-container-high text-on-surface rounded-lg text-label-md font-semibold hover:bg-outline-variant transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">done_all</span>
              Mark all as read
            </button>
            <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg">
              <span className="material-symbols-outlined">filter_list</span>
            </button>
          </div>
        </div>

        {/* Feed Groups */}
        <div className="space-y-xl">
          {/* Group: Today */}
          <div className="space-y-md">
            <div className="flex items-center gap-sm">
              <span className="text-label-sm font-bold text-primary uppercase tracking-widest">Today</span>
              <div className="h-[1px] flex-1 bg-outline-variant"></div>
            </div>

            {/* Notification Card: Danger (Authority Revoked) */}
            {!dismissed.includes('alert-1') && (
              <div className="group bg-white border border-outline-variant rounded-xl p-lg flex flex-col md:flex-row gap-lg transition-all hover:shadow-md hover:border-error/30 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-error"></div>
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center text-error">
                    <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
                  </div>
                </div>
                <div className="flex-1 space-y-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-h3 text-h3 text-on-surface">Authority Revoked</h4>
                      <p className="text-body-md text-on-surface-variant mt-1 leading-relaxed">
                        Carrier <span className="font-semibold text-on-surface">SwiftTrans Logistics (DOT #382910)</span> has had their operational authority revoked by the FMCSA. All active bookings should be suspended immediately.
                      </p>
                    </div>
                    <span className="text-label-sm text-on-surface-variant whitespace-nowrap ml-lg">2h ago</span>
                  </div>
                  <div className="flex items-center gap-sm pt-sm">
                    <button className="px-lg py-2 bg-error text-white rounded-lg text-label-md font-semibold hover:bg-red-700 transition-colors shadow-sm">View Carrier</button>
                    <button 
                      onClick={() => dismissAlert('alert-1')}
                      className="px-lg py-2 text-on-surface-variant hover:bg-surface-container rounded-lg text-label-md font-semibold transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Card: Warning (Insurance Expiring) */}
            {!dismissed.includes('alert-2') && (
              <div className="group bg-white border border-outline-variant rounded-xl p-lg flex flex-col md:flex-row gap-lg transition-all hover:shadow-md hover:border-tertiary/30 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-tertiary"></div>
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-tertiary-fixed flex items-center justify-center text-tertiary">
                    <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                  </div>
                </div>
                <div className="flex-1 space-y-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-h3 text-h3 text-on-surface">Insurance Expiring in 7 Days</h4>
                      <p className="text-body-md text-on-surface-variant mt-1 leading-relaxed">
                        <span className="font-semibold text-on-surface">Blue Sky Freight</span> liability insurance policy is set to expire on <span className="underline decoration-tertiary/50">Oct 24, 2023</span>. Auto-vetting status will move to 'Suspended' if not updated.
                      </p>
                    </div>
                    <span className="text-label-sm text-on-surface-variant whitespace-nowrap ml-lg">5h ago</span>
                  </div>
                  <div className="flex items-center gap-sm pt-sm">
                    <button className="px-lg py-2 bg-primary text-white rounded-lg text-label-md font-semibold hover:bg-primary-container transition-colors shadow-sm">View Carrier</button>
                    <button 
                      onClick={() => dismissAlert('alert-2')}
                      className="px-lg py-2 text-on-surface-variant hover:bg-surface-container rounded-lg text-label-md font-semibold transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Group: Yesterday */}
          <div className="space-y-md">
            <div className="flex items-center gap-sm">
              <span className="text-label-sm font-bold text-on-surface-variant uppercase tracking-widest">Yesterday</span>
              <div className="h-[1px] flex-1 bg-outline-variant/50"></div>
            </div>

            {/* Notification Card: Success (Safety Rating) */}
            {!dismissed.includes('alert-3') && (
              <div className="group bg-white border border-outline-variant rounded-xl p-lg flex flex-col md:flex-row gap-lg transition-all hover:shadow-md hover:border-green-500/30 relative overflow-hidden opacity-90 hover:opacity-100">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                    <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  </div>
                </div>
                <div className="flex-1 space-y-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-h3 text-h3 text-on-surface">New Safety Rating: Satisfactory</h4>
                      <p className="text-body-md text-on-surface-variant mt-1 leading-relaxed">
                        FMCSA safety rating for <span className="font-semibold text-on-surface">Global Peak Trucking</span> has been upgraded to 'Satisfactory' following their latest inspection audit.
                      </p>
                    </div>
                    <span className="text-label-sm text-on-surface-variant whitespace-nowrap ml-lg">Yesterday</span>
                  </div>
                  <div className="flex items-center gap-sm pt-sm">
                    <button className="px-lg py-2 border border-outline-variant text-on-surface rounded-lg text-label-md font-semibold hover:bg-surface-container transition-colors">View Carrier</button>
                    <button 
                      onClick={() => dismissAlert('alert-3')}
                      className="px-lg py-2 text-on-surface-variant hover:bg-surface-container rounded-lg text-label-md font-semibold transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Group: Earlier (Empty State Integration) */}
          <div className="space-y-md pt-lg">
            <div className="flex items-center gap-sm">
              <span className="text-label-sm font-bold text-on-surface-variant uppercase tracking-widest">Earlier</span>
              <div className="h-[1px] flex-1 bg-outline-variant/30"></div>
            </div>

            {/* Empty State Visualization */}
            <div className="bg-surface-container-low border-2 border-dashed border-outline-variant rounded-2xl p-3xl flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-lg">
                <span className="material-symbols-outlined text-primary text-[40px]" style={{ fontVariationSettings: "'FILL' 0" }}>all_inclusive</span>
              </div>
              <h4 className="font-h2 text-h2 text-on-surface">You're all caught up</h4>
              <p className="text-body-md text-on-surface-variant mt-sm max-w-xs">There are no older notifications to display. Your monitoring engine is running smoothly.</p>
              
              <button 
                onClick={simulateAdd}
                disabled={isRefreshing}
                className="mt-xl text-primary font-semibold text-label-md flex items-center gap-2 hover:underline disabled:opacity-50"
              >
                {refreshText} 
                <span className={`material-symbols-outlined text-[18px] ${isRefreshing && refreshIcon === 'refresh' ? 'animate-spin' : ''}`}>
                  {refreshIcon}
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bento Section */}
      <section className="max-w-4xl mx-auto w-full px-gutter pb-3xl mt-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
          <div className="bg-white p-lg rounded-xl border border-outline-variant flex items-center gap-md">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">analytics</span>
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant">Unread Alerts</p>
              <p className="text-h3 font-bold text-on-surface">02</p>
            </div>
          </div>
          
          <div className="bg-white p-lg rounded-xl border border-outline-variant flex items-center gap-md">
            <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center text-error">
              <span className="material-symbols-outlined">priority_high</span>
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant">Critical Threats</p>
              <p className="text-h3 font-bold text-on-surface">01</p>
            </div>
          </div>
          
          <div className="bg-white p-lg rounded-xl border border-outline-variant flex items-center gap-md">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-600">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant">System Status</p>
              <p className="text-h3 font-bold text-on-surface">Healthy</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
