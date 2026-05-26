import { useState, useEffect } from 'react';
import { loadForum, saveForum, getAdminUsername } from './adminStorage.js';
import { ForumPostImages, ForumImageAttach } from './ForumImages.jsx';

// ── Seed data — pre-filled forum posts per fault id ──────────────────────────
const SEED = {
  1: [
    {
      id: 's1-1', type: 'usta', username: 'MekanikMehmet', isUsta: true,
      text: 'Bu sorun VW 1.4 TSI motorlarda çok yaygın. Zincir gergi mekanizması yaklaşık 60-80 bin kmde ses vermeye başlar. Soğuk çalıştırmada "tak tak" sesi duyuluyorsa derhal kontrol ettirin. Erken müdahale zincir takımı değişimiyle çözülür (₺12.000–18.000), geç kalınırsa motor hasarı oluşabilir.',
      date: '12.03.2025', helpful: 47, voters: [], replies: [
        { id: 's1-1r1', username: 'AliVW', text: 'Mehmet usta haklı, bende 72.000 kmde başladı bu ses. Tam zamanında getirdim, zincir kırılmadı şükür.', date: '13.03.2025', helpful: 12, voters: [] },
        { id: 's1-1r2', username: 'VWsever', text: 'Hangi serviste yaptırdınız, bölge önerir misiniz?', date: '15.03.2025', helpful: 2, voters: [] },
      ]
    },
    {
      id: 's1-2', type: 'oneri', username: 'DIYTamirci', isUsta: false,
      text: 'Kısa vadeli çözüm: 5W-30 yerine 5W-40 tam sentetik motor yağı kullanın, zincir sesini biraz azaltır. Kalıcı çözüm değil, mutlaka usta kontrolü gerekli!',
      date: '18.03.2025', helpful: 23, voters: [], replies: []
    },
    {
      id: 's1-3', type: 'yorum', username: 'GolfSahibi_2019', isUsta: false,
      text: 'Ben 2017 Golf 1.4 TSI sahibiyim. Bu arıza nedeniyle satmayı düşünüyorum. 80 bin kmde çıktı, servis 22.000 TL fiyat verdi.',
      date: '02.04.2025', helpful: 8, voters: [], replies: [
        { id: 's1-3r1', username: 'MekanikMehmet', isUsta: true, text: 'Satmadan önce yetkili servis dışında oto elektrik ustasına da götürün, fiyat büyük ihtimalle daha uygun olacaktır.', date: '03.04.2025', helpful: 15, voters: [] },
      ]
    },
  ],
  10: [
    {
      id: 's10-1', type: 'usta', username: 'ŞanzımanUstası_Kemal', isUsta: true,
      text: 'DSG şanzıman sarsıntısı genellikle mecatronik ünitesinden kaynaklanır. İlk yapılacak şey DSG yağ + filtre değişimidir (her 40.000 kmde yapılmalı). Sorun devam ederse valf bloğu veya mecatronik değişimi gerekebilir. DSG konusunda uzman servislere gidin, fiyatlar %40 daha uygun olabilir.',
      date: '05.02.2025', helpful: 63, voters: [], replies: [
        { id: 's10-1r1', username: 'PassatB8Fan', text: 'DSG yağını değiştirdik, 1 ay sonra tekrar aynı sarsıntı. Mecatronik mi değiştirmeliyiz?', date: '07.02.2025', helpful: 4, voters: [] },
        { id: 's10-1r2', username: 'ŞanzımanUstası_Kemal', isUsta: true, text: 'Tek seferlik yağ değişimi yetmeyebilir. Mecatronik kontrolü için önce diagnostik cihazla hata kodu okutun.', date: '08.02.2025', helpful: 19, voters: [] },
      ]
    },
    {
      id: 's10-2', type: 'soru', username: 'YeniPassat_Sahibi', isUsta: false,
      text: '2021 model Passat B8 aldım, henüz 35.000 km. Düşük hızda hafif sarsıntı hissediyorum. Bu normal mi yoksa arıza başlangıcı mı?',
      date: '14.04.2025', helpful: 5, voters: [], replies: [
        { id: 's10-2r1', username: 'ŞanzımanUstası_Kemal', isUsta: true, text: 'DSG şanzımanlarda soğukta ilk kalkışta hafif titreme normaldir. Ama ısındıktan sonra da devam ediyorsa servise gidin, garanti kapsamında olabilir.', date: '15.04.2025', helpful: 22, voters: [] },
      ]
    },
    {
      id: 's10-3', type: 'oneri', username: 'OtomotivPro', isUsta: false,
      text: 'DSG adaptasyon sıfırlaması yapın. Yetkili serviste ücretsiz yapılabilir. Bazen bu işlem sarsıntıyı %80 azaltır.',
      date: '20.04.2025', helpful: 31, voters: [], replies: []
    },
  ],
  5: [
    {
      id: 's5-1', type: 'usta', username: 'BMWUzmanı_Taner', isUsta: true,
      text: 'BMW N20 motorda zincir gergi sorunu kritik bir güvenlik meselesidir. Zincir atlayınca motor tamamen durur ve ciddi hasar oluşur. 120.000 km altındaki tüm N20 motorlarda bu değişimi yaptırmanızı şiddetle öneririm. Maliyet ₺25.000–40.000 arasında ama motor yakmaktan çok daha ucuz.',
      date: '20.01.2025', helpful: 89, voters: [], replies: [
        { id: 's5-1r1', username: 'E90_Sahibi', text: 'Haklısınız usta, kardeşimde zincir atladı, motor gitti. 180.000 TL motor revizyonu yaptırdı.', date: '22.01.2025', helpful: 34, voters: [] },
      ]
    },
    {
      id: 's5-2', type: 'oneri', username: 'DizelPro', isUsta: false,
      text: 'BMW 320i alacaksanız mutlaka servis geçmişini isteyin. Zincir değişimi yapılmış mı kontrol edin. Soğuk çalıştırma videosunu kaydedin ve satıcıyla paylaşın.',
      date: '11.03.2025', helpful: 31, voters: [], replies: []
    },
  ],
};

