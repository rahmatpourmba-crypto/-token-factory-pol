import { useEffect, useState, useCallback } from "react";
import { JsonRpcProvider, Contract } from "ethers";
import { useLanguage } from "./i18n.jsx";

const FACTORY_ADDRESS = "0x7DEAfCf7B5998F68250bCa1704246380177CEAF6";
const FACTORY_DEPLOY_BLOCK = 90266546;
const RPC_URL = "https://polygon-mainnet.g.alchemy.com/v2/k_77vHLXWuy1ZF9AQCxGf";

const FACTORY_ABI = [
  "event TokenCreated(address indexed creator, address indexed tokenAddress, string name, string symbol, uint256 totalSupply, string paymentMethod)",
];

const CACHE_KEY = "tf_token_cache_v1";

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return { lastBlock: FACTORY_DEPLOY_BLOCK - 1, tokens: [] };
    return JSON.parse(raw);
  } catch {
    return { lastBlock: FACTORY_DEPLOY_BLOCK - 1, tokens: [] };
  }
}

function saveCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore quota errors
  }
}

async function fetchLogsAdaptive(factory, fromBlock, toBlock, onProgress) {
  const results = [];
  let start = fromBlock;
  let chunk = 2000;

  while (start <= toBlock) {
    const end = Math.min(start + chunk - 1, toBlock);
    try {
      const events = await factory.queryFilter(factory.filters.TokenCreated(), start, end);
      results.push(...events);
      onProgress?.(end, toBlock);
      start = end + 1;
      if (chunk < 2000) chunk = Math.min(chunk * 2, 2000);
    } catch (err) {
      if (chunk <= 5) {
        start = end + 1;
        continue;
      }
      chunk = Math.max(5, Math.floor(chunk / 4));
    }
  }
  return results;
}

export default function TokenList() {
  const { t, dir } = useLanguage();
  const [tokens, setTokens] = useState(() => loadCache().tokens);
  const [loading, setLoading] = useState(true);
  const [progressText, setProgressText] = useState("");

  const sync = useCallback(async () => {
    setLoading(true);
    try {
      const provider = new JsonRpcProvider(RPC_URL);
      const factory = new Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
      const cache = loadCache();
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = cache.lastBlock + 1;

      if (fromBlock <= currentBlock) {
        const events = await fetchLogsAdaptive(factory, fromBlock, currentBlock, (done, total) => {
          setProgressText(`${done - FACTORY_DEPLOY_BLOCK} / ${total - FACTORY_DEPLOY_BLOCK}`);
        });

        const newTokens = events.map((e) => ({
          creator: e.args.creator,
          tokenAddress: e.args.tokenAddress,
          name: e.args.name,
          symbol: e.args.symbol,
          totalSupply: e.args.totalSupply.toString(),
          paymentMethod: e.args.paymentMethod,
          blockNumber: e.blockNumber,
          txHash: e.transactionHash,
        }));

        const merged = [...cache.tokens, ...newTokens];
        const dedup = Array.from(new Map(merged.map((tk) => [tk.tokenAddress, tk])).values());
        dedup.sort((a, b) => b.blockNumber - a.blockNumber);

        saveCache({ lastBlock: currentBlock, tokens: dedup });
        setTokens(dedup);
      }
    } catch (err) {
      console.error("Token list sync failed:", err);
    } finally {
      setLoading(false);
      setProgressText("");
    }
  }, []);

  useEffect(() => {
    sync();
  }, [sync]);

  return (
    <section className="token-list" id="listing" dir={dir}>
      <h2 className="guide-title">
        {t?.tokenListTitle || "Created Tokens"}
      </h2>
      {loading && (
        <p className="guide-intro">
          {t?.tokenListLoading || "Loading tokens from blockchain..."} {progressText}
        </p>
      )}
      {!loading && tokens.length === 0 && (
        <p className="guide-intro">{t?.tokenListEmpty || "No tokens created yet."}</p>
      )}
      {!loading && tokens.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "start", padding: "8px" }}>Name</th>
                <th style={{ textAlign: "start", padding: "8px" }}>Symbol</th>
                <th style={{ textAlign: "start", padding: "8px" }}>Supply</th>
                <th style={{ textAlign: "start", padding: "8px" }}>Address</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((tk) => (
                <tr key={tk.tokenAddress}>
                  <td style={{ padding: "8px" }}>{tk.name}</td>
                  <td style={{ padding: "8px" }}>{tk.symbol}</td>
                  <td style={{ padding: "8px" }}>{tk.totalSupply}</td>
                  <td style={{ padding: "8px" }}>
                    
                      href={`https://polygonscan.com/token/${tk.tokenAddress}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {tk.tokenAddress.slice(0, 6)}…{tk.tokenAddress.slice(-4)}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
