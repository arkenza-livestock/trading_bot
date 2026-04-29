class Analysis {

  analyze(candles, ticker) {
    if (!candles || candles.length < 50) return null;

    const closes  = candles.map(c => parseFloat(c[4]));
    const highs   = candles.map(c => parseFloat(c[2]));
    const lows    = candles.map(c => parseFloat(c[3]));
    const volumes = candles.map(c => parseFloat(c[5]));
    const opens   = candles.map(c => parseFloat(c[1]));
    const fiyat   = closes[closes.length - 1];

    // ── RSI ──────────────────────────────────────
    const rsi        = this.hesaplaRSI(closes, 14);
    const rsiOnceki  = this.hesaplaRSI(closes.slice(0, -1), 14);
    const rsiYukseliyor = rsi > rsiOnceki;

    // ── EMA ──────────────────────────────────────
    const ema9   = this.hesaplaEMA(closes, 9);
    const ema20  = this.hesaplaEMA(closes, 20);
    const ema50  = this.hesaplaEMA(closes, 50);
    const ema200 = closes.length >= 200 ? this.hesaplaEMA(closes, 200) : null;

    const ema20Onceki = this.hesaplaEMA(closes.slice(0, -1), 20);
    const ema50Onceki = this.hesaplaEMA(closes.slice(0, -1), 50);

    const goldenCross = ema20Onceki <= ema50Onceki && ema20 > ema50;
    const deathCross  = ema20Onceki >= ema50Onceki && ema20 < ema50;

    let trend = 'NOTR';
    if      (fiyat > ema20 && ema20 > ema50) trend = 'GUCLU_YUKARI';
    else if (fiyat > ema20)                  trend = 'YUKARI';
    else if (fiyat < ema20 && ema20 < ema50) trend = 'GUCLU_ASAGI';
    else if (fiyat < ema20)                  trend = 'ASAGI';

    // ── MACD ─────────────────────────────────────
    const ema12 = this.hesaplaEMA(closes, 12);
    const ema26 = this.hesaplaEMA(closes, 26);
    const macdLine = ema12 - ema26;

    const macdSeries = [];
    for (let i = 26; i < closes.length; i++) {
      const e12 = this.hesaplaEMA(closes.slice(0, i + 1), 12);
      const e26 = this.hesaplaEMA(closes.slice(0, i + 1), 26);
      macdSeries.push(e12 - e26);
    }
    const signalLine   = this.hesaplaEMA(macdSeries, 9);
    const macdHist     = macdLine - signalLine;
    const macdOnceki   = macdSeries[macdSeries.length - 2] || 0;
    const signalOnceki = this.hesaplaEMA(macdSeries.slice(0, -1), 9);
    const macdBullish  = macdOnceki <= signalOnceki && macdLine > signalLine;
    const macdBearish  = macdOnceki >= signalOnceki && macdLine < signalLine;

    const sonFiyatlar     = closes.slice(-5);
    const fiyatYukseliyor = sonFiyatlar[4] > sonFiyatlar[0];
    const macdDusuyorMu   = macdSeries[macdSeries.length-1] < macdSeries[macdSeries.length-5];
    const bearishDiv      = fiyatYukseliyor && macdDusuyorMu;
    const bullishDiv      = !fiyatYukseliyor && !macdDusuyorMu;

    // ── BOLLINGER BANDS ───────────────────────────
    const slice20  = closes.slice(-20);
    const sma20    = slice20.reduce((a, b) => a + b, 0) / 20;
    const std20    = Math.sqrt(slice20.reduce((a, b) => a + Math.pow(b - sma20, 2), 0) / 20);
    const bUpper   = sma20 + 2 * std20;
    const bLower   = sma20 - 2 * std20;
    const bMid     = sma20;
    const bWidth   = (bUpper - bLower) / bMid * 100;
    const bPct     = (fiyat - bLower) / (bUpper - bLower) * 100;

    const slice20Onceki = closes.slice(-25, -5);
    const sma20Onceki   = slice20Onceki.reduce((a,b) => a+b, 0) / 20;
    const std20Onceki   = Math.sqrt(slice20Onceki.reduce((a,b) => a+Math.pow(b-sma20Onceki,2), 0) / 20);
    const bWidthOnceki  = ((sma20Onceki + 2*std20Onceki) - (sma20Onceki - 2*std20Onceki)) / sma20Onceki * 100;
    const bantDaraliyor  = bWidth < bWidthOnceki * 0.85;
    const bantGenisliyor = bWidth > bWidthOnceki * 1.15;

    // ── OBV ──────────────────────────────────────
    let obv = 0;
    const obvSeries = [0];
    for (let i = 1; i < closes.length; i++) {
      if      (closes[i] > closes[i-1]) obv += volumes[i];
      else if (closes[i] < closes[i-1]) obv -= volumes[i];
      obvSeries.push(obv);
    }
    const obv5Ort  = obvSeries.slice(-5).reduce((a,b) => a+b, 0) / 5;
    const obv20Ort = obvSeries.slice(-20).reduce((a,b) => a+b, 0) / 20;
    const obvTrend = obv5Ort > obv20Ort ? 'YUKARI' : 'ASAGI';

    const obvYukseliyor = obvSeries[obvSeries.length-1] > obvSeries[obvSeries.length-6];
    const gizliAlim     = !fiyatYukseliyor && obvYukseliyor;
    const gizliSatis    = fiyatYukseliyor && !obvYukseliyor;

    // ── HACİM ────────────────────────────────────
    const vol20Ort  = volumes.slice(-20, -1).reduce((a,b) => a+b, 0) / 19;
    const sonVol    = volumes[volumes.length - 1];
    const volOran   = parseFloat((sonVol / vol20Ort).toFixed(2));
    const volSpike  = volOran > 2.0;
    const volDusuk  = volOran < 0.5;

    const sonMumlar    = candles.slice(-5);
    const yukselisVol  = sonMumlar.filter(c => parseFloat(c[4]) > parseFloat(c[1])).reduce((a,c) => a + parseFloat(c[5]), 0);
    const dususVol     = sonMumlar.filter(c => parseFloat(c[4]) < parseFloat(c[1])).reduce((a,c) => a + parseFloat(c[5]), 0);
    const volBaskisi   = yukselisVol > dususVol ? 'ALIM' : 'SATIS';

    // ── DESTEK / DİRENÇ ──────────────────────────
    const son50High  = highs.slice(-50);
    const son50Low   = lows.slice(-50);
    const direnc     = Math.max(...son50High);
    const destek     = Math.min(...son50Low);
    const direncUzak = (direnc - fiyat) / fiyat * 100;
    const destekUzak = (fiyat - destek) / fiyat * 100;

    const direncKirildi = closes.slice(-3).some(c => c > direnc * 0.998);
    const destekKirildi = closes.slice(-3).some(c => c < destek * 1.002);

    // ── MUM YAPILARI ──────────────────────────────
    const sonMum     = candles[candles.length - 1];
    const sonAcilis  = parseFloat(sonMum[1]);
    const sonKapanis = parseFloat(sonMum[4]);
    const sonHigh    = parseFloat(sonMum[2]);
    const sonLow     = parseFloat(sonMum[3]);
    const mumGovde   = Math.abs(sonKapanis - sonAcilis);
    const mumAlt     = Math.min(sonKapanis, sonAcilis) - sonLow;
    const mumUst     = sonHigh - Math.max(sonKapanis, sonAcilis);
    const mumToplam  = sonHigh - sonLow;

    const hammer          = mumAlt > mumGovde * 2 && mumUst < mumGovde * 0.5 && sonKapanis > sonAcilis;
    const shootingStar    = mumUst > mumGovde * 2 && mumAlt < mumGovde * 0.5 && sonKapanis < sonAcilis;
    const doji            = mumGovde < mumToplam * 0.1;
    const oncekiMum       = candles[candles.length - 2];
    const oncekiAcilis    = parseFloat(oncekiMum[1]);
    const oncekiKapanis   = parseFloat(oncekiMum[4]);
    const bullishEngulfing = oncekiKapanis < oncekiAcilis && sonKapanis > sonAcilis && sonAcilis < oncekiKapanis && sonKapanis > oncekiAcilis;
    const bearishEngulfing = oncekiKapanis > oncekiAcilis && sonKapanis < sonAcilis && sonAcilis > oncekiKapanis && sonKapanis < oncekiAcilis;

    // ── TREND ÇİZGİSİ ─────────────────────────────
    const son10High = highs.slice(-10);
    const son10Low  = lows.slice(-10);
    const hhCount   = son10High.filter((h,i) => i > 0 && h > son10High[i-1]).length;
    const hlCount   = son10Low.filter((l,i)  => i > 0 && l > son10Low[i-1]).length;
    const lhCount   = son10High.filter((h,i) => i > 0 && h < son10High[i-1]).length;
    const llCount   = son10Low.filter((l,i)  => i > 0 && l < son10Low[i-1]).length;
    const yukselisTrendi = hhCount >= 5 && hlCount >= 5;
    const dususTrendi    = lhCount >= 5 && llCount >= 5;

    // ── ATR ───────────────────────────────────────
    const atrDegerleri = [];
    for (let i = 1; i < candles.length; i++) {
      const h = highs[i], l = lows[i], pc = closes[i-1];
      atrDegerleri.push(Math.max(h-l, Math.abs(h-pc), Math.abs(l-pc)));
    }
    const atr14  = atrDegerleri.slice(-14).reduce((a,b) => a+b, 0) / 14;
    const atrOran = parseFloat((atr14 / fiyat * 100).toFixed(2));

    // ── PUAN HESAPLAMA ────────────────────────────
    let puan = 0;
    const pozitif = [];
    const negatif = [];

    // RSI
    if      (rsi < 25) { puan += 30; pozitif.push(`RSI aşırı satım (${rsi})`); }
    else if (rsi < 35) { puan += 20; pozitif.push(`RSI satım bölgesi (${rsi})`); }
    else if (rsi < 45) { puan += 10; pozitif.push(`RSI nötr-pozitif (${rsi})`); }
    else if (rsi > 75) { puan -= 25; negatif.push(`RSI aşırı alım (${rsi})`); }
    else if (rsi > 65) { puan -= 10; negatif.push(`RSI alım bölgesi (${rsi})`); }
    if (rsiYukseliyor && rsi < 50) { puan += 10; pozitif.push('RSI yükseliyor'); }

    // MACD
    if      (macdBullish) { puan += 25; pozitif.push('MACD golden cross'); }
    else if (macdBearish) { puan -= 25; negatif.push('MACD death cross'); }
    else if (macdLine > signalLine) { puan += 10; pozitif.push('MACD pozitif'); }
    else if (macdLine < signalLine) { puan -= 10; negatif.push('MACD negatif'); }
    if (bearishDiv) { puan -= 20; negatif.push('MACD bearish divergence'); }
    if (bullishDiv) { puan += 15; pozitif.push('MACD bullish divergence'); }

    // EMA
    if      (goldenCross)              { puan += 30; pozitif.push('Golden Cross!'); }
    else if (deathCross)               { puan -= 30; negatif.push('Death Cross!'); }
    else if (trend === 'GUCLU_YUKARI') { puan += 20; pozitif.push('Güçlü yükseliş trendi'); }
    else if (trend === 'YUKARI')       { puan += 10; pozitif.push('Yükseliş trendi'); }
    else if (trend === 'GUCLU_ASAGI')  { puan -= 20; negatif.push('Güçlü düşüş trendi'); }
    else if (trend === 'ASAGI')        { puan -= 10; negatif.push('Düşüş trendi'); }
    if (ema200 && fiyat > ema200)      { puan += 10; pozitif.push('EMA200 üstünde'); }
    else if (ema200 && fiyat < ema200) { puan -= 10; negatif.push('EMA200 altında'); }

    // Bollinger
    if      (bPct < 5)   { puan += 25; pozitif.push('Bollinger alt bandında'); }
    else if (bPct < 20)  { puan += 15; pozitif.push('Bollinger alt bölgede'); }
    else if (bPct > 95)  { puan -= 25; negatif.push('Bollinger üst bandında'); }
    else if (bPct > 80)  { puan -= 15; negatif.push('Bollinger üst bölgede'); }
    if (bantDaraliyor)   { puan +=  5; pozitif.push('Bant daralıyor'); }
    if (bantGenisliyor && bPct > 50) { puan -= 5; negatif.push('Bant genişliyor'); }

    // OBV
    if (obvTrend === 'YUKARI') { puan += 15; pozitif.push('OBV yükseliş'); }
    else                       { puan -= 10; negatif.push('OBV düşüş'); }
    if (gizliAlim)  { puan += 20; pozitif.push('OBV gizli alım divergence'); }
    if (gizliSatis) { puan -= 20; negatif.push('OBV gizli satış divergence'); }

    // Hacim
    if (volSpike)               { puan += 20; pozitif.push(`Hacim patlaması (${volOran}x)`); }
    if (volDusuk)               { puan -= 10; negatif.push('Hacim çok düşük'); }
    if (volBaskisi === 'ALIM')  { puan += 10; pozitif.push('Alım hacmi baskın'); }
    else                        { puan -=  5; negatif.push('Satış hacmi baskın'); }

    // Destek/Direnç
    if      (destekUzak < 2)  { puan += 20; pozitif.push('Desteğe çok yakın'); }
    else if (destekUzak < 5)  { puan += 10; pozitif.push('Desteğe yakın'); }
    if      (direncUzak < 2)  { puan -= 15; negatif.push('Direce çok yakın'); }
    if (direncKirildi)         { puan += 25; pozitif.push('Direnç kırıldı!'); }
    if (destekKirildi)         { puan -= 25; negatif.push('Destek kırıldı!'); }

    // Mum yapıları
    if (hammer)           { puan += 20; pozitif.push('Hammer mumu'); }
    if (shootingStar)     { puan -= 20; negatif.push('Shooting Star mumu'); }
    if (bullishEngulfing) { puan += 25; pozitif.push('Bullish Engulfing'); }
    if (bearishEngulfing) { puan -= 25; negatif.push('Bearish Engulfing'); }
    if (doji)             { puan +=  5; pozitif.push('Doji (kararsızlık)'); }

    // Trend çizgisi
    if (yukselisTrendi) { puan += 15; pozitif.push('Higher Highs & Higher Lows'); }
    if (dususTrendi)    { puan -= 15; negatif.push('Lower Highs & Lower Lows'); }

    // ── SİNYAL KARARI ─────────────────────────────
    const sinyal = puan >= 50 ? 'ALIM' : puan <= -20 ? 'SATIS' : 'BEKLE';
    const risk   = puan >= 70 ? 'DUSUK' : puan >= 50 ? 'ORTA' : 'YUKSEK';

    const hedef   = parseFloat((fiyat + atr14 * 3).toFixed(8));
    const stopLos = parseFloat((fiyat - atr14 * 1.5).toFixed(8));

    return {
      symbol:      ticker.symbol,
      fiyat:       parseFloat(fiyat.toFixed(8)),
      puan,
      risk,
      sinyal,
      rsi:         parseFloat(rsi.toFixed(2)),
      rsiYukseliyor,
      trend,
      goldenCross,
      deathCross,
      ema20:       parseFloat(ema20.toFixed(8)),
      ema50:       parseFloat(ema50.toFixed(8)),
      ema200:      ema200 ? parseFloat(ema200.toFixed(8)) : null,
      macdLine:    parseFloat(macdLine.toFixed(8)),
      signalLine:  parseFloat(signalLine.toFixed(8)),
      macdHist:    parseFloat(macdHist.toFixed(8)),
      macdBullish,
      macdBearish,
      bearishDiv,
      bullishDiv,
      bPct:        parseFloat(bPct.toFixed(2)),
      bWidth:      parseFloat(bWidth.toFixed(2)),
      bantDaraliyor,
      bantGenisliyor,
      obvTrend,
      gizliAlim,
      gizliSatis,
      volOran,
      volSpike,
      volBaskisi,
      direnc:      parseFloat(direnc.toFixed(8)),
      destek:      parseFloat(destek.toFixed(8)),
      direncUzak:  parseFloat(direncUzak.toFixed(2)),
      destekUzak:  parseFloat(destekUzak.toFixed(2)),
      direncKirildi,
      destekKirildi,
      hammer,
      shootingStar,
      bullishEngulfing,
      bearishEngulfing,
      doji,
      yukselisTrendi,
      dususTrendi,
      atrOran,
      hedef,
      stop_loss:   stopLos,
      pozitif,
      negatif,
      degisim24h:  parseFloat(ticker.priceChangePercent || 0),
      hacim24h:    parseFloat(ticker.quoteVolume || 0)
    };
  }

  // ── YARDIMCI FONKSİYONLAR ────────────────────────────
  hesaplaRSI(data, period) {
    let gains = 0, losses = 0;
    for (let i = data.length - period; i < data.length; i++) {
      const diff = data[i] - data[i-1];
      if (diff > 0) gains  += diff;
      else          losses -= diff;
    }
    const ag = gains / period;
    const al = losses / period;
    if (al === 0) return 100;
    return parseFloat((100 - 100 / (1 + ag / al)).toFixed(2));
  }

  hesaplaEMA(data, period) {
    if (data.length < period) return data[data.length-1];
    const k = 2 / (period + 1);
    let ema = data.slice(0, period).reduce((a,b) => a+b, 0) / period;
    for (let i = period; i < data.length; i++) {
      ema = data[i] * k + ema * (1 - k);
    }
    return parseFloat(ema.toFixed(8));
  }
}

module.exports = new Analysis();