// ── Post type config ──────────────────────────────────────────────────────────
const POST_TYPES = [
  { value: 'yorum',  label: 'Yorum',        desc: 'Deneyim / genel yorum' },
  { value: 'oneri',  label: 'Öneri',         desc: 'Çözüm önerisi' },
  { value: 'soru',   label: 'Soru',          desc: 'Soru sor' },
  { value: 'usta',   label: 'Usta Önerisi',  desc: 'Uzman tavsiyesi' },
];

function typeConfig(type) {
  switch (type) {
    case 'usta':  return { icon: '', label: 'Usta Önerisi', cls: 'post-usta' };
    case 'oneri': return { icon: '', label: 'Öneri',        cls: 'post-oneri' };
    case 'soru':  return { icon: '', label: 'Soru',         cls: 'post-soru' };
    default:      return { icon: '', label: 'Yorum',        cls: 'post-yorum' };
  }
}

const fmt = (n) => Number(n).toLocaleString('tr-TR');

export function getCommentCount(faultId) {
  const stored = loadForum();
  const posts = stored[faultId] || SEED[faultId] || [];
  return posts.length + posts.reduce((s, p) => s + (p.replies || []).length, 0);
}

// Bulk: load forum once, return a map of faultId → total comment count
export function buildCommentCountMap(faultIds) {
  const stored = loadForum();
  const map = {};
  for (const id of faultIds) {
    const posts = stored[id] || SEED[id] || [];
    map[id] = posts.length + posts.reduce((s, p) => s + (p.replies || []).length, 0);
  }
  return map;
}

// ── Reply item ────────────────────────────────────────────────────────────────
function ReplyItem({ reply, user, onVote, adminMode, onAdminDeleteReply, onAdminEditReply }) {
  const voted = user && (reply.voters || []).includes(user.id);
  return (
    <div className="forum-reply">
      <div className="forum-avatar sm">{(reply.username || '?')[0].toUpperCase()}</div>
      <div className="forum-reply-body">
        <div className="forum-meta">
          <span className="forum-author">{reply.username}</span>
          {reply.isUsta && <span className="usta-tag">Usta</span>}
          <span className="forum-date">{reply.date}</span>
          {adminMode && (
            <span className="forum-reply-admin-actions">
              <button type="button" className="forum-reply-btn forum-admin-btn" onClick={() => onAdminEditReply(reply)} title="Yanıtı Düzenle">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button type="button" className="forum-reply-btn forum-admin-btn" onClick={() => onAdminDeleteReply(reply.id)} title="Yanıtı Sil">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
              </button>
            </span>
          )}
        </div>
        {reply.text ? <p className="forum-text">{reply.text}</p> : null}
        <ForumPostImages images={reply.images} />
        <button
          className={`forum-vote${voted ? ' voted' : ''}`}
          onClick={() => onVote(reply.id)}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 4, verticalAlign: 'middle' }}>
            <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/>
          </svg>
          {reply.helpful > 0 ? `${reply.helpful} Faydalı` : 'Faydalı'}
        </button>
      </div>
    </div>
  );
}

