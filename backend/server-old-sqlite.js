// backend/server.js
// بک‌اند ساده برای ثبت لاگ توکن‌های ساخته‌شده و ارائه API تاریخچه
// این سرویس فقط "گوش می‌دهد" به رویدادهای زنجیره؛ هرگز کلید خصوصی یا دارایی کاربران را مدیریت نمی‌کند.

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const { JsonRpcProvider, Contract } = require("ethers");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const RPC_URL = process.env.POLYGON_RPC_URL || "https://polygon-rpc.com";
const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS;

if (!FACTORY_ADDRESS) {
  console.error("خطا: متغیر محیطی FACTORY_ADDRESS تنظیم نشده است.");
  process.exit(1);
}

const FACTORY_ABI = [
  "event TokenCreated(address indexed creator, address indexed tokenAddress, string name, string symbol, uint256 totalSupply, string paymentMethod)",
];

// --- دیتابیس ---
const db = new Database("token_history.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator TEXT NOT NULL,
    token_address TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    total_supply TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    tx_hash TEXT NOT NULL,
    block_number INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_creator ON tokens(creator);

  CREATE TABLE IF NOT EXISTS sync_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    last_block INTEGER NOT NULL
  );
`);

const insertToken = db.prepare(`
  INSERT OR IGNORE INTO tokens
  (creator, token_address, name, symbol, total_supply, payment_method, tx_hash, block_number, created_at)
  VALUES (@creator, @tokenAddress, @name, @symbol, @totalSupply, @paymentMethod, @txHash, @blockNumber, @createdAt)
`);

const getLastBlock = db.prepare("SELECT last_block FROM sync_state WHERE id = 1");
const setLastBlock = db.prepare(`
  INSERT INTO sync_state (id, last_block) VALUES (1, ?)
  ON CONFLICT(id) DO UPDATE SET last_block = excluded.last_block
`);

// --- اتصال به زنجیره ---
const provider = new JsonRpcProvider(RPC_URL);
const factory = new Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);

/// گوش دادن زنده به رویدادهای جدید
factory.on("TokenCreated", async (creator, tokenAddress, name, symbol, totalSupply, paymentMethod, event) => {
  try {
    const block = await event.getBlock();
    insertToken.run({
      creator,
      tokenAddress,
      name,
      symbol,
      totalSupply: totalSupply.toString(),
      paymentMethod,
      txHash: event.log.transactionHash,
      blockNumber: event.log.blockNumber,
      createdAt: block.timestamp,
    });
    setLastBlock.run(event.log.blockNumber);
    console.log(`[event] توکن جدید ثبت شد: ${name} (${symbol}) -> ${tokenAddress}`);
  } catch (err) {
    console.error("خطا در ثبت رویداد:", err);
  }
});

/// همگام‌سازی رویدادهای گذشته (backfill) هنگام روشن‌شدن سرویس
async function backfillPastEvents() {
  const row = getLastBlock.get();
  const currentBlock = await provider.getBlockNumber();
  // اگر برای اولین بار اجرا می‌شود، از بلاک دیپلوی فکتوری شروع کنید (در .env تنظیم کنید)
  const fromBlock = row ? row.last_block + 1 : Number(process.env.FACTORY_DEPLOY_BLOCK || 0);

  if (fromBlock > currentBlock) return;

  console.log(`در حال همگام‌سازی رویدادهای بلاک ${fromBlock} تا ${currentBlock}...`);

  // برای جلوگیری از timeout در RPC، در دسته‌های ۲۰۰۰ بلاکی پیش می‌رویم
  const CHUNK = 10;
  for (let start = fromBlock; start <= currentBlock; start += CHUNK) {
    const end = Math.min(start + CHUNK - 1, currentBlock);
    const events = await factory.queryFilter(factory.filters.TokenCreated(), start, end);

    for (const event of events) {
      const block = await event.getBlock();
      insertToken.run({
        creator: event.args.creator,
        tokenAddress: event.args.tokenAddress,
        name: event.args.name,
        symbol: event.args.symbol,
        totalSupply: event.args.totalSupply.toString(),
        paymentMethod: event.args.paymentMethod,
        txHash: event.transactionHash,
        blockNumber: event.blockNumber,
        createdAt: block.timestamp,
      });
    }
    setLastBlock.run(end);
  }
  console.log("همگام‌سازی کامل شد.");
}

// --- API ---

/// تاریخچه کامل توکن‌های ساخته‌شده (صفحه‌بندی‌شده)
app.get("/api/tokens", (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;
  const rows = db
    .prepare("SELECT * FROM tokens ORDER BY block_number DESC LIMIT ? OFFSET ?")
    .all(limit, offset);
  res.json({ tokens: rows, limit, offset });
});

/// تاریخچه توکن‌های ساخته‌شده توسط یک کیف پول خاص
app.get("/api/tokens/by-creator/:address", (req, res) => {
  const rows = db
    .prepare("SELECT * FROM tokens WHERE creator = ? COLLATE NOCASE ORDER BY block_number DESC")
    .all(req.params.address);
  res.json({ tokens: rows });
});

/// جزئیات یک توکن با آدرس قراردادش
app.get("/api/tokens/:tokenAddress", (req, res) => {
  const row = db
    .prepare("SELECT * FROM tokens WHERE token_address = ? COLLATE NOCASE")
    .get(req.params.tokenAddress);
  if (!row) return res.status(404).json({ error: "توکن یافت نشد" });
  res.json(row);
});

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, async () => {
  console.log(`بک‌اند روی پورت ${PORT} در حال اجراست`);
  await backfillPastEvents();
});
