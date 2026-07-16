"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';

export default function TopNav() {
  const pathname = usePathname();
  
  const getPageTitle = () => {
    if (pathname.startsWith('/dashboard')) return 'Dashboard';
    if (pathname.startsWith('/search')) return 'Carrier Search';
    if (pathname.startsWith('/history')) return 'Audit History';
    if (pathname.startsWith('/notifications')) return 'Notifications';
    if (pathname.startsWith('/billing')) return 'Billing & Usage';
    if (pathname.startsWith('/settings')) return 'Settings';
    if (pathname.startsWith('/profile')) return 'Profile';
    if (pathname.startsWith('/carrier')) return 'Carrier Details';
    if (pathname.startsWith('/risk-report')) return 'Risk Report';
    return 'CarrierGuard AI';
  };

  return (
    <header className="h-16 w-full sticky top-0 z-40 bg-surface dark:bg-inverse-surface border-b border-outline-variant dark:border-outline shadow-sm flex justify-between items-center px-gutter">
      <div className="flex items-center gap-md">
        <h2 className="font-h3 text-h3 font-semibold text-on-surface dark:text-inverse-on-surface">{getPageTitle()}</h2>
        <div className="px-sm py-xs bg-secondary-container text-on-secondary-container rounded text-[10px] font-bold uppercase tracking-widest">Enterprise</div>
      </div>
      <div className="flex items-center gap-lg">
        <div className="flex items-center gap-md">
          <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary transition-opacity active:opacity-80">help</span>
          <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary transition-opacity active:opacity-80">apps</span>
        </div>
        <div className="h-8 w-[1px] bg-outline-variant"></div>
        <UserButton
          appearance={{
            elements: {
              userButtonAvatarBox: "w-8 h-8",
            },
          }}
        />
      </div>
    </header>
  );
}
