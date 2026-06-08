import { useState, useEffect } from 'react';
import { loadUsers, saveUsers, hashPassword, loadPending } from './adminStorage.js';

export default function ProfilePage({ user, allFaults, onBack, onFaultClick, onUpdateUser }) {
  const [activeTab, setActiveTab] = useState('verified'); // 'verified' | 'suggested' | 'password'
  const [pendingFaults, setPendingFaults] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdLoading, setPwdLoading] = useState('');

  // Extract verified faults from localStorage
  const verifiedFaults = allFaults.filter(fault => {
    try {
      const verifyKey = `ka_verified_${fault.id}`;
      const list = JSON.parse(localStorage.getItem(verifyKey)) || [];
      return list.includes(user.id);
    } catch {
      return false;
    }
  });

  // Load pending faults submitted by the user
  useEffect(() => {
    setLoadingPending(true);
    loadPending()
      .then(list => {
        const filtered = list.filter(item => item._submittedBy === user.username);
        setPendingFaults(filtered);
      })
      .catch(err => console.error("Error loading pending faults", err))
      .finally(() => setLoadingPending(false));
  }, [user.username]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwdError('Lütfen tüm alanları doldurun.');
      return;
    }

    if (newPassword.length < 6) {
      setPwdError('Yeni şifre en az 6 karakter olmalı.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError('Yeni şifreler eşleşmiyor.');
      return;
    }

    setPwdLoading(true);
    try {
      const users = await loadUsers();
      const currentHashed = await hashPassword(currentPassword);
      
      const dbUserIndex = users.findIndex(u => u.id === user.id);
      if (dbUserIndex === -1) {
        setPwdError('Kullanıcı hesabı bulunamadı.');
        setPwdLoading(false);
        return;
      }

      const dbUser = users[dbUserIndex];
      // Support migration/backward compatibility for plaintext password checks
      const isMatch = dbUser.password === currentHashed || dbUser.password === currentPassword;

      if (!isMatch) {
        setPwdError('Mevcut şifreniz yanlış.');
        setPwdLoading(false);
        return;
      }

      const newHashed = await hashPassword(newPassword);
      users[dbUserIndex].password = newHashed;
      
      await saveUsers(users);

      // Update session storage and parent state
      const updatedUser = { ...user, password: newHashed };
      localStorage.setItem('ka_session', JSON.stringify(updatedUser));
      if (onUpdateUser) onUpdateUser(updatedUser);

      setPwdSuccess('Şifreniz başarıyla değiştirildi.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      setPwdError('Şifre değiştirilirken bir hata oluştu.');
    } finally {
      setPwdLoading(false);
    }
  };

  const username = user?.username || 'Kullanıcı';
  const initial = username ? username[0].toUpperCase() : '?';

  return (
    <div className="profile-page-container">
      {/* Back button */}
      <div className="profile-back-nav">
        <button className="profile-back-btn" onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Geri Dön
        </button>
      </div>

      {/* Profile Header Card */}
      <div className="profile-header-card">
        <div className="profile-avatar-large">
          {initial}
        </div>
        <div className="profile-info-text">
          <h2>{username}</h2>
          <p className="profile-email">{user?.email}</p>
          <div className="profile-badges">
            <span className={`profile-badge-role ${user?.isAdmin ? 'admin' : 'user'}`}>
              {user?.isAdmin ? '🛡️ Yönetici' : '👤 Üye'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="profile-stats-grid">
        <div className="profile-stat-card">
          <div className="stat-icon">👍</div>
          <div className="stat-info">
            <span className="stat-value">{verifiedFaults.length}</span>
            <span className="stat-label">Doğruladığım Arıza</span>
          </div>
        </div>
        <div className="profile-stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <span className="stat-value">{pendingFaults.length}</span>
            <span className="stat-label">Önerdiğim Arıza</span>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="profile-tabs">
        <button 
          className={`profile-tab-btn ${activeTab === 'verified' ? 'active' : ''}`}
          onClick={() => setActiveTab('verified')}
        >
          Doğruladıklarım ({verifiedFaults.length})
        </button>
        <button 
          className={`profile-tab-btn ${activeTab === 'suggested' ? 'active' : ''}`}
          onClick={() => setActiveTab('suggested')}
        >
          Önerilerim ({pendingFaults.length})
        </button>
        <button 
          className={`profile-tab-btn ${activeTab === 'password' ? 'active' : ''}`}
          onClick={() => setActiveTab('password')}
        >
          🔑 Şifre Değiştir
        </button>
      </div>

      {/* Tab content */}
      <div className="profile-tab-content">
        {activeTab === 'verified' && (
          <div className="profile-list-section">
            <h3>Doğruladığım Kronik Arızalar</h3>
            {verifiedFaults.length === 0 ? (
              <div className="profile-empty-state">
                <span className="empty-emoji">🔍</span>
                <p>Henüz herhangi bir kronik arızayı doğrulamadınız.</p>
                <p className="empty-sub">Arıza detay sayfalarında "Ben de yaşadım" butonuna tıklayarak doğrulayabilirsiniz.</p>
              </div>
            ) : (
              <div className="profile-list">
                {verifiedFaults.map(fault => (
                  <div key={fault.id} className="profile-list-item" onClick={() => onFaultClick && onFaultClick(fault)}>
                    <div className="item-meta">
                      <span className="item-brand">{fault.brand} {fault.model}</span>
                      <span className={`risk-badge mini ${fault.risk}`}>{fault.risk}</span>
                    </div>
                    <h4 className="item-title">{fault.description}</h4>
                    <p className="item-details">{fault.year} · {fault.motorType} · {fault.category}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'suggested' && (
          <div className="profile-list-section">
            <h3>Önerdiğim Arızalar</h3>
            {loadingPending ? (
              <div className="profile-loading">Yükleniyor...</div>
            ) : pendingFaults.length === 0 ? (
              <div className="profile-empty-state">
                <span className="empty-emoji">✏️</span>
                <p>Henüz bir arıza bildiriminde bulunmadınız.</p>
                <button className="btn-suggest-now" onClick={onBack}>Şimdi Bildir</button>
              </div>
            ) : (
              <div className="profile-list">
                {pendingFaults.map(fault => (
                  <div key={fault._pendingId} className="profile-list-item pending">
                    <div className="item-meta">
                      <span className="item-brand">{fault.brand} {fault.model}</span>
                      <span className="pending-badge">Onay Bekliyor</span>
                    </div>
                    <h4 className="item-title">{fault.fault || fault.description}</h4>
                    <p className="item-details">
                      {fault.year || 'Tüm Yıllar'} · {fault.motorType} · {fault.category}
                    </p>
                    <span className="item-date">Gönderim: {new Date(fault._submittedAt).toLocaleDateString('tr-TR')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'password' && (
          <div className="profile-password-section">
            <h3>Şifre Güncelleme</h3>
            <form onSubmit={handlePasswordChange} className="profile-password-form">
              {pwdError && <div className="pwd-message error">⚠️ {pwdError}</div>}
              {pwdSuccess && <div className="pwd-message success">✅ {pwdSuccess}</div>}
              
              <div className="form-group">
                <label htmlFor="current-password">Mevcut Şifre</label>
                <input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="new-password">Yeni Şifre</label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="En az 6 karakter"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password">Yeni Şifre (Tekrar)</label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button type="submit" className="btn-submit-pwd" disabled={pwdLoading}>
                {pwdLoading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
