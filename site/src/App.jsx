import React, { useState, useEffect, useRef } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { Coins, Wallet, ShieldAlert, ArrowLeftRight, Mail, CheckCircle2, Loader2, UploadCloud, Download, KeyRound, Network, Globe, Check, Copy } from 'lucide-react';

const LANGS = [
  { code: 'fa', label: 'فارسی', rtl: true },
  { code: 'en', label: 'English', rtl: false },
  { code: 'ar', label: 'العربية', rtl: true },
  { code: 'ckb', label: 'کوردیی سۆرانی', rtl: true },
  { code: 'hi', label: 'हिन्दी', rtl: false },
  { code: 'zh', label: '中文', rtl: false },
  { code: 'de', label: 'Deutsch', rtl: false },
  { code: 'sw', label: 'Kiswahili', rtl: false },
];

const POLYGON_CHAIN_ID = '0x89'; // 137 in hex
const POLYGON_NETWORK_PARAMS = {
  chainId: POLYGON_CHAIN_ID,
  chainName: 'Polygon Mainnet',
  nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
  rpcUrls: ['https://polygon-rpc.com'],
  blockExplorerUrls: ['https://polygonscan.com'],
};

// Deployed TokenFactory contract on Polygon Mainnet
const FACTORY_ADDRESS = '0x7DEAfCf7B5998F68250bCa1704246380177CEAF6';
const FACTORY_ABI = [
  'function createToken(string name_, string symbol_, uint256 initialSupply_) external returns (address)',
  'event TokenCreated(address indexed creator, address indexed tokenAddress, string name, string symbol, uint256 totalSupply)',
];

