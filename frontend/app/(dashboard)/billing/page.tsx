"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { getSubscription, type Subscription } from '@/lib/api';

export default function BillingPage() {
  const { getToken } = useAuth();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [progressWidth, setProgressWidth] = useState('0%');
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getToken().then((token) => getSubscription(token)).then(setSub);
  }, [getToken]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgressWidth('85%');
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;
    
    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
    cardRef.current.style.transition = 'transform 0.5s ease-out';
  };

  const handleMouseEnter = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transition = 'none';
  };

  return (
    <div className="flex-1 p-gutter max-w-7xl mx-auto w-full space-y-xl">
      {/* Hero Stats / Bento Grid Start */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        
        {/* Current Plan Card */}
        <div className="lg:col-span-2 bg-surface-container-lowest p-xl rounded-xl border border-outline-variant shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          </div>
          
          <div className="flex justify-between items-start mb-lg">
            <div>
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-label-sm text-label-sm uppercase tracking-wider mb-sm inline-block">Current Plan</span>
              <h2 className="font-h1 text-h1 text-on-surface mb-xs">{sub?.plan ? sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1) : 'Enterprise'}</h2>
              <p className="text-on-surface-variant font-body-sm max-w-md">Comprehensive vetting solution for high-volume carrier networks with dedicated support and custom API limits.</p>
            </div>
            <button className="bg-primary text-white px-lg py-md rounded-lg font-label-md hover:shadow-lg hover:bg-primary-container transition-all active:scale-95">
              Upgrade Plan
            </button>
          </div>
          
          <div className="space-y-md">
            <div className="flex justify-between items-end">
              <span className="font-label-md text-on-surface">Monthly Carrier Checks</span>
              <span className="font-h3 text-h3 text-on-surface"><span className="text-primary font-bold">{sub?.usage || 0}</span> / {sub?.limit || 100}</span>
            </div>
            <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" 
                style={{ width: progressWidth }}
              ></div>
            </div>
            <div className="flex justify-between font-label-sm text-on-surface-variant">
              <span>{sub && sub.limit > 0 ? Math.round((sub.usage / sub.limit) * 100) : 0}% of limit used</span>
              <span>Renews in 12 days</span>
            </div>
          </div>
        </div>

        {/* Payment Method Card */}
        <div className="bg-surface-container-lowest p-xl rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-xl">
              <h3 className="font-h3 text-h3">Payment Method</h3>
              <button className="text-primary font-label-md hover:underline">Edit</button>
            </div>
            
            <div 
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onMouseEnter={handleMouseEnter}
              className="bg-on-background text-white p-lg rounded-xl shadow-lg aspect-[1.58/1] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 -mr-16 -mt-16 rounded-full"></div>
              <div className="flex justify-between items-start mb-xl">
                <span className="material-symbols-outlined text-4xl">contactless</span>
                <div className="w-12 h-8 rounded-md bg-white/20"></div>
              </div>
              <p className="font-body-lg tracking-[0.2em] mb-md">**** **** **** 4242</p>
              <div className="flex justify-between items-end">
                <div>
                  <p className="font-label-sm text-white/60 uppercase">Holder</p>
                  <p className="font-label-md">Alex Sterling</p>
                </div>
                <div className="text-right">
                  <p className="font-label-sm text-white/60 uppercase">Expires</p>
                  <p className="font-label-md">09/27</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-lg flex items-center gap-sm text-on-surface-variant font-body-sm">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
            <span>Next billing date: Oct 12, 2023</span>
          </div>
        </div>
      </div>

      {/* Invoice History Section */}
      <div className="space-y-md">
        <div className="flex justify-between items-center">
          <h3 className="font-h2 text-h2">Invoice History</h3>
          <div className="flex gap-sm">
            <button className="flex items-center gap-xs px-md py-sm border border-outline-variant rounded-lg hover:bg-surface-container font-label-md transition-colors">
              <span className="material-symbols-outlined text-[18px]">filter_list</span>
              Filter
            </button>
            <button className="flex items-center gap-xs px-md py-sm border border-outline-variant rounded-lg hover:bg-surface-container font-label-md transition-colors">
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export all
            </button>
          </div>
        </div>
        
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container/50 border-b border-outline-variant">
              <tr>
                <th className="px-lg py-md font-label-sm text-on-surface-variant uppercase tracking-wider">Invoice Date</th>
                <th className="px-lg py-md font-label-sm text-on-surface-variant uppercase tracking-wider">Reference</th>
                <th className="px-lg py-md font-label-sm text-on-surface-variant uppercase tracking-wider">Amount</th>
                <th className="px-lg py-md font-label-sm text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="px-lg py-md font-label-sm text-on-surface-variant uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              <tr className="hover:bg-surface-container-low transition-colors">
                <td className="px-lg py-md font-body-md text-on-surface">Sept 12, 2023</td>
                <td className="px-lg py-md font-body-md text-on-surface-variant">INV-2023-089</td>
                <td className="px-lg py-md font-body-md text-on-surface">$499.00</td>
                <td className="px-lg py-md">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-label-sm flex items-center w-fit gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                    Paid
                  </span>
                </td>
                <td className="px-lg py-md text-right">
                  <button className="text-primary hover:text-primary-container font-label-md inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    Download
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-surface-container-low transition-colors">
                <td className="px-lg py-md font-body-md text-on-surface">Aug 12, 2023</td>
                <td className="px-lg py-md font-body-md text-on-surface-variant">INV-2023-074</td>
                <td className="px-lg py-md font-body-md text-on-surface">$499.00</td>
                <td className="px-lg py-md">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-label-sm flex items-center w-fit gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                    Paid
                  </span>
                </td>
                <td className="px-lg py-md text-right">
                  <button className="text-primary hover:text-primary-container font-label-md inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    Download
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-surface-container-low transition-colors">
                <td className="px-lg py-md font-body-md text-on-surface">July 12, 2023</td>
                <td className="px-lg py-md font-body-md text-on-surface-variant">INV-2023-061</td>
                <td className="px-lg py-md font-body-md text-on-surface">$499.00</td>
                <td className="px-lg py-md">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-label-sm flex items-center w-fit gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                    Paid
                  </span>
                </td>
                <td className="px-lg py-md text-right">
                  <button className="text-primary hover:text-primary-container font-label-md inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    Download
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Trust Elements / Help Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg pb-xl">
        <div className="glass-panel p-lg rounded-xl flex items-start gap-md">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-primary">security</span>
          </div>
          <div>
            <h4 className="font-label-md font-bold mb-1">Secure Billing</h4>
            <p className="font-body-sm text-on-surface-variant">All payment processing is handled through PCI-DSS Level 1 compliant gateways. We do not store full credit card numbers on our servers.</p>
          </div>
        </div>
        
        <div className="glass-panel p-lg rounded-xl flex items-start gap-md">
          <div className="w-12 h-12 rounded-full bg-tertiary/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-tertiary">support_agent</span>
          </div>
          <div>
            <h4 className="font-label-md font-bold mb-1">Billing Support</h4>
            <p className="font-body-sm text-on-surface-variant">Questions about your enterprise plan or custom requirements? Reach out to your account manager or our priority billing desk.</p>
            <a className="text-tertiary font-label-sm mt-2 inline-block hover:underline" href="#">Contact Billing Support →</a>
          </div>
        </div>
      </div>
    </div>
  );
}
