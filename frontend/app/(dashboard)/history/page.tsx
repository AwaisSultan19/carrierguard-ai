"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { getSearchHistory, clearSearchHistory, type SearchHistoryItem } from '@/lib/api';

export default function HistoryPage() {
  const { getToken } = useAuth();
  const [items, setItems] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const token = await getToken();
      const history = await getSearchHistory(50, token);
      setItems(history);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleClear = async () => {
    setClearing(true);
    try {
      const token = await getToken();
      await clearSearchHistory(token);
      setItems([]);
    } catch {
      // silent
    } finally {
      setClearing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="flex-1 p-gutter max-w-7xl mx-auto w-full space-y-xl">
      <section className="flex items-center justify-between">
        <div>
          <h2 className="font-h2 text-h2 text-on-surface font-bold flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary">history</span>
            Search History
          </h2>
          <p className="text-body-sm text-on-surface-variant mt-1">
            {items.length > 0 ? `${items.length} carrier check${items.length !== 1 ? 's' : ''} on record` : 'No searches yet'}
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={handleClear}
            disabled={clearing}
            className="px-md py-2 border border-outline-variant rounded-lg text-sm text-outline hover:text-error hover:border-error/30 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
            {clearing ? 'Clearing...' : 'Clear All'}
          </button>
        )}
      </section>

      {loading ? (
        <div className="space-y-md">
          <div className="h-12 skeleton rounded-lg"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 skeleton rounded-lg"></div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-2xl text-center">
          <div className="w-18 h-18 bg-surface-container rounded-3xl flex items-center justify-center mb-xl">
            <span className="material-symbols-outlined text-outline text-4xl">search_history</span>
          </div>
          <h3 className="font-h3 text-h3 text-on-surface mb-sm">No Search History</h3>
          <p className="text-on-surface-variant max-w-md mx-auto text-body-md">
            Search for a carrier by MC or DOT number to start building your history.
          </p>
          <Link
            href="/search"
            className="mt-lg px-xl py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 transition-all hover:brightness-110 flex items-center gap-md"
          >
            <span className="material-symbols-outlined">search</span>
            Search Carriers
          </Link>
        </div>
      ) : (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/50 bg-surface-container">
                  <th className="text-left py-3 px-lg text-outline font-bold text-[11px] uppercase tracking-wider">Carrier</th>
                  <th className="text-left py-3 px-lg text-outline font-bold text-[11px] uppercase tracking-wider hidden sm:table-cell">MC</th>
                  <th className="text-left py-3 px-lg text-outline font-bold text-[11px] uppercase tracking-wider hidden sm:table-cell">DOT</th>
                  <th className="text-center py-3 px-lg text-outline font-bold text-[11px] uppercase tracking-wider">Risk Score</th>
                  <th className="text-left py-3 px-lg text-outline font-bold text-[11px] uppercase tracking-wider hidden md:table-cell">Date</th>
                  <th className="text-right py-3 px-lg text-outline font-bold text-[11px] uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-container/50 transition-colors">
                    <td className="py-3 px-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {(item.carrier_name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <span className="font-semibold text-on-surface truncate max-w-[200px]">{item.carrier_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-lg text-on-surface-variant hidden sm:table-cell">{item.mc_number || '—'}</td>
                    <td className="py-3 px-lg text-on-surface-variant hidden sm:table-cell">{item.dot_number || '—'}</td>
                    <td className="py-3 px-lg text-center">
                      <span className={`inline-block px-2 py-0.5 rounded border text-xs font-bold ${getScoreColor(item.risk_score)}`}>
                        {item.risk_score}
                      </span>
                    </td>
                    <td className="py-3 px-lg text-on-surface-variant text-xs hidden md:table-cell">
                      {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-lg text-right">
                      <Link
                        href={`/carrier/${item.dot_number}`}
                        className="text-primary font-label-md hover:underline inline-flex items-center gap-1"
                      >
                        View
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
