import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { loadSiteContent, saveSiteContent, defaultSiteContent } from './siteContent.js';
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
  const [content, setContent] = useState(defaultSiteContent);
  const [authed, setAuthed] = useState(() => checkAdmin());
  const [editMode, setEditMode] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [hubOpen, setHubOpen] = useState(false);
  const [hubTab, setHubTab] = useState('pending');
  const [adminCallbacks, setAdminCallbacks] = useState({});

  // Load site content from API on mount
  useEffect(() => {
    loadSiteContent().then(c => setContent(c));
  }, []);

  // Async pending count refresh
  const refreshPending = useCallback(() => {
    loadPending().then(p => setPendingCount(p.length));
  }, []);

  // Initial pending load when authed
  useEffect(() => {
    if (authed) refreshPending();
  }, [authed, refreshPending]);

  const updateField = useCallback((path, value) => {
    setContent(prev => {
      const next = setContentPath(prev, path, value);
      saveSiteContent(next); // async fire-and-forget
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
