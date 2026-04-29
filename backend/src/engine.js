const binance  = require('./binance');
const analysis = require('./analysis');
const db       = require('./database');
const TelegramService = require('./telegram');

class Engine {
  constructor() {
    this.running  = false;
    this.interval = null;
  }

  getSettings() {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    return Object.fromEntries(rows.map(r => [r.key, r.value]));
  }

  getTelegram() {
    const s = this.getSettings();
    if (!s.telegram_token || !s.telegram_chat_id) return null;
    return new TelegramService(s.telegram_token, s.telegram_chat_id);
  }

  async scan() {
    const baslangic = Date.now();
    const settings  = this.getSettings();
    const minHacim  = parseFloat(settings.min_volume  || 5000000);
    const maxCoin   = parseInt(settings.max_coins     || 100);
    const minPuan   = parseInt(settings.min_puan      || 50);
    const interval  = settings.scan_interval          || '4h';

    console.log(`\n[${new Date().toLocaleTimeString('tr-TR')}] ═══ TARAMA BAŞLIYOR ═══`);

    const STABLES = new Set([
      'BUSDUSDT','USDCUSDT','TUSDUSDT','USDTUSDT',
      'FDUSDUSDT','DAIUSDT','USDPUSDT','EURUSDT','AEURUSDT'
    ]);

    // Tüm tickerları çek
    let tickers;
    try {
      tickers = await binance.getAllTickers();
    } catch(e) {
      console.error('Ticker hatası:', e.message);
      return;
    }

    // Filtrele ve sırala
    const filtreli = tickers
      .filter(t => {
        if (!t.symbol.endsWith('USDT')) return false;
        if (STABLES.has(t.symbol))     return false;
        const hacim   = parseFloat(t.quoteVolume) || 0;
        const degisim = parseFloat(t.priceChangePercent) || 0;
        const fiyat   = parseFloat(t.lastPrice) || 0;
        return fiyat > 0 && hacim >= minHacim && degisim >= -50 && degisim <= 50;
      })
      .sort((a, b) => {
        const sA = parseFloat(a.quoteVolume) * Math.abs(parseFloat(a.priceChangePercent));
        const sB = parseFloat(b.quoteVolume) * Math.abs(parseFloat(b.priceChangePercent));
        return sB - sA;
      })
      .slice(0, maxCoin);

    console.log(`${filtreli.length} coin taranacak`);

    // Eski sinyalleri temizle
    db.prepare("DELETE FROM signals").run();

    let signalCount = 0;
    const signalsFound = [];
    const telegram = this.getTelegram();

    for (const ticker of filtreli) {
      try {
        // 4H mumları çek
        const candles = await binance.getKlines(ticker.symbol, '4h', 100);
        if (!candles || candles.length < 50) continue;

        // Analiz yap
        const result = analysis.analyze(candles, ticker);
        if (!result) continue;

        // DB'ye kaydet (sinyal olsun olmasın)
        db.prepare(`
          INSERT INTO signals
          (symbol, fiyat, puan, risk, sinyal, rsi, trend, macd_bullish,
           bollinger_pct, obv_trend, vol_oran, destek, direnc, hedef,
           stop_loss, atr_oran, pozitif, negatif, degisim24h, hacim24h)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `).run(
          result.symbol, result.fiyat, result.puan, result.risk,
          result.sinyal, result.rsi, result.trend,
          result.macdBullish ? 1 : 0,
          result.bPct, result.obvTrend, result.volOran,
          result.destek, result.direnc, result.hedef,
          result.stop_loss, result.atrOran,
          JSON.stringify(result.pozitif),
          JSON.stringify(result.negatif),
          result.degisim24h, result.hacim24h
        );

        // ALIM sinyali varsa Telegram gönder
        if (result.sinyal === 'ALIM' && result.puan >= minPuan) {
          signalCount++;
          signalsFound.push(result.symbol);
          console.log(`🚀 ALIM: ${result.symbol} | Puan: ${result.puan} | RSI: ${result.rsi}`);

          if (telegram) {
            const telegramMinPuan = parseInt(settings.telegram_min_puan || 60);
            if (result.puan >= telegramMinPuan) {
              await telegram.sendSignal(result);
            }
          }
        }

        // Rate limit
        await new Promise(r => setTimeout(r, 150));

      } catch(e) {
        console.error(`${ticker.symbol} hatası:`, e.message);
      }
    }

    const sure = Date.now() - baslangic;
    console.log(`Tarama bitti (${(sure/1000).toFixed(1)}s) — ${signalCount} sinyal`);

    // Scan log kaydet
    db.prepare(`
      INSERT INTO scan_logs (coin_count, signal_count, duration_ms, signals_found)
      VALUES (?, ?, ?, ?)
    `).run(filtreli.length, signalCount, sure, JSON.stringify(signalsFound));
  }

  async start() {
    if (this.running) return;
    this.running = true;

    console.log('\n═══════════════════════════════');
    console.log('  SİNYAL BOTU BAŞLADI');
    console.log('═══════════════════════════════\n');

    // İlk taramayı hemen yap
    await this.scan();

    // Sonra her N dakikada bir
    const settings     = this.getSettings();
    const intervalMin  = parseInt(settings.scan_interval || 20);
    const intervalMs   = intervalMin * 60 * 1000;

    this.interval = setInterval(() => this.scan(), intervalMs);
    console.log(`⏰ Her ${intervalMin} dakikada bir tarama yapılacak`);
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
    this.running  = false;
    this.interval = null;
    console.log('Engine durduruldu.');
  }
}

module.exports = new Engine();
