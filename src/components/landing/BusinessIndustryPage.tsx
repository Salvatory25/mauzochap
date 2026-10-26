import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Store,
  ShoppingCart,
  Pill,
  Wrench,
  Building2,
  UtensilsCrossed,
  Shirt,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Zap,
  BarChart3,
  Users,
  Receipt,
  Sparkles,
  PhoneCall,
  Printer,
  ScanLine,
  HelpCircle,
  LucideIcon,
  ChevronDown,
} from "lucide-react";
import { formatTZS } from "@/lib/i18n";
import { RegisterModal } from "./RegisterModal";

export type IndustryKey =
  | "shops"
  | "supermarkets"
  | "pharmacies"
  | "hardware"
  | "wholesale"
  | "restaurants"
  | "fashion"
  | "electronics";

interface IndustryData {
  key: IndustryKey;
  icon: LucideIcon;
  badge: string;
  badgeSw: string;
  title: string;
  titleSw: string;
  headline: string;
  headlineSw: string;
  subheadline: string;
  subheadlineSw: string;
  color: string;
  lightBg: string;
  borderColor: string;
  challenges: {
    problem: string;
    problemSw: string;
    solution: string;
    solutionSw: string;
  }[];
  features: {
    title: string;
    titleSw: string;
    desc: string;
    descSw: string;
    icon: LucideIcon;
    highlight: string;
  }[];
  sampleCatalog: {
    name: string;
    unit: string;
    price: number;
    tag: string;
  }[];
  metrics: {
    stat: string;
    label: string;
    labelSw: string;
  }[];
  faqs: {
    q: string;
    qSw: string;
    a: string;
    aSw: string;
  }[];
  testimonial: {
    quote: string;
    quoteSw: string;
    author: string;
    role: string;
    location: string;
  };
}

