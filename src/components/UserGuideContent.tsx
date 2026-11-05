import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Search,
  Printer,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  Boxes,
  Users,
  Wallet,
  UserCog,
  BarChart3,
  Smartphone,
  CreditCard,
  Lightbulb,
  ArrowRight,
  MessageCircle,
  Phone,
  Languages,
  X,
} from "lucide-react";
import { useLang } from "@/lib/i18n";

export type GuideCategory = "all" | "setup" | "sales_stock" | "customers_finance" | "management";

export interface GuideSection {
  id: string;
  number: string;
  category: Exclude<GuideCategory, "all">;
  icon: any;
  appLink?: string;
  appLinkLabel: { sw: string; en: string };
  title: { sw: string; en: string };
  summary: { sw: string; en: string };
  steps: {
    sw: Array<{ heading: string; detail: string }>;
    en: Array<{ heading: string; detail: string }>;
  };
  tip: { sw: string; en: string };
}

export const USER_GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "registration-billing",
    number: "01",
    category: "setup",
    icon: CreditCard,
    appLink: "/setup-billing",
    appLinkLabel: { sw: "Fungua Malipo ya Kifurushi", en: "Open Billing Setup" },
    title: {
      sw: "Usajili wa Akaunti & Kuanzisha Kifurushi",
      en: "Account Registration & Activating Your Plan",
    },
    summary: {
      sw: "Jinsi ya kufungua akaunti ya duka lako, kuchagua kifurushi sahihi, na kuthibitisha malipo ya M-Pesa / Tigo Pesa / Airtel Money.",
      en: "How to register your business account, pick the right subscription tier, and verify Mobile Money payments.",
    },
    steps: {
      sw: [
        {
          heading: "Jisajili kwa Dakika 2",
          detail:
            "Bonyeza 'Jisajili / Anza Sasa', jaza Jina Kamili la Mmiliki, Jina la Biashara/Duka, Namba ya Simu ya Tanzania (+255...), Barua Pepe (Email), na Nenosiri imara.",
        },
        {
          heading: "Chagua Kifurushi cha Biashara Yako",
          detail:
            "Chagua Starter (TZS 10,500/mwezi - tawi 1, bidhaa hadi 100), Kilimanjaro (TZS 15,500/mwezi - matawi 3, bidhaa bila kikomo + SMS ya usiku), au Serengeti (TZS 25,500/mwezi - matawi na wafanyakazi bila kikomo).",
        },
        {
          heading: "Fanya Malipo na Weka Kumbukumbu (Reference Number)",
          detail:
            "Fuata maelekezo ya malipo kwenye ukurasa wa 'Setup Billing', kisha nakili na uweke Namba ya Muamala (Transaction ID / Reference) kutoka kwenye ujumbe wako wa malipo ya simu.",
        },
        {
          heading: "Uthibitisho wa Haraka na Kuanza Kazi",
          detail:
            "Timu ya MauzoChap inahakiki muamala wako mara moja na utapokea ujumbe wa uthibitisho. Pia unaweza kuboresha maelezo ya duka lako kupitia menyu ya 'Mipangilio (Settings)'.",
        },
      ],
      en: [
        {
          heading: "Create Your Store Account in 2 Minutes",
          detail:
            "Click 'Sign Up / Get Started', enter Owner Full Name, Shop/Business Name, Tanzania Phone Number (+255...), Email Address, and a secure password.",
        },
        {
          heading: "Choose Your Subscription Plan",
          detail:
            "Select Starter (TZS 10,500/mo - 1 branch, up to 100 products), Kilimanjaro (TZS 15,500/mo - 3 branches, unlimited products + nightly SMS), or Serengeti (TZS 25,500/mo - unlimited branches & staff).",
        },
        {
          heading: "Pay & Submit Your Mobile Money Reference",
          detail:
            "Follow the payment instructions on the Billing Setup screen, then enter the Transaction Reference ID from your M-Pesa, Mixx by Yas (Tigo Pesa), or Airtel Money confirmation SMS.",
        },
        {
          heading: "Instant Activation & Profile Setup",
          detail:
            "Once verified, your store unlocks immediately. Visit 'Settings' anytime to update your business phone number, shop name, or password.",
        },
      ],
    },
    tip: {
      sw: "Hakikisha namba ya simu unayoweka kwenye usajili na 'Mipangilio' ni sahihi ili upokee SMS ya ripoti ya mauzo kila siku saa 20:30 usiku!",
      en: "Always keep your primary phone number accurate in Settings so you receive automated nightly 20:30 PM SMS business summaries!",
    },
  },
  {
    id: "products-inventory",
    number: "02",
    category: "sales_stock",
    icon: Boxes,
    appLink: "/products",
    appLinkLabel: { sw: "Nenda Kwenye Bidhaa", en: "Go to Products" },
    title: {
      sw: "Kuongeza Bidhaa, Barcode & Kusimamia Stoo (Inventory)",
      en: "Adding Products, Barcodes & Managing Inventory",
    },
    summary: {
      sw: "Ingiza bidhaa moja moja au kwa mkupuo (CSV), weka bei ya kununulia na kuuzia, na dhibiti bidhaa zinazokaribia kuisha au ku-expire.",
      en: "Add products individually or in bulk via CSV, set cost vs. selling prices, generate barcodes, and track low stock or expiry dates.",
    },
    steps: {
      sw: [
        {
          heading: "Ongeza Bidhaa Mpya ('Bidhaa -> Ongeza Bidhaa')",
          detail:
            "Jaza Jina la Bidhaa, Kategoria, Bei ya Kununulia (Cost), Bei ya Kuuzia (Price), Idadi iliyopo stoo (Stock), na Kiwango cha Tahadhari ya Stoo Ndogo (Low Stock Alert, mfano: 5).",
        },
        {
          heading: "Kupakia Bidhaa Nyingi kwa Pamoja (CSV Import)",
          detail:
            "Kama una orodha ndefu kwenye Excel, bonyeza kitufe cha 'Import CSV' kwenye ukurasa wa Bidhaa ili kupakia mamia ya bidhaa kwa sekunde chache.",
        },
        {
          heading: "Tengeneza au Skani Barcode ('Tools')",
          detail:
            "Ikiwa bidhaa ina barcode ya kiwandani, iskani wakati wa kusajili. Kama haina barcode, tumia menyu ya 'Tools' kutengeneza na kuchapisha stika za Barcode au QR Code.",
        },
        {
          heading: "Fuatilia Mizunguko ya Stoo & Expiry ('Ghala/Stoo')",
          detail:
            "Fungua 'Ghala/Stoo (Inventory)' kuongeza mzigo mpya ulioingia, kurekebisha stoo iliyoharibika, na kuweka namba za Batch pamoja na tarehe za mwisho wa matumizi (Expiry Date) kwa maduka ya dawa na vyakula.",
        },
      ],
      en: [
        {
          heading: "Add Individual Products ('Products -> Add Product')",
          detail:
            "Enter Product Name, Category, Buying Cost, Selling Price, Initial Stock Quantity, and Low-Stock Alert Threshold (e.g., 5 units).",
        },
        {
          heading: "Bulk Upload via CSV Import",
          detail:
            "Moving from Excel or notebooks? Use the 'Import CSV' button on the Products page to upload your entire catalog in seconds.",
        },
        {
          heading: "Scan or Generate Barcodes ('Tools')",
          detail:
            "Scan existing manufacturer barcodes into the Barcode field, or open 'Tools' in the sidebar to generate printable Code-128 barcodes and QR codes for unlabeled items.",
        },
        {
          heading: "Manage Stock Adjustments & Batch Expiry ('Inventory')",
          detail:
            "Use 'Inventory' to restock items, record stock adjustments, and track Batch Numbers & Expiry Dates (FEFO) for pharmacies, cosmetics, and groceries.",
        },
      ],
    },
    tip: {
      sw: "Kuweka 'Bei ya Kununulia (Cost)' kwa usahihi ni muhimu sana — ndiyo inayoiwezesha MauzoChap kukokotoa Faida Halisi (Net Profit) ya kila bidhaa unayouza!",
      en: "Entering accurate Buying Cost per product allows MauzoChap to automatically calculate your exact Gross & Net Profit on every sale!",
    },
  },
  {
    id: "pos-checkout-receipts",
    number: "03",
    category: "sales_stock",
    icon: ShoppingCart,
    appLink: "/pos",
    appLinkLabel: { sw: "Fungua Mauzo Mapya (POS)", en: "Open New Sale (POS)" },
    title: {
      sw: "Kufanya Mauzo Kaunta (POS) & Kutuma Risiti za WhatsApp/Thermal",
      en: "Making Counter Sales (POS) & Sending Receipts",
    },
    summary: {
      sw: "Uza kwa kasi ndani ya sekunde 2 kwa kutafuta jina au kuskani barcode, pokea malipo mchanganyiko, na toa risiti papo hapo.",
      en: "Sell in seconds using search or camera/USB barcode scanning, accept cash/mobile/split payments, and issue instant receipts.",
    },
    steps: {
      sw: [
        {
          heading: "Weka Bidhaa Kwenye Kikapu ('Mauzo Mapya')",
          detail:
            "Fungua 'Mauzo Mapya (POS)', tafuta bidhaa kwa jina au bonyeza alama ya kamera/scanner kuskani barcode. Unaweza pia kuweka vipimo vya desimali kama 0.5 kg au 1.25 mita.",
        },
        {
          heading: "Weka Punguzo (Discount) au Mteja",
          detail:
            "Ikiwa unampa mteja punguzo la bei, weka kiasi cha punguzo. Kwa mauzo ya kawaida acha 'Walk-in', au chagua jina la mteja ili kurekodi historia yake.",
        },
        {
          heading: "Chagua Njia ya Malipo (Taslimu, Simu, Benki au Mchanganyiko)",
          detail:
            "Chagua Cash (Pesa Taslimu), Mobile Money (Lipa Namba), Card, Bank, Credit (Mkopo), au 'Split Payment' endapo mteja analipa nusu taslimu na nusu kwa simu.",
        },
        {
          heading: "Chapisha Risiti (80mm / A4) au Tuma WhatsApp Bure",
          detail:
            "Baada ya kubonyeza 'Kamilisha Mauzo', dirisha la Risiti litafunguka. Chagua 'Thermal (80mm)' kwa printa ndogo, 'A4 PDF' kwa ankara kubwa, au tuma risiti ya picha/maandishi moja kwa moja kwenye WhatsApp ya mteja kwa TZS 0!",
        },
      ],
      en: [
        {
          heading: "Add Items to Cart ('New Sale / POS')",
          detail:
            "Open 'New Sale', search by product name/SKU, or scan barcodes with your phone camera or USB/Bluetooth scanner. Supports whole units and decimals (e.g., 0.5 kg).",
        },
        {
          heading: "Apply Discounts & Assign Customer",
          detail:
            "Optionally apply an item/cart discount and select a saved customer profile (or keep 'Walk-in' for quick over-the-counter buyers).",
        },
        {
          heading: "Select Payment Method (Cash, Lipa Namba, Credit, or Split)",
          detail:
            "Choose Cash, Mobile Money, Card, Bank, Credit, or Split Payment when a customer pays partly in cash and partly via mobile money.",
        },
        {
          heading: "Print Thermal/A4 or Share Free WhatsApp Receipt",
          detail:
            "Click 'Complete Sale' to open the Receipt modal. Print on an 80mm Bluetooth/USB thermal printer, export an A4 PDF, or send a clean WhatsApp digital receipt image/text at zero paper cost!",
        },
      ],
    },
    tip: {
      sw: "Kila mauzo yanapokamilika, idadi ya bidhaa inapungua stoo papo hapo na kuingia kwenye ripoti ya siku bila kuandika kwenye daftari!",
      en: "Every completed sale automatically deducts branch inventory in real time and logs the cashier, timestamp, and payment channel!",
    },
  },
  {
    id: "customers-debts-invoices",
    number: "04",
    category: "customers_finance",
    icon: Users,
    appLink: "/customers",
    appLinkLabel: { sw: "Fungua Wateja & Madeni", en: "Open Customers & Credit" },
    title: {
      sw: "Daftari la Wateja, Madeni (Mikopo) & Ankara (Proforma/Invoices)",
      en: "Customer Credit Book (Debts) & Proforma/Tax Invoices",
    },
    summary: {
      sw: "Epuka kupoteza pesa za madeni! Fuatilia kila mteja anayedaiwa, rekodi marejesho kidogo kidogo, na toa Proforma Invoice rasmi.",
      en: "Never lose track of store credit again. Monitor customer balances, record partial debt repayments, and issue formal quotes & invoices.",
    },
    steps: {
      sw: [
        {
          heading: "Sajili Mteja Kabla ya Kumpa Mkopo",
          detail:
            "Nenda kwenye 'Wateja -> Ongeza Mteja', weka Jina na Namba ya Simu ya mteja. Unaweza pia kumwongeza moja kwa moja ukiwa kwenye uwanja wa POS.",
        },
        {
          heading: "Kuuza kwa Mkopo au Malipo Nusu",
          detail:
            "Ukiwa kwenye POS, mchague mteja huyo, weka Njia ya Malipo 'Mkopo (Credit)' (au andika kiasi kidogo alichotanguliza kwenye 'Kiasi kilicholipwa'). Bakaa itaongezeka kiotomatiki kwenye deni lake.",
        },
        {
          heading: "Kupokea Marejesho ya Deni ('Pokea Malipo')",
          detail:
            "Mteja anapoleta pesa ya deni, fungua 'Wateja', mtafute mteja, kisha bonyeza 'Pokea Malipo (Receive Payment)'. Weka kiasi alicholipa na deni lake litapungua papo hapo.",
        },
        {
          heading: "Kutengeneza Proforma & Tax Invoices ('Invoices')",
          detail:
            "Kwa wateja wa taasisi, kampuni au jumla wanaohitaji makadirio ya bei kabla ya kulipa, fungua menyu ya 'Invoices' kutengeneza Proforma Invoice na kuibadilisha kuwa mauzo kamili wakilipa.",
        },
      ],
      en: [
        {
          heading: "Register Customers in Your Directory",
          detail:
            "Go to 'Customers -> Add Customer' and save their Name and Phone Number so their purchase history and credit balance are tracked.",
        },
        {
          heading: "Record Credit or Partial-Payment Sales",
          detail:
            "In POS, select the customer, choose 'Credit' (or enter the partial 'Amount Paid'). MauzoChap automatically records the remaining balance due under their profile.",
        },
        {
          heading: "Collect Debt Repayments ('Receive Payment')",
          detail:
            "When a customer pays back part or all of their debt, open 'Customers', click 'Receive Payment' next to their name, and record the amount received.",
        },
        {
          heading: "Generate Proforma Quotes & Tax Invoices ('Invoices')",
          detail:
            "Selling to companies, schools, or contractors? Use 'Invoices' to create professional A4 Proforma Quotes without deducting stock until confirmed.",
        },
      ],
    },
    tip: {
      sw: "Dashibodi yako inaonyesha jumla ya 'Madeni Yanasubiri (Pending Debts)' wakati wote ili ujue ni kiasi gani cha pesa yako kipo nje kwa wateja.",
      en: "Your Dashboard always highlights total 'Pending Debts' so you know exactly how much receivable cash is owed to your business.",
    },
  },
  {
    id: "expenses-suppliers",
    number: "05",
    category: "customers_finance",
    icon: Wallet,
    appLink: "/expenses",
    appLinkLabel: { sw: "Rekodi Matumizi", en: "Record Expenses" },
    title: {
      sw: "Kurekodi Matumizi ya Duka & Manunuzi kwa Wasambazaji",
      en: "Tracking Daily Shop Expenses & Supplier Purchases",
    },
    summary: {
      sw: "Tofautisha kati ya mauzo ghafi na faida halisi kwa kurekodi matumizi ya kila siku ya duka pamoja na mizigo ya wasambazaji.",
      en: "Know your true take-home profit by logging daily operating expenses and managing supplier restock orders.",
    },
    steps: {
      sw: [
        {
          heading: "Ingiza Matumizi ya Kila Siku ('Matumizi / Expenses')",
          detail:
            "Fungua 'Matumizi', bonyeza kuongeza matumizi mapya kama vile Umeme (LUKU), Kodi ya Fremu, Usafiri wa Mzigo, Chakula cha Mhudumu, au Vifungashio.",
        },
        {
          heading: "Ukokotoaji wa Faida Halisi (Net Profit)",
          detail:
            "Mfumo unachukua Faida ya Bidhaa Zilizouzwa kisha unatoa Matumizi uliyorekodi ili kukupa Faida Halisi iliyobaki mfukoni.",
        },
        {
          heading: "Sajili Wasambazaji Wako ('Wasambazaji / Suppliers')",
          detail:
            "Hifadhi majina na mawasiliano ya wauzaji wa jumla wanaokuuzia mzigo ili uwe na kumbukumbu kamili ya manunuzi na gharama za mzigo mpya.",
        },
      ],
      en: [
        {
          heading: "Log Daily Store Expenses ('Expenses')",
          detail:
            "Open 'Expenses' (available to Managers & Admins) and log operational costs like rent, LUKU electricity, transport, packaging, or petty cash.",
        },
        {
          heading: "Automatic Net Profit Calculation",
          detail:
            "MauzoChap subtracts recorded expenses from your Gross Product Profit so your Reports show real Net Profit rather than just gross turnover.",
        },
        {
          heading: "Manage Wholesalers & Purchase Orders ('Suppliers')",
          detail:
            "Keep a clean directory of your suppliers, contact phones, and restock purchase histories under 'Suppliers'.",
        },
      ],
    },
    tip: {
      sw: "Jenga utaratibu wa kurekodi hata matumizi madogo ya TZS 1,000 au 2,000 dukani — mwisho wa mwezi utaona wazi pesa zako zinakoenda!",
      en: "Log even small TZS 1,000–2,000 daily petty cash outflows — over 30 days they often explain hidden cash drawer shortages!",
    },
  },
  {
    id: "staff-roles-branches",
    number: "06",
    category: "management",
    icon: UserCog,
    appLink: "/users",
    appLinkLabel: { sw: "Simamia Watumiaji", en: "Manage Staff Users" },
    title: {
      sw: "Kuongeza Wafanyakazi (Cashier / Meneja) & Kusimamia Matawi",
      en: "Adding Staff Roles (Cashier / Manager) & Multi-Branch Control",
    },
    summary: {
      sw: "Mpe kila mfanyakazi akaunti yake yenye mipaka maalum ya ulinzi ili kuzuia kufutwa kwa mauzo au udanganyifu wa stoo.",
      en: "Give each employee their own login with strict role permissions and manage multiple shop locations from one owner account.",
    },
    steps: {
      sw: [
        {
          heading: "Alika Mfanyakazi Mpya ('Watumiaji / Users')",
          detail:
            "Mmiliki (Admin) anaweza kufungua 'Watumiaji', kuweka Jina, Simu, Barua Pepe ya mfanyakazi, Tawi analofanyia kazi, na kuchagua cheo chake.",
        },
        {
          heading: "Elewa Tofauti ya Vyeo (Roles)",
          detail:
            "• Cashier (Mhudumu): Anauza na kutoa risiti pekee (hawezi kufuta mauzo wala kuona faida ya siri ya mmiliki).\n• Manager (Meneja): Anaweza kusimamia stoo, kurekodi matumizi, na kuona ripoti za tawi.\n• Admin (Mmiliki): Ana udhibiti kamili wa matawi yote, watumiaji, na malipo.",
        },
        {
          heading: "Kusimamia Matawi Mengi ('Locations')",
          detail:
            "Kwenye vifurushi vya Kilimanjaro na Serengeti, fungua 'Locations' kuongeza tawi jipya. Mmiliki anaweza kubadilisha tawi juu kushoto kwenye menyu kuona mauzo na stoo ya kila duka moja kwa moja!",
        },
      ],
      en: [
        {
          heading: "Add Team Members ('Users')",
          detail:
            "As Admin/Owner, open 'Users', enter your employee's Full Name, Phone, Email, assigned Branch, and Role. They also receive a welcome SMS with login details.",
        },
        {
          heading: "Role-Based Security Permissions",
          detail:
            "• Cashier: Can make POS sales and issue receipts only — cannot delete sales or view owner profit margins.\n• Manager: Can adjust inventory, log expenses, and view reports.\n• Admin / Owner: Full access across all settings, users, and branches.",
        },
        {
          heading: "Multi-Branch Switching & Transfers ('Locations')",
          detail:
            "On Kilimanjaro & Serengeti plans, add branches under 'Locations' and use the top-left branch switcher in the sidebar to inspect any shop in real time.",
        },
      ],
    },
    tip: {
      sw: "Usimpe mhudumu wa kaunta password yako ya Mmiliki (Admin)! Mtengenezee akaunti ya 'Cashier' ili kila risiti ionyeshe nani aliyeuza.",
      en: "Never share your Owner login with counter staff! Create separate 'Cashier' accounts so every sale is tied to the exact staff member on shift.",
    },
  },
  {
    id: "reports-nightly-sms",
    number: "07",
    category: "management",
    icon: BarChart3,
    appLink: "/reports",
    appLinkLabel: { sw: "Tazama Ripoti za Biashara", en: "View Business Reports" },
    title: {
      sw: "Ripoti za Biashara & SMS ya Kila Siku Saa 20:30 Usiku",
      en: "Real-Time Business Reports & Nightly 20:30 PM SMS Summary",
    },
    summary: {
      sw: "Fuatilia mwenendo wa duka lako popote ulipo — kupitia chati za Dashibodi au ujumbe mfupi wa SMS kila usiku hata bila bando.",
      en: "Stay in complete control from anywhere with live profit analytics and automated 20:30 PM SMS executive summaries.",
    },
    steps: {
      sw: [
        {
          heading: "Dashibodi & Ripoti za Kina ('Dashibodi' & 'Ripoti')",
          detail:
            "Chuja mauzo ya Leo, Wiki Hii, Mwezi Huu, au tarehe maalum. Angalia Jumla ya Mauzo, Faida Halisi, Bidhaa Zinazoongoza Kuuzwa, na mchanganuo wa Taslimu dhidi ya Pesa za Simu.",
        },
        {
          heading: "Ripoti ya SMS Saa 20:30 Usiku (Bila Intaneti)",
          detail:
            "Kila usiku saa 2:30 (20:30 PM), MauzoChap inatuma muhtasari wa mauzo ya siku, faida halisi, idadi ya miamala, madeni yaliyokusanywa, na bidhaa zinazoisha moja kwa moja kwenye simu yako kwa jina la 'MAUZOCHAP'.",
        },
        {
          heading: "Arifa za Kengele Ndani ya Mfumo (Notifications)",
          detail:
            "Bonyeza alama ya kengele kwenye menyu kuona bidhaa zote zilizofikia kiwango cha chini cha stoo ili uagize mzigo mapema kabla haujakatika.",
        },
      ],
      en: [
        {
          heading: "Interactive Dashboard & Detailed Reports",
          detail:
            "Filter performance by Today, Last 7 Days, Monthly, or custom dates. Inspect Revenue, Net Profit, Top-Selling Products, and Cash vs. Mobile Money reconciliation.",
        },
        {
          heading: "Automated 20:30 PM Nightly SMS Report (Zero Data Needed)",
          detail:
            "Every evening at 20:30 PM, Kilimanjaro & Serengeti owners automatically receive an SMS from 'MAUZOCHAP' summarizing total sales, net profit, transactions, debts collected, and low-stock counts.",
        },
        {
          heading: "In-App Bell Alerts",
          detail:
            "Click the notification bell icon in the sidebar anytime to review instant low-stock warnings and subscription updates.",
        },
      ],
    },
    tip: {
      sw: "Kabla ya kufunga duka jioni, linganisha kiasi cha Taslimu + Lipa Namba kilichoonyeshwa kwenye 'Ripoti -> Mauzo ya Leo' na pesa halisi iliyopo drooni!",
      en: "At store closing, compare the Cash & Mobile Money totals in 'Reports' against your physical cash drawer and Lipa Namba statement for 100% shift accountability!",
    },
  },
  {
    id: "pwa-install-support",
    number: "08",
    category: "setup",
    icon: Smartphone,
    appLink: "/settings",
    appLinkLabel: { sw: "Fungua Mipangilio", en: "Open Settings" },
    title: {
      sw: "Kusakinisha App Kwenye Simu/PC (PWA) & Msaada kwa Wateja",
      en: "Installing the MauzoChap App (Android, iPhone & PC) & Support",
    },
    summary: {
      sw: "Weka MauzoChap kwenye kioo cha simu au kompyuta yako ifunguke haraka kama App ya kawaida na fahamu jinsi ya kupata msaada wa haraka.",
      en: "Install MauzoChap directly onto your phone, tablet, or desktop home screen and reach our Tanzania support team anytime.",
    },
    steps: {
      sw: [
        {
          heading: "Simu za Android (Google Chrome)",
          detail:
            "Fungua MauzoChap kwenye Chrome, bonyeza tangazo la 'Install MauzoChap' chini ya kioo (au bonyeza vitone vitatu juu kulia ⋮ -> 'Install app / Add to Home screen').",
        },
        {
          heading: "Simu za iPhone / iPad (Safari)",
          detail:
            "Fungua MauzoChap kupitia browser ya Safari, bonyeza kitufe cha 'Share' (mshale unaoelekea juu chini ya kioo), kisha chagua 'Add to Home Screen'.",
        },
        {
          heading: "Kompyuta / Laptop ya Kaunta (Windows au Mac)",
          detail:
            "Kwenye Chrome au Microsoft Edge, bonyeza alama ya kompyuta ndogo yenye mshale (Install MauzoChap) upande wa kulia wa sehemu ya kuandikia anwani (URL bar).",
        },
        {
          heading: "Msaada wa Haraka (Simu & WhatsApp Saa 24/7)",
          detail:
            "Ukikwama sehemu yoyote, wasiliana nasi moja kwa moja kwa WhatsApp au piga simu namba +255 627 274 168. Unaweza pia kubadilisha lugha kati ya Kiswahili na Kiingereza wakati wowote.",
        },
      ],
      en: [
        {
          heading: "Android Phones & Tablets (Chrome)",
          detail:
            "Open MauzoChap in Chrome and tap the 'Install' banner (or tap the 3-dot menu ⋮ -> 'Install app / Add to Home screen') for full-screen POS speed.",
        },
        {
          heading: "iPhone & iPad (Safari)",
          detail:
            "Open MauzoChap in Safari, tap the 'Share' icon at the bottom of the screen, scroll down, and tap 'Add to Home Screen'.",
        },
        {
          heading: "Windows / Mac Counter Computers",
          detail:
            "In Chrome or Edge, click the 'Install MauzoChap' icon on the right side of the browser address bar to pin MauzoChap to your taskbar/desktop.",
        },
        {
          heading: "Direct Tanzania Support Concierge",
          detail:
            "Need help importing products or connecting a Bluetooth thermal printer? Message or call our team on +255 627 274 168 via WhatsApp or phone.",
        },
      ],
    },
    tip: {
      sw: "Unaweza kubonyeza kitufe cha 'Chapisha / Pakua Mwongozo (PDF)' hapo juu ili kuhifadhi mwongozo huu wote kama PDF na kuwapa wahudumu wako wasome!",
      en: "Click 'Print / Save Guide (PDF)' at the top of this page to save a clean PDF manual or print a copy for new counter staff!",
    },
  },
];

