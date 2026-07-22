"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { name: 'Search', path: '/search', icon: 'search' },
    { name: 'History', path: '/history', icon: 'history' },
    { name: 'Settings', path: '/settings', icon: 'settings' },
  ];

  const getLinkClasses = (path: string) => {
    const isActive = path === '/carrier'
      ? pathname.startsWith(path)
      : pathname === path;
    if (isActive) {
      return "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors bg-orange-500/10 text-orange-400 font-semibold border-r-2 border-orange-500";
    }
    return "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-gray-400 hover:text-gray-200 hover:bg-gray-800/50";
  };

  return (
    <aside className="w-[280px] h-screen sticky top-0 left-0 bg-gray-950 border-r border-gray-800 flex flex-col py-6 px-4 z-50 max-lg:hidden">
      <div className="flex items-center gap-3 mb-12">
        <Image src="/logo.png" alt="CarrierGuard AI" width={36} height={36} className="rounded-lg" />
        <div>
          <h1 className="text-base font-bold text-white leading-none">CarrierGuard AI</h1>
          <p className="text-[10px] text-orange-400/70 uppercase tracking-widest font-semibold mt-1">Enterprise Vetting</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path} className={getLinkClasses(item.path)}>
            <span className="material-symbols-outlined text-lg">{item.icon}</span>
            <span className="text-sm">{item.name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