export const INDUSTRY_CONFIGS: Record<IndustryKey, IndustryData> = {
  shops: {
    key: "shops",
    icon: Store,
    badge: "TAILORED FOR SHOPS & GENERAL STORES",
    badgeSw: "MAALUM KWA MADUKA YA REJAREJA & MTAANI",
    title: "Shops and Maduka",
    titleSw: "Maduka na Rejareja",
    headline: "Run Your Retail Shop with Zero Stock Loss and Faster Sales",
    headlineSw: "Simamia Duka Lako Bila Kupoteza Bidhaa na Mauzo ya Haraka",
    subheadline:
      "Designed specifically for Tanzanian neighborhood shops, mini-dukas, and general retailers. Record fast sales on any mobile phone or computer, manage customer credit notebooks (daftari la madeni), and get automatic daily SMS sales summaries.",
    subheadlineSw:
      "Imeundwa maalum kwa maduka ya mtaani na wafanyabiashara wa rejareja Tanzania. Rekodi mauzo ya haraka kwa simu au kompyuta, dhibiti daftari la madeni ya wateja bila hasara, na pokea ripoti ya SMS kila jioni.",
    color: "from-blue-600 to-indigo-700",
    lightBg: "bg-blue-50/50",
    borderColor: "border-blue-200",
    metrics: [
      { stat: "110+", label: "Active Retail Shops", labelSw: "Maduka Yaliyopo Kazini" },
      { stat: "0%", label: "Lost Debt Records", labelSw: "Kupotea kwa Kumbukumbu za Madeni" },
      { stat: "3 Sec", label: "Average Checkout Speed", labelSw: "Kasi ya Kukata Risiti" },
      { stat: "24/7", label: "WhatsApp & Phone Support", labelSw: "Msaada kwa Simu & WhatsApp" },
    ],
    challenges: [
      {
        problem: "Customer credit is recorded on paper notebooks that get torn or lost.",
        problemSw: "Madeni ya wateja yanaandikwa kwenye daftari linalochakaa au kupotea.",
        solution: "Digital credit ledger with instant customer balance lookup and SMS payment reminders.",
        solutionSw: "Daftari la kisasa la kielektroniki, linatafuta salio la mteja kwa sekunde moja na risiti ya malipo.",
      },
      {
        problem: "Shop attendants misplace cash or sell stock without recording.",
        problemSw: "Wasaidizi wa duka wanauza bidhaa bila kurekodi au fedha inapotea kwenye droo.",
        solution: "Every transaction requires cashier logging with real-time end-of-shift cash balancing.",
        solutionSw: "Kila mauzo yanasajiliwa chini ya muuzaji na hesabu ya shifti inafungwa mwisho wa siku bila utata.",
      },
      {
        problem: "Fast-selling goods like sugar, flour, and cooking oil run out unexpectedly.",
        problemSw: "Bidhaa muhimu kama unga, sukari na mafuta zinamalizika bila mmiliki kujua mapema.",
        solution: "Automatic low stock alerts directly notify you before items run out completely.",
        solutionSw: "Mfumo unatoa tahadhari ya bidhaa zilizobaki chini kabla ya rafu kuwa tupu.",
      },
    ],
    features: [
      {
        title: "Fast Counter Sales",
        titleSw: "Mauzo ya Haraka Kaunta",
        desc: "Tap items or search by initials. Complete cash, M-Pesa, Airtel Money, or Tigo Pesa transactions in under 5 seconds.",
        descSw: "Gusa bidhaa au tafuta kwa herufi za kwanza. Pokea fedha taslimu au mitandao ya simu chini ya sekunde 5.",
        icon: Zap,
        highlight: "Works offline & online",
      },
      {
        title: "Customer Debt Notebook (Daftari la Madeni)",
        titleSw: "Daftari la Madeni ya Wateja",
        desc: "Keep precise track of who owes you, total outstanding balance, and record partial repayments easily.",
        descSw: "Fuatilia nani anadaiwa, kiasi gani cha deni kimebaki, na rekodi marejesho ya kidogo kidogo bila shaka.",
        icon: Users,
        highlight: "Zero calculation errors",
      },
      {
        title: "Wholesale & Retail Dual Pricing",
        titleSw: "Bei za Jumla na Rejareja",
        desc: "Easily switch between piece retail price and bundle/wholesale price for frequent buyers directly at checkout.",
        descSw: "Badili bei ya rejareja au ya jumla kwa wateja maalum au wanaponunua kwa wingi bila kuanzisha bidhaa upya.",
        icon: Receipt,
        highlight: "Dual-tier price rules",
      },
      {
        title: "Daily SMS Business Reports",
        titleSw: "Ripoti ya SMS ya Kila Siku",
        desc: "Get an executive summary SMS sent directly to your phone every evening showing total sales, cash, debts collected, and low stock.",
        descSw: "Tumiwa ujumbe mfupi wa SMS kila jioni kwenye simu yako ukionyesha jumla ya mauzo, pesa iliyoingia, na madeni yaliyolipwa.",
        icon: BarChart3,
        highlight: "Owner peace of mind",
      },
    ],
    sampleCatalog: [
      { name: "Unga wa Ngano Azam (2kg)", unit: "Pakiti", price: 3500, tag: "Food" },
      { name: "Sukari Kilombero (1kg)", unit: "Kilo", price: 3200, tag: "Food" },
      { name: "Mafuta ya Kupikia Korie (1L)", unit: "Chupa", price: 5500, tag: "Fats" },
      { name: "Sabuni ya Unga Omo (500g)", unit: "Pakiti", price: 2800, tag: "Cleaning" },
      { name: "Maziwa ya Unga Nido (400g)", unit: "Kopo", price: 14000, tag: "Dairy" },
    ],
    faqs: [
      {
        q: "Can I use MauzoChap on my ordinary smartphone without buying a computer?",
        qSw: "Je, naweza kutumia simu yangu ya kawaida ya Android au lazima ninunue kompyuta?",
        a: "Yes! MauzoChap is fully responsive and runs smoothly on Android phones, iPhones, tablets, and desktop computers alike.",
        aSw: "Ndio kabisa! MauzoChap inafanya kazi vizuri sana kwenye simu yoyote ya kawaida ya Android, iPhone, tablet au kompyuta.",
      },
      {
        q: "What happens if electricity cuts off (TANESCO)?",
        qSw: "Je, umeme ukikatika (TANESCO) biashara itasimama?",
        a: "Not at all. You can continue running sales on your phone or battery-powered tablet using cellular data.",
        aSw: "Hapana! Unaendelea kuuza kwa simu yako au tablet inayotumia betri na bando la kawaida bila kukwama.",
      },
      {
        q: "Can I print receipts for customers who ask for them?",
        qSw: "Je, naweza kutoa risiti kwa wateja wanaotaka?",
        a: "Yes. You can connect a portable 58mm Bluetooth thermal printer or send instant electronic receipts via WhatsApp / SMS.",
        aSw: "Ndio. Unaweza kuunganisha mashine ndogo ya Bluetooth ya 58mm au kutuma risiti safi moja kwa moja kwa WhatsApp au SMS.",
      },
    ],
    testimonial: {
      quote:
        "Tangu nianze kutumia MauzoChap dukani kwangu Mwenge, sijawahi kupoteza hata shilingi mia ya mauzo. Wasaidizi wangu wanaingiza kila muamala na jioni napata SMS ya faida yangu yote.",
      quoteSw:
        "Tangu nianze kutumia MauzoChap dukani kwangu Mwenge, sijawahi kupoteza hata shilingi mia ya mauzo. Wasaidizi wangu wanaingiza kila muamala na jioni napata SMS ya faida yangu yote.",
      author: "Mzee Juma Hamisi",
      role: "Mmiliki wa Duka la Rejareja",
      location: "Mwenge, Dar es Salaam",
    },
  },

  supermarkets: {
    key: "supermarkets",
    icon: ShoppingCart,
    badge: "ENGINEERED FOR SUPERMARKETS & MINIMARTS",
    badgeSw: "IMEUNDWA KWA SUPERMARKET & MINIMART",
    title: "Supermarkets & Retail",
    titleSw: "Supermarket na Vyakula",
    headline: "High-Speed Multi-Lane POS for Busy Supermarkets and Minimarts",
    headlineSw: "Mfumo wa Kasi ya Juu wa Kaunta Nyingi kwa Supermarkets na Minimarts",
    subheadline:
      "Keep checkout queues moving with blazing fast barcode scanning, multi-cashier terminal synchronization, 80mm thermal receipt printing, and comprehensive stock auditing.",
    subheadlineSw:
      "Ondoa foleni kaunta kwa mashine ya barcode ya haraka, kusawazisha kaunta nyingi za wauzaji, kutoa risiti za haraka za 80mm, na kukagua stoo kwa usahihi wa hali ya juu.",
    color: "from-emerald-600 to-teal-700",
    lightBg: "bg-emerald-50/50",
    borderColor: "border-emerald-200",
    metrics: [
      { stat: "0.8s", label: "Barcode Scan Latency", labelSw: "Kasi ya Kusoma Barcode" },
      { stat: "10,000+", label: "Products Catalog Capacity", labelSw: "Uwezo wa Bidhaa kwenye Mfumo" },
      { stat: "5+", label: "Concurrent Cashier Lanes", labelSw: "Kaunta Zinazofanya Kazi Pamoja" },
      { stat: "100%", label: "Inventory Accuracy", labelSw: "Usahihi wa Hesabu ya Stoo" },
    ],
    challenges: [
      {
        problem: "Long customer queues at checkout during peak shopping hours.",
        problemSw: "Foleni ndefu za wateja kaunta wakati wa jioni au siku za sikukuu.",
        solution: "Lightning-fast barcode scanner integration with keyboard shortcuts and instant product lookups.",
        solutionSw: "Scanner ya barcode inayofanya kazi papo hapo na njia za mkato za keyboard kumaliza mauzo haraka.",
      },
      {
        problem: "Managing thousands of SKUs and preventing cashier theft across shifts.",
        problemSw: "Kusimamia maelfu ya bidhaa na kuzuia wizi wa fedha wakati wa kubadilishana shifti.",
        solution: "Automated cashier shift closing (X-Report and Z-Report) with strict drawer cash declarations.",
        solutionSw: "Ripoti kamili ya shifti (X-Report na Z-Report) ambapo muuzaji anatangaza fedha aliyonayo kabla ya kuona ripoti.",
      },
      {
        problem: "Expired perishable goods sitting on shelves leading to losses.",
        problemSw: "Vyakula na maziwa vinavyoharibika kubaki rafu mpaka kuisha muda (expiry) na kuleta hasara.",
        solution: "Batch and expiration tracking alerts warn management weeks before expiry dates arrive.",
        solutionSw: "Tahadhari za tarehe za mwisho wa matumizi (expiry) zinakutaarifu wiki kadhaa kabla ya bidhaa kuoza.",
      },
    ],
    features: [
      {
        title: "Multi-Lane Terminal Sync",
        titleSw: "Kaunta Nyingi Zinazosawazishwa",
        desc: "Run 2, 5, or 10 checkout lanes simultaneously. Inventory updates across all counters in real time.",
        descSw: "Endesha kaunta 2, 5 au 10 kwa wakati mmoja. Bidhaa ikinunuliwa kaunta moja, stoo inasasishwa mara moja kwa zote.",
        icon: ScanLine,
        highlight: "Real-time sync",
      },
      {
        title: "Barcode Printing & Scanning",
        titleSw: "Kusoma & Kuchapa Barcode",
        desc: "Compatible with all standard USB & wireless barcode scanners. Generate custom barcode labels for locally repacked items.",
        descSw: "Inakubali barcode scanner zote za USB na wireless. Unaweza kuchapa barcode zako za bidhaa ulizofungasha wewe mwenyewe.",
        icon: Printer,
        highlight: "Universal scanner support",
      },
      {
        title: "Shift Handover & Drawer Audit",
        titleSw: "Ripoti za Shifti & Usalama wa Droo",
        desc: "Each cashier logs in with individual PIN. Compare declared drawer cash against system sales before shift release.",
        descSw: "Kila muuzaji anajisajili kwa PIN yake. Mfumo unalinganisha pesa iliyopo kwenye droo dhidi ya mauzo halisi ya shifti.",
        icon: ShieldCheck,
        highlight: "Strict accountability",
      },
      {
        title: "Full Inventory Stocktaking",
        titleSw: "Ukaguzi Kamili wa Stoo (Stocktaking)",
        desc: "Conduct quick physical counts with a wireless scanner. Identify shrinkage, damages, or discrepancies immediately.",
        descSw: "Fanya hesabu ya stoo kwa kutumia scanner ya mkononi. Tambua mara moja bidhaa zilizopotea, kuharibika au kuibwa.",
        icon: BarChart3,
        highlight: "Zero variance audit",
      },
    ],
    sampleCatalog: [
      { name: "Cereals Corn Flakes 500g", unit: "Box", price: 9500, tag: "Breakfast" },
      { name: "Asas Fresh Milk 500ml", unit: "Packet", price: 1500, tag: "Dairy" },
      { name: "Kilombero Super Rice 5kg", unit: "Bag", price: 16500, tag: "Grains" },
      { name: "Colgate Triple Action 150g", unit: "Tube", price: 3800, tag: "Oral Care" },
      { name: "Coca-Cola 500ml PET", unit: "Bottle", price: 1000, tag: "Beverages" },
    ],
    faqs: [
      {
        q: "Does MauzoChap connect to ESC/POS thermal receipt printers?",
        qSw: "Je, MauzoChap inaungana na mashine za risiti za thermal za 80mm na 58mm?",
        a: "Yes! It connects natively with standard USB, Ethernet LAN, and Bluetooth thermal printers like Epson, Xprinter, and Rongta.",
        aSw: "Ndio kabisa! Inaungana na mashine zote za risiti za USB, mtandao wa LAN na Bluetooth kama Epson, Xprinter na Rongta.",
      },
      {
        q: "Can cashiers access sensitive profit and cost prices?",
        qSw: "Je, wafanyakazi wa kaunta wanaweza kuona faida na bei niliyonunulia bidhaa?",
        a: "No. Role-based permissions ensure cashiers only see selling prices and checkout functions. Cost prices and profit margins are locked to Managers and Admins.",
        aSw: "Hapana. Mfumo una ulinzi madhubuti wa viwango vya watumiaji. Wauzaji wanaona bei ya kuuzia tu; faida na bei ya ununuzi ni siri ya Mmiliki na Meneja pekee.",
      },
      {
        q: "Can we sell weighed items like meat, fruits, and vegetables?",
        qSw: "Je, tunaweza kuuza vitu vya kupima kama nyama, matunda na mbogamboga?",
        a: "Yes, MauzoChap supports decimal quantities (e.g. 1.45 kg of beef or 0.75 kg of tomatoes) with automatic price calculations.",
        aSw: "Ndio, mfumo unakubali vipimo vya desimali (mfano kilo 1.45 ya nyama au kilo 0.75 ya nyanya) na unapiga hesabu ya bei moja kwa moja.",
      },
    ],
    testimonial: {
      quote:
        "Tangu tuweke MauzoChap kwenye Supermarket yetu ya kaunta tatu, foleni zimeisha kabisa. Tunafanya mauzo zaidi ya 800 kwa siku bila mfumo kuganda hata mara moja.",
      quoteSw:
        "Tangu tuweke MauzoChap kwenye Supermarket yetu ya kaunta tatu, foleni zimeisha kabisa. Tunafanya mauzo zaidi ya 800 kwa siku bila mfumo kuganda hata mara moja.",
      author: "David Mushi",
      role: "Meneja Mkuu, FreshChoice Supermarket",
      location: "Sinza, Dar es Salaam",
    },
  },

  pharmacies: {
    key: "pharmacies",
    icon: Pill,
    badge: "COMPLIANT FEFO PHARMACY POS",
    badgeSw: "MFUMO RASMI WA MADUKA YA DAWA & AGROVET",
    title: "Pharmacies & Duka la Dawa",
    titleSw: "Maduka ya Dawa na Agrovet",
    headline: "Protect Patients and Profits with Batch & Expiry Management",
    headlineSw: "Linda Afya za Wateja na Faida Yako kwa Kudhibiti Batch na Expiry za Dawa",
    subheadline:
      "Engineered specifically for Part II pharmacies, dispensaries, veterinary shops, and agrovet outlets in Tanzania. Enforce FEFO (First-Expired First-Out), get automated 90-day expiry warning alerts, and print clear dosage instructions.",
    subheadlineSw:
      "Imeundwa maalum kwa maduka ya dawa muhimu (Part II), maduka ya dawa za binadamu na mifugo (Agrovet) Tanzania. Dhibiti dawa kwa kufuata FEFO, pata tahadhari za dawa zinazoelekea kuisha muda, na chapisha maelekezo sahihi ya dozi.",
    color: "from-rose-600 to-red-700",
    lightBg: "bg-rose-50/50",
    borderColor: "border-rose-200",
    metrics: [
      { stat: "90 Days", label: "Proactive Expiry Warning Alerts", labelSw: "Tahadhari ya Dawa Ku-expire Mapema" },
      { stat: "100%", label: "Batch & Lot Traceability", labelSw: "Ufuatiliaji wa Namba za Batch" },
      { stat: "FEFO", label: "Automated Stock Rotation", labelSw: "Mfumo wa Kutoa Dawa za Mapema Kwanza" },
      { stat: "Zero", label: "Expired Stock Discard Losses", labelSw: "Kuepuka Dawa Zilizooza Stoo" },
    ],
    challenges: [
      {
        problem: "Medicines expire quietly on shelves, resulting in huge financial write-offs.",
        problemSw: "Dawa zinamaliza muda wake (expiry) zikiwa rafu bila mfamasia kujua na kuleta hasara kubwa.",
        solution: "Automated expiry radar highlights items expiring within 30, 60, or 90 days so you can discount or return them to suppliers.",
        solutionSw: "Mfumo una rada inayokukumbusha dawa zinazobakiza siku 30, 60 au 90 ili uzitoe kwa haraka au uzirudishe kwa wasambazaji.",
      },
      {
        problem: "Dispensing wrong batches makes pharmaceutical recalls impossible.",
        problemSw: "Kuuza dawa bila kurekodi namba ya batch inaleta shida kubwa TFDA/TMDA ikitokea ukaguzi.",
        solution: "Every receipt records the batch number, manufacturer details, and dosage instructions for patient safety.",
        solutionSw: "Kila risiti inarekodi namba ya batch, mtengenezaji na maelekezo ya dozi kwa usalama wa mgonjwa na ukaguzi wa kisheria.",
      },
      {
        problem: "Dispensing fractional blister packs (strip vs whole box) leads to inventory chaos.",
        problemSw: "Kuuza dawa kwa strip au vidonge moja moja kutoka kwenye boksi kunavuruga hesabu ya stoo.",
        solution: "Unit packaging conversion splits full boxes into strips and tablets with mathematically accurate stock deductions.",
        solutionSw: "Mfumo unagawanya boksi zima kuwa strip au vidonge na kutoa idadi kamili stoo kila mteja anaponunua.",
      },
    ],
    features: [
      {
        title: "FEFO Batch Stock Tracking",
        titleSw: "Usimamizi wa Batch kwa Mfumo wa FEFO",
        desc: "First-Expired First-Out automatically prompts the dispenser to sell earlier expiring batches first, preserving fresh inventory.",
        descSw: "Mfumo unamlazimisha muuzaji kutoa batch inayoisha muda mapema kwanza, ili kuepusha dawa kuoza stoo.",
        icon: Pill,
        highlight: "FEFO compliance",
      },
      {
        title: "Dosage Instructions on Receipts",
        titleSw: "Maelekezo ya Dozi kwenye Risiti",
        desc: "Type patient dosage (e.g. 1x3 for 5 days after food) to print clearly on the receipt, minimizing patient medication errors.",
        descSw: "Andika dozi ya mgonjwa (mfano: 1x3 siku 5 baada ya kula) inachapwa vizuri kwenye risiti ili mgonjwa asikosee matumizi.",
        icon: Receipt,
        highlight: "Patient medication safety",
      },
      {
        title: "Box-to-Strip Packaging Breakdown",
        titleSw: "Kugawa Boksi kwenda Strip",
        desc: "Sell by full box, single blister pack, or individual tablets with automatic fractional inventory deductions.",
        descSw: "Uza kwa boksi zima, strip moja au vidonge vya moja moja bila hesabu ya stoo kupotea hata kidogo.",
        icon: Sparkles,
        highlight: "Accurate fractional stock",
      },
      {
        title: "Prescription & Doctor Note Logging",
        titleSw: "Kumbukumbu za Daktari & Dawa za Prescription",
        desc: "Record prescribing doctor name, hospital, and patient age for regulated pharmaceuticals requiring audited control.",
        descSw: "Hifadhi jina la daktari aliyeandika cheti, hospitali na umri wa mgonjwa kwa dawa zinazohitaji rekodi maalumu.",
        icon: ShieldCheck,
        highlight: "Audit ready for TMDA inspections",
      },
    ],
    sampleCatalog: [
      { name: "Paracetamol 500mg (Shelys)", unit: "Strip (10 tabs)", price: 1000, tag: "Pain Relief" },
      { name: "Amoxicillin 500mg Caps", unit: "Box (100 caps)", price: 18500, tag: "Antibiotic" },
      { name: "Cough Syrup Benylin 100ml", unit: "Bottle", price: 6500, tag: "Respiratory" },
      { name: "Multivitamin Syrups 200ml", unit: "Bottle", price: 4500, tag: "Supplements" },
      { name: "Ibuprofen 400mg Tablets", unit: "Strip", price: 1200, tag: "Anti-inflammatory" },
    ],
    faqs: [
      {
        q: "Does MauzoChap comply with TMDA requirements for medicine auditing?",
        qSw: "Je, mfumo unakidhi ukaguzi wa TMDA (Mamlaka ya Dawa na Vifaa Tiba)?",
        a: "Yes. MauzoChap tracks batch numbers, expiry dates, supplier purchase invoices, and customer receipts necessary during official pharmacy audits.",
        aSw: "Ndio. Mfumo unarekodi namba za batch, tarehe za expiry, ankara za wasambazaji na risiti zote zinazohitajika wakati wa ukaguzi wa TMDA.",
      },
      {
        q: "Can I manage multiple branch pharmacies under one single dashboard?",
        qSw: "Je, nikiwa na maduka ya dawa zaidi ya moja (matawi mawili au matatu) naweza kuyasimamia yote?",
        a: "Yes! The Kilimanjaro and Serengeti packages allow you to manage multiple branches, transfer stock between pharmacies, and compare profits from one phone.",
        aSw: "Ndio kabisa! Vifurushi vya Kilimanjaro na Serengeti vinakuwezesha kusimamia matawi mengi, kuhamisha dawa tawi moja kwenda jingine, na kuona faida yote kwenye simu moja.",
      },
      {
        q: "What if a medicine has different prices for different strengths or brands?",
        qSw: "Je, kama dawa ina majina tofauti au nguvu tofauti (mfano 250mg na 500mg)?",
        a: "You can create distinct variants with individual batch numbers, brand names (e.g. Panadol vs Paracetamol generic), and separate selling prices.",
        aSw: "Unaweza kusajili aina tofauti (variants) zenye namba zao za batch, majina ya watengenezaji na bei zao tofauti bila kuchanganyana.",
      },
    ],
    testimonial: {
      quote:
        "Kabla ya MauzoChap tulikuwa tunatupa dawa za zaidi ya laki nne kila baada ya miezi mitatu kwa sababu zili-expire bila taarifa. Sasa mfumo unanionya miezi mitatu mapema!",
      quoteSw:
        "Kabla ya MauzoChap tulikuwa tunatupa dawa za zaidi ya laki nne kila baada ya miezi mitatu kwa sababu zili-expire bila taarifa. Sasa mfumo unanionya miezi mitatu mapema!",
      author: "Dkt. Grace Lyimo",
      role: "Mfamasia & Mmiliki, Afya Bora Pharmacy",
      location: "Kijitonyama, Dar es Salaam",
    },
  },

  hardware: {
    key: "hardware",
    icon: Wrench,
    badge: "BUILT FOR HARDWARE & BUILDING MATERIALS",
    badgeSw: "IMEUNDWA KWA HARDWARE & VIFAA VYA UJENZI",
    title: "Hardware & Electricals",
    titleSw: "Hardware na Vifaa vya Ujenzi",
    headline: "Manage High-Value Construction Materials, Decimals, and Proforma Invoices",
    headlineSw: "Simamia Vifaa vya Ujenzi, Vipimo vya Mita/Mifuko, na Ankara Rasmi za Proforma",
    subheadline:
      "Engineered for hardware stores, timber yards, electrical suppliers, and plumbing shops. Support decimal unit sales (meters, kg, bags, pieces), generate professional proforma invoices for contractors, and track serial numbers for power tools.",
    subheadlineSw:
      "Imeundwa maalum kwa maduka ya hardware, mbao, vifaa vya umeme na mabomba. Inakubali vipimo vya mita, nondo, mifuko na marobota, inatoa ankara rasmi za proforma kwa mafundi na wakandarasi, na inafuatilia serial number za mashine.",
    color: "from-amber-600 to-orange-700",
    lightBg: "bg-amber-50/50",
    borderColor: "border-amber-200",
    metrics: [
      { stat: "TZS 0", label: "Measurement Rounding Losses", labelSw: "Upotevu wa Vipimo vya Mita/Kilo" },
      { stat: "1-Click", label: "Proforma to Sales Invoice Conversion", labelSw: "Kubadili Proforma Kuwa Mauzo" },
      { stat: "100%", label: "Contractor Credit Tracking", labelSw: "Udhibiti wa Madeni ya Wakandarasi" },
      { stat: "110+", label: "Hardware Shops Onboarded", labelSw: "Maduka ya Hardware Kazini" },
    ],
    challenges: [
      {
        problem: "Contractors need formal proforma invoices to approve budgets before paying.",
        problemSw: "Wakandarasi na mafundi wanahitaji proforma rasmi ili waombe fedha kabla ya kulipa.",
        solution: "Create polished proforma invoices with your logo, bank details, and convert to completed sales in 1 click once payment arrives.",
        solutionSw: "Tengeneza proforma invoices zenye nembo yako na akaunti ya benki, na ibadili kuwa risiti mara moja pesa ikishalipwa.",
      },
      {
        problem: "Selling materials by decimal units (e.g. 4.5 meters of pipe, 12.5 kg of nails) causes math errors.",
        problemSw: "Kuuza bidhaa za vipimo (mfano mita 4.5 za bomba, kilo 12.5 za misumari) kunaleta makosa ya mahesabu ya mikono.",
        solution: "Built-in unit conversion handles fractional quantities and calculates prices instantly.",
        solutionSw: "Mfumo unapiga hesabu kamili ya mita, kilo, nondo, marobota na vipande bila kosa la namba.",
      },
      {
        problem: "Power tools and electrical pumps lack warranty and serial number records when customers claim repairs.",
        problemSw: "Mashine za umeme, pampu na vifaa vya gharama vinakosa serial number mteja anaporudi kudai waranti.",
        solution: "Log unique serial numbers on the receipt so warranty claims are verified instantly.",
        solutionSw: "Weka serial number ya mashine moja kwa moja kwenye risiti ili kuthibitisha waranti bila ubishi.",
      },
    ],
    features: [
      {
        title: "Proforma & Quotation Generation",
        titleSw: "Kutoa Proforma na Makadirio Rasmi",
        desc: "Draft official quotations with payment terms, valid-until dates, and WhatsApp/PDF delivery directly to contractors and engineers.",
        descSw: "Tengeneza makadirio ya vifaa (quotations) yenye tarehe na maelezo ya benki, tuma kwa WhatsApp au PDF kwa mteja mara moja.",
        icon: Receipt,
        highlight: "Professional B2B documents",
      },
      {
        title: "Fractional & Decimal Units",
        titleSw: "Vipimo vya Mita, Kilo, Mifuko na Nondo",
        desc: "Measure and sell by meter, kilogram, bundle, or square meter without losing inventory precision.",
        descSw: "Pima na uuze kwa mita, kilo, mifuko ya saruji au nondo bila kupoteza hata desimali moja kwenye hesabu ya stoo.",
        icon: Wrench,
        highlight: "Exact inventory deduction",
      },
      {
        title: "Contractor Credit Accounts",
        titleSw: "Akaunti za Madeni ya Wakandarasi",
        desc: "Maintain running statements for ongoing building sites. Record multiple material pick-ups and log lump-sum bank transfers.",
        descSw: "Fuatilia vifaa vinavyochukuliwa site kidogo kidogo na rekodi malipo ya benki yanapofika bila daftari kuchakaa.",
        icon: Users,
        highlight: "Running site ledger",
      },
      {
        title: "Serial Number & Warranty Tracking",
        titleSw: "Kumbukumbu za Serial Number & Waranti",
        desc: "Record drill, pump, and electrical device serial numbers upon sale to protect against fraudulent warranty claims.",
        descSw: "Sajili serial number ya kila mashine au pampu wakati wa kuuza ili ujue tarehe kamili ya mwisho wa waranti.",
        icon: ShieldCheck,
        highlight: "Protect equipment warranty",
      },
    ],
    sampleCatalog: [
      { name: "Saruji ya Twiga Extra 32.5R (50kg)", unit: "Mfuko", price: 17500, tag: "Cement" },
      { name: "Nondo ya 12mm (Prime)", unit: "Mche", price: 23000, tag: "Steel" },
      { name: "Mabati ya Kipima Gauge 28 (3m)", unit: "Bati", price: 28500, tag: "Roofing" },
      { name: "Rangi ya Goldstar Weatherguard 20L", unit: "Ndoo", price: 95000, tag: "Paint" },
      { name: "Mabomba ya PVC 1 inch (Class B)", unit: "Urefu (6m)", price: 8500, tag: "Plumbing" },
    ],
    faqs: [
      {
        q: "Can I print formal A4 invoices as well as small 80mm thermal receipts?",
        qSw: "Je, naweza kutoa ankara kubwa ya karatasi ya A4 pamoja na risiti ndogo za mashine ya thermal?",
        a: "Yes! MauzoChap supports both full-page professional A4 invoices for corporate clients and 80mm/58mm thermal receipts for quick counter buyers.",
        aSw: "Ndio kabisa! Unaweza kuchapa ankara rasmi ya A4 yenye stempu na nembo yako kwa ajili ya makampuni na risiti ndogo ya kawaida ya kaunta.",
      },
      {
        q: "How does it handle partial contractor repayments for building sites?",
        qSw: "Je, inafanyaje kazi mkandarasi akilipa sehemu ya fedha ya vifaa alivyochukua site?",
        a: "You can credit payments against the customer's total outstanding balance. The system automatically recalculates the remaining balance and generates a receipt.",
        aSw: "Unarekodi kiasi chochote alicholipa (mfano kamilisha milioni 2 kati ya milioni 5). Mfumo unarekodi baki na unatoa risiti ya salio lililobaki.",
      },
      {
        q: "Can I manage delivery driver dispatches and transport fees?",
        qSw: "Je, naweza kuweka gharama za usafiri wa gari lililobeba vifaa kwenda site?",
        a: "Yes, you can add custom delivery service charges directly onto sales invoices to ensure your transport costs are recouped.",
        aSw: "Ndio, unaweza kuongeza gharama ya usafiri wa gari au bajaji moja kwa moja kwenye ankara ya vifaa vilivyotumwa site.",
      },
    ],
    testimonial: {
      quote:
        "Tangu tuanze kutumia MauzoChap kwenye hardware yetu Goba, tumeweza kutoa proforma za kisasa kwa wakandarasi na hakuna mteja anayeweza kusema alisahau deni lake la nondo au saruji.",
      quoteSw:
        "Tangu tuanze kutumia MauzoChap kwenye hardware yetu Goba, tumeweza kutoa proforma za kisasa kwa wakandarasi na hakuna mteja anayeweza kusema alisahau deni lake la nondo au saruji.",
      author: "Eng. Baraka Mallya",
      role: "Mkurugenzi, Mallya Hardware & Building Supplies",
      location: "Goba, Dar es Salaam",
    },
  },

  wholesale: {
    key: "wholesale",
    icon: Building2,
    badge: "SCALED FOR WHOLESALE & DISTRIBUTION",
    badgeSw: "IMEUNDWA KWA BIASHARA ZA JUMLA & WASAMBAZAJI",
    title: "Wholesale & Distribution",
    titleSw: "Biashara za Jumla na Wasambazaji",
    headline: "Scale Bulk Distribution with Multi-Tier Pricing and Van Sales",
    headlineSw: "Kuza Biashara Yako ya Jumla kwa Bei za Kreti, Marobota na Usambazaji wa Magari",
    subheadline:
      "Designed for wholesalers, FMCG distributors, beverage agencies, and grain merchants. Automate carton-to-piece price breakdowns, manage credit limits, track supplier payables, and manage inventory across multiple warehouses.",
    subheadlineSw:
      "Imeundwa maalum kwa maghala ya jumla, mawakala wa vinywaji, wasambazaji wa bidhaa za viwandani na nafaka. Gawanya bei za kreti na marobota, dhibiti viwango vya madeni ya wateja na ununuzi kwa wasambazaji wakuu.",
    color: "from-cyan-600 to-blue-800",
    lightBg: "bg-cyan-50/50",
    borderColor: "border-cyan-200",
    metrics: [
      { stat: "50,000+", label: "Cartons Tracked Monthly", labelSw: "Maboksi Yanayofuatiliwa kwa Mwezi" },
      { stat: "100%", label: "Supplier Payable Accuracy", labelSw: "Usahihi wa Hesabu za Wasambazaji Wakuu" },
      { stat: "Multi-Store", label: "Central Warehouse Sync", labelSw: "Usawazishaji wa Maghala Mengi" },
      { stat: "24/7", label: "Real-Time Gross Margin Visibility", labelSw: "Kuona Faida Halisi Kila Saa" },
    ],
    challenges: [
      {
        problem: "Tracking inventory across central warehouses and distribution vans causes stock variances.",
        problemSw: "Kusimamia stoo kati ya ghala kuu na magari ya usambazaji kunasababisha bidhaa kupotea bila maelezo.",
        solution: "Inter-location inventory transfer with mandatory dispatch notes and destination receiving confirmations.",
        solutionSw: "Uhamisho wa bidhaa kati ya ghala na magari yenye hati rasmi ya kutoa na kuthibitisha mapokezi.",
      },
      {
        problem: "Retailers take goods on credit exceeding safe financial limits, causing cash flow choke.",
        problemSw: "Wafanyabiashara wadogo wanachukua bidhaa kwa mkopo unaozidi uwezo wao na kusababisha mtaji kukwama.",
        solution: "Enforce automated credit limits that warn or block cashiers when a debtor's balance is too high.",
        solutionSw: "Weka kizuizi cha kiwango cha juu cha deni (credit limit) kinachozuia kutoa bidhaa zaidi kabla ya kulipa zilizopita.",
      },
      {
        problem: "Managing carton splits and dozen pricing manually creates costly math discrepancies.",
        problemSw: "Kufungua boksi zima na kuuza dazeni au chupa moja moja kunaharibu hesabu ya mtaji na faida.",
        solution: "Automated unit bundle breakdown converts cartons into pieces with dynamic pricing tiers.",
        solutionSw: "Mfumo unabadili maboksi kuwa dazeni au vipande moja kwa moja na kuweka bei zake sahihi.",
      },
    ],
    features: [
      {
        title: "Tiered Volume Pricing",
        titleSw: "Bei za Kiasi (Tiered Volume Pricing)",
        desc: "Set automatic volume discounts (1-10 cartons = TZS 45,000; 11-50 cartons = TZS 42,000; 51+ cartons = TZS 40,000).",
        descSw: "Weka punguzo la kiasi moja kwa moja (Boksi 1-10 = TZS 45,000; Boksi 11-50 = TZS 42,000) mfumo unajaza bei papo hapo.",
        icon: Receipt,
        highlight: "Automate volume discounts",
      },
      {
        title: "Multi-Warehouse & Van Transfers",
        titleSw: "Uhamisho wa Maghala & Magari ya Usambazaji",
        desc: "Transfer stock from the central warehouse to distribution trucks or retail outlets with full delivery manifests.",
        descSw: "Hamisha stoo kutoka ghala kuu kwenda kwenye gari la usambazaji au maduka madogo ukiwa na hati rasmi ya safari.",
        icon: Building2,
        highlight: "Zero transit leakage",
      },
      {
        title: "Supplier Purchase Orders & Payables",
        titleSw: "Manunuzi kwa Wasambazaji Wakuu (Suppliers)",
        desc: "Record bulk shipments received from manufacturers (e.g. Bakhresa, Unilever, TBL) and track outstanding supplier invoices.",
        descSw: "Rekodi mizigo mikubwa inayoingia toka viwandani na fuatilia ankara za wasambazaji unazopaswa kulipa.",
        icon: ShieldCheck,
        highlight: "Control supplier payables",
      },
      {
        title: "Customer Credit Limits & Statements",
        titleSw: "Viwango vya Madeni & Taarifa za Wateja",
        desc: "Generate professional monthly account statements to email or WhatsApp directly to supermarket and retailer clients.",
        descSw: "Toa ripoti ya kila mwezi ya madeni na manunuzi (statement) umtumie mteja wako kwa WhatsApp au barua pepe.",
        icon: Users,
        highlight: "B2B client statements",
      },
    ],
    sampleCatalog: [
      { name: "Azam Cola 350ml Crate (24 bottles)", unit: "Crate", price: 14500, tag: "Beverage" },
      { name: "Cooking Oil Korie Carton (12 x 1L)", unit: "Carton", price: 62000, tag: "Fats" },
      { name: "Mo Soap White Bar Carton (48 pcs)", unit: "Carton", price: 44000, tag: "Soaps" },
      { name: "Wheat Flour Azam Bumper Carton (12 x 2kg)", unit: "Bale", price: 41000, tag: "Grains" },
      { name: "Kilombero Rice Grade 1 (50kg Bag)", unit: "Gunia", price: 145000, tag: "Grains" },
    ],
    faqs: [
      {
        q: "Can my delivery van drivers record sales on the road using their phones?",
        qSw: "Je, madereva wa magari ya usambazaji wanaweza kuuza na kutoa risiti barabarani kwa simu zao?",
        a: "Yes! Drivers log into their assigned truck branch on their smartphone, issue sales, collect payments, and print bluetooth receipts on the go.",
        aSw: "Ndio kabisa! Dereva au muuzaji anafungua tawi la gari lake kwenye simu yake, anarekodi mauzo, anapokea fedha na anatoa risiti mtaani.",
      },
      {
        q: "How does MauzoChap help prevent retailers from defaulting on bulk debts?",
        qSw: "Je, mfumo unasaidiaje kuzuia wateja wa jumla kutokomea na madeni makubwa?",
        a: "You can set strict debt thresholds (credit limits). The system will alert or stop new credit sales once a customer exceeds their approved limit.",
        aSw: "Unaweka kiwango cha mwisho cha deni kwa kila mteja. Akifika kiwango hicho, mfumo unakataa kutoa bidhaa nyingine kwa mkopo mpaka alipe.",
      },
      {
        q: "Can I manage multiple branch stores and a central warehouse simultaneously?",
        qSw: "Je, naweza kusimamia ghala kuu na maduka matatu ya rejareja kwa pamoja?",
        a: "Yes, MauzoChap's multi-branch architecture synchronizes inventory and cash flow across all your warehouses and outlets in real time.",
        aSw: "Ndio, mfumo una uwezo wa kusawazisha ghala kuu na matawi yako yote kwa wakati mmoja, na unaona ripoti zote kwenye akaunti moja.",
      },
    ],
    testimonial: {
      quote:
        "Tunasambaza vinywaji na bidhaa za vyakula kwa maduka zaidi ya 70 Kariakoo. MauzoChap imetupa udhibiti kamili wa magari yetu matatu ya usambazaji bila upotevu.",
      quoteSw:
        "Tunasambaza vinywaji na bidhaa za vyakula kwa maduka zaidi ya 70 Kariakoo. MauzoChap imetupa udhibiti kamili wa magari yetu matatu ya usambazaji bila upotevu.",
      author: "Haji Ramadhani",
      role: "Mkurugenzi wa Usambazaji, Umoja Wholesalers",
      location: "Kariakoo, Dar es Salaam",
    },
  },

  restaurants: {
    key: "restaurants",
    icon: UtensilsCrossed,
    badge: "OPTIMIZED FOR RESTAURANTS, BARS & CAFES",
    badgeSw: "IMEUNDWA KWA MIGAHAWA, BAA & LOUNGES",
    title: "Restaurants & Bars",
    titleSw: "Migahawa na Baa",
    headline: "Speed Up Orders and Stop Beverage Pilferage at the Counter",
    headlineSw: "Ongeza Kasi ya Maagizo na Dhibiti Vinywaji Kaunta Bila Upotevu",
    subheadline:
      "Engineered for restaurants, bars, lounges, fast-food outlets, and cafes. Automate crate-to-bottle tracking, balance counter cashier shifts with zero missing drinks, print quick kitchen order tickets, and accept mobile money splits effortlessly.",
    subheadlineSw:
      "Imeundwa maalum kwa migahawa, baa, lounges na hoteli ndogo. Fuatilia vinywaji kutoka kwenye kreti hadi chupa moja moja, funga shifti za wauzaji bila bia kupotea, chapisha maagizo jikoni (KOT), na pokea malipo ya M-Pesa na taslimu bila mzozo.",
    color: "from-purple-600 to-indigo-800",
    lightBg: "bg-purple-50/50",
    borderColor: "border-purple-200",
    metrics: [
      { stat: "0 Drinks", label: "Unaccounted Beverage Losses", labelSw: "Kuepuka Bia/Vinywaji Kupotea" },
      { stat: "2 Sec", label: "Quick Order Ticket Printing", labelSw: "Kasi ya Risiti Jikoni / Kaunta" },
      { stat: "100%", label: "Waitstaff Shift Balancing", labelSw: "Usahihi wa Hesabu za Wahudumu" },
      { stat: "110+", label: "Food & Beverage Venues Active", labelSw: "Migahawa & Baa Zinazotumia" },
    ],
    challenges: [
      {
        problem: "Beverages (beer, soda, spirits) go missing between the storeroom, fridge, and customer tables.",
        problemSw: "Bia na vinywaji vinapotea kati ya stoo, friji ya kaunta na meza za wateja.",
        solution: "Crate-to-bottle conversion tracks exact bottle counts so every single opened drink is accounted for in cash.",
        solutionSw: "Usimamizi wa kreti hadi chupa moja moja unahakikisha kila chupa iliyofunguliwa ina rekodi ya fedha taslimu au M-Pesa.",
      },
      {
        problem: "Waiters collect money from guests but fail to balance accounts before leaving their shift.",
        problemSw: "Wahudumu wanakusanya pesa kutoka kwa wateja lakini wanashindwa kufunga hesabu shifti inapoisha.",
        solution: "Individual waiter sales reconciliation generates clear shift closing tallies in under 60 seconds.",
        solutionSw: "Hesabu ya kila mhudumu inafungwa chini ya sekunde 60 kwa kuonyesha mauzo yake dhidi ya fedha alizokabidhi.",
      },
      {
        problem: "Kitchen communication errors result in delayed orders and angry diners.",
        problemSw: "Maagizo ya jikoni yanakosewa au kuchelewa kwa sababu ya karatasi za kuandika kwa mkono.",
        solution: "Instant order ticketing sends itemized receipts directly to the kitchen or bar preparation station.",
        solutionSw: "Agizo linachapwa moja kwa moja jikoni au kaunta ya vinywaji punde mteja anapoagiza.",
      },
    ],
    features: [
      {
        title: "Crate-to-Bottle Tracking",
        titleSw: "Hesabu ya Kreti hadi Chupa Moja Moja",
        desc: "Receive 24-bottle crates into main storage and transfer chilled bottles into counter fridges with automatic fractional reconciliation.",
        descSw: "Pokea kreti stoo kuu na uhamishe chupa kwenye friji ya kaunta bila kreti kupungua au bia kupotea kimya kimya.",
        icon: Receipt,
        highlight: "Prevent bar pilferage",
      },
      {
        title: "Waiter & Shift Reconciliation",
        titleSw: "Kufunga Hesabu ya Wahudumu & Shifti",
        desc: "Assign orders to individual service staff. Settle cash, M-Pesa, and card collections accurately at shift handover.",
        descSw: "Kila mhudumu anafungua na kufunga mauzo yake, na kuwezesha ukaguzi wa haraka bila ugomvi kaunta.",
        icon: Users,
        highlight: "Frictionless shift change",
      },
      {
        title: "Bill Splitting & Mobile Money",
        titleSw: "Kugawanya Bili & Malipo ya Simu",
        desc: "Split group table checks easily between cash, Lipa Namba M-Pesa, Airtel Money, and bank cards.",
        descSw: "Wateja wakitaka kulipa bili kwa kugawana (mwingine M-Pesa, mwingine taslimu), mfumo unapokea mara moja.",
        icon: Zap,
        highlight: "Flexible table checkout",
      },
      {
        title: "Kitchen & Counter Order Tickets",
        titleSw: "Tiketi za Jikoni na Kaunta (KOT)",
        desc: "Print clear order tickets for chefs and bartenders showing table numbers, special cooking requests, and order timestamps.",
        descSw: "Chapisha tiketi safi jikoni inayoonyesha namba ya meza, kile mteja anachotaka na muda agizo lilipotolewa.",
        icon: Printer,
        highlight: "Speed up kitchen service",
      },
    ],
    sampleCatalog: [
      { name: "Safari Lager 500ml Bottle", unit: "Chupa", price: 3000, tag: "Beer" },
      { name: "Kili Lager 500ml Bottle", unit: "Chupa", price: 3000, tag: "Beer" },
      { name: "Kuku Choma Nusu na Chips", unit: "Sahani", price: 12000, tag: "Food" },
      { name: "Samaki wa Kupaka na Ugali", unit: "Sahani", price: 15000, tag: "Food" },
      { name: "Maji Makubwa Kilimanjaro 1.5L", unit: "Chupa", price: 1500, tag: "Water" },
    ],
    faqs: [
      {
        q: "Can I use multiple smartphones for my waiters to take table orders?",
        qSw: "Je, wahudumu wangu wanaweza kutumia simu zao kuchukua maagizo mezani?",
        a: "Yes! Waiters can log into MauzoChap on standard smartphones, input orders at the table, and have them appear immediately at the bar and kitchen.",
        aSw: "Ndio! Wahudumu wanaweza kuingia kwenye mfumo kupitia simu zao, kuchukua maagizo meza ya mteja, na yanatokea kaunta mara moja.",
      },
      {
        q: "How does MauzoChap stop bar cashiers from selling off-record drinks?",
        qSw: "Je, mfumo unazuiaje wauzaji wa baa kuuza vinywaji vyao binafsi bila kurekodi?",
        a: "Every bottle opened must correspond to an active order ticket. Physical counter stock counts are matched against recorded sales at shift close.",
        aSw: "Hesabu ya chupa zilizopo kwenye friji inalinganishwa na idadi ya vinywaji vilivyouzwa wakati wa kufunga shifti. Tofauti yoyote inaonekana wazi.",
      },
      {
        q: "Can I track customer food preferences and table numbers?",
        qSw: "Je, naweza kuweka namba za meza kwenye kila bili?",
        a: "Yes, you can assign table numbers or customer names to orders and keep tabs open until diners are ready to settle their bill.",
        aSw: "Ndio, unaweka namba ya meza au jina la mteja na unaacha bili wazi (open tab) mpaka mteja anapomaliza kula na kunywa.",
      },
    ],
    testimonial: {
      quote:
        "Baa yetu ilikuwa na migogoro ya mara kwa mara ya bia kupotea kila wikendi. MauzoChap imeweka nidhamu kamili ya chupa na wahudumu wanafunga hesabu zao kwa amani.",
      quoteSw:
        "Baa yetu ilikuwa na migogoro ya mara kwa mara ya bia kupotea kila wikendi. MauzoChap imeweka nidhamu kamili ya chupa na wahudumu wanafunga hesabu zao kwa amani.",
      author: "Frank Mrema",
      role: "Mmiliki, HighLife Lounge & Grill",
      location: "Mbezi Beach, Dar es Salaam",
    },
  },

  fashion: {
    key: "fashion",
    icon: Shirt,
    badge: "TAILORED FOR BOUTIQUES & FASHION STORES",
    badgeSw: "MAALUM KWA BOUTIQUES, NGUO & VIATU",
    title: "Boutiques & Fashion",
    titleSw: "Nguo na Mitindo",
    headline: "Organize Sizes, Colors, and Variants with Beautiful WhatsApp Receipts",
    headlineSw: "Panga Saizi, Rangi na Mitindo ya Nguo kwa Risiti Nzuri za WhatsApp",
    subheadline:
      "Created for fashion boutiques, shoe stores, bag shops, and apparel retailers. Manage size (S, M, L, XL, XXL) and color variants effortlessly, print stylish price tags, and send receipts with photos directly to customer WhatsApp chats.",
    subheadlineSw:
      "Imeundwa maalum kwa maduka ya nguo za kike na kiume, viatu, mikoba na mitindo. Dhibiti saizi (S, M, L, XL) na rangi za nguo bila kuchanganyikiwa, chapisha lebo za bei, na tuma risiti zenye picha kwa WhatsApp ya mteja.",
    color: "from-pink-600 to-rose-700",
    lightBg: "bg-pink-50/50",
    borderColor: "border-pink-200",
    metrics: [
      { stat: "100%", label: "Size & Color Matrix Accuracy", labelSw: "Usahihi wa Saizi na Rangi za Nguo" },
      { stat: "3 Sec", label: "WhatsApp Photo Receipt Delivery", labelSw: "Kutuma Risiti ya Picha WhatsApp" },
      { stat: "0 Lost", label: "Layaway & Instalment Records", labelSw: "Kumbukumbu za Malipo ya Awamu" },
      { stat: "110+", label: "Fashion Boutiques Onboarded", labelSw: "Boutiques Zinazotumia Mfumo" },
    ],
    challenges: [
      {
        problem: "Clothes look identical on paper but differ in sizes and colors, leading to messy inventory.",
        problemSw: "Nguo zinafanana lakini zinatofautiana saizi na rangi, kuandika kwenye daftari kunavuruga stoo.",
        solution: "Matrix product variants allow you to track exact quantities for Red / Medium, Blue / Large, etc.",
        solutionSw: "Mfumo unasajili gauni moja likiwa na rangi na saizi zake zote (Rangi: Nyekundu, Saizi: M au L) zikitengana vizuri.",
      },
      {
        problem: "Customers request instalment purchases (lipa kidogo kidogo) and take items before finishing payment.",
        problemSw: "Wateja wanalipa nguo kidogo kidogo (awamu) na rekodi za malipo zinapotea kwenye madaftari.",
        solution: "Dedicated layaway tracking holds reserved items until the final installment is completed.",
        solutionSw: "Mfumo unatunza kumbukumbu za malipo ya awamu na kumzuia mteja kuchukua bidhaa mpaka kiasi chote kimalizike.",
      },
      {
        problem: "Paper receipts are thrown away, missing an opportunity for repeat customer marketing.",
        problemSw: "Wateja wanatupa risiti za karatasi na unakosa mawasiliano yao kwa ajili ya mauzo mapya.",
        solution: "Instant WhatsApp receipts save customer phone numbers automatically for VIP sales promotions.",
        solutionSw: "Risiti inatumwa moja kwa moja kwenye WhatsApp ya mteja na unahifadhi namba yake kutangaza nguo mpya zikifika.",
      },
    ],
    features: [
      {
        title: "Matrix Variant Management (Size & Color)",
        titleSw: "Usimamizi wa Saizi na Rangi",
        desc: "Define size variations (S, M, L, XL, XXL) and color palettes for every dress, shoe, or shirt without duplicating products.",
        descSw: "Weka saizi zote na rangi za kila nguo au kiatu kwa urahisi bila kurudia kusajili bidhaa mara kumi.",
        icon: Shirt,
        highlight: "Size & color grid",
      },
      {
        title: "WhatsApp Receipts with Product Photos",
        titleSw: "Risiti za WhatsApp zenye Picha",
        desc: "Send a stunning electronic receipt directly to customer WhatsApp, including product photos, warranty, and return policies.",
        descSw: "Mtumie mteja risiti yenye kuvutia moja kwa moja kwenye WhatsApp yake ikiwa na nembo yako na sera za kubadilisha nguo.",
        icon: Receipt,
        highlight: "Modern customer experience",
      },
      {
        title: "Layaway & Instalment Tracking",
        titleSw: "Malipo ya Kidogo Kidogo (Instalments)",
        desc: "Allow trusted clients to pay deposits and settle remaining balances over weeks with automated receipt acknowledgments.",
        descSw: "Waruhusu wateja kulipa amana na kumalizia kidogo kidogo huku kila malipo yakitengeneza risiti ya salio lililobaki.",
        icon: Users,
        highlight: "Retain loyal shoppers",
      },
      {
        title: "Barcode Tag Printing for Garments",
        titleSw: "Kuchapa Lebo za Bei za Nguo",
        desc: "Print barcode price swing tags for garments so checkout staff can scan and charge instantly without guessing prices.",
        descSw: "Chapisha lebo za kuning'iniza kwenye nguo (swing tags) zenye bei na barcode ili muuzaji asibadilishe bei kiholela.",
        icon: Printer,
        highlight: "Stop cashier price guessing",
      },
    ],
    sampleCatalog: [
      { name: "Gauni la Harusi / Sendoff (Size M, Red)", unit: "Piece", price: 85000, tag: "Dresses" },
      { name: "Shati la Kitenge la Kiume (Size L)", unit: "Piece", price: 35000, tag: "Shirts" },
      { name: "Viatu vya Kike vya Kisigino (Size 38)", unit: "Pair", price: 45000, tag: "Footwear" },
      { name: "Suruali ya Jeans ya Kiume (Size 34)", unit: "Piece", price: 38000, tag: "Trousers" },
      { name: "Mkoba wa Kike wa Ngozi (Black)", unit: "Piece", price: 42000, tag: "Accessories" },
    ],
    faqs: [
      {
        q: "Can I set discounts for clearance sales or Black Friday?",
        qSw: "Je, naweza kuweka punguzo la bei (discount) wakati wa ofa za mwisho wa mwezi au sikukuu?",
        a: "Yes! You can apply percentage or flat discounts directly at checkout, or set promotional prices for specific slow-moving sizes.",
        aSw: "Ndio! Unaweza kuweka punguzo la asilimia (mfano 10% au 20%) au kupunguza kiasi maalum cha fedha kaunta kwa urahisi.",
      },
      {
        q: "How does the system handle clothing exchanges if a customer needs a different size?",
        qSw: "Je, mteja akija kubadilisha saizi ya nguo (mfano anataka L badala ya M) inarekodiwaje?",
        a: "MauzoChap supports smooth product returns and exchanges, updating inventory for both the returned size and the new size accurately.",
        aSw: "Mfumo una sehemu ya kubadilisha bidhaa (exchange), unarudisha saizi iliyoletwa stoo na kutoa saizi mpya bila kuvuruga hesabu.",
      },
      {
        q: "Can I manage multiple boutiques across different shopping malls?",
        qSw: "Je, nikiwa na maduka ya nguo Kariakoo na Mlimani City naweza kuyasimamia yote?",
        a: "Yes, you can monitor sales, check available sizes in each branch, and transfer items between stores from your phone.",
        aSw: "Ndio kabisa, unaweza kuona duka la Kariakoo lina saizi gani na la Mlimani City lina saizi gani, na kuhamisha bidhaa kwa simu yako.",
      },
    ],
    testimonial: {
      quote:
        "Wateja wangu wanapenda sana risiti ninazowatumia WhatsApp zenye picha ya nguo walizonunua. MauzoChap imefanya boutique yangu ionekane ya kisasa na ya kuaminika.",
      quoteSw:
        "Wateja wangu wanapenda sana risiti ninazowatumia WhatsApp zenye picha ya nguo walizonunua. MauzoChap imefanya boutique yangu ionekane ya kisasa na ya kuaminika.",
      author: "Vanessa Kimaro",
      role: "Mmiliki, Glamour Touch Boutique",
      location: "Kinondoni, Dar es Salaam",
    },
  },

  electronics: {
    key: "electronics",
    icon: Smartphone,
    badge: "PRECISION TRACKING FOR PHONES & ELECTRONICS",
    badgeSw: "UDHIBITI KAMILI WA SIMU & VIFAA VYA ELEKTRONIKI",
    title: "Phones & Electronics",
    titleSw: "Simu na Vifaa vya Umeme",
    headline: "Log Unique IMEIs and Serial Numbers to Eliminate Warranty Fraud",
    headlineSw: "Rekodi Namba za IMEI na Serial Numbers Kuzuia Utapeli wa Waranti",
    subheadline:
      "Built specifically for phone dealerships, laptop stores, accessory retailers, and electronic repair workshops. Log unique IMEI and serial numbers on every receipt, track supplier warranties, manage repair job cards, and safeguard high-value stock.",
    subheadlineSw:
      "Imeundwa maalum kwa maduka ya simu, kompyuta, vifaa vya ziada (accessories) na karakana za matengenezo. Rekodi IMEI na serial number kwenye kila risiti, fuatilia waranti za wasambazaji, na dhibiti bidhaa za thamani kubwa bila upotevu.",
    color: "from-sky-600 to-indigo-800",
    lightBg: "bg-sky-50/50",
    borderColor: "border-sky-200",
    metrics: [
      { stat: "100%", label: "IMEI & Serial Number Audit Trail", labelSw: "Ufuatiliaji Kamili wa IMEI & Serial" },
      { stat: "TZS 0", label: "Fraudulent Warranty Losses", labelSw: "Kuepuka Utapeli wa Madai ya Waranti" },
      { stat: "1-Click", label: "Instant IMEI Barcode Scanning", labelSw: "Kusoma IMEI kwa Scanner ya Barcode" },
      { stat: "110+", label: "Electronics Shops Active", labelSw: "Maduka ya Simu & Umeme Yaliyopo" },
    ],
    challenges: [
      {
        problem: "Customers bring back broken phones claiming they bought them from your store under warranty.",
        problemSw: "Mteja anarudisha simu iliyoharibika akidai alinunua kwako na bado ipo kwenye waranti.",
        solution: "Scan and print the exact IMEI number on the receipt so warranty claims are validated with 100% certainty.",
        solutionSw: "Soma na uchapishe namba kamili ya IMEI kwenye risiti ili kuthibitisha simu halisi iliyonunuliwa kwako bila kubishana.",
      },
      {
        problem: "High-value phones, chargers, and airpods go missing from display cases without explanation.",
        problemSw: "Simu za thamani kubwa, chaja na vifaa vya sauti vinapotea kwenye kabati bila ushahidi.",
        solution: "Individual device serialization tracks each unit from arrival date to cashier sale date.",
        solutionSw: "Kila simu inasajiliwa kwa serial yake tangu inapofika stoo mpaka inapouzwa na muuzaji maalum.",
      },
      {
        problem: "Repair workshop jobs get mixed up with unrecorded parts and customer disputes.",
        problemSw: "Vifaa vinavyoletwa kutengenezwa vinachanganyika, spea zinasahaulika na kuleta ugomvi na wateja.",
        solution: "Digital repair ticketing tracks device fault description, technician assigned, parts used, and repair status.",
        solutionSw: "Tiketi za kielektroniki za matengenezo zinarekodi tatizo la simu, fundi anayetengeneza, na gharama zote.",
      },
    ],
    features: [
      {
        title: "IMEI & Serial Number Logging",
        titleSw: "Kusajili IMEI na Serial Number",
        desc: "Scan phone IMEI barcodes directly into the sale. The serial number is printed permanently on the customer's warranty receipt.",
        descSw: "Soma barcode ya IMEI ya simu moja kwa moja wakati wa kuuza. Inachapwa kwenye risiti rasmi ya waranti ya mteja.",
        icon: Smartphone,
        highlight: "Zero warranty disputes",
      },
      {
        title: "Warranty Period Expiration Tracker",
        titleSw: "Kumbukumbu ya Muda wa Waranti",
        desc: "Set 6-month, 1-year, or 2-year warranty durations. Instantly check if a returning device is still covered under warranty.",
        descSw: "Weka muda wa waranti wa miezi 6 au mwaka 1. Angalia mara moja kama kifaa bado kiko ndani ya muda au kimepita.",
        icon: ShieldCheck,
        highlight: "Automatic warranty lookup",
      },
      {
        title: "Repair & Service Workshop Job Cards",
        titleSw: "Kadi za Matengenezo (Repair Jobs)",
        desc: "Issue customer intake tickets for screen replacements, battery repairs, and software flashes with SMS status notifications.",
        descSw: "Toa kadi ya mapokezi ya simu ya kutengeneza (kubadili kioo au betri) na umtumie mteja SMS simu inapokuwa tayari.",
        icon: Wrench,
        highlight: "Technician accountability",
      },
      {
        title: "Accessories Bulk & Retail Tracking",
        titleSw: "Usimamizi wa Accessories (Chaja, Kava & Vioo)",
        desc: "Manage high-margin accessories (cables, earphones, screen protectors, phone cases) with instant barcode scanning.",
        descSw: "Simamia bidhaa ndogo ndogo za faida kubwa kama chaja, kava na vioo bila hata kimoja kupotea chini ya kaunta.",
        icon: Zap,
        highlight: "Track every small accessory",
      },
    ],
    sampleCatalog: [
      { name: "Samsung Galaxy A15 (128GB, IMEI Tracked)", unit: "Box", price: 345000, tag: "Smartphones" },
      { name: "iPhone 13 (128GB, Refurbished / Clean)", unit: "Box", price: 1150000, tag: "Apple" },
      { name: "Oraimo Fast Charger Type-C (20W)", unit: "Piece", price: 25000, tag: "Accessories" },
      { name: "Kioo cha Screen Protector 9D (All Models)", unit: "Piece", price: 5000, tag: "Protection" },
      { name: "Wireless Earbuds Oraimo FreePods 4", unit: "Box", price: 65000, tag: "Audio" },
    ],
    faqs: [
      {
        q: "Can I scan the IMEI barcode directly off the phone box with my scanner?",
        qSw: "Je, naweza kusoma barcode ya IMEI iliyopo kwenye boksi la simu kwa kutumia scanner ya kawaida?",
        a: "Yes! Any standard barcode scanner will capture the 15-digit IMEI directly into the sale screen in under one second.",
        aSw: "Ndio kabisa! Scanner yoyote ya barcode itasoma namba zote 15 za IMEI kutoka kwenye boksi la simu chini ya sekunde moja.",
      },
      {
        q: "Can I check which supplier a defective phone was purchased from?",
        qSw: "Je, simu ikiharibika naweza kujua nilinunua kwa msambazaji gani ili nimrudishie?",
        a: "Yes. By typing the IMEI number into MauzoChap, you instantly see the original supplier purchase invoice, cost price, and date received.",
        aSw: "Ndio. Ukiingiza namba ya IMEI kwenye mfumo, unaona mara moja ankara uliyonunulia kwa msambazaji, bei na tarehe iliyoingia stoo.",
      },
      {
        q: "Does MauzoChap support trade-in deals (exchanging old phones for new ones)?",
        qSw: "Je, inasaidia wateja wanaobadilisha simu za zamani na kuongeza pesa kupata mpya (Trade-in)?",
        a: "Yes! You can record customer device trade-in allowances as credits against the new phone's total price.",
        aSw: "Ndio! Unaweza kurekodi simu ya mteja ya zamani na thamani yake kama punguzo la bei ya simu mpya anayonunua.",
      },
    ],
    testimonial: {
      quote:
        "Kwenye biashara ya simu Kariakoo, utapeli wa waranti na simu kupotea ndio unaua mitaji. MauzoChap imetukinga kabisa kwa sababu kila simu inatoka ikiwa na IMEI yake kwenye risiti.",
      quoteSw:
        "Kwenye biashara ya simu Kariakoo, utapeli wa waranti na simu kupotea ndio unaua mitaji. MauzoChap imetukinga kabisa kwa sababu kila simu inatoka ikiwa na IMEI yake kwenye risiti.",
      author: "Kelvin Shirima",
      role: "Mmiliki, SmartHub Electronics",
      location: "Kariakoo Msimbazi, Dar es Salaam",
    },
  },
};

