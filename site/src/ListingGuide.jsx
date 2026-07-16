import { useLanguage } from "./i18n.jsx";

export default function ListingGuide() {
  const { t } = useLanguage();

  const dexSteps = [
    { n: "1", title: t.dexStep1, body: t.dexStep1Body },
    { n: "2", title: t.dexStep2, body: t.dexStep2Body },
    { n: "3", title: t.dexStep3, body: t.dexStep3Body },
    { n: "4", title: t.dexStep4, body: t.dexStep4Body },
  ];

  const dexes = [
    { name: "QuickSwap", url: "https://quickswap.exchange" },
    { name: "Uniswap", url: "https://app.uniswap.org" },
  ];

  const cexList = [
    { name: "Binance", url: "https://www.binance.com" },
    { name: "KuCoin", url: "https://www.kucoin.com" },
    { name: "Gate.io", url: "https://www.gate.io" },
    { name: "MEXC", url: "https://www.mexc.com" },
  ];

  const cexRequirements = [t.cexReq1, t.cexReq2, t.cexReq3, t.cexReq4];
  const cexSteps = [
    { n: "1", body: t.cexStep1 },
    { n: "2", body: t.cexStep2 },
    { n: "3", body: t.cexStep3 },
  ];

  return (
    <section className="guide" id="listing">
      <h2 className="guide-title">{t.listingTitle}</h2>
      <p className="guide-intro">{t.listingIntro}</p>

      {/* --- DEX --- */}
      <div className="guide-block">
        <h3 className="guide-block-title">{t.dexTitle}</h3>
        <p className="guide-block-body">{t.dexIntro}</p>

        <div className="wallet-grid two-col">
          {dexes.map((d) => (
            <a className="wallet-card" href={d.url} target="_blank" rel="noreferrer" key={d.name}>
              <div className="wallet-card-name">{d.name}</div>
            </a>
          ))}
        </div>

        <ol className="mint-steps-list">
          {dexSteps.map((s) => (
            <li key={s.n}>
              <span className="mint-step-num">{s.n}</span>
              <div>
                <div className="mint-step-title">{s.title}</div>
                <p className="mint-step-body">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <p className="guide-note">💡 {t.dexNote}</p>
      </div>

      {/* --- CEX --- */}
      <div className="guide-block">
        <h3 className="guide-block-title">{t.cexTitle}</h3>
        <p className="guide-block-body">{t.cexIntro}</p>

        <div className="wallet-grid two-col">
          {cexList.map((c) => (
            <a className="wallet-card" href={c.url} target="_blank" rel="noreferrer" key={c.name}>
              <div className="wallet-card-name">{c.name}</div>
            </a>
          ))}
        </div>

        <h4 className="listing-subhead">{t.cexReqTitle}</h4>
        <ul className="req-list">
          {cexRequirements.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>

        <h4 className="listing-subhead">{t.cexStepsTitle}</h4>
        <ol className="mint-steps-list">
          {cexSteps.map((s) => (
            <li key={s.n}>
              <span className="mint-step-num">{s.n}</span>
              <p className="mint-step-body">{s.body}</p>
            </li>
          ))}
        </ol>

        <p className="guide-note warning">⚠️ {t.cexWarning}</p>
      </div>

      {/* --- Aggregators --- */}
      <div className="guide-block">
        <h3 className="guide-block-title">{t.aggregatorTitle}</h3>
        <p className="guide-block-body">{t.aggregatorBody}</p>
        <div className="wallet-grid two-col">
          <a className="wallet-card" href="https://www.coingecko.com" target="_blank" rel="noreferrer">
            <div className="wallet-card-name">CoinGecko</div>
          </a>
          <a className="wallet-card" href="https://coinmarketcap.com" target="_blank" rel="noreferrer">
            <div className="wallet-card-name">CoinMarketCap</div>
          </a>
        </div>
      </div>
    </section>
  );
}
