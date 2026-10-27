export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  modifiedDate?: string;
  author: string;
  readTime: string;
  category: "Kiswahili" | "English";
  tags: string[];
  excerpt: string;
  content: string; // Markdown or HTML-like sections
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "daftari-la-mauzo-dhidi-ya-mfumo-wa-pos",
    title: "Daftari la Mauzo dhidi ya Mfumo wa Kidigitali wa POS: Kipi Kinafaa Duka Lako?",
    description:
      "Uchambuzi wa kina: Daftari la karatasi la mauzo dhidi ya mfumo wa kidigitali wa POS nchini Tanzania. Fahamu madhara ya wizi wa kimyakimya na jinsi mfumo unavyolinda faida ya biashara.",
    date: "2026-10-15",
    modifiedDate: "2026-10-25",
    author: "Timu ya Uhariri MauzoChap",
    readTime: "6 min read",
    category: "Kiswahili",
    tags: ["Daftari la Mauzo", "Mfumo wa POS", "Biashara Tanzania", "Usimamizi wa Duka"],
    excerpt:
      "Wafanyabiashara wengi nchini Tanzania bado wanatumia madaftari ya 'counter book' kurekodi mauzo. Lakini je, unafahamu hasara unazopata kila siku bila kujua?",
    content: `
## Utangulizi: Mazoea ya Daftari la Karatasi

Kwa miongo mingi, wafanyabiashara wengi wa maduka ya rejareja na jumla Kariakoo, Mwanza, Arusha, na kote nchini Tanzania wamekuwa wakitegemea madaftari makubwa ya kaunta ("counter books") kurekodi kila shughuli ya siku. 

Ingawa daftari linaonekana kuwa la bei nafuu mwanzoni, linaficha gharama kubwa sana ambazo mwenye biashara anazilipia taratibu kupitia **upotevu wa bidhaa, wizi wa wafanyakazi, na kutojua faida halisi**.

---

## Hasara 4 Kuu za Kuendelea Kutumia Daftari la Mauzo

### 1. Wizi wa Kimyakimya na Hesabu Zisizooana
Kwenye daftari, muuzaji anaweza kuuza bidhaa 5 lakini akaandika bidhaa 3 tu. Fedha ya bidhaa 2 akaweka mfukoni. Kama mmiliki usipofanya ukaguzi wa kimwili ("physical stock audit") kila jioni, huwezi kugundua mapungufu haya mpaka pale mtaji wako unapoanza kupungua.

### 2. Upotevu wa Kumbukumbu za Madeni (Daftari Kuchakaa au Kupotea)
Daftari likiangukiwa na maji, likichanika, au likipotea, madeni yote ya wateja yanafutika mara moja. Ni vigumu kumdai mteja aliyekopa miezi miwili iliyopita kama huna ushahidi uliohifadhiwa salama kidigitali.

### 3. Kutojua Faida Halisi ya Kila Siku
Kuhesabu jumla ya fedha zilizopo kwenye droo jioni hakumaanishi kuwa hiyo yote ni faida. Mfanyabiashara anatakiwa kujua:
- Gharama halisi ya bidhaa zilizonunuliwa (Cost of Goods Sold).
- Pesa taslimu zilizokusanywa.
- Madeni mapya yaliyotolewa.
- Matumizi madogo madogo ya siku (chakula, usafiri, pango).
Kufanya mahesabu haya kwa kalamu kila usiku huchosha na hufungua mianya ya makosa.

### 4. Kushindwa Kusimamia Duka Ukiwa Mbali
Ukiwa safarini au ukiwa na shughuli nyingine nje ya duka, huwezi kujua kilichoendelea dukani mpaka urudi na kupitia kurasa za daftari kwa macho.

---

## Kwanini Ubadili Kwenda Kwenye Mfumo wa POS (MauzoChap)?

Mfumo wa kidigitali kama **MauzoChap POS** unabadilisha kabisa jinsi unavyoendesha biashara yako:

1. **Kila Mauzo Yanakata Stoo Moja kwa Moja:** Hakuna mfanyakazi anayeweza kuuza bidhaa bila mfumo kurekodi.
2. **Ripoti ya SMS Kila Siku Saa 2:30 Usiku:** Hata kama uko nyumbani au safarini, simu yako inapokea ujumbe mfupi wenye:
   - Jumla ya mauzo ya siku.
   - Faida iliyopatikana.
   - Pesa taslimu zilizopo.
   - Madeni yaliyokusanywa.
3. **Daftari la Kidigitali la Madeni:** Rekodi jina la mteja, namba ya simu, na kiasi alichochukua. Mteja anapolipa, mfumo unakata deni na unaweza kumtumia risiti kwa WhatsApp.
4. **Risiti za Kisasa za Printa:** Toa risiti ya heshima kwa wateja wako inayojenga uaminifu na kuzuia wanunuzi kurudisha bidhaa kwa udanganyifu.

---

## Hatua ya Kuchukua

Biashara ya kisasa inahitaji zana za kisasa. Kuanza kutumia mfumo si jambo gumu wala ghali kama wengi wanavyofikiri. Ukiwa na simu yako janja (smartphone) au kompyuta yoyote ya kawaida, unaweza kuunganisha duka lako na MauzoChap ndani ya dakika chache.
    `,
  },
  {
    slug: "jinsi-ya-kusimamia-stoo-ya-duka",
    title: "Jinsi ya Kusimamia Stoo ya Duka kwa Urahisi na Kuzuia Upotevu wa Bidhaa",
    description:
      "Mbinu 5 zilizothibitishwa za kusimamia stoo na ghala ya duka lako Tanzania. Jinsi ya kufanya ukaguzi wa mara kwa mara, kupanga bidhaa, na kutumia mfumo wa kidigitali kuzuia hasara.",
    date: "2026-10-18",
    modifiedDate: "2026-10-26",
    author: "Timu ya Uhariri MauzoChap",
    readTime: "7 min read",
    category: "Kiswahili",
    tags: ["Usimamizi wa Stoo", "Inventory Tanzania", "Kuzuia Wizi", "Faida ya Duka"],
    excerpt:
      "Stoo ndio moyo wa biashara ya rejareja na jumla. Hapa kuna kanuni muhimu za kuhakikisha kila bidhaa unayonunua inaleta faida na haipotei.",
    content: `
## Utangulizi

Katika biashara ya maduka ya rejareja, jumla, au maduka ya dawa, mtaji wako mwingi huwa umefungwa kwenye stoo kwa mfumo wa bidhaa. Ikiwa usimamizi wa stoo ni dhaifu, unaweza kuwa unafanya mauzo makubwa kila siku lakini mwisho wa mwezi ukajikuta huna faida wala mtaji.

Hapa kuna hatua 5 za kiutendaji zitakazokusaidia kudhibiti stoo ya biashara yako:

---

## 1. Weka Kanuni ya Kila Mzigo Kuingizwa Kabla ya Kuuzwa (Stock In)

Kosa kubwa linalofanywa na maduka mengi ni kuanza kuuza mzigo mpya kabla haujahesabiwa na kuingizwa kwenye mfumo au kumbukumbu rasmi. 
- Mzigo unapofika kutoka kwa msambazaji au kiwandani, hakikisha unahesabiwa kwa uangalifu dhidi ya ankara (invoice/delivery note).
- Ingiza bidhaa hizo mara moja kwenye mfumo wa **MauzoChap** ili kiasi cha stoo kiongezeke rasmi.

---

## 2. Fuata Mfumo wa FEFO kwa Bidhaa Zinazoharibika

Ikiwa unauza vyakula, vinywaji, vipodozi, au una duka la dawa (Pharmacy / Duka la Dawa Part II), lazima utumie kanuni ya **FEFO (First-Expired, First-Out)**:
- Bidhaa zinazokaribia kumaliza muda wake wa matumizi lazima ziwekwe mbele ili ziuzwe kwanza.
- Mfumo wa MauzoChap una kipengele cha Batch & Expiry Tracking kinachokujulisha mapema bidhaa zikikaribia kuisha muda wake ili upunguze bei au uzirudishe kwa msambazaji kabla ya kupata hasara.

---

## 3. Fanya Ukaguzi wa Ghafla wa Stoo (Cycle Counting)

Usisubiri mwisho wa mwaka kufanya hesabu ya stoo ("annual inventory count"). Badala yake:
- Chagua kundi moja la bidhaa kila wiki (kwa mfano, vinywaji wiki hii, sabuni wiki ijayo).
- Hesabu bidhaa zilizopo kwenye rafu na stoo.
- Linganisha hesabu hiyo na idadi inayoonyeshwa kwenye mfumo wa MauzoChap.
- Tofauti ikionekana mara moja, ni rahisi kuwabana wahudumu kabla siku nyingi hazijapita.

---

## 4. Tenga Majukumu ya Wafanyakazi

Kama mfanyakazi yule yule anayepokea mzigo stoo ndiye anayeuza na ndiye anayefanya hesabu za jioni, ni rahisi sana kuficha mapungufu. 
- Mfumo wa MauzoChap unakuwezesha kutenga majukumu (Roles):
  - **Cashier (Muuzaji):** Anauza tu na kutoa risiti.
  - **Manager (Meneja):** Anaongeza mzigo mpya na kukagua stoo.
  - **Admin / Owner (Mmiliki):** Anaona ripoti zote za faida, miamala iliyofanyika, na taarifa za jumla.

---

## 5. Tumia Arifa za Bidhaa Zinazoisha (Low Stock Alerts)

Kukosa bidhaa mteja anapoiomba dukani kunamfanya mteja aende kwa mshindani wako. MauzoChap inakuruhusu kuweka "Minimum Reorder Point". Bidhaa inapobaki chache, mfumo unakuonyesha alama nyekundu ya onyo ili uagize mzigo mpya kwa wakati.
    `,
  },
  {
    slug: "jinsi-ya-kuhesabu-faida-na-hasara-dukani",
    title: "Jinsi ya Kuhesabu Faida na Hasara ya Duka la Rejareja kwa Usahihi",
    description:
      "Mwongozo rahisi wa kuelewa faida ghafi (Gross Profit), faida halisi (Net Profit), na kudhibiti matumizi ya biashara yako nchini Tanzania.",
    date: "2026-10-20",
    modifiedDate: "2026-10-27",
    author: "Timu ya Uhariri MauzoChap",
    readTime: "5 min read",
    category: "Kiswahili",
    tags: ["Hesabu za Biashara", "Faida Halisi", "Matumizi ya Duka", "Wafanyabiashara"],
    excerpt:
      "Kuingiza milioni 1 ya mauzo kwa siku haimaanishi una faida ya milioni 1. Jifunze kanuni ya kweli ya kuhesabu faida na kulinda mtaji wako.",
    content: `
## Utangulizi

Wafanyabiashara wengi huanguka kibiashara si kwa sababu hawana wateja, bali kwa sababu ya **kuchanganya mapato ya mauzo (Revenue) na faida halisi (Net Profit)**. 

Kama umeingiza TZS 500,000 kwenye droo yako ya mauzo leo, pesa hiyo si yako yote ya kutumia nyumbani. Hapa chini kuna mwongozo wa hatua kwa hatua wa kuelewa hesabu zako.

---

## 1. Tofauti Kati ya Mauzo, Faida Ghafi na Faida Halisi

### A. Mauzo ya Siku (Revenue)
Hii ni jumla ya fedha zote zilizopokelewa kutokana na bidhaa zilizouzwa dukani.
> Mfano: Umeuza katoni 10 za maji kwa TZS 10,000 kila moja = **TZS 100,000**.

### B. Gharama ya Ununuzi (Cost of Goods Sold - COGS)
Hii ni fedha uliyotumia kununua zile bidhaa zilizouzwa kutoka kwa msambazaji.
> Mfano: Kila katoni uliinunua kwa TZS 7,000 x katoni 10 = **TZS 70,000**.

### C. Faida Ghafi (Gross Profit)
Faida ghafi inapatikana kwa kutoa gharama ya bidhaa kutoka kwenye mauzo:
> **Faida Ghafi = Mauzo (100,000) - Gharama (70,000) = TZS 30,000**.

### D. Matumizi ya Uendeshaji (Operating Expenses)
Hizi ni gharama za kuendesha duka kwa siku hiyo:
- Chakula cha mhudumu wa duka.
- Umeme (LUKU).
- Mifuko ya kufungia bidhaa (nylon/karatasi).
- Gharama ya usafiri wa mzigo.
> Mfano: Matumizi ya siku = **TZS 10,000**.

### E. Faida Halisi (Net Profit)
Hii ndio fedha halisi uliyotengeneza wewe kama mfanyabiashara:
> **Faida Halisi = Faida Ghafi (30,000) - Matumizi (10,000) = TZS 20,000**.

---

## Jinsi MauzoChap POS Inavyorahisisha Hesabu Hizi

Kufanya hesabu hizi kwa kila bidhaa inayouzwa dukani kwa kutumia daftari na kikokotoo (calculator) ni kazi ngumu sana inayochukua masaa mengi.

Ukiwa na **MauzoChap**:
1. Unapoingiza bidhaa, unaweka bei ya kununulia (Cost) na bei ya kuuzia (Price).
2. Kila mteja anaponunua, mfumo unahesabu faida ghafi papo hapo kwa kila kipengele.
3. Sehemu ya **Expenses (Matumizi)** inakuruhusu kurekodi matumizi yoyote madogo madogo ya siku.
4. Kila siku saa 2:30 usiku, unapokea ujumbe mfupi wa SMS kwenye simu yako unaokuambia hasa faida uliyotengeneza baada ya kutoa gharama zote.
    `,
  },
  {
    slug: "how-to-choose-pos-system-tanzania",
    title: "How to Choose the Best POS System for Your Business in Tanzania (2026 Guide)",
    description:
      "A comprehensive checklist for selecting retail and restaurant POS software in Tanzania. Hardware compatibility, offline support, mobile money, and local support considerations.",
    date: "2026-10-22",
    modifiedDate: "2026-10-27",
    author: "MauzoChap Editorial Team",
    readTime: "8 min read",
    category: "English",
    tags: ["POS System Tanzania", "Retail Software", "Point of Sale", "Business Guide"],
    excerpt:
      "Selecting the right point of sale software can make or break your retail store. Here are the 6 critical factors to verify before paying for any POS in Tanzania.",
    content: `
## Introduction

As retail shops, pharmacies, supermarkets, and wholesale stores across Tanzania transition from manual paper notebooks to digital management, choosing the right Point of Sale (POS) platform has become one of the most critical business decisions a merchant will make.

A good POS system does not just print receipts; it secures your inventory, stops employee theft, monitors customer debts, and gives you complete financial clarity. Here is what you must look for before committing to any software.

---

## 1. Local Payment & Currency Support (TZS & Mobile Money)

Many international POS solutions are designed for credit cards and US dollars, creating unnecessary friction in Tanzania where customer transactions occur via cash, M-Pesa, Tigo Pesa, Airtel Money, or HaloPesa.
- Ensure the software natively supports Tanzanian Shillings (TZS).
- The checkout screen should allow your cashiers to split payments (e.g., partial cash, partial mobile money).

---

## 2. Offline-First Resilience for Unstable Internet

Internet blackouts and slow mobile network connectivity can bring retail stores to a standstill if your POS requires a continuous high-speed cloud connection.
- **MauzoChap POS** is engineered as an offline-first Progressive Web App (PWA). 
- If your internet connection drops, cashiers can continue scanning barcodes, completing checkouts, and printing thermal receipts without interruption. All sales synchronize automatically once the network restores.

---

## 3. Remote Owner Monitoring (Nightly SMS Summaries)

Most Tanzanian shop owners cannot stay inside their store from 7:00 AM to 10:00 PM every day. You may run multiple businesses or have formal employment elsewhere.
- Look for a system that sends you proactive reports rather than forcing you to log in to complex dashboards.
- MauzoChap automatically delivers an automated **SMS summary directly to your mobile phone every night at 20:30 PM**, detailing total sales, gross profit, cash in hand, and new debts recorded.

---

## 4. Hardware Freedom: Use Your Existing Devices

Beware of POS vendors that force you to buy expensive proprietary touch terminals costing upwards of TZS 2,000,000.
- A modern POS should run seamlessly on standard laptops, desktop computers, Android tablets, or smartphones.
- It must connect easily to standard 58mm and 80mm USB or Bluetooth thermal receipt printers and standard barcode scanners.

---

## 5. Built-in Customer Credit Notebook (Daftari la Madeni)

In almost every neighborhood in Tanzania, granting short-term credit to trusted customers is part of daily trade.
- If your POS treats every transaction as cash-only, staff will continue maintaining a separate paper book for credit sales, defeating the entire purpose of digitization.
- Ensure your POS lets you attach a sale to a customer's profile with an outstanding balance, track repayments, and send SMS balance reminders.

---

## Summary

Before investing your hard-earned capital, request a live trial. MauzoChap offers a **14-day free trial** with full functionality so you can test it directly on your store counter with your actual products.
    `,
  },
  {
    slug: "how-to-manage-retail-inventory",
    title: "How to Manage Retail Inventory and Reduce Discrepancies in Tanzania",
    description:
      "Practical strategies for Tanzanian shopkeepers to eliminate stock leakage, conduct painless weekly cycle counts, and automate low-stock reorders.",
    date: "2026-10-24",
    modifiedDate: "2026-10-27",
    author: "MauzoChap Editorial Team",
    readTime: "6 min read",
    category: "English",
    tags: ["Inventory Control", "Retail Management", "Stock Loss Prevention", "Tanzania"],
    excerpt:
      "Stock shrinkage is the silent killer of retail profit margins. Learn how smart inventory workflows can protect your hard-earned investment.",
    content: `
## Why Inventory Management Determines Retail Survival

In a retail business, cash that has been converted into inventory sitting on shelves represents your entire working capital. When items go missing, expire, or get damaged without being logged, that capital is permanently destroyed.

Here is how successful retailers across Tanzania maintain tight inventory control using modern POS workflows:

---

## 1. Institute Immediate Stock-In Protocols

Never allow incoming merchandise to hit the sales floor before it has been counted and officially logged into your inventory database. 
- When receiving shipments from wholesalers or manufacturers, cross-reference the physical units against the supplier invoice.
- Enter the cost price and unit quantities into your system immediately. This ensures that profit margin calculations reflect actual purchase costs.

---

## 2. Eliminate Discrepancies with Regular Cycle Counts

Conducting an annual inventory count is too infrequent to catch employee theft or operational leakage before massive damage is done.
- Instead, adopt **weekly cycle counts**: count high-value, fast-moving items (e.g., cooking oil, sugar, pharmaceuticals, electronics) every Monday morning.
- Compare physical counts with your digital stock ledger. Any unexplained discrepancy can be investigated immediately while events are fresh in staff members' minds.

---

## 3. Implement Strict Role Permissions

A cashier whose job is to ring up customers at the counter should never have administrative permission to modify product stock quantities or delete transactions.
- Use role-based access control:
  - **Cashiers:** Can only ring up sales and look up product prices.
  - **Managers:** Can perform stock counts and receive shipments.
  - **Store Owners:** Can view gross profit margins and financial summaries.

---

## 4. Leverage Low-Stock Alerts

Running out of key staple goods costs you double: you lose the immediate sale, and frustrated customers walk into your competitor's shop, potentially shifting their loyalty permanently.
- Configure automatic reorder notifications in your POS system to notify you the moment inventory levels drop below a safe threshold.
    `,
  },
];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
