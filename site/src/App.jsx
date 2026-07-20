import { useEffect, useMemo, useState } from "react";
import { BrowserProvider, Contract, parseUnits } from "ethers";
import { LanguageProvider, useLanguage } from "./i18n.jsx";
import ListingGuide from "./ListingGuide.jsx";
import { checkTokenContent } from "./contentFilter.js";
import TokenList from "./TokenList.jsx";

// آدرس‌ها را بعد از دیپلوی واقعی جایگزین کنید / Replace after real deployment
const FACTORY_ADDRESS = "0x7DEAfCf7B5998F68250bCa1704246380177CEAF6";
const USDT_ADDRESS = "0xc2132D05D31c914a87C6611C10748AEb04B58e8"; // USDT on Polygon Mainnet
const POLYGON_CHAIN_ID = "0x89"; // 137 in hex

const FACTORY_ABI = [
  "function createTokenWithMatic(string name_, string symbol_, uint256 totalSupply_, uint256 maxFee) external payable returns (address)",
  "function createTokenWithUsdt(string name_, string symbol_, uint256 totalSupply_, uint256 maxFee) external returns (address)",
  "function feeInMatic() view returns (uint256)",
  "function feeInUsdt() view returns (uint256)",
  "function usdtDecimals() view returns (uint8)",
  "event TokenCreated(address indexed creator, address indexed tokenAddress, string name, string symbol, uint256 totalSupply, string paymentMethod)",
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

const FEE_SLIPPAGE_BPS = 300n; // 3%

function Header({ wallet, onConnect }) {
  const { t, lang, setLang, other } = useLanguage();
  return (
    <header className="header">
      <div className="brand">
        <span className="brand-mark">◐</span>
        <div>
          <div className="brand-name">{t.brand}</div>
          <div className="brand-sub">{t.brandSub}</div>
        </div>
      </div>
      <div className="header-actions">
        <a className="nav-link" href="#guide">
          {t.navGuide}
        </a>
        <a className="nav-link" href="#listing">
          {t.navListing}
        </a>
        <button className="lang-toggle" onClick={() => setLang(other)}>
          {other === "fa" ? "فارسی" : "English"}
        </button>
        <button className={`connect-btn ${wallet ? "is-connected" : ""}`} onClick={onConnect}>
          {wallet
            ? `${t.connected} · ${wallet.slice(0, 6)}…${wallet.slice(-4)}`
            : t.connectWallet}
        </button>
      </div>
    </header>
  );
}

function Hero() {
  const { t } = useLanguage();
  return (
    <section className="hero">
      <span className="eyebrow">{t.heroEyebrow}</span>
      <h1 className="hero-title">
        {t.heroTitle} <span className="accent">{t.heroTitleAccent}</span>
      </h1>
      <p className="hero-body">{t.heroBody}</p>
    </section>
  );
}

function CoinSeal({ name, symbol }) {
  const { t } = useLanguage();
  return (
    <div className="seal-wrap">
      <span className="seal-eyebrow">{t.previewEyebrow}</span>
      <div className="coin">
        <div className="coin-symbol">{symbol || t.previewEmptySymbol}</div>
        <div className="coin-name">{name || t.previewEmptyName}</div>
      </div>
    </div>
  );
}

function Steps() {
  const { t } = useLanguage();
  const steps = [
    { n: "01", title: t.step1Title, body: t.step1Body },
    { n: "02", title: t.step2Title, body: t.step2Body },
    { n: "03", title: t.step3Title, body: t.step3Body },
  ];
  return (
    <section className="steps">
      <h2 className="steps-title">{t.stepsTitle}</h2>
      <div className="steps-grid">
        {steps.map((s) => (
          <div className="step-card" key={s.n}>
            <div className="step-number">{s.n}</div>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Guide() {
  const { t } = useLanguage();
  const wallets = [
    { name: t.guideWalletMetamask, body: t.guideWalletMetamaskBody, url: "https://metamask.io" },
    { name: t.guideWalletTrust, body: t.guideWalletTrustBody, url: "https://trustwallet.com" },
    { name: t.guideWalletPhantom, body: t.guideWalletPhantomBody, url: "https://phantom.app" },
  ];
  const mintSteps = [
    { n: "1", title: t.guideStep1, body: t.guideStep1Body },
    { n: "2", title: t.guideStep2, body: t.guideStep2Body },
    { n: "3", title: t.guideStep3, body: t.guideStep3Body },
    { n: "4", title: t.guideStep4, body: t.guideStep4Body },
    { n: "5", title: t.guideStep5, body: t.guideStep5Body },
  ];

  return (
    <section className="guide" id="guide">
      <h2 className="guide-title">{t.guideTitle}</h2>
      <p className="guide-intro">{t.guideIntro}</p>

      <div className="guide-block">
        <h3 className="guide-block-title">{t.guideWalletTitle}</h3>
        <p className="guide-block-body">{t.guideWalletBody}</p>
        <div className="wallet-grid">
          {wallets.map((w) => (
            <a className="wallet-card" href={w.url} target="_blank" rel="noreferrer" key={w.name}>
              <div className="wallet-card-name">{w.name}</div>
              <p className="wallet-card-body">{w.body}</p>
            </a>
          ))}
        </div>
        <p className="guide-note">⚠️ {t.guideWalletNote}</p>
      </div>

      <div className="guide-block">
        <h3 className="guide-block-title">{t.guideNetworkTitle}</h3>
        <p className="guide-block-body">{t.guideNetworkBody}</p>
        <dl className="network-details">
          <div>
            <dt>Network name</dt>
            <dd>Polygon Mainnet</dd>
          </div>
          <div>
            <dt>RPC URL</dt>
            <dd>https://polygon-rpc.com</dd>
          </div>
          <div>
            <dt>Chain ID</dt>
            <dd>137</dd>
          </div>
          <div>
            <dt>Currency symbol</dt>
            <dd>MATIC</dd>
          </div>
          <div>
            <dt>Explorer</dt>
            <dd>https://polygonscan.com</dd>
          </div>
        </dl>
      </div>

      <div className="guide-block">
        <h3 className="guide-block-title">{t.guideFundTitle}</h3>
        <p className="guide-block-body">{t.guideFundBody}</p>
      </div>

      <div className="guide-block">
        <h3 className="guide-block-title">{t.guideStepsTitle}</h3>
        <ol className="mint-steps-list">
          {mintSteps.map((s) => (
            <li key={s.n}>
              <span className="mint-step-num">{s.n}</span>
              <div>
                <div className="mint-step-title">{s.title}</div>
                <p className="mint-step-body">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="guide-block">
        <h3 className="guide-block-title">{t.guideViewTitle}</h3>
        <p className="guide-block-body">{t.guideViewBody}</p>
      </div>
    </section>
  );
}

function MintConsole({ wallet, onConnect }) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [supply, setSupply] = useState("");
  const [payMethod, setPayMethod] = useState("matic");
  const [status, setStatus] = useState({ text: "", kind: "" });
  const [deployedAddress, setDeployedAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function withSlippage(fee) {
    return fee + (fee * FEE_SLIPPAGE_BPS) / 10000n;
  }

  async function getSigner() {
    if (!window.ethereum) throw new Error(t.errNoWallet);
    const provider = new BrowserProvider(window.ethereum);
    
    // هماهنگ‌سازی اتوماتیک با شبکه پولیگان پیش از شروع تراکنش
    const network = await provider.getNetwork();
    if (network.chainId !== 137n) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: POLYGON_CHAIN_ID }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: POLYGON_CHAIN_ID,
              chainName: "Polygon Mainnet",
              nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
              rpcUrls: ["https://polygon-rpc.com"],
              blockExplorerUrls: ["https://polygonscan.com"],
            }],
          });
        } else {
          throw switchError;
        }
      }
    }

    // حل مشکل درخواست‌های معلق در متامسک (-32002)
    await window.ethereum.request({ 
      method: "eth_requestAccounts",
      params: []
    }).catch((err) => {
      if (err.code === -32002) {
        throw new Error("درخواست اتصال از قبل در متامسک باز است. لطفا افزونه خود را چک کنید.");
      }
      throw err;
    });

    return await provider.getSigner();
  }

  async function handleMint() {
    if (isLoading) return;
    try {
      if (!name || name.length > 50) throw new Error(t.errName);
      if (!symbol || symbol.length > 11) throw new Error(t.errSymbol);
      if (!supply || Number(supply) <= 0) throw new Error(t.errSupply);

      const contentCheck = checkTokenContent(name, symbol);
      if (!contentCheck.allowed) throw new Error(contentCheck.reason);

      setIsLoading(true);
      setDeployedAddress("");
      setStatus({ text: t.statusConnecting, kind: "" });
      
      const signer = await getSigner();
      const userAddress = await signer.getAddress();
      onConnect(userAddress);
      
      const factory = new Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
      const totalSupplyWei = parseUnits(supply, 18);

      let tx;
      if (payMethod === "matic") {
        const fee = await factory.feeInMatic();
        const maxFee = withSlippage(fee);
        setStatus({ text: t.statusSendingMatic, kind: "" });
        tx = await factory.createTokenWithMatic(name, symbol, totalSupplyWei, maxFee, {
          value: maxFee,
        });
      } else {
        const fee = await factory.feeInUsdt();
        const maxFee = withSlippage(fee);
        const usdt = new Contract(USDT_ADDRESS, ERC20_ABI, signer);
        
        // رفع باگ تأییدیه USDT پولیگان
        const currentAllowance = await usdt.allowance(userAddress, FACTORY_ADDRESS);
        if (currentAllowance > 0n) {
          setStatus({ text: "Resetting USDT allowance...", kind: "" });
          const resetTx = await usdt.approve(FACTORY_ADDRESS, 0);
          await resetTx.wait();
        }

        setStatus({ text: t.statusApprove, kind: "" });
        const approveTx = await usdt.approve(FACTORY_ADDRESS, maxFee);
        await approveTx.wait();
        
        setStatus({ text: t.statusSendingUsdt, kind: "" });
        tx = await factory.createTokenWithUsdt(name, symbol, totalSupplyWei, maxFee);
      }

      setStatus({ text: t.statusWaiting, kind: "" });
      const receipt = await tx.wait();

      // شیوه پایدار استخراج اِونت در اترز v6
      let foundAddress = "";
      for (const log of receipt.logs) {
        try {
          const parsedLog = factory.interface.parseLog({
            topics: [...log.topics],
            data: log.data,
          });
          if (parsedLog && parsedLog.name === "TokenCreated") {
            foundAddress = parsedLog.args.tokenAddress;
            break;
          }
        } catch {
          // نادیده گرفتن سایر لاگ‌ها
        }
      }

      if (foundAddress) setDeployedAddress(foundAddress);
      setStatus({ text: t.statusSuccess, kind: "success" });
    } catch (err) {
      console.error(err);
      setStatus({ text: `${t.statusError}: ${err.reason || err.message}`, kind: "error" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="console">
      <div className="panel">
        <h2 className="panel-title">{t.formTitle}</h2>

        <div className="field">
          <label>{t.nameLabel}</label>
          <input
            value={name}
            maxLength={50}
            disabled={isLoading}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.namePlaceholder}
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label>{t.symbolLabel}</label>
            <input
              value={symbol}
              maxLength={11}
              disabled={isLoading}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder={t.symbolPlaceholder}
            />
          </div>
          <div className="field">
            <label>{t.supplyLabel}</label>
            <input 
              value={supply} 
              disabled={isLoading}
              onChange={(e) => setSupply(e.target.value)} 
              placeholder={t.supplyPlaceholder} 
            />
          </div>
        </div>

        <div className="field">
          <label>{t.paymentLabel}</label>
          <div className="pay-toggle">
            <div
              className={`pay-option ${payMethod === "matic" ? "active" : ""} ${isLoading ? "disabled" : ""}`}
              onClick={() => !isLoading && setPayMethod("matic")}
            >
              {t.payMatic}
            </div>
            <div
              className={`pay-option ${payMethod === "usdt" ? "active" : ""} ${isLoading ? "disabled" : ""}`}
              onClick={() => !isLoading && setPayMethod("usdt")}
            >
              {t.payUsdt}
            </div>
          </div>
        </div>

        <button className="mint-btn" onClick={handleMint} disabled={isLoading}>
          {isLoading ? "..." : t.mintButton}
        </button>

        {status.text && <p className={`status-line ${status.kind}`}>{status.text}</p>}
        {deployedAddress && (
          <div>
            <p className="status-line">{t.resultAddressLabel}</p>
            <div className="result-address">{deployedAddress}</div>
          </div>
        )}
      </div>

      <div className="panel">
        <CoinSeal name={name} symbol={symbol} />
      </div>
    </section>
  );
}

function Shell() {
  const { dir, lang, t } = useLanguage();
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.body.dir = dir;
  }, [lang, dir]);

  // سیستم هوشمند گوش دادن به وضعیت کیف پول و Auto-Connect
  useEffect(() => {
    if (window.ethereum) {
      const provider = new BrowserProvider(window.ethereum);
      
      // بررسی اتصال‌های از قبل انجام شده (حل باگ نیاز به کلیک مداوم)
      provider.listAccounts().then((accounts) => {
        if (accounts.length > 0) {
          setWallet(accounts[0].address);
        }
      }).catch(console.error);

      const handleAccounts = (accounts) => {
        setWallet(accounts[0] || null);
      };
      
      window.ethereum.on("accountsChanged", handleAccounts);
      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccounts);
      };
    }
  }, []);

  async function connect() {
    try {
      if (!window.ethereum) {
        // هدایت مستقیم به دانلود ولت در صورت عدم وجود افزونه
        window.open("https://metamask.io/download/", "_blank");
        return;
      }
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      if (accounts.length > 0) {
        setWallet(accounts[0]);
      }
    } catch (err) {
      console.error("Connection rejected:", err);
    }
  }

  return (
    <div className="app" dir={dir}>
      <div className="container">
        <Header wallet={wallet} onConnect={connect} />
        <Hero />
        <MintConsole wallet={wallet} onConnect={setWallet} />
        <TokenList />
        <Steps />
        <Guide />
        <ListingGuide />
      </div>
      <footer className="footer">
        {t.footerNote}
        <div style={{ marginTop: "8px" }}>
          📧 <a href="mailto:ammm37474@gmail.com">ammm37474@gmail.com</a>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <Shell />
    </LanguageProvider>
  );
}
