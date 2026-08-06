import { ARTICLES } from "./articles.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/stats") {
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      const month = today.slice(0, 7);
      const year = today.slice(0, 4);
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const seenKey = `seen:${today}:${ip}`;
      const seen = await env.STATS.get(seenKey);
      if (!seen) {
        await env.STATS.put(seenKey, "1", { expirationTtl: 172800 });
        await incr(env.STATS, `visits:${today}`);
        await incr(env.STATS, `visits:${month}`);
        await incr(env.STATS, `visits:${year}`);
        await incr(env.STATS, "visits:total");
      }
      const [todayN, monthN, yearN, totalN] = await Promise.all([
        env.STATS.get(`visits:${today}`),
        env.STATS.get(`visits:${month}`),
        env.STATS.get(`visits:${year}`),
        env.STATS.get("visits:total"),
      ]);
      return new Response(JSON.stringify({
        today: Number(todayN || 0),
        month: Number(monthN || 0),
        year: Number(yearN || 0),
        total: Number(totalN || 0),
      }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store",
        },
      });
    }
    if (url.pathname === "/robots.txt") {
      return new Response("User-agent: *\nAllow: /\nSitemap: https://ploymint.polyganfactorytoken.workers.dev/sitemap.xml\n", {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
    if (url.pathname === "/googled8bfe5d22243d68d.html") {
      return new Response("google-site-verification: googled8bfe5d22243d68d.html", {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    if (url.pathname === "/sitemap.xml") {
      const today = new Date().toISOString().slice(0, 10);
      const url = (loc, freq, prio) =>
        `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${prio}</priority>\n  </url>`;
      const urls = [
        url("https://ploymint.polyganfactorytoken.workers.dev/", "daily", "1.0"),
        ...ARTICLES.map(a => url(`https://ploymint.polyganfactorytoken.workers.dev/article/${slugify(a.titleEn)}`, "monthly", "0.7")),
      ];
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;
      return new Response(sitemap, {
        headers: { "Content-Type": "application/xml; charset=utf-8" },
      });
    }
    if (url.pathname.startsWith("/article/")) {
      const lang = url.searchParams.get("lang") === "fa" ? "fa" : "en";
      const slug = decodeURIComponent(url.pathname.slice("/article/".length).toLowerCase());
      if (slug === "today" || slug === "daily") {
        const todayArt = ARTICLES[articleIndexFor(new Date().toISOString().slice(0, 10))];
        return new Response("", { status: 301, headers: { Location: `/article/${slugify(todayArt.titleEn)}` } });
      }
      let art = ARTICLES.find(a => a.id.toLowerCase() === slug) || ARTICLES.find(a => slugify(a.titleEn) === slug);
      if (!art) {
        return new Response(renderNotFound(lang), { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } });
      }
      const canonical = `/article/${slugify(art.titleEn)}`;
      if (slug !== canonical.slice("/article/".length)) {
        return new Response("", { status: 301, headers: { Location: canonical } });
      }
      return new Response(renderArticlePage(art, canonical, lang), {
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600" },
      });
    }
    if (url.pathname === "/api/logo" && request.method === "POST") {
      try {
        const body = await request.json();
        const name = (body.name || "Token").slice(0, 30);
        const symbol = (body.symbol || "").slice(0, 10);
        const style = (body.style || "cinematic").slice(0, 20);
        const styleMap = {
          cinematic: "cinematic, ultra realistic, dramatic lighting, high detail 8k",
          minimal: "minimalist flat design, clean vector style, solid background",
          neon: "neon glowing style, cyberpunk, purple and pink neon lights, dark background",
          gold: "luxury gold 3d render, metallic, premium, dark elegant background",
          cartoon: "cute cartoon mascot style, vibrant colors, playful, sticker design",
          space: "cosmic space theme, galaxy background, stars, nebula, epic",
        };
        const stylePrompt = styleMap[style] || styleMap.cinematic;
        const prompt = `A professional cryptocurrency token logo for a coin called "${name}" (symbol ${symbol}). ${stylePrompt}. The logo should feature the token symbol prominently, round badge shape, centered composition, suitable as a profile picture for a blockchain token.`;
        const aiResp = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.CF_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt, steps: 4 }),
        });
        const aiJson = await aiResp.json();
        if (!aiJson.success || !aiJson.result || !aiJson.result.image) {
          return new Response(JSON.stringify({ error: "AI generation failed", detail: JSON.stringify(aiJson).slice(0, 300) }), { status: 502, headers: { "Content-Type": "application/json" } });
        }
        const img = Uint8Array.from(atob(aiJson.result.image), c => c.charCodeAt(0));
        return new Response(img, {
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "no-store",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }
    if (url.pathname === "/api/articles") {
      const todayStr = new Date().toISOString().slice(0, 10);
      const reqDate = (url.searchParams.get("date") || "").match(/^\d{4}-\d{2}-\d{2}$/) ? url.searchParams.get("date") : null;

      const storedToday = await env.STATS.get("art:today");
      let todayEntry = null;
      try { const t = JSON.parse(storedToday || "null"); if (t && t.date === todayStr) todayEntry = t; } catch {}

      const todayIndex = todayEntry ? ARTICLES.findIndex(a => a.id === todayEntry.id) : articleIndexFor(todayStr);
      const todayIdx = todayIndex >= 0 ? todayIndex : articleIndexFor(todayStr);
      const todayArt = ARTICLES[todayIdx];

      let history = [];
      try { history = JSON.parse((await env.STATS.get("art:history")) || "[]"); } catch {}
      if (!history.length) {
        history = [];
        for (let back = 6; back >= 1; back--) {
          const d = new Date(Date.now() - back * 86400000).toISOString().slice(0, 10);
          const a = ARTICLES[articleIndexFor(d)];
          history.push({ date: d, id: a.id });
        }
      }
      const historyWithTitles = history.map(h => {
        const a = ARTICLES.find(x => x.id === h.id) || todayArt;
        return { date: h.date, id: a.id, slug: slugify(a.titleEn), topic: a.topic, titleFa: a.titleFa, titleEn: a.titleEn };
      });

      const pick = (a) => ({ date: todayStr, id: a.id, slug: slugify(a.titleEn), topic: a.topic, titleFa: a.titleFa, titleEn: a.titleEn, bodyFa: a.bodyFa, bodyEn: a.bodyEn, index: todayIdx });

      let extra = null;
      if (reqDate) {
        const a = ARTICLES[articleIndexFor(reqDate)];
        extra = { date: reqDate, id: a.id, slug: slugify(a.titleEn), topic: a.topic, titleFa: a.titleFa, titleEn: a.titleEn, bodyFa: a.bodyFa, bodyEn: a.bodyEn };
      }

      return new Response(JSON.stringify({ today: pick(todayArt), history: historyWithTitles, article: extra }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=300",
        },
      });
    }
    if (url.pathname === "/api/tweet" && request.method === "POST") {
      if (!env.TWEET_MANUAL_KEY) return new Response("not configured", { status: 500 });
      const body = await request.json().catch(() => ({}));
      if (body.key !== env.TWEET_MANUAL_KEY) return new Response("forbidden", { status: 403 });
      const todayStr = new Date().toISOString().slice(0, 10);
      const a = ARTICLES[articleIndexFor(todayStr)];
      const text = buildTweet(a);
      if (body.dry) return new Response(JSON.stringify({ text, chars: text.length }), {
        headers: { "Content-Type": "application/json" },
      });
      const ok = await tweetToday(env, todayStr, a);
      return new Response(JSON.stringify({ ok, text }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url.pathname === "/api/tg" && request.method === "POST") {
      if (!env.TG_BOT_TOKEN || !env.TG_CHANNEL) return new Response("not configured", { status: 500 });
      const body = await request.json().catch(() => ({}));
      if (body.key !== env.TG_MANUAL_KEY) return new Response("forbidden", { status: 403 });
      const todayStr = new Date().toISOString().slice(0, 10);
      const a = ARTICLES[articleIndexFor(todayStr)];
      const market = await fetchMarketData();
      const text = buildTgMessage(a, market);
      if (body.dry) return new Response(JSON.stringify({ text, market }), {
        headers: { "Content-Type": "application/json" },
      });
      const ok = await tgPostArticle(env, todayStr, a, !!body.force, market);
      return new Response(JSON.stringify({ ok, text }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url.pathname === "/api/video" && request.method === "POST") {
      if (!env.TG_BOT_TOKEN || !env.TG_CHANNEL || !env.CF_API_TOKEN) return new Response("not configured", { status: 500 });
      const body = await request.json().catch(() => ({}));
      if (body.key !== env.TG_MANUAL_KEY) return new Response("forbidden", { status: 403 });
      const todayStr = new Date().toISOString().slice(0, 10);
      const a = ARTICLES[articleIndexFor(todayStr)];
      const ratio = ["16:9", "9:16", "1:1", "4:3", "3:4"].includes(body.ratio) ? body.ratio : "9:16";
      const resolution = body.resolution === "1080P" ? "1080P" : "720P";
      const duration = Math.max(3, Math.min(15, Number(body.duration) || 5));
      const prompt = buildVideoPrompt(a, ratio);
      if (body.dry) return new Response(JSON.stringify({ prompt, ratio, resolution, duration, model: "alibaba/hh1-t2v" }), {
        headers: { "Content-Type": "application/json" },
      });
      const ok = await tgPostVideo(env, todayStr, a, { force: !!body.force, ratio, resolution, duration });
      return new Response(JSON.stringify({ ok, prompt }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url.pathname === "/api/image" && request.method === "POST") {
      try {
      if (!env.TG_BOT_TOKEN || !env.TG_CHANNEL || !env.CF_API_TOKEN) return new Response("not configured", { status: 500 });
      const body = await request.json().catch(() => ({}));
      if (body.key !== env.TG_MANUAL_KEY) return new Response("forbidden", { status: 403 });
      const todayStr = new Date().toISOString().slice(0, 10);
      const a = ARTICLES[articleIndexFor(todayStr)];
      if (body.dry) return new Response(JSON.stringify({ prompt: buildCardPrompt(a), caption: buildImageCaption(a) }), {
        headers: { "Content-Type": "application/json" },
      });
      const ok = await tgPostImage(env, todayStr, a, { force: !!body.force });
      return new Response(JSON.stringify({ ok }), {
        headers: { "Content-Type": "application/json" },
      });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message, stack: (e.stack || "").split("\n").slice(0, 3) }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }
    return env.ASSETS.fetch(request);
  },

  async scheduled(event, env, ctx) {
    const todayStr = new Date(event.scheduledTime || Date.now()).toISOString().slice(0, 10);
    const a = ARTICLES[articleIndexFor(todayStr)];
    await env.STATS.put("art:today", JSON.stringify({ date: todayStr, id: a.id }));
    let history = [];
    try { history = JSON.parse((await env.STATS.get("art:history")) || "[]"); } catch {}
    if (!history.length || history[history.length - 1].date !== todayStr) {
      history.push({ date: todayStr, id: a.id });
    }
    if (history.length > 60) history = history.slice(-60);
    await env.STATS.put("art:history", JSON.stringify(history));
    const jobs = [tweetToday(env, todayStr, a), tgPostArticle(env, todayStr, a), tgPostImage(env, todayStr, a)];
    await ctx.waitUntil(Promise.all(jobs));
  },
};

const EPOCH = Date.parse("2026-08-04T00:00:00Z");

function articleIndexFor(dateStr) {
  const day = Math.floor((Date.parse(dateStr + "T00:00:00Z") - EPOCH) / 86400000);
  return ((day % ARTICLES.length) + ARTICLES.length) % ARTICLES.length;
}

function buildTweet(art) {
  const teaser = art.bodyEn.replace(/\s+/g, " ").slice(0, 120).replace(/\s+\S*$/, "") + (art.bodyEn.length > 120 ? "…" : "");
  const link = `https://ploymint.polyganfactorytoken.workers.dev/article/${slugify(art.titleEn)}`;
  return `${art.titleEn}\n\n${teaser}\n\n🔗 ${link}\n\n#Polygon #Crypto #Halal #Blockchain #PolyMint`;
}

async function tweetToday(env, todayStr, art) {
  if (!env.TW_API_KEY || !env.TW_API_KEY_SECRET || !env.TW_ACCESS_TOKEN || !env.TW_ACCESS_TOKEN_SECRET) return "no-credentials";
  const last = await env.STATS.get("tw:last");
  if (last === todayStr) return "already-tweeted";
  const text = buildTweet(art);
  const res = await postTweet(env, text);
  if (res && res.ok) {
    await env.STATS.put("tw:last", todayStr);
    return "tweeted";
  }
  return `error:${res ? res.status : "no-response"}`;
}

async function postTweet(env, text) {
  const url = "https://api.x.com/2/tweets";
  const oauth = {
    oauth_consumer_key: env.TW_API_KEY,
    oauth_nonce: crypto.randomUUID().replace(/[^0-9a-zA-Z]/g, "").slice(0, 32),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: env.TW_ACCESS_TOKEN,
    oauth_version: "1.0",
  };
  const params = { ...oauth, text };
  const paramStr = Object.keys(params).sort().map(k => `${oauthEscape(k)}=${oauthEscape(params[k])}`).join("&");
  const baseString = `POST&${oauthEscape(url)}&${oauthEscape(paramStr)}`;
  const signingKey = `${oauthEscape(env.TW_API_KEY_SECRET)}&${oauthEscape(env.TW_ACCESS_TOKEN_SECRET)}`;
  const sig = await hmacSha1(signingKey, baseString);
  const header = Object.entries(oauth)
    .map(([k, v]) => `${oauthEscape(k)}="${oauthEscape(v)}"`)
    .concat([`oauth_signature="${oauthEscape(sig)}"`])
    .join(", ");
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `OAuth ${header}` },
    body: JSON.stringify({ text }),
  }).catch(() => null);
}

function oauthEscape(s) {
  return encodeURIComponent(s).replace(/[!'()*]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

async function hmacSha1(key, data) {
  const keyBuf = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", keyBuf, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function incr(kv, key) {
  const cur = await kv.get(key);
  await kv.put(key, String((Number(cur) || 0) + 1));
}

function slugify(s) {
  return s.toLowerCase()
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const ARTICLE_URL = art => `https://ploymint.polyganfactorytoken.workers.dev/article/${slugify(art.titleEn)}`;
const SITE_URL = "https://ploymint.polyganfactorytoken.workers.dev/";

function buildTgMessage(art, market) {
  const teaser = s => s.replace(/\s+/g, " ").slice(0, 200).replace(/\s+\S*$/, "") + (s.length > 200 ? "…" : "");
  const link = ARTICLE_URL(art);
  const date = new Date().toISOString().slice(0, 10);
  let msg = `📰 <b>PolyMint Crypto Daily</b>\n\n`;
  if (market && market.prices && market.prices.length) {
    msg += `📊 <b>MARKET UPDATE</b> — ${date}\n`;
    const order = { BTC: 0, ETH: 1, BNB: 2, SOL: 3, POL: 4 };
    const sorted = [...market.prices].sort((a, b) => (order[a.sym] ?? 9) - (order[b.sym] ?? 9));
    msg += sorted.map(p => `${p.change >= 0 ? "🟢" : "🔴"} <b>${p.sym}</b> $${fmtPrice(p.usd)}  <b>${p.change >= 0 ? "+" : ""}${p.change.toFixed(2)}%</b>`).join("\n");
    if (market.fng) msg += `\n\n😱 Fear &amp; Greed: <b>${market.fng.value}</b> (${market.fng.label})`;
    msg += `\n\n📈 <b>ANALYSIS</b>\n${buildAnalysis(market)}`;
    msg += `\n\n📌 <b>SIGNAL</b> (Educational)\n${buildSignal(market)}`;
    msg += `\n<i>⚠️ Not financial advice. DYOR.</i>`;
  }
  msg += `\n\n📚 <b>Today's Lesson</b>\n<b>${escapeHtml(art.titleEn)}</b>\n${teaser(art.bodyEn)}`;
  msg += `\n\n🔗 <a href="${link}">${link}</a>`;
  msg += `\n\n#Crypto #Bitcoin #Ethereum #Polygon #Analysis #MarketUpdate`;
  return msg;
}

async function fetchMarketData() {
  let prices;
  try {
    prices = await fetchPrices();
  } catch (e) {
    return { error: e.message, ok: false };
  }
  if (!prices || !prices.length) return { error: "no prices", ok: false };
  let fng = null;
  try {
    const fngRes = await fetch("https://api.alternative.me/fng/?limit=1");
    if (fngRes.ok) {
      const fngData = await fngRes.json();
      const f = fngData && fngData.data && fngData.data[0];
      if (f) fng = { value: Number(f.value), label: f.value_classification };
    }
  } catch {}
  return { prices, fng, avg: prices.reduce((s, p) => s + p.change, 0) / prices.length };
}

async function fetchPrices() {
  const report = [];
  const sources = [fetchCryptoCompare, fetchBybit, fetchOkx, fetchBinance, fetchCoinGecko];
  for (const src of sources) {
    try {
      const prices = await src();
      if (prices && prices.length) return prices;
      report.push(`${src.name}: empty`);
    } catch (e) {
      report.push(`${src.name}: ${e && e.message}`);
    }
  }
  const err = new Error("all price sources failed: " + report.join(" | "));
  err.report = report;
  throw err;
}

async function fetchCryptoCompare() {
  const res = await fetch("https://min-api.cryptocompare.com/data/pricemultifull?fsyms=BTC,ETH,SOL,BNB,POL&tsyms=USD", {
    headers: { "User-Agent": "Mozilla/5.0 PolyMintBot" },
  });
  if (!res.ok) throw new Error(`cryptocompare ${res.status}`);
  const d = await res.json();
  const syms = ["BTC", "ETH", "SOL", "BNB", "POL"];
  return syms.map(sym => {
    const u = d.RAW && d.RAW[sym] && d.RAW[sym].USD;
    return { sym, usd: u ? u.PRICE : 0, change: u && u.CHANGEPCT24HOUR != null ? u.CHANGEPCT24HOUR : 0 };
  }).filter(p => p.usd > 0);
}

async function fetchBybit() {
  const res = await fetch("https://api.bybit.com/v5/market/tickers?category=spot", {
    headers: { "User-Agent": "Mozilla/5.0 PolyMintBot" },
  });
  if (!res.ok) throw new Error(`bybit ${res.status}`);
  const d = await res.json();
  const map = { BTCUSDT: "BTC", ETHUSDT: "ETH", SOLUSDT: "SOL", BNBUSDT: "BNB", POLUSDT: "POL" };
  return (d.result && d.result.list || []).filter(t => map[t.symbol]).map(t => ({
    sym: map[t.symbol], usd: Number(t.lastPrice), change: Number(t.price24hPcnt) * 100,
  }));
}

async function fetchOkx() {
  const res = await fetch("https://www.okx.com/api/v5/market/tickers?instType=SPOT", {
    headers: { "User-Agent": "Mozilla/5.0 PolyMintBot" },
  });
  if (!res.ok) throw new Error(`okx ${res.status}`);
  const data = await res.json();
  const map = { "BTC-USDT": "BTC", "ETH-USDT": "ETH", "SOL-USDT": "SOL", "BNB-USDT": "BNB", "POL-USDT": "POL" };
  return (data.data || []).filter(t => map[t.instId]).map(t => {
    const last = Number(t.last), open = Number(t.open24h);
    return { sym: map[t.instId], usd: last, change: open > 0 ? ((last - open) / open) * 100 : 0 };
  });
}

async function fetchBinance() {
  const pairs = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "POLUSDT"];
  const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(pairs))}`, {
    headers: { "User-Agent": "Mozilla/5.0 PolyMintBot (+https://ploymint.polyganfactorytoken.workers.dev)" },
  });
  if (!res.ok) throw new Error(`binance ${res.status}`);
  const data = await res.json();
  const map = { BTCUSDT: "BTC", ETHUSDT: "ETH", SOLUSDT: "SOL", BNBUSDT: "BNB", POLUSDT: "POL" };
  return Array.isArray(data)
    ? data.filter(t => map[t.symbol]).map(t => ({ sym: map[t.symbol], usd: Number(t.lastPrice), change: Number(t.priceChangePercent) }))
    : null;
}

async function fetchCoinGecko() {
  const coins = "bitcoin,ethereum,solana,binancecoin,polygon-ecosystem-token";
  const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coins}&vs_currencies=usd&include_24hr_change=true`, {
    headers: { "User-Agent": "PolyMintBot/1.0 (+https://ploymint.polyganfactorytoken.workers.dev; contact rahmatpourmba@gmail.com)" },
  });
  if (!res.ok) throw new Error(`coingecko ${res.status}`);
  const data = await res.json();
  const map = { bitcoin: "BTC", ethereum: "ETH", solana: "SOL", binancecoin: "BNB", "polygon-ecosystem-token": "POL" };
  return Object.entries(map).map(([id, sym]) => ({ sym, usd: data[id] ? data[id].usd : 0, change: data[id] && data[id].usd_24h_change != null ? data[id].usd_24h_change : 0 }));
}

function buildAnalysis(market) {
  const { prices, fng, avg } = market;
  const btc = prices.find(p => p.sym === "BTC");
  const up = prices.filter(p => p.change > 0).length;
  let trend;
  if (avg > 1.5) trend = "broadly bullish, with strong buying pressure across major assets";
  else if (avg > 0) trend = "in positive territory, though gains are selective";
  else if (avg > -1.5) trend = "mixed, with cautious profit-taking in places";
  else trend = "under pressure, with a clear risk-off tone";
  let out = `Major assets are ${trend}. ${up}/${prices.length} of the top coins are in the green over the last 24h.`;
  if (btc) out += ` BTC leads around $${fmtPrice(btc.usd)} with a ${btc.change >= 0 ? "+" : ""}${btc.change.toFixed(2)}% move, acting as the market's lead indicator.`;
  if (fng) out += ` The Fear & Greed Index at ${fng.value} (${fng.label}) signals ${fng.value > 50 ? "growing confidence" : "trader caution"}.`;
  return out;
}

function buildSignal(market) {
  const { avg, fng } = market;
  const score = (fng ? (fng.value - 50) / 50 : 0) + (avg > 0 ? 0.3 : -0.3) + (avg > 3 ? 0.2 : avg < -3 ? -0.2 : 0);
  let tone;
  if (score > 0.4) tone = "🟢 Bullish — momentum favors the upside; scale in gradually, avoid chasing spikes.";
  else if (score > -0.1) tone = "🟡 Neutral — wait for confirmation before committing new capital.";
  else tone = "🔴 Defensive — reduce risk and keep dry powder for stronger entries.";
  return tone;
}

function fmtPrice(n) {
  if (n == null || isNaN(n)) return "n/a";
  if (n >= 1) return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n.toFixed(4);
}

async function tgPostArticle(env, todayStr, art, force, market) {
  try {
  if (!env.TG_BOT_TOKEN) return "no-credentials";
  const channels = [env.TG_CHANNEL, env.TG_CHANNEL2].filter(Boolean);
  if (!channels.length) return "no-credentials";
  const last = await env.STATS.get("tg:last");
  if (!force && last === todayStr) return "already-posted";
  const text = buildTgMessage(art, market || (await fetchMarketData()));
  const url = `https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`;
  const results = [];
  for (const chat_id of channels) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id,
        text,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: false, prefer_small_media: true },
        reply_markup: {
          inline_keyboard: [[
            { text: "📖 Read Article", url: ARTICLE_URL(art) },
            { text: "🌐 Visit Site", url: SITE_URL },
          ]],
        },
      }),
    }).catch(() => null);
    results.push(chat_id + ":" + (res && res.ok ? "ok" : res ? `error-${res.status}` : "no-response"));
  }
  const allOk = results.every(r => r.endsWith(":ok"));
  if (allOk) await env.STATS.put("tg:last", todayStr);
  return results.join(", ");
  } catch (e) {
    return `exception:${e && e.message}`;
  }
}

