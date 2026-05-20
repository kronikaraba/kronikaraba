import { useState, useEffect } from 'react';

// ── Storage ──────────────────────────────────────────────────────────────────
const FORUM_KEY = 'ka_forum_v2';

function loadForum() {
  try { return JSON.parse(localStorage.getItem(FORUM_KEY)) || {}; } catch { return {}; }
}
function saveForum(data) {
  localStorage.setItem(FORUM_KEY, JSON.stringify(data));
}

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
  { value: 'yorum',  label: '💬 Yorum',        desc: 'Deneyim / genel yorum' },
  { value: 'oneri',  label: '💡 Öneri',         desc: 'Çözüm önerisi' },
  { value: 'soru',   label: '❓ Soru',          desc: 'Soru sor' },
  { value: 'usta',   label: '🔧 Usta Önerisi',  desc: 'Uzman tavsiyesi' },
];

function typeConfig(type) {
  switch (type) {
    case 'usta':  return { icon: '🔧', label: 'Usta Önerisi', cls: 'post-usta' };
    case 'oneri': return { icon: '💡', label: 'Öneri',        cls: 'post-oneri' };
    case 'soru':  return { icon: '❓', label: 'Soru',         cls: 'post-soru' };
    default:      return { icon: '💬', label: 'Yorum',        cls: 'post-yorum' };
  }
}

const fmt = (n) => Number(n).toLocaleString('tr-TR');

// ── Reply item ────────────────────────────────────────────────────────────────
function ReplyItem({ reply, user, onVote }) {
  const voted = user && (reply.voters || []).includes(user.id);
  return (
    <div className="forum-reply">
      <div className="forum-avatar sm">{(reply.username || '?')[0].toUpperCase()}</div>
      <div className="forum-reply-body">
        <div className="forum-meta">
          <span className="forum-author">{reply.username}</span>
          {reply.isUsta && <span className="usta-tag">Usta</span>}
          <span className="forum-date">{reply.date}</span>
        </div>
        <p className="forum-text">{reply.text}</p>
        <button
          className={`forum-vote${voted ? ' voted' : ''}`}
          onClick={() => onVote(reply.id)}
        >
          👍 {reply.helpful > 0 ? reply.helpful : 'Faydalı'}
        </button>
      </div>
    </div>
  );
}

