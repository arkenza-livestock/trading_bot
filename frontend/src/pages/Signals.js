import React, { useState, useEffect, useRef } from 'react';

const trSaat = (t) => t ? new Date(t).toLocaleString('tr-TR') : '-';

const TradingViewChart = ({ symbol, interval='240' }) => {
  const containerRef = useRef(null);
  const widgetRef    = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (widgetRef.current) {
      widgetRef.current.remove();
      widgetRef.current = null;
    }

    const script = document.createElement('script');
    script.src   = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol:           `BINANCE:${symbol}`,
      interval,
      timezone:         'Europe/Istanbul',
      theme:            'dark',
      style:            '1',
      locale:           'tr',
      enable_publishing: false,
      hide_top_toolbar:  false,
      hide_legend:       false,
      save_image:        false,
      calendar:          false,
      hide_volume:       false,
      support_host:      'https://www.tradingview.com',
      width:             '100%',
      height:            '100%',
      studies: [
        'RSI@tv-basicstudies',
        'MACD@tv-basicstudies',
        'BB@tv-basicstudies'
      ]
    });

    const container = document.createElement('div');
    container.className = 'tradingview-widget-container';
    container.style.width  = '100%';
    container.style.height = '100%';

    const widget = document.createElement('div');
    widget.className = 'tradingview-widget-container__widget';
    widget.style.width  = '100%';
    widget.style.height = '100%';

    container.appendChild(widget);
    container.appendChild(script);

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(container);
    widgetRef.current = container;

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [symbol, interval]);

  return <div ref={containerRef} style={{ width:'100%', height:'100%' }} />;
};

