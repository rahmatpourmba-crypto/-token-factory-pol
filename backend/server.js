require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { ethers } = require('ethers');

const app = express();

// تنظیمات Middleware
app.use(cors());
app.use(express.json());

<<<<<<< HEAD
// تنظیمات پورت و متغیرهای محیطی
const PORT = process.env.PORT || 3000;
const RPC_URL = process.env.POLYGON_RPC_URL || "https://polygon-rpc.com";
const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS;
const DATABASE_URL = process.env.DATABASE_URL;

// بررسی وجود متغیرهای حیاتی
if (!FACTORY_ADDRESS || !DATABASE_URL) {
  console.error("Error: FACTORY_ADDRESS or DATABASE_URL is not set.");
  process.exit(1);
}

const FACTORY_ABI = [
  "event TokenCreated(address indexed creator, address indexed tokenAddress, string name, string symbol, uint256 totalSupply, string paymentMethod)",
];

// اتصال به دیتابیس
=======
// تنظیمات دیتابیس (استفاده از DATABASE_URL از محیط)
>>>>>>> ace9832866424f1b6095f0771909786366e3135f
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

<<<<<<< HEAD
// توابع کمکی دیتابیس
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tokens (
      id SERIAL PRIMARY KEY,
      creator TEXT NOT NULL,
      token_address TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      symbol TEXT NOT NULL,
      total_supply TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      tx_hash TEXT NOT NULL,
      block_number BIGINT NOT NULL,
      created_at BIGINT NOT NULL
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_creator ON tokens(creator);`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sync_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      last_block BIGINT NOT NULL
    );
  `);
}

async function insertToken(t) {
  await pool.query(
    `INSERT INTO tokens
      (creator, token_address, name, symbol, total_supply, payment_method, tx_hash, block_number, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (token_address) DO NOTHING`,
    [t.creator, t.tokenAddress, t.name, t.symbol, t.totalSupply, t.paymentMethod, t.txHash, t.blockNumber, t.createdAt]
  );
}

async function getLastBlock() {
  const res = await pool.query(`SELECT last_block FROM sync_state WHERE id = 1`);
  return res.rows[0] ? Number(res.rows[0].last_block) : null;
}

async function setLastBlock(block) {
  await pool.query(
    `INSERT INTO sync_state (id, last_block) VALUES (1, $1)
     ON CONFLICT (id) DO UPDATE SET last_block = excluded.last_block`,
    [block]
  );
}

// اتصال به بلاکچین
const provider = new JsonRpcProvider(RPC_URL);
const factory = new Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);

// گوش دادن به رویداد جدید
factory.on("TokenCreated", async (creator, tokenAddress, name, symbol, totalSupply, paymentMethod, event) => {
  try {
    const block = await event.getBlock();
    await insertToken({
      creator, tokenAddress, name, symbol, totalSupply: totalSupply.toString(), paymentMethod,
      txHash: event.log.transactionHash, blockNumber: event.log.blockNumber, createdAt: block.timestamp,
    });
    await setLastBlock(event.log.blockNumber);
    console.log(`[event] New token registered: ${name} (${symbol})`);
=======
// اتصال به شبکه Polygon (استفاده از RPC از محیط)
const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);

// تست اولیه اتصال
app.get('/', (req, res) => {
  res.send('Token Factory Backend is running successfully!');
});

// اینجا می‌توانید روت‌های دیگر (API) خود را اضافه کنید
// مثال: دریافت لیست توکن‌ها
app.get('/api/tokens', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tokens'); // فرض بر وجود جدول tokens
    res.json(result.rows);
>>>>>>> ace9832866424f1b6095f0771909786366e3135f
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

<<<<<<< HEAD
// همگام‌سازی بلاک‌های قدیمی
async function backfillPastEvents() {
  const last = await getLastBlock();
  const currentBlock = await provider.getBlockNumber();
  const fromBlock = last !== null ? last + 1 : Number(process.env.FACTORY_DEPLOY_BLOCK || 0);

  if (fromBlock > currentBlock) return;

  console.log(`Syncing from block ${fromBlock} to ${currentBlock}...`);
  const CHUNK = Number(process.env.LOG_CHUNK_SIZE || 10);
  
  for (let start = fromBlock; start <= currentBlock; start += CHUNK) {
    const end = Math.min(start + CHUNK - 1, currentBlock);
    const events = await factory.queryFilter(factory.filters.TokenCreated(), start, end);
    for (const event of events) {
      const block = await event.getBlock();
      await insertToken({
        creator: event.args.creator, tokenAddress: event.args.tokenAddress,
        name: event.args.name, symbol: event.args.symbol,
        totalSupply: event.args.totalSupply.toString(), paymentMethod: event.args.paymentMethod,
        txHash: event.transactionHash, blockNumber: event.blockNumber, createdAt: block.timestamp,
      });
    }
    await setLastBlock(end);
  }
  console.log("Sync complete.");
}

// روت‌های API
app.get("/api/tokens", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;
  const result = await pool.query("SELECT * FROM tokens ORDER BY block_number DESC LIMIT $1 OFFSET $2", [limit, offset]);
  res.json({ tokens: result.rows });
});

app.get("/api/tokens/by-creator/:address", async (req, res) => {
  const result = await pool.query("SELECT * FROM tokens WHERE creator ILIKE $1 ORDER BY block_number DESC", [req.params.address]);
  res.json({ tokens: result.rows });
});

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// اجرای سرور با تنظیمات سازگار با Runflare
app.listen(PORT, "0.0.0.0", async () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  try {
    await initDb();
    await backfillPastEvents();
  } catch (err) {
    console.error("Initialization error:", err);
  }
});
=======
// --- بخش حیاتی برای Runflare (پورت پویا و هاست 0.0.0.0) ---
const port = process.env.PORT || 3000;

app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server successfully started and listening on port ${port}`);
});
>>>>>>> ace9832866424f1b6095f0771909786366e3135f
