const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const db      = require('./src/database');
const engine  = require('./src/engine');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/build')));

// ── ENGINE ────────────────────────────────────────────────
app.post('/api/engine/start', async (req, res) => {
  try {
    await engine.start();
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/engine/stop', (req, res) => {
  try {
    engine.stop();
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/status', (req, res) => {
  try {
    const logs        = db.prepare("SELECT * FROM scan_logs ORDER BY created_at DESC LIMIT 1").get();
    const signalCount = db.prepare("SELECT COUNT(*) as count FROM signals WHERE sinyal='ALIM'").get();
    res.json({
      running:      engine.running,
      lastScan:     logs?.created_at || null,
      totalSignals: signalCount.count || 0,
      scanCount:    db.prepare("SELECT COUNT(*) as count FROM scan_logs").get().count || 0
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── SİNYALLER ────────────────────────────────────────────
app.get('/api/signals', (req, res) => {
  try {
    const { sinyal, limit=100 } = req.query;
    let query = "SELECT * FROM signals";
    const params = [];
    if (sinyal) { query += " WHERE sinyal=?"; params.push(sinyal); }
    query += " ORDER BY puan DESC LIMIT ?";
    params.push(parseInt(limit));
    const signals = db.prepare(query).all(...params);
    res.json(signals.map(s => ({
      ...s,
      pozitif: JSON.parse(s.pozitif || '[]'),
      negatif: JSON.parse(s.negatif || '[]')
    })));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/signals/alim', (req, res) => {
  try {
    const signals = db.prepare(
      "SELECT * FROM signals WHERE sinyal='ALIM' ORDER BY puan DESC LIMIT 50"
    ).all();
    res.json(signals.map(s => ({
      ...s,
      pozitif: JSON.parse(s.pozitif || '[]'),
      negatif: JSON.parse(s.negatif || '[]')
    })));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── SCAN LOGS ────────────────────────────────────────────
app.get('/api/scan-logs', (req, res) => {
  try {
    const logs = db.prepare(
      "SELECT * FROM scan_logs ORDER BY created_at DESC LIMIT 20"
    ).all();
    res.json(logs.map(l => ({
      ...l,
      signals_found: JSON.parse(l.signals_found || '[]')
    })));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── AYARLAR ──────────────────────────────────────────────
app.get('/api/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    res.json(Object.fromEntries(rows.map(r => [r.key, r.value])));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/settings', (req, res) => {
  try {
    for (const [key, value] of Object.entries(req.body)) {
      const existing = db.prepare('SELECT key FROM settings WHERE key=?').get(key);
      if (existing) db.prepare('UPDATE settings SET value=? WHERE key=?').run(String(value), key);
      else          db.prepare('INSERT INTO settings (key,value) VALUES (?,?)').run(key, String(value));
    }
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── KOD EDİTÖRÜ ──────────────────────────────────────────
app.get('/api/code', (req, res) => {
  try {
    const filePath = path.join(__dirname, 'src/analysis.js');
    const code     = fs.readFileSync(filePath, 'utf8');
    res.json({ code });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/code', (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Kod boş' });
    const filePath = path.join(__dirname, 'src/analysis.js');
    // Backup
    fs.writeFileSync(filePath + '.backup', fs.readFileSync(filePath));
    // Kaydet
    fs.writeFileSync(filePath, code, 'utf8');
    // Modülü yenile
    delete require.cache[require.resolve('./src/analysis')];
    res.json({ success: true, message: 'Kod kaydedildi ve yenilendi' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/code/restore', (req, res) => {
  try {
    const filePath = path.join(__dirname, 'src/analysis.js');
    const backup   = filePath + '.backup';
    if (fs.existsSync(backup)) {
      fs.writeFileSync(filePath, fs.readFileSync(backup));
      delete require.cache[require.resolve('./src/analysis')];
      res.json({ success: true, message: 'Backup geri yüklendi' });
    } else {
      res.status(404).json({ error: 'Backup bulunamadı' });
    }
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── FRONTEND ─────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// ── SUNUCU ───────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Sinyal Botu: http://localhost:${PORT}`);
  console.log(`📊 RSI + EMA + MACD + BB + OBV + Hacim + S/R + Mum\n`);
});
