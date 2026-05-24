import { useState, useMemo, useEffect } from 'react';
import { loadPending, savePending, loadForum, saveForum } from './adminStorage.js';
import { loadCategories, saveCategories, loadMotorTypes, saveMotorTypes } from './siteContent.js';

const TABS = [
  { key: 'pending', label: '⏳ Onaylar' },
  { key: 'forum', label: '💬 Konular' },
  { key: 'models', label: '📄 Modeller' },
  { key: 'categories', label: '🏷️ Kategoriler' },
];

export default function AdminHub({
  open, tab, onTab, onClose,
  faults, models, onApproveFaults, onEditFault, onEditModel, onNewModel, onNotify,
}) {
  const [pending, setPending] = useState(() => loadPending());
  const [forum, setForum] = useState(() => loadForum());
  const [categories, setCategories] = useState(() => loadCategories());
  const [motorTypes, setMotorTypes] = useState(() => loadMotorTypes());
  const [newCat, setNewCat] = useState('');
  const [newMotor, setNewMotor] = useState('');
  const [editPost, setEditPost] = useState(null);

  useEffect(() => {
    if (!open) return;
    setPending(loadPending());
    setForum(loadForum());
  }, [open]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'ka_pending_faults') setPending(loadPending());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const allPosts = useMemo(() => {
    const list = [];
    Object.entries(forum).forEach(([faultId, posts]) => {
      const fault = faults.find(f => String(f.id) === String(faultId));
      posts.forEach(p => {
        list.push({ ...p, faultId, faultLabel: fault ? `${fault.brand} ${fault.model}` : `#${faultId}`, isReply: false });
        (p.replies || []).forEach(r => {
          list.push({ ...r, faultId, parentId: p.id, faultLabel: fault ? `${fault.brand} ${fault.model}` : `#${faultId}`, isReply: true });
        });
      });
    });
    return list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [forum, faults]);

  const approve = (item) => {
    const approved = { ...item };
    delete approved._pendingId;
    delete approved._submittedBy;
    delete approved._submittedAt;
    onApproveFaults(approved);
    setPending(prev => {
      const next = prev.filter(p => p._pendingId !== item._pendingId);
      savePending(next);
      return next;
    });
    onNotify('Öneri onaylandı ve yayınlandı.');
  };

  const reject = (id) => {
    if (!confirm('Bu öneriyi reddetmek istiyor musunuz?')) return;
    setPending(prev => {
      const next = prev.filter(p => p._pendingId !== id);
      savePending(next);
      return next;
    });
    onNotify('Öneri reddedildi.');
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
    const { faultId, id, parentId, text } = editPost;
    setForum(prev => {
      const next = { ...prev };
      if (parentId) {
        next[faultId] = (next[faultId] || []).map(p =>
          p.id === parentId
            ? { ...p, replies: (p.replies || []).map(r => r.id === id ? { ...r, text: text.trim() } : r) }
            : p
        );
      } else {
        next[faultId] = (next[faultId] || []).map(p => p.id === id ? { ...p, text: text.trim() } : p);
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
          <h2>İçerik yönetimi</h2>
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
                {pending.map(p => (
                  <div key={p._pendingId} className="admin-hub-card">
                    <div className="admin-hub-card-top">
                      <strong>{p.brand} {p.model}</strong>
                      <span className={`risk-badge ${p.risk}`}>{p.risk}</span>
                    </div>
                    <p>{p.fault || p.description}</p>
                    <p className="admin-hub-meta">{p._submittedBy || 'Anonim'} · {p._submittedAt || ''}</p>
                    <div className="admin-hub-card-actions">
                      <button type="button" className="btn-submit btn-sm" onClick={() => approve(p)}>✓ Onayla</button>
                      <button type="button" className="btn-cancel btn-sm" onClick={() => reject(p._pendingId)}>Reddet</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === 'forum' && (
            <>
              <p className="admin-hub-hint">Tüm arıza tartışma konuları. Sitede her arıza kartında da konu açabilirsiniz.</p>
              {allPosts.length === 0 ? (
                <p className="admin-hub-empty">Henüz konu yok.</p>
              ) : (
                <div className="admin-hub-list">
                  {allPosts.map(p => (
                    <div key={`${p.faultId}-${p.id}`} className="admin-hub-card">
                      <div className="admin-hub-card-top">
                        <span>{p.isReply ? '↳ Yanıt' : '💬 Konu'} · {p.faultLabel}</span>
                        <span className="admin-hub-meta">{p.username} · {p.date}</span>
                      </div>
                      <p>{p.text}</p>
                      <div className="admin-hub-card-actions">
                        <button type="button" className="btn-cancel btn-sm" onClick={() => setEditPost({ faultId: p.faultId, id: p.id, parentId: p.parentId, text: p.text })}>Düzenle</button>
                        <button type="button" className="btn-cancel btn-sm" onClick={() => deletePost(p.faultId, p.id, p.parentId)}>Sil</button>
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
                    <p className="admin-hub-meta">{key} · {faults.filter(f => f.model === key).length} arıza</p>
                    <button type="button" className="btn-cancel btn-sm" onClick={() => onEditModel(key, m)}>Makaleyi düzenle</button>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'categories' && (
            <>
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
              <h2>Konuyu düzenle</h2>
              <button className="modal-close" onClick={() => setEditPost(null)}>×</button>
            </div>
            <div className="modal-body">
              <textarea rows={5} value={editPost.text} onChange={e => setEditPost(p => ({ ...p, text: e.target.value }))} style={{ width: '100%' }} />
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
