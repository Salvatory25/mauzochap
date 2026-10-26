import { Lang } from "@/lib/i18n";

export interface LandingTranslation {
  nav: {
    features: string;
    forBusiness: string;
    pricing: string;
    dailySms: string;
    signIn: string;
    getStarted: string;
    seeDemo: string;
  };
  hero: {
    pillBadge: string;
    headlinePrefix: string;
    headlineEmphasis: string;
    subheadline: string;
    primaryCta: string;
    secondaryCta: string;
    widget: {
      storeName: string;
      liveTerminal: string;
      dailyRevenueLabel: string;
      revenueVal: string;
      vsYesterday: string;
      ordersLabel: string;
      ordersVal: string;
      avgTicketLabel: string;
      avgTicketVal: string;
      lowStockLabel: string;
      lowStockVal: string;
      popupText: string;
    };
  };
  capabilities: {
    eyebrow: string;
    headline: string;
    subheadline: string;
    items: Array<{
      id: string;
      title: string;
      description: string;
    }>;
  };
  dailySms: {
    eyebrow: string;
    headline: string;
    subtext: string;
    senderLabel: string;
    senderId: string;
    reportTime: string;
    testBtn: string;
    toastTitle: string;
    toastDesc: string;
    smsBody: {
      header: string;
      date: string;
      sales: string;
      profit: string;
      transactions: string;
      debts: string;
      lowStock: string;
      footer: string;
    };
  };
  businessTypes: {
    eyebrow: string;
    headline: string;
    subtext: string;
    types: Array<{
      id: string;
      title: string;
      subtitle: string;
    }>;
  };
  pricing: {
    eyebrow: string;
    headline: string;
    subtext: string;
    monthly: string;
    annually: string;
    saveBadge: string;
    perMonth: string;
    billedAnnually: string;
    plans: Array<{
      id: "starter" | "kilimanjaro" | "serengeti";
      name: string;
      monthlyPrice: number;
      annualPrice: number;
      tagline: string;
      featured?: boolean;
      badge?: string;
      ctaText: string;
      features: string[];
    }>;
  };
  footer: {
    brandBio: string;
    coverageText: string;
    ctaButton: string;
    productColTitle: string;
    businessColTitle: string;
    copyright: string;
    builtInTz: string;
  };
  modal: {
    title: string;
    subtitle: string;
    shopName: string;
    shopPlaceholder: string;
    ownerName: string;
    ownerPlaceholder: string;
    phone: string;
    phonePlaceholder: string;
    region: string;
    regionPlaceholder: string;
    selectPlan: string;
    submitBtn: string;
    loadingBtn: string;
    closeBtn: string;
    regions: string[];
  };
}

