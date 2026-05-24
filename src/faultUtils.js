/** Bekleyen öneri kaydı için benzersiz anahtar */
export function getPendingId(item) {
  return item._pendingId ?? `legacy-${item.id}`;
}

/** "2015-2020" veya yearMin/Max → tutarlı yıl alanları */
export function parseYearRange(yearStr, yearMin, yearMax) {
  const raw = String(yearStr || '').trim();
  if (raw) {
    const parts = raw.split(/[-–—]/).map(s => parseInt(s.trim(), 10)).filter(n => !Number.isNaN(n) && n > 1900);
    if (parts.length >= 2) {
      const ymin = Math.min(parts[0], parts[1]);
      const ymax = Math.max(parts[0], parts[1]);
      return { year: `${ymin}-${ymax}`, yearMin: ymin, yearMax: ymax };
    }
    if (parts.length === 1) {
      return { year: String(parts[0]), yearMin: parts[0], yearMax: parts[0] };
    }
  }
  const ymin = Number(yearMin) || 2020;
  const ymax = Number(yearMax) || Math.max(ymin, 2025);
  return { year: raw || `${ymin}-${ymax}`, yearMin: ymin, yearMax: ymax };
}

export function formatYearRange(yearMin, yearMax) {
  const a = Number(yearMin);
  const b = Number(yearMax);
  if (!a && !b) return '';
  if (a && b && a !== b) return `${a}-${b}`;
  return String(a || b || '');
}

/** Kayıt öncesi eksik alanları doldurur / meta alanları temizler */
export function normalizeFault(f) {
  const faultText = (f.fault || f.description || '').trim();
  const { year, yearMin, yearMax } = parseYearRange(f.year, f.yearMin, f.yearMax);
  const costMin = Number(f.costMin) || 0;
  const costMax = Number(f.costMax) || 0;

  const cleaned = { ...f };
  delete cleaned._pendingId;
  delete cleaned._submittedBy;
  delete cleaned._submittedAt;
  delete cleaned._pending;
  delete cleaned.suggestedBy;
  delete cleaned.suggestedAt;
  delete cleaned.description;

  return {
    ...cleaned,
    id: cleaned.id || Date.now(),
    brand: String(f.brand || '').trim(),
    model: String(f.model || '').trim(),
    fault: faultText,
    description: faultText,
    year,
    yearMin,
    yearMax,
    symptoms: String(f.symptoms || '').trim() || 'Belirtilmedi',
    checkTip: String(f.checkTip || '').trim() || 'Yetkili serviste kontrol ettirin.',
    costMin,
    costMax,
    avgCost: costMin > 0 && costMax > 0 ? Math.round((costMin + costMax) / 2) : 0,
    kmDisplay: String(f.kmDisplay || '').trim() || 'Belirtilmedi',
    kmMin: Number(f.kmMin) || 0,
    reportCount: Math.max(1, Number(f.reportCount) || 1),
    motorType: f.motorType || 'Benzin',
    category: f.category || 'Motor',
    risk: f.risk || 'ORTA',
  };
}

/** Onay öncesi eksik kritik alanlar */
export function getFaultCompletenessWarnings(f) {
  const w = [];
  if (!String(f.symptoms || '').trim()) w.push('Belirti');
  if (!String(f.checkTip || '').trim()) w.push('Kontrol ipucu');
  if (!(Number(f.costMin) > 0 || Number(f.costMax) > 0)) w.push('Masraf aralığı');
  if (!String(f.kmDisplay || '').trim() || f.kmDisplay === 'Bilinmiyor') w.push('KM bilgisi');
  return w;
}
