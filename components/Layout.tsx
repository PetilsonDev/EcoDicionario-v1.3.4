
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Moon, Sun, Info, Menu, BookOpen, Heart, User, LogIn, 
  Home, Star, Phone, Circle, RefreshCw, X, ShieldAlert 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { APP_VERSION } from '../services/data';

interface LayoutProps {
  children: React.ReactNode;
  darkMode: boolean;
  toggleTheme: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, darkMode, toggleTheme }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut, isOnline } = useAuth();
  
  const isHomePage = location.pathname === '/';
  const isProfilePage = location.pathname === '/perfil';
  const isAuthPage = location.pathname === '/auth';
  const isFavoritesPage = location.pathname === '/favoritos';
  const isUpdatePasswordPage = location.pathname === '/update-password';

  // Verifica se estamos num fluxo de recuperação (pela URL ou pelo estado do Supabase)
  // Nota: Consideramos bloqueado se estivermos na página de update-password
  const isLocked = isUpdatePasswordPage;

  useEffect(() => {
    const handleUpdate = (e: any) => {
      setSwRegistration(e.detail);
      setShowUpdateBanner(true);
    };
    window.addEventListener('sw-update-available', handleUpdate);
    return () => window.removeEventListener('sw-update-available', handleUpdate);
  }, []);

  const handleApplyUpdate = () => {
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    setShowUpdateBanner(false);
  };

  const closeMenu = () => {
    if (isLocked) return; // Impede fechar/abrir se estiver bloqueado
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    await signOut();
    closeMenu();
    navigate('/');
  };

  const NavItem = ({ to, icon: Icon, label, badge, action }: any) => {
    const isActive = location.pathname === to && !action;
    const content = (
      <div className={`flex items-center justify-between p-3 rounded-xl transition-colors ${isActive ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
        <div className="flex items-center gap-3">
          <Icon size={20} />
          <span className="font-medium">{label}</span>
        </div>
        {badge && (
          <span className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
            {badge}
          </span>
        )}
      </div>
    );
    if (action) return <button onClick={action} className="w-full text-left">{content}</button>;
    return <Link to={to} onClick={closeMenu} className="block">{content}</Link>;
  };

  return (
    <div className="flex flex-col min-h-screen font-sans bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      
      {/* Update Notification Banner */}
      {showUpdateBanner && !isLocked && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm animate-slide-up">
          <div className="bg-eco-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 border border-white/20">
            <div className="flex items-center gap-3">
              <RefreshCw className="animate-spin-slow" size={20} />
              <div className="leading-tight">
                <p className="text-sm font-bold">Nova versão disponível!</p>
                <p className="text-[10px] opacity-80">Atualize para as últimas melhorias.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleApplyUpdate} className="bg-white text-eco-600 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">Atualizar</button>
              <button onClick={() => setShowUpdateBanner(false)} className="p-1 hover:bg-white/10 rounded-full"><X size={16} /></button>
            </div>
          </div>
        </div>
      )}

      <header className={`fixed top-0 left-0 w-full z-50 text-white shadow-lg transition-colors ${isLocked ? 'bg-gray-900 border-b border-white/10' : 'bg-eco-600 dark:bg-gray-800'}`}>
        <div className="container mx-auto px-4 h-[70px] flex items-center justify-between">
          
          {/* Logo - Disable link if locked */}
          {isLocked ? (
            <div className="flex items-center gap-3 opacity-80">
              <div className="bg-white/10 p-2 rounded-lg">
                <ShieldAlert size={24} className="text-yellow-500" strokeWidth={2.5} />
              </div>
              <div className="leading-tight text-left">
                <h1 className="text-xl font-bold">EcoDicionário</h1>
                <p className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest">Segurança Ativa</p>
              </div>
            </div>
          ) : (
            <Link to="/" onClick={closeMenu} className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <BookOpen size={24} className="text-white" strokeWidth={2.5} />
              </div>
              <div className="leading-tight text-left">
                <h1 className="text-xl font-bold">EcoDicionário</h1>
                <p className="text-xs text-eco-100">Angola</p>
              </div>
            </Link>
          )}

          <div className="flex items-center gap-4">
            {!isLocked && (
              <div className="hidden md:flex items-center gap-4">
                  <Link to={isHomePage ? "/sobre" : "/"} className={`flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors ${!isHomePage && !isProfilePage && !isAuthPage && !isFavoritesPage ? 'bg-white text-eco-600' : 'bg-white/10 hover:bg-white/20'}`}>
                  {isHomePage ? <Info size={16} /> : <BookOpen size={16} />}
                  <span>{isHomePage ? "Sobre" : "Dicionário"}</span>
                  </Link>

                  <Link to="/favoritos" className={`flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors ${isFavoritesPage ? 'bg-white text-eco-600' : 'bg-white/10 hover:bg-white/20'}`}>
                  <Star size={16} fill={isFavoritesPage ? "currentColor" : "none"} />
                  <span>Favoritos</span>
                  </Link>

                  <a href="https://wa.me/+244925430567" target="_blank" rel="noreferrer" className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-5 py-2 rounded-full font-bold shadow-md hover:scale-105 flex items-center gap-2 text-sm transition-transform">
                  <Heart size={16} fill="currentColor" /> Apoie
                  </a>
                  
                  <div className="w-px h-6 bg-white/20 mx-1"></div>

                  {user ? (
                  <Link to="/perfil" className={`flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors ${isProfilePage ? 'bg-white text-eco-600' : 'bg-white/10 hover:bg-white/20'}`}>
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-white/30 flex items-center justify-center bg-white/10">
                      {profile?.avatar_url ? <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : <User size={14} />}
                  </div>
                  <span>{profile?.full_name?.split(' ')[0] || 'Perfil'}</span>
                  </Link>
                  ) : (
                      <Link to="/auth" className={`flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors ${isAuthPage ? 'bg-white text-eco-600' : 'bg-white/10 hover:bg-white/20'}`}>
                      <LogIn size={16} /> <span>Entrar</span>
                  </Link>
                  )}

                  <button onClick={toggleTheme} className="p-2 rounded-full bg-black/20 hover:bg-black/30 transition-colors">
                  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                  </button>
              </div>
            )}
            
            {/* Show theme toggle even if locked but as the only option, or hide everything */}
            {isLocked ? (
               <button onClick={toggleTheme} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
               </button>
            ) : (
               <button onClick={() => setIsMenuOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-white/10 focus:outline-none"><Menu size={28} /></button>
            )}
          </div>
        </div>
      </header>

      {/* Backdrop (Only if not locked) */}
      {isMenuOpen && !isLocked && <div className="fixed inset-0 bg-black/60 z-[80] md:hidden backdrop-blur-sm transition-opacity" onClick={closeMenu} />}

      {/* Drawer (Only if not locked) */}
      {!isLocked && (
        <div className={`fixed top-0 right-0 h-full w-[280px] bg-eco-900 z-[90] shadow-2xl transform transition-transform duration-300 md:hidden flex flex-col ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="p-6 bg-eco-950/50 border-b border-white/10">
                {user ? (
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-200 border-2 border-white/20 flex items-center justify-center shrink-0 overflow-hidden">
                            <img src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name || 'User'}&background=random`} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <Link to="/perfil" onClick={closeMenu}>
                                <h3 className="text-white font-bold truncate leading-tight hover:underline">
                                    {profile?.full_name || 'Utilizador'}
                                </h3>
                            </Link>
                            <p className="text-gray-400 text-xs truncate mb-1">{user.email}</p>
                            <button onClick={handleLogout} className="text-xs text-eco-300 underline underline-offset-2">Sair</button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"><User className="text-gray-300" size={24} /></div>
                        <div>
                            <h3 className="text-white font-bold">Visitante</h3>
                            <Link to="/auth" onClick={closeMenu} className="text-xs text-eco-300 underline underline-offset-2">Entrar na conta</Link>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
                <div>
                    <p className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Navegação</p>
                    <div className="space-y-1">
                        <NavItem to="/" icon={Home} label="Dicionário" />
                        <NavItem to="/favoritos" icon={Star} label="Termos Favoritos" />
                    </div>
                </div>
                <div>
                    <p className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Institucional</p>
                    <div className="space-y-1">
                        <NavItem to="/sobre" icon={Info} label="Sobre & Status" />
                        <a href="https://wa.me/+244925430567" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl text-yellow-500 hover:bg-white/5 transition-colors">
                            <Heart size={20} /> <span className="font-medium">Apoiar o Projeto</span>
                        </a>
                    </div>
                </div>
                <div>
                    <p className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Aparência</p>
                    <button onClick={toggleTheme} className="w-full flex items-center justify-between p-3 rounded-xl text-gray-300 hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                            {darkMode ? <Moon size={20} /> : <Sun size={20} />}
                            <span className="font-medium">{darkMode ? "Modo Escuro" : "Modo Claro"}</span>
                        </div>
                        <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${darkMode ? 'bg-eco-500' : 'bg-gray-600'}`}>
                            <div className={`w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform ${darkMode ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                    </button>
                </div>
            </div>

            <div className="p-4 border-t border-white/10 bg-eco-950/30">
                <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                    <div className="flex items-center gap-2">
                        <Circle size={8} className={`${isOnline ? 'text-green-500 fill-green-500' : 'text-red-500 fill-red-500'}`} />
                        <span>{isOnline ? 'Online' : 'Offline'}</span>
                    </div>
                    <span>v{APP_VERSION}</span>
                </div>
            </div>
        </div>
      )}

      <main className={`flex-grow ${isLocked ? 'pt-[70px] bg-gray-100 dark:bg-black/20' : 'pt-[85px]'} px-4 max-w-7xl mx-auto w-full pb-6`}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
