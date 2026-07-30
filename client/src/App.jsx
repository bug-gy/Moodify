import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PlayerProvider } from './components/AudioPlayer';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import NowPlaying from './pages/NowPlaying';
import PlaylistPage from './pages/PlaylistPage';

function SiteLogo() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className={`site-logo-wrap ${isHome ? 'site-logo-center' : 'site-logo-left'}`}>
      <Link to="/" className="site-logo-link">
        <img src="/MOO.png" alt="Moodify" className="site-logo-img" />
      </Link>
    </div>
  );
}

function AppLayout() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  return (
    <div className="app">
      <Navbar isHome={isHome} />
      {isHome && <SiteLogo />}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/playlist/:id"
            element={
              <ProtectedRoute>
                <PlaylistPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <Routes>
          <Route path="/now-playing" element={<NowPlaying />} />
          <Route path="*" element={<AppLayout />} />
        </Routes>
      </PlayerProvider>
    </AuthProvider>
  );
}

export default App;