export default function Signals({ api }) {
  const [signals,   setSignals]   = useState([]);
  const [selected,  setSelected]  = useState(null);
  const [filter,    setFilter]    = useState('ALIM');
  const [interval,  setInterval2] = useState('240');
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    load();
    const iv = setInterval(load, 20000);
    return () => clearInterval(iv);
  }, [api, filter]);

  const load = async () => {
    setLoading(true);
    try {
      const url = filter === 'ALIM'
        ? `${api}/api/signals/alim`
        : `${api}/api/signals`;
      const res  = await fetch(url);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setSignals(list);
      if (list.length > 0 && !selected) setSelected(list[0]);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const intervals = [
    { label:'1d',   value:'D',   text:'1 Gün' },
    { label:'4h',   value:'240', text:'4 Saat' },
    { label:'1h',   value:'60',  text:'1 Saat' },
    { label:'15m',  value:'15',  text:'15 Dk' },
    { label:'5m',   value:'5',   text:'5 Dk' },
    { label:'1m',   value:'1',   text:'1 Dk' },
  ];

  const getRiskColor = (risk) => {
    if (risk === 'DUSUK')  return '#68d391';
    if (risk === 'ORTA')   return '#f6ad55';
    return '#fc8181';
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 48px)', gap:16 }}>

      {/* Üst — Grafik */}
      <div style={{ background:'#0a0e1a', border:'1px solid #1e2736', borderRadius:10, overflow:'hidden' }}>

        {/* Grafik toolbar */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'10px 16px', borderBottom:'1px solid #1e2736' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:16, fontWeight:700, color:'#60a5fa' }}>
              {selected ? selected.symbol : 'Coin Seçin'}
            </span>
            {selected && (
              <>
                <span style={{ fontSize:12, color:'#718096' }}>
                  {parseFloat(selected.fiyat||0).toFixed(4)} USDT
                </span>
                <span style={{ fontSize:11, padding:'2px 8px', borderRadius:4, fontWeight:600,
                  background:'#0d2818', color:'#68d391' }}>
                  🚀 Puan: {selected.puan}
                </span>
                <span style={{ fontSize:11, padding:'2px 8px', borderRadius:4, fontWeight:600,
                  background:'#0a0e1a', border:'1px solid #1e2736',
                  color: getRiskColor(selected.risk) }}>
                  Risk: {selected.risk}
                </span>
              </>
            )}
          </div>

          {/* Zaman dilimi seçici */}
          <div style={{ display:'flex', gap:4 }}>
            {intervals.map(iv => (
              <button key={iv.value} onClick={() => setInterval2(iv.value)}
                style={{ padding:'4px 10px', borderRadius:4, cursor:'pointer',
                  fontSize:11, fontWeight:600, border:'1px solid',
                  background: interval===iv.value ? 'rgba(49,130,206,0.3)' : 'transparent',
                  borderColor: interval===iv.value ? '#3182ce' : '#2d3748',
                  color: interval===iv.value ? '#90cdf4' : '#718096' }}>
                {iv.text}
              </button>
            ))}
          </div>
        </div>

        {/* TradingView Grafik */}
        <div style={{ height:480 }}>
          {selected ? (
            <TradingViewChart symbol={selected.symbol} interval={interval} />
          ) : (
            <div style={{ height:'100%', display:'flex', alignItems:'center',
              justifyContent:'center', color:'#4a5568' }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>📈</div>
                <div>Sol taraftan bir sinyal seçin</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alt — Sinyal listesi + Detay */}
      <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:16, flex:1, minHeight:0 }}>

        {/* Sol — Liste */}
        <div style={{ background:'#0a0e1a', border:'1px solid #1e2736', borderRadius:10,
          display:'flex', flexDirection:'column', overflow:'hidden' }}>

          {/* Filtre */}
          <div style={{ padding:'10px 12px', borderBottom:'1px solid #1e2736',
            display:'flex', gap:6 }}>
            {['ALIM','TÜMÜ'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding:'5px 12px', borderRadius:5, cursor:'pointer',
                  fontSize:11, fontWeight:600, border:'1px solid',
                  background: filter===f ? 'rgba(49,130,206,0.2)' : 'transparent',
                  borderColor: filter===f ? '#3182ce' : '#2d3748',
                  color: filter===f ? '#90cdf4' : '#718096' }}>
                {f === 'ALIM' ? '🚀 Alım' : '📋 Tümü'}
              </button>
            ))}
            <span style={{ marginLeft:'auto', fontSize:11, color:'#4a5568',
              alignSelf:'center' }}>
              {loading ? '⏳' : `${signals.length} coin`}
            </span>
          </div>

          {/* Liste */}
          <div style={{ flex:1, overflowY:'auto' }}>
            {signals.length === 0 ? (
              <div style={{ textAlign:'center', padding:40, color:'#4a5568', fontSize:12 }}>
                {loading ? 'Yükleniyor...' : 'Sinyal bulunamadı'}
              </div>
            ) : signals.map((s,i) => (
              <div key={i} onClick={() => setSelected(s)}
                style={{ padding:'10px 12px', cursor:'pointer', borderBottom:'1px solid #0d1117',
                  background: selected?.symbol===s.symbol ? 'rgba(49,130,206,0.1)' : 'transparent',
                  borderLeft: selected?.symbol===s.symbol ? '3px solid #3182ce' : '3px solid transparent',
                  transition:'all 0.1s' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <span style={{ fontWeight:700, color:'#e2e8f0', fontSize:13 }}>{s.symbol}</span>
                    <span style={{ marginLeft:8, fontSize:10, color:'#718096' }}>{s.trend}</span>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontWeight:800, fontSize:15,
                      color: s.puan >= 70 ? '#68d391' : s.puan >= 50 ? '#f6ad55' : '#fc8181' }}>
                      {s.puan}
                    </div>
                    <div style={{ fontSize:9, color:'#4a5568' }}>puan</div>
                  </div>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                  <span style={{ fontSize:11, color:'#718096' }}>
                    RSI: {parseFloat(s.rsi||0).toFixed(1)}
                  </span>
                  <span style={{ fontSize:10, padding:'1px 6px', borderRadius:3,
                    background: s.sinyal==='ALIM'?'#0d2818':'s.sinyal==="SATIS"?"#2d1111":"#1a2744"',
                    color: s.sinyal==='ALIM'?'#68d391':s.sinyal==='SATIS'?'#fc8181':'#60a5fa',
                    fontWeight:600 }}>
                    {s.sinyal}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sağ — Detay */}
        <div style={{ background:'#0a0e1a', border:'1px solid #1e2736', borderRadius:10,
          overflowY:'auto', padding:'16px 20px' }}>
          {selected ? (
            <div>
              {/* Başlık */}
              <div style={{ display:'flex', justifyContent:'space-between',
                alignItems:'center', marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:22, fontWeight:800, color:'#e2e8f0' }}>{selected.symbol}</div>
                  <div style={{ fontSize:12, color:'#718096', marginTop:2 }}>
                    {parseFloat(selected.fiyat||0).toFixed(6)} USDT ·
                    {(selected.degisim24h||0) >= 0 ? ' +' : ' '}
                    {parseFloat(selected.degisim24h||0).toFixed(2)}%
                  </div>
                </div>
                <span style={{ padding:'6px 16px', borderRadius:8, fontSize:14, fontWeight:700,
                  background:'#0d2818', color:'#68d391' }}>
                  🚀 {selected.puan} Puan
                </span>
              </div>

              {/* Metrikler */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
                {[
                  { label:'RSI', value: parseFloat(selected.rsi||0).toFixed(1),
                    color: selected.rsi < 35 ? '#68d391' : selected.rsi > 65 ? '#fc8181' : '#e2e8f0' },
                  { label:'Risk', value: selected.risk, color: getRiskColor(selected.risk) },
                  { label:'Trend', value: selected.trend, color:'#60a5fa' },
                  { label:'BB %', value: `${parseFloat(selected.bollinger_pct||0).toFixed(1)}%`,
                    color: selected.bollinger_pct < 20 ? '#68d391' : selected.bollinger_pct > 80 ? '#fc8181' : '#e2e8f0' },
                  { label:'OBV', value: selected.obv_trend, color: selected.obv_trend==='YUKARI'?'#68d391':'#fc8181' },
                  { label:'Hacim', value: `${selected.vol_oran}x`, color: selected.vol_oran > 2 ? '#68d391' : '#e2e8f0' },
                ].map((m,i) => (
                  <div key={i} style={{ background:'#060b14', border:'1px solid #1e2736',
                    borderRadius:8, padding:'10px 12px' }}>
                    <div style={{ fontSize:11, color:'#718096', marginBottom:4 }}>{m.label}</div>
                    <div style={{ fontSize:14, fontWeight:700, color:m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Hedef ve Stop */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                <div style={{ background:'#0d2818', border:'1px solid #1a4a2e',
                  borderRadius:8, padding:'12px 14px' }}>
                  <div style={{ fontSize:11, color:'#68d391', marginBottom:4 }}>🎯 Hedef</div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#68d391' }}>
                    {parseFloat(selected.hedef||0).toFixed(6)}
                  </div>
                </div>
                <div style={{ background:'#2d1111', border:'1px solid #4a1111',
                  borderRadius:8, padding:'12px 14px' }}>
                  <div style={{ fontSize:11, color:'#fc8181', marginBottom:4 }}>🛑 Stop Loss</div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#fc8181' }}>
                    {parseFloat(selected.stop_loss||0).toFixed(6)}
                  </div>
                </div>
              </div>

              {/* Pozitif faktörler */}
              {selected.pozitif?.length > 0 && (
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:12, color:'#68d391', fontWeight:700, marginBottom:8 }}>
                    ✅ POZİTİF FAKTÖRLER
                  </div>
                  {selected.pozitif.map((p,i) => (
                    <div key={i} style={{ fontSize:12, color:'#a0aec0', padding:'5px 10px',
                      marginBottom:4, background:'#0d2818', borderRadius:6,
                      borderLeft:'3px solid #68d391' }}>{p}</div>
                  ))}
                </div>
              )}

              {/* Negatif faktörler */}
              {selected.negatif?.length > 0 && (
                <div>
                  <div style={{ fontSize:12, color:'#fc8181', fontWeight:700, marginBottom:8 }}>
                    ⚠️ RİSK FAKTÖRLERİ
                  </div>
                  {selected.negatif.map((n,i) => (
                    <div key={i} style={{ fontSize:12, color:'#a0aec0', padding:'5px 10px',
                      marginBottom:4, background:'#2d1111', borderRadius:6,
                      borderLeft:'3px solid #fc8181' }}>{n}</div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:60, color:'#4a5568' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>👈</div>
              <div>Sol taraftan bir sinyal seçin</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