function buildVideoPrompt(art, ratio) {
  const topicFlavor = {
    basics: "crystal blocks assembling into a glowing blockchain chain, clean and educational",
    islamic: "golden coins and soft crescent light patterns flowing in harmony, elegant and serene",
    security: "a glowing digital vault with holographic shield layers rotating, deep blue and violet",
    market: "rising golden candlestick charts made of light particles in a dark futuristic exchange",
    mining: "shimmering energy cores and processor circuits glowing amber and gold, industrial futuristic",
  }[art.topic] || "glowing coins flowing through a futuristic blockchain network";
  return `Abstract 3D render, ${topicFlavor}, dark navy background, purple and gold neon accents, smooth cinematic camera motion, ultra polished, no text, no letters, high quality, ${ratio === "9:16" ? "vertical composition" : "landscape composition"}`;
}

async function genVideo(env, prompt, opts) {
  const aiResp = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/ai/run/alibaba/hh1-t2v`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${env.CF_API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, duration: opts.duration, ratio: opts.ratio, resolution: opts.resolution }),
  });
  if (!aiResp.ok) {
    const txt = await aiResp.text().catch(() => "");
    throw new Error(`ai-video ${aiResp.status} ${txt.slice(0, 200)}`);
  }
  const data = await aiResp.json();
  if (data && data.result && data.result.video) return data.result.video;
  if (data && data.errors) throw new Error("ai-video errors: " + JSON.stringify(data.errors).slice(0, 300));
  return null;
}

async function downloadBytes(url) {
  const res = await fetch(url);
  if (!res.ok) return null;
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

function multipartForm(fields, fileBytes, filename, contentType, fileField) {
  const boundary = "----PolyMint" + crypto.randomUUID().replace(/-/g, "");
  const parts = [];
  const enc = new TextEncoder();
  for (const [k, v] of Object.entries(fields)) {
    parts.push(enc.encode(`--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`));
  }
  parts.push(enc.encode(`--${boundary}\r\nContent-Disposition: form-data; name="${fileField || "video"}"; filename="${filename}"\r\nContent-Type: ${contentType || "video/mp4"}\r\n\r\n`));
  parts.push(fileBytes);
  parts.push(enc.encode(`\r\n--${boundary}--\r\n`));
  const body = new Blob(parts, { type: "multipart/form-data" });
  return { body, contentType: `multipart/form-data; boundary=${boundary}` };
}

async function tgPostVideo(env, todayStr, art, opts) {
  opts = opts || {};
  try {
    if (!env.TG_BOT_TOKEN) return "no-credentials";
    const channels = [env.TG_CHANNEL, env.TG_CHANNEL2].filter(Boolean);
    if (!channels.length) return "no-credentials";
    const last = await env.STATS.get("vid:last");
    if (!opts.force && last === todayStr) return "already-posted";
    const ratio = opts.ratio || "9:16";
    const resolution = opts.resolution || "720P";
    const duration = opts.duration || 5;
    const videoUrl = await genVideo(env, buildVideoPrompt(art, ratio), { ratio, resolution, duration });
    if (!videoUrl) return "video-gen-failed";
    const videoBytes = await downloadBytes(videoUrl);
    if (!videoBytes || !videoBytes.length) return "video-download-failed";
    const caption = `📰 <b>${escapeHtml(art.titleEn)}</b>\n\n🔗 <a href="${ARTICLE_URL(art)}">${ARTICLE_URL(art)}</a>\n\n#Polygon #Crypto #Daily`;
    const url = `https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendVideo`;
    const results = [];
    for (const chat_id of channels) {
      const fd = multipartForm({ chat_id, caption, parse_mode: "HTML", supports_streaming: "true" }, videoBytes, "daily.mp4", "video/mp4", "video");
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": fd.contentType },
        body: fd.body,
      }).catch(() => null);
      results.push(chat_id + ":" + (res && res.ok ? "ok" : res ? `error-${res.status}` : "no-response"));
    }
    const allOk = results.every(r => r.endsWith(":ok"));
    if (allOk) await env.STATS.put("vid:last", todayStr);
    return results.join(", ");
  } catch (e) {
    return `exception:${e && e.message}`;
  }
}

