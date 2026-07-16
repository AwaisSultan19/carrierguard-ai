"use client";

import React from "react";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-gutter bg-background">
      <main className="w-full max-w-[448px]">
        <div className="flex flex-col items-center mb-xl">
          <div className="w-12 h-12 bg-primary flex items-center justify-center rounded-xl mb-md">
            <span className="material-symbols-outlined text-on-primary text-[28px]">security</span>
          </div>
          <h1 className="font-h2 text-h2 text-on-surface tracking-tight">CarrierGuard AI</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">Enterprise Logistics Vetting</p>
        </div>

        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm w-full",
              headerTitle: "font-h3 text-h3 text-on-surface",
              headerSubtitle: "font-body-sm text-body-sm text-on-surface-variant",
              formButtonPrimary: "bg-primary-container text-on-primary font-label-md rounded-lg hover:opacity-90 active:scale-[0.98]",
              formFieldInput: "w-full py-md px-md bg-surface border border-outline-variant rounded-lg font-body-md text-body-md placeholder:text-outline focus:ring-2 focus:ring-primary-container",
              formFieldLabel: "font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider",
              dividerLine: "bg-outline-variant",
              dividerText: "text-on-surface-variant font-label-sm",
              socialButtonsBlockButton: "bg-surface-container-lowest border border-outline-variant text-on-surface font-label-md rounded-lg hover:bg-surface-container",
              footerActionLink: "text-primary font-semibold hover:underline",
              footer: "hidden",
            },
          }}
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/dashboard"
        />
      </main>
    </div>
  );
}