export const landingTranslations: Record<Lang, LandingTranslation> = {
  en: {
    nav: {
      features: "Features",
      forBusiness: "For Business",
      pricing: "Pricing",
      dailySms: "Daily SMS",
      signIn: "Sign in",
      getStarted: "Get Started",
      seeDemo: "See Demo",
    },
    hero: {
      pillBadge: "• Built for Tanzania",
      headlinePrefix: "Run your shop with ",
      headlineEmphasis: "confidence.",
      subheadline:
        "MauzoChap is the modern point of sale and business management platform for retail, pharmacies, restaurants, and wholesalers — sales, inventory, customers, and daily reports in one place.",
      primaryCta: "Get Started Today",
      secondaryCta: "See Demo",
      widget: {
        storeName: "Duka Kuu Kariakoo",
        liveTerminal: "Active POS Session",
        dailyRevenueLabel: "Daily Revenue",
        revenueVal: "TZS 1,284,500",
        vsYesterday: "+18% vs yesterday",
        ordersLabel: "Orders",
        ordersVal: "47",
        avgTicketLabel: "Avg Ticket",
        avgTicketVal: "27,330",
        lowStockLabel: "Low Stock",
        lowStockVal: "3",
        popupText: "WhatsApp Receipt Sent to Client • TZS 45,000",
      },
    },
    capabilities: {
      eyebrow: "CORE CAPABILITIES",
      headline: "Everything needed to manage retail effortlessly",
      subheadline:
        "Engineered for sub-2-second checkout, tight stock control, and zero paper wastage.",
      items: [
        {
          id: "pos",
          title: "Lightning POS",
          description:
            "Sell in seconds with phone camera barcode scanning, item search & fast cash, Lipa Namba or credit split payments.",
        },
        {
          id: "inventory",
          title: "Smart Inventory",
          description:
            "Real-time stock balances, low-stock warnings, purchase movement logs, and batch tracking.",
        },
        {
          id: "customers",
          title: "Customer Profiles",
          description:
            "Customer buying histories, store credit balances, debt ledger, and automated payment reminders.",
        },
        {
          id: "receipts",
          title: "Receipts Your Way",
          description:
            "Generate standard 80mm thermal paper receipts or send instant digital receipts to customer WhatsApp at 0 TZS.",
        },
        {
          id: "reports",
          title: "Real-time Reports",
          description:
            "Daily net profit/loss, inventory asset valuation, cashier shift reconciliation, and sales trend velocity.",
        },
        {
          id: "roles",
          title: "Role-Based Security",
          description:
            "Assign strict permissions: Admin (full), Manager (discounts & stock), and Cashier (sales & receipt issuance only).",
        },
      ],
    },
    dailySms: {
      eyebrow: "FEATURE SPOTLIGHT",
      headline: "Get Daily Business Reports via SMS Every Night at 20:30 PM",
      subtext:
        "Stay in control wherever you are. Even without data bundles or opening the app, MauzoChap automatically delivers an executive sales and profit summary directly to your mobile phone every night at 20:30 PM under Sender ID: MAUZOCHAP.",
      senderLabel: "Official Sender ID",
      senderId: "MAUZOCHAP",
      reportTime: "20:30 PM Daily",
      testBtn: "Send Sample SMS Test",
      toastTitle: "SMS Delivered to Your Phone!",
      toastDesc: "From MAUZOCHAP: Net Profit TZS 385,000 • 47 transactions.",
      smsBody: {
        header: "[MauzoChap Report - 20:30 PM]",
        date: "Tarehe: 20/10/2026",
        sales: "Mauzo Yote: TZS 1,284,500",
        profit: "Faida Halisi: TZS 385,000",
        transactions: "Idadi ya Miamala: 47",
        debts: "Madeni Yaliyokusanywa: TZS 120,000",
        lowStock: "Bidhaa Zilizobaki Chini: 3 items",
        footer: "Asante kwa kutumia MauzoChap POS!",
      },
    },
    businessTypes: {
      eyebrow: "TAILORED WORKFLOWS",
      headline: "Built specifically for your industry",
      subtext:
        "Pre-configured catalogs, units of measurement, and compliance features ready on day one.",
      types: [
        { id: "shops", title: "Shops & Maduka", subtitle: "Fast counter sales & price tiers" },
        {
          id: "supermarket",
          title: "Supermarkets",
          subtitle: "High-speed multi-lane barcode checkout",
        },
        {
          id: "pharmacy",
          title: "Pharmacies & Duka la Dawa",
          subtitle: "FEFO, batches & proactive expiry alerts",
        },
        {
          id: "hardware",
          title: "Hardware & Electricals",
          subtitle: "Serial numbers, decimals & proforma invoices",
        },
        {
          id: "wholesale",
          title: "Wholesale & Distribution",
          subtitle: "Bulk pricing, carton splits & supplier debts",
        },
        {
          id: "restaurants",
          title: "Restaurants & Bars",
          subtitle: "Shift balancing & crate-to-bottle tracking",
        },
        {
          id: "fashion",
          title: "Boutiques & Fashion",
          subtitle: "Sizes (S, M, L), colors & WhatsApp receipts",
        },
        {
          id: "electronics",
          title: "Phones & Electronics",
          subtitle: "IMEI logging & warranty protection records",
        },
      ],
    },
    pricing: {
      eyebrow: "SIMPLE, TRANSPARENT TIERS",
      headline: "Pricing that Grows with You",
      subtext:
        "Honest pricing designed for Tanzanian business owners. No hidden fees or hardware lock-in.",
      monthly: "Monthly",
      annually: "Annually (Save 20%)",
      saveBadge: "Save 20%",
      perMonth: "/ month",
      billedAnnually: "billed annually",
      plans: [
        {
          id: "starter",
          name: "Starter",
          monthlyPrice: 10500,
          annualPrice: 8400,
          tagline: "Single counter user for small shops",
          ctaText: "Choose Starter",
          features: [
            "1 Business Location",
            "1 Counter User",
            "Up to 100 Products",
            "Basic Business Reports",
            "Unlimited Invoices & Receipts",
            "WhatsApp & Thermal Printing",
          ],
        },
        {
          id: "kilimanjaro",
          name: "Kilimanjaro",
          monthlyPrice: 15500,
          annualPrice: 12400,
          tagline: "High-velocity retail & growing stores",
          featured: true,
          badge: "MOST POPULAR",
          ctaText: "Get Kilimanjaro",
          features: [
            "1 Main Location (Branches Ready)",
            "3 Staff Users with Roles",
            "Unlimited Products Catalog",
            "Nightly 20:30 PM SMS Reports",
            "WhatsApp Digital Receipts (0 TZS)",
            "Multiple Branches Capability",
            "Customer Debt & Credit Ledger",
          ],
        },
        {
          id: "serengeti",
          name: "Serengeti",
          monthlyPrice: 25500,
          annualPrice: 20400,
          tagline: "Multi-branch retail & enterprise wholesalers",
          badge: "ENTERPRISE",
          ctaText: "Choose Serengeti",
          features: [
            "Unlimited Business Locations",
            "Unlimited Staff Users",
            "Unlimited Products & SKUs",
            "Nightly 20:30 PM SMS Reports",
            "VIP Priority Support 24/7",
            "Dedicated Account Manager",
            "Inter-Branch Stock Transfers",
          ],
        },
      ],
    },
    footer: {
      brandBio:
        "MauzoChap is the ultimate POS system for businesses in Tanzania. Fast sales, barcode support, credit management, and automatic daily SMS sales reports.",
      coverageText:
        "Serving shops across Tanzania: Dar es Salaam, Arusha, Mwanza, Dodoma, Mbeya, Morogoro, Tanga, Moshi, Zanzibar and beyond.",
      ctaButton: "GET STARTED FREE",
      productColTitle: "Product",
      businessColTitle: "For Your Business",
      copyright: "© 2026 MauzoChap. All rights reserved.",
      builtInTz: "Built in Tanzania",
    },
    modal: {
      title: "Start Your Free MauzoChap Account",
      subtitle: "Set up your store in 2 minutes. No credit card required.",
      shopName: "Shop / Business Name",
      shopPlaceholder: "e.g., Kariakoo Super Store",
      ownerName: "Owner Full Name",
      ownerPlaceholder: "e.g., Juma Rashid",
      phone: "Phone Number (Tanzania)",
      phonePlaceholder: "+255 7XX XXX XXX",
      region: "Region in Tanzania",
      regionPlaceholder: "Select your region...",
      selectPlan: "Chosen Plan",
      submitBtn: "Complete Free Registration",
      loadingBtn: "Setting up account...",
      closeBtn: "Cancel",
      regions: [
        "Dar es Salaam",
        "Arusha",
        "Mwanza",
        "Dodoma",
        "Mbeya",
        "Morogoro",
        "Tanga",
        "Kilimanjaro (Moshi)",
        "Zanzibar",
        "Kigoma",
        "Tabora",
        "Iringa",
        "Mtwara",
        "Ruvuma",
        "Shinyanga",
      ],
    },
  },
  sw: {
    nav: {
      features: "Sifa Kuu",
      forBusiness: "Kwa Biashara",
      pricing: "Vifurushi",
      dailySms: "SMS ya Siku",
      signIn: "Ingia",
      getStarted: "Anza Sasa",
      seeDemo: "Tazama Demo",
    },
    hero: {
      pillBadge: "• Imejengwa kwa ajili ya Tanzania",
      headlinePrefix: "Endesha duka lako kwa ",
      headlineEmphasis: "kujiamini.",
      subheadline:
        "MauzoChap ni mfumo wa kisasa wa POS na usimamizi wa biashara kwa maduka ya rejareja, maduka ya dawa, migahawa, na jumla — mauzo, stoo, wateja na ripoti za kila siku zote sehemu moja.",
      primaryCta: "Anza Leo Bure",
      secondaryCta: "Tazama Demo",
      widget: {
        storeName: "Duka Kuu Kariakoo",
        liveTerminal: "Kaunta Ipo Hewani",
        dailyRevenueLabel: "Mauzo ya Leo",
        revenueVal: "TZS 1,284,500",
        vsYesterday: "+18% kulinganisha na jana",
        ordersLabel: "Miamala",
        ordersVal: "47",
        avgTicketLabel: "Wastani",
        avgTicketVal: "27,330",
        lowStockLabel: "Stoo Ndogo",
        lowStockVal: "3",
        popupText: "Risiti ya WhatsApp Imetumwa kwa Mteja • TZS 45,000",
      },
    },
    capabilities: {
      eyebrow: "SIFA KUU ZA MFUMO",
      headline: "Kila kitu unachohitaji kusimamia duka kwa ufanisi",
      subheadline:
        "Imeundwa kwa kasi ya chini ya sekunde 2 kaunta, ulinzi mkali wa stoo, na kuondoa gharama za karatasi.",
      items: [
        {
          id: "pos",
          title: "Lightning POS",
          description:
            "Uza kwa sekunde 2 kwa kamera ya simu au barcode scanner. Pokea Taslimu, Lipa Namba au weka mauzo ya mkopo.",
        },
        {
          id: "inventory",
          title: "Smart Inventory",
          description:
            "Hesabu ya stoo ya papo hapo, tahadhari za bidhaa zinazokaribia kuisha, na kumbukumbu ya bidhaa zilizotoka.",
        },
        {
          id: "customers",
          title: "Wasifu wa Wateja",
          description:
            "Historia ya manunuzi, daftari la madeni na mikopo, na vikumbusho vya malipo kwa wateja.",
        },
        {
          id: "receipts",
          title: "Risiti kwa Mtindo Wako",
          description:
            "Toa risiti za mashine ya thermal ya 80mm au tuma risiti safi ya WhatsApp kwa mteja bila gharama ya karatasi (0 TZS).",
        },
        {
          id: "reports",
          title: "Ripoti Halisi za Biashara",
          description:
            "Faida halisi ya kila siku, thamani ya stoo, uwiano wa fedha za kila zamu na mwenendo wa mauzo.",
        },
        {
          id: "roles",
          title: "Ulinzi wa Ruhusa za Watumishi",
          description:
            "Gawa majukumu: Msimamizi Mkuu (Admin), Meneja (stoo & punguzo), na Mhudumu wa Kaunta (mauzo na risiti tu).",
        },
      ],
    },
    dailySms: {
      eyebrow: "KIPENGELE MAALUM",
      headline: "Pokea Ripoti ya Kila Siku ya Biashara kupitia SMS Saa 20:30 Usiku",
      subtext:
        "Baki na udhibiti kamili popote ulipo. Hata bila vifurushi vya bando au kufungua mfumo, MauzoChap inakutumia muhtasari wa mauzo na faida moja kwa moja kwenye simu yako kila usiku saa 20:30 kutoka Sender ID: MAUZOCHAP.",
      senderLabel: "Sender ID Rasmi",
      senderId: "MAUZOCHAP",
      reportTime: "Saa 20:30 Jioni Kila Siku",
      testBtn: "Tuma Jaribio la SMS ya Mfano",
      toastTitle: "SMS Imefika Kwenye Simu Yako!",
      toastDesc: "Kutoka MAUZOCHAP: Faida Halisi TZS 385,000 • Miamala 47.",
      smsBody: {
        header: "[MauzoChap Report - 20:30 PM]",
        date: "Tarehe: 20/10/2026",
        sales: "Mauzo Yote: TZS 1,284,500",
        profit: "Faida Halisi: TZS 385,000",
        transactions: "Idadi ya Miamala: 47",
        debts: "Madeni Yaliyokusanywa: TZS 120,000",
        lowStock: "Bidhaa Zilizobaki Chini: 3 items",
        footer: "Asante kwa kutumia MauzoChap POS!",
      },
    },
    businessTypes: {
      eyebrow: "SULUHU KWA KILA BIASHARA",
      headline: "Imeundwa maalum kwa aina ya biashara yako",
      subtext:
        "Bidhaa na vipimo vilivyotayarishwa tayari kuanza kazi siku ya kwanza bila kuchelewa.",
      types: [
        {
          id: "shops",
          title: "Maduka & Rejareja",
          subtitle: "Mauzo ya haraka kaunta & bei za jumla",
        },
        {
          id: "supermarket",
          title: "Supermarkets & Vyakula",
          subtitle: "Kasi ya barcode & foleni fupi",
        },
        {
          id: "pharmacy",
          title: "Maduka ya Dawa & Agrovet",
          subtitle: "Tahadhari ya expiry & namba za batch",
        },
        {
          id: "hardware",
          title: "Hardware & Vifaa vya Ujenzi",
          subtitle: "Serial numbers, vipimo & ankara rasmi",
        },
        {
          id: "wholesale",
          title: "Biashara za Jumla & Wasambazaji",
          subtitle: "Bei za kreti/boksi & madeni ya wateja",
        },
        {
          id: "restaurants",
          title: "Migahawa & Baa",
          subtitle: "Hesabu ya shifti & kreti kwenda chupa",
        },
        {
          id: "fashion",
          title: "Nguo & Mitindo",
          subtitle: "Rangi, saizi (S, M, L) & risiti za WhatsApp",
        },
        {
          id: "electronics",
          title: "Simu & Vifaa vya Umeme",
          subtitle: "Kumbukumbu ya IMEI & kinga ya warranty",
        },
      ],
    },
    pricing: {
      eyebrow: "BEI RAHISI NA WAZI",
      headline: "Vifurushi Vinavyokua na Biashara Yako",
      subtext: "Bei wazi na nafuu kwa wafanyabiashara wa Kitanzania. Hakuna ada zilizofichika.",
      monthly: "Kila Mwezi",
      annually: "Kila Mwaka (Okoa 20%)",
      saveBadge: "Okoa 20%",
      perMonth: "/ mwezi",
      billedAnnually: "inapolipiwa mwaka mzima",
      plans: [
        {
          id: "starter",
          name: "Starter",
          monthlyPrice: 10500,
          annualPrice: 8400,
          tagline: "Mhudumu 1 wa kaunta kwa maduka madogo",
          ctaText: "Chagua Starter",
          features: [
            "Tawi 1 la Biashara",
            "Mhudumu 1 wa Kaunta",
            "Hadi Bidhaa 100",
            "Ripoti za Msingi za Mauzo",
            "Ankara & Risiti Bila Kikomo",
            "Risiti za WhatsApp & Thermal",
          ],
        },
        {
          id: "kilimanjaro",
          name: "Kilimanjaro",
          monthlyPrice: 15500,
          annualPrice: 12400,
          tagline: "Maduka yanayokua yenye wafanyakazi",
          featured: true,
          badge: "INAYOPENDWA ZAIDI",
          ctaText: "Anza na Kilimanjaro",
          features: [
            "Tawi 1 Kuu (Tayari kwa Matawi)",
            "Wafanyakazi 3 wenye Ruhusa",
            "Bidhaa Bila Kikomo",
            "Ripoti ya SMS Saa 20:30 Usiku",
            "Risiti za WhatsApp (0 TZS Karatasi)",
            "Uwezo wa Matawi Mengi",
            "Daftari la Madeni & Mikopo",
          ],
        },
        {
          id: "serengeti",
          name: "Serengeti",
          monthlyPrice: 25500,
          annualPrice: 20400,
          tagline: "Matawi mengi na biashara za jumla",
          badge: "ENTERPRISE",
          ctaText: "Chagua Serengeti",
          features: [
            "Matawi Yasiyo na Kikomo",
            "Wafanyakazi Wasio na Kikomo",
            "Bidhaa & SKUs Bila Kikomo",
            "Ripoti ya SMS Saa 20:30 Usiku",
            "Msaada wa VIP Saa 24/7",
            "Meneja Maalum wa Huduma",
            "Uhamisho wa Stoo Kati ya Matawi",
          ],
        },
      ],
    },
    footer: {
      brandBio:
        "MauzoChap ni mfumo kiongozi wa POS kwa biashara za Tanzania. Mauzo ya haraka, barcode, usimamizi wa madeni na SMS ya kila siku.",
      coverageText:
        "Inahudumia maduka kote Tanzania: Dar es Salaam, Arusha, Mwanza, Dodoma, Mbeya, Morogoro, Tanga, Moshi, Zanzibar na mikoa yote.",
      ctaButton: "ANZA BURE SASA",
      productColTitle: "Mfumo",
      businessColTitle: "Kwa Biashara Yako",
      copyright: "© 2026 MauzoChap. Haki zote zimehifadhiwa.",
      builtInTz: "Imejengwa Tanzania",
    },
    modal: {
      title: "Anza Akaunti Yako ya Bure ya MauzoChap",
      subtitle: "Sanidi duka lako kwa dakika 2 tu. Bila kadi ya benki.",
      shopName: "Jina la Duka / Biashara",
      shopPlaceholder: "Mf: Duka Kuu la Kariakoo",
      ownerName: "Jina Kamili la Mmiliki",
      ownerPlaceholder: "Mf: Juma Rashid",
      phone: "Namba ya Simu (Tanzania)",
      phonePlaceholder: "+255 7XX XXX XXX",
      region: "Mkoa wako Tanzania",
      regionPlaceholder: "Chagua mkoa...",
      selectPlan: "Kifurushi Ulichochagua",
      submitBtn: "Kamilisha Usajili wa Bure",
      loadingBtn: "Inasanidi akaunti...",
      closeBtn: "Funga",
      regions: [
        "Dar es Salaam",
        "Arusha",
        "Mwanza",
        "Dodoma",
        "Mbeya",
        "Morogoro",
        "Tanga",
        "Kilimanjaro (Moshi)",
        "Zanzibar",
        "Kigoma",
        "Tabora",
        "Iringa",
        "Mtwara",
        "Ruvuma",
        "Shinyanga",
      ],
    },
  },
};

export const LANDING_TRANSLATIONS = landingTranslations;
