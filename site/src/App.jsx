import React, { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

function TokenFactoryLogo() {
  return (
    <div className="flex items-center gap-3">
      <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_10px_rgba(192,132,252,0.5)]">
        <defs>
          <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="42" stroke="url(#logo-grad)" strokeWidth="8" strokeDasharray="14 7" strokeLinecap="round" />
        <circle cx="50" cy="50" r="26" fill="#030712" stroke="url(#logo-grad)" strokeWidth="4" />
        <path d="M38 38H62M50 38V64" stroke="url(#logo-grad)" strokeWidth="6" strokeLinecap="round" />
      </svg>
      <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent">
        TOKEN FACTORY
      </span>
    </div>
  );
}

const translations = {
  fa: {
    guideTitle: "راهنمای سریع اتصال و ساخت توکن",
    step1Title: "۱. نصب کیف پول",
    step1Desc: "کیف پول متامسک یا تراست‌ولت (Trust Wallet) را روی مرورگر یا گوشی خود نصب کنید.",
    step2Title: "۲. اتصال به شبکه",
    step2Desc: "روی دکمه اتصال کلیک کرده و شبکه را روی Polygon Mainnet تنظیم کنید.",
    step3Title: "۳. ساخت توکن",
    step3Desc: "نام، نماد، تعداد و لوگو را وارد کرده و توکن خود را بسازید.",
    tokenName: "نام توکن",
    tokenSymbol: "نماد (Ticker)",
    tokenSupply: "تعداد کل (Supply)",
    tokenLogo: "لوگوی توکن (عکس)",
    previewTitle: "پیش‌نمایش اطلاعات توکن",
    submitBtn: "تایید و ساخت توکن",
    uploading: "در حال آپلود و پرداخت...",
  },
  en: {
    guideTitle: "Quick Guide: Wallet & Token Creation",
    step1Title: "1. Install Wallet",
    step1Desc: "Install MetaMask or Trust Wallet on your browser or mobile device.",
    step2Title: "2. Connect Network",
    step2Desc: "Click the connect button and ensure your network is set to Polygon Mainnet.",
    step3Title: "3. Create Token",
    step3Desc: "Enter name, symbol, supply, and logo, then mint your token instantly.",
    tokenName: "Token Name",
    tokenSymbol: "Ticker Symbol",
    tokenSupply: "Total Supply",
    tokenLogo: "Token Logo (Image)",
    previewTitle: "Token Preview",
    submitBtn: "Approve & Create Token",
    uploading: "Uploading & Processing...",
  }
};

export default function App() {
  const [lang, setLang] = useState('fa'); 
  const t = translations[lang] || translations.en;
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenSupply, setTokenSupply] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleCreateToken = async (e) => {
    e.preventDefault();
    try {
      setUploading(true);
      alert("توکن با موفقیت آماده شد!");
    } catch (error) {
      console.error(error);
      alert("خطایی رخ داد.");
    } finally {
      setUploading(false);
    }
  };

  const isRtl = lang === 'fa';

  return (
    <div className={min-h-screen bg-gray-950 text-white p-6 font-sans } dir={isRtl ? 'rtl' : 'ltr'}>
      <header className="flex flex-wrap justify-between items-center max-w-4xl mx-auto mb-8 pb-4 border-b border-gray-800 gap-4">
        <TokenFactoryLogo />
        <div className="flex items-center gap-4">
          <select 
            value={lang} 
            onChange={(e) => setLang(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="fa">فارسی</option>
            <option value="en">English</option>
          </select>
          <ConnectButton />
        </div>
      </header>
      <section className="max-w-xl mx-auto mb-8 bg-gradient-to-br from-purple-900/20 to-gray-900 border border-purple-500/30 p-6 rounded-2xl shadow-xl">
        <h3 className="text-base font-bold text-purple-300 mb-4 flex items-center gap-2">
          <span>💡</span> {t.guideTitle}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-300">
          <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-800">
            <span className="font-bold text-purple-400 block mb-1">{t.step1Title}</span>
            {t.step1Desc}
          </div>
          <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-800">
            <span className="font-bold text-purple-400 block mb-1">{t.step2Title}</span>
            {t.step2Desc}
          </div>
          <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-800">
            <span className="font-bold text-purple-400 block mb-1">{t.step3Title}</span>
            {t.step3Desc}
          </div>
        </div>
      </section>
      <main className="max-w-xl mx-auto bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl">
        <div className="mb-8 p-4 bg-gray-950 border border-purple-500/30 rounded-xl">
          <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3">
            {t.previewTitle}
          </h4>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden shrink-0">
              {preview ? (
                <img src={preview} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-gray-500">Logo</span>
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-lg font-bold truncate">
                {tokenName || "Token Name"} <span className="text-sm font-normal text-gray-400">({tokenSymbol || "SYM"})</span>
              </div>
              <div className="text-sm text-gray-400">
                Supply: <span className="text-gray-200">{tokenSupply ? Number(tokenSupply).toLocaleString() : "0"}</span>
              </div>
            </div>
          </div>
        </div>
        <form onSubmit={handleCreateToken} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">{t.tokenName}</label>
            <input
              type="text"
              placeholder="مثلا: MyToken"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">{t.tokenSymbol}</label>
            <input
              type="text"
              placeholder="مثلا: MTK"
              value={tokenSymbol}
              onChange={(e) => setTokenSymbol(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">{t.tokenSupply}</label>
            <input
              type="number"
              placeholder="مثلا: 1000000"
              value={tokenSupply}
              onChange={(e) => setTokenSupply(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">{t.tokenLogo}</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
            />
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-semibold py-3 rounded-lg shadow-lg transition duration-200 mt-4 disabled:opacity-50"
          >
            {uploading ? t.uploading : t.submitBtn}
          </button>
        </form>
      </main>
    </div>
  );
}
