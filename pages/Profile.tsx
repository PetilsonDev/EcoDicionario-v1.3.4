
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, User, Heart, History, Shield, Lock, Save, Edit2, 
  Check, AlertCircle, Camera, MapPin, Briefcase, ChevronDown
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { APP_VERSION } from '../services/data';

const ANGOLA_PROVINCES = [
  "Bengo", "Benguela", "Bié", "Cabinda", "Cuando Cubango", "Cuanza Norte", "Cuanza Sul", 
  "Cunene", "Huambo", "Huíla", "Luanda", "Lunda Norte", "Lunda Sul", 
  "Malanje", "Moxico", "Namibe", "Uíge", "Zaire"
];

const Profile: React.FC = () => {
  const { user, profile, signOut, isOnline, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [stats, setStats] = useState({ favorites: 0, history: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [occupation, setOccupation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (!user) {
        navigate('/auth');
        return;
    }

    // Carregar do perfil do contexto (que lê da tabela profiles)
    if (profile) {
        setFullName(profile.full_name || '');
        setLocation(profile.location || '');
        setOccupation(profile.occupation || '');
        setAvatarUrl(profile.avatar_url || null);
    }

    const loadStats = async () => {
        try {
            const favKey = `eco_favorites_${user.id}`;
            const localFavs = JSON.parse(localStorage.getItem(favKey) || '[]');
            const histKey = `eco_history_${user.id}`;
            const localHist = JSON.parse(localStorage.getItem(histKey) || '[]');
            setStats({ favorites: localFavs.length, history: localHist.length });
        } catch (e) {
            console.error("Erro ao ler stats locais", e);
        }

        if (isOnline) {
            try {
                const { count: favCount } = await supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
                const { count: histCount } = await supabase.from('search_history').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
                setStats(prev => ({ 
                    favorites: favCount !== null ? favCount : prev.favorites, 
                    history: histCount !== null ? histCount : prev.history 
                }));
            } catch (err) {
                console.error("Erro ao sincronizar stats", err);
            }
        }
    };
    loadStats();
  }, [user, profile, navigate, isOnline]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;

    try {
      setUploadingImage(true);
      setMessage(null);
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      // Atualizar Tabela Profiles e Auth Metadata
      await supabase.from('profiles').upsert({ id: user!.id, avatar_url: publicUrl });
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });

      setAvatarUrl(publicUrl);
      await refreshProfile();
      setMessage({ type: 'success', text: 'Foto de perfil atualizada!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || "Erro no upload." });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingUpdate(true);
    setMessage(null);

    try {
        if (!isOnline) throw new Error("É necessário estar online para salvar as alterações.");

        // 1. Atualizar Tabela Profiles (Principal)
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: user!.id,
                full_name: fullName,
                location: location,
                occupation: occupation,
                updated_at: new Date().toISOString()
            });

        if (profileError) throw profileError;

        // 2. Sincronizar com Auth Metadata (Secundário/Redundância)
        const authUpdates: any = {
            data: { 
                full_name: fullName,
                location: location,
                occupation: occupation
            }
        };

        if (newPassword) {
            if (newPassword.length < 6) throw new Error("A senha deve ter pelo menos 6 caracteres.");
            if (newPassword !== confirmPassword) throw new Error("As senhas não coincidem.");
            authUpdates.password = newPassword;
        }

        const { error: authError } = await supabase.auth.updateUser(authUpdates);
        if (authError) throw authError;

        await refreshProfile();
        setMessage({ type: 'success', text: 'Perfil guardado com sucesso!' });
        setNewPassword('');
        setConfirmPassword('');
        setIsEditing(false);

    } catch (err: any) {
        setMessage({ type: 'error', text: err.message || "Erro ao atualizar perfil." });
    } finally {
        setLoadingUpdate(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto py-4 px-4 animate-fade-in pb-20">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-b from-eco-600 to-eco-700 pt-6 pb-10 px-8 flex flex-col items-center relative">
                <div className="relative group">
                    <div className="w-24 h-24 rounded-full border-4 border-white/20 shadow-2xl overflow-hidden bg-white dark:bg-gray-700 flex items-center justify-center relative">
                        {uploadingImage ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-eco-600"></div> : avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <User size={40} className="text-gray-300 dark:text-gray-500" />}
                        {isEditing && <div onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white" size={24} /></div>}
                    </div>
                    {isEditing && <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-white text-eco-600 p-1.5 rounded-full shadow-lg z-10"><Camera size={14} /></button>}
                    <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
                </div>
                <h2 className="text-xl font-bold text-white text-center mt-3">{fullName || "Utilizador"}</h2>
                <div className="flex items-center gap-2 mt-0.5 text-eco-100 text-xs">
                    {occupation && <span>{occupation}</span>}
                    {occupation && location && <span>•</span>}
                    {location && <span className="flex items-center gap-1"><MapPin size={10} /> {location}</span>}
                </div>
            </div>

            <div className="px-5 md:px-8 py-5 -mt-5 relative z-10 bg-white dark:bg-gray-800 rounded-t-3xl space-y-5">
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-gray-700/50 p-3 rounded-2xl flex flex-col items-center border border-gray-100 dark:border-gray-600 shadow-sm">
                        <div className="p-1.5 bg-red-50 dark:bg-red-900/20 rounded-full mb-1"><Heart className="text-red-500" size={18} /></div>
                        <span className="text-xl font-extrabold text-gray-800 dark:text-white">{stats.favorites}</span>
                        <span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Favoritos</span>
                    </div>
                    <div className="bg-white dark:bg-gray-700/50 p-3 rounded-2xl flex flex-col items-center border border-gray-100 dark:border-gray-600 shadow-sm">
                        <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-1"><History className="text-blue-500" size={18} /></div>
                        <span className="text-xl font-extrabold text-gray-800 dark:text-white">{stats.history}</span>
                        <span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Buscas</span>
                    </div>
                </div>

                <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-1.5">
                    <h3 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2"><User size={18} className="text-eco-500" /> Detalhes</h3>
                    <button onClick={() => { setIsEditing(!isEditing); setMessage(null); }} className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all ${isEditing ? 'bg-red-50 text-red-600' : 'bg-eco-50 text-eco-600'}`}>{isEditing ? 'Cancelar' : <><Edit2 size={12} className="inline mr-1" /> Editar</>}</button>
                </div>

                {message && (
                    <div className={`p-3 rounded-xl flex items-start gap-2 text-xs animate-scale-in border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                        {message.type === 'success' ? <Check size={12} className="shrink-0" /> : <AlertCircle size={12} className="shrink-0" />}
                        <span className="leading-tight">{message.text}</span>
                    </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><User size={10} /> Nome Completo</label>
                            <input type="text" disabled={!isEditing} value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-sm font-medium disabled:opacity-60 focus:ring-2 focus:ring-eco-500 outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><MapPin size={10} /> Província</label>
                            <div className="relative">
                                <select disabled={!isEditing} value={location} onChange={(e) => setLocation(e.target.value)} className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-sm appearance-none disabled:opacity-60 outline-none focus:ring-2 focus:ring-eco-500">
                                    <option value="" disabled>Selecione...</option>
                                    {ANGOLA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><Briefcase size={10} /> Ocupação</label>
                        <input type="text" disabled={!isEditing} value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="Ex: Engenheiro" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-sm disabled:opacity-60 outline-none focus:ring-2 focus:ring-eco-500" />
                    </div>

                    {isEditing && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-2xl space-y-3 border border-yellow-100 animate-fade-in">
                            <h4 className="text-xs font-bold text-yellow-800 flex items-center gap-1.5"><Lock size={12} /> Alterar Senha (Opcional)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nova" className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-eco-500" />
                                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmar" className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-eco-500" />
                            </div>
                        </div>
                    )}

                    {isEditing && (
                        <button type="submit" disabled={loadingUpdate} className="w-full bg-eco-600 hover:bg-eco-700 text-white font-bold py-2.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                            {loadingUpdate ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={16} /> Salvar Alterações</>}
                        </button>
                    )}
                </form>

                <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-red-600 py-2.5 rounded-xl transition-colors font-bold text-xs">
                        <LogOut size={16} /> Terminar Sessão
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Profile;