const QUICK_START_STEPS = {
  sw: [
    { step: "1", title: "Jisajili & Washa Kifurushi", desc: "Fungua akaunti na thibitisha malipo" },
    { step: "2", title: "Ingiza Bidhaa & Stoo", desc: "Weka bei ya kununua, kuuza & idadi" },
    { step: "3", title: "Uza Kwenye POS", desc: "Skani au tafuta bidhaa kaunta" },
    { step: "4", title: "Toa Risiti", desc: "Tuma WhatsApp bure au printi 80mm" },
    { step: "5", title: "Kagua Faida & SMS", desc: "Soma Dashibodi & SMS saa 20:30" },
  ],
  en: [
    { step: "1", title: "Register & Activate", desc: "Create shop & verify subscription" },
    { step: "2", title: "Add Products & Stock", desc: "Set cost, selling price & stock" },
    { step: "3", title: "Sell on POS", desc: "Scan barcode or search items fast" },
    { step: "4", title: "Send Receipt", desc: "Share on WhatsApp or print 80mm" },
    { step: "5", title: "Track Profit & SMS", desc: "Check Reports & 20:30 PM SMS" },
  ],
};

const CATEGORY_LABELS: Record<GuideCategory, { sw: string; en: string }> = {
  all: { sw: "Mada Zote (8)", en: "All Topics (8)" },
  setup: { sw: "Kuanza & App", en: "Getting Started & App" },
  sales_stock: { sw: "Mauzo, Risiti & Stoo", en: "POS Sales & Stock" },
  customers_finance: { sw: "Wateja, Madeni & Matumizi", en: "Credit & Expenses" },
  management: { sw: "Wafanyakazi & Ripoti", en: "Staff & Reports" },
};

