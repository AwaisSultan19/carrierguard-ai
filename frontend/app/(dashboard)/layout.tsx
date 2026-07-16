import React from 'react';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 bg-background overflow-y-auto">
        <TopNav />
        {children}
      </main>
    </div>
  );
}
