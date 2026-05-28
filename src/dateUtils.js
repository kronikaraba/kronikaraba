import { useState, useEffect } from 'react';

/**
 * Returns a Date that updates every ~60 seconds.
 * Use this in any component that shows relative timestamps so they stay fresh.
 */
export function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    // Align first tick to the next whole minute so all instances stay in sync
    const msToNextMinute = 60000 - (Date.now() % 60000);
    let timer = setTimeout(() => {
      setNow(new Date());
      timer = setInterval(() => setNow(new Date()), 60000);
    }, msToNextMinute);
    return () => clearTimeout(timer);
  }, []);
  return now;
}

const MINUTE_FORMATTER = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function seededDateFromId(id) {
  const n = Number(String(id || '').replace(/\D/g, '')) || 1;
  const day = ((n - 1) % 28) + 1;
  const hour = 9 + (n % 10);
  const minute = (n * 7) % 60;
  return new Date(2026, 4, day, hour, minute);
}

function parseDateValue(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === 'number') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }

  const raw = String(value || '').trim();
  if (raw) {
    const trMatch = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
    if (trMatch) {
      const [, d, m, y, h = '09', min = '00'] = trMatch;
      const date = new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min));
      if (!Number.isNaN(date.getTime())) return date;
    }

    const date = new Date(raw);
    if (!Number.isNaN(date.getTime())) return date;
  }

  return null;
}

export function getDateTimeMs(value, fallbackId) {
  const date = parseDateValue(value) || (fallbackId != null ? seededDateFromId(fallbackId) : null);
  return date ? date.getTime() : 0;
}

export function formatDateTimeMinute(value, fallbackId) {
  const date = parseDateValue(value) || seededDateFromId(fallbackId);
  return MINUTE_FORMATTER.format(date);
}

export function formatRelativeTime(value, fallbackId, now = new Date()) {  // now is injectable for live updates
  const ts = getDateTimeMs(value, fallbackId);
  if (!ts) return 'az önce';

  const diffMs = Math.max(0, now.getTime() - ts);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;
  const year = 365 * day;

  if (diffMs < minute) return 'az önce';
  if (diffMs < hour) return `${Math.floor(diffMs / minute)} dakika önce`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)} saat önce`;
  if (diffMs < 2 * day) return 'dün';
  if (diffMs < month) return `${Math.floor(diffMs / day)} gün önce`;
  if (diffMs < year) return `${Math.floor(diffMs / month)} ay önce`;
  return `${Math.floor(diffMs / year)} yıl önce`;
}

export function getFaultDateLabel(fault) {
  return formatDateTimeMinute(
    fault?.updatedAt || fault?.createdAt || fault?.publishedAt || fault?.suggestedAt,
    fault?.id
  );
}

export function getCommentDateLabel(item) {
  return formatDateTimeMinute(item?.updatedAt || item?.createdAt || item?.date, item?.id);
}

export function getCommentDateDisplay(item, now = new Date()) {
  const createdSource = item?.createdAt || item?.date;
  const updatedSource = item?.updatedAt;
  const createdTs = getDateTimeMs(createdSource, item?.id);
  const updatedTs = updatedSource ? getDateTimeMs(updatedSource, item?.id) : 0;
  const isUpdated = updatedTs && createdTs && updatedTs - createdTs > 60000;
  const source = isUpdated ? updatedSource : createdSource;
  const relative = formatRelativeTime(source, item?.id, now);
  const exact = formatDateTimeMinute(source, item?.id);
  return `${relative}${isUpdated ? ' güncellendi' : ''} · ${exact}`;
}

export function getFaultActivityInfo(fault, posts = [], now = new Date()) {
  const activities = [];

  const addActivity = (source, fallbackId, label) => {
    const timestamp = getDateTimeMs(source, fallbackId);
    if (timestamp) activities.push({ timestamp, source, fallbackId, label });
  };

  const faultCreatedSource = fault?.createdAt || fault?.publishedAt || fault?.suggestedAt;
  const faultUpdatedSource = fault?.updatedAt;
  const faultCreatedTs = getDateTimeMs(faultCreatedSource, fault?.id);
  const faultUpdatedTs = faultUpdatedSource ? getDateTimeMs(faultUpdatedSource, fault?.id) : 0;

  if (faultUpdatedTs && (!faultCreatedTs || faultUpdatedTs - faultCreatedTs > 60000)) {
    addActivity(faultUpdatedSource, fault?.id, 'güncellendi');
  } else {
    addActivity(faultCreatedSource, fault?.id, 'kayıt açıldı');
  }

  posts.forEach(post => {
    const postCreatedSource = post?.createdAt || post?.date;
    const postUpdatedSource = post?.updatedAt;
    const postCreatedTs = getDateTimeMs(postCreatedSource, post?.id);
    const postUpdatedTs = postUpdatedSource ? getDateTimeMs(postUpdatedSource, post?.id) : 0;

    if (postUpdatedTs && postCreatedTs && postUpdatedTs - postCreatedTs > 60000) {
      addActivity(postUpdatedSource, post?.id, 'yorum güncellendi');
    } else {
      addActivity(postCreatedSource, post?.id, 'yorum geldi');
    }

    (post?.replies || []).forEach(reply => {
      const replyCreatedSource = reply?.createdAt || reply?.date;
      const replyUpdatedSource = reply?.updatedAt;
      const replyCreatedTs = getDateTimeMs(replyCreatedSource, reply?.id);
      const replyUpdatedTs = replyUpdatedSource ? getDateTimeMs(replyUpdatedSource, reply?.id) : 0;

      if (replyUpdatedTs && replyCreatedTs && replyUpdatedTs - replyCreatedTs > 60000) {
        addActivity(replyUpdatedSource, reply?.id, 'yanıt güncellendi');
      } else {
        addActivity(replyCreatedSource, reply?.id, 'yanıt geldi');
      }
    });
  });

  const latest = activities.sort((a, b) => b.timestamp - a.timestamp)[0];
  const exact = formatDateTimeMinute(latest?.timestamp || faultCreatedSource, latest?.fallbackId || fault?.id);
  const relative = formatRelativeTime(latest?.timestamp || faultCreatedSource, latest?.fallbackId || fault?.id, now);
  const label = latest?.label || 'güncellendi';

  return {
    timestamp: latest?.timestamp || getDateTimeMs(faultCreatedSource, fault?.id),
    exact,
    relative,
    label,
    shortLabel: `${relative} ${label}`,
    fullLabel: `${relative} ${label} · ${exact}`,
  };
}
