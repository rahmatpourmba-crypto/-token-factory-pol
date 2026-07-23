import React, { useState, useEffect } from "react";
import { useLanguage } from "./i18n.jsx";

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_8px_rgba(192,132,252,0.4)]">
        <defs>
          <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C084FC" /><stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="42" stroke="url(#lg)" strokeWidth="8" strokeDasharray="14 7" strokeLinecap="round" />
        <circle cx="50" cy="50" r="26" fill="#030712" stroke="url(#lg)" strokeWidth="4" />
        <path d="M38 38H62M50 38V64" stroke="url(#lg)" strokeWidth="6" strokeLinecap="round" />
      </svg>
      <div>
        <div className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight">
          TOKEN FACTORY
        </div>
        <div className="text-[10px] text-gray-500 -mt-0.5">Polygon Network</div>
      </div>
    </div>
  );
}

function WalletCard({ name, desc, url }) {
  return (
    <a href={url} target="_blank" rel="noreferrer" className="block p-4 rounded-xl border border-gray-700 bg-gray-800/50 hover:border-purple-500 hover:bg-gray-800 transition-all group">
      <div className="font-bold text-purple-400 group-hover:text-purple-300">{name}</div>
      <div className="text-xs text-gray-400 mt-1">{desc}</div>
    </a>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();
  const handle = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <button onClick={handle} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95">
      {copied ? t.copied : t.copyAddr}
    </button>
  );
}

const RPC_URL = "https://polygon-rpc.com";

const NETWORK_DETAILS = {
  en: [
    { label: "Network Name", value: "Polygon Mainnet" },
    { label: "RPC URL", value: RPC_URL },
    { label: "Chain ID", value: "137" },
    { label: "Symbol", value: "POL" },
    { label: "Explorer", value: "https://polygonscan.com" },
  ],
  fa: [
    { label: "نام شبکه", value: "Polygon Mainnet" },
    { label: "RPC URL", value: RPC_URL },
    { label: "Chain ID", value: "137" },
    { label: "نماد", value: "POL" },
    { label: "مرورگر", value: "https://polygonscan.com" },
  ],
};

const WALLETS = [
  { id: "mm", name: "MetaMask", descKey: "metaMaskDesc", url: "https://metamask.io/download" },
  { id: "tw", name: "Trust Wallet", descKey: "trustWalletDesc", url: "https://trustwallet.com/download" },
  { id: "ph", name: "Phantom", descKey: "phantomDesc", url: "https://phantom.app/download" },
];

const DEXES = [
  { name: "QuickSwap", url: "https://quickswap.exchange/#/swap" },
  { name: "Uniswap", url: "https://app.uniswap.org/#/swap?chain=polygon" },
];

const AGGREGATORS = [
  { name: "CoinGecko", url: "https://www.coingecko.com/en/coins/new" },
  { name: "CoinMarketCap", url: "https://coinmarketcap.com/listing/" },
];

