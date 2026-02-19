
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dictionary from './pages/Dictionary';
import About from './pages/About';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import Favorites from './pages/Favorites';
import UpdatePassword from './pages/UpdatePassword';
import { AuthProvider } from './context/AuthContext';
import SplashScreen from './components/SplashScreen';
import { supabase } from './services/supabase';

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Componente para detetar eventos de auth e navegação
const AuthListener = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Ouvir mudanças de estado do Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        console.log("Evento PASSWORD_RECOVERY detetado. Forçando estadia em /update-password.");
        if (location.pathname !== '/update-password') {
            navigate('/update-password', { replace: true });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location]);

  return null;
};

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('eco_theme');
    return saved === 'dark';
  });

  // Interceptar erros de Hash e links de recuperação na inicialização
  useEffect(() => {
    const checkUrlState = () => {
        const hash = window.location.hash;
        
        // 1. Detetar erro de expiração
        if (hash.includes('error=access_denied') && (hash.includes('otp_expired') || hash.includes('expired'))) {
            window.location.hash = '#/update-password?error=link_expired';
            return;
        }

        // 2. Detetar link de recuperação (access_token vindo do Supabase no hash)
        if (hash.includes('access_token=') && hash.includes('type=recovery')) {
            if (!hash.startsWith('#/update-password')) {
                const params = hash.startsWith('#') ? hash.substring(1) : hash;
                window.location.hash = `#/update-password?${params}`;
            }
        }
    };
    
    checkUrlState();
    window.addEventListener('hashchange', checkUrlState);
    return () => window.removeEventListener('hashchange', checkUrlState);
  }, []);

  // Lógica do Splash Screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('eco_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('eco_theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  return (
    <AuthProvider>
      {loading ? (
        <SplashScreen />
      ) : (
        <Router>
          <ScrollToTop />
          <AuthListener />
          <Layout darkMode={darkMode} toggleTheme={toggleTheme}>
            <Routes>
              <Route path="/" element={<Dictionary />} />
              <Route path="/favoritos" element={<Favorites />} />
              <Route path="/sobre" element={<About />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/perfil" element={<Profile />} />
              <Route path="/update-password" element={<UpdatePassword />} />
              <Route path="*" element={<Dictionary />} /> 
            </Routes>
          </Layout>
        </Router>
      )}
    </AuthProvider>
  );
};

export default App;