function buildCardPrompt(art) {
  const topicFlavor = {
    basics: "glowing crystal blockchain chain, clean and modern",
    islamic: "golden coins and soft crescent light, elegant and serene",
    security: "holographic digital vault with glowing shield, deep blue",
    market: "rising candlestick charts from light particles, futuristic exchange",
    mining: "glowing energy cores and circuits, amber and gold",
  }[art.topic] || "glowing coins in a futuristic blockchain network";
  return `Vertical social media poster background for a cryptocurrency news channel, ${topicFlavor}, dark navy gradient, purple and gold neon glow, smooth glossy coins, subtle light bokeh, cinematic lighting, ultra high quality, no text, no letters, no watermark`;
}

function buildImageCaption(art) {
  const teaser = art.bodyEn.replace(/\s+/g, " ").slice(0, 140).replace(/\s+\S*$/, "") + (art.bodyEn.length > 140 ? "…" : "");
  return `📰 <b>PolyMint Crypto Daily</b>\n\n<b>${escapeHtml(art.titleEn)}</b>\n${teaser}\n\n🔗 <a href="${ARTICLE_URL(art)}">${ARTICLE_URL(art)}</a>\n\n#Polygon #Crypto #Daily`;
}

async function genImageCard(env, art) {
  const aiResp = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${env.CF_API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: buildCardPrompt(art), steps: 4 }),
  });
  if (!aiResp.ok) throw new Error(`ai-card ${aiResp.status}`);
  const aiJson = await aiResp.json();
  if (!aiJson.success || !aiJson.result || !aiJson.result.image) return null;
  return Uint8Array.from(atob(aiJson.result.image), c => c.charCodeAt(0));
}

