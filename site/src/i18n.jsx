import { createContext, useContext, useState } from "react";

export const LANGS = {
  fa: {
    dir: "rtl",
    code: "fa",
    label: "فارسی",
    strings: {
      brand: "ضرابخانه",
      brandSub: "ساخت توکن روی Polygon",
      heroEyebrow: "بدون کدنویسی، بدون واسطه",
      heroTitle: "توکن خودت رو ضرب کن.",
      heroTitleAccent: "مستقیم به کیف پولت.",
      heroBody:
        "نام، نماد و عرضه رو تعیین کن، کمیسیون رو با MATIC یا تتر بپرداز، و توکن ERC-20 واقعی روی شبکه Polygon مستقیم توی کیف پولت می‌شینه.",
      connectWallet: "اتصال کیف پول",
      connected: "متصل",
      formTitle: "مشخصات توکن",
      nameLabel: "نام توکن",
      namePlaceholder: "مثلا: Sun Coin",
      symbolLabel: "نماد",
      symbolPlaceholder: "مثلا: SUN",
      supplyLabel: "عرضه کل",
      supplyPlaceholder: "مثلا: 1000000",
      paymentLabel: "پرداخت کمیسیون با",
      payMatic: "MATIC",
      payUsdt: "USDT (تتر)",
      feeLabel: "کمیسیون سایت",
      gasLabel: "هزینه شبکه (گس)",
      totalLabel: "مجموع تقریبی",
      mintButton: "ضرب توکن",
      previewEyebrow: "پیش‌نمایش مهر",
      previewEmptyName: "نام توکن",
      previewEmptySymbol: "SYM",
      stepsTitle: "سه مرحله تا سکه‌ی تو",
      step1Title: "پرداخت",
      step1Body: "کمیسیون رو با یک تراکنش امن به کیف پولت وصل و پرداخت می‌کنی.",
      step2Title: "ضرب",
      step2Body: "قرارداد هوشمند همون لحظه قرارداد ERC-20 تو رو روی Polygon می‌سازه.",
      step3Title: "دریافت",
      step3Body: "توکن مستقیم و بدون واسطه توی همون کیف پول تو می‌شینه.",
      statusConnecting: "در حال اتصال به کیف پول...",
      statusApprove: "در حال تایید (approve) پرداخت تتر...",
      statusSendingMatic: "در حال ارسال تراکنش ضرب توکن (MATIC)...",
      statusSendingUsdt: "در حال ارسال تراکنش ضرب توکن (تتر)...",
      statusWaiting: "در انتظار تایید روی شبکه Polygon...",
      statusSuccess: "توکن با موفقیت ضرب شد و به کیف پولت رسید.",
      statusError: "خطا",
      resultAddressLabel: "آدرس قرارداد توکن جدید",
      errNoWallet: "کیف پول (MetaMask) پیدا نشد",
      errName: "نام توکن نامعتبر است (حداکثر ۵۰ کاراکتر)",
      errSymbol: "نماد توکن نامعتبر است (حداکثر ۱۱ کاراکتر)",
      errSupply: "تعداد عرضه باید بزرگتر از صفر باشد",
      footerNote: "این سایت هیچ کلید خصوصی‌ای ذخیره نمی‌کند؛ همه تراکنش‌ها را کیف پول خودتان امضا می‌کند.",
      navGuide: "راهنما",
      guideTitle: "راهنمای کامل: از نصب کیف پول تا دریافت توکن",
      guideIntro:
        "اگر تا حالا با کیف پول دیجیتال کار نکرده‌اید، نگران نباشید. این راهنما قدم‌به‌قدم همه‌چیز را از صفر توضیح می‌دهد.",
      guideWalletTitle: "۱. یک کیف پول نصب کنید",
      guideWalletBody:
        "برای ساخت توکن، اول به یک کیف پول دیجیتال نیاز دارید که از شبکه Polygon پشتیبانی کند. هر کدام از این سه گزینه مناسب است:",
      guideWalletMetamask: "MetaMask",
      guideWalletMetamaskBody: "افزونه مرورگر و اپ موبایل، پرکاربردترین کیف پول در دنیای Web3.",
      guideWalletTrust: "Trust Wallet",
      guideWalletTrustBody: "اپ موبایل ساده، از شبکه Polygon به‌طور کامل پشتیبانی می‌کند.",
      guideWalletPhantom: "Phantom",
      guideWalletPhantomBody: "در ابتدا مخصوص Solana بود، الان از Polygon هم پشتیبانی می‌کند.",
      guideWalletNote:
        "بعد از نصب، حتماً «عبارت بازیابی» (Seed Phrase) را در جایی امن و آفلاین یادداشت کنید. هرگز آن را با کسی به اشتراک نگذارید — هرکس آن را داشته باشد، صاحب کامل دارایی شماست.",
      guideNetworkTitle: "۲. شبکه Polygon را فعال کنید",
      guideNetworkBody:
        "در بیشتر کیف پول‌ها، Polygon از قبل در لیست شبکه‌ها موجود است. کافیست از داخل تنظیمات کیف پول، شبکه «Polygon» را انتخاب یا فعال کنید. اگر نبود، می‌توانید آن را دستی با اطلاعات زیر اضافه کنید:",
      guideFundTitle: "۳. مقداری MATIC یا USDT تهیه کنید",
      guideFundBody:
        "برای پرداخت کمیسیون سایت و هزینه شبکه، باید مقداری MATIC (یا اگر با تتر پرداخت می‌کنید، مقداری USDT همراه با کمی MATIC برای گس) در کیف پولتان داشته باشید. می‌توانید این‌ها را از یک صرافی معتبر (مثل Binance، Nobitas، Wallex) بخرید و به آدرس Polygon کیف پولتان انتقال دهید.",
      guideStepsTitle: "۴. مراحل ساخت توکن در سایت",
      guideStep1: "اتصال کیف پول",
      guideStep1Body: "روی دکمه «اتصال کیف پول» در بالای صفحه کلیک کنید و در پنجره‌ای که باز می‌شود تایید کنید.",
      guideStep2: "پر کردن مشخصات توکن",
      guideStep2Body: "نام، نماد (مثلا SUN) و تعداد کل عرضه توکن خود را وارد کنید.",
      guideStep3: "انتخاب روش پرداخت",
      guideStep3Body: "MATIC یا USDT را برای پرداخت کمیسیون انتخاب کنید.",
      guideStep4: "تایید تراکنش",
      guideStep4Body:
        "روی «ضرب توکن» کلیک کنید. کیف پولتان یک پنجره تایید تراکنش نشان می‌دهد؛ جزئیات را بررسی و تایید کنید. اگر با تتر پرداخت می‌کنید، ابتدا یک تراکنش «Approve» و سپس تراکنش اصلی را تایید می‌کنید (دو تایید پشت‌هم).",
      guideStep5: "دریافت توکن",
      guideStep5Body:
        "چند ثانیه تا چند دقیقه بعد، تراکنش روی شبکه تایید می‌شود و توکن جدید مستقیم در کیف پول شما قرار می‌گیرد.",
      guideViewTitle: "۵. چطور توکن جدیدم را در کیف پولم ببینم؟",
      guideViewBody:
        "بعضی وقت‌ها توکن‌های تازه‌ساخته‌شده به‌طور خودکار در کیف پول نمایش داده نمی‌شوند. آدرس قرارداد توکن (که بعد از ساخت به شما نمایش داده می‌شود) را کپی کنید و در کیف پولتان از گزینه «Import Token» یا «Add Custom Token» استفاده کنید تا موجودی‌اش دیده شود.",
      navListing: "لیست در صرافی",
      listingTitle: "چطور توکن را در صرافی‌ها لیست کنیم",
      listingIntro:
        "بعد از ساخت توکن، برای اینکه دیگران بتوانند آن را بخرند و بفروشند، باید در یک صرافی قابل معامله باشد. دو مسیر کاملاً متفاوت وجود دارد: صرافی غیرمتمرکز (سریع و بدون اجازه) و صرافی متمرکز (کند و نیازمند تایید).",
      dexTitle: "مسیر ۱: صرافی غیرمتمرکز (DEX) — سریع‌ترین راه",
      dexIntro:
        "صرافی‌های غیرمتمرکز مثل QuickSwap و Uniswap روی Polygon نیازی به تایید یا اجازه از کسی ندارند. خودتان می‌توانید همین امروز یک استخر نقدینگی (Liquidity Pool) بسازید و توکن‌تان قابل معامله شود.",
      dexStep1: "اتصال کیف پول به صرافی",
      dexStep1Body: "وارد سایت QuickSwap یا Uniswap شوید و کیف پول Polygon خود را وصل کنید.",
      dexStep2: "افزودن توکن سفارشی",
      dexStep2Body: "در بخش «Add Liquidity»، آدرس قرارداد توکن خودتان را وارد کنید تا صرافی آن را بشناسد.",
      dexStep3: "تعیین جفت‌ارز و مقدار",
      dexStep3Body:
        "توکن خودتان را با یک ارز شناخته‌شده (مثلاً USDT یا MATIC) جفت کنید و مقداری از هر دو را به‌عنوان نقدینگی اولیه واریز کنید. همین نسبت، قیمت اولیه توکن شما را تعیین می‌کند.",
      dexStep4: "تایید و ساخت استخر",
      dexStep4Body: "تراکنش را در کیف پولتان تایید کنید. از این لحظه، توکن شما در آن صرافی قابل خرید و فروش عمومی است.",
      dexNote:
        "نکته اعتماد: بسیاری از خریداران قبل از خرید بررسی می‌کنند که نقدینگی «قفل» (Locked) شده باشد یا نه — یعنی سازنده نتواند یک‌شبه نقدینگی را بردارد (که به آن «رگ‌پول» یا Rug Pull می‌گویند). سرویس‌هایی مثل Team Finance یا Unicrypt امکان قفل‌کردن نقدینگی برای مدت معین را می‌دهند و به اعتبار پروژه شما کمک زیادی می‌کند.",
      cexTitle: "مسیر ۲: صرافی متمرکز (CEX) — کندتر و رقابتی‌تر",
      cexIntro:
        "صرافی‌های متمرکز مثل Binance، KuCoin، Gate.io یا MEXC، برخلاف DEX، هر توکنی را بدون بررسی نمی‌پذیرند. لیست‌شدن در این صرافی‌ها یک فرآیند رسمی و رقابتی است.",
      cexReqTitle: "معمولاً چه چیزی می‌خواهند؟",
      cexReq1: "حجم معاملات و نقدینگی قابل‌توجه (که معمولاً ابتدا باید در DEX ثابت شود)",
      cexReq2: "آدیت امنیتی رسمی قرارداد توسط شرکت‌های شناخته‌شده",
      cexReq3: "هویت تیم و مستندات پروژه (whitepaper، وب‌سایت، شبکه‌های اجتماعی فعال)",
      cexReq4: "در بسیاری موارد، پرداخت هزینه لیست‌شدن (که می‌تواند از چند هزار تا چند صد هزار دلار باشد، بسته به اعتبار صرافی)",
      cexStepsTitle: "مراحل معمول درخواست",
      cexStep1: "فرم «Listing Application» رسمی صرافی مورد نظر را از وب‌سایت خودشان پیدا و پر کنید.",
      cexStep2: "مستندات پروژه (آدیت، وایت‌پیپر، اطلاعات تیم) را ضمیمه کنید.",
      cexStep3: "منتظر بررسی داخلی صرافی بمانید (از چند هفته تا چند ماه طول می‌کشد).",
      cexWarning:
        "⚠️ هشدار مهم: مراقب افراد یا «آژانس‌هایی» باشید که ادعا می‌کنند می‌توانند تضمین کنند توکن شما در Binance یا صرافی‌های بزرگ لیست شود، در ازای پرداخت مبلغی از قبل. این یکی از رایج‌ترین کلاهبرداری‌های این حوزه است. صرافی‌های معتبر، فرآیند درخواست رسمی و شفاف روی وب‌سایت خودشان دارند.",
      aggregatorTitle: "قدم اضافه (رایگان): ثبت در دایرکتوری‌های قیمت",
      aggregatorBody:
        "ثبت توکن در سایت‌هایی مثل CoinGecko و CoinMarketCap صرافی محسوب نمی‌شود، اما رایگان است و به دیده‌شدن و اعتبار پروژه شما کمک زیادی می‌کند — معمولاً اولین قدم توصیه‌شده بعد از ساخت استخر نقدینگی در DEX است.",
    },
  },
  en: {
    dir: "ltr",
    code: "en",
    label: "English",
    strings: {
      brand: "Mint",
      brandSub: "Token creation on Polygon",
      heroEyebrow: "No code. No middlemen.",
      heroTitle: "Strike your own token.",
      heroTitleAccent: "Straight to your wallet.",
      heroBody:
        "Set a name, symbol, and supply, pay the commission in MATIC or USDT, and a real ERC-20 token on Polygon lands directly in your wallet.",
      connectWallet: "Connect wallet",
      connected: "Connected",
      formTitle: "Token details",
      nameLabel: "Token name",
      namePlaceholder: "e.g. Sun Coin",
      symbolLabel: "Symbol",
      symbolPlaceholder: "e.g. SUN",
      supplyLabel: "Total supply",
      supplyPlaceholder: "e.g. 1000000",
      paymentLabel: "Pay commission with",
      payMatic: "MATIC",
      payUsdt: "USDT",
      feeLabel: "Site commission",
      gasLabel: "Network fee (gas)",
      totalLabel: "Estimated total",
      mintButton: "Mint token",
      previewEyebrow: "Seal preview",
      previewEmptyName: "Token name",
      previewEmptySymbol: "SYM",
      stepsTitle: "Three steps to your coin",
      step1Title: "Pay",
      step1Body: "Connect your wallet and pay the commission in a single secure transaction.",
      step2Title: "Mint",
      step2Body: "The smart contract deploys your ERC-20 contract on Polygon instantly.",
      step3Title: "Receive",
      step3Body: "The token lands directly in your own wallet — no middleman.",
      statusConnecting: "Connecting to wallet...",
      statusApprove: "Approving USDT payment...",
      statusSendingMatic: "Sending mint transaction (MATIC)...",
      statusSendingUsdt: "Sending mint transaction (USDT)...",
      statusWaiting: "Waiting for confirmation on Polygon...",
      statusSuccess: "Token minted successfully and sent to your wallet.",
      statusError: "Error",
      resultAddressLabel: "New token contract address",
      errNoWallet: "No wallet (MetaMask) found",
      errName: "Invalid token name (max 50 characters)",
      errSymbol: "Invalid symbol (max 11 characters)",
      errSupply: "Supply must be greater than zero",
      footerNote: "This site never stores private keys; every transaction is signed by your own wallet.",
      navGuide: "Guide",
      guideTitle: "Full guide: from installing a wallet to receiving your token",
      guideIntro:
        "New to crypto wallets? No problem — this guide walks through everything from scratch, step by step.",
      guideWalletTitle: "1. Install a wallet",
      guideWalletBody:
        "To mint a token you first need a wallet that supports the Polygon network. Any of these three work well:",
      guideWalletMetamask: "MetaMask",
      guideWalletMetamaskBody: "Browser extension and mobile app, the most widely used Web3 wallet.",
      guideWalletTrust: "Trust Wallet",
      guideWalletTrustBody: "Simple mobile app with full Polygon network support.",
      guideWalletPhantom: "Phantom",
      guideWalletPhantomBody: "Originally Solana-only, now also supports Polygon.",
      guideWalletNote:
        "After installing, write down your Seed Phrase somewhere safe and offline. Never share it with anyone — whoever has it fully controls your funds.",
      guideNetworkTitle: "2. Enable the Polygon network",
      guideNetworkBody:
        "Most wallets already list Polygon by default — just select or enable it in your wallet's network settings. If it's missing, you can add it manually with the details below:",
      guideFundTitle: "3. Get some MATIC or USDT",
      guideFundBody:
        "To pay the site commission and network fee, you'll need some MATIC in your wallet (or USDT plus a little MATIC for gas, if paying with USDT). Buy these on a reputable exchange (e.g. Binance) and send them to your wallet's Polygon address.",
      guideStepsTitle: "4. Steps to mint a token on the site",
      guideStep1: "Connect your wallet",
      guideStep1Body: "Click \"Connect wallet\" at the top of the page and approve the connection popup.",
      guideStep2: "Fill in token details",
      guideStep2Body: "Enter your token's name, symbol (e.g. SUN), and total supply.",
      guideStep3: "Choose a payment method",
      guideStep3Body: "Pick MATIC or USDT to pay the commission.",
      guideStep4: "Confirm the transaction",
      guideStep4Body:
        "Click \"Mint token.\" Your wallet will show a confirmation popup — review and approve it. If paying with USDT, you'll confirm an \"Approve\" transaction first, then the main transaction.",
      guideStep5: "Receive your token",
      guideStep5Body:
        "Within seconds to a few minutes, the transaction confirms on-chain and your new token lands directly in your wallet.",
      guideViewTitle: "5. How do I see my new token in my wallet?",
      guideViewBody:
        "Newly created tokens sometimes don't show up automatically. Copy the token's contract address (shown after minting) and use \"Import Token\" or \"Add Custom Token\" in your wallet to make the balance visible.",
      navListing: "Get listed",
      listingTitle: "How to list your token on exchanges",
      listingIntro:
        "Once your token is minted, it needs to be tradable somewhere for others to buy and sell it. There are two very different paths: decentralized exchanges (fast, permissionless) and centralized exchanges (slower, requires approval).",
      dexTitle: "Path 1: Decentralized exchange (DEX) — the fastest route",
      dexIntro:
        "DEXs like QuickSwap and Uniswap on Polygon don't require anyone's approval. You can create a liquidity pool yourself today and make your token tradable immediately.",
      dexStep1: "Connect your wallet to the exchange",
      dexStep1Body: "Go to QuickSwap or Uniswap and connect your Polygon wallet.",
      dexStep2: "Add your custom token",
      dexStep2Body: "In \"Add Liquidity,\" paste your token's contract address so the exchange recognizes it.",
      dexStep3: "Set the pair and amounts",
      dexStep3Body:
        "Pair your token with a known asset (e.g. USDT or MATIC) and deposit an initial amount of both as liquidity. This ratio sets your token's starting price.",
      dexStep4: "Confirm and create the pool",
      dexStep4Body: "Approve the transaction in your wallet. From this moment, your token is publicly tradable on that exchange.",
      dexNote:
        "Trust tip: many buyers check whether liquidity is \"locked\" before buying — meaning the creator can't pull it out overnight (known as a \"rug pull\"). Services like Team Finance or Unicrypt let you lock liquidity for a set period, which builds real credibility for your project.",
      cexTitle: "Path 2: Centralized exchange (CEX) — slower and competitive",
      cexIntro:
        "Centralized exchanges like Binance, KuCoin, Gate.io, or MEXC don't accept every token, unlike a DEX. Getting listed there is a formal, competitive process.",
      cexReqTitle: "What they typically require",
      cexReq1: "Meaningful trading volume and liquidity (usually established on a DEX first)",
      cexReq2: "A formal security audit from a recognized firm",
      cexReq3: "Team identity and project documentation (whitepaper, website, active social channels)",
      cexReq4: "In many cases, a listing fee (ranging from a few thousand to hundreds of thousands of dollars, depending on the exchange's reputation)",
      cexStepsTitle: "Typical application steps",
      cexStep1: "Find and fill out the exchange's official \"Listing Application\" form on their website.",
      cexStep2: "Attach project documentation (audit, whitepaper, team info).",
      cexStep3: "Wait for the exchange's internal review (can take weeks to months).",
      cexWarning:
        "⚠️ Important warning: watch out for anyone or any \"agency\" claiming they can guarantee your token gets listed on Binance or other major exchanges for an upfront fee. This is one of the most common scams in this space. Reputable exchanges have a transparent, official application process on their own website.",
      aggregatorTitle: "Extra step (free): list on price trackers",
      aggregatorBody:
        "Listing your token on sites like CoinGecko and CoinMarketCap isn't an exchange, but it's free and adds real visibility and credibility to your project — usually the recommended first step right after creating a DEX liquidity pool.",
    },
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("fa");
  const value = {
    lang,
    setLang,
    dir: LANGS[lang].dir,
    t: LANGS[lang].strings,
    other: lang === "fa" ? "en" : "fa",
  };
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
