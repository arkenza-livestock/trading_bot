const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../../data/sinyal.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── TABLOLAR ──────────────────────────────────────────────

db.prepare(`CREATE TABLE IF NOT EXISTS signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  fiyat REAL NOT NULL,
  puan INTEGER DEFAULT 0,
  risk TEXT DEFAULT 'ORTA',
  sinyal TEXT DEFAULT 'BEKLE',
  rsi REAL,
  trend TEXT,
  macd_bullish INTEGER DEFAULT 0,
  bollinger_pct REAL,
  obv_trend TEXT,
  vol_oran REAL,
  destek REAL,
  direnc REAL,
  hedef REAL,
  stop_loss REAL,
  atr_oran REAL,
  pozitif TEXT,
  negatif TEXT,
  degisim24h REAL,
  hacim24h REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS scan_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coin_count INTEGER DEFAULT 0,
  signal_count INTEGER DEFAULT 0,
  duration_ms INTEGER DEFAULT 0,
  signals_found TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
)`).run();

// ── VARSAYILAN AYARLAR ────────────────────────────────────
const defaults = {
  min_volume:         '5000000',
  max_coins:          '100',
  min_puan:           '50',
  scan_interval:      '20',
  telegram_token:     '',
  telegram_chat_id:   '',
  telegram_min_puan:  '60',
  groq_api_key:       '',
  groq_enabled:       'false',
};

for (const [key, value] of Object.entries(defaults)) {
  const existing = db.prepare('SELECT key FROM settings WHERE key=?').get(key);
  if (!existing) db.prepare('INSERT INTO settings (key,value) VALUES (?,?)').run(key, value);
}

module.exports = db;
