import { useState } from 'react';

const USERS_KEY = 'ka_users';
const SESSION_KEY = 'ka_session';

export function loadUser() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
}

function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch { return []; }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthModal({ onClose, onLogin, defaultTab = 'login' }) {
  const [tab, setTab] = useState(defaultTab);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError(''); };

  const handleLogin = (e) => {
    e.preventDefault();
    const users = getUsers();
    const user = users.find(u => u.email === form.email && u.password === form.password);
    if (!user) { setError('E-posta veya şifre hatalı.'); return; }
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    onLogin(user);
    onClose();
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (form.username.length < 3) { setError('Kullanıcı adı en az 3 karakter olmalı.'); return; }
    if (!form.email.includes('@')) { setError('Geçerli bir e-posta girin.'); return; }
    if (form.password.length < 6) { setError('Şifre en az 6 karakter olmalı.'); return; }
    const users = getUsers();
    if (users.find(u => u.email === form.email)) { setError('Bu e-posta zaten kayıtlı.'); return; }
    const user = { id: Date.now().toString(), username: form.username, email: form.email, password: form.password };
    saveUsers([...users, user]);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    onLogin(user);
    onClose();
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
              <label htmlFor="auth-email">E-posta</label>
              <input id="auth-email" type="email" placeholder="ornek@email.com" value={form.email} onChange={e => set('email', e.target.value)} required />
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
