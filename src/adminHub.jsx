import { useState, useMemo, useEffect, useRef } from 'react';
import { loadPending, savePending, loadForum, saveForum } from './adminStorage.js';
import { loadCategories, saveCategories, loadMotorTypes, saveMotorTypes } from './siteContent.js';
import { normalizeFault, getPendingId, getFaultCompletenessWarnings } from './faultUtils.js';
import { formatDateTimeMinute, getCommentDateLabel } from './dateUtils.js';

const TABS = [
  { key: 'pending', label: 'Öneriler' },
  { key: 'forum', label: 'Tartışma' },
  { key: 'models', label: 'Modeller' },
  { key: 'categories', label: 'Etiketler' },
  { key: 'bulkimport', label: '📥 Toplu Arıza' },
  { key: 'bulkmodels', label: '🚗 Toplu Model' },
];

// ── CSV helpers ───────────────────────────────────────────────────────────────
const RISK_VALUES = ['FECİ', 'YÜKSEK', 'ORTA', 'DÜŞÜK'];

function splitCSVLine(line, sep = ',') {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === sep && !inQuotes) {
      result.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

/** CSV ayırıcısını otomatik algıla: virgül, noktalı virgül veya tab */
function detectSeparator(headerLine) {
  // Tırnak dışındaki ayırıcıları say
  const count = (sep) => {
    let n = 0, inQ = false;
    for (const ch of headerLine) {
      if (ch === '"') inQ = !inQ;
      else if (ch === sep && !inQ) n++;
    }
    return n;
  };
  const comma = count(',');
  const semi = count(';');
  const tab = count('\t');
  if (semi > comma && semi > tab) return ';';
  if (tab > comma && tab > semi) return '\t';
  return ',';
}

function parseCSV(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n|\r/).filter(l => l.trim());
  if (lines.length < 2) return { rows: [], errors: ['CSV boş veya sadece başlık satırı içeriyor.'] };

  const sep = detectSeparator(lines[0]);
  const header = splitCSVLine(lines[0], sep).map(h => h.trim().toLowerCase());
  const rows = [];
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCSVLine(lines[i], sep);
    if (cells.length === 0 || cells.every(c => !c.trim())) continue;

    const obj = {};
    header.forEach((col, idx) => { obj[col] = (cells[idx] || '').trim(); });

    const fault = {
      brand: obj['brand'] || obj['marka'] || '',
      model: obj['model'] || '',
      year: obj['year'] || obj['yil'] || obj['yıl'] || '',
      motorType: obj['motortype'] || obj['motortipi'] || obj['motor_tipi'] || 'Benzin',
      fault: obj['fault'] || obj['ariza'] || obj['arıza'] || '',
      symptoms: obj['symptoms'] || obj['belirtiler'] || obj['belirti'] || '',
      checkTip: obj['checktip'] || obj['check_tip'] || obj['kontrolipu'] || obj['kontrol_ipucu'] || '',
      risk: (obj['risk'] || 'ORTA').toUpperCase(),
      costMin: Number(obj['costmin'] || obj['cost_min'] || obj['masraf_min'] || 0) || 0,
      costMax: Number(obj['costmax'] || obj['cost_max'] || obj['masraf_max'] || 0) || 0,
      kmDisplay: obj['kmdisplay'] || obj['km_display'] || obj['km'] || '',
      kmMin: Number(obj['kmmin'] || obj['km_min'] || 0) || 0,
      reportCount: Math.max(1, Number(obj['reportcount'] || obj['report_count'] || obj['dogrulama'] || 1) || 1),
      category: obj['category'] || obj['kategori'] || 'Motor',
      _row: i + 1,
    };

    const rowErrors = [];
    if (!fault.brand) rowErrors.push('brand boş');
    if (!fault.model) rowErrors.push('model boş');
    if (!fault.fault) rowErrors.push('fault/arıza boş');
    if (!RISK_VALUES.includes(fault.risk)) rowErrors.push(`risk geçersiz (${fault.risk})`);

    if (rowErrors.length) {
      errors.push(`Satır ${i + 1}: ${rowErrors.join(', ')}`);
    }

    rows.push({ fault, rowErrors });
  }

  return { rows, errors };
}

const CSV_EXAMPLE = `brand,model,year,motorType,fault,symptoms,checkTip,risk,costMin,costMax,kmDisplay,kmMin,reportCount,category
Volkswagen,Golf 7 1.4 TSI,2013-2019,Benzin,Zincir sesi,Soğuk çalıştırmada şakırtı,Soğukta ses dinle,YÜKSEK,19000,45000,60.000 km+,60000,88,Motor
Toyota,Corolla E210,2019-2023,Hibrit,CVT vınlama,Hızlanmada vınlama,Hız artışında dinle,DÜŞÜK,5000,12000,30.000 km+,30000,89,Şanzıman`;

