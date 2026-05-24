import { createContext, useContext, useState, useCallback } from 'react';
import { loadSiteContent, saveSiteContent } from './siteContent.js';
import { adminLogin, adminLogout, isAdmin as checkAdmin, loadPending } from './adminStorage.js';

const LiveEditContext = createContext(null);

const defaultLiveEdit = {
  content: {},
  authed: false,
  editMode: false,
  setEditMode: () => {},
  openLogin: () => {},
  handleLogout: () => {},
  updateField: () => {},
  pendingCount: 0,
  refreshPending: () => {},
  hubOpen: false,
  hubTab: 'pending',
  openHub: () => {},
  setHubOpen: () => {},
  setHubTab: () => {},
  registerAdminCallbacks: () => {},
  adminCallbacks: {},
};

export function useLiveEdit() {
  return useContext(LiveEditContext) ?? defaultLiveEdit;
}

export function setContentPath(content, path, value) {
  const next = JSON.parse(JSON.stringify(content));
  let cur = next;
  for (let i = 0; i < path.length - 1; i++) cur = cur[path[i]];
  cur[path[path.length - 1]] = value;
  return next;
}

export function LiveEditProvider({ children }) {
  const [content, setContent] = useState(() => loadSiteContent());
  const [authed, setAuthed] = useState(() => checkAdmin());
  const [editMode, setEditMode] = useState(false);
  const [pendingCount, setPendingCount] = useState(() => loadPending().length);
  const [hubOpen, setHubOpen] = useState(false);
  const [hubTab, setHubTab] = useState('pending');
  const [adminCallbacks, setAdminCallbacks] = useState({});

  const refreshPending = useCallback(() => {
    setPendingCount(loadPending().length);
  }, []);

  const updateField = useCallback((path, value) => {
    setContent(prev => {
      const next = setContentPath(prev, path, value);
      saveSiteContent(next);
      return next;
    });
  }, []);

  const openLogin = () => {};
  const handleLogin = async (u, p) => {
    if (await adminLogin(u, p)) {
      setAuthed(true);
      setEditMode(false);
      refreshPending();
      return true;
    }
    return false;
  };
  const handleLogout = () => {
    adminLogout();
    setAuthed(false);
    setEditMode(false);
    setHubOpen(false);
  };

  const openHub = (tab = 'pending') => {
    setHubTab(tab);
    setHubOpen(true);
    refreshPending();
  };

  return (
    <LiveEditContext.Provider value={{
      content, authed, editMode, setEditMode,
      openLogin, handleLogout, updateField,
      pendingCount, refreshPending,
      hubOpen, hubTab, openHub, setHubOpen, setHubTab,
      registerAdminCallbacks: setAdminCallbacks,
      adminCallbacks,
      loginAdmin: handleLogin,
    }}>
      {children}
      {authed && (
        <LiveEditToolbar
          editMode={editMode}
          pendingCount={pendingCount}
          onToggle={() => setEditMode(m => !m)}
          onLogout={handleLogout}
          onNewFault={() => (adminCallbacks.onNewFault || (() => {}))()}
          onNewModel={() => (adminCallbacks.onNewModel || (() => {}))()}
          onOpenHub={openHub}
        />
      )}
    </LiveEditContext.Provider>
  );
}

export function Editable({ value, path, as: Tag = 'span', className = '', multiline }) {
  const { editMode, updateField } = useLiveEdit();
  if (!editMode) return <Tag className={className}>{value}</Tag>;

  return (
    <Tag
      className={`live-editable${className ? ` ${className}` : ''}`}
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => {
        const text = e.currentTarget.textContent.trim();
        if (text !== value) updateField(path, text);
      }}
      onKeyDown={(e) => {
        if (!multiline && e.key === 'Enter') {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      title="Düzenlemek için tıklayın"
    >
      {value}
    </Tag>
  );
}

function LiveEditToolbar({ editMode, pendingCount, onToggle, onLogout, onNewFault, onNewModel, onOpenHub }) {
  return (
    <div className={`live-edit-bar${editMode ? ' active' : ''}`}>
      <div className="live-edit-bar-inner">
        <span className="live-edit-status">
          {editMode ? '✏️ Düzenleme modu' : '👁 Önizleme'}
        </span>
        {editMode && (
          <div className="live-edit-quick">
            <button type="button" className="live-edit-btn live-edit-btn-sm" onClick={onNewFault}>+ Arıza</button>
            <button type="button" className="live-edit-btn live-edit-btn-sm" onClick={onNewModel}>+ Model</button>
            <button type="button" className="live-edit-btn live-edit-btn-sm" onClick={() => onOpenHub('forum')}>💬 Konular</button>
            <button type="button" className="live-edit-btn live-edit-btn-sm" onClick={() => onOpenHub('pending')}>
              ⏳ Onaylar{pendingCount > 0 ? ` (${pendingCount})` : ''}
            </button>
            <button type="button" className="live-edit-btn live-edit-btn-sm" onClick={() => onOpenHub('categories')}>🏷️</button>
          </div>
        )}
        <div className="live-edit-actions">
          <button type="button" className="live-edit-btn" onClick={() => onOpenHub('pending')}>Yönetim</button>
          <button type="button" className="live-edit-btn" onClick={onToggle}>
            {editMode ? 'Önizleme' : 'Düzenle'}
          </button>
          <button type="button" className="live-edit-btn live-edit-btn-out" onClick={onLogout}>Çıkış</button>
        </div>
      </div>
    </div>
  );
}
