
import React, { useState, useEffect } from 'react';
import { 
  Info, Code, Phone, Mail, BookOpen, RefreshCw, Cloud, 
  CheckCircle, XCircle, X, CloudOff, Clock, Wifi, WifiOff,
  Facebook, Linkedin, Instagram, MessageCircle, ExternalLink, MapPin, Trash2
} from 'lucide-react';
import { APP_VERSION, validateAndSanitizeTerms, mergeTerms } from '../services/data';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

type ToastType = 'success' | 'error' | 'info' | null;

const About: React.FC = () => {
  const { isOnline } = useAuth();
  const [termCount, setTermCount] = useState(0);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

  useEffect(() => {
    loadLocalTermCount();
    loadLastSyncTime();
  }, []);

  const loadLocalTermCount = () => {
    const localDb = localStorage.getItem('eco_database');
    if (localDb) {
        try {
            const parsed = JSON.parse(localDb);
            setTermCount(parsed.length);
            return parsed;
        } catch(e) {
            setTermCount(0);
            return [];
        }
    }
    return [];
  };

  const loadLastSyncTime = () => {
    const storedDate = localStorage.getItem('eco_last_sync');
    if (storedDate) {
        setLastSync(storedDate);
    }
  };

  const updateLastSyncTime = () => {
      const now = new Date();
      const formatted = now.toLocaleDateString('pt-PT', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
      });
      localStorage.setItem('eco_last_sync', formatted);
      localStorage.setItem('eco_last_sync_iso', now.toISOString()); 
      setLastSync(formatted);
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleManualUpdate = async () => {
      if (!isOnline) {
          setToast({ type: 'error', message: "Você está offline. Verifique a sua conexão." });
          return;
      }
      setIsChecking(true);
      try {
          await new Promise(resolve => setTimeout(resolve, 800));
          
          const lastSyncISO = localStorage.getItem('eco_last_sync_iso');
          let query = supabase.from('terms').select('t, d, c, updated_at, deleted_at');
          
          if (lastSyncISO) {
              query = query.gt('updated_at', lastSyncISO);
          }

          const { data, error } = await query;
          if (error) throw error;
          
          if ((!data || data.length === 0) && termCount > 0) {
              setToast({ type: 'info', message: "Você já possui a versão mais recente." });
              updateLastSyncTime(); 
          } else {
               const formattedData = data.map((item: any) => ({ 
                   t: item.t, 
                   d: item.d, 
                   c: item.c, 
                   deleted_at: item.deleted_at 
               }));
               const validatedNewTerms = validateAndSanitizeTerms(formattedData);
               const currentTerms = loadLocalTermCount();
               
               const mergedTerms = mergeTerms(currentTerms, validatedNewTerms);
               
               localStorage.setItem('eco_database', JSON.stringify(mergedTerms));
               setTermCount(mergedTerms.length);
               updateLastSyncTime();
               
               setToast({ type: 'success', message: `Dicionário atualizado!` });
          }
      } catch (err) {
          console.error(err);
          setToast({ type: 'error', message: "Erro ao sincronizar. Tente mais tarde." });
      } finally {
          setIsChecking(false);
      }
  };

  const handleHardReset = async () => {
    if (window.confirm("Isso apagará todos os dados temporários e caches da aplicação. Tem certeza?")) {
        try {
            if ('caches' in window) {
                const names = await caches.keys();
                await Promise.all(names.map(name => caches.delete(name)));
            }
            localStorage.clear();
            setToast({ type: 'success', message: "Sistema reiniciado. Recarregando..." });
            setTimeout(() => window.location.reload(), 1500);
        } catch (e) {
            setToast({ type: 'error', message: "Erro ao reiniciar sistema." });
        }
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 animate-fade-in space-y-8 relative pb-20 px-4 md:px-0">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 left-0 right-0 z-[110] flex justify-center px-4 pointer-events-none">
          <div className={`pointer-events-auto flex items-start gap-4 p-4 rounded-xl shadow-2xl w-full max-w-sm backdrop-blur-md bg-white/95 dark:bg-gray-800/95 border border-gray-100 dark:border-gray-700 transform transition-all animate-slide-up ${toast.type === 'success' ? 'border-l-4 border-l-green-500' : toast.type === 'error' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-blue-500'}`}>
            <div className={`p-2 rounded-full shrink-0 ${toast.type === 'success' ? 'bg-green-100 text-green-600' : toast.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
              {toast.type === 'success' ? <CheckCircle size={20} /> : toast.type === 'error' ? <XCircle size={20} /> : <Info size={20} />}
            </div>
            <div className="flex-1 pt-0.5">
               <p className="text-sm text-gray-800 dark:text-gray-200 font-medium leading-snug">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-block p-5 bg-eco-100 dark:bg-eco-900/30 rounded-full mb-2 border-4 border-white dark:border-gray-800 shadow-sm">
            <BookOpen size={64} className="text-eco-600 dark:text-eco-400" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-eco-700 dark:text-eco-400">EcoDicionário AO</h1>
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider border border-gray-200 dark:border-gray-700">
          Versão {APP_VERSION}
        </div>
      </div>

      {/* About Project */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4 text-eco-600 dark:text-eco-400">
          <Info size={24} />
          <h2 className="text-xl font-bold">Sobre o Projeto</h2>
        </div>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-justify">
          O <strong>EcoDicionário</strong> é uma ferramenta educacional digital desenvolvida para facilitar o acesso a termos ambientais, legislação e conceitos de sustentabilidade em Angola. Promovemos a literacia ambiental para um futuro mais verde e consciente.
        </p>
      </div>

      {/* Contacts & Social Media Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6 text-eco-600 dark:text-eco-400">
          <MessageCircle size={24} />
          <h2 className="text-xl font-bold">Conecte-se connosco</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <a href="mailto:contato@sustech.ao" className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-600 hover:border-eco-500 dark:hover:border-eco-500 transition-all group">
            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg text-eco-600 shadow-sm group-hover:scale-110 transition-transform">
              <Mail size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase">E-mail</p>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">contato@sustech.ao</p>
            </div>
          </a>
          
          <a href="https://wa.me/244925430567" target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-600 hover:border-eco-500 dark:hover:border-eco-500 transition-all group">
            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg text-green-500 shadow-sm group-hover:scale-110 transition-transform">
              <MessageCircle size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase">WhatsApp</p>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">+244 925 430 567</p>
            </div>
          </a>
        </div>

        <div className="flex flex-wrap justify-center gap-6 pt-4 border-t border-gray-100 dark:border-gray-700">
          <a href="https://www.facebook.com/profile.php?id=61580810927599" target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-600 transition-colors">
            <Facebook size={24} />
            <span className="text-[10px] font-bold uppercase">Facebook</span>
          </a>
          <a href="https://www.facebook.com/profile.php?id=61580810927599" target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 text-gray-400 hover:text-pink-600 transition-colors">
            <Instagram size={24} />
            <span className="text-[10px] font-bold uppercase">Instagram</span>
          </a>
          <a href="https://www.facebook.com/profile.php?id=61580810927599" target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-700 transition-colors">
            <Linkedin size={24} />
            <span className="text-[10px] font-bold uppercase">LinkedIn</span>
          </a>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6 text-blue-600 dark:text-blue-400">
          <Cloud size={24} />
          <h2 className="text-xl font-bold">Estado do Sistema</h2>
        </div>
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl flex flex-col justify-center border transition-colors ${!isOnline ? 'bg-gray-50 dark:bg-gray-700/30 border-gray-200' : 'bg-blue-50 dark:bg-blue-900/10 border-blue-100'}`}>
                    <span className="text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1">
                        {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />} Conexão
                    </span>
                    <div className="flex items-center gap-2">
                        {!isOnline ? (
                            <><CloudOff size={18} className="text-gray-500" /><span className="text-sm font-bold text-gray-500">Modo Offline</span></>
                        ) : (
                            <><div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div><span className="text-sm font-bold text-green-600">Nuvem Ativa</span></>
                        )}
                    </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl flex flex-col justify-center border border-gray-200">
                    <span className="text-[10px] font-bold text-gray-400 uppercase mb-1">Base de Dados</span>
                    <div className="flex items-center gap-2 mb-1">
                        <BookOpen size={16} className="text-blue-500" />
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{termCount} Termos</span>
                    </div>
                    {lastSync && (
                        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600/50">
                            <Clock size={12} className="text-gray-400" />
                            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 leading-none">
                                Atualizado: {lastSync}
                            </span>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button onClick={handleManualUpdate} disabled={isChecking || !isOnline} className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 transition-all text-sm font-bold text-gray-700 dark:text-gray-200">
                    <RefreshCw size={16} className={`${isChecking ? 'animate-spin' : ''} text-eco-600`} /> 
                    {isChecking ? 'Sincronizando...' : 'Sincronizar Dados'}
                </button>
                <button onClick={handleHardReset} className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl hover:bg-red-100 transition-all text-sm font-bold text-red-600">
                    <Trash2 size={16} /> 
                    Reiniciar Sistema
                </button>
            </div>
        </div>
      </div>

      {/* Developer Info */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4 text-blue-600 dark:text-blue-400">
          <Code size={24} />
          <h2 className="text-xl font-bold">Desenvolvimento</h2>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Sus-TECH</h3>
            <p className="text-sm text-gray-500 mb-2">Sustentabilidade & Tecnologia</p>
            <p className="text-gray-600 dark:text-gray-300 text-sm italic">
              "Unindo a consciência e a Inovação tecnológica para a resolução de problemas ambientais e sociais."
            </p>
          </div>
          <div className="shrink-0 bg-white p-2 rounded-xl border border-gray-100 shadow-inner">
            <img src="https://raw.githubusercontent.com/Petilson-Seculo/eco-dicionario-angola/main/Logo-Sus-TECH.png" alt="Logo Sus-TECH" className="h-16 w-auto object-contain" />
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="text-center text-gray-400 text-sm pt-4 flex flex-col items-center gap-2 border-t border-gray-100 dark:border-gray-800">
        <p>© 2026 <strong>Sus-TECH</strong>. Todos os direitos reservados.</p>
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold">Sustentabilidade & Tecnologia</p>
        <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-gray-500 dark:text-gray-400">
           <MapPin size={10} />
           <span>Moçâmedes, Namibe • ANGOLA</span>
        </div>
      </div>
    </div>
  );
};

export default About;