export function BusinessIndustryPage({ industry }: { industry: IndustryKey }) {
  const [lang, setLang] = useState<"sw" | "en">("sw");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

  const data = INDUSTRY_CONFIGS[industry] || INDUSTRY_CONFIGS.shops;
  const isSw = lang === "sw";

  const allIndustries: { key: IndustryKey; title: string; titleSw: string; icon: LucideIcon; path: string }[] = [
    { key: "shops", title: "Shops & Maduka", titleSw: "Maduka & Rejareja", icon: Store, path: "/shops" },
    { key: "supermarkets", title: "Supermarkets & Retail", titleSw: "Supermarkets & Vyakula", icon: ShoppingCart, path: "/supermarkets" },
    { key: "pharmacies", title: "Pharmacies & Duka la Dawa", titleSw: "Maduka ya Dawa & Agrovet", icon: Pill, path: "/pharmacies" },
    { key: "hardware", title: "Hardware & Electricals", titleSw: "Vifaa vya Ujenzi & Umeme", icon: Wrench, path: "/hardware" },
    { key: "wholesale", title: "Wholesale & Distribution", titleSw: "Biashara za Jumla & Maghala", icon: Building2, path: "/wholesale" },
    { key: "restaurants", title: "Restaurants & Bars", titleSw: "Migahawa & Baa", icon: UtensilsCrossed, path: "/restaurants" },
    { key: "fashion", title: "Boutiques & Fashion", titleSw: "Nguo & Mitindo", icon: Shirt, path: "/fashion" },
    { key: "electronics", title: "Phones & Electronics", titleSw: "Simu & Vifaa vya Umeme", icon: Smartphone, path: "/electronics" },
  ];

  const Icon = data.icon;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-violet-600 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-purple-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src="/images/logo-black.png"
              alt="MauzoChap"
              className="w-9 h-9 sm:w-10 sm:h-10 object-contain group-hover:scale-105 transition-transform"
            />
            <span className="font-black text-xl sm:text-2xl text-slate-950 tracking-tight">
              MauzoChap
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
            <Link to="/" className="hover:text-violet-600 transition-colors">
              {isSw ? "Nyumbani" : "Home"}
            </Link>
            <a href="#features" className="hover:text-violet-600 transition-colors">
              {isSw ? "Vipengele Maalum" : "Key Features"}
            </a>
            <a href="#catalog" className="hover:text-violet-600 transition-colors">
              {isSw ? "Mfano wa Bidhaa" : "Catalog Preview"}
            </a>
            <a href="#faq" className="hover:text-violet-600 transition-colors">
              {isSw ? "Maswali ya Mara kwa Mara" : "FAQs"}
            </a>
          </nav>

          {/* Language Toggle & Action Button */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => setLang(lang === "sw" ? "en" : "sw")}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-purple-200 bg-purple-50 text-xs font-mono font-bold text-violet-700 hover:bg-purple-100 transition-colors"
            >
              <span>{lang === "sw" ? "SW" : "EN"}</span>
              <span className="text-[10px] text-muted-foreground">↔</span>
            </button>

            <Link
              to="/demo"
              className="hidden sm:inline-flex items-center text-xs font-bold text-slate-700 hover:text-slate-950 px-3 py-2 rounded-lg transition-colors"
            >
              Demo
            </Link>

            <button
              onClick={() => setRegisterModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-slate-950 hover:bg-violet-700 text-white text-xs sm:text-sm font-bold px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl shadow-sm transition-all"
            >
              <span>{isSw ? "Anza Bure Siku 5" : "Start Free Trial"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-purple-100 py-12 sm:py-20 lg:py-24">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-100/50 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-violet-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Eyebrow Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-purple-200 bg-purple-50 text-violet-700 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
                <Icon className="w-4 h-4 text-violet-600" />
                <span>{isSw ? data.badgeSw : data.badge}</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.1]">
                {isSw ? data.headlineSw : data.headline}
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-2xl mx-auto lg:mx-0">
                {isSw ? data.subheadlineSw : data.subheadline}
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
                <button
                  onClick={() => setRegisterModalOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-950 hover:bg-violet-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-purple-950/10 hover:shadow-xl transition-all"
                >
                  <span>{isSw ? "Sajili Duka Lako Bure" : "Start 5-Day Free Trial"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <Link
                  to="/demo"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-slate-300 hover:border-slate-900 bg-white hover:bg-slate-50 text-slate-900 font-bold text-sm sm:text-base transition-all"
                >
                  <Sparkles className="w-4 h-4 text-violet-600" />
                  <span>{isSw ? "Tazama Demo ya Duka" : "Explore Interactive Demo"}</span>
                </Link>
              </div>

              {/* Guarantees row */}
              <div className="pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{isSw ? "Bila kadi ya benki" : "No credit card required"}</span>
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{isSw ? "Tayari ndani ya dakika 2" : "Ready in 2 minutes"}</span>
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{isSw ? "Inafanya kazi na simu yoyote" : "Works on any device"}</span>
                </span>
              </div>
            </div>

            {/* Right Card: Interactive Preview Box */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl border-2 border-purple-200 bg-white p-6 shadow-xl shadow-purple-950/5 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-violet-700 flex items-center justify-center font-bold">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-950">{isSw ? data.titleSw : data.title}</h3>
                      <p className="text-[11px] text-muted-foreground">{isSw ? "Mfano Halisi wa Kaunta" : "Live Counter Terminal"}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700">
                    Active POS
                  </span>
                </div>

                {/* Sample Cart / Products in this Industry */}
                <div className="space-y-2 text-xs">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {isSw ? "Bidhaa Zinazouza Zaidi" : "Popular Catalog Items"}
                  </div>
                  {data.sampleCatalog.slice(0, 4).map((item, idx) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-white transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-slate-900 truncate">{item.name}</div>
                        <div className="text-[10px] text-muted-foreground">Kipimo: {item.unit}</div>
                      </div>
                      <div className="font-bold text-slate-950 shrink-0 font-mono">
                        {formatTZS(item.price)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Bar */}
                <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-violet-700">{isSw ? "Jumla ya Mauzo" : "Total Bill"}</div>
                    <div className="text-lg font-black text-slate-950 font-mono">
                      {formatTZS(data.sampleCatalog.slice(0, 4).reduce((a, b) => a + b.price, 0))}
                    </div>
                  </div>
                  <button
                    onClick={() => setRegisterModalOpen(true)}
                    className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>{isSw ? "Toa Risiti" : "Print Receipt"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mt-12 sm:mt-16 pt-8 border-t border-purple-100">
            {data.metrics.map((m) => (
              <div key={m.stat} className="rounded-xl border border-purple-100 bg-purple-50/30 p-4 sm:p-5 text-center">
                <div className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight font-mono">
                  {m.stat}
                </div>
                <div className="text-xs sm:text-sm font-medium text-slate-600 mt-1">
                  {isSw ? m.labelSw : m.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Challenges & Solutions */}
      <section className="py-14 sm:py-20 bg-slate-50 border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-purple-200 bg-white text-violet-700 text-xs font-mono font-bold tracking-wider uppercase">
              <span>{isSw ? "KWA NINI MAUZOCHAP?" : "WHY MAUZOCHAP?"}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight">
              {isSw
                ? "Changamoto Kubwa za Biashara Yako na Jinsi MauzoChap Inavyozitatua"
                : "Common Industry Challenges & How MauzoChap Solves Them"}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {data.challenges.map((c, i) => (
              <div
                key={i}
                className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 font-bold text-xs">
                    ✕
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-red-950 leading-snug">
                    {isSw ? c.problemSw : c.problem}
                  </h3>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase font-mono">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isSw ? "Suluhu ya MauzoChap" : "MauzoChap Solution"}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {isSw ? c.solutionSw : c.solution}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tailored Features Grid */}
      <section id="features" className="py-14 sm:py-20 bg-white border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-purple-200 bg-purple-50 text-violet-700 text-xs font-mono font-bold tracking-wider uppercase">
              <span>{isSw ? "VIPENGELE VYA KISASA" : "POWERFUL FEATURES"}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight">
              {isSw
                ? `Vipengele Vilivyotengenezwa Maalum kwa ${data.titleSw}`
                : `Features Specially Tailored for ${data.title}`}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.features.map((f, i) => {
              const FIcon = f.icon;
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-purple-100 bg-purple-50/20 hover:bg-white p-6 shadow-xs hover:border-violet-300 hover:shadow-lg transition-all duration-200 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 text-violet-700 flex items-center justify-center">
                      <FIcon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-base text-slate-950 leading-snug">
                      {isSw ? f.titleSw : f.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {isSw ? f.descSw : f.desc}
                    </p>
                  </div>

                  <div className="pt-2 text-[11px] font-mono font-bold text-violet-700">
                    <span>{f.highlight}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pre-Loaded Product Catalog Showcase */}
      <section id="catalog" className="py-14 sm:py-20 bg-slate-50 border-b border-purple-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-purple-200 bg-white text-violet-700 text-xs font-mono font-bold tracking-wider uppercase">
              <span>{isSw ? "BIDHAA TAYARI KWENYE MFUMO" : "PRE-LOADED TEMPLATES"}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              {isSw
                ? "Bidhaa Zilizotayarishwa Tayari Kuanza Siku ya Kwanza"
                : "Pre-Configured Catalogs Ready on Day One"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
              {isSw
                ? "Huna haja ya kupoteza wiki nzima kuandika bidhaa upya. Mfumo unakuja na orodha ya bidhaa maarufu za tasnia yako tayari."
                : "No need to spend weeks typing products manually. MauzoChap comes with ready catalogs and measurement units pre-configured."}
            </p>
          </div>

          <div className="rounded-2xl border border-purple-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-purple-50/70 border-b border-purple-100 text-[11px] uppercase tracking-wider text-slate-700 font-mono">
                  <tr>
                    <th className="px-4 sm:px-6 py-3.5">
                      {isSw ? "Jina la Bidhaa" : "Product Name"}
                    </th>
                    <th className="px-4 sm:px-6 py-3.5">
                      {isSw ? "Kipimo" : "Unit"}
                    </th>
                    <th className="px-4 sm:px-6 py-3.5">
                      {isSw ? "Kundi" : "Category"}
                    </th>
                    <th className="px-4 sm:px-6 py-3.5 text-right">
                      {isSw ? "Bei ya Wastani" : "Average Price"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.sampleCatalog.map((item) => (
                    <tr key={item.name} className="hover:bg-purple-50/30 transition-colors">
                      <td className="px-4 sm:px-6 py-3.5 font-bold text-slate-900">{item.name}</td>
                      <td className="px-4 sm:px-6 py-3.5 text-slate-600 font-mono">{item.unit}</td>
                      <td className="px-4 sm:px-6 py-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-violet-700">
                          {item.tag}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3.5 text-right font-black text-slate-950 font-mono">
                        {formatTZS(item.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Quote Banner */}
      <section className="py-12 sm:py-16 bg-slate-950 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-5">
          <div className="w-12 h-12 rounded-full bg-white/10 text-violet-300 flex items-center justify-center mx-auto text-2xl font-serif">
            “
          </div>
          <blockquote className="text-base sm:text-xl md:text-2xl font-medium leading-relaxed text-slate-200">
            "{isSw ? data.testimonial.quoteSw : data.testimonial.quote}"
          </blockquote>
          <div>
            <div className="font-black text-white text-base">{data.testimonial.author}</div>
            <div className="text-xs text-violet-300 mt-0.5">
              {data.testimonial.role} • {data.testimonial.location}
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section id="faq" className="py-14 sm:py-20 bg-white border-b border-purple-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-purple-200 bg-purple-50 text-violet-700 text-xs font-mono font-bold tracking-wider uppercase">
              <span>FAQS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              {isSw ? "Maswali Yanayoulizwa Mara kwa Mara" : "Frequently Asked Questions"}
            </h2>
          </div>

          <div className="space-y-3">
            {data.faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className="rounded-xl border border-purple-100 bg-slate-50/50 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full px-5 py-4 text-left font-bold text-sm sm:text-base text-slate-900 flex items-center justify-between gap-3 hover:bg-purple-50/50 transition-colors"
                  >
                    <span>{isSw ? faq.qSw : faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-violet-600 shrink-0 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-purple-50 pt-3">
                      {isSw ? faq.aSw : faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Explore Other Business Industries Grid */}
      <section className="py-12 sm:py-16 bg-purple-50/30 border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-lg sm:text-xl font-black text-slate-950">
              {isSw ? "Angalia Suluhu kwa Ajili ya Sekta Nyingine" : "Explore Solutions for Other Industries"}
            </h3>
            <p className="text-xs text-slate-600">
              {isSw ? "Kila tasnia ina sifa zake maalum zilizotayarishwa." : "Each industry has pre-configured workflows and templates."}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {allIndustries.map((ind) => {
              const IIcon = ind.icon;
              const isCurrent = ind.key === industry;

              return (
                <Link
                  key={ind.key}
                  to={ind.path}
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                    isCurrent
                      ? "border-violet-600 bg-violet-600 text-white shadow-sm"
                      : "border-purple-100 bg-white hover:border-violet-300 text-slate-900 hover:shadow-xs"
                  }`}
                >
                  <IIcon className={`w-4 h-4 shrink-0 ${isCurrent ? "text-white" : "text-violet-600"}`} />
                  <span className="text-xs font-bold truncate">
                    {isSw ? ind.titleSw : ind.title}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Conversion Banner */}
      <section className="py-14 sm:py-20 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-violet-300 text-xs font-mono font-bold tracking-wider uppercase border border-white/15">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isSw ? "ANZA BURE LEO" : "GET STARTED TODAY"}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
            {isSw
              ? `Je, Uko Tayari Kuboresha ${data.titleSw} Yako?`
              : `Ready to Modernize Your ${data.title}?`}
          </h2>

          <p className="text-xs sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            {isSw
              ? "Jiunge na wafanyabiashara zaidi ya 110+ kote Tanzania wanaotumia MauzoChap kudhibiti maduka yao bila kupoteza fedha wala bidhaa."
              : "Join over 110+ active merchants across Tanzania using MauzoChap to run efficient, profitable retail operations."}
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setRegisterModalOpen(true)}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm sm:text-base shadow-lg transition-all"
            >
              {isSw ? "Anza Jaribio la Siku 5 Bure" : "Start 5-Day Free Trial"}
            </button>
            <a
              href="https://wa.me/255764250828"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-white/20 hover:bg-white/10 text-white font-bold text-sm sm:text-base transition-colors"
            >
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp: +255 764 250 828</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-10 border-t border-slate-900 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/images/logo-white.png" alt="MauzoChap" className="w-6 h-6 object-contain" />
            <span className="font-bold text-white text-sm">MauzoChap POS</span>
            <span>• {isSw ? "Suluhu Maalum ya Biashara" : "Tailored Business POS"}</span>
          </div>
          <div className="flex flex-wrap gap-4 text-slate-400">
            <Link to="/" className="hover:text-white transition-colors">{isSw ? "Nyumbani" : "Home"}</Link>
            <Link to="/terms" className="hover:text-white transition-colors">{isSw ? "Vigezo & Masharti" : "Terms"}</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">{isSw ? "Sera ya Faragha" : "Privacy"}</Link>
            <Link to="/demo" className="hover:text-white transition-colors">Demo</Link>
          </div>
        </div>
      </footer>

      {/* Registration Modal */}
      <RegisterModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        t={{
          modal: {
            title: isSw ? "Sajili Duka Lako MauzoChap" : "Register Your Business",
            subtitle: isSw ? "Jaribio la siku 5 bure • Bila kadi ya benki" : "5-day free trial • No credit card",
            close: "Close",
          },
          multiStep: {
            step1Badge: "Step 1",
            step1Title: "Akaunti",
            step2Badge: "Step 2",
            step2Title: "Eneo",
            step3Badge: "Step 3",
            step3Title: "Biashara",
            back: "Nyuma",
            next: "Endelea",
            createAccount: "Kamilisha Usajili",
            fullName: "Jina Kamili",
            fullNamePlaceholder: "mfano: Juma Hamisi",
            phone: "Namba ya Simu",
            phonePlaceholder: "07XXXXXXXX",
            email: "Barua Pepe",
            emailPlaceholder: "juma@gmail.com",
            password: "Nenosiri",
            passwordPlaceholder: "Angalau herufi 6",
            region: "Mkoa",
            district: "Wilaya",
            districtPlaceholder: "Wilaya yako",
            street: "Mtaa / Eneo",
            streetPlaceholder: "Mtaa lilipo duka lako",
            businessName: "Jina la Biashara",
            businessNamePlaceholder: "mfano: Juma Mini Supermarket",
            businessType: "Aina ya Biashara",
            termsAgree: "Ninakubali Vigezo na Sera za MauzoChap",
            termsLink: "Vigezo na Masharti",
            privacyLink: "Sera ya Faragha",
            creating: "Inatengeneza akaunti...",
            alreadyHaveAccount: "Tayari una akaunti?",
            signIn: "Ingia hapa",
          },
        } as any}
      />
    </div>
  );
}
