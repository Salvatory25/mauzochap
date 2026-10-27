import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Shield, AlertTriangle, FileText, CheckCircle2, Lock, CloudOff, HelpCircle } from "lucide-react";

import { buildSeoHead, getBreadcrumbSchema } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  head: () =>
    buildSeoHead({
      title: "Vigezo na Masharti (Terms of Service) — MauzoChap POS Tanzania",
      description:
        "Vigezo na masharti ya matumizi ya mfumo wa MauzoChap POS, usajili, malipo ya usajili wa mwezi, na haki za mtumiaji nchini Tanzania.",
      path: "/terms",
      schema: [
        getBreadcrumbSchema([
          { name: "Nyumbani", path: "/" },
          { name: "Vigezo na Masharti", path: "/terms" },
        ]),
      ],
    }),
  component: TermsPage,
});

function TermsPage() {
  const lastUpdated = "October 2026";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/images/logo-black.png" alt="MauzoChap" className="w-8 h-8 object-contain" />
            <span className="font-black text-xl text-slate-950 tracking-tight">MauzoChap</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-950 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Rudi Nyumbani / Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="bg-slate-950 text-white py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-violet-300 text-xs font-mono font-bold tracking-wider uppercase border border-white/15">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Official Legal Policy • United Republic of Tanzania</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Terms of Service & Operating Agreement
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto">
            Masharti na Kanuni za Matumizi ya Mfumo wa MauzoChap POS. Last updated: {lastUpdated}.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-10">
        {/* Disaster & Force Majeure Notice Box */}
        <div className="p-5 sm:p-6 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-950 space-y-2">
          <div className="flex items-center gap-2 font-black text-sm sm:text-base text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>MUHIMU: Tahadhari ya Dharura, Majanga na Kukatika kwa Mawasiliano (Force Majeure)</span>
          </div>
          <p className="text-xs sm:text-sm text-amber-900/90 leading-relaxed">
            MauzoChap inafanya kazi kwa kutumia miundombinu ya wingu (Cloud). Ingawa tunajitahidi kutoa upatikanaji wa 99.9%, mfumo hautawajibika kisheria wala kifedha kwa hasara yoyote inayotokana na majanga ya asili, kukatika kwa umeme wa gridi ya taifa (TANESCO), kukatika kwa nyaya za intaneti za baharini (undersea internet cable outages), hitilafu za mitandao ya simu za mkononi (Vodacom, Tigo, Airtel, Halotel), au mashambulizi ya kimtandao nje ya uwezo wetu wa kibinadamu.
          </p>
        </div>

        {/* Section 1: Acceptance & Services */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-600 shrink-0" />
            <span>1. Acceptance of Terms & Services Provided</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            By registering an account, subscribing to any package (Starter, Kilimanjaro, Serengeti), or accessing the MauzoChap platform on web, mobile, or desktop, you (“User”, “Merchant”, or “Business Owner”) agree to be bound by these Terms of Service. MauzoChap provides software-as-a-service (SaaS) point-of-sale management, inventory tracking, electronic receipt generation, customer credit tracking, and WhatsApp communication tools.
          </p>
        </section>

        {/* Section 2: Subscriptions & Billing */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-violet-600 shrink-0" />
            <span>2. Subscriptions, Payment Verification & No-Refund Policy</span>
          </h2>
          <div className="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-2">
            <p>
              • <strong>Pre-paid Subscriptions:</strong> All access is billed in advance on a monthly or yearly basis according to the selected package tier.
            </p>
            <p>
              • <strong>Payment Verification:</strong> When paying via Lipa Namba (M-Pesa, Tigo Pesa, Airtel Money, or Bank), merchants must submit an authentic alphanumeric transaction reference. MauzoChap administrators verify transactions before activating services. Fraudulent references will result in instant account ban.
            </p>
            <p>
              • <strong>Strict No-Refund Policy:</strong> Because MauzoChap offers a free trial and digital provisioning is instantaneous upon activation, all subscription fees are non-refundable once verified and activated, regardless of early cancellation or partial usage.
            </p>
          </div>
        </section>

        {/* Section 3: Limitation of Liability & Disaster Defense */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
            <CloudOff className="w-5 h-5 text-rose-600 shrink-0" />
            <span>3. Limitation of Liability, System Downtime & Disaster Defense</span>
          </h2>
          <div className="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-2.5">
            <p>
              TO THE MAXIMUM EXTENT PERMITTED UNDER TANZANIAN LAW, MAUZOCHAP AND ITS OPERATORS, DIRECTORS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, PUNITIVE, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGES WHATSOEVER, INCLUDING LOSS OF PROFITS, LOSS OF REVENUE, BUSINESS INTERRUPTION, LOSS OF BUSINESS OPPORTUNITY, CORRUPTION OF DATA, OR LOSS OF CUSTOMER GOODWILL.
            </p>
            <p>
              <strong>Defense Against Disasters & Outages:</strong> Under no circumstances will MauzoChap be held liable for failure to deliver receipts or downtime resulting from acts of God, flood, fire, civil unrest, government embargoes, telecommunication gateway downtime, third-party cloud hosting disruptions, power failure, or device breakdown at the merchant's premises. In all events, the maximum aggregate liability of MauzoChap shall not exceed the subscription amount paid by the merchant in the preceding thirty (30) days.
            </p>
          </div>
        </section>

        {/* Section 4: Data Ownership & Security */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
            <Lock className="w-5 h-5 text-violet-600 shrink-0" />
            <span>4. Store Data, Backups & Internal Theft Disclaimer</span>
          </h2>
          <div className="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-2">
            <p>
              • <strong>Merchant Data Ownership:</strong> The business owner owns all product names, customer phone numbers, sales transactions, and supplier details recorded in the system.
            </p>
            <p>
              • <strong>Credentials & Cashier Responsibility:</strong> The business owner is solely responsible for managing staff logins and cashier branch roles. MauzoChap is not liable for internal staff theft, intentional falsification of stock records by employees, or unauthorized password sharing.
            </p>
            <p>
              • <strong>Cloud Redundancy:</strong> Automated encrypted database backups are maintained; however, merchants are advised to regularly export monthly Excel/PDF sales reports for their internal archives.
            </p>
          </div>
        </section>

        {/* Section 5: TRA & Tax Compliance Disclaimer */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>5. TRA & Statutory Tax Compliance Disclaimer</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            MauzoChap provides digital record keeping, WhatsApp receipts, and sales calculation calculators. MauzoChap is an operational management software and does not replace statutory tax advice. Each merchant remains solely responsible for calculating, reporting, and remitting applicable Value Added Tax (VAT), withholding taxes, and income taxes to the Tanzania Revenue Authority (TRA) in compliance with United Republic of Tanzania tax codes.
          </p>
        </section>

        {/* Section 6: Governing Law & Jurisdiction */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-violet-600 shrink-0" />
            <span>6. Governing Law & Dispute Resolution</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            These Terms shall be governed by and interpreted in accordance with the laws of the United Republic of Tanzania. Any dispute, controversy, or claim arising out of or relating to these terms shall first be resolved through good faith mutual consultation. If unresolved within 30 days, disputes shall be submitted to the exclusive jurisdiction of the competent courts of Dar es Salaam, Tanzania.
          </p>
        </section>

        {/* Footer Help */}
        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>Have questions about these terms? Contact us at legal@mauzochap.com or WhatsApp: <a href="https://wa.me/255627274168" target="_blank" rel="noreferrer" className="text-emerald-600 font-bold hover:underline">+255 627 274 168</a></div>
          <Link
            to="/auth"
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs uppercase tracking-wider"
          >
            Create Your Account
          </Link>
        </div>
      </main>
    </div>
  );
}
