import React, { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect, useWriteContract, useReadContract, useSwitchChain, useChainId, useConfig } from 'wagmi';
import { waitForTransactionReceipt, getPublicClient } from 'wagmi/actions';
import { polygon } from 'wagmi/chains';
import { useLanguage } from "./i18n.jsx";

const FACTORY_ADDR = "0x5f9ad349Fc40DeE22f23801238489F17951B0843";
const FACTORY_ABI = [
  {
    inputs: [
      { internalType: "string", name: "name_", type: "string" },
      { internalType: "string", name: "symbol_", type: "string" },
      { internalType: "uint256", name: "totalSupply_", type: "uint256" },
      { internalType: "uint256", name: "maxFee", type: "uint256" },
    ],
    name: "createTokenWithMatic",
    outputs: [{ internalType: "address", name: "tokenAddress", type: "address" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "name_", type: "string" },
      { internalType: "string", name: "symbol_", type: "string" },
      { internalType: "uint256", name: "totalSupply_", type: "uint256" },
      { internalType: "address", name: "recipient", type: "address" },
    ],
    name: "createTokenFree",
    outputs: [{ internalType: "address", name: "tokenAddress", type: "address" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "feeInMatic",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_feeInMatic", type: "uint256" },
      { internalType: "uint256", name: "_feeInUsdt", type: "uint256" },
    ],
    name: "setFees",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

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
          PolyMint
        </div>
        <div className="text-[10px] text-gray-500 -mt-0.5">Polygon Network</div>
      </div>
    </div>
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

function NavBar({ manualAddress, setManualAddress }) {
  const { t, lang, setLang } = useLanguage();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const onWrongChain = isConnected && chainId !== polygon.id;
  const [showWallets, setShowWallets] = useState(false);
  const [showPasteInput, setShowPasteInput] = useState(false);
  const [pasteValue, setPasteValue] = useState("");
  const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent);
  const isWalletBrowser = typeof navigator !== "undefined" && /TrustWallet|WalletConnect|MetaMask/i.test(navigator.userAgent);
  const hasInjected = typeof window !== "undefined" && (window.ethereum || window.trustWallet || isWalletBrowser);
  const langs = [
    { code: "en", label: "English" }, { code: "ar", label: "العربية" },
    { code: "fa", label: "فارسی" }, { code: "ku", label: "کوردی" },
    { code: "zh", label: "中文" }, { code: "hi", label: "हिन्दी" },
    { code: "ms", label: "Melayu" }, { code: "de", label: "Deutsch" },
  ];
  const effectiveAddr = address || manualAddress;
  const effectiveConnected = isConnected || !!manualAddress;

  const handlePasteConnect = () => {
    const a = pasteValue.trim();
    if (!/^0x[0-9a-fA-F]{40}$/.test(a)) { alert(lang === "fa" ? "آدرس کیف پول معتبر نیست" : "Invalid wallet address"); return; }
    setManualAddress(a);
    localStorage.setItem("manualAddr", a);
    setShowWallets(false);
    setShowPasteInput(false);
    setPasteValue("");
  };

  const handleDisconnect = () => {
    if (manualAddress) {
      setManualAddress("");
      localStorage.removeItem("manualAddr");
    } else {
      disconnect();
    }
  };

  const handleConnect = async () => {
    setShowWallets(false);
    let p = window.ethereum || window.trustWallet;
    // Some wallets inject provider late — poll up to 3s
    if (!p) {
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 200));
        p = window.ethereum || window.trustWallet;
        if (p) break;
      }
    }
    // EIP-6963 standard provider discovery
    if (!p) {
      try {
        p = await new Promise(r => {
          let done = false;
          const h = (e) => { done = true; window.removeEventListener('eip6963:announceProvider', h); r(e.detail.provider); };
          window.addEventListener('eip6963:announceProvider', h);
          window.dispatchEvent(new Event('eip6963:requestProvider'));
          setTimeout(() => { if (!done) { window.removeEventListener('eip6963:announceProvider', h); r(null); } }, 2000);
        });
      } catch {}
    }
    if (p) {
      try {
        const accts = await p.request({ method: "eth_requestAccounts" });
        if (accts?.[0]) { window.location.reload(); return; }
      } catch (e) {
        if (e?.code === 4001) return;
      }
    }
    try {
      await connect({ connector: connectors.find(c => c.id === "injected") });
      await new Promise(r => setTimeout(r, 800));
      await ensurePolygonNetwork();
    } catch (e) {
      if (e?.code === 4001) return;
    }
  };

  const MOBILE_WALLETS = [
    { id: "metamask", name: "MetaMask", icon: "🦊", url: "https://metamask.app.link/dapp/ploymint.polyganfactorytoken.workers.dev" },
    { id: "trust", name: "Trust Wallet", icon: "🔵", url: "https://link.trustwallet.com/open_url?url=https%3A%2F%2Fploymint.polyganfactorytoken.workers.dev" },
    { id: "phantom", name: "Phantom", icon: "👻", url: "https://phantom.app/ul/browse/https://ploymint.polyganfactorytoken.workers.dev" },
    { id: "rainbow", name: "Rainbow", icon: "🌈", url: "https://rnbw.app/dapp/ploymint.polyganfactorytoken.workers.dev" },
  ];

  return (
    <nav className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-gray-800">
      <Logo />
      <div className="flex items-center gap-3">
        {onWrongChain && (
          <button onClick={ensurePolygonNetwork}
            className="bg-red-600 hover:bg-red-700 rounded-lg px-4 py-2 text-sm font-medium transition-all whitespace-nowrap">
            ⚠ Switch to Polygon
          </button>
        )}
        <div className="flex flex-col items-end gap-1">
          {effectiveConnected ? (
            <button onClick={handleDisconnect}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 rounded-lg px-3 py-2 text-sm font-medium transition-all">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              {manualAddress ? "📋" : ""} {effectiveAddr.slice(0,4)}...{effectiveAddr.slice(-4)}
            </button>
          ) : (
            <div className="relative">
              <button onClick={() => setShowWallets(!showWallets)}
                className="bg-purple-600 hover:bg-purple-700 rounded-lg px-4 py-2 text-sm font-medium transition-all">
                {t.connectWallet}
              </button>
            {showWallets && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                {hasInjected && (
                  <button onClick={handleConnect}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 text-sm text-left transition-all">
                    <span className="text-xl">🦊</span>
                    <div>
                      <div className="font-medium text-white">Browser Wallet</div>
                      <div className="text-xs text-gray-400">MetaMask, Trust Wallet, etc.</div>
                    </div>
                  </button>
                )}
                <button onClick={() => setShowPasteInput(!showPasteInput)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 text-sm text-left transition-all">
                  <span className="text-xl">📋</span>
                  <div>
                    <div className="font-medium text-white">{lang === "fa" ? "ورود با آدرس" : "Enter Address"}</div>
                    <div className="text-xs text-gray-400">{lang === "fa" ? "برای مرور بدون کیف پول" : "Browse without wallet"}</div>
                  </div>
                </button>
                {showPasteInput && (
                  <div className="px-4 pb-3">
                    <input type="text" value={pasteValue} onChange={e => setPasteValue(e.target.value)}
                      placeholder="0x..."
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white mb-2 focus:outline-none focus:border-purple-500 font-mono" />
                    <button onClick={handlePasteConnect}
                      className="w-full bg-purple-600 hover:bg-purple-700 rounded-lg py-2 text-sm font-medium transition-all">
                      {lang === "fa" ? "اتصال" : "Connect"}
                    </button>
                  </div>
                )}
                {isMobile && (
                  <>
                    <div className="border-t border-gray-800 px-4 py-2 text-xs text-gray-500 text-center">
                      {lang === "fa" ? "باز کردن در اپ والت:" : "Open in wallet app:"}
                    </div>
                    {MOBILE_WALLETS.map(w => (
                      <a key={w.id} href={w.url} rel="noreferrer"
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 text-sm text-left transition-all">
                        <span className="text-xl">{w.icon}</span>
                        <div>
                          <div className="font-medium text-white">{w.name}</div>
                          <div className="text-xs text-gray-400">{lang === "fa" ? "باز شدن در والت" : "Opens in wallet"}</div>
                        </div>
                      </a>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}
        {!effectiveConnected && (
          <button onClick={() => { setShowWallets(true); setShowPasteInput(true); }}
            className="text-[10px] text-purple-400/80 hover:text-purple-300 underline max-w-[220px] text-right leading-tight rtl:text-right ltr:text-left">
            {t.pastePrompt}
          </button>
        )}
        </div>
        <select value={lang} onChange={(e) => setLang(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white cursor-pointer focus:outline-none focus:border-purple-500">
          {langs.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
      </div>
    </nav>
  );
}

const POLYGON_CHAIN_PARAMS = {
  chainId: "0x89",
  chainName: "Polygon Mainnet",
  nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
  rpcUrls: ["https://polygon-rpc.com", "https://polygon.llamarpc.com", "https://rpc.ankr.com/polygon"],
  blockExplorerUrls: ["https://polygonscan.com"],
  iconUrls: [],
};

async function ensurePolygonNetwork() {
  if (!window.ethereum) return;
  try {
    const currentChainId = await window.ethereum.request({ method: "eth_chainId" });
    if (currentChainId === "0x89") return;
    await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x89" }] });
  } catch (err) {
    if (err.code === 4902) {
      try {
        await window.ethereum.request({ method: "wallet_addEthereumChain", params: [POLYGON_CHAIN_PARAMS] });
      } catch (e) { console.error("Failed to add Polygon:", e); }
    } else if (err.code !== 4001) {
      console.error("Failed to switch chain:", err);
    }
  }
  await new Promise(r => setTimeout(r, 500));
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
  const { address, isConnected } = useAccount();
  const config = useConfig();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync, isPending } = useWriteContract();
  const { data: ownerAddr } = useReadContract({ config, chainId: polygon.id, address: FACTORY_ADDR, abi: FACTORY_ABI, functionName: "owner" });
  const { data: maticFee } = useReadContract({ config, chainId: polygon.id, address: FACTORY_ADDR, abi: FACTORY_ABI, functionName: "feeInMatic" });
  const [manualAddress, setManualAddress] = useState(() => localStorage.getItem("manualAddr") || "");
  const effectiveAddr = address || manualAddress;
  const effectiveConnected = isConnected || !!manualAddress;
  const isOwner = (address || manualAddress) && ownerAddr && (address || manualAddress).toLowerCase() === ownerAddr.toLowerCase();

  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenSupply, setTokenSupply] = useState("");
  const [tokenLogo, setTokenLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [aiStyle, setAiStyle] = useState("cinematic");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [minting, setMinting] = useState(false);
  const [createdToken, setCreatedToken] = useState(null);
  const [activeTab, setActiveTab] = useState("create");

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [dir, lang]);

  useEffect(() => {
    if (isConnected && chainId !== polygon.id) {
      ensurePolygonNetwork();
    }
  }, [isConnected, chainId]);

  const handleAiLogo = async () => {
    if (!tokenName || !tokenSymbol) {
      alert(lang === "fa" ? "ابتدا نام و نماد توکن را وارد کنید" : "Please enter token name & symbol first");
      return;
    }
    setAiGenerating(true);
    try {
      const res = await fetch("/api/logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tokenName, symbol: tokenSymbol, style: aiStyle }),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const file = new File([blob], "ai-logo.png", { type: "image/png" });
      setTokenLogo(file);
      setLogoPreview(url);
    } catch (err) {
      alert(t.aiLogoError || "Logo generation failed. Please try again.");
    }
    setAiGenerating(false);
  };

  const handleMint = async (e) => {
    e.preventDefault();
    if (!tokenName || !tokenSymbol || !tokenSupply) return;
    if (manualAddress) { alert(lang === "fa" ? "برای ساخت توکن به کیف پول نیاز دارید. از دسکتاپ با MetaMask استفاده کنید." : "Wallet required to create tokens. Use desktop with MetaMask."); return; }
    if (!isConnected) { alert(t.connectFirst || "Please connect your wallet first"); return; }
    setMinting(true);
    try {
      if (chainId !== polygon.id) {
        await ensurePolygonNetwork();
      }
      const supplyWei = (BigInt(tokenSupply) * 10n ** 18n).toString();
      let hash;
      if (isOwner) {
        hash = await writeContractAsync({
          address: FACTORY_ADDR,
          abi: FACTORY_ABI,
          functionName: "createTokenFree",
          args: [tokenName, tokenSymbol, supplyWei, address],
        });
      } else {
        const maxFee = maticFee ? (maticFee + 1n).toString() : "25000000000000000001";
        hash = await writeContractAsync({
          address: FACTORY_ADDR,
          abi: FACTORY_ABI,
          functionName: "createTokenWithMatic",
          args: [tokenName, tokenSymbol, supplyWei, maxFee],
          value: maticFee ? maticFee.toString() : "25000000000000000000",
        });
      }
      setCreatedToken({
        address: "⏳ Waiting for confirmation...",
        name: tokenName, symbol: tokenSymbol, supply: tokenSupply, explorer: "https://polygonscan.com",
      });
      const receipt = await waitForTransactionReceipt(config, { hash });
      let tokenAddr = null;
      const TOKEN_CREATED_TOPIC = "0x6bbf6b425f827619d9ed2012826973c1f03decdfa91aa03d3c882cad1e650321";
      const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
      for (const log of receipt.logs) {
        if (log.topics[0] === TOKEN_CREATED_TOPIC && log.topics.length >= 3) {
          tokenAddr = "0x" + log.topics[2].slice(26);
          break;
        }
      }
      if (!tokenAddr) {
        for (const log of receipt.logs) {
          if (log.topics[0] === TRANSFER_TOPIC && log.topics.length >= 3) {
            const possibleAddr = "0x" + log.topics[2].slice(26);
            if (possibleAddr.toLowerCase() !== FACTORY_ADDR.toLowerCase()) {
              tokenAddr = possibleAddr;
              break;
            }
          }
        }
      }
      setCreatedToken({
        address: tokenAddr || hash,
        name: tokenName, symbol: tokenSymbol, supply: tokenSupply, explorer: "https://polygonscan.com",
      });
      const existing = JSON.parse(localStorage.getItem("deployedTokens") || "[]");
      existing.push({ tokenAddress: tokenAddr || hash, name: tokenName, symbol: tokenSymbol, totalSupply: tokenSupply });
      localStorage.setItem("deployedTokens", JSON.stringify(existing));
    } catch (err) {
      alert(err?.shortMessage || err?.message || "Transaction failed");
    }
    setMinting(false);
  };

  const netDetails = NETWORK_DETAILS[lang] || NETWORK_DETAILS.en;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <NavBar manualAddress={manualAddress} setManualAddress={setManualAddress} />
      <div className="text-center py-16 px-4 bg-gradient-to-b from-purple-900/10 to-transparent">
        <h1 className="text-3xl sm:text-5xl font-bold mb-4">
          {t.heroTitle} <span className="text-purple-400 italic">{t.heroTitleAccent}</span>
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">{t.heroBody}</p>
      </div>

      <Stats />

      <div className="flex justify-center gap-2 mb-8 px-4 flex-wrap">
        {[
          { id: "create", label: t.formTitle },
          { id: "wallet", label: t.walletGuide },
          { id: "network", label: t.networkGuide },
          { id: "buy", label: t.howToBuy },
          { id: "dex", label: t.liquidity },
          { id: "tokens", label: t.tokensList },
          ...(isOwner ? [{ id: "owner", label: "🔧 Owner" }] : []),
          { id: "tutorial", label: t.tutorialTab },
          { id: "articles", label: t.articlesTab },
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
                <label className="block text-sm text-gray-400 mb-1">{t.tokenLogo}</label>
                <div className="flex gap-2 mb-3">
                  <select value={aiStyle} onChange={e => setAiStyle(e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 cursor-pointer">
                    <option value="cinematic">{t.aiStyleCinematic}</option>
                    <option value="minimal">{t.aiStyleMinimal}</option>
                    <option value="neon">{t.aiStyleNeon}</option>
                    <option value="gold">{t.aiStyleGold}</option>
                    <option value="cartoon">{t.aiStyleCartoon}</option>
                    <option value="space">{t.aiStyleSpace}</option>
                  </select>
                  <button type="button" onClick={handleAiLogo} disabled={aiGenerating}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-50 whitespace-nowrap">
                    {aiGenerating ? t.aiLogoGenerating : t.aiLogoButton}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-3">{t.aiLogoHint}</p>
                <input type="file" accept="image/*" onChange={e => {
                  const f = e.target.files[0];
                  if (f) { setTokenLogo(f); setLogoPreview(URL.createObjectURL(f)); }
                }}
                  className="w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer" />
                {logoPreview && <img src={logoPreview} alt="logo" className="mt-2 w-12 h-12 rounded-full object-cover border border-gray-700" />}
              </div>
              {isOwner ? (
                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30 text-center">
                  <span className="text-purple-300 font-bold text-lg">✨ {lang === "fa" ? "ساخت توکن رایگان (مالک سایت)" : "Free Token Creation (Owner)"}</span>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700 text-center">
                  <p className="text-sm text-gray-400">{lang === "fa" ? "کارمزد" : "Fee"}: <span className="text-purple-300 font-bold">{maticFee ? (Number(maticFee) / 1e18).toFixed(0) : "25"} MATIC</span></p>
                </div>
              )}
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
                <div className="flex gap-2 mt-4">
                  <a href={`${createdToken.explorer}/address/${createdToken.address}`} target="_blank" rel="noreferrer"
                    className="flex-1 text-center bg-purple-600 hover:bg-purple-700 rounded-lg py-2 text-sm font-medium transition-all">{t.viewOnExplorer}</a>
                </div>
                {createdToken.name && createdToken.symbol && (
                  <div className="mt-5 pt-4 border-t border-gray-700">
                    <p className="text-sm font-bold text-purple-300 mb-1">🚀 {t.shareTitle}</p>
                    <p className="text-xs text-gray-500 mb-3">{t.shareDesc}</p>
                    {(() => {
                      const site = "https://ploymint.polyganfactorytoken.workers.dev/";
                      const msg = `I just created my own crypto token ${createdToken.name} (${createdToken.symbol}) on Polygon with PolyMint — no coding needed! 🚀`;
                      const btns = [
                        { icon: "✈️", name: "Telegram", cls: "bg-sky-600 hover:bg-sky-500", href: `https://t.me/share/url?url=${encodeURIComponent(site)}&text=${encodeURIComponent(msg)}` },
                        { icon: "💬", name: "WhatsApp", cls: "bg-green-600 hover:bg-green-500", href: `https://wa.me/?text=${encodeURIComponent(msg + " " + site)}` },
                        { icon: "𝕏", name: "X", cls: "bg-gray-900 hover:bg-gray-800 border border-gray-700", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}&url=${encodeURIComponent(site)}` },
                      ];
                      return (
                        <div className="flex flex-wrap gap-2">
                          {btns.map(b => (
                            <a key={b.name} href={b.href} target="_blank" rel="noopener noreferrer"
                              className={`flex-1 min-w-[100px] text-center ${b.cls} rounded-lg py-2 text-sm font-semibold transition-all`}>
                              {b.icon} {b.name}
                            </a>
                          ))}
                          <button onClick={() => navigator.clipboard?.writeText(site).then(() => alert(lang === "fa" ? "لینک کپی شد" : "Link copied"))}
                            className="flex-1 min-w-[100px] text-center bg-gray-700 hover:bg-gray-600 rounded-lg py-2 text-sm font-semibold transition-all">
                            📋 {lang === "fa" ? "کپی لینک" : "Copy Link"}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        </Section>
      )}

      {activeTab === "wallet" && (
        <Section id="wallet" title={t.walletGuide}>
          <div className="max-w-2xl mx-auto space-y-4">
            <p className="text-gray-400 text-sm leading-relaxed">{t.walletDesc}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {WALLETS.map(w => (
                <a key={w.id} href={w.url} target="_blank" rel="noreferrer"
                  className="p-4 rounded-xl border border-gray-700 bg-gray-800/50 hover:border-purple-500 hover:bg-gray-800 transition-all group">
                  <div className="font-bold text-purple-400 group-hover:text-purple-300">{w.name}</div>
                  <div className="text-xs text-gray-400 mt-1">{t[w.descKey]}</div>
                </a>
              ))}
            </div>
          </div>
        </Section>
      )}

      {activeTab === "network" && (
        <Section id="network" title={t.networkGuide}>
          <div className="max-w-2xl mx-auto space-y-4">
            <p className="text-gray-400 text-sm leading-relaxed">{t.networkDesc}</p>
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 space-y-3">
              {netDetails.map((d, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">{d.label}</span>
                  <span className="text-sm font-mono text-purple-300">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {activeTab === "buy" && (
        <Section id="buy" title={t.howToBuy}>
          <div className="max-w-2xl mx-auto space-y-4">
            <p className="text-gray-400 text-sm leading-relaxed">{t.buyDesc}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {["Binance", "Coinbase", "OKX", "Kraken"].map(ex => (
                <a key={ex} href={`https://www.${ex.toLowerCase()}.com/en/price/polygon`} target="_blank" rel="noreferrer"
                  className="p-4 rounded-xl border border-gray-700 bg-gray-800/50 hover:border-purple-500 hover:bg-gray-800 transition-all group">
                  <div className="font-bold text-purple-400 group-hover:text-purple-300">{ex}</div>
                  <div className="text-xs text-gray-400 mt-1">{t.buyFromExc}</div>
                </a>
              ))}
            </div>
          </div>
        </Section>
      )}

      {activeTab === "dex" && (
        <Section id="dex" title={t.liquidity}>
          <div className="max-w-2xl mx-auto space-y-6">
            <p className="text-gray-400 text-sm leading-relaxed">{t.liquidityDesc}</p>
            <div>
              <p className="text-sm text-purple-300 font-bold mb-3">{t.liquidityTitle}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {DEXES.map(d => (
                  <a key={d.name} href={`${d.url}`} target="_blank" rel="noreferrer"
                    className="p-4 rounded-xl border border-gray-700 bg-gray-800/50 hover:border-purple-500 hover:bg-gray-800 transition-all group">
                    <div className="font-bold text-purple-400 group-hover:text-purple-300">{d.name}</div>
                    <div className="text-xs text-gray-400 mt-1">{t.addLiquidity}</div>
                  </a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-purple-300 font-bold mb-3">{t.priceTrack}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {AGGREGATORS.map(d => (
                  <a key={d.name} href={d.url} target="_blank" rel="noreferrer"
                    className="p-4 rounded-xl border border-gray-700 bg-gray-800/50 hover:border-purple-500 hover:bg-gray-800 transition-all group">
                    <div className="font-bold text-purple-400 group-hover:text-purple-300">{d.name}</div>
                    <div className="text-xs text-gray-400 mt-1">{t.priceTrack}</div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </Section>
      )}

      {activeTab === "tokens" && (
        <Section id="tokens" title={t.tokensList}>
          <TokenList />
        </Section>
      )}

      {activeTab === "tutorial" && (
        <Section id="tutorial" title={t.tutorialTab}>
          <div className="max-w-2xl mx-auto leading-relaxed space-y-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
              <h3 className="font-bold text-purple-400 mb-2">{t.t1Title}</h3>
              <p className="text-sm text-gray-300 mb-3">{t.t1Desc}</p>
              <ol className="space-y-1 text-sm text-gray-300 mb-3">
                {[1,2,3,4,5,6].map(i => <li key={i} className="flex gap-2"><span className="text-purple-400 font-bold shrink-0">{i}.</span>{t[`t1Step${i}`]}</li>)}
              </ol>
              <p className="text-xs text-yellow-300 bg-yellow-900/20 rounded-lg p-2">{t.t1Note}</p>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
              <h3 className="font-bold text-purple-400 mb-2">{t.t2Title}</h3>
              <p className="text-sm text-gray-300 mb-3">{t.t2Desc}</p>
              <ol className="space-y-1 text-sm text-gray-300 mb-3">
                {[1,2,3,4,5,6,7].map(i => <li key={i} className="flex gap-2"><span className="text-purple-400 font-bold shrink-0">{i}.</span>{t[`t2Step${i}`]}</li>)}
              </ol>
              <p className="text-xs text-gray-500">{t.t2Note}</p>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
              <h3 className="font-bold text-green-400 mb-2">{t.t3Title}</h3>
              <p className="text-sm text-gray-300 mb-3">{t.t3Desc}</p>
              <ol className="space-y-1 text-sm text-gray-300 mb-3">
                {[1,2,3,4,5].map(i => <li key={i} className="flex gap-2"><span className="text-green-400 font-bold shrink-0">{i}.</span>{t[`t3Step${i}`]}</li>)}
              </ol>
              <p className="text-xs text-gray-500">{t.t3Note}</p>
            </div>

            <div className="bg-pink-900/20 border border-pink-600/30 rounded-xl p-5">
              <h3 className="font-bold text-pink-400 mb-2">{t.t4Title}</h3>
              <p className="text-sm text-gray-300 mb-3">{t.t4Desc}</p>
              <ol className="space-y-1 text-sm text-gray-300 mb-3">
                {[1,2,3,4,5].map(i => <li key={i} className="flex gap-2"><span className="text-pink-400 font-bold shrink-0">{i}.</span>{t[`t4Step${i}`]}</li>)}
              </ol>
              <p className="text-xs text-yellow-300 bg-yellow-900/20 rounded-lg p-2">{t.t4Note}</p>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
              <h3 className="font-bold text-purple-400 mb-2">{t.t5Title}</h3>
              <p className="text-sm text-gray-300 mb-3">{t.t5Desc}</p>
              <ol className="space-y-1 text-sm text-gray-300 mb-3">
                {[1,2,3,4,5].map(i => <li key={i} className="flex gap-2"><span className="text-purple-400 font-bold shrink-0">{i}.</span>{t[`t5Step${i}`]}</li>)}
              </ol>
              <p className="text-xs text-yellow-300 bg-yellow-900/20 rounded-lg p-2">{t.t5Note}</p>
            </div>

            <div className="bg-amber-900/20 border border-amber-600/30 rounded-xl p-5">
              <h3 className="font-bold text-amber-400 mb-2">{t.t6Title}</h3>
              <p className="text-sm text-gray-300 mb-3">{t.t6Desc}</p>
              <ol className="space-y-1 text-sm text-gray-300 mb-3">
                {[1,2,3,4,5,6,7].map(i => <li key={i} className="flex gap-2"><span className="text-amber-400 font-bold shrink-0">{i}.</span>{t[`t6Step${i}`]}</li>)}
              </ol>
              <p className="text-xs text-gray-500">{t.t6Note}</p>
            </div>

            <div className="bg-blue-900/20 border border-blue-600/30 rounded-xl p-5">
              <h3 className="font-bold text-blue-400 mb-2">{t.t7Title}</h3>
              <p className="text-sm text-gray-300 mb-3">{t.t7Desc}</p>
              <ol className="space-y-1 text-sm text-gray-300 mb-3">
                {[1,2,3,4,5,6,7,8,9,10].map(i => <li key={i} className="flex gap-2"><span className="text-blue-400 font-bold shrink-0">{i}.</span>{t[`t7Step${i}`]}</li>)}
              </ol>
              <p className="text-xs text-gray-500">{t.t7Note}</p>
            </div>

            <div className="bg-indigo-900/20 border border-indigo-600/30 rounded-xl p-5">
              <h3 className="font-bold text-indigo-400 mb-2">{t.t8Title}</h3>
              <p className="text-sm text-gray-300 mb-3">{t.t8Desc}</p>
              <p className="text-sm text-indigo-300 font-bold mb-1">{t.t8BuyTitle}</p>
              <ol className="space-y-1 text-sm text-gray-300 mb-3">
                {[1,2,3].map(i => <li key={i} className="flex gap-2"><span className="text-indigo-400 font-bold shrink-0">{i}.</span>{t[`t8Buy${i}`]}</li>)}
              </ol>
              <p className="text-sm text-indigo-300 font-bold mb-1">{t.t8SellTitle}</p>
              <ol className="space-y-1 text-sm text-gray-300 mb-3">
                {[1,2,3,4,5].map(i => <li key={i} className="flex gap-2"><span className="text-indigo-400 font-bold shrink-0">{i}.</span>{t[`t8Sell${i}`]}</li>)}
              </ol>
              <p className="text-xs text-gray-500">{t.t8Note}</p>
            </div>

            <div className="bg-emerald-900/20 border border-emerald-600/30 rounded-xl p-5">
              <h3 className="font-bold text-emerald-400 mb-2">{t.t9Title}</h3>
              <p className="text-sm text-gray-300 mb-3">{t.t9Desc}</p>
              <ol className="space-y-1 text-sm text-gray-300 mb-3">
                {[1,2,3,4,5].map(i => <li key={i} className="flex gap-2"><span className="text-emerald-400 font-bold shrink-0">{i}.</span>{t[`t9Step${i}`]}</li>)}
              </ol>
              <p className="text-xs text-gray-500">{t.t9Note}</p>
            </div>

            <div className="bg-red-900/20 border border-red-600/30 rounded-xl p-5">
              <h3 className="font-bold text-red-400 mb-2">{t.tutorialWarning}</h3>
              <ul className="space-y-1 text-sm text-gray-300">
                <li className="flex gap-2"><span className="text-red-400">⚠️</span>{t.tutorialWarn1}</li>
                <li className="flex gap-2"><span className="text-red-400">⚠️</span>{t.tutorialWarn2}</li>
                <li className="flex gap-2"><span className="text-red-400">⚠️</span>{t.tutorialWarn3}</li>
                <li className="flex gap-2"><span className="text-red-400">⚠️</span>{t.tutorialWarn4}</li>
              </ul>
            </div>
          </div>
        </Section>
      )}

      {activeTab === "articles" && (
        <Section id="articles" title={t.articlesTab}>
          <Articles />
        </Section>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-xl p-4 text-xs text-yellow-300 space-y-2">
          <p className="font-bold">⚠️ {lang === "fa" ? "هشدارهای امنیتی مهم" : "Important Security Warnings"}</p>
          <p>🔸 {lang === "fa" ? "هرگز عبارت بازیابی (Seed Phrase) را با کسی به اشتراک نگذارید" : "Never share your Seed Phrase with anyone"}</p>
          <p>🔸 {lang === "fa" ? "هیچکس از طرف تیم با شما تماس خصوصی نمی‌گیرد" : "Team members will never DM you first"}</p>
          <p>🔸 {lang === "fa" ? "همیشه آدرس قرارداد را قبل از خرید چک کنید" : "Always verify contract addresses before buying"}</p>
        </div>
      </div>
      <footer className="border-t border-gray-800 py-6 text-center text-xs text-gray-500 px-4">
        <a href="https://t.me/polymint_crypto" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:opacity-90 transition mb-4">
          ✈️ {t.joinChannel}
        </a>
        <p>{t.footer} | <a href="mailto:ammm37474@gmail.com" className="text-purple-400 hover:text-purple-300 underline">ammm37474@gmail.com</a></p>
      </footer>
    </div>
  );
}

function Stats() {
  const { t, lang } = useLanguage();
  const config = useConfig();
  const [visits, setVisits] = useState({ today: 0, month: 0, year: 0, total: 0 });
  const [tokenCount, setTokenCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stats").then(r => r.json()).then(d => { if (!cancelled) setVisits(d); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const client = await getPublicClient(config, { chainId: polygon.id });
        const logs = await client.getLogs({
          address: FACTORY_ADDR,
          event: {
            type: 'event',
            name: 'TokenCreated',
            inputs: [
              { type: 'address', name: 'creator', indexed: true },
              { type: 'address', name: 'tokenAddress', indexed: true },
              { type: 'string', name: 'name', indexed: false },
              { type: 'string', name: 'symbol', indexed: false },
              { type: 'uint256', name: 'totalSupply', indexed: false },
              { type: 'string', name: 'paymentMethod', indexed: false },
            ],
          },
          fromBlock: 0n,
        });
        if (!cancelled) setTokenCount(logs.length);
      } catch (err) {
        console.error("Failed to count tokens:", err);
        const local = JSON.parse(localStorage.getItem("deployedTokens") || "[]");
        if (!cancelled) setTokenCount(local.length);
      }
    })();
    return () => { cancelled = true; };
  }, [config]);

  const cards = [
    { label: t.statsToday, value: visits.today, icon: "👁️" },
    { label: t.statsMonth, value: visits.month, icon: "📅" },
    { label: t.statsYear, value: visits.year, icon: "🗓️" },
    { label: t.statsTokens, value: tokenCount, icon: "🪙" },
  ];

  return (
    <Section title={t.statsTitle}>
      <div className="max-w-2xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
        {cards.map(s => (
          <div key={s.label} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center hover:border-purple-500 transition-all">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold text-purple-400">{Number(s.value || 0).toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function TokenList() {
  const { t, lang } = useLanguage();
  const { address, isConnected } = useAccount();
  const config = useConfig();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isConnected || !address) {
      setTokens([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const TOKEN_CREATED_TOPIC = "0x6bbf6b425f827619d9ed2012826973c1f03decdfa91aa03d3c882cad1e650321";
        const creatorTopic = "0x000000000000000000000000" + address.slice(2).toLowerCase();
        const client = await getPublicClient(config, { chainId: polygon.id });
        const logs = await client.getLogs({
          address: FACTORY_ADDR,
          event: {
            type: 'event',
            name: 'TokenCreated',
            inputs: [
              { type: 'address', name: 'creator', indexed: true },
              { type: 'address', name: 'tokenAddress', indexed: true },
              { type: 'string', name: 'name', indexed: false },
              { type: 'string', name: 'symbol', indexed: false },
              { type: 'uint256', name: 'totalSupply', indexed: false },
              { type: 'string', name: 'paymentMethod', indexed: false },
            ],
          },
          args: { creator: address },
          fromBlock: 0n,
        });
        if (cancelled) return;
        const found = logs.map((log) => ({
          tokenAddress: log.args.tokenAddress,
          name: log.args.name,
          symbol: log.args.symbol,
          totalSupply: (Number(log.args.totalSupply) / 1e18).toLocaleString(),
        }));
        setTokens(found);
      } catch (err) {
        console.error("Failed to fetch tokens from blockchain:", err);
        const local = JSON.parse(localStorage.getItem("deployedTokens") || "[]");
        if (!cancelled) setTokens(local);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [address, isConnected, config]);

  if (!isConnected) return <p className="text-center text-gray-500">{t.connectFirst || "Please connect your wallet first"}</p>;
  if (loading) return <p className="text-center text-gray-500">{lang === "fa" ? "در حال بارگذاری..." : "Loading..."}</p>;
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

const TOPIC_STYLES = {
  basics: "bg-purple-900/40 text-purple-300 border-purple-600/40",
  islamic: "bg-green-900/40 text-green-300 border-green-600/40",
  security: "bg-red-900/40 text-red-300 border-red-600/40",
  market: "bg-blue-900/40 text-blue-300 border-blue-600/40",
  mining: "bg-amber-900/40 text-amber-300 border-amber-600/40",
};

function Articles() {
  const { t, lang } = useLanguage();
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/articles")
      .then(r => r.json())
      .then(d => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const openArticle = async (date) => {
    setSelected({ date, loading: true });
    try {
      const r = await fetch(`/api/articles?date=${date}`);
      const d = await r.json();
      if (d.article) setSelected({ date, ...d.article });
    } catch {}
  };

  if (loading && !data) return <p className="text-center text-gray-500 py-8">{t.articleLoading}</p>;
  if (!data) return <p className="text-center text-gray-500 py-8">{t.articleNoHistory}</p>;

  const today = data.today;
  const isPast = selected && selected.date && selected.date !== today.date;
  const current = isPast ? selected : today;
  const title = (lang === "fa" ? current.titleFa : current.titleEn) || current.titleEn;
  const body = (lang === "fa" ? current.bodyFa : current.bodyEn) || current.bodyEn;
  const topicName = { basics: t.articleTopicBasics, islamic: t.articleTopicIslamic, security: t.articleTopicSecurity, market: t.articleTopicMarket, mining: t.articleTopicMining }[current.topic] || current.topic;
  const topicStyle = TOPIC_STYLES[current.topic] || TOPIC_STYLES.basics;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${topicStyle}`}>{topicName}</span>
          <span className="text-xs text-gray-500">📅 {current.date}</span>
          <span className="text-xs text-gray-500">• {t.articlePublished}</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-purple-300 mb-4">{title}</h3>
        <div className="flex items-center gap-2 mb-4">
          <a href={`/article/${current.slug}`} target="_blank" rel="noreferrer"
            className="bg-gray-700 hover:bg-gray-600 rounded-lg px-3 py-1.5 text-xs font-medium transition-all">
            🔗 {lang === "fa" ? "لینک مقاله" : "Article Link"}
          </a>
          <button onClick={() => {
            const link = `https://ploymint.polyganfactorytoken.workers.dev/article/${current.slug}`;
            navigator.clipboard?.writeText(link).then(() => alert(lang === "fa" ? "لینک کپی شد" : "Link copied"));
          }}
            className="bg-gray-700 hover:bg-gray-600 rounded-lg px-3 py-1.5 text-xs font-medium transition-all">
            📋 {lang === "fa" ? "کپی لینک" : "Copy Link"}
          </button>
        </div>
        <div className="space-y-4 text-sm sm:text-base text-gray-300 leading-relaxed">
          {body.split("\n\n").map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        {isPast && (
          <button onClick={() => setSelected(null)}
            className="mt-6 bg-purple-600 hover:bg-purple-700 rounded-lg px-4 py-2 text-sm font-medium transition-all">
            ← {t.articleBackToToday}
          </button>
        )}
      </div>

      <a href="https://t.me/polymint_crypto" target="_blank" rel="noopener noreferrer"
        className="block rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-900/40 to-pink-900/40 p-4 text-sm text-purple-200 hover:border-purple-400 transition-all">
        ✈️ <b>{lang === "fa" ? "هر روز یک آموزش رایگان تلگرامی دریافت کنید" : "Get a free daily lesson on Telegram"}</b>
        <span className="block mt-1 text-xs text-gray-400">{lang === "fa" ? "عضویت در کانال پلی‌مینت کریپتو" : "Join PolyMint Crypto channel"} →</span>
      </a>

      <div className="bg-yellow-900/15 border border-yellow-600/30 rounded-xl p-4 text-xs text-yellow-200 leading-relaxed">
        ⚠️ {t.articleDisclaimer}
      </div>

      {data.history && data.history.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-gray-400 mb-3">📚 {t.articleArchive}</h4>
          <div className="space-y-2">
            {data.history.map(h => (
              <button key={h.date} onClick={() => openArticle(h.date)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-left transition-all ${h.date === today.date ? "bg-purple-900/30 border-purple-600/40" : "bg-gray-800/40 border-gray-700 hover:border-purple-500"}`}>
                <span className="text-sm font-medium text-white">{lang === "fa" ? h.titleFa : h.titleEn}</span>
                <span className="text-xs text-gray-500 shrink-0 font-mono">{h.date}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