function shortAddr(addr) {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

const DICT = {
  fa: {
    brand: 'پالیگان توکن فکتوری',
    subtitle: 'ساخت آسان، امن و حرفه‌ای توکن روی شبکه پالیگان (Polygon)',
    heroTag: 'آماده روی Polygon Mainnet',
    connectWalletConnected: 'متصل شد',
    connectWalletDefault: 'اتصال کیف پول',
    tokenNameLabel: 'نام توکن (Token Name)',
    tokenSymbolLabel: 'نماد توکن (Ticker)',
    totalSupplyLabel: 'تعداد کل (Total Supply)',
    logoLabel: 'لوگوی توکن (عکس)',
    logoHint: 'فرمت PNG یا SVG، حداکثر ۲ مگابایت',
    previewTitle: 'فرم ساخت توکن',
    previewSub: 'اطلاعات زیر را کامل کنید تا قرارداد هوشمند توکن شما ساخته شود.',
    mintButton: 'تایید و ساخت توکن',
    minting: 'در حال پردازش قرارداد هوشمند...',
    successMessage: 'توکن شما با موفقیت روی شبکه پالیگان ساخته شد!',
    connectFirst: 'لطفاً ابتدا کیف پول خود را متصل کنید.',
    noWalletMsg: 'هیچ کیف پولی (مثل Metamask) روی مرورگر شما پیدا نشد. لطفاً ابتدا اکستنشن آن را نصب کنید.',
    wrongNetworkMsg: 'کیف پول شما به شبکه پالیگان متصل نیست.',
    switchNetwork: 'تغییر به شبکه پالیگان',
    connecting: 'در حال اتصال...',
    contractAddressLabel: 'آدرس قرارداد توکن (Contract Address)',
    copyAddress: 'کپی آدرس',
    copied: 'کپی شد!',
    guidesTitle: 'راهنمای جامع و آموزشی',
    guidesSub: 'سه گام ساده از نصب کیف پول تا مشاهده توکن ساخته‌شده',
    step1Title: 'نصب و راه‌اندازی کیف پول',
    step1Desc: 'ابتدا نرم‌افزار Metamask یا Trust Wallet را روی مرورگر کامپیوتر یا گوشی موبایل خود نصب کرده و یک کیف پول جدید بسازید. حتماً عبارت بازیابی (Seed Phrase) را یادداشت و در جای امن و آفلاین نگهداری کنید.',
    step2Title: 'اتصال به شبکه پالیگان',
    step2Desc: 'کیف پول خود را به شبکه Polygon Mainnet متصل کنید و مقداری توکن MATIC یا POL جهت پرداخت کارمزد تراکنش‌ها (Gas Fee) در کیف پول خود داشته باشید.',
    step3Title: 'دریافت توکن ساخته‌شده در کیف پول',
    step3Desc: 'پس از ساخت توکن، آدرس قرارداد (Contract Address) را کپی کرده و در بخش Import Tokens کیف پول خود وارد کنید تا توکن ساخته‌شده را مشاهده و مدیریت کنید.',
    exchangesTitle: 'صرافی‌های معتبر و رایگان',
    exchangesSub: 'برای معامله توکن ساخته‌شده، از صرافی‌های متمرکز یا غیرمتمرکز زیر استفاده کنید.',
    dexTitle: 'صرافی‌های غیرمتمرکز (DEX)',
    dexTag: 'رایگان و بدون احراز هویت',
    dexDesc: 'یونی‌سواپ (Uniswap)، سوشی‌سواپ (SushiSwap) و کویک‌سواپ (QuickSwap) بدون نیاز به ثبت‌نام یا احراز هویت، امکان معامله مستقیم توکن از کیف پول شما را فراهم می‌کنند.',
    cexTitle: 'صرافی‌های متمرکز (CEX)',
    cexTag: 'نیاز به احراز هویت (KYC)',
    cexDesc: 'بایننس (Binance)، کوکوین (KuCoin) و بای‌بیت (Bybit) صرافی‌های شناخته‌شده‌ای هستند که پیش از معامله نیاز به ثبت‌نام و احراز هویت دارند.',
    warningsTitle: 'هشدارهای امنیتی بسیار مهم',
    w1t: 'کلید خصوصی خود را فاش نکنید',
    w1: 'هرگز عبارت بازیابی (Seed Phrase) یا کلید خصوصی خود را تحت هیچ شرایطی در اختیار کسی قرار ندهید.',
    w2t: 'تراکنش را با دقت بررسی کنید',
    w2: 'پیش از تایید هر تراکنش، آدرس قرارداد و میزان کارمزد شبکه را به‌دقت بررسی کنید.',
    w3t: 'ریسک بازار را جدی بگیرید',
    w3: 'بازار ارزهای دیجیتال ریسک بالایی دارد؛ پیش از هر سرمایه‌گذاری تحقیقات کامل (DYOR) انجام دهید.',
    contactTitle: 'ارتباط با ما و پشتیبانی',
    contactDesc: 'برای سوالات فنی، پیشنهادات یا ارتباط مستقیم با تیم ما در تماس باشید:',
    emailLabel: 'ایمیل پشتیبانی',
    footer: 'تمامی حقوق محفوظ است © ۲۰۲۶ | پالیگان توکن فکتوری',
  },
  en: {
    brand: 'Polygon Token Factory',
    subtitle: 'Easy, secure, and professional token creation on the Polygon network',
    heroTag: 'Ready on Polygon Mainnet',
    connectWalletConnected: 'Connected',
    connectWalletDefault: 'Connect Wallet',
    tokenNameLabel: 'Token Name',
    tokenSymbolLabel: 'Ticker (Symbol)',
    totalSupplyLabel: 'Total Supply',
    logoLabel: 'Token Logo (Image)',
    logoHint: 'PNG or SVG, up to 2MB',
    previewTitle: 'Create Your Token',
    previewSub: 'Fill in the details below to deploy your token smart contract.',
    mintButton: 'Approve & Create Token',
    minting: 'Processing smart contract...',
    successMessage: 'Your token was successfully created on Polygon!',
    connectFirst: 'Please connect your wallet first.',
    noWalletMsg: 'No wallet extension (like MetaMask) was found in your browser. Please install one first.',
    wrongNetworkMsg: 'Your wallet is not connected to the Polygon network.',
    switchNetwork: 'Switch to Polygon',
    connecting: 'Connecting...',
    contractAddressLabel: 'Token Contract Address',
    copyAddress: 'Copy Address',
    copied: 'Copied!',
    guidesTitle: 'Comprehensive Educational Guides',
    guidesSub: 'Three simple steps, from installing a wallet to seeing your new token',
    step1Title: 'Wallet Installation',
    step1Desc: 'Install MetaMask or Trust Wallet on your browser or mobile device and create a new wallet. Always back up your Seed Phrase offline, in a secure place.',
    step2Title: 'Connect to Polygon',
    step2Desc: 'Connect your wallet to the Polygon Mainnet and keep a small amount of MATIC/POL on hand to cover network gas fees.',
    step3Title: 'Import Your Token',
    step3Desc: 'After creation, copy your token\u2019s Contract Address and use "Import Tokens" in your wallet to view and manage your newly minted token.',
    exchangesTitle: 'Trusted & Free Exchanges',
    exchangesSub: 'Trade your newly created token on the centralized or decentralized exchanges below.',
    dexTitle: 'Decentralized Exchanges (DEX)',
    dexTag: 'Free, no sign-up',
    dexDesc: 'Uniswap, SushiSwap, and QuickSwap let you trade directly from your wallet, with no registration or identity verification required.',
    cexTitle: 'Centralized Exchanges (CEX)',
    cexTag: 'Requires KYC',
    cexDesc: 'Binance, KuCoin, and Bybit are well-known exchanges that require account registration and identity verification before trading.',
    warningsTitle: 'Critical Security Warnings',
    w1t: 'Never expose your private key',
    w1: 'Never share your Seed Phrase or Private Key with anyone, under any circumstances.',
    w2t: 'Double-check every transaction',
    w2: 'Always verify the contract address and the network gas fee before confirming a transaction.',
    w3t: 'Take market risk seriously',
    w3: 'Cryptocurrency markets carry high risk; always do your own research (DYOR) before investing.',
    contactTitle: 'Contact Us & Support',
    contactDesc: 'For technical questions, feedback, or to reach our team directly:',
    emailLabel: 'Support Email',
    footer: 'All rights reserved © 2026 | Polygon Token Factory',
  },
  ar: {
    brand: 'مصنع عملات بوليجون',
    subtitle: 'إنشاء عملة رقمية سهل وآمن واحترافي على شبكة Polygon',
    heroTag: 'جاهز على شبكة Polygon الرئيسية',
    connectWalletConnected: 'متصل',
    connectWalletDefault: 'ربط المحفظة',
    tokenNameLabel: 'اسم العملة (Token Name)',
    tokenSymbolLabel: 'رمز العملة (Ticker)',
    totalSupplyLabel: 'إجمالي المعروض (Total Supply)',
    logoLabel: 'شعار العملة (صورة)',
    logoHint: 'بصيغة PNG أو SVG، بحد أقصى 2 ميغابايت',
    previewTitle: 'إنشاء عملتك',
    previewSub: 'أكمل البيانات التالية لنشر العقد الذكي لعملتك.',
    mintButton: 'تأكيد وإنشاء العملة',
    minting: 'جارٍ معالجة العقد الذكي...',
    successMessage: 'تم إنشاء عملتك بنجاح على شبكة Polygon!',
    connectFirst: 'يرجى ربط محفظتك أولاً.',
    noWalletMsg: 'لم يتم العثور على محفظة (مثل MetaMask) في متصفحك. يرجى تثبيت واحدة أولاً.',
    wrongNetworkMsg: 'محفظتك غير متصلة بشبكة Polygon.',
    switchNetwork: 'التبديل إلى شبكة Polygon',
    connecting: 'جارٍ الاتصال...',
    contractAddressLabel: 'عنوان عقد العملة (Contract Address)',
    copyAddress: 'نسخ العنوان',
    copied: 'تم النسخ!',
    guidesTitle: 'أدلة تعليمية شاملة',
    guidesSub: 'ثلاث خطوات بسيطة، من تثبيت المحفظة إلى رؤية عملتك الجديدة',
    step1Title: 'تثبيت المحفظة',
    step1Desc: 'ثبّت تطبيق Metamask أو Trust Wallet على متصفحك أو هاتفك، وأنشئ محفظة جديدة. احرص دائماً على حفظ عبارة الاسترداد (Seed Phrase) في مكان آمن وغير متصل بالإنترنت.',
    step2Title: 'الاتصال بشبكة Polygon',
    step2Desc: 'اربط محفظتك بشبكة Polygon Mainnet، واحتفظ بكمية بسيطة من MATIC أو POL لتغطية رسوم الشبكة (Gas Fee).',
    step3Title: 'استيراد عملتك إلى المحفظة',
    step3Desc: 'بعد الإنشاء، انسخ عنوان العقد (Contract Address) واستخدم خيار Import Tokens في محفظتك لمشاهدة وإدارة عملتك الجديدة.',
    exchangesTitle: 'منصات تداول موثوقة ومجانية',
    exchangesSub: 'تداول عملتك الجديدة عبر المنصات المركزية أو اللامركزية التالية.',
    dexTitle: 'منصات لامركزية (DEX)',
    dexTag: 'مجاني، بدون تسجيل',
    dexDesc: 'تتيح لك منصات مثل Uniswap وSushiSwap وQuickSwap التداول مباشرة من محفظتك دون الحاجة إلى تسجيل أو إثبات هوية.',
    cexTitle: 'منصات مركزية (CEX)',
    cexTag: 'يتطلب التحقق من الهوية (KYC)',
    cexDesc: 'تُعد Binance وKuCoin وBybit من المنصات المعروفة التي تتطلب إنشاء حساب والتحقق من الهوية قبل التداول.',
    warningsTitle: 'تحذيرات أمنية بالغة الأهمية',
    w1t: 'لا تكشف عن مفتاحك الخاص',
    w1: 'لا تشارك عبارة الاسترداد (Seed Phrase) أو مفتاحك الخاص مع أي شخص تحت أي ظرف.',
    w2t: 'تحقق من كل معاملة بعناية',
    w2: 'تأكد دائماً من عنوان العقد ورسوم الشبكة قبل تأكيد أي معاملة.',
    w3t: 'خذ مخاطر السوق على محمل الجد',
    w3: 'تنطوي أسواق العملات الرقمية على مخاطر عالية؛ قم دائماً بأبحاثك الخاصة (DYOR) قبل الاستثمار.',
    contactTitle: 'تواصل معنا والدعم الفني',
    contactDesc: 'للأسئلة الفنية أو الاقتراحات أو التواصل المباشر مع فريقنا:',
    emailLabel: 'البريد الإلكتروني للدعم',
    footer: 'جميع الحقوق محفوظة © 2026 | مصنع عملات بوليجون',
  },
  ckb: {
    brand: 'کارگەی تۆکنی پۆلیگۆن',
    subtitle: 'دروستکردنی ئاسان و ئارام و پیشەیی تۆکن لەسەر تۆڕی پۆلیگۆن (Polygon)',
    heroTag: 'ئامادەیە لەسەر Polygon Mainnet',
    connectWalletConnected: 'بەستراوە',
    connectWalletDefault: 'بەستنەوەی جزدان',
    tokenNameLabel: 'ناوی تۆکن (Token Name)',
    tokenSymbolLabel: 'هێمای تۆکن (Ticker)',
    totalSupplyLabel: 'کۆی گشتی (Total Supply)',
    logoLabel: 'لۆگۆی تۆکن (وێنە)',
    logoHint: 'فۆرماتی PNG یان SVG، زۆرترین ٢ مێگابایت',
    previewTitle: 'تۆکنەکەت دروست بکە',
    previewSub: 'زانیارییەکانی خوارەوە پڕبکەوە بۆ بڵاوکردنەوەی گرێبەستی زیرەکی تۆکنەکەت.',
    mintButton: 'پشتڕاستکردنەوە و دروستکردنی تۆکن',
    minting: 'گرێبەستی زیرەک لە پرۆسەکردندایە...',
    successMessage: 'تۆکنەکەت بە سەرکەوتوویی لەسەر Polygon دروست کرا!',
    connectFirst: 'تکایە سەرەتا جزدانەکەت ببەستەوە.',
    noWalletMsg: 'هیچ جزدانێک (وەک MetaMask) لەسەر وێبگەڕەکەت نەدۆزرایەوە. تکایە سەرەتا یەکێکیان دابمەزرێنە.',
    wrongNetworkMsg: 'جزدانەکەت بە تۆڕی پۆلیگۆن نەبەستراوەتەوە.',
    switchNetwork: 'گۆڕین بۆ تۆڕی پۆلیگۆن',
    connecting: 'لە پرۆسەی بەستنەوەدایە...',
    contractAddressLabel: 'ناونیشانی گرێبەستی تۆکن (Contract Address)',
    copyAddress: 'کۆپیکردنی ناونیشان',
    copied: 'کۆپی کرا!',
    guidesTitle: 'ڕێنمایی تەواو و فێرکاری',
    guidesSub: 'سێ هەنگاوی ساکار، لە دامەزراندنی جزدانەوە تا بینینی تۆکنی نوێ',
    step1Title: 'دامەزراندنی جزدان',
    step1Desc: 'سەرەتا بەرنامەی Metamask یان Trust Wallet لەسەر وێبگەڕ یان مۆبایلەکەت دابمەزرێنە و جزدانێکی نوێ دروست بکە. هەمیشە دەقی گەڕانەوە (Seed Phrase) بە شێوەیەکی سەلامەت و دوور لە ئینتەرنێت هەڵبگرە.',
    step2Title: 'بەستنەوە بە تۆڕی پۆلیگۆن',
    step2Desc: 'جزدانەکەت بە Polygon Mainnet ببەستەوە و بڕێک MATIC یان POL هەڵبگرە بۆ دانی کرێی تۆڕ (Gas Fee).',
    step3Title: 'هێنانی تۆکنەکە بۆ ناو جزدان',
    step3Desc: 'پاش دروستکردن، ناونیشانی گرێبەست (Contract Address) کۆپی بکە و لە بەشی Import Tokens ی جزدانەکەت بیخەرە بۆ بینین و بەڕێوەبردنی تۆکنی نوێ.',
    exchangesTitle: 'بۆرسە باوەڕپێکراو و بێبەرامبەرەکان',
    exchangesSub: 'تۆکنی نوێت بگۆڕەوە لەسەر بۆرسە ناوەندی یان ناوەندنەبووەکانی خوارەوە.',
    dexTitle: 'بۆرسە ناوەندنەبووەکان (DEX)',
    dexTag: 'بێبەرامبەر، بێ تۆمارکردن',
    dexDesc: 'Uniswap و SushiSwap و QuickSwap ڕێگەت پێدەدەن ڕاستەوخۆ لە جزدانەکەتەوە بازرگانی بکەیت، بەبێ پێویستی بە تۆمارکردن یان پشتڕاستکردنەوەی ناسنامە.',
    cexTitle: 'بۆرسە ناوەندییەکان (CEX)',
    cexTag: 'پێویستی بە پشتڕاستکردنەوەی ناسنامەیە (KYC)',
    cexDesc: 'Binance و KuCoin و Bybit بۆرسە ناسراوەکانن کە پێش بازرگانی پێویستیان بە تۆمارکردنی هەژمار و پشتڕاستکردنەوەی ناسنامەیە.',
    warningsTitle: 'ئاگاداریی تایبەتی هەرە گرنگ',
    w1t: 'کلیلی تایبەتیت ئاشکرا مەکە',
    w1: 'هەرگیز دەقی گەڕانەوە (Seed Phrase) یان کلیلی تایبەتیت لەگەڵ کەس بڵاو مەکەرەوە، لەژێر هیچ بارودۆخێکدا.',
    w2t: 'هەموو مامەڵەیەک بە وردی پشکنین بکە',
    w2: 'پێش پشتڕاستکردنەوەی هەر مامەڵەیەک، ناونیشانی گرێبەست و کرێی تۆڕ بە وردی بپشکنە.',
    w3t: 'مەترسی بازاڕ بە جددی وەربگرە',
    w3: 'بازاڕی کریپتۆ مەترسیی بەرزی هەیە؛ پێش هەر وەبەرهێنانێک لێکۆڵینەوەی تەواو (DYOR) ئەنجام بدە.',
    contactTitle: 'پەیوەندیمان پێوە بکە و پشتگیری',
    contactDesc: 'بۆ پرسیاری تەکنیکی، پێشنیار، یان پەیوەندی ڕاستەوخۆ لەگەڵ تیمەکەمان:',
    emailLabel: 'ئیمەیلی پشتگیری',
    footer: 'هەموو مافەکان پارێزراون © ٢٠٢٦ | کارگەی تۆکنی پۆلیگۆن',
  },
  hi: {
    brand: 'पॉलीगॉन टोकन फैक्ट्री',
    subtitle: 'पॉलीगॉन (Polygon) नेटवर्क पर आसान, सुरक्षित और पेशेवर टोकन निर्माण',
    heroTag: 'Polygon Mainnet पर तैयार',
    connectWalletConnected: 'जुड़ा हुआ है',
    connectWalletDefault: 'वॉलेट कनेक्ट करें',
    tokenNameLabel: 'टोकन का नाम (Token Name)',
    tokenSymbolLabel: 'टोकन प्रतीक (Ticker)',
    totalSupplyLabel: 'कुल आपूर्ति (Total Supply)',
    logoLabel: 'टोकन लोगो (छवि)',
    logoHint: 'PNG या SVG फॉर्मेट, अधिकतम 2MB',
    previewTitle: 'अपना टोकन बनाएं',
    previewSub: 'अपने टोकन का स्मार्ट कॉन्ट्रैक्ट डिप्लॉय करने के लिए नीचे विवरण भरें।',
    mintButton: 'पुष्टि करें और टोकन बनाएं',
    minting: 'स्मार्ट कॉन्ट्रैक्ट प्रोसेस हो रहा है...',
    successMessage: 'आपका टोकन पॉलीगॉन नेटवर्क पर सफलतापूर्वक बन गया!',
    connectFirst: 'कृपया पहले अपना वॉलेट कनेक्ट करें।',
    noWalletMsg: 'आपके ब्राउज़र में कोई वॉलेट (जैसे MetaMask) नहीं मिला। कृपया पहले एक इंस्टॉल करें।',
    wrongNetworkMsg: 'आपका वॉलेट पॉलीगॉन नेटवर्क से जुड़ा नहीं है।',
    switchNetwork: 'पॉलीगॉन नेटवर्क पर स्विच करें',
    connecting: 'कनेक्ट हो रहा है...',
    contractAddressLabel: 'टोकन कॉन्ट्रैक्ट एड्रेस',
    copyAddress: 'एड्रेस कॉपी करें',
    copied: 'कॉपी हो गया!',
    guidesTitle: 'व्यापक शैक्षिक मार्गदर्शिका',
    guidesSub: 'वॉलेट इंस्टॉल करने से लेकर नया टोकन देखने तक, तीन आसान चरण',
    step1Title: 'वॉलेट इंस्टॉल करना',
    step1Desc: 'अपने ब्राउज़र या मोबाइल पर Metamask या Trust Wallet इंस्टॉल करें और एक नया वॉलेट बनाएं। अपनी सीड फ्रेज़ (Seed Phrase) को हमेशा ऑफ़लाइन और सुरक्षित जगह पर रखें।',
    step2Title: 'पॉलीगॉन नेटवर्क से जुड़ें',
    step2Desc: 'अपने वॉलेट को Polygon Mainnet से कनेक्ट करें और नेटवर्क शुल्क (Gas Fee) चुकाने के लिए थोड़ी मात्रा में MATIC या POL रखें।',
    step3Title: 'अपना टोकन वॉलेट में इम्पोर्ट करें',
    step3Desc: 'बनाने के बाद, कॉन्ट्रैक्ट एड्रेस (Contract Address) कॉपी करें और अपने नए टोकन को देखने व प्रबंधित करने के लिए वॉलेट में "Import Tokens" का उपयोग करें।',
    exchangesTitle: 'भरोसेमंद और मुफ्त एक्सचेंज',
    exchangesSub: 'अपने नए टोकन को नीचे दिए गए सेंट्रलाइज़्ड या डीसेंट्रलाइज़्ड एक्सचेंजों पर ट्रेड करें।',
    dexTitle: 'डीसेंट्रलाइज़्ड एक्सचेंज (DEX)',
    dexTag: 'मुफ्त, बिना रजिस्ट्रेशन',
    dexDesc: 'Uniswap, SushiSwap और QuickSwap आपको बिना रजिस्ट्रेशन या पहचान सत्यापन के सीधे अपने वॉलेट से ट्रेड करने देते हैं।',
    cexTitle: 'सेंट्रलाइज़्ड एक्सचेंज (CEX)',
    cexTag: 'पहचान सत्यापन (KYC) आवश्यक',
    cexDesc: 'Binance, KuCoin और Bybit जाने-माने एक्सचेंज हैं जिन्हें ट्रेडिंग से पहले खाता पंजीकरण और पहचान सत्यापन की आवश्यकता होती है।',
    warningsTitle: 'अत्यंत महत्वपूर्ण सुरक्षा चेतावनियां',
    w1t: 'अपनी प्राइवेट की उजागर न करें',
    w1: 'अपनी सीड फ्रेज़ (Seed Phrase) या प्राइवेट की किसी भी परिस्थिति में किसी के साथ साझा न करें।',
    w2t: 'हर लेनदेन को ध्यान से जांचें',
    w2: 'किसी भी लेनदेन की पुष्टि करने से पहले कॉन्ट्रैक्ट एड्रेस और नेटवर्क शुल्क को ध्यान से जांचें।',
    w3t: 'बाज़ार के जोखिम को गंभीरता से लें',
    w3: 'क्रिप्टोकरेंसी बाज़ार में उच्च जोखिम होता है; निवेश से पहले हमेशा अपना खुद का शोध (DYOR) करें।',
    contactTitle: 'हमसे संपर्क करें और सहायता',
    contactDesc: 'तकनीकी प्रश्नों, सुझावों, या हमारी टीम से सीधे संपर्क के लिए:',
    emailLabel: 'सहायता ईमेल',
    footer: 'सर्वाधिकार सुरक्षित © 2026 | पॉलीगॉन टोकन फैक्ट्री',
  },
  zh: {
    brand: 'Polygon 代币工厂',
    subtitle: '在 Polygon 网络上轻松、安全、专业地创建代币',
    heroTag: '已支持 Polygon 主网',
    connectWalletConnected: '已连接',
    connectWalletDefault: '连接钱包',
    tokenNameLabel: '代币名称 (Token Name)',
    tokenSymbolLabel: '代币符号 (Ticker)',
    totalSupplyLabel: '总供应量 (Total Supply)',
    logoLabel: '代币图标（图片）',
    logoHint: 'PNG 或 SVG 格式，最大 2MB',
    previewTitle: '创建您的代币',
    previewSub: '填写以下信息以部署您的代币智能合约。',
    mintButton: '确认并创建代币',
    minting: '正在处理智能合约...',
    successMessage: '您的代币已成功在 Polygon 网络上创建！',
    connectFirst: '请先连接您的钱包。',
    noWalletMsg: '未在您的浏览器中检测到钱包扩展程序（如 MetaMask）。请先安装一个。',
    wrongNetworkMsg: '您的钱包未连接到 Polygon 网络。',
    switchNetwork: '切换到 Polygon 网络',
    connecting: '正在连接...',
    contractAddressLabel: '代币合约地址',
    copyAddress: '复制地址',
    copied: '已复制！',
    guidesTitle: '全面的教程指南',
    guidesSub: '从安装钱包到查看新代币，只需三个简单步骤',
    step1Title: '安装钱包',
    step1Desc: '在浏览器或手机上安装 MetaMask 或 Trust Wallet，并创建一个新钱包。请务必将助记词（Seed Phrase）离线保存在安全的地方。',
    step2Title: '连接到 Polygon 网络',
    step2Desc: '将您的钱包连接到 Polygon 主网，并保留少量 MATIC 或 POL 以支付网络手续费（Gas Fee）。',
    step3Title: '将代币导入钱包',
    step3Desc: '创建完成后，复制合约地址（Contract Address），并在钱包中使用"导入代币"功能查看和管理您的新代币。',
    exchangesTitle: '可信且免费的交易所',
    exchangesSub: '在以下中心化或去中心化交易所交易您的新代币。',
    dexTitle: '去中心化交易所 (DEX)',
    dexTag: '免费，无需注册',
    dexDesc: 'Uniswap、SushiSwap 和 QuickSwap 让您可以直接从钱包交易，无需注册或身份验证。',
    cexTitle: '中心化交易所 (CEX)',
    cexTag: '需要身份验证 (KYC)',
    cexDesc: '币安（Binance）、KuCoin 和 Bybit 是知名交易所，交易前需要注册账户并完成身份验证。',
    warningsTitle: '极其重要的安全警告',
    w1t: '切勿泄露您的私钥',
    w1: '在任何情况下都不要与任何人分享您的助记词（Seed Phrase）或私钥。',
    w2t: '仔细核实每一笔交易',
    w2: '在确认任何交易之前，请仔细核实合约地址和网络手续费。',
    w3t: '认真对待市场风险',
    w3: '加密货币市场风险很高；投资前请务必自行研究（DYOR）。',
    contactTitle: '联系我们与支持',
    contactDesc: '如有技术问题、建议，或希望直接联系我们的团队：',
    emailLabel: '支持邮箱',
    footer: '版权所有 © 2026 | Polygon 代币工厂',
  },
  de: {
    brand: 'Polygon Token-Fabrik',
    subtitle: 'Einfache, sichere und professionelle Token-Erstellung im Polygon-Netzwerk',
    heroTag: 'Bereit für das Polygon-Mainnet',
    connectWalletConnected: 'Verbunden',
    connectWalletDefault: 'Wallet verbinden',
    tokenNameLabel: 'Token-Name',
    tokenSymbolLabel: 'Token-Symbol (Ticker)',
    totalSupplyLabel: 'Gesamtangebot (Total Supply)',
    logoLabel: 'Token-Logo (Bild)',
    logoHint: 'PNG oder SVG, maximal 2 MB',
    previewTitle: 'Erstellen Sie Ihren Token',
    previewSub: 'Füllen Sie die folgenden Angaben aus, um Ihren Token-Smart-Contract bereitzustellen.',
    mintButton: 'Bestätigen und Token erstellen',
    minting: 'Smart Contract wird verarbeitet...',
    successMessage: 'Ihr Token wurde erfolgreich auf Polygon erstellt!',
    connectFirst: 'Bitte verbinden Sie zuerst Ihre Wallet.',
    noWalletMsg: 'In Ihrem Browser wurde keine Wallet-Erweiterung (wie MetaMask) gefunden. Bitte installieren Sie zuerst eine.',
    wrongNetworkMsg: 'Ihre Wallet ist nicht mit dem Polygon-Netzwerk verbunden.',
    switchNetwork: 'Zu Polygon wechseln',
    connecting: 'Verbindung wird hergestellt...',
    contractAddressLabel: 'Token-Contract-Adresse',
    copyAddress: 'Adresse kopieren',
    copied: 'Kopiert!',
    guidesTitle: 'Umfassende Anleitungen',
    guidesSub: 'Drei einfache Schritte, von der Wallet-Installation bis zum neuen Token',
    step1Title: 'Wallet installieren',
    step1Desc: 'Installieren Sie MetaMask oder Trust Wallet in Ihrem Browser oder auf Ihrem Smartphone und erstellen Sie eine neue Wallet. Bewahren Sie Ihre Seed Phrase immer offline an einem sicheren Ort auf.',
    step2Title: 'Mit Polygon verbinden',
    step2Desc: 'Verbinden Sie Ihre Wallet mit dem Polygon-Mainnet und halten Sie etwas MATIC oder POL bereit, um die Netzwerkgebühren (Gas Fee) zu decken.',
    step3Title: 'Token in die Wallet importieren',
    step3Desc: 'Kopieren Sie nach der Erstellung die Contract-Adresse und nutzen Sie „Import Tokens" in Ihrer Wallet, um Ihren neuen Token anzuzeigen und zu verwalten.',
    exchangesTitle: 'Vertrauenswürdige & kostenlose Börsen',
    exchangesSub: 'Handeln Sie Ihren neuen Token an den folgenden zentralen oder dezentralen Börsen.',
    dexTitle: 'Dezentrale Börsen (DEX)',
    dexTag: 'Kostenlos, keine Anmeldung',
    dexDesc: 'Uniswap, SushiSwap und QuickSwap ermöglichen den direkten Handel aus Ihrer Wallet heraus, ganz ohne Registrierung oder Identitätsprüfung.',
    cexTitle: 'Zentrale Börsen (CEX)',
    cexTag: 'Identitätsprüfung (KYC) erforderlich',
    cexDesc: 'Binance, KuCoin und Bybit sind bekannte Börsen, die vor dem Handel eine Kontoregistrierung und Identitätsprüfung verlangen.',
    warningsTitle: 'Sehr wichtige Sicherheitshinweise',
    w1t: 'Geben Sie Ihren privaten Schlüssel niemals preis',
    w1: 'Teilen Sie Ihre Seed Phrase oder Ihren privaten Schlüssel unter keinen Umständen mit jemandem.',
    w2t: 'Prüfen Sie jede Transaktion sorgfältig',
    w2: 'Überprüfen Sie vor jeder Bestätigung immer die Contract-Adresse und die Netzwerkgebühr.',
    w3t: 'Nehmen Sie das Marktrisiko ernst',
    w3: 'Kryptomärkte bergen ein hohes Risiko; recherchieren Sie vor jeder Investition immer selbst (DYOR).',
    contactTitle: 'Kontakt & Support',
    contactDesc: 'Bei technischen Fragen, Feedback oder direktem Kontakt zu unserem Team:',
    emailLabel: 'Support-E-Mail',
    footer: 'Alle Rechte vorbehalten © 2026 | Polygon Token-Fabrik',
  },
  sw: {
    brand: 'Kiwanda cha Tokeni cha Polygon',
    subtitle: 'Uundaji rahisi, salama na wa kitaalamu wa tokeni kwenye mtandao wa Polygon',
    heroTag: 'Tayari kwenye Polygon Mainnet',
    connectWalletConnected: 'Imeunganishwa',
    connectWalletDefault: 'Unganisha Pochi',
    tokenNameLabel: 'Jina la Tokeni (Token Name)',
    tokenSymbolLabel: 'Alama ya Tokeni (Ticker)',
    totalSupplyLabel: 'Jumla ya Ugavi (Total Supply)',
    logoLabel: 'Nembo ya Tokeni (Picha)',
    logoHint: 'Muundo wa PNG au SVG, upeo wa MB 2',
    previewTitle: 'Unda Tokeni Yako',
    previewSub: 'Jaza taarifa zifuatazo ili kutuma mkataba wako wa tokeni.',
    mintButton: 'Thibitisha na Unda Tokeni',
    minting: 'Mkataba wa akili unachakatwa...',
    successMessage: 'Tokeni yako imeundwa kwa mafanikio kwenye Polygon!',
    connectFirst: 'Tafadhali unganisha pochi yako kwanza.',
    noWalletMsg: 'Hakuna kiendelezi cha pochi (kama MetaMask) kilichopatikana kwenye kivinjari chako. Tafadhali sakinisha kimoja kwanza.',
    wrongNetworkMsg: 'Pochi yako haijaunganishwa na mtandao wa Polygon.',
    switchNetwork: 'Badilisha kwenda Polygon',
    connecting: 'Inaunganisha...',
    contractAddressLabel: 'Anwani ya Mkataba wa Tokeni',
    copyAddress: 'Nakili Anwani',
    copied: 'Imenakiliwa!',
    guidesTitle: 'Miongozo Kamili ya Elimu',
    guidesSub: 'Hatua tatu rahisi, kutoka usakinishaji wa pochi hadi kuona tokeni yako mpya',
    step1Title: 'Usakinishaji wa Pochi',
    step1Desc: 'Sakinisha MetaMask au Trust Wallet kwenye kivinjari chako au simu, kisha unda pochi mpya. Hakikisha unahifadhi Seed Phrase yako mahali salama na nje ya mtandao.',
    step2Title: 'Kuunganisha na Polygon',
    step2Desc: 'Unganisha pochi yako na Polygon Mainnet, na hakikisha una kiasi kidogo cha MATIC au POL kulipia gharama za mtandao (Gas Fee).',
    step3Title: 'Kuingiza Tokeni Yako Pochini',
    step3Desc: 'Baada ya kuunda, nakili Anwani ya Mkataba (Contract Address) na tumia "Import Tokens" kwenye pochi yako ili kuona na kusimamia tokeni yako mpya.',
    exchangesTitle: 'Masoko ya Kubadilishana Yanayoaminika na Bila Malipo',
    exchangesSub: 'Fanya biashara ya tokeni yako mpya kwenye masoko yaliyokolezwa au yasiyokolezwa hapa chini.',
    dexTitle: 'Masoko Yasiyokolezwa (DEX)',
    dexTag: 'Bure, hakuna usajili',
    dexDesc: 'Uniswap, SushiSwap, na QuickSwap huruhusu biashara moja kwa moja kutoka pochini mwako, bila kuhitaji usajili au uthibitisho wa utambulisho.',
    cexTitle: 'Masoko Yaliyokolezwa (CEX)',
    cexTag: 'Yanahitaji uthibitisho wa utambulisho (KYC)',
    cexDesc: 'Binance, KuCoin, na Bybit ni masoko maarufu yanayohitaji usajili wa akaunti na uthibitisho wa utambulisho kabla ya biashara.',
    warningsTitle: 'Maonyo Muhimu ya Usalama',
    w1t: 'Usifichue funguo yako binafsi',
    w1: 'Usimshirikishe mtu yeyote Seed Phrase au funguo yako binafsi katika hali yoyote ile.',
    w2t: 'Kagua kila muamala kwa makini',
    w2: 'Hakikisha kuangalia Anwani ya Mkataba na gharama za mtandao kabla ya kuthibitisha muamala wowote.',
    w3t: 'Chukua hatari za soko kwa uzito',
    w3: 'Masoko ya sarafu za kidijitali yana hatari kubwa; fanya utafiti wako mwenyewe (DYOR) kabla ya kuwekeza.',
    contactTitle: 'Wasiliana Nasi na Msaada',
    contactDesc: 'Kwa maswali ya kiufundi, maoni, au kuwasiliana moja kwa moja na timu yetu:',
    emailLabel: 'Barua pepe ya Msaada',
    footer: 'Haki zote zimehifadhiwa © 2026 | Kiwanda cha Tokeni cha Polygon',
  },
};

export default function App() {
  const [langCode, setLangCode] = useState('fa');
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletError, setWalletError] = useState('');
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);

  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenSupply, setTokenSupply] = useState('1000000');
  const [tokenLogo, setTokenLogo] = useState(null);
  const [isMinting, setIsMinting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [addressCopied, setAddressCopied] = useState(false);

  // Load fonts covering Latin, Arabic-script, Devanagari and CJK glyphs
  useEffect(() => {
    const id = 'ptf-font-link';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800;900&family=Noto+Sans+Devanagari:wght@400;600;700&family=Noto+Sans+SC:wght@400;600;700&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  // Close language menu on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setLangMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // React to account / network changes made from inside the wallet extension itself
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (!accounts || accounts.length === 0) {
        setWalletConnected(false);
        setWalletAddress('');
      } else {
        setWalletAddress(accounts[0]);
        setWalletConnected(true);
      }
    };

    const handleChainChanged = (chainId) => {
      setIsWrongNetwork(chainId !== POLYGON_CHAIN_ID);
    };

    window.ethereum.on?.('accountsChanged', handleAccountsChanged);
    window.ethereum.on?.('chainChanged', handleChainChanged);

    // Pick up an already-connected session (e.g. page was reloaded)
    window.ethereum
      .request({ method: 'eth_accounts' })
      .then((accounts) => {
        if (accounts && accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setWalletConnected(true);
          return window.ethereum.request({ method: 'eth_chainId' });
        }
        return null;
      })
      .then((chainId) => {
        if (chainId) setIsWrongNetwork(chainId !== POLYGON_CHAIN_ID);
      })
      .catch(() => {});

    return () => {
      window.ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener?.('chainChanged', handleChainChanged);
    };
  }, []);

  const current = LANGS.find((l) => l.code === langCode);
  const t = DICT[langCode];
  const isRtl = current.rtl;

  const handleConnect = async () => {
    setWalletError('');

    // Disconnect: the wallet extension itself has no programmatic "disconnect" in
    // EIP-1193, so we simply clear local state. The user stays logged in on the
    // extension side and can reconnect instantly.
    if (walletConnected) {
      setWalletConnected(false);
      setWalletAddress('');
      setIsWrongNetwork(false);
      return;
    }

    if (typeof window === 'undefined' || !window.ethereum) {
      setWalletError(t.noWalletMsg);
      return;
    }

    try {
      setIsConnecting(true);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      setWalletAddress(accounts[0]);
      setWalletConnected(true);
      setIsWrongNetwork(chainId !== POLYGON_CHAIN_ID);
    } catch (err) {
      setWalletError(err?.message || 'Connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSwitchNetwork = async () => {
    if (!window.ethereum) return;
    setWalletError('');
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: POLYGON_CHAIN_ID }],
      });
      setIsWrongNetwork(false);
    } catch (switchError) {
      // 4902 = chain not added to the wallet yet
      if (switchError?.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [POLYGON_NETWORK_PARAMS],
          });
          setIsWrongNetwork(false);
        } catch (addError) {
          setWalletError(addError?.message || 'Failed to add network');
        }
      } else {
        setWalletError(switchError?.message || 'Failed to switch network');
      }
    }
  };

  const handleMint = async (e) => {
    e.preventDefault();
    if (!walletConnected) {
      alert(t.connectFirst);
      return;
    }
    if (isWrongNetwork) {
      setWalletError(t.wrongNetworkMsg);
      return;
    }

    setIsMinting(true);
    setSuccessMsg('');
    setContractAddress('');
    setAddressCopied(false);
    setWalletError('');

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const factory = new Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);

      const tx = await factory.createToken(tokenName, tokenSymbol, tokenSupply);
      const receipt = await tx.wait();

      const parsedEvent = receipt.logs
        .map((log) => {
          try {
            return factory.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((parsed) => parsed?.name === 'TokenCreated');

      const newTokenAddress = parsedEvent?.args?.tokenAddress;

      if (!newTokenAddress) {
        throw new Error('Token address not found in transaction receipt');
      }

      setSuccessMsg(t.successMessage);
      setContractAddress(newTokenAddress);
    } catch (err) {
      setWalletError(err?.shortMessage || err?.reason || err?.message || 'Transaction failed');
    } finally {
      setIsMinting(false);
    }
  };

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(contractAddress);
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — fail silently, address is still selectable/visible
    }
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen bg-white text-slate-800"
      style={{ fontFamily: "'Vazirmatn', 'Noto Sans Devanagari', 'Noto Sans SC', system-ui, sans-serif" }}
    >
      {/* Top Header */}
      <header className="border-b border-slate-100 bg-white/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 via-purple-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-purple-200 shrink-0">
              <Coins size={22} strokeWidth={2.2} />
            </div>
            <span className="font-extrabold text-lg md:text-xl text-slate-900 tracking-tight truncate">{t.brand}</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Language dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setLangMenuOpen((o) => !o)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition-all"
              >
                <Globe size={16} />
                <span className="hidden sm:inline">{current.label}</span>
              </button>
              {langMenuOpen && (
                <div
                  className={`absolute top-full mt-2 ${isRtl ? 'left-0' : 'right-0'} w-48 max-h-80 overflow-y-auto bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 z-50`}
                >
                  {LANGS.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLangCode(l.code);
                        setLangMenuOpen(false);
                      }}
                      dir={l.rtl ? 'rtl' : 'ltr'}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        l.code === langCode ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{l.label}</span>
                      {l.code === langCode && <Check size={15} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className={`flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm disabled:opacity-60 ${
                walletConnected
                  ? 'bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700'
                  : 'bg-purple-600 text-white shadow-purple-200 hover:bg-purple-700'
              }`}
            >
              {isConnecting ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} />}
              <span className="hidden sm:inline">
                {isConnecting ? t.connecting : walletConnected ? shortAddr(walletAddress) : t.connectWalletDefault}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Wallet status banners */}
      {walletError && (
        <div className="max-w-3xl mx-auto mt-6 px-6">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium">
            <ShieldAlert size={18} className="shrink-0 mt-0.5" />
            <span>{walletError}</span>
          </div>
        </div>
      )}
      {walletConnected && isWrongNetwork && (
        <div className="max-w-3xl mx-auto mt-6 px-6">
          <div className="flex items-center justify-between gap-3 flex-wrap p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-sm font-medium">
            <span className="flex items-center gap-2">
              <Network size={18} className="shrink-0" />
              {t.wrongNetworkMsg}
            </span>
            <button
              onClick={handleSwitchNetwork}
              className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 transition-all shrink-0"
            >
              {t.switchNetwork}
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="py-16 md:py-20 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 text-slate-700 font-semibold text-sm mb-7 border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          {t.heroTag}
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-5 max-w-3xl mx-auto leading-tight">
          {t.brand}
        </h1>
        <div className="w-28 h-1.5 rounded-full mx-auto mb-6 bg-gradient-to-r from-purple-600 via-emerald-500 to-rose-600"></div>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto font-medium">
          {t.subtitle}
        </p>
      </section>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 pb-20 space-y-16">

        {/* Token Factory Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-100 p-8 md:p-12 max-w-4xl mx-auto relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-purple-600 via-emerald-500 to-rose-600"></div>
          <div className="absolute top-10 right-0 w-40 h-40 bg-purple-50 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-50 rounded-full blur-3xl -z-10"></div>

          <div className="mb-8 border-b border-slate-100 pb-5">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">{t.previewTitle}</h2>
            <p className="text-slate-500 text-sm md:text-base">{t.previewSub}</p>
          </div>

          {successMsg && (
            <div className="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-center flex items-center justify-center gap-2">
              <CheckCircle2 size={20} />
              {successMsg}
            </div>
          )}

          {contractAddress && (
            <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs font-bold text-slate-500 mb-2">{t.contractAddressLabel}</div>
              <div className="flex items-center gap-2 flex-wrap">
                <code
                  dir="ltr"
                  className="flex-1 min-w-0 text-sm font-mono text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 truncate"
                  title={contractAddress}
                >
                  {contractAddress}
                </code>
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all shrink-0 ${
                    addressCopied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {addressCopied ? <Check size={16} /> : <Copy size={16} />}
                  {addressCopied ? t.copied : t.copyAddress}
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleMint} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">{t.tokenNameLabel}</label>
              <input
                type="text"
                placeholder="My Token"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all bg-slate-50/60"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">{t.tokenSymbolLabel}</label>
              <input
                type="text"
                placeholder="MTK"
                value={tokenSymbol}
                onChange={(e) => setTokenSymbol(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all bg-slate-50/60"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">{t.totalSupplyLabel}</label>
              <input
                type="number"
                value={tokenSupply}
                onChange={(e) => setTokenSupply(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all bg-slate-50/60"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">{t.logoLabel}</label>
              <label className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 cursor-pointer hover:border-purple-400 transition-all">
                <UploadCloud size={18} className="text-purple-600 shrink-0" />
                <span className="text-sm text-slate-500 truncate">{tokenLogo ? tokenLogo.name : t.logoHint}</span>
                <input
                  type="file"
                  onChange={(e) => setTokenLogo(e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>

            <div className="md:col-span-2 pt-4">
              <button
                type="submit"
                disabled={isMinting}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold text-lg shadow-lg shadow-purple-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isMinting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    {t.minting}
                  </>
                ) : (
                  t.mintButton
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Educational Guides Section */}
        <div className="space-y-10">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">{t.guidesTitle}</h2>
            <p className="text-slate-500">{t.guidesSub}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6">
                <KeyRound size={22} />
              </div>
              <div className="text-xs font-bold text-purple-600 mb-2">01</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{t.step1Title}</h3>
              <p className="text-slate-600 leading-relaxed text-sm">{t.step1Desc}</p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
                <Network size={22} />
              </div>
              <div className="text-xs font-bold text-emerald-600 mb-2">02</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{t.step2Title}</h3>
              <p className="text-slate-600 leading-relaxed text-sm">{t.step2Desc}</p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-6">
                <Download size={22} />
              </div>
              <div className="text-xs font-bold text-rose-600 mb-2">03</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{t.step3Title}</h3>
              <p className="text-slate-600 leading-relaxed text-sm">{t.step3Desc}</p>
            </div>
          </div>
        </div>

        {/* Exchanges Guide Section */}
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 md:p-12">
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">{t.exchangesTitle}</h2>
            <p className="text-slate-500 text-sm md:text-base">{t.exchangesSub}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <ArrowLeftRight size={18} />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900">{t.dexTitle}</h3>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 whitespace-nowrap">{t.dexTag}</span>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">{t.dexDesc}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {['Uniswap', 'SushiSwap', 'QuickSwap'].map((name) => (
                  <span key={name} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">{name}</span>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <ArrowLeftRight size={18} />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900">{t.cexTitle}</h3>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 whitespace-nowrap">{t.cexTag}</span>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">{t.cexDesc}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {['Binance', 'KuCoin', 'Bybit'].map((name) => (
                  <span key={name} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">{name}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Security Warnings Section */}
        <div className="bg-rose-50/60 border border-rose-200 rounded-3xl p-8 md:p-10">
          <div className="flex items-center gap-3 mb-7">
            <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0">
              <ShieldAlert size={22} />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-rose-900">{t.warningsTitle}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              [t.w1t, t.w1],
              [t.w2t, t.w2],
              [t.w3t, t.w3],
            ].map(([title, desc], i) => (
              <div key={i} className="bg-white rounded-2xl border border-rose-100 p-5">
                <h3 className="font-bold text-rose-900 mb-2 text-sm md:text-base">{title}</h3>
                <p className="text-rose-800/90 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Us Section */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 text-center max-w-3xl mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-5">
            <Mail size={22} />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">{t.contactTitle}</h2>
          <p className="text-slate-600 text-sm md:text-base mb-6">{t.contactDesc}</p>
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-50 to-emerald-50 border border-purple-100 text-purple-700 font-bold text-base flex-wrap justify-center">
            <span>{t.emailLabel}:</span>
            <a href="mailto:ammm37474@gmail.com" className="underline hover:text-purple-800" dir="ltr">ammm37474@gmail.com</a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-500 bg-white">
        <p>{t.footer}</p>
      </footer>
    </div>
  );
}