function NavBar() {
  const { t, lang, setLang } = useLanguage();
  const langs = [
    { code: "fa", label: "فارسی" }, { code: "en", label: "English" },
    { code: "ar", label: "العربية" }, { code: "ku", label: "کوردی" },
    { code: "zh", label: "中文" }, { code: "hi", label: "हिन्दी" },
    { code: "ms", label: "Melayu" }, { code: "de", label: "Deutsch" },
  ];
  return (
    <nav className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-gray-800">
      <Logo />
      <div className="flex items-center gap-3">
        <select value={lang} onChange={(e) => setLang(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white cursor-pointer focus:outline-none focus:border-purple-500">
          {langs.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
      </div>
    </nav>
  );
}

function Section({ id, title, children }) {
  return (
    <section id={id} className="max-w-4xl mx-auto px-4 py-12 scroll-mt-16">
      {title && <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-purple-300">{title}</h2>}
      {children}
    </section>
  );
}

export default function App() {
  const { t, dir, lang, setLang } = useLanguage();

  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenSupply, setTokenSupply] = useState("");
  const [payment, setPayment] = useState("matic");
  const [minting, setMinting] = useState(false);
  const [createdToken, setCreatedToken] = useState(null);
  const [activeTab, setActiveTab] = useState("create");

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [dir, lang]);

  const handleMint = async (e) => {
    e.preventDefault();
    if (!tokenName || !tokenSymbol || !tokenSupply) return;
    setMinting(true);
    await new Promise(r => setTimeout(r, 2000));
    setCreatedToken({
      address: "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
      name: tokenName, symbol: tokenSymbol, supply: tokenSupply, explorer: "https://polygonscan.com",
    });
    setMinting(false);
  };

  const netDetails = NETWORK_DETAILS[lang] || NETWORK_DETAILS.en;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <NavBar />
      <div className="text-center py-16 px-4 bg-gradient-to-b from-purple-900/10 to-transparent">
        <h1 className="text-3xl sm:text-5xl font-bold mb-4">
          {t.heroTitle} <span className="text-purple-400 italic">{t.heroTitleAccent}</span>
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">{t.heroBody}</p>
      </div>

      <div className="flex justify-center gap-2 mb-8 px-4 flex-wrap">
        {[
          { id: "create", label: t.formTitle },
          { id: "wallet", label: t.walletGuide },
          { id: "network", label: t.networkGuide },
          { id: "buy", label: t.howToBuy },
          { id: "dex", label: t.liquidity },
          { id: "tokens", label: t.tokensList },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "create" && (
        <Section>
          <div className="max-w-lg mx-auto bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-xl">
            <form onSubmit={handleMint} className="space-y-5">
              <div>
                <label className="block text-sm text-gray-400 mb-1">{t.nameLabel}</label>
                <input type="text" placeholder={t.namePlaceholder} value={tokenName}
                  onChange={e => setTokenName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">{t.symbolLabel}</label>
                <input type="text" placeholder={t.symbolPlaceholder} value={tokenSymbol}
                  onChange={e => setTokenSymbol(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">{t.supplyLabel}</label>
                <input type="number" placeholder={t.supplyPlaceholder} value={tokenSupply}
                  onChange={e => setTokenSupply(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">{t.paymentLabel}</label>
                <div className="flex gap-3">
                  {["matic", "usdt"].map(p => (
                    <button key={p} type="button" onClick={() => setPayment(p)}
                      className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all ${payment === p ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 border border-gray-700 hover:border-purple-500"}`}>
                      {p === "matic" ? t.payMatic : t.payUsdt}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={minting}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold py-4 rounded-xl transition-all text-lg disabled:opacity-50">
                {minting ? t.minting : t.mintButton}
              </button>
            </form>
            {createdToken && (
              <div className="mt-6 p-5 bg-gray-800/50 border border-green-500/30 rounded-xl">
                <div className="flex items-center gap-2 text-green-400 font-bold mb-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t.tokenCreated}
                </div>
                <div className="text-sm text-gray-400 mb-2">{t.tokenAddress}</div>
                <div className="flex items-center gap-2 bg-gray-900 rounded-lg p-3 border border-gray-700">
                  <code className="flex-1 text-xs sm:text-sm font-mono text-purple-300 break-all select-all">{createdToken.address}</code>
                  <CopyButton text={createdToken.address} />
                </div>
                <div className="mt-3 flex gap-2 flex-wrap">
                  <a href={`${createdToken.explorer}/token/${createdToken.address}`} target="_blank" rel="noreferrer"
                    className="text-sm text-blue-400 hover:text-blue-300 underline">{t.viewPoly} ↗</a>
                  <span className="text-sm text-gray-500">|</span>
                  <span className="text-sm text-gray-400">{t.addWalletGuide}</span>
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {activeTab === "wallet" && (
        <Section title={t.walletGuide}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {WALLETS.map(w => <WalletCard key={w.id} name={w.name} desc={t[w.descKey]} url={w.url} />)}
          </div>
        </Section>
      )}

      {activeTab === "network" && (
        <Section title={t.networkGuide}>
          <div className="max-w-lg mx-auto bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="space-y-3">
              {netDetails.map((d, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
                  <span className="text-sm text-gray-400">{d.label}</span>
                  <code className="text-sm text-purple-300 font-mono text-right">{d.value}</code>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-gray-500 leading-relaxed">MetaMask → Settings → Networks → Add Network → Fill details above</p>
          </div>
        </Section>
      )}

      {activeTab === "buy" && (
        <Section title={t.howToBuy}>
          <div className="max-w-lg mx-auto bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="font-bold text-purple-400 mb-3">{t.maticAmount} / {t.usdtAmount}</h3>
            <ol className="space-y-3 text-sm text-gray-300">
              <li className="flex gap-3"><span className="text-purple-400 font-bold shrink-0">1.</span>{t.exchangeStep1}</li>
              <li className="flex gap-3"><span className="text-purple-400 font-bold shrink-0">2.</span>{t.exchangeStep2}</li>
              <li className="flex gap-3"><span className="text-purple-400 font-bold shrink-0">3.</span>{t.exchangeStep3}</li>
            </ol>
          </div>
        </Section>
      )}

      {activeTab === "dex" && (
        <Section title={t.liquidity}>
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="font-bold text-purple-400 mb-4">{t.dexGuide}</h3>
              <div className="flex gap-3 mb-4 flex-wrap">
                {DEXES.map(d => (
                  <a key={d.name} href={d.url} target="_blank" rel="noreferrer"
                    className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-4 py-2 text-sm font-medium transition-all">{d.name} ↗</a>
                ))}
              </div>
              <ol className="space-y-2 text-sm text-gray-300">
                <li className="flex gap-3"><span className="text-purple-400 font-bold shrink-0">1.</span>{t.dexStep1}</li>
                <li className="flex gap-3"><span className="text-purple-400 font-bold shrink-0">2.</span>{t.dexStep2}</li>
                <li className="flex gap-3"><span className="text-purple-400 font-bold shrink-0">3.</span>{t.dexStep3}</li>
                <li className="flex gap-3"><span className="text-purple-400 font-bold shrink-0">4.</span>{t.dexStep4}</li>
              </ol>
            </div>
            <div className="bg-gray-900 border border-amber-500/20 rounded-xl p-6">
              <h3 className="font-bold text-amber-400 mb-3">{t.cexGuide}</h3>
              <p className="text-sm text-gray-400">{t.cexNote}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="font-bold text-purple-400 mb-4">{t.aggregatorGuide}</h3>
              <div className="flex gap-3 flex-wrap">
                {AGGREGATORS.map(a => (
                  <a key={a.name} href={a.url} target="_blank" rel="noreferrer"
                    className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-4 py-2 text-sm font-medium transition-all">{a.name} ↗</a>
                ))}
              </div>
            </div>
          </div>
        </Section>
      )}

      {activeTab === "tokens" && (
        <Section title={t.tokensList}>
          <TokenList />
        </Section>
      )}

      <footer className="border-t border-gray-800 py-6 text-center text-xs text-gray-500 px-4">{t.footer}</footer>
    </div>
  );
}

function TokenList() {
  const { t } = useLanguage();
  const [tokens] = useState(() => JSON.parse(localStorage.getItem("deployedTokens") || "[]"));
  if (tokens.length === 0) return <p className="text-center text-gray-500">{t.noTokens}</p>;
  return (
    <div className="overflow-x-auto max-w-3xl mx-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-gray-400">
            <th className="py-3 px-4 text-left">{t.tableName}</th>
            <th className="py-3 px-4 text-left">{t.tableSymbol}</th>
            <th className="py-3 px-4 text-right">{t.tableSupply}</th>
            <th className="py-3 px-4 text-right">{t.tableAddress}</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((tk, i) => (
            <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
              <td className="py-3 px-4 font-medium">{tk.name}</td>
              <td className="py-3 px-4 text-purple-400">{tk.symbol}</td>
              <td className="py-3 px-4 text-right text-gray-400">{tk.totalSupply}</td>
              <td className="py-3 px-4 text-right">
                <a href={`https://polygonscan.com/token/${tk.tokenAddress}`} target="_blank" rel="noreferrer"
                  className="text-blue-400 hover:text-blue-300 font-mono text-xs">
                  {tk.tokenAddress.slice(0, 6)}...{tk.tokenAddress.slice(-4)}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}