import React, { useState, useEffect } from "react";
import { useAccount, useDisconnect, useWriteContract, useReadContract, useSwitchChain, useChainId, useConfig } from 'wagmi';
import { waitForTransactionReceipt, getPublicClient } from 'wagmi/actions';
import { polygon } from 'wagmi/chains';
import { useConnectModal } from '@rainbow-me/rainbowkit';
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
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const onWrongChain = isConnected && chainId !== polygon.id;

  useEffect(() => {
    if (isConnected) ensurePolygonNetwork();
  }, [isConnected]);

  const langs = [
    { code: "en", label: "English" }, { code: "ar", label: "العربية" },
    { code: "fa", label: "فارسی" }, { code: "ku", label: "کوردی" },
    { code: "zh", label: "中文" }, { code: "hi", label: "हिन्दी" },
    { code: "ms", label: "Melayu" }, { code: "de", label: "Deutsch" },
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
        {isConnected ? (
          <button onClick={() => disconnect()}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 rounded-lg px-3 py-2 text-sm font-medium transition-all">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            {address.slice(0,4)}...{address.slice(-4)}
          </button>
        ) : (
          <button onClick={openConnectModal}
            className="bg-purple-600 hover:bg-purple-700 rounded-lg px-4 py-2 text-sm font-medium transition-all">
            {t("connectWallet")}
          </button>
        )}
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
  const isOwner = isConnected && address && ownerAddr && address.toLowerCase() === ownerAddr.toLowerCase();

  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenSupply, setTokenSupply] = useState("");
  const [tokenLogo, setTokenLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
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

  const handleMint = async (e) => {
    e.preventDefault();
    if (!tokenName || !tokenSymbol || !tokenSupply) return;
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
          ...(isOwner ? [{ id: "owner", label: "🔧 Owner" }] : []),
          { id: "tutorial", label: t.tutorialTab },
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
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-cyan-900/20 border border-cyan-600/30 rounded-xl p-5">
              <h3 className="font-bold text-cyan-400 mb-3">{t.networkPolygonTitle}</h3>
              <p className="text-sm text-gray-300 whitespace-pre-line">{t.networkPolygonDesc}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {WALLETS.map(w => <WalletCard key={w.id} name={w.name} desc={t[w.descKey]} url={w.url} />)}
            </div>
            <div className="bg-green-900/20 border border-green-600/30 rounded-xl p-5">
              <h3 className="font-bold text-green-400 mb-3">{t.metamaskChromeTitle}</h3>
              <ol className="space-y-2 text-sm text-gray-300">
                {[1,2,3,4,5,6].map(i => <li key={i} className="flex gap-3"><span className="text-green-400 font-bold shrink-0">{i}.</span>{t[`metamaskChrome${i}`]}</li>)}
              </ol>
            </div>
            <div className="bg-blue-900/20 border border-blue-600/30 rounded-xl p-5">
              <h3 className="font-bold text-blue-400 mb-3">{t.metamaskMobileTitle}</h3>
              <ol className="space-y-2 text-sm text-gray-300">
                {[1,2,3,4].map(i => <li key={i} className="flex gap-3"><span className="text-blue-400 font-bold shrink-0">{i}.</span>{t[`metamaskMobile${i}`]}</li>)}
              </ol>
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
              <h3 className="font-bold text-gray-200 mb-3">{t.howToBuy}</h3>
              <ol className="space-y-2 text-sm text-gray-300">
                <li className="flex gap-3"><span className="text-purple-400 font-bold shrink-0">1.</span>{t.exchangeStep1}</li>
                <li className="flex gap-3"><span className="text-purple-400 font-bold shrink-0">2.</span>{t.exchangeStep2}</li>
                <li className="flex gap-3"><span className="text-purple-400 font-bold shrink-0">3.</span>{t.exchangeStep3}</li>
              </ol>
            </div>
            <div className="bg-orange-900/20 border border-orange-600/30 rounded-xl p-5">
              <h3 className="font-bold text-orange-400 mb-3">{t.networkGuide}</h3>
              <div className="space-y-3">
                {netDetails.map((d, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
                    <span className="text-sm text-gray-400">{d.label}</span>
                    <code className="text-sm text-purple-300 font-mono text-right">{d.value}</code>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-500">MetaMask → Settings → Networks → Add Network → Fill details above</p>
            </div>
            <div className="bg-purple-900/20 border border-purple-600/30 rounded-xl p-5">
              <h3 className="font-bold text-purple-400 mb-3">{t.connectGuideTitle}</h3>
              <ol className="space-y-2 text-sm text-gray-300">
                {[1,2,3,4,5].map(i => <li key={i} className="flex gap-3"><span className="text-purple-400 font-bold shrink-0">{i}.</span>{t[`connectStep${i}`]}</li>)}
              </ol>
            </div>
            <div className="bg-amber-900/20 border border-amber-600/30 rounded-xl p-5">
              <h3 className="font-bold text-amber-400 mb-3">{t.receiveTokenTitle}</h3>
              <ol className="space-y-2 text-sm text-gray-300">
                {[1,2,3,4,5,6,7].map(i => <li key={i} className="flex gap-3"><span className="text-amber-400 font-bold shrink-0">{i}.</span>{t[`receiveStep${i}`]}</li>)}
              </ol>
            </div>
            <div className="bg-red-900/20 border border-red-600/30 rounded-xl p-4">
              <p className="text-sm text-red-300">{t.walletNote}</p>
            </div>
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

      {activeTab === "owner" && isOwner && <OwnerSettings maticFee={maticFee} />}

      {activeTab === "tutorial" && (
        <Section title={t.tutorialTitle}>
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-cyan-900/20 border border-cyan-600/30 rounded-xl p-5">
              <p className="text-sm text-gray-300">{t.tutorialIntro}</p>
            </div>

            <div className="bg-green-900/20 border border-green-600/30 rounded-xl p-5">
              <h3 className="font-bold text-green-400 mb-2">{t.t1Title}</h3>
              <p className="text-sm text-gray-300 mb-3">{t.t1Desc}</p>
              <p className="text-sm text-green-300 font-bold mb-2">{t.t1SubA}</p>
              <ol className="space-y-1 text-sm text-gray-300 mb-4">
                {[1,2,3,4,5,6].map(i => <li key={i} className="flex gap-2"><span className="text-green-400 font-bold shrink-0">{i}.</span>{t[`t1A${i}`]}</li>)}
              </ol>
              <p className="text-sm text-blue-300 font-bold mb-2">{t.t1SubB}</p>
              <ol className="space-y-1 text-sm text-gray-300 mb-3">
                {[1,2,3].map(i => <li key={i} className="flex gap-2"><span className="text-blue-400 font-bold shrink-0">{i}.</span>{t[`t1B${i}`]}</li>)}
              </ol>
              <p className="text-xs text-gray-400">{t.t1Wallets}</p>
            </div>

            <div className="bg-orange-900/20 border border-orange-600/30 rounded-xl p-5">
              <h3 className="font-bold text-orange-400 mb-2">{t.t2Title}</h3>
              <p className="text-sm text-gray-300 mb-3">{t.t2Desc}</p>
              <p className="text-sm text-gray-400 mb-2">{t.t2How}</p>
              <div className="space-y-2">
                {[{ l: t.t2Name, v: t.t2NameV }, { l: t.t2Rpc, v: t.t2RpcV }, { l: t.t2Chain, v: t.t2ChainV }, { l: t.t2Symbol, v: t.t2SymbolV }, { l: t.t2Explorer, v: t.t2ExplorerV }].map((d, i) => (
                  <div key={i} className="flex justify-between items-center py-1 border-b border-gray-700 last:border-0">
                    <span className="text-sm text-gray-400">{d.l}</span>
                    <code className="text-sm text-orange-300 font-mono">{d.v}</code>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">{t.t2Note}</p>
            </div>

            <div className="bg-purple-900/20 border border-purple-600/30 rounded-xl p-5">
              <h3 className="font-bold text-purple-400 mb-2">{t.t3Title}</h3>
              <p className="text-sm text-gray-300 mb-3">{t.t3Desc}</p>
              <ol className="space-y-1 text-sm text-gray-300 mb-3">
                {[1,2,3,4,5].map(i => <li key={i} className="flex gap-2"><span className="text-purple-400 font-bold shrink-0">{i}.</span>{t[`t3Step${i}`]}</li>)}
              </ol>
              <p className="text-xs text-yellow-300 bg-yellow-900/20 rounded-lg p-2">{t.t3Note}</p>
            </div>

            <div className="bg-cyan-900/20 border border-cyan-600/30 rounded-xl p-5">
              <h3 className="font-bold text-cyan-400 mb-2">{t.t4Title}</h3>
              <p className="text-sm text-gray-300 mb-3">{t.t4Desc}</p>
              <ol className="space-y-1 text-sm text-gray-300 mb-3">
                {[1,2,3,4,5].map(i => <li key={i} className="flex gap-2"><span className="text-cyan-400 font-bold shrink-0">{i}.</span>{t[`t4Step${i}`]}</li>)}
              </ol>
              <p className="text-xs text-gray-500">{t.t4Note}</p>
            </div>

            <div className="bg-pink-900/20 border border-pink-600/30 rounded-xl p-5">
              <h3 className="font-bold text-pink-400 mb-2">{t.t5Title}</h3>
              <p className="text-sm text-gray-300 mb-3">{t.t5Desc}</p>
              <ol className="space-y-1 text-sm text-gray-300 mb-3">
                {[1,2,3,4,5,6,7,8].map(i => <li key={i} className="flex gap-2"><span className="text-pink-400 font-bold shrink-0">{i}.</span>{t[`t5Step${i}`]}</li>)}
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

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-xl p-4 text-xs text-yellow-300 space-y-2">
          <p className="font-bold">⚠️ {lang === "fa" ? "هشدارهای امنیتی مهم" : "Important Security Warnings"}</p>
          <p>🔸 {lang === "fa" ? "هرگز عبارت بازیابی (Seed Phrase) را با کسی به اشتراک نگذارید" : "Never share your Seed Phrase with anyone"}</p>
          <p>🔸 {lang === "fa" ? "هیچکس از طرف تیم با شما تماس خصوصی نمی‌گیرد" : "Team members will never DM you first"}</p>
          <p>🔸 {lang === "fa" ? "همیشه آدرس قرارداد را قبل از خرید چک کنید" : "Always verify contract addresses before buying"}</p>
          
        </div>
      </div>
      <footer className="border-t border-gray-800 py-6 text-center text-xs text-gray-500 px-4">{t.footer} | <a href="mailto:ammm37474@gmail.com" className="text-purple-400 hover:text-purple-300 underline">ammm37474@gmail.com</a></footer>
    </div>
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

function OwnerSettings({ maticFee }) {
  const { lang } = useLanguage();
  const [newFee, setNewFee] = useState("");
  const [saving, setSaving] = useState(false);
  const { writeContractAsync } = useWriteContract();
  const currentMatic = maticFee ? Number(maticFee) / 1e18 : 0;

  const handleSave = async () => {
    if (!newFee || isNaN(newFee) || Number(newFee) <= 0) return;
    setSaving(true);
    try {
      await ensurePolygonNetwork();
      const feeWei = (BigInt(Math.floor(Number(newFee) * 1e18))).toString();
      await writeContractAsync({
        address: FACTORY_ADDR,
        abi: FACTORY_ABI,
        functionName: "setFees",
        args: [feeWei, "0"],
      });
      alert(lang === "fa" ? "کارمزد با موفقیت تغییر یافت! صفحه را رفرش کنید." : "Fee updated successfully! Refresh the page.");
    } catch (err) {
      alert(err?.shortMessage || err?.message || "Transaction failed");
    }
    setSaving(false);
  };

  return (
    <Section title={lang === "fa" ? "🔧 تنظیمات مالک سایت" : "🔧 Owner Settings"}>
      <div className="max-w-lg mx-auto bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-5">
        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-400">{lang === "fa" ? "کارمزد فعلی" : "Current Fee"}</p>
          <p className="text-2xl font-bold text-purple-300">{currentMatic.toFixed(2)} MATIC</p>
          <p className="text-xs text-gray-500 mt-1">≈ ${(currentMatic * 0.40).toFixed(2)} USD</p>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">{lang === "fa" ? "کارمزد جدید (MATIC)" : "New Fee (MATIC)"}</label>
          <input type="number" step="0.1" min="0.1" placeholder="مثلا 12.5" value={newFee}
            onChange={e => setNewFee(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500" />
          <p className="text-xs text-gray-500 mt-1">
            {lang === "fa" ? "5 USD ≈ 12.5 MATIC (با قیمت ~$0.40)" : "5 USD ≈ 12.5 MATIC (at ~$0.40/ POL)"}
          </p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold py-3 rounded-xl transition-all disabled:opacity-50">
          {saving ? (lang === "fa" ? "در حال ذخیره..." : "Saving...") : (lang === "fa" ? "💾 ذخیره کارمزد" : "💾 Save Fee")}
        </button>
      </div>
    </Section>
  );
}
