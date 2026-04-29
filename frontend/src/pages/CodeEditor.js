import React, { useState, useEffect } from 'react';

export default function CodeEditor({ api }) {
  const [code,     setCode]     = useState('');
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [restored, setRestored] = useState(false);

  useEffect(() => { load(); }, [api]);

  const load = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${api}/api/code`);
      const data = await res.json();
      setCode(data.code || '');
    } catch(e) { setError('Kod yüklenemedi: ' + e.message); }
    setLoading(false);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res  = await fetch(`${api}/api/code`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code })
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(data.error || 'Kayıt hatası');
      }
    } catch(e) { setError('Kayıt hatası: ' + e.message); }
    setSaving(false);
  };

  const restore = async () => {
    if (!window.confirm('Backup\'a geri dön? Mevcut değişiklikler kaybolacak.')) return;
    try {
      const res  = await fetch(`${api}/api/code/restore`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setRestored(true);
        await load();
        setTimeout(() => setRestored(false), 3000);
      } else {
        setError(data.error || 'Restore hatası');
      }
    } catch(e) { setError('Restore hatası: ' + e.message); }
  };

  const lineCount = code.split('\n').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">💻 Kod Editörü</div>
          <div className="page-sub">
            analysis.js — {lineCount} satır · İndikatör ve puan sistemini düzenle
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={restore}
            style={{ padding:'9px 16px', borderRadius:6, cursor:'pointer',
              fontSize:13, fontWeight:600, border:'1px solid #4a5568',
              background:'transparent', color:'#718096' }}>
            {restored ? '✅ Geri Yüklendi' : '↩️ Backup'}
          </button>
          <button onClick={load}
            style={{ padding:'9px 16px', borderRadius:6, cursor:'pointer',
              fontSize:13, fontWeight:600, border:'1px solid #4a5568',
              background:'transparent', color:'#718096' }}>
            🔄 Yenile
          </button>
          <button onClick={save} disabled={saving}
            style={{ padding:'9px 24px', borderRadius:6, cursor:'pointer',
              fontSize:13, fontWeight:600, border:'1px solid',
              background: saved ? 'rgba(72,187,120,0.2)' : 'rgba(49,130,206,0.2)',
              borderColor: saved ? '#48bb78' : '#3182ce',
              color: saved ? '#68d391' : '#90cdf4' }}>
            {saving ? '⏳ Kaydediliyor...' : saved ? '✅ Kaydedildi!' : '💾 Kaydet'}
          </button>
        </div>
      </div>

      {/* Bilgi kutusu */}
      <div style={{ background:'#0d1a2d', border:'1px solid #1e3a5f', borderRadius:8,
        padding:'12px 16px', marginBottom:16,
        display:'flex', gap:16, alignItems:'center' }}>
        <div style={{ fontSize:11, color:'#718096', lineHeight:1.8 }}>
          <b style={{ color:'#60a5fa' }}>💡 Nasıl kullanılır?</b><br/>
          Puan sistemini veya indikatörleri değiştir → Kaydet → Engine otomatik yenilenir.<br/>
          <b style={{ color:'#f6ad55' }}>⚠️ Dikkat:</b> Hatalı kod engine'i durdurabilir. Backup her kayıtta otomatik alınır.
        </div>
        <div style={{ borderLeft:'1px solid #1e3a5f', paddingLeft:16, fontSize:11,
          color:'#718096', lineHeight:2, whiteSpace:'nowrap' }}>
          <div>📊 <b style={{ color:'#e2e8f0' }}>ALIM</b> → puan ≥ 50</div>
          <div>📋 <b style={{ color:'#e2e8f0' }}>BEKLE</b> → -20 ≤ puan &lt; 50</div>
          <div>📉 <b style={{ color:'#e2e8f0' }}>SATIS</b> → puan &lt; -20</div>
        </div>
      </div>

      {error && (
        <div style={{ background:'#2d1111', border:'1px solid #4a1111', borderRadius:8,
          padding:'10px 14px', marginBottom:16, color:'#fc8181', fontSize:13 }}>
          ❌ {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:'#718096' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>⏳</div>
          <div>Kod yükleniyor...</div>
        </div>
      ) : (
        <div style={{ position:'relative' }}>
          {/* Satır numaraları */}
          <div style={{ display:'flex', background:'#0d1117', border:'1px solid #1e2736',
            borderRadius:8, overflow:'hidden' }}>

            {/* Satır numaraları */}
            <div style={{ padding:'16px 8px', background:'#0a0e1a', borderRight:'1px solid #1e2736',
              color:'#4a5568', fontSize:12, fontFamily:'monospace', lineHeight:'1.6',
              textAlign:'right', userSelect:'none', minWidth:48 }}>
              {code.split('\n').map((_,i) => (
                <div key={i}>{i+1}</div>
              ))}
            </div>

            {/* Editör */}
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              spellCheck={false}
              style={{
                flex:1, padding:'16px', background:'transparent',
                color:'#e2e8f0', fontFamily:"'Courier New', monospace",
                fontSize:13, lineHeight:'1.6', border:'none', outline:'none',
                resize:'none', minHeight:600,
                height: Math.max(600, lineCount * 20.8)
              }}
            />
          </div>

          {/* Alt bar */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
            padding:'8px 12px', background:'#0a0e1a', border:'1px solid #1e2736',
            borderTop:'none', borderRadius:'0 0 8px 8px' }}>
            <div style={{ fontSize:11, color:'#4a5568' }}>
              JavaScript · analysis.js · {lineCount} satır
            </div>
            <div style={{ display:'flex', gap:16, fontSize:11, color:'#4a5568' }}>
              <span>Ctrl+S → Kaydet</span>
              <span>Tab → 2 boşluk</span>
            </div>
          </div>
        </div>
      )}

      {/* Ctrl+S kısayolu */}
      <div style={{ display:'none' }}
        onKeyDown={e => { if (e.ctrlKey && e.key === 's') { e.preventDefault(); save(); } }} />
    </div>
  );
}
