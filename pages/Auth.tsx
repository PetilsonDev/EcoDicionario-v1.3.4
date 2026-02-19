
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, ArrowRight, BookOpen, AlertCircle, ArrowLeft, KeyRound, WifiOff, MapPin, Briefcase, ChevronDown } from 'lucide-react';
import { APP_VERSION } from '../services/data';

const ANGOLA_PROVINCES = [
  "Bengo", "Benguela", "Bié", "Cabinda", "Cuando Cubango", "Cuanza Norte", "Cuanza Sul", 
  "Cunene", "Huambo", "Huíla", "Luanda", "Lunda Norte", "Lunda Sul", 
  "Malanje", "Moxico", "Namibe", "Uíge", "Zaire"
];

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); 
  
  const [isLogin, setIsLogin] = useState(true);
  const [isRecovery, setIsRecovery] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); 
  const [location, setLocation] = useState('');
  const [occupation, setOccupation] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
        navigate('/');
    }
  }, [user, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!navigator.onLine) {
        setError("Sem conexão com a internet. Verifique a sua rede.");
        return;
    }

    setLoading(true);

    try {
      if (isRecovery) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin, 
        });
        if (error) throw error;
        setSuccessMsg('Verifique o seu email! Enviamos um link de recuperação.');
      } 
      else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/'); 
      } else {
        if (!name.trim()) throw new Error("Por favor, insira o seu nome.");

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              location: location,
              occupation: occupation
            }
          }
        });
        if (error) throw error;
        setSuccessMsg('Conta criada com sucesso! Redirecionando...');
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (err: any) {
      let msg = err.message || 'Erro na autenticação.';
      if (msg.includes('Invalid login credentials')) msg = "Email ou senha incorretos.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (user) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] px-4 py-4 animate-fade-in">
      <div className="w-full max-w-md md:max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        
        {/* Banner */}
        <div className="bg-eco-600 p-6 md:p-10 text-center text-white md:w-5/12 flex flex-col justify-center items-center relative overflow-hidden shrink-0">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent scale-150"></div>
            <div className="relative z-10 flex flex-col items-center">
                <div className="inline-block p-3 bg-white/20 rounded-full mb-4 backdrop-blur-sm shadow-lg">
                    {isRecovery ? <KeyRound size={32} /> : <BookOpen size={32} />}
                </div>
                <h2 className="text-xl md:text-3xl font-bold mb-2">
                    {isRecovery ? 'Recuperação' : (isLogin ? 'Bem-vindo!' : 'Junte-se a nós!')}
                </h2>
                <p className="text-eco-100 text-xs md:text-sm leading-relaxed max-w-xs mx-auto">
                    {isRecovery 
                        ? 'Vamos ajudá-lo a recuperar o acesso.'
                        : (isLogin 
                            ? 'Aceda aos seus favoritos e expanda o seu conhecimento ambiental.' 
                            : 'Crie o seu perfil ecológico e guarde os seus termos favoritos.')}
                </p>
            </div>
        </div>

        {/* Formulário */}
        <div className="p-6 md:p-10 md:w-7/12 flex flex-col justify-center bg-white dark:bg-gray-800 overflow-y-auto max-h-[80vh] md:max-h-full">
            <div className="mb-4">
                <h3 className="text-lg md:text-2xl font-bold text-gray-800 dark:text-white mb-1">
                    {isRecovery ? 'Esqueceu a senha?' : (isLogin ? 'Entrar na Conta' : 'Criar Nova Conta')}
                </h3>
            </div>

            <form onSubmit={handleAuth} className="space-y-3">
                {error && (
                    <div className="p-2.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-xs rounded-lg flex items-center gap-2 border border-red-100 dark:border-red-900/50">
                        <AlertCircle size={14} className="shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
                {successMsg && (
                    <div className="p-2.5 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-300 text-xs rounded-lg flex items-center gap-2 border border-green-100 dark:border-green-900/50">
                        <BookOpen size={14} className="shrink-0" />
                        <span>{successMsg}</span>
                    </div>
                )}

                {!isLogin && !isRecovery && (
                  <>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Nome Completo</label>
                        <div className="relative group">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-eco-500" size={16} />
                            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-eco-500" placeholder="Seu Nome" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Província</label>
                          <div className="relative group">
                              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                              <select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-eco-500 appearance-none">
                                  <option value="">Selecione...</option>
                                  {ANGOLA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                          </div>
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Ocupação</label>
                          <div className="relative group">
                              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                              <input type="text" value={occupation} onChange={(e) => setOccupation(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-eco-500" placeholder="Ex: Estudante" />
                          </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Email</label>
                    <div className="relative group">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-eco-500" size={16} />
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-eco-500" placeholder="exemplo@email.com" />
                    </div>
                </div>

                {!isRecovery && (
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Senha</label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-eco-500" size={16} />
                            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-eco-500" placeholder="••••••••" />
                        </div>
                        {isLogin && (
                            <div className="flex justify-end mt-1">
                                <button type="button" onClick={() => setIsRecovery(true)} className="text-[10px] font-bold text-eco-600 hover:text-eco-700">Esqueceu a senha?</button>
                            </div>
                        )}
                    </div>
                )}

                <button type="submit" disabled={loading} className="w-full bg-eco-600 hover:bg-eco-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2">
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>{isRecovery ? 'Enviar Link' : (isLogin ? 'Entrar Agora' : 'Criar Conta')} <ArrowRight size={18} /></>}
                </button>

                {isRecovery && (
                    <button type="button" onClick={() => setIsRecovery(false)} className="w-full mt-2 text-xs font-bold text-gray-500 flex items-center justify-center gap-2"><ArrowLeft size={14} /> Voltar</button>
                )}
            </form>

            {!isRecovery && (
                <div className="mt-6 flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{isLogin ? 'Novo por aqui?' : 'Já tem conta?'}</span>
                        <button onClick={() => setIsLogin(!isLogin)} className="font-bold text-eco-600 underline">
                            {isLogin ? 'Registar' : 'Entrar'}
                        </button>
                    </div>
                    <button onClick={() => navigate('/')} className="text-xs text-gray-400 hover:text-eco-600 transition-colors">Continuar como anónimo</button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
