const axios = require('axios');

class TelegramService {
  constructor(token, chatId) {
    this.token  = token;
    this.chatId = chatId;
    this.baseURL = `https://api.telegram.org/bot${token}`;
  }

  async sendMessage(text) {
    if (!this.token || !this.chatId) return;
    try {
      await axios.post(`${this.baseURL}/sendMessage`, {
        chat_id:    this.chatId,
        text,
        parse_mode: 'HTML'
      });
    } catch(e) { console.error('Telegram hatası:', e.message); }
  }

  async sendSignal(data) {
    const emoji  = '🚀';
    const riskEmoji = data.risk === 'DUSUK' ? '🟢' : data.risk === 'ORTA' ? '🟡' : '🔴';

    const pozitifList = (data.pozitif||[]).slice(0,5).map(p => `  ✅ ${p}`).join('\n');
    const negatifList = (data.negatif||[]).slice(0,3).map(n => `  ⚠️ ${n}`).join('\n');

    const msg =
      `${emoji} <b>ALIM SİNYALİ — ${data.symbol}</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 Fiyat: <code>${data.fiyat}</code> USDT\n` +
      `📊 Puan: <b>${data.puan}/100</b>\n` +
      `${riskEmoji} Risk: <b>${data.risk}</b>\n` +
      `📉 RSI: ${data.rsi}\n` +
      `📈 Trend: ${data.trend}\n` +
      `🎯 Hedef: <code>${data.hedef}</code>\n` +
      `🛑 Stop: <code>${data.stop_loss}</code>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      (pozitifList ? `<b>Pozitif:</b>\n${pozitifList}\n` : '') +
      (negatifList ? `<b>Riskler:</b>\n${negatifList}\n` : '') +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🕐 ${new Date().toLocaleString('tr-TR')}`;

    await this.sendMessage(msg);
  }
}

module.exports = TelegramService;
