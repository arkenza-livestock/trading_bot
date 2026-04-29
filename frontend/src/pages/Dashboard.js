import React, { useState, useEffect } from 'react';

const trSaat = (t) => t ? new Date(t).toLocaleString('tr-TR') : '-';

const Kart = ({ label, value, color, sub, icon }) => (
  <div style={{ background:'#0a0e1a', border:'1px solid #1e2736', borderRadius:10, padding:'16px 20px' }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
      <span style={{ fontSize:12, color:'#718096' }}>{label}</span>
      <span style={{ fontSize:20 }}>{icon}</span>
    </div>
    <div style={{ fontSize:22, fontWeight:800, color:color||'#e2e8f0' }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:'#4a5568', marginTop:4 }}>{sub}</div>}
  </div>
);

export default function Dashboard({ api }) {
  const [signals,  setSignals]  = useState([]);
  const [scanLogs, setScanLogs] = useState([]);
  const [status,   setStatus]   = useState({});

  useEffect(() => {
    load();
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, [api]);

  const load = async () => {
    try {
      const [sRes, lRes, stRes] = await Promise.all([
        fetch(`${api}/api/signals/alim`).then(r=>r.json()),
        fetch(`${api}/api/scan-logs`).then(r=>r.json()),
        fetch(`${api}/api/status`).then(r=>r.json()),
      ]);
      setSignals(Array.isArray(sRes) ? sRes : []);
      setScanLogs(Array.isArray(lRes) ? lRes : []);
      setStatus(stRes||{});
    } catch(e) { console.error(e); }
  };

  const lastScan   = scanLogs[0];
  const topSignals = signals.slice(0, 5);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">📊 Dashboard</div>
          <div className="page-sub">Gerçek zamanlı kripto alım sinyalleri</div>
        </div>
        <div style={{ fontSize:11, color:'#4a5568' }}>
          {status.lastScan && `🕐 Son tarama: ${trSaat(status.lastScan)}`}
        </div>
      </div>

      {/* Stat kartlar */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        <Kart label="Alım Sinyali" icon="🚀"
          value={status.totalSignals||0}
          color="#68d391"
          sub="Bu taramada" />
        <Kart label="Toplam Tarama" icon="🔍"
          value={status.scanCount||0}
          color="#60a5fa" />
        <Kart label="Engine" icon="⚡"
          value={status.running?'Çalışıyor':'Durduruldu'}
          color={status.running?'#68d391':'#fc8181'} />
        <Kart label="Son Tarama" icon="⏰"
          value={lastScan ? `${((Date.now()-new Date(lastScan.created_at).getTime())/60000).toFixed(0)}dk önce` : '-'}
          color="#a0aec0" />
      </div>

      {/* Son tarama */}
      {lastScan && (
        <div style={{ background:'#0a0e1a', border:'1px solid #1e2736', borderRadius:10,
          padding:'12px 20px', marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <span style={{ fontSize:12, color:'#718096' }}>🔍 Son Tarama · </span>
              <span style={{ fontSize:12, color:'#a0aec0' }}>{trSaat(lastScan.created_at)}</span>
            </div>
            <div style={{ fontSize:12, color:'#718096' }}>
              {lastScan.coin_count} coin · {((lastScan.duration_ms||0)/1000).toFixed(1)}s
            </div>
          </div>
          {lastScan.signal_count > 0 && (
            <div style={{ marginTop:8, fontSize:12, color:'#68d391' }}>
              🚀 {(lastScan.signals_found||[]).join(' · ')}
            </div>
          )}
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>

        {/* En güçlü sinyaller */}
        <div className="card">
          <div className="card-title">🏆 En Güçlü Alım Sinyalleri</div>
          {topSignals.length === 0 ? (
            <div style={{ textAlign:'center', padding:30, color:'#4a5568', fontSize:12 }}>
              Henüz sinyal yok — Engine başlatın
            </div>
          ) : (
            <div>
              {topSignals.map((s,i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between',
                  alignItems:'center', padding:'10px 0', borderBottom:'1px solid #0d1117' }}>
                  <div>
                    <div style={{ fontWeight:700, color:'#60a5fa', fontSize:13 }}>{s.symbol}</div>
                    <div style={{ fontSize:11, color:'#718096', marginTop:2 }}>{s.trend}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontWeight:700, color:'#68d391', fontSize:15 }}>{s.puan}</div>
                    <div style={{ fontSize:10, color:'#4a5568' }}>puan</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tarama geçmişi */}
        <div className="card">
          <div className="card-title">📋 Tarama Geçmişi</div>
          {scanLogs.length === 0 ? (
            <div style={{ textAlign:'center', padding:30, color:'#4a5568', fontSize:12 }}>
              Henüz tarama yok
            </div>
          ) : (
            <div>
              {scanLogs.slice(0,6).map((l,i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between',
                  padding:'8px 0', borderBottom:'1px solid #0d1117', fontSize:12 }}>
                  <div>
                    <span style={{ color:'#718096' }}>{trSaat(l.created_at)}</span>
                    <span style={{ marginLeft:8, color:(l.signal_count||0)>0?'#68d391':'#4a5568' }}>
                      {(l.signal_count||0)>0 ? `🚀 ${l.signal_count} sinyal` : '❌ Sinyal yok'}
                    </span>
                  </div>
                  <span style={{ color:'#4a5568' }}>{l.coin_count} coin</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* İndikatör açıklaması */}
      <div className="card">
        <div className="card-title">📈 Kullanılan İndikatörler</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          {[
            { icon:'📉', name:'RSI (14)', desc:'Aşırı satım/alım bölgesi' },
            { icon:'📊', name:'EMA 20/50/200', desc:'Trend yönü ve crossover' },
            { icon:'⚡', name:'MACD', desc:'Momentum ve divergence' },
            { icon:'🎯', name:'Bollinger Bands', desc:'Fiyat bant pozisyonu' },
            { icon:'📦', name:'OBV', desc:'Hacim bazlı trend' },
            { icon:'💧', name:'Hacim', desc:'Alım/satım baskısı' },
            { icon:'🏛️', name:'Destek/Direnç', desc:'Kritik fiyat seviyeleri' },
            { icon:'🕯️', name:'Mum Yapıları', desc:'Hammer, Engulfing, Doji' },
          ].map((ind,i) => (
            <div key={i} style={{ background:'#060b14', border:'1px solid #1e2736',
              borderRadius:8, padding:'12px 14px' }}>
              <div style={{ fontSize:20, marginBottom:6 }}>{ind.icon}</div>
              <div style={{ fontSize:12, fontWeight:700, color:'#e2e8f0', marginBottom:4 }}>{ind.name}</div>
              <div style={{ fontSize:11, color:'#4a5568' }}>{ind.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