// ── Model CSV helpers ─────────────────────────────────────────────────────────
function parseModelCSV(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n|\r/).filter(l => l.trim());
  if (lines.length < 2) return { rows: [], errors: ['CSV boş veya sadece başlık satırı içeriyor.'] };

  const sep = detectSeparator(lines[0]);
  const header = splitCSVLine(lines[0], sep).map(h => h.trim().toLowerCase());
  const rows = [];
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCSVLine(lines[i], sep);
    if (cells.length === 0 || cells.every(c => !c.trim())) continue;

    const obj = {};
    header.forEach((col, idx) => { obj[col] = (cells[idx] || '').trim(); });

    // strengths: virgülle ayrılmış string → dizi
    const parseList = (raw) => raw ? raw.split(',').map(s => s.trim()).filter(Boolean) : [];

    // maintenanceTips: "km:tip|km2:tip2" formatı veya JSON dizisi
    const parseMaint = (raw) => {
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
      return raw.split('|').map(s => {
        const idx = s.indexOf(':');
        if (idx === -1) return { km: '', tip: s.trim() };
        return { km: s.slice(0, idx).trim(), tip: s.slice(idx + 1).trim() };
      }).filter(m => m.km || m.tip);
    };

    const model = {
      brand:        obj['brand']        || obj['marka']       || '',
      model:        obj['model']        || '',
      heroTitle:    obj['herotitle']    || obj['hero_title']  || obj['baslik'] || obj['başlık'] || '',
      heroSubtitle: obj['herosubtitle'] || obj['hero_subtitle'] || obj['altbaslik'] || obj['altbaşlık'] || '',
      blogIntro:    obj['blogintro']    || obj['blog_intro']  || obj['tanitim'] || obj['tanıtım'] || '',
      buyerAdvice:  obj['buyeradvice']  || obj['buyer_advice'] || obj['tavsiye'] || '',
      specs: {
        motor:    obj['motor']    || '',
        beygir:   obj['beygir']  || obj['hp'] || '',
        tork:     obj['tork']    || obj['torque'] || '',
        sanziman: obj['sanziman'] || obj['şanzıman'] || obj['transmission'] || '',
        yakit:    obj['yakit']   || obj['yakıt'] || obj['fuel'] || '',
        hiz:      obj['hiz']     || obj['hız'] || obj['speed'] || '',
        agirlik:  obj['agirlik'] || obj['ağırlık'] || obj['weight'] || '',
        bagaj:    obj['bagaj']   || obj['trunk'] || '',
      },
      strengths:       parseList(obj['strengths']       || obj['guclu']       || obj['güçlü'] || ''),
      weaknesses:      parseList(obj['weaknesses']      || obj['zayif']       || obj['zayıf'] || ''),
      maintenanceTips: parseMaint(obj['maintenancetips'] || obj['maintenance_tips'] || obj['bakim'] || obj['bakım'] || ''),
      _row: i + 1,
    };

    const rowErrors = [];
    if (!model.brand) rowErrors.push('brand/marka boş');
    if (!model.model) rowErrors.push('model boş');

    if (rowErrors.length) errors.push(`Satır ${i + 1}: ${rowErrors.join(', ')}`);
    rows.push({ model, rowErrors });
  }

  return { rows, errors };
}

const MODEL_CSV_EXAMPLE = `brand,model,heroTitle,heroSubtitle,blogIntro,buyerAdvice,motor,beygir,tork,sanziman,yakit,hiz,agirlik,bagaj,strengths,weaknesses,maintenanceTips
Volkswagen,Golf 7 1.4 TSI,Volkswagen Golf 7 1.4 TSI,2013-2019 · Benzin,Golf 7 güvenilir ve ekonomik bir hatchback.,İkinci el alırken DSG'ye dikkat edin.,1.4 TSI,125 hp,200 Nm,7 ileri DSG,5.8L/100km,203 km/h,1235 kg,380 L,"Düşük yakıt tüketimi, Sürüş konforu","DSG vites sorunları, Yüksek bakım maliyeti",60000:Yağ değişimi|120000:Zincir kontrolü
Toyota,Corolla E210,Toyota Corolla E210,2019-2023 · Hibrit,Corolla E210 düşük yakıt tüketimiyle öne çıkar.,Şarj sistemi ve akü durumunu kontrol ettirin.,1.8 Hibrit,140 hp,142 Nm,CVT,4.3L/100km,180 km/h,1370 kg,217 L,"Yakıt verimliliği, Düşük emisyon","CVT hissiyatı, Sınırlı bagaj",40000:Hibrit akü kontrolü|80000:Fren balataları`;