export interface UserGuideContentProps {
  variant?: "public" | "app";
}

export function UserGuideContent({ variant = "public" }: UserGuideContentProps) {
  const [lang, setLang] = useLang();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<GuideCategory>("all");
  const [expandedIds, setExpandedIds] = useState<string[]>(() =>
    USER_GUIDE_SECTIONS.map((s) => s.id),
  );

  const isSw = lang === "sw";

  const filteredSections = USER_GUIDE_SECTIONS.filter((section) => {
    const matchesCategory = activeCategory === "all" || section.category === activeCategory;
    if (!matchesCategory) return false;

    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;

    const haystack = [
      section.title.sw,
      section.title.en,
      section.summary.sw,
      section.summary.en,
      section.tip.sw,
      section.tip.en,
      ...section.steps.sw.flatMap((st) => [st.heading, st.detail]),
      ...section.steps.en.flatMap((st) => [st.heading, st.detail]),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });

  const toggleSection = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const expandAll = () => setExpandedIds(USER_GUIDE_SECTIONS.map((s) => s.id));
  const collapseAll = () => setExpandedIds([]);

  const handlePrintGuide = () => {
    setExpandedIds(USER_GUIDE_SECTIONS.map((s) => s.id));
    setTimeout(() => {
      window.print();
    }, 50);
  };

  return (
    <div className="space-y-8 print:space-y-6">
      {/* Top Action & Header Banner */}
      <div className="rounded-3xl border border-violet-200/80 bg-gradient-to-br from-violet-50/90 via-white to-emerald-50/40 p-5 sm:p-8 shadow-xs print:border-slate-300 print:bg-white print:shadow-none">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 text-violet-800 text-xs font-bold uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              <span>
                {isSw
                  ? "Mwongozo Rasmi wa Mtumiaji • MauzoChap POS"
                  : "Official Customer User Manual • MauzoChap POS"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight leading-tight">
              {isSw
                ? "Jinsi ya Kutumia Mfumo wa MauzoChap Hatua kwa Hatua"
                : "How to Use MauzoChap POS — Easy Step-by-Step Guide"}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {isSw
                ? "Mwongozo huu umeandaliwa kwa lugha rahisi ili kukusaidia wewe na wafanyakazi wako kuuza haraka kaunta, kudhibiti stoo, kufuatilia madeni, na kusoma ripoti za faida bila usumbufu."
                : "Everything you and your staff need to master counter sales, stock control, WhatsApp receipts, customer credit tracking, and automated 20:30 PM SMS reports."}
            </p>
          </div>

          {/* Language Toggle + Print/Download PDF */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 print:hidden">
            <button
              type="button"
              onClick={() => setLang(isSw ? "en" : "sw")}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <Languages className="w-4 h-4 text-violet-600" />
              <span>{isSw ? "Switch to English" : "Soma kwa Kiswahili"}</span>
            </button>

            <button
              type="button"
              onClick={handlePrintGuide}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>
                {isSw ? "Chapisha / Pakua Mwongozo (PDF)" : "Print / Save Guide (PDF)"}
              </span>
            </button>
          </div>
        </div>

        {/* 5-Minute Quick-Start Strip */}
        <div className="mt-6 pt-6 border-t border-violet-100">
          <div className="text-xs font-extrabold uppercase tracking-wider text-violet-700 mb-3">
            {isSw
              ? "⚡ Muhtasari wa Haraka: Hatua 5 za Kuanza Kuuza Leo"
              : "⚡ 5-Minute Quick-Start Checklist"}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {QUICK_START_STEPS[lang].map((item) => (
              <div
                key={item.step}
                className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/90 border border-slate-200/80 shadow-2xs"
              >
                <span className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                  {item.step}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 leading-snug">{item.title}</div>
                  <div className="text-[11px] text-slate-500 leading-snug mt-0.5">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="space-y-3 print:hidden">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isSw
                  ? "Tafuta kwenye mwongozo (mfano: risiti, barcode, madeni, SMS, cashier)..."
                  : "Search guide topics (e.g. receipt, barcode, credit, SMS, cashier)..."
              }
              aria-label={isSw ? "Tafuta kwenye mwongozo" : "Search user guide"}
              className="w-full h-11 pl-10 pr-9 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <button
              type="button"
              onClick={expandAll}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
            >
              {isSw ? "Fungua Zote" : "Expand All"}
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
            >
              {isSw ? "Funga Zote" : "Collapse All"}
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(CATEGORY_LABELS) as GuideCategory[]).map((cat) => {
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                  active
                    ? "bg-violet-600 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                {CATEGORY_LABELS[cat][lang]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Guide Chapters List */}
      {filteredSections.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-700">
            {isSw
              ? `Hakuna mada iliyopatikana kwa "${searchQuery}".`
              : `No guide topics matched "${searchQuery}".`}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setActiveCategory("all");
            }}
            className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold cursor-pointer"
          >
            {isSw ? "Onyesha Mada Zote" : "Reset Filters"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSections.map((section) => {
            const Icon = section.icon;
            const isOpen = expandedIds.includes(section.id);

            return (
              <section
                key={section.id}
                id={section.id}
                className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden transition-all print:break-inside-avoid print:border-slate-300 print:shadow-none"
              >
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={isOpen}
                  className="w-full p-4 sm:p-6 text-left flex items-start sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0 font-mono font-black text-sm">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-violet-600">
                          {isSw ? `Sura ya ${section.number}` : `Chapter ${section.number}`}
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug mt-0.5">
                        {section.title[lang]}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                        {section.summary[lang]}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 p-1.5 rounded-lg bg-slate-100 text-slate-600 print:hidden">
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-5 sm:px-6 sm:pb-6 pt-2 border-t border-slate-100 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {section.steps[lang].map((st, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-1.5"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                              {idx + 1}. {st.heading}
                            </h3>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line pl-6">
                            {st.detail}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Pro Tip + Direct App Shortcut */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-amber-50/80 border border-amber-200/80">
                      <div className="flex items-start gap-2.5 text-xs sm:text-sm text-amber-950">
                        <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>
                          <strong>{isSw ? "Dokezo Muhimu: " : "Pro Tip: "}</strong>
                          {section.tip[lang]}
                        </span>
                      </div>

                      {variant === "app" && section.appLink && (
                        <Link
                          to={section.appLink as any}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shrink-0 transition-colors print:hidden"
                        >
                          <span>{section.appLinkLabel[lang]}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Bottom Help & Customer Support Card */}
      <div className="rounded-3xl bg-[#01184c] text-white p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 print:bg-white print:text-slate-900 print:border print:border-slate-300">
        <div className="space-y-1.5 max-w-xl">
          <h2 className="text-lg sm:text-xl font-black">
            {isSw
              ? "Bado Unahitaji Msaada au Mafunzo kwa Wahudumu Wako?"
              : "Need Live Assistance or Staff Onboarding Support?"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 print:text-slate-600 leading-relaxed">
            {isSw
              ? "Timu yetu ya huduma kwa wateja Tanzania ipo tayari kukuelekeza kwa simu au WhatsApp jinsi ya kupakia bidhaa zako, kuunganisha printa ya risiti, au kutumia mfumo dukani."
              : "Our Tanzania customer success team is available via WhatsApp and phone to help you import inventory, connect thermal printers, or train your cashiers."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <a
            href="https://wa.me/255627274168?text=Habari%20MauzoChap%2C%20nahitaji%20msaada%20kwenye%20mfumo."
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp: +255 627 274 168</span>
          </a>

          <a
            href="tel:+255627274168"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white print:text-slate-900 print:border print:border-slate-300 text-xs font-bold transition-all"
          >
            <Phone className="w-4 h-4" />
            <span>{isSw ? "Piga Simu Sasa" : "Call Support"}</span>
          </a>
        </div>
      </div>
    </div>
  );
}