async function tgPostImage(env, todayStr, art, opts) {
  opts = opts || {};
  try {
    if (!env.TG_BOT_TOKEN || !env.CF_API_TOKEN) return "no-credentials";
    const channels = [env.TG_CHANNEL, env.TG_CHANNEL2].filter(Boolean);
    if (!channels.length) return "no-credentials";
    const last = await env.STATS.get("img:last");
    if (!opts.force && last === todayStr) return "already-posted";
    const imgBytes = await genImageCard(env, art);
    if (!imgBytes || !imgBytes.length) return "image-gen-failed";
    const caption = buildImageCaption(art);
    const url = `https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendPhoto`;
    const results = [];
    for (const chat_id of channels) {
      const fd = multipartForm({
        chat_id,
        caption,
        parse_mode: "HTML",
        reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "📖 Read Article", url: ARTICLE_URL(art) }, { text: "🌐 Visit Site", url: SITE_URL }]] }),
      }, imgBytes, "daily.png", "image/png", "photo");
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": fd.contentType },
        body: fd.body,
      }).catch(() => null);
      results.push(chat_id + ":" + (res && res.ok ? "ok" : res ? `error-${res.status}` : "no-response"));
    }
    const allOk = results.every(r => r.endsWith(":ok"));
    if (allOk) await env.STATS.put("img:last", todayStr);
    return results.join(", ");
  } catch (e) {
    return `exception:${e && e.message}`;
  }
}
const TOPIC_EN = { basics: "Blockchain Basics", islamic: "Islamic Finance", security: "Security", market: "News & Use Cases", mining: "Mining & Halal Income" };
const TOPIC_FA = { basics: "آموزش پایه", islamic: "اقتصاد اسلامی", security: "امنیت", market: "اخبار و کاربردها", mining: "ماینینگ و کسب حلال" };
const TOPIC_COLORS = { basics: "#8b5cf6", islamic: "#22c55e", security: "#ef4444", market: "#3b82f6", mining: "#f59e0b" };

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderArticlePage(art, canonical, lang) {
  const fa = lang === "fa";
  const title = fa ? art.titleFa : art.titleEn;
  const body = fa ? art.bodyFa : art.bodyEn;
  const topicName = (fa ? TOPIC_FA : TOPIC_EN)[art.topic] || art.topic;
  const topicColor = TOPIC_COLORS[art.topic] || "#8b5cf6";
  const desc = (fa ? art.bodyFa : art.bodyEn).replace(/\n+/g, " ").slice(0, 160);
  const url = "https://ploymint.polyganfactorytoken.workers.dev" + canonical;
  const todayDate = new Date().toISOString().slice(0, 10);
  const paragraphs = body.split("\n\n").map(p => `<p>${escapeHtml(p)}</p>`).join("");
  const disclaimer = fa
    ? "این مقاله صرفاً جنبه اطلاع‌رسانی و آموزشی دارد و فتوای شرعی نیست. برای مسائل مالی، با عالم دینی یا نهاد فقهی معتبر مشورت کنید."
    : "This article is for educational and informational purposes only and is not a religious fatwa. For financial matters, consult a qualified scholar or reputable fiqh institution.";
  const readAnother = fa ? "مطالعه مقاله دیگر" : "Read Another Article";
  const homeCta = fa ? "ساخت توکن با PolyMint" : "Create a Token with PolyMint";
  const otherLinks = ARTICLES.slice(0, 6).map(a =>
    `<a href="/article/${slugify(a.titleEn)}">${escapeHtml(fa ? a.titleFa : a.titleEn)}</a>`
  ).join("\n    ");

  return `<!doctype html>
<html lang="${lang}" dir="${fa ? "rtl" : "ltr"}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} | PolyMint</title>
  <meta name="description" content="${escapeHtml(desc)}" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${url}" />
  <link rel="alternate" hreflang="en" href="${url}" />
  <link rel="alternate" hreflang="fa" href="${url}?lang=fa" />
  <link rel="alternate" hreflang="x-default" href="${url}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="PolyMint" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(desc)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="https://ploymint.polyganfactorytoken.workers.dev/og.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="article:section" content="${escapeHtml(topicName)}" />
  <meta property="article:published_time" content="${todayDate}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(desc)}" />
  <meta name="twitter:image" content="https://ploymint.polyganfactorytoken.workers.dev/og.png" />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": ${JSON.stringify(title)},
    "description": ${JSON.stringify(desc)},
    "image": "https://ploymint.polyganfactorytoken.workers.dev/og.png",
    "datePublished": "${todayDate}",
    "inLanguage": "${lang}",
    "articleSection": ${JSON.stringify(topicName)},
    "author": { "@type": "Organization", "name": "PolyMint" },
    "publisher": { "@type": "Organization", "name": "PolyMint" },
    "mainEntityOfPage": { "@type": "WebPage", "@id": "${url}" }
  }
  </script>
  <style>
    body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;background:#030712;color:#e5e7eb;line-height:1.8}
    .top{background:linear-gradient(90deg,#7c3aed,#ec4899);padding:14px 24px;display:flex;justify-content:space-between;align-items:center}
    .top a{color:#fff;font-weight:700;text-decoration:none;font-size:18px}
    .top .cta{background:#fff;color:#7c3aed;padding:8px 16px;border-radius:10px;font-size:14px;font-weight:700}
    main{max-width:760px;margin:0 auto;padding:32px 20px 60px}
    .tag{display:inline-block;padding:4px 14px;border-radius:999px;font-size:13px;font-weight:700;color:#fff;background:${topicColor};margin-bottom:14px}
    h1{font-size:32px;line-height:1.3;margin:0 0 10px;color:#fff}
    .meta{color:#9ca3af;font-size:14px;margin-bottom:24px}
    p{font-size:17px;color:#d1d5db;margin:0 0 18px}
    .disclaimer{background:#78350f22;border:1px solid #d9770633;border-radius:12px;padding:14px 18px;font-size:14px;color:#fcd34d;margin:28px 0}
    .more{background:#111827;border:1px solid #374151;border-radius:12px;padding:18px}
    .more h3{margin:0 0 10px;font-size:15px;color:#c4b5fd}
    .more a{display:block;color:#a78bfa;text-decoration:none;font-size:15px;padding:5px 0}
    .more a:hover{text-decoration:underline}
    .foot{text-align:center;color:#6b7280;font-size:13px;padding:24px}
    .tg-cta{display:block;margin:28px 0;padding:16px 20px;border-radius:14px;background:linear-gradient(90deg,#7c3aed22,#ec489922);border:1px solid #a78bfa55;text-decoration:none}
    .tg-cta .t1{color:#c4b5fd;font-weight:700;font-size:16px}
    .tg-cta .t2{color:#9ca3af;font-size:13px;margin-top:4px}
  </style>
</head>
<body>
  <div class="top">
    <a href="/">PolyMint</a>
    <a class="cta" href="/">${homeCta}</a>
  </div>
  <main>
    <span class="tag">${escapeHtml(topicName)}</span>
    <h1>${escapeHtml(title)}</h1>
    <div class="meta">📅 ${todayDate} \u2022 ${fa ? "منتشر شده" : "Published"} \u2022 PolyMint</div>
    ${paragraphs}
    <a class="tg-cta" href="https://t.me/polymint_crypto" target="_blank" rel="noopener noreferrer">
      <span class="t1">✈️ ${fa ? "هر روز یک آموزش رایگان در تلگرام" : "Get a free daily lesson on Telegram"}</span>
      <span class="t2">${fa ? "عضویت در کانال پلی‌مینت کریپتو" : "Join PolyMint Crypto channel"} \u2192</span>
    </a>
    <div class="disclaimer">⚠️ ${escapeHtml(disclaimer)}</div>
    <div class="more">
      <h3>${readAnother}</h3>
      ${otherLinks}
    </div>
  </main>
  <div class="foot">PolyMint \u2014 ${fa ? "ساخت توکن ERC-20 روی Polygon بدون کدنویسی" : "Create ERC-20 tokens on Polygon without coding"}</div>
</body>
</html>`;
}

function renderNotFound(lang) {
  const fa = lang === "fa";
  return `<!doctype html>
<html lang="${lang}">
<head><meta charset="utf-8" /><title>404 | PolyMint</title>
<meta name="robots" content="noindex" />
<style>body{background:#030712;color:#e5e7eb;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center}div{max-width:420px}a{color:#a78bfa}</style>
</head>
<body><div><h1>404</h1><p>${fa ? "مقاله پیدا نشد" : "Article not found"}</p><a href="/">${fa ? "بازگشت به خانه" : "Back to home"}</a></div></body>
</html>`;
}
