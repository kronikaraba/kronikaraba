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
  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError(''); };

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

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>{tab === 'login' ? 'Giriş Yap' : 'Üye Ol'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => { setTab('login'); setError(''); }}>Giriş Yap</button>
          <button className={`auth-tab${tab === 'register' ? ' active' : ''}`} onClick={() => { setTab('register'); setError(''); }}>Üye Ol</button>
        </div>

        <div className="auth-info">
          {tab === 'login'
            ? 'Hesabınıza giriş yaparak yorum ekleyebilir ve arızaları doğrulayabilirsiniz.'
            : 'Ücretsiz hesap oluşturun, araç arızalarını paylaşın ve toplulukla etkileşime geçin.'}
        </div>

        <form onSubmit={tab === 'login' ? handleLogin : handleRegister}>
          <div className="modal-body">
            {error && <div className="auth-error">⚠️ {error}</div>}

            {tab === 'register' && (
              <div className="form-group">
                <label htmlFor="auth-username">Kullanıcı Adı</label>
                <input id="auth-username" type="text" placeholder="örn. ahmet_araba" value={form.username} onChange={e => set('username', e.target.value)} required />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="auth-email">{tab === 'login' ? 'Kullanıcı Adı veya E-posta' : 'E-posta'}</label>
              <input id="auth-email" type={tab === 'login' ? 'text' : 'email'} placeholder={tab === 'login' ? 'örn. admin veya ornek@email.com' : 'ornek@email.com'} value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>

            <div className="form-group">
              <label htmlFor="auth-password">Şifre</label>
              <input id="auth-password" type="password" placeholder={tab === 'register' ? 'En az 6 karakter' : '••••••••'} value={form.password} onChange={e => set('password', e.target.value)} required />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>İptal</button>
            <button type="submit" className="btn-submit">{tab === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}