// ── Post item ─────────────────────────────────────────────────────────────────
function ForumPost({ post, user, onVote, onVoteReply, onReply, onAuthRequest }) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplies, setShowReplies] = useState(true);
  const cfg = typeConfig(post.type);
  const voted = user && (post.voters || []).includes(user.id);

  const submitReply = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onReply(post.id, replyText.trim());
    setReplyText('');
    setShowReplyBox(false);
  };

  const handleReplyClick = () => {
    if (!user) { onAuthRequest(); return; }
    setShowReplyBox(s => !s);
  };

  return (
    <div className={`forum-post ${cfg.cls}`}>
      {/* Post type banner */}
      <div className="forum-post-type-bar">
        <span className="post-type-icon">{cfg.icon}</span>
        <span className="post-type-label">{cfg.label}</span>
        {post.isUsta && <span className="usta-verified">✓ Doğrulanmış Usta</span>}
      </div>

      <div className="forum-post-body">
        <div className="forum-avatar lg">{(post.username || '?')[0].toUpperCase()}</div>
        <div className="forum-post-content">
          <div className="forum-meta">
            <span className="forum-author">{post.username}</span>
            {post.isUsta && <span className="usta-tag">Usta</span>}
            <span className="forum-date">{post.date}</span>
          </div>
          <p className="forum-text">{post.text}</p>
          <div className="forum-actions">
            <button
              className={`forum-vote${voted ? ' voted' : ''}`}
              onClick={() => onVote(post.id)}
            >
              👍 {post.helpful > 0 ? `${post.helpful} kişi faydalı buldu` : 'Faydalı'}
            </button>
            <button className="forum-reply-btn" onClick={handleReplyClick}>
              ↩ Yanıtla
            </button>
            {(post.replies || []).length > 0 && (
              <button className="forum-reply-btn" onClick={() => setShowReplies(s => !s)}>
                {showReplies ? '▲' : '▼'} {(post.replies || []).length} yanıt
              </button>
            )}
          </div>

          {/* Replies */}
          {showReplies && (post.replies || []).length > 0 && (
            <div className="forum-replies">
              {(post.replies || []).map(r => (
                <ReplyItem
                  key={r.id} reply={r} user={user}
                  onVote={(rid) => onVoteReply(post.id, rid)}
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
              <div className="forum-reply-form-actions">
                <button type="button" className="forum-cancel-btn" onClick={() => setShowReplyBox(false)}>İptal</button>
                <button type="submit" className="forum-submit-btn">Yanıtla</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main CommentSection ───────────────────────────────────────────────────────
export function CommentSection({ faultId, user, onAuthRequest }) {
  const [forum, setForum] = useState(() => {
    const stored = loadForum();
    // Merge seed data (only if not already stored)
    const merged = { ...stored };
    if (SEED[faultId] && !stored[faultId]) {
      merged[faultId] = SEED[faultId];
    }
    return merged;
  });

  const [open, setOpen] = useState(false);
  const [newText, setNewText] = useState('');
  const [newType, setNewType] = useState('yorum');
  const [isUsta, setIsUsta] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'usta' | 'oneri' | 'soru'

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

  const submitPost = (e) => {
    e.preventDefault();
    if (!newText.trim()) return;
    const post = {
      id: `u-${Date.now()}`,
      type: newType,
      username: user.username,
      isUsta: newType === 'usta' ? true : isUsta,
      text: newText.trim(),
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

  const addReply = (postId, text) => {
    const reply = {
      id: `r-${Date.now()}`,
      username: user.username,
      isUsta: false,
      text,
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

  return (
    <>
      {/* Toggle button */}
      <button className="card-comments-toggle" onClick={() => setOpen(o => !o)}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        {totalCount > 0 ? (
          <>
            <span className="comment-badge">{totalCount}</span>
            tartışma
            {ustaCount > 0 && <span className="usta-count-badge">🔧 {ustaCount} usta önerisi</span>}
            · {open ? 'gizle' : 'göster'}
          </>
        ) : (
          'Tartışma yok · İlk yorumu yaz'
        )}
        <span style={{ marginLeft: 'auto', fontSize: 11 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="forum-section">
          {/* Tab filter */}
          {posts.length > 0 && (
            <div className="forum-tabs">
              {[
                { key: 'all', label: 'Tümü', count: posts.length },
                { key: 'usta', label: '🔧 Usta', count: posts.filter(p => p.type === 'usta').length },
                { key: 'oneri', label: '💡 Öneri', count: posts.filter(p => p.type === 'oneri').length },
                { key: 'soru', label: '❓ Soru', count: posts.filter(p => p.type === 'soru').length },
                { key: 'yorum', label: '💬 Yorum', count: posts.filter(p => p.type === 'yorum').length },
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
                  onVote={votePost}
                  onVoteReply={voteReply}
                  onReply={addReply}
                  onAuthRequest={onAuthRequest}
                />
              ))}
            </div>
          ) : (
            <div className="forum-empty">Bu kategoride henüz gönderi yok.</div>
          )}

          {/* New post form */}
          {user ? (
            <form className="forum-new-post" onSubmit={submitPost}>
              <div className="forum-new-header">
                <div className="forum-avatar sm">{user.username[0].toUpperCase()}</div>
                <span className="forum-new-label">Katkıda bulun</span>
              </div>
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
              <textarea
                className="forum-textarea"
                placeholder={
                  newType === 'usta' ? 'Mesleki deneyiminizi ve önerinizi yazın…'
                  : newType === 'oneri' ? 'Çözüm önerinizi açıklayın…'
                  : newType === 'soru' ? 'Sorunuzu detaylı açıklayın…'
                  : 'Deneyiminizi paylaşın…'
                }
                value={newText}
                onChange={e => setNewText(e.target.value)}
                maxLength={600}
                rows={3}
              />
              <div className="forum-new-footer">
                <span className="forum-char-count">{newText.length}/600</span>
                <button type="submit" className="forum-submit-btn" disabled={!newText.trim()}>
                  Gönder
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
    </>
  );
}
