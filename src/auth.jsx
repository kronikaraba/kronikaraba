import { useState } from 'react';
import { hashPassword, loadUsers, saveUsers } from './adminStorage.js';

const SESSION_KEY = 'ka_session';

export function loadUser() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
}

export function AuthModal({ onClose, onLogin, onAdminLogin, defaultTab = 'login' }) {
  const [tab, setTab] = useState(defaultTab);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError(''); setSuccess(''); };

  const handleLogin = async (e) => {
    e.preventDefault();
    const inputIdentifier = form.email.trim();
    const inputPassword = form.password;

    if (onAdminLogin && (inputIdentifier === 'admin' || inputIdentifier === 'admin@kronikaraba.com')) {
      const success = await onAdminLogin(inputIdentifier, inputPassword);
      if (success) {
        onClose();
        return;
      }
    }

    try {
      const users = await loadUsers();
      const hashedInputPassword = await hashPassword(inputPassword);
      let user = users.find(u => (u.email === inputIdentifier || u.username === inputIdentifier) && u.password === hashedInputPassword);
      
      if (!user) {
        // Try to find user with plaintext password for backward compatibility (migration)
        const plainUser = users.find(u => (u.email === inputIdentifier || u.username === inputIdentifier) && u.password === inputPassword);
        if (plainUser) {
          // Migrate to hashed password
          plainUser.password = hashedInputPassword;
          await saveUsers(users);
          user = plainUser;
        }
      }

      if (!user) { setError('Kullanıcı adı/E-posta veya şifre hatalı.'); return; }
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      onLogin(user);
      onClose();
    } catch (err) {
      console.error("Login failed", err);
      setError('Giriş yapılırken bir hata oluştu.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (form.username.length < 3) { setError('Kullanıcı adı en az 3 karakter olmalı.'); return; }
    if (!form.email.includes('@')) { setError('Geçerli bir e-posta girin.'); return; }
    if (form.password.length < 6) { setError('Şifre en az 6 karakter olmalı.'); return; }
    
    try {
      const users = await loadUsers();
      if (users.find(u => u.email === form.email)) { setError('Bu e-posta zaten kayıtlı.'); return; }
      const hashedPassword = await hashPassword(form.password);
      const user = { id: Date.now().toString(), username: form.username, email: form.email, password: hashedPassword };
      await saveUsers([...users, user]);
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      onLogin(user);
      onClose();
    } catch (err) {
      console.error("Registration failed", err);
      setError('Kayıt oluşturulurken bir hata oluştu.');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.email.trim() || !form.password.trim()) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }
    if (form.password.length < 6) {
      setError('Yeni şifre en az 6 karakter olmalı.');
      return;
    }

    try {
      const users = await loadUsers();
      const userIndex = users.findIndex(
        u => u.username.toLowerCase() === form.username.trim().toLowerCase() && 
             u.email.toLowerCase() === form.email.trim().toLowerCase()
      );

      if (userIndex === -1) {
        setError('Kullanıcı adı ve e-posta eşleşen bir hesap bulunamadı.');
        return;
      }

      const hashedNewPassword = await hashPassword(form.password);
      users[userIndex].password = hashedNewPassword;
      await saveUsers(users);

      setSuccess('Şifreniz başarıyla sıfırlandı! Şimdi giriş yapabilirsiniz.');
      setTab('login');
      setForm({ username: '', email: '', password: '' });
    } catch (err) {
      console.error("Password reset failed", err);
      setError('Şifre sıfırlanırken bir hata oluştu.');
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>{tab === 'login' ? 'Giriş Yap' : tab === 'register' ? 'Üye Ol' : 'Şifremi Sıfırla'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {tab !== 'forgot' && (
          <div className="auth-tabs">
            <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => { setTab('login'); setError(''); setSuccess(''); }}>Giriş Yap</button>
            <button className={`auth-tab${tab === 'register' ? ' active' : ''}`} onClick={() => { setTab('register'); setError(''); setSuccess(''); }}>Üye Ol</button>
          </div>
        )}

        <div className="auth-info">
          {tab === 'login'
            ? 'Hesabınıza giriş yaparak yorum ekleyebilir ve arızaları doğrulayabilirsiniz.'
            : tab === 'register'
            ? 'Ücretsiz hesap oluşturun, araç arızalarını paylaşın ve toplulukla etkileşime geçin.'
            : 'Hesap bilgilerinizi doğrulayarak şifrenizi sıfırlayabilirsiniz.'}
        </div>

        <form onSubmit={tab === 'login' ? handleLogin : tab === 'register' ? handleRegister : handleForgotPassword}>
          <div className="modal-body">
            {error && <div className="auth-error">⚠️ {error}</div>}
            {success && <div className="auth-success" style={{ color: 'var(--green-600)', background: 'var(--green-50)', padding: 10, borderRadius: 6, marginBottom: 15, fontSize: 13, border: '1px solid var(--green-200)' }}>✅ {success}</div>}

            {tab === 'forgot' && (
              <>
                <div className="form-group">
                  <label htmlFor="auth-username">Kullanıcı Adı</label>
                  <input id="auth-username" type="text" placeholder="örn. ahmet_araba" value={form.username} onChange={e => set('username', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="auth-email">E-posta Adresi</label>
                  <input id="auth-email" type="email" placeholder="ornek@email.com" value={form.email} onChange={e => set('email', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="auth-password">Yeni Şifre</label>
                  <input id="auth-password" type="password" placeholder="En az 6 karakter" value={form.password} onChange={e => set('password', e.target.value)} required />
                </div>
              </>
            )}

            {tab === 'register' && (
              <div className="form-group">
                <label htmlFor="auth-username">Kullanıcı Adı</label>
                <input id="auth-username" type="text" placeholder="örn. ahmet_araba" value={form.username} onChange={e => set('username', e.target.value)} required />
              </div>
            )}

            {tab !== 'forgot' && (
              <div className="form-group">
                <label htmlFor="auth-email">{tab === 'login' ? 'Kullanıcı Adı veya E-posta' : 'E-posta'}</label>
                <input id="auth-email" type={tab === 'login' ? 'text' : 'email'} placeholder={tab === 'login' ? 'örn. admin veya ornek@email.com' : 'ornek@email.com'} value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>
            )}

            {tab !== 'forgot' && (
              <div className="form-group">
                <label htmlFor="auth-password">Şifre</label>
                <input id="auth-password" type="password" placeholder={tab === 'register' ? 'En az 6 karakter' : '••••••••'} value={form.password} onChange={e => set('password', e.target.value)} required />
              </div>
            )}

            {tab === 'login' && (
              <div className="forgot-password-link-container" style={{ textAlign: 'right', marginTop: -5, marginBottom: 10 }}>
                <button type="button" className="btn-forgot-password-link" style={{ background: 'none', border: 'none', color: 'var(--primary-color, #2563eb)', fontSize: 12, cursor: 'pointer', padding: 0 }} onClick={() => { setTab('forgot'); setError(''); setSuccess(''); }}>
                  Şifremi Unuttum
                </button>
              </div>
            )}
          </div>

          <div className="modal-footer">
            {tab === 'forgot' ? (
              <>
                <button type="button" className="btn-cancel" onClick={() => { setTab('login'); setError(''); setSuccess(''); }}>Giriş Sayfasına Dön</button>
                <button type="submit" className="btn-submit">Şifreyi Sıfırla</button>
              </>
            ) : (
              <>
                <button type="button" className="btn-cancel" onClick={onClose}>İptal</button>
                <button type="submit" className="btn-submit">{tab === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}</button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}