// ── Post item ─────────────────────────────────────────────────────────────────
function ForumPost({ post, user, onVote, onVoteReply, onReply, onAuthRequest, adminMode, onAdminDelete, onAdminEdit, onAdminDeleteReply, onAdminEditReply }) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyImages, setReplyImages] = useState([]);
  const [showReplies, setShowReplies] = useState(true);
  const cfg = typeConfig(post.type);
  const voted = user && (post.voters || []).includes(user.id);

  const submitReply = (e) => {
    e.preventDefault();
    if (!replyText.trim() && replyImages.length === 0) return;
    onReply(post.id, { text: replyText.trim(), images: replyImages });
    setReplyText('');
    setReplyImages([]);
    setShowReplyBox(false);
  };

  const handleReplyClick = () => {
    if (!user && !adminMode) { onAuthRequest(); return; }
    setShowReplyBox(s => !s);
  };

  return (
    <div className={`forum-post ${cfg.cls}`}>
      {/* Post type banner */}
      <div className="forum-post-type-bar">
        {cfg.icon && <span className="post-type-icon">{cfg.icon}</span>}
        <span className="post-type-label">{cfg.label}</span>
        {post.isUsta && <span className="usta-verified">✓ Doğrulanmış Usta</span>}
        {adminMode && <span className="forum-admin-badge">🛡 Yönetici Modu</span>}
      </div>

      <div className="forum-post-body">
        <div className="forum-avatar lg">{(post.username || '?')[0].toUpperCase()}</div>
        <div className="forum-post-content">
          <div className="forum-meta">
            <span className="forum-author">{post.username}</span>
            {post.isUsta && <span className="usta-tag">Usta</span>}
            <span className="forum-date">{post.date}</span>
          </div>
          {post.text ? <p className="forum-text">{post.text}</p> : null}
          <ForumPostImages images={post.images} />
          <div className="forum-actions">
            <button
              className={`forum-vote${voted ? ' voted' : ''}`}
              onClick={() => onVote(post.id)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 4, verticalAlign: 'middle' }}>
                <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/>
              </svg>
              {post.helpful > 0 ? `${post.helpful} kişi faydalı buldu` : 'Faydalı'}
            </button>
            <button className="forum-reply-btn" onClick={handleReplyClick}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 4, verticalAlign: 'middle' }}>
                <polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 00-4-4H4"/>
              </svg>
              Yanıtla
            </button>
            {(post.replies || []).length > 0 && (
              <button className="forum-reply-btn" onClick={() => setShowReplies(s => !s)}>
                {showReplies ? 'Yanıtları Gizle' : 'Yanıtları Göster'} ({(post.replies || []).length})
              </button>
            )}
            {adminMode && (
              <>
                <button type="button" className="forum-reply-btn forum-admin-btn" onClick={() => onAdminEdit(post)} title="Konuyu Düzenle">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Düzenle
                </button>
                <button type="button" className="forum-reply-btn forum-admin-btn danger" onClick={() => onAdminDelete(post.id)} title="Konuyu Sil">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                  </svg>
                  Sil
                </button>
              </>
            )}
          </div>

          {/* Replies */}
          {showReplies && (post.replies || []).length > 0 && (
            <div className="forum-replies">
              {(post.replies || []).map(r => (
                <ReplyItem
                  key={r.id} reply={r} user={user}
                  adminMode={adminMode}
                  onVote={(rid) => onVoteReply(post.id, rid)}
                  onAdminDeleteReply={(rid) => onAdminDeleteReply(post.id, rid)}
                  onAdminEditReply={(reply) => onAdminEditReply(post.id, reply)}
                />
              ))}
            </div>
          )}

          {/* Reply box */}
          {showReplyBox && (
            <form className="forum-reply-form" onSubmit={submitReply}>
              <textarea
                placeholder={`${post.username} kullanıcısına yanıtlıyorsunuz…`}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                maxLength={400}
                autoFocus
              />
              <ForumImageAttach images={replyImages} onChange={setReplyImages} />
              <div className="forum-reply-form-actions">
                <button type="button" className="forum-cancel-btn" onClick={() => { setShowReplyBox(false); setReplyImages([]); }}>İptal</button>
                <button
                  type="submit"
                  className="forum-submit-btn"
                  disabled={!replyText.trim() && replyImages.length === 0}
                >
                  Yanıtla
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main CommentSection ───────────────────────────────────────────────────────
export function CommentSection({ faultId, user, onAuthRequest, adminMode: adminModeProp, alwaysOpen: alwaysOpenProp }) {
  // Admin yetkisi: hem live-edit modunda hem de user.isAdmin olan hesapta çalışır
  const adminMode = adminModeProp || user?.isAdmin === true;

  const [forum, setForum] = useState(() => {
    const stored = loadForum();
    // Merge seed data (only if not already stored)
    const merged = { ...stored };
    if (SEED[faultId] && !stored[faultId]) {
      merged[faultId] = SEED[faultId];
    }
    return merged;
  });

  const [open, setOpen] = useState(alwaysOpenProp || adminMode || false);
  const [newText, setNewText] = useState('');
  const [newImages, setNewImages] = useState([]);
  const [newType, setNewType] = useState(() => (adminModeProp ? 'usta' : 'yorum'));
  const [isUsta, setIsUsta] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [editPost, setEditPost] = useState(null);   // { postId, replyId?, text, isReply }

  const posts = forum[faultId] || [];

  useEffect(() => {
    saveForum(forum);
  }, [forum]);

  // Ensure seed is loaded for this fault
  useEffect(() => {
    if (SEED[faultId] && !(forum[faultId])) {
      setForum(prev => ({ ...prev, [faultId]: SEED[faultId] }));
    }
  }, [faultId]);

  const deletePost = (postId) => {
    if (!confirm('Bu konuyu silmek istiyor musunuz?')) return;
    setForum(prev => ({
      ...prev,
      [faultId]: (prev[faultId] || []).filter(p => p.id !== postId),
    }));
  };

  // Admin: yanıt sil
  const deleteReply = (postId, replyId) => {
    if (!confirm('Bu yanıtı silmek istiyor musunuz?')) return;
    setForum(prev => ({
      ...prev,
      [faultId]: (prev[faultId] || []).map(p =>
        p.id === postId
          ? { ...p, replies: (p.replies || []).filter(r => r.id !== replyId) }
          : p
      ),
    }));
  };

  // Admin: yanıt düzenle
  const editReplyStart = (postId, reply) => {
    setEditPost({ postId, replyId: reply.id, text: reply.text, isReply: true });
  };

  const savePostEdit = () => {
    if (!editPost?.text?.trim()) return;
    if (editPost.isReply) {
      // Yanıt düzenleme
      setForum(prev => ({
        ...prev,
        [faultId]: (prev[faultId] || []).map(p =>
          p.id === editPost.postId
            ? { ...p, replies: (p.replies || []).map(r =>
                r.id === editPost.replyId ? { ...r, text: editPost.text.trim() } : r
              )}
            : p
        ),
      }));
    } else {
      // Konu düzenleme
      setForum(prev => ({
        ...prev,
        [faultId]: (prev[faultId] || []).map(p =>
          p.id === editPost.id ? { ...p, text: editPost.text.trim() } : p
        ),
      }));
    }
    setEditPost(null);
  };

  // Admin: konu düzenleme başlat
  const editPostStart = (post) => {
    setEditPost({ id: post.id, text: post.text, isReply: false });
  };

  const submitPost = (e) => {
    e.preventDefault();
    if (!newText.trim() && newImages.length === 0) return;
    const author = adminMode ? getAdminUsername() : user?.username;
    if (!author) { onAuthRequest(); return; }
    const post = {
      id: `u-${Date.now()}`,
      type: newType,
      username: author,
      isUsta: adminMode ? (newType === 'usta') : (newType === 'usta' ? true : isUsta),
      text: newText.trim(),
      images: newImages.length ? newImages : undefined,
      date: new Date().toLocaleDateString('tr-TR'),
      helpful: 0,
      voters: [],
      replies: [],
    };
    setForum(prev => ({
      ...prev,
      [faultId]: [post, ...(prev[faultId] || [])],
    }));
    setNewText('');
    setNewImages([]);
    setIsUsta(false);
  };

  const votePost = (postId) => {
    if (!user) { onAuthRequest(); return; }
    setForum(prev => {
      const list = (prev[faultId] || []).map(p => {
        if (p.id !== postId) return p;
        const voted = (p.voters || []).includes(user.id);
        return { ...p, helpful: voted ? p.helpful - 1 : p.helpful + 1, voters: voted ? p.voters.filter(v => v !== user.id) : [...(p.voters || []), user.id] };
      });
      return { ...prev, [faultId]: list };
    });
  };

  const voteReply = (postId, replyId) => {
    if (!user) { onAuthRequest(); return; }
    setForum(prev => {
      const list = (prev[faultId] || []).map(p => {
        if (p.id !== postId) return p;
        const replies = (p.replies || []).map(r => {
          if (r.id !== replyId) return r;
          const voted = (r.voters || []).includes(user.id);
          return { ...r, helpful: voted ? r.helpful - 1 : r.helpful + 1, voters: voted ? r.voters.filter(v => v !== user.id) : [...(r.voters || []), user.id] };
        });
        return { ...p, replies };
      });
      return { ...prev, [faultId]: list };
    });
  };

  const addReply = (postId, payload) => {
    const author = adminMode ? getAdminUsername() : user?.username;
    if (!author) return;
    const text = typeof payload === 'string' ? payload : (payload.text || '');
    const images = typeof payload === 'string' ? undefined : (payload.images?.length ? payload.images : undefined);
    const reply = {
      id: `r-${Date.now()}`,
      username: author,
      isUsta: false,
      text,
      images,
      date: new Date().toLocaleDateString('tr-TR'),
      helpful: 0,
      voters: [],
    };
    setForum(prev => {
      const list = (prev[faultId] || []).map(p =>
        p.id === postId ? { ...p, replies: [...(p.replies || []), reply] } : p
      );
      return { ...prev, [faultId]: list };
    });
  };

  const filteredPosts = activeTab === 'all' ? posts : posts.filter(p => p.type === activeTab);

  // Sort: usta posts first, then by helpful count
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (a.type === 'usta' && b.type !== 'usta') return -1;
    if (b.type === 'usta' && a.type !== 'usta') return 1;
    return b.helpful - a.helpful;
  });

  const totalCount = posts.length + posts.reduce((s, p) => s + (p.replies || []).length, 0);
  const ustaCount = posts.filter(p => p.type === 'usta').length;

  const isOpen = alwaysOpenProp || open;

  return (
    <>
      {/* Toggle button — hidden when alwaysOpen */}
      {!alwaysOpenProp && (
        <button className="card-comments-toggle" onClick={() => setOpen(o => !o)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {totalCount > 0 ? (
            <>
              <span className="comment-badge">{totalCount}</span>
              tartışma
              {ustaCount > 0 && <span className="usta-count-badge">{ustaCount} usta önerisi</span>}
              · {open ? 'gizle' : 'göster'}
            </>
          ) : (
            'Tartışma yok · İlk yorumu yaz'
          )}
          <span style={{ marginLeft: 'auto', fontSize: 11 }}>{open ? '▲' : '▼'}</span>
        </button>
      )}

      {isOpen && (
        <div className="forum-section">
          {/* Tab filter */}
          {posts.length > 0 && (
            <div className="forum-tabs">
              {[
                { key: 'all', label: 'Tümü', count: posts.length },
                { key: 'usta', label: 'Usta', count: posts.filter(p => p.type === 'usta').length },
                { key: 'oneri', label: 'Öneri', count: posts.filter(p => p.type === 'oneri').length },
                { key: 'soru', label: 'Soru', count: posts.filter(p => p.type === 'soru').length },
                { key: 'yorum', label: 'Yorum', count: posts.filter(p => p.type === 'yorum').length },
              ].filter(t => t.key === 'all' || t.count > 0).map(t => (
                <button
                  key={t.key}
                  className={`forum-tab${activeTab === t.key ? ' active' : ''}`}
                  onClick={() => setActiveTab(t.key)}
                >
                  {t.label}
                  {t.count > 0 && <span className="forum-tab-count">{t.count}</span>}
                </button>
              ))}
            </div>
          )}

          {/* Post list */}
          {sortedPosts.length > 0 ? (
            <div className="forum-posts">
              {sortedPosts.map(p => (
                <ForumPost
                  key={p.id}
                  post={p}
                  user={user}
                  adminMode={adminMode}
                  onVote={votePost}
                  onVoteReply={voteReply}
                  onReply={addReply}
                  onAuthRequest={onAuthRequest}
                  onAdminDelete={deletePost}
                  onAdminEdit={editPostStart}
                  onAdminDeleteReply={deleteReply}
                  onAdminEditReply={editReplyStart}
                />
              ))}
            </div>
          ) : (
            <div className="forum-empty">Bu kategoride henüz gönderi yok.</div>
          )}

          {adminMode && (
            <p className="forum-admin-hint">Yönetici olarak yazdığınız gönderiler anında yayınlanır.</p>
          )}

          {(user || adminMode) ? (
            <form className="forum-new-post" onSubmit={submitPost}>
              <div className="forum-new-header">
                <div className="forum-avatar sm">
                  {adminMode
                    ? (getAdminUsername() || 'A')[0].toUpperCase()
                    : (user?.username || '?')[0].toUpperCase()}
                </div>
                <span className="forum-new-label">
                  {adminMode ? (
                    <><span className="forum-admin-name">🛡 {getAdminUsername()}</span> — tartışmaya yaz</>
                  ) : 'Katkıda bulun'}
                </span>
              </div>
              {!adminMode && (
                <>
                  <div className="forum-type-row">
                    {POST_TYPES.map(t => (
                      <button
                        key={t.value}
                        type="button"
                        className={`forum-type-btn${newType === t.value ? ' active' : ''}`}
                        onClick={() => setNewType(t.value)}
                        title={t.desc}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  {newType === 'usta' && (
                    <label className="forum-usta-check">
                      <input type="checkbox" checked={isUsta} onChange={e => setIsUsta(e.target.checked)} />
                      Usta/teknisyen olduğumu onaylıyorum
                    </label>
                  )}
                </>
              )}
              <textarea
                className="forum-textarea"
                placeholder={
                  adminMode ? 'Usta görüşü veya bilgilendirme metni…'
                  : newType === 'usta' ? 'Mesleki deneyiminizi ve önerinizi yazın…'
                  : newType === 'oneri' ? 'Çözüm önerinizi açıklayın…'
                  : newType === 'soru' ? 'Sorunuzu detaylı açıklayın…'
                  : 'Deneyiminizi paylaşın… (metin isteğe bağlı, fotoğraf ekleyebilirsiniz)'
                }
                value={newText}
                onChange={e => setNewText(e.target.value)}
                maxLength={600}
                rows={3}
              />
              <ForumImageAttach images={newImages} onChange={setNewImages} />
              <div className="forum-new-footer">
                <span className="forum-char-count">{newText.length}/600</span>
                <button
                  type="submit"
                  className="forum-submit-btn"
                  disabled={!newText.trim() && newImages.length === 0}
                >
                  {adminMode ? 'Yayınla' : 'Gönder'}
                </button>
              </div>
            </form>
          ) : (
            <div className="comment-login-prompt">
              Tartışmaya katılmak için{' '}
              <button onClick={onAuthRequest}>giriş yapın veya üye olun</button>
            </div>
          )}
        </div>
      )}

      {editPost && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditPost(null)}>
          <div className="modal" role="dialog">
            <div className="modal-header">
              <h2>{editPost.isReply ? 'Yanıtı Düzenle' : 'Konuyu Düzenle'}</h2>
              <button className="modal-close" onClick={() => setEditPost(null)}>×</button>
            </div>
            <div className="modal-body">
              <textarea
                className="forum-textarea"
                rows={5}
                value={editPost.text}
                onChange={e => setEditPost(p => ({ ...p, text: e.target.value }))}
                style={{ width: '100%', resize: 'vertical' }}
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