// ── BulkImportTab component ───────────────────────────────────────────────────
function BulkImportTab({ onApproveFaults, onNotify }) {
  const [parsed, setParsed] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = parseCSV(e.target.result);
      setParsed(result);
      setSelected(new Set(result.rows.map((_, i) => i)));
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const toggleRow = (i) => setSelected(prev => {
    const next = new Set(prev);
    next.has(i) ? next.delete(i) : next.add(i);
    return next;
  });

  const toggleAll = () => {
    if (!parsed) return;
    if (selected.size === parsed.rows.length) setSelected(new Set());
    else setSelected(new Set(parsed.rows.map((_, i) => i)));
  };

  const handleImport = async () => {
    if (!parsed || selected.size === 0) return;
    setImporting(true);

    // Tüm geçerli seçili satırları bir diziye topla
    const toAdd = [];
    let baseTime = Date.now();
    for (const i of [...selected].sort((a, b) => a - b)) {
      const row = parsed.rows[i];
      if (row.rowErrors.length > 0) continue;
      toAdd.push({ ...row.fault, id: baseTime++ });
    }

    // Hepsini tek seferde gönder (stale closure sorununu önler)
    if (toAdd.length > 0) {
      await onApproveFaults(toAdd);
    }

    setImporting(false);
    onNotify(`${toAdd.length} arıza başarıyla eklendi.`);
    setParsed(null);
    setSelected(new Set());
  };

  const validRows = parsed ? parsed.rows.filter(r => r.rowErrors.length === 0) : [];
  const selectedValid = parsed ? [...selected].filter(i => parsed.rows[i]?.rowErrors.length === 0).length : 0;

  return (
    <div className="bulk-import-wrap">
      {/* Drop zone */}
      <div
        className={`bulk-dropzone${dragOver ? ' dragover' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])}
        />
        <div className="bulk-dropzone-icon">📂</div>
        <p className="bulk-dropzone-title">CSV dosyası sürükleyin veya tıklayın</p>
        <p className="bulk-dropzone-sub">UTF-8 kodlamalı .csv dosyası · Virgülle ayrılmış</p>
      </div>

      {/* Parse errors */}
      {parsed && parsed.errors.length > 0 && (
        <div className="bulk-error-list">
          <strong>⚠️ Sorunlu satırlar ({parsed.errors.length}):</strong>
          <ul>{parsed.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}

      {/* Preview table */}
      {parsed && parsed.rows.length > 0 && (
        <div className="bulk-preview">
          <div className="bulk-preview-header">
            <span>{parsed.rows.length} satır okundu · <strong>{validRows.length} geçerli</strong></span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button type="button" className="btn-cancel btn-sm" onClick={toggleAll}>
                {selected.size === parsed.rows.length ? 'Hiçbirini Seçme' : 'Tümünü Seç'}
              </button>
              <button
                type="button"
                className="btn-submit btn-sm"
                disabled={importing || selectedValid === 0}
                onClick={handleImport}
              >
                {importing ? 'Ekleniyor…' : `${selectedValid} Arıza Ekle`}
              </button>
            </div>
          </div>
          <div className="bulk-table-wrap">
            <table className="bulk-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Marka</th>
                  <th>Model</th>
                  <th>Yıl</th>
                  <th>Arıza</th>
                  <th>Risk</th>
                  <th>Kategori</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {parsed.rows.map((row, i) => (
                  <tr
                    key={i}
                    className={`bulk-row${row.rowErrors.length ? ' bulk-row-error' : ''}${selected.has(i) ? ' bulk-row-selected' : ''}`}
                    onClick={() => toggleRow(i)}
                  >
                    <td><input type="checkbox" readOnly checked={selected.has(i)} /></td>
                    <td>{row.fault.brand}</td>
                    <td>{row.fault.model}</td>
                    <td>{row.fault.year}</td>
                    <td title={row.fault.fault}>{row.fault.fault?.slice(0, 40)}{row.fault.fault?.length > 40 ? '…' : ''}</td>
                    <td><span className={`risk-badge ${row.fault.risk}`}>{row.fault.risk}</span></td>
                    <td>{row.fault.category}</td>
                    <td>
                      {row.rowErrors.length > 0
                        ? <span className="bulk-status-error" title={row.rowErrors.join(', ')}>⚠ Hatalı</span>
                        : <span className="bulk-status-ok">✓ Hazır</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Guide */}
      <details className="bulk-guide" open={!parsed}>
        <summary>📋 CSV Format Kılavuzu</summary>
        <div className="bulk-guide-body">
          <p>İlk satır başlık satırı olmalıdır. Desteklenen sütunlar:</p>
          <div className="bulk-cols-grid">
            {[
              { col: 'brand', desc: 'Araç markası (Volkswagen, Toyota…)', required: true },
              { col: 'model', desc: 'Araç modeli (Golf 7 1.4 TSI)', required: true },
              { col: 'year', desc: 'Yıl aralığı (2013-2019)', required: false },
              { col: 'motorType', desc: 'Benzin / Dizel / Hibrit / Elektrik', required: false },
              { col: 'fault', desc: 'Arıza başlığı', required: true },
              { col: 'symptoms', desc: 'Belirtiler (virgülle ayrılabilir)', required: false },
              { col: 'checkTip', desc: 'Kontrol ipucu', required: false },
              { col: 'risk', desc: 'FECİ / YÜKSEK / ORTA / DÜŞÜK', required: true },
              { col: 'costMin', desc: 'Minimum tamir masrafı (₺)', required: false },
              { col: 'costMax', desc: 'Maksimum tamir masrafı (₺)', required: false },
              { col: 'kmDisplay', desc: 'KM gösterimi (60.000 km+)', required: false },
              { col: 'kmMin', desc: 'Minimum KM (sayısal, örn. 60000)', required: false },
              { col: 'reportCount', desc: 'Kullanıcı doğrulama sayısı', required: false },
              { col: 'category', desc: 'Motor / Şanzıman / Egzoz / Fren…', required: false },
            ].map(({ col, desc, required }) => (
              <div key={col} className="bulk-col-item">
                <code className="bulk-col-name">{col}</code>
                {required && <span className="bulk-col-req">zorunlu</span>}
                <span className="bulk-col-desc">{desc}</span>
              </div>
            ))}
          </div>

          <p style={{ marginTop: 16 }}><strong>Örnek CSV:</strong></p>
          <div className="bulk-guide-example-wrap">
            <button
              type="button"
              className="bulk-copy-btn"
              onClick={() => { navigator.clipboard.writeText(CSV_EXAMPLE); onNotify('Örnek CSV kopyalandı.'); }}
            >📋 Kopyala</button>
            <pre className="bulk-guide-example">{CSV_EXAMPLE}</pre>
          </div>

          <div className="bulk-guide-tips">
            <p>💡 <strong>İpuçları:</strong></p>
            <ul>
              <li>Virgül içeren değerleri çift tırnak içine alın: <code>"Motor, Egzoz"</code></li>
              <li>Başlık satırı küçük/büyük harf duyarsızdır</li>
              <li>Türkçe alternatif sütun adları da kabul edilir (örn. <code>marka</code>, <code>ariza</code>)</li>
              <li>Hatalı satırlar işaretlenir, yine de seçimi kaldırarak atlanabilir</li>
            </ul>
          </div>
        </div>
      </details>
    </div>
  );
}

// ── BulkModelImportTab component ─────────────────────────────────────────────
function BulkModelImportTab({ onApproveModels, onNotify }) {
  const [parsed, setParsed] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = parseModelCSV(e.target.result);
      setParsed(result);
      setSelected(new Set(result.rows.map((_, i) => i)));
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const toggleRow = (i) => setSelected(prev => {
    const next = new Set(prev);
    next.has(i) ? next.delete(i) : next.add(i);
    return next;
  });

  const toggleAll = () => {
    if (!parsed) return;
    if (selected.size === parsed.rows.length) setSelected(new Set());
    else setSelected(new Set(parsed.rows.map((_, i) => i)));
  };

  const handleImport = async () => {
    if (!parsed || selected.size === 0) return;
    setImporting(true);

    const toAdd = [];
    for (const i of [...selected].sort((a, b) => a - b)) {
      const row = parsed.rows[i];
      if (row.rowErrors.length > 0) continue;
      toAdd.push(row.model);
    }

    if (toAdd.length > 0) {
      await onApproveModels(toAdd);
    }

    setImporting(false);
    onNotify(`${toAdd.length} model başarıyla eklendi.`);
    setParsed(null);
    setSelected(new Set());
  };

  const validRows = parsed ? parsed.rows.filter(r => r.rowErrors.length === 0) : [];
  const selectedValid = parsed ? [...selected].filter(i => parsed.rows[i]?.rowErrors.length === 0).length : 0;

  return (
    <div className="bulk-import-wrap">
      {/* Drop zone */}
      <div
        className={`bulk-dropzone${dragOver ? ' dragover' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])}
        />
        <div className="bulk-dropzone-icon">🚗</div>
        <p className="bulk-dropzone-title">Model CSV dosyası sürükleyin veya tıklayın</p>
        <p className="bulk-dropzone-sub">UTF-8 kodlamalı .csv dosyası · Virgülle ayrılmış</p>
      </div>

      {/* Parse errors */}
      {parsed && parsed.errors.length > 0 && (
        <div className="bulk-error-list">
          <strong>⚠️ Sorunlu satırlar ({parsed.errors.length}):</strong>
          <ul>{parsed.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}

      {/* Preview table */}
      {parsed && parsed.rows.length > 0 && (
        <div className="bulk-preview">
          <div className="bulk-preview-header">
            <span>{parsed.rows.length} satır okundu · <strong>{validRows.length} geçerli</strong></span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button type="button" className="btn-cancel btn-sm" onClick={toggleAll}>
                {selected.size === parsed.rows.length ? 'Hiçbirini Seçme' : 'Tümünü Seç'}
              </button>
              <button
                type="button"
                className="btn-submit btn-sm"
                disabled={importing || selectedValid === 0}
                onClick={handleImport}
              >
                {importing ? 'Ekleniyor…' : `${selectedValid} Model Ekle`}
              </button>
            </div>
          </div>
          <div className="bulk-table-wrap">
            <table className="bulk-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Marka</th>
                  <th>Model</th>
                  <th>Başlık</th>
                  <th>Alt Başlık</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {parsed.rows.map((row, i) => (
                  <tr
                    key={i}
                    className={`bulk-row${row.rowErrors.length ? ' bulk-row-error' : ''}${selected.has(i) ? ' bulk-row-selected' : ''}`}
                    onClick={() => toggleRow(i)}
                  >
                    <td><input type="checkbox" readOnly checked={selected.has(i)} /></td>
                    <td>{row.model.brand}</td>
                    <td>{row.model.model}</td>
                    <td title={row.model.heroTitle}>{row.model.heroTitle?.slice(0, 30)}{row.model.heroTitle?.length > 30 ? '…' : ''}</td>
                    <td title={row.model.heroSubtitle}>{row.model.heroSubtitle?.slice(0, 30)}{row.model.heroSubtitle?.length > 30 ? '…' : ''}</td>
                    <td>
                      {row.rowErrors.length > 0
                        ? <span className="bulk-status-error" title={row.rowErrors.join(', ')}>⚠ Hatalı</span>
                        : <span className="bulk-status-ok">✓ Hazır</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Guide */}
      <details className="bulk-guide" open={!parsed}>
        <summary>📋 CSV Format Kılavuzu (Model)</summary>
        <div className="bulk-guide-body">
          <p>İlk satır başlık satırı olmalıdır. Desteklenen sütunlar:</p>
          <div className="bulk-cols-grid">
            {[
              { col: 'brand', desc: 'Araç markası (Volkswagen, Toyota…)', required: true },
              { col: 'model', desc: 'Model adı (arıza kayıtlarındaki ile aynı)', required: true },
              { col: 'heroTitle', desc: 'Sayfa başlığı', required: false },
              { col: 'heroSubtitle', desc: 'Alt başlık (yıl & motor bilgisi)', required: false },
              { col: 'blogIntro', desc: 'Tanıtım / makale metni', required: false },
              { col: 'buyerAdvice', desc: 'Alıcı tavsiyesi', required: false },
              { col: 'motor', desc: 'Motor hacmi', required: false },
              { col: 'beygir', desc: 'Beygir gücü', required: false },
              { col: 'tork', desc: 'Tork (Nm)', required: false },
              { col: 'sanziman', desc: 'Şanzıman tipi', required: false },
              { col: 'yakit', desc: 'Yakıt tüketimi', required: false },
              { col: 'hiz', desc: 'Maksimum hız', required: false },
              { col: 'agirlik', desc: 'Ağırlık (kg)', required: false },
              { col: 'bagaj', desc: 'Bagaj hacmi (L)', required: false },
              { col: 'strengths', desc: 'Güçlü yönler — virgülle ayrılmış (örn. "Düşük yakıt, Konfor")', required: false },
              { col: 'weaknesses', desc: 'Zayıf yönler — virgülle ayrılmış (örn. "DSG sorunu, Yüksek bakım")', required: false },
              { col: 'maintenanceTips', desc: 'Bakım rehberi — km:açıklama|km2:açıklama2 (örn. 60000:Yağ|120000:Zincir)', required: false },
            ].map(({ col, desc, required }) => (
              <div key={col} className="bulk-col-item">
                <code className="bulk-col-name">{col}</code>
                {required && <span className="bulk-col-req">zorunlu</span>}
                <span className="bulk-col-desc">{desc}</span>
              </div>
            ))}
          </div>

          <p style={{ marginTop: 16 }}><strong>Örnek CSV:</strong></p>
          <div className="bulk-guide-example-wrap">
            <button
              type="button"
              className="bulk-copy-btn"
              onClick={() => { navigator.clipboard.writeText(MODEL_CSV_EXAMPLE); onNotify('Örnek CSV kopyalandı.'); }}
            >📋 Kopyala</button>
            <pre className="bulk-guide-example">{MODEL_CSV_EXAMPLE}</pre>
          </div>

          <div className="bulk-guide-tips">
            <p>💡 <strong>İpuçları:</strong></p>
            <ul>
              <li>Model adı mevcut bir arıza kaydındaki model adıyla eşleşirse otomatik bağlanır</li>
              <li>Aynı model zaten kayıtlıysa üzerine yazmaz, atlanır</li>
              <li>Virgül içeren değerleri çift tırnak içine alın: <code>"Düşük yakıt, Konfor"</code></li>
              <li>Başlık satırı küçük/büyük harf duyarsızdır</li>
              <li><code>strengths</code> ve <code>weaknesses</code> alanlarında virgülle ayrılmış liste kullanın; eğer değer virgül içeriyorsa tüm hücreyi çift tırnak içine alın</li>
              <li><code>maintenanceTips</code> için <code>60000:Yağ değişimi|120000:Zincir kontrolü</code> formatını kullanın</li>
            </ul>
          </div>
        </div>
      </details>
    </div>
  );
}

// ── POST_TYPE_LABELS ──────────────────────────────────────────────────────────
const POST_TYPE_LABELS = {
  usta: 'Usta önerisi',
  oneri: 'Öneri',
  soru: 'Soru',
  yorum: 'Yorum',
};

export default function AdminHub({
  open, tab, onTab, onClose,
  faults, models, onApproveFaults, onApproveModels, onEditFault, onEditModel, onNewModel, onNotify,
}) {
  const [pending, setPending] = useState([]);
  const [forum, setForum] = useState({});
  const [categories, setCategories] = useState([]);
  const [motorTypes, setMotorTypes] = useState([]);
  const [newCat, setNewCat] = useState('');
  const [newMotor, setNewMotor] = useState('');
  const [editPost, setEditPost] = useState(null);
  const [forumFilter, setForumFilter] = useState('all');
  const [forumSearch, setForumSearch] = useState('');

  useEffect(() => {
    if (!open) return;
    async function loadData() {
      try {
        const [pendingData, forumData, categoriesData, motorTypesData] = await Promise.all([
          loadPending(),
          loadForum(),
          loadCategories(),
          loadMotorTypes()
        ]);
        setPending(pendingData);
        setForum(forumData);
        setCategories(categoriesData);
        setMotorTypes(motorTypesData);
      } catch (err) {
        console.error("Failed to load admin hub data", err);
      }
    }
    loadData();
  }, [open]);

  useEffect(() => {
    const onStorage = async (e) => {
      if (e.key === 'ka_pending_faults') {
        const data = await loadPending();
        setPending(data);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const allPosts = useMemo(() => {
    const list = [];
    Object.entries(forum).forEach(([faultId, posts]) => {
      if (!Array.isArray(posts)) return;
      const fault = faults.find(f => String(f.id) === String(faultId));
      const faultTitle = fault
        ? `${fault.brand} ${fault.model} — ${fault.fault || fault.description}`
        : null;
      posts.forEach(p => {
        list.push({
          ...p,
          faultId,
          faultTitle,
          faultLabel: fault ? `${fault.brand} ${fault.model}` : `Silinmiş arıza (#${faultId})`,
          isReply: false,
        });
        (p.replies || []).forEach(r => {
          list.push({
            ...r,
            faultId,
            faultTitle,
            faultLabel: fault ? `${fault.brand} ${fault.model}` : `Silinmiş arıza (#${faultId})`,
            parentId: p.id,
            isReply: true,
          });
        });
      });
    });
    return list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [forum, faults]);

  const filteredPosts = useMemo(() => {
    let list = allPosts;
    if (forumFilter === 'topics') list = list.filter(p => !p.isReply);
    if (forumFilter === 'replies') list = list.filter(p => p.isReply);
    const q = forumSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(p =>
        (p.text || '').toLowerCase().includes(q) ||
        (p.username || '').toLowerCase().includes(q) ||
        (p.faultLabel || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [allPosts, forumFilter, forumSearch]);

  const removePending = (id) => {
    setPending(prev => {
      const next = prev.filter(p => getPendingId(p) !== id);
      savePending(next);
      return next;
    });
  };

  const approve = (item) => {
    const normalized = normalizeFault(item);
    onApproveFaults(normalized);
    removePending(getPendingId(item));
    onNotify('Öneri yayınlandı.');
  };

  const reject = (item) => {
    if (!confirm('Bu öneriyi reddetmek istiyor musunuz?')) return;
    removePending(getPendingId(item));
    onNotify('Öneri reddedildi.');
  };

  const openPendingEdit = (item) => {
    onEditFault({
      ...item,
      fault: item.fault || item.description,
      _pendingId: getPendingId(item),
    });
  };

  const deletePost = (faultId, postId, parentId) => {
    if (!confirm('Bu gönderiyi silmek istiyor musunuz?')) return;
    setForum(prev => {
      const next = { ...prev };
      if (parentId) {
        next[faultId] = (next[faultId] || []).map(p =>
          p.id === parentId ? { ...p, replies: (p.replies || []).filter(r => r.id !== postId) } : p
        );
      } else {
        next[faultId] = (next[faultId] || []).filter(p => p.id !== postId);
      }
      saveForum(next);
      return next;
    });
    onNotify('Gönderi silindi.');
  };

  const savePostEdit = () => {
    if (!editPost?.text?.trim()) return;
    const { faultId, id, parentId, text, type } = editPost;
    setForum(prev => {
      const next = { ...prev };
      if (parentId) {
        next[faultId] = (next[faultId] || []).map(p =>
          p.id === parentId
            ? { ...p, replies: (p.replies || []).map(r => r.id === id ? { ...r, text: text.trim() } : r) }
            : p
        );
      } else {
        next[faultId] = (next[faultId] || []).map(p =>
          p.id === id ? { ...p, text: text.trim(), ...(type ? { type } : {}) } : p
        );
      }
      saveForum(next);
      return next;
    });
    setEditPost(null);
    onNotify('Gönderi güncellendi.');
  };

  if (!open) return null;

  return (
    <>
      <div className="admin-hub-overlay" onClick={onClose} />
      <aside className="admin-hub">
        <header className="admin-hub-header">
          <h2>Yönetim paneli</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Kapat">×</button>
        </header>
        <nav className="admin-hub-tabs">
          {TABS.map(t => (
            <button
              key={t.key}
              type="button"
              className={`admin-hub-tab${tab === t.key ? ' active' : ''}`}
              onClick={() => onTab(t.key)}
            >
              {t.label}
              {t.key === 'pending' && pending.length > 0 && (
                <span className="admin-hub-badge">{pending.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="admin-hub-body">
          {tab === 'pending' && (
            pending.length === 0 ? (
              <p className="admin-hub-empty">Bekleyen kullanıcı önerisi yok.</p>
            ) : (
              <div className="admin-hub-list">
                {pending.map(p => {
                  const pid = getPendingId(p);
                  const warnings = getFaultCompletenessWarnings(p);
                  return (
                    <div key={pid} className="admin-hub-card">
                      <div className="admin-hub-card-top">
                        <strong>{p.brand} {p.model}</strong>
                        <span className={`risk-badge ${p.risk}`}>{p.risk}</span>
                      </div>
                      <p className="admin-hub-fault-title">{p.fault || p.description}</p>
                      {p.symptoms && <p className="admin-hub-meta">Belirti: {p.symptoms}</p>}
                      <p className="admin-hub-meta">
                        {p._submittedBy || p.suggestedBy || 'Anonim'}
                        {' · '}
                        {formatDateTimeMinute(p._submittedAt || p.suggestedAt, pid)}
                        {p.category ? ` · ${p.category}` : ''}
                      </p>
                      {(p.images?.length > 0) && (
                        <p className="admin-hub-meta">📷 {p.images.length} görsel</p>
                      )}
                      {warnings.length > 0 && (
                        <p className="admin-hub-warn">Eksik: {warnings.join(', ')}</p>
                      )}
                      <div className="admin-hub-card-actions">
                        <button type="button" className="btn-submit btn-sm" onClick={() => openPendingEdit(p)}>
                          Tamamla ve yayınla
                        </button>
                        {warnings.length === 0 && (
                          <button type="button" className="btn-cancel btn-sm" onClick={() => approve(p)}>
                            Hızlı onay
                          </button>
                        )}
                        <button type="button" className="btn-cancel btn-sm danger-text" onClick={() => reject(p)}>
                          Reddet
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {tab === 'forum' && (
            <>
              <p className="admin-hub-hint">
                Tartışma gönderileri. Yeni konu açmak için sitede ilgili arıza sayfasını kullanın.
              </p>
              <div className="admin-hub-toolbar">
                <input
                  type="search"
                  className="admin-hub-search"
                  placeholder="Metin, kullanıcı veya araç ara…"
                  value={forumSearch}
                  onChange={e => setForumSearch(e.target.value)}
                />
                <select className="admin-hub-select" value={forumFilter} onChange={e => setForumFilter(e.target.value)}>
                  <option value="all">Tümü ({allPosts.length})</option>
                  <option value="topics">Konular ({allPosts.filter(p => !p.isReply).length})</option>
                  <option value="replies">Yanıtlar ({allPosts.filter(p => p.isReply).length})</option>
                </select>
              </div>
              {filteredPosts.length === 0 ? (
                <p className="admin-hub-empty">
                  {allPosts.length === 0 ? 'Henüz tartışma gönderisi yok.' : 'Arama sonucu bulunamadı.'}
                </p>
              ) : (
                <div className="admin-hub-list">
                  {filteredPosts.map(p => (
                    <div key={`${p.faultId}-${p.id}-${p.parentId || 't'}`} className="admin-hub-card">
                      <div className="admin-hub-card-top">
                        <span>
                          {p.isReply ? '↳ Yanıt' : 'Konu'}
                          {!p.isReply && p.type && (
                            <span className="admin-hub-type-tag">{POST_TYPE_LABELS[p.type] || p.type}</span>
                          )}
                        </span>
                        <span className="admin-hub-meta">{p.username} · {getCommentDateLabel(p)}</span>
                      </div>
                      <p className="admin-hub-fault-ref" title={p.faultTitle || p.faultLabel}>{p.faultLabel}</p>
                      {p.text ? <p>{p.text}</p> : null}
                      {(p.images?.length > 0) && (
                        <p className="admin-hub-meta">📷 {p.images.length} fotoğraf</p>
                      )}
                      <div className="admin-hub-card-actions">
                        <button
                          type="button"
                          className="btn-cancel btn-sm"
                          onClick={() => setEditPost({
                            faultId: p.faultId,
                            id: p.id,
                            parentId: p.parentId,
                            text: p.text,
                            type: p.type,
                            isReply: p.isReply,
                          })}
                        >
                          Düzenle
                        </button>
                        <button type="button" className="btn-cancel btn-sm danger-text" onClick={() => deletePost(p.faultId, p.id, p.parentId)}>
                          Sil
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'models' && (
            <>
              <button type="button" className="btn-submit btn-sm admin-hub-add" onClick={onNewModel}>+ Yeni model makalesi</button>
              <div className="admin-hub-list">
                {Object.entries(models).map(([key, m]) => (
                  <div key={key} className="admin-hub-card">
                    <strong>{m.heroTitle || key}</strong>
                    <p className="admin-hub-meta">{key} · {faults.filter(f => f.model === key).length} arıza kaydı</p>
                    <button type="button" className="btn-cancel btn-sm" onClick={() => onEditModel(key, m)}>Makaleyi düzenle</button>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'bulkimport' && (
            <BulkImportTab
              onApproveFaults={onApproveFaults}
              onNotify={onNotify}
            />
          )}

          {tab === 'bulkmodels' && (
            <BulkModelImportTab
              onApproveModels={onApproveModels}
              onNotify={onNotify}
            />
          )}

          {tab === 'categories' && (
            <>
              <p className="admin-hub-hint">Arıza formlarında ve filtrelerde kullanılan listeler.</p>
              <p className="admin-section-label">Arıza kategorileri</p>
              <div className="tag-list">
                {categories.map((c, i) => (
                  <span key={c} className="tag-chip">
                    {c}
                    <button type="button" onClick={() => {
                      if (!confirm(`"${c}" silinsin mi?`)) return;
                      const next = categories.filter((_, idx) => idx !== i);
                      setCategories(next); saveCategories(next);
                    }}>×</button>
                  </span>
                ))}
              </div>
              <div className="list-edit-row">
                <input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Yeni kategori" />
                <button type="button" className="btn-submit btn-sm" onClick={() => {
                  const v = newCat.trim();
                  if (!v || categories.includes(v)) return;
                  const next = [...categories, v];
                  setCategories(next); saveCategories(next); setNewCat('');
                  onNotify('Kategori eklendi.');
                }}>Ekle</button>
              </div>
              <p className="admin-section-label">Motor tipleri</p>
              <div className="tag-list">
                {motorTypes.map((m, i) => (
                  <span key={m} className="tag-chip">
                    {m}
                    <button type="button" onClick={() => {
                      if (!confirm(`"${m}" silinsin mi?`)) return;
                      const next = motorTypes.filter((_, idx) => idx !== i);
                      setMotorTypes(next); saveMotorTypes(next);
                    }}>×</button>
                  </span>
                ))}
              </div>
              <div className="list-edit-row">
                <input value={newMotor} onChange={e => setNewMotor(e.target.value)} placeholder="Yeni motor tipi" />
                <button type="button" className="btn-submit btn-sm" onClick={() => {
                  const v = newMotor.trim();
                  if (!v || motorTypes.includes(v)) return;
                  const next = [...motorTypes, v];
                  setMotorTypes(next); saveMotorTypes(next); setNewMotor('');
                  onNotify('Motor tipi eklendi.');
                }}>Ekle</button>
              </div>
            </>
          )}
        </div>
      </aside>

      {editPost && (
        <div className="modal-overlay" style={{ zIndex: 10001 }} onClick={e => e.target === e.currentTarget && setEditPost(null)}>
          <div className="modal" role="dialog">
            <div className="modal-header">
              <h2>{editPost.isReply ? 'Yanıtı düzenle' : 'Konuyu düzenle'}</h2>
              <button className="modal-close" onClick={() => setEditPost(null)}>×</button>
            </div>
            <div className="modal-body">
              {!editPost.isReply && (
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label>Gönderi türü</label>
                  <select
                    value={editPost.type || 'yorum'}
                    onChange={e => setEditPost(p => ({ ...p, type: e.target.value }))}
                    style={{ width: '100%' }}
                  >
                    {Object.entries(POST_TYPE_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>{label}</option>
                    ))}
                  </select>
                </div>
              )}
              <textarea
                rows={5}
                value={editPost.text}
                onChange={e => setEditPost(p => ({ ...p, text: e.target.value }))}
                style={{ width: '100%', resize: 'vertical' }}
                placeholder="Gönderi metni"
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={() => setEditPost(null)}>İptal</button>
              <button type="button" className="btn-submit" onClick={savePostEdit}>Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
