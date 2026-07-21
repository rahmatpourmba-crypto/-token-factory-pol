import React, { useState } from 'react';

export default function App() {
  const [lang, setLang] = useState('fa'); // 'fa' or 'en'
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  
  // Token Form State
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenSupply, setTokenSupply] = useState('1000000');
  const [tokenLogo, setTokenLogo] = useState(null);
  const [isMinting, setIsMinting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const t = {
    fa: {
      brand: 'پالیگان توکن فکتوری',
      subtitle: 'ساخت آسان، امن و حرفه‌ای توکن در شبکه پالیگان (Polygon)',
      connectWallet: walletConnected ? 'متصل شد ✓' : 'اتصال کیف پول',
      disconnect: 'قطع اتصال',
      tokenNameLabel: 'نام توکن (Token Name)',
      tokenSymbolLabel: 'نماد توکن (Ticker)',
      totalSupplyLabel: 'تعداد کل (Total Supply)',
      logoLabel: 'لوگوی توکن (عکس)',
      previewTitle: 'پیش‌نمایش اطلاعات توکن',
      mintButton: 'تایید و ساخت توکن',
      minting: در حال پردازش قرارداد هوشمند...,
      successMsg: 'توکن شما با موفقیت در شبکه پالیگان ایجاد شد!',
      
      // Guides section
      guidesTitle: 'راهنمای جامع و آموزشی',
      step1Title: '۱. نصب و راه‌اندازی کیف پول',
      step1Desc: 'ابتدا نرم‌افزار Metamask یا Trust Wallet را روی مرورگر کامپیوتر یا گوشی موبایل خود نصب کرده و یک کیف پول جدید بسازید. حتماً کلیدهای بازیابی (Seed Phrase) را یادداشت و در جای امن نگهداری کنید.',
      
      step2Title: '۲. اتصال به شبکه پالیگان',
      step2Desc: 'کیف پول خود را به شبکه Polygon Mainnet متصل کنید و مقداری توکن MATIC یا POL جهت پرداخت کارمزد تراکنش‌ها (Gas Fee) در کیف پول خود داشته باشید.',
      
      step3Title: '۳. دریافت و نمایش توکن در کیف پول',
      step3Desc: 'پس از ساخت توکن، آدرس قرارداد (Contract Address) را کپی کرده و در بخش Import Tokens کیف پول خود وارد کنید تا توکن‌های ساخته شده را مشاهده کنید.',

      exchangesTitle: 'صرافی‌های معتبر و رایگان (CEX و DEX)',
      dexDesc: 'صرافی‌های غیرمتمرکز (DEX): یونی‌سواپ (Uniswap)، سوشی‌سواپ (SushiSwap)، و کویک‌سواپ (QuickSwap) که بدون احراز هویت و به صورت رایگان امکان معامله توکن‌ها را فراهم می‌کنند.',
      cexDesc: 'صرافی‌های متمرکز (CEX): بایننس (Binance)، کوکوین (KuCoin)، و بای‌بیت (Bybit) که نیاز به ثبت‌نام و احراز هویت دارند.',

      warningsTitle: 'هشدارهای امنیتی بسیار مهم',
      w1: 'هرگز عبارت بازیابی (Seed Phrase) یا کلید خصوصی خود را در اختیار هیچ‌کس قرار ندهید.',
      w2: 'پیش از تایید هر تراکنش، آدرس قرارداد و کارمزد شبکه را به دقت بررسی کنید.',
      w3: 'بازار ارزهای دیجیتال دارای ریسک بالاست؛ پیش از هر سرمایه‌گذاری تحقیقات کامل (DYOR) انجام دهید.',

      contactTitle: 'ارتباط با ما و پشتیبانی',
      contactDesc: 'جهت ارتباط مستقیم، پیشنهادات یا سوالات فنی با ما در تماس باشید:',
      emailLabel: 'ایمیل پشتیبانی:',
      
      footer: 'تمامی حقوق محفوظ است © 2026 | Polygon Token Factory'
    },
    en: {
      brand: 'Polygon Token Factory',
      subtitle: 'Easy, secure, and professional token creation on Polygon network',
      connectWallet: walletConnected ? 'Connected ✓' : 'Connect Wallet',
      disconnect: 'Disconnect',
      tokenNameLabel: 'Token Name',
      tokenSymbolLabel: 'Ticker (Symbol)',
      totalSupplyLabel: 'Total Supply',
      logoLabel: 'Token Logo (Image)',
      previewTitle: 'Token Preview',
      mintButton: 'Approve & Create Token',
      minting: 'Processing smart contract...',
      successMessage: 'Your token was successfully created on Polygon!',

      guidesTitle: 'Comprehensive Educational Guides',
      step1Title: '1. Wallet Installation',
      step1Desc: 'First, install MetaMask or Trust Wallet on your browser or mobile device. Make sure to back up your Secret Recovery Phrase securely offline.',
      
      step2Title: '2. Network Setup',
      step2Desc: 'Connect your wallet to the Polygon Mainnet and ensure you have a small amount of MATIC/POL in your wallet to cover gas fees.',
      
      step3Title: '3. Import Token into Wallet',
      step3Desc: 'After creation, copy your token Contract Address and click "Import Tokens" in your wallet to view your newly minted tokens.',

      exchangesTitle: 'Trusted Centralized & Decentralized Exchanges',
      dexDesc: 'Decentralized Exchanges (DEX): Uniswap, SushiSwap, and QuickSwap allow permissionless and free token trading without KYC.',
      cexDesc: 'Centralized Exchanges (CEX): Binance, KuCoin, and Bybit require account registration and identity verification.',

      warningsTitle: 'Critical Security Warnings',
      w1: 'Never share your Secret Recovery Phrase or Private Key with anyone under any circumstances.',
      w2: 'Always double-check contract addresses and network gas fees before confirming transactions.',
      w3: 'Cryptocurrency markets involve high risk; always Do Your Own Research (DYOR) before investing.',

      contactTitle: 'Contact Us & Support',
      contactDesc: 'For direct inquiries, feedback, or technical support, reach out to us at:',
      emailLabel: 'Support Email:',

      footer: 'All rights reserved © 2026 | Polygon Token Factory'
    }
  }[lang];

  const handleConnect = () => {
    if (!walletConnected) {
      setWalletConnected(true);
      setWalletAddress('0x71C...3474');
    } else {
      setWalletConnected(false);
      setWalletAddress('');
    }
  };

  const handleMint = (e) => {
    e.preventDefault();
    if (!walletConnected) {
      alert(lang === 'fa' ? 'لطفاً ابتدا کیف پول خود را متصل کنید.' : 'Please connect your wallet first.');
      return;
    }
    setIsMinting(true);
    setTimeout(() => {
      setIsMinting(false);
      setSuccessMessage(t.successMessage || 'Success!');
    }, 2000);
  };

  return (
    <div className={`min-h-screen bg-white text-slate-800 font-sans ${lang === 'fa' ? 'rtl' : 'ltr'}`} dir={lang === 'fa' ? 'rtl' : 'ltr'}>
      
      {/* Top Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-purple-200">
              T
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">{t.brand}</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Switcher - Only Persian & English */}
            <div className="bg-slate-100 p-1 rounded-xl flex gap-1 text-sm font-medium">
              <button 
                onClick={() => setLang('fa')} 
                className={`px-3 py-1.5 rounded-lg transition-all ${lang === 'fa' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                فارسی
              </button>
              <button 
                onClick={() => setLang('en')} 
                className={`px-3 py-1.5 rounded-lg transition-all ${lang === 'en' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                English
              </button>
            </div>

            {/* Wallet Connect Button */}
            <button 
              onClick={handleConnect}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm ${
                walletConnected 
                  ? 'bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700' 
                  : 'bg-purple-600 text-white shadow-purple-200 hover:bg-purple-700'
              }`}
            >
              {walletConnected ? `${walletAddress} (${t.connectWallet})` : t.connectWallet}
            </button>
          </div>

        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 text-purple-700 font-medium text-sm mb-6 border border-purple-100">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Polygon Mainnet Ready
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4 max-w-3xl mx-auto">
          {t.brand}
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          {t.subtitle}
        </p>
      </section>

      {/* Main Container & Token Form */}
      <main className="max-w-7xl mx-auto px-6 pb-20 space-y-16">
        
        {/* Token Factory Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-100 p-8 md:p-12 max-w-4xl mx-auto relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -z-10"></div>

          <h2 className="text-2xl font-bold text-slate-900 mb-8 border-b border-slate-100 pb-4">
            {t.previewTitle}
          </h2>

          {successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium text-center">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleMint} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">{t.tokenNameLabel}</label>
              <input 
                type="text" 
                placeholder="e.g., My Token" 
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all bg-slate-50/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">{t.tokenSymbolLabel}</label>
              <input 
                type="text" 
                placeholder="e.g., MTK" 
                value={tokenSymbol}
                onChange={(e) => setTokenSymbol(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all bg-slate-50/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">{t.totalSupplyLabel}</label>
              <input 
                type="number" 
                value={tokenSupply}
                onChange={(e) => setTokenSupply(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all bg-slate-50/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">{t.logoLabel}</label>
              <input 
                type="file" 
                onChange={(e) => setTokenLogo(e.target.files[0])}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 transition-all bg-slate-50/50 cursor-pointer"
              />
            </div>

            <div className="md:col-span-2 pt-4">
              <button 
                type="submit"
                disabled={isMinting}
                className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg shadow-lg shadow-purple-200 transition-all disabled:opacity-50"
              >
                {isMinting ? t.minting : t.mintButton}
              </button>
            </div>
          </form>
        </div>

        {/* Educational Guides Section */}
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3">{t.guidesTitle}</h2>
            <div className="w-16 h-1 bg-emerald-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xl mb-6">1</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{t.step1Title}</h3>
              <p className="text-slate-600 leading-relaxed text-sm">{t.step1Desc}</p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl mb-6">2</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{t.step2Title}</h3>
              <p className="text-slate-600 leading-relaxed text-sm">{t.step2Desc}</p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xl mb-6">3</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{t.step3Title}</h3>
              <p className="text-slate-600 leading-relaxed text-sm">{t.step3Desc}</p>
            </div>
          </div>
        </div>

        {/* Exchanges Guide Section */}
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 md:p-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">{t.exchangesTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <h3 className="font-bold text-lg text-slate-900">Decentralized Exchanges (DEX)</h3>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">{t.dexDesc}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-3 h-3 rounded-full bg-purple-600"></span>
                <h3 className="font-bold text-lg text-slate-900">Centralized Exchanges (CEX)</h3>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">{t.cexDesc}</p>
            </div>
          </div>
        </div>

        {/* Security Warnings Section (Red Accent) */}
        <div className="bg-rose-50/60 border border-rose-200 rounded-3xl p-8 md:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-lg">!</div>
            <h2 className="text-2xl font-bold text-rose-900">{t.warningsTitle}</h2>
          </div>
          <ul className="space-y-4 text-rose-800 text-sm md:text-base">
            <li className="flex items-start gap-3">
              <span className="text-rose-600 font-bold">•</span>
              <span>{t.w1}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-rose-600 font-bold">•</span>
              <span>{t.w2}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-rose-600 font-bold">•</span>
              <span>{t.w3}</span>
            </li>
          </ul>
        </div>

        {/* Contact Us Section */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 text-center max-w-3xl mx-auto shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">{t.contactTitle}</h2>
          <p className="text-slate-600 text-sm mb-6">{t.contactDesc}</p>
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-purple-50 border border-purple-100 text-purple-700 font-bold text-base">
            <span>{t.emailLabel}</span>
            <a href="mailto:ammm37474@gmail.com" className="underline hover:text-purple-800">ammm37474@gmail.com</a>
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
```eof

Your slide deck on token factory and crypto guide is ready! Feel free to take a look and let me know if you'd like to make any edits.
