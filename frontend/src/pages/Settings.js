import React, { useState, useEffect } from 'react';

export default function Settings({ api }) {
  const [settings, setSettings] = useState({});
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

  useEffect(() => { load(); }, [api]);

  const load = async () => {
    try {
      const res = await fetch(`${api}/api/settings`);
      const data = await res.json();
      setSettings(data);
    } catch(e) { console.error(e); }
  };

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`${api}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch(e) { alert('Hata: ' + e.message); }
    setSaving(false);
  };

  const set = (key, val) => setSettings(prev => ({ ...prev, [key]: val }));

  const Input = ({ label, k, type='text', placeholder, desc }) => (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:'block', fontSize:12, color:'#718096', marginBottom:5, fontWeight:600 }}>
        {label}
      </label>
      {desc && <div style={{ fontSize:11, color:'#4a5568', marginBottom:5 }}>{desc}</div>}
      <input
        className="form-input"
        type={type}
        placeholder={placeholder}
        value={settings[k]||''}
        onChange={e => set(k, e.target.value)}
      />
    </div>
  );

  const Section = ({ title, color='#60a5fa', children }) => (
    <div className="card" style={{ marginBottom:16 }}>
      <div style={{ fontSize:12, color, fontWeight:700, marginBottom:16,
        textTransform:'uppercase', letterSpacing:1 }}>{title}</div>
      {children}
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">⚙️ Ayarlar</div>
          <div className="page-sub">Bot konfigürasyonu</div>
        </div>
        <button onClick={save} disabled={saving}
          style={{ padding:'10px 28px', borderRadius:6, cursor:'pointer',
            fontSize:14, fontWeight:600, border:'1px solid',
            background: saved ? 'rgba(72,187,120,0.2)' : 'rgba(49,130,206,0.2)',
            borderColor: saved ? '#48bb78' : '#3182ce',
            color: saved ? '#68d391' : '#90cdf4' }}>
          {saving ? '⏳ Kaydediliyor...' : saved ? '✅ Kaydedildi!' : '💾 Kaydet'}
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

        {/* Sol */}
        <div>
          <Section title="🔍 Tarama Ayarları">
            <Input label="Min Hacim (USDT)" k="min_volume" type="number"
              placeholder="5000000"
              desc="Bu hacimin altındaki coinler taranmaz" />
            <Input label="Max Coin Sayısı" k="max_coins" type="number"
              placeholder="100"
              desc="Kaç coin analiz edilsin" />
            <Input label="Min Alım Puanı" k="min_puan" type="number"
              placeholder="50"
              desc="Bu puanın üstündekiler ALIM sinyali" />
            <Input label="Tarama Aralığı (dakika)" k="scan_interval" type="number"
              placeholder="20"
              desc="Her kaç dakikada bir tarama yapılsın" />
          </Section>

          <Section title="📱 Telegram">
            <Input label="Bot Token" k="telegram_token"
              placeholder="123456789:ABC..."
              desc="BotFather'dan alınan token" />
            <Input label="Chat ID" k="telegram_chat_id"
              placeholder="-1001234567890"
              desc="Mesajın gönderileceği chat/kanal ID" />
            <Input label="Min Puan (Telegram için)" k="telegram_min_puan" type="number"
              placeholder="60"
              desc="Bu puanın üstünde Telegram bildirimi gönderilir" />
          </Section>
        </div>

        {/* Sağ */}
        <div>
          <Section title="🤖 Groq AI (Opsiyonel)">
            <div style={{ background:'#0d1a2d', border:'1px solid #1e3a5f',
              borderRadius:8, padding:'12px 14px', marginBottom:16 }}>
              <div style={{ fontSize:12, color:'#60a5fa', marginBottom:6 }}>ℹ️ Groq AI Nedir?</div>
              <div style={{ fontSize:11, color:'#718096', lineHeight:1.6 }}>
                Sinyal üretildikten sonra Groq AI ile otomatik yorum eklenir.
                Ücretsiz API key: <b style={{ color:'#90cdf4' }}>console.groq.com</b>
              </div>
            </div>
            <Input label="Groq API Key" k="groq_api_key"
              placeholder="gsk_..." />
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:12, color:'#718096', fontWeight:600 }}>Groq AI Aktif</label>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:8 }}>
                <div onClick={() => set('groq_enabled', settings.groq_enabled==='true'?'false':'true')}
                  style={{ width:44, height:24, borderRadius:12, cursor:'pointer',
                    background: settings.groq_enabled==='true' ? '#3182ce' : '#2d3748',
                    position:'relative', transition:'all 0.2s' }}>
                  <div style={{ position:'absolute', top:3, width:18, height:18,
                    borderRadius:'50%', background:'white', transition:'all 0.2s',
                    left: settings.groq_enabled==='true' ? 22 : 3 }} />
                </div>
                <span style={{ fontSize:12, color:'#718096' }}>
                  {settings.groq_enabled==='true' ? 'Aktif' : 'Pasif'}
                </span>
              </div>
            </div>
          </Section>

          <Section title="📊 Puan Sistemi">
            <div style={{ fontSize:12, color:'#718096', lineHeight:2 }}>
              <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0',
                borderBottom:'1px solid #0d1117' }}>
                <span>RSI aşırı satım (&lt;25)</span>
                <span style={{ color:'#68d391' }}>+30 puan</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0',
                borderBottom:'1px solid #0d1117' }}>
                <span>MACD Golden Cross</span>
                <span style={{ color:'#68d391' }}>+25 puan</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0',
                borderBottom:'1px solid #0d1117' }}>
                <span>Golden Cross (EMA20/50)</span>
                <span style={{ color:'#68d391' }}>+30 puan</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0',
                borderBottom:'1px solid #0d1117' }}>
                <span>Bollinger alt bandı</span>
                <span style={{ color:'#68d391' }}>+25 puan</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0',
                borderBottom:'1px solid #0d1117' }}>
                <span>Direnç kırılması</span>
                <span style={{ color:'#68d391' }}>+25 puan</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0',
                borderBottom:'1px solid #0d1117' }}>
                <span>Bullish Engulfing</span>
                <span style={{ color:'#68d391' }}>+25 puan</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0' }}>
                <span style={{ color:'#fc8181' }}>RSI aşırı alım (&gt;75)</span>
                <span style={{ color:'#fc8181' }}>-25 puan</span>
              </div>
            </div>
          </Section>
        </div>
      </div>

      <div style={{ textAlign:'right', marginTop:8 }}>
        <button onClick={save} disabled={saving}
          style={{ padding:'12px 40px', borderRadius:6, cursor:'pointer',
            fontSize:15, fontWeight:600, border:'1px solid',
            background: saved ? 'rgba(72,187,120,0.2)' : 'rgba(49,130,206,0.2)',
            borderColor: saved ? '#48bb78' : '#3182ce',
            color: saved ? '#68d391' : '#90cdf4' }}>
          {saving ? '⏳ Kaydediliyor...' : saved ? '✅ Kaydedildi!' : '💾 Kaydet'}
        </button>
      </div>
    </div>
  );
}
