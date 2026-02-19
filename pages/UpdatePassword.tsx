
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Lock, Save, AlertCircle, CheckCircle, WifiOff, XCircle, ArrowLeft, RotateCcw, ShieldAlert, ShieldCheck } from 'lucide-react';

const UpdatePassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Estados de controle de fluxo
  const [isSessionValid, setIsSessionValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Função utilitária para capturar parâmetros mesmo com HashRouter "estranho"
  const getUrlParam = (name: string): string | null => {
    // 1. Tentar nos Search Params normais (após o ?)
    const searchVal = searchParams.get(name);
    if (searchVal) return searchVal;

    // 2. Tentar na URL bruta (caso o hash não tenha sido limpo)
    const fullUrl = window.location.href;
    const regex = new RegExp(`[#?&]${name}=([^&]*)`);
    const match = fullUrl.match(regex);
    return match ? decodeURIComponent(match[1]) : null;
  };

  useEffect(() => {
    const validateRecoverySession = async () => {
        // Se já temos sucesso, não validamos de novo
        if (isUpdated) return;

        // 1. Verificar se a URL sinaliza erro
        const errorParam = getUrlParam('error') || getUrlParam('error_code');
        if (errorParam === 'link_expired' || errorParam === 'otp_expired' || errorParam === 'access_denied') {
            setIsSessionValid(false);
            return;
        }

        // 2. Verificar se já existe uma sessão (Supabase pode ter pego automaticamente)
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession) {
            setIsSessionValid(true);
            return;
        }

        // 3. Tentar extração manual se os tokens estiverem na URL mas não na sessão
        const accessToken = getUrlParam('access_token');
        const refreshToken = getUrlParam('refresh_token');

        if (accessToken && refreshToken) {
            try {
                const { data, error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });
                
                if (!error && data.session) {
                    setIsSessionValid(true);
                    return;
                }
            } catch (e) {
                console.error("Erro ao definir sessão manual:", e);
            }
        }

        // 4. Aguardar um curto período para o Supabase processar (Race condition)
        const timeout = setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            setIsSessionValid(!!retrySession);
        }, 1000);

        return () => clearTimeout(timeout);
    };

    validateRecoverySession();
  }, [location, searchParams]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas digitadas não são iguais.' });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: password });
      if (error) throw error;

      // Sucesso!
      setIsUpdated(true);
      
      // Limpeza de URL
      window.history.replaceState(null, '', window.location.pathname);
      
      setTimeout(() => {
        navigate('/perfil');
      }, 3000);

    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao processar atualização.' });
    } finally {
      setLoading(false);
    }
  };

  if (isSessionValid === null) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-eco-200 border-t-eco-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 text-sm font-medium">Autenticando via link seguro...</p>
        </div>
      );
  }

  if (isUpdated) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] px-4 py-8 animate-scale-in">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-10 text-center border border-green-100 dark:border-green-900/30">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                    <ShieldCheck size={48} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Senha Atualizada!</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                    A sua conta está agora protegida com a nova senha. Redirecionando para o seu perfil...
                </p>
                <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full animate-[progress_3s_linear]"></div>
                </div>
            </div>
            <style>{`
                @keyframes progress {
                    from { width: 0%; }
                    to { width: 100%; }
                }
            `}</style>
        </div>
    );
  }

  if (isSessionValid === false) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] px-4 py-8 animate-scale-in">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-red-100 dark:border-red-900/30 overflow-hidden">
                <div className="bg-red-50 dark:bg-red-900/10 p-8 text-center">
                    <ShieldAlert size={48} className="mx-auto text-red-500 mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Link Expirado</h2>
                    <p className="text-sm text-gray-500 mt-2">Este link de acesso já não é válido.</p>
                </div>
                <div className="p-8 space-y-3">
                    <button onClick={() => navigate('/auth')} className="w-full bg-eco-600 hover:bg-eco-700 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2">
                        <RotateCcw size={18} /> Solicitar Novo Link
                    </button>
                    <button onClick={() => navigate('/')} className="w-full text-gray-500 py-2 font-medium text-sm">Voltar ao Início</button>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] px-4 py-8 animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="bg-eco-600 p-8 text-center text-white">
            <div className="inline-block p-3 bg-white/20 rounded-full mb-3 backdrop-blur-sm">
                <Lock size={28} />
            </div>
            <h2 className="text-xl font-bold">Nova Senha</h2>
            <p className="text-eco-100 text-xs mt-1">Defina a sua nova credencial de acesso.</p>
        </div>

        <div className="p-8">
            {message && (
                <div className={`p-4 rounded-xl flex items-start gap-3 text-sm mb-6 border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                    <AlertCircle size={18} className="shrink-0" />
                    <span>{message.text}</span>
                </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-5">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nova Senha</label>
                    <input 
                        type="password" 
                        required 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-eco-500 outline-none transition-all" 
                        placeholder="Mínimo 6 caracteres"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Confirmar Senha</label>
                    <input 
                        type="password" 
                        required 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-eco-500 outline-none transition-all" 
                        placeholder="Repita a nova senha"
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-eco-600 hover:bg-eco-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-4"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <><ShieldCheck size={20} /> Atualizar e Proteger</>
                    )}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default UpdatePassword;
