"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { getSearchHistory, clearSearchHistory, type SearchHistoryItem } from '@/lib/api';

export default function HistoryPage() {
  const { getToken } = useAuth();
  const pathname = usePathname();
  const [items, setItems] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const token = await getToken();
      const history = await getSearchHistory(50, token);
      setItems(history);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    setLoading(true);
    loadHistory();
  }, [loadHistory, pathname]);

  const handleClear = async () => {
    setClearing(true);
    try {
      const token = await getToken();
      await clearSearchHistory(token);
      setItems([]);
    } catch {
    } finally {
      setClearing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-green-500/10 text-green-400 border-green-500/30';
    if (score >= 40) return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
    return 'bg-red-500/10 text-red-400 border-red-500/30';
  };

  return (
    <div className="flex-1 px-6 py-8 w-full bg-gray-950">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2.5">
            <span className="material-symbols-outlined text-gray-500 text-2xl">history</span>
            Search History
          </h1>
          <p className="text-sm text-gray-500 mt-1.5">
            {items.length > 0
              ? `${items.length} carrier check${items.length !== 1 ? 's' : ''} on record`
              : 'Track your carrier verifications over time.'}
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={handleClear}
            disabled={clearing}
            className="h-9 px-4 text-sm text-gray-500 border border-gray-700 hover:text-red-400 hover:border-red-500/30 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
            {clearing ? 'Clearing...' : 'Clear All'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 bg-gray-800/50 rounded-2xl flex items-center justify-center mb-5">
            <span className="material-symbols-outlined text-gray-400 text-3xl">search_history</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-100 mb-2">No searches yet</h3>
          <p className="text-sm text-gray-500 leading-relaxed whitespace-nowrap">
            Your carrier search history will appear here once you run your first check.
          </p>
          <Link
            href="/search"
            className="mt-6 h-10 px-5 text-sm font-medium text-white bg-orange-500 hover:bg-orange-400 rounded-lg transition-all shadow-sm inline-flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">search</span>
            Search a carrier
          </Link>
        </div>
      ) : (
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900 border-b border-gray-800">
                  <th className="text-left py-3 px-5 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Carrier</th>
                  <th className="text-left py-3 px-5 text-gray-500 font-semibold text-[11px] uppercase tracking-wider hidden sm:table-cell">MC</th>
                  <th className="text-left py-3 px-5 text-gray-500 font-semibold text-[11px] uppercase tracking-wider hidden sm:table-cell">DOT</th>
                  <th className="text-center py-3 px-5 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Score</th>
                  <th className="text-left py-3 px-5 text-gray-500 font-semibold text-[11px] uppercase tracking-wider hidden md:table-cell">Date</th>
                  <th className="text-right py-3 px-5 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {(item.carrier_name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-100 truncate max-w-[200px]">{item.carrier_name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-gray-400 hidden sm:table-cell">{item.mc_number || '—'}</td>
                    <td className="py-3.5 px-5 text-gray-400 hidden sm:table-cell">{item.dot_number || '—'}</td>
                    <td className="py-3.5 px-5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded border text-xs font-bold ${getScoreColor(item.risk_score)}`}>
                        {item.risk_score}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-gray-500 text-xs hidden md:table-cell">
                      {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Link
                        href={`/carrier/${item.dot_number}`}
                        className="text-sm font-medium text-orange-400 hover:text-orange-300 inline-flex items-center gap-1"
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
