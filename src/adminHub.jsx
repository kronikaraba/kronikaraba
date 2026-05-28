import { useState, useMemo, useEffect } from 'react';
import { loadPending, savePending, loadForum, saveForum } from './adminStorage.js';
import { loadCategories, saveCategories, loadMotorTypes, saveMotorTypes } from './siteContent.js';
import { normalizeFault, getPendingId, getFaultCompletenessWarnings } from './faultUtils.js';
import { formatDateTimeMinute, getCommentDateLabel } from './dateUtils.js';

const TABS = [
  { key: 'pending', label: 'Öneriler' },
  { key: 'forum', label: 'Tartışma' },
  { key: 'models', label: 'Modeller' },
  { key: 'categories', label: 'Etiketler' },
];

const POST_TYPE_LABELS = {
  usta: 'Usta önerisi',
  oneri: 'Öneri',
  soru: 'Soru',
  yorum: 'Yorum',
};

export default function AdminHub({
  open, tab, onTab, onClose,
  faults, models, onApproveFaults, onEditFault, onEditModel, onNewModel, onNotify,
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
                          {p.isDemo && <span className="admin-hub-type-tag">Demo yorum</span>}
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
