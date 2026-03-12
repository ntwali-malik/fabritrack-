import { useState, useEffect } from 'react';
import { setAuthToken } from './services/apiClient';
import { getCurrentUser } from './services/userService';
import './App.css';
import AuthModal from './components/AuthModal';
import AuthSessionTimeout from './components/AuthSessionTimeout';
import Dashboard from './components/Dashboard';
import AssetScanView from './components/AssetScanView';
import LandingPage from './components/LandingPage';

const STORAGE_KEY_TOKEN = 'fabritrack_token';
const STORAGE_KEY_USER = 'fabritrack_user';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [restored, setRestored] = useState(false);
  const [scannedAssetView, setScannedAssetView] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('v') === 'asset' && params.get('d')) {
      try {
        const decoded = decodeURIComponent(escape(atob(params.get('d'))));
        const data = JSON.parse(decoded);
        setScannedAssetView(data);
        window.history.replaceState({}, '', window.location.pathname + (window.location.hash || ''));
      } catch (_) {}
    }
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
    const savedUser = localStorage.getItem(STORAGE_KEY_USER);
    if (savedToken && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setAuthToken(savedToken);
        setToken(savedToken);
        setUser(parsed);
        // If stored user has no permissions (e.g. old session), refetch /me to get permissions
        if (!parsed.permissions || parsed.permissions.length === 0) {
          getCurrentUser()
            .then((res) => {
              if (res && res.user) {
                const u = { ...res.user, permissions: res.permissions || [] };
                setUser(u);
                localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(u));
              }
            })
            .catch(() => {});
        }
      } catch (_) {}
    }
    setRestored(true);
  }, []);

  const handleLoginSuccess = ({ token: newToken, user: newUser, permissions }) => {
    setToken(newToken);
    const userWithPermissions = { ...newUser, permissions: permissions || newUser?.permissions || [] };
    setUser(userWithPermissions);
    localStorage.setItem(STORAGE_KEY_TOKEN, newToken);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userWithPermissions));
  };

  const handleLogout = () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);
  };

  if (!restored) {
    return (
      <div className="App" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        Loading…
      </div>
    );
  }

  if (scannedAssetView) {
    return (
      <div className="App">
        <AssetScanView asset={scannedAssetView} onClose={() => setScannedAssetView(null)} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="App">
        <LandingPage onLoginClick={() => setShowAuthModal(true)} />
        {showAuthModal && (
          <AuthModal
            onLoginSuccess={handleLoginSuccess}
            onClose={() => setShowAuthModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="App">
      <AuthSessionTimeout onLogout={handleLogout}>
        <Dashboard user={user} onLogout={handleLogout} />
      </AuthSessionTimeout>
    </div>
  );
}

export default App;
