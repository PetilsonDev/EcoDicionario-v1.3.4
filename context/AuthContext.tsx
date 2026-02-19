
import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from 'react';
import { supabase } from '../services/supabase';
import { Session, User } from '@supabase/supabase-js';

export interface ProfileData {
  id: string;
  full_name: string | null;
  location: string | null;
  occupation: string | null;
  avatar_url: string | null;
  updated_at?: string;
}

export interface SyncAction {
  id: string;
  type: 'FAVORITE' | 'HISTORY';
  subtype: 'ADD' | 'REMOVE';
  payload: any;
  userId: string;
  timestamp: number;
  retryCount?: number;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: ProfileData | null;
  loading: boolean;
  isOnline: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  queueSyncAction: (type: 'FAVORITE' | 'HISTORY', subtype: 'ADD' | 'REMOVE', payload: any) => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  isOnline: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  queueSyncAction: () => {},
});

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const fetchProfile = async (userId: string, currentUser?: User) => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Caso o perfil não exista na tabela (Utilizador Antigo detetado)
      if (error && (error.code === 'PGRST116' || error.message.includes('No rows found'))) {
        const metadata = (currentUser || user)?.user_metadata || {};
        
        // Criar o perfil na tabela usando o metadata existente (Requer Política de INSERT no SQL)
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            full_name: metadata.full_name || null,
            location: metadata.location || null,
            occupation: metadata.occupation || null,
            avatar_url: metadata.avatar_url || null,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' })
          .select()
          .single();

        if (!createError && newProfile) {
          setProfile(newProfile);
        } else {
            console.warn("Aviso: Falha na sincronização automática do perfil na DB. Usando metadata temporário.", createError);
            setProfile({
                id: userId,
                full_name: metadata.full_name || null,
                location: metadata.location || null,
                occupation: metadata.occupation || null,
                avatar_url: metadata.avatar_url || null
            });
        }
        return;
      }
      
      if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.error("Erro ao processar perfil:", err);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id, user);
  };

  const mergeAnonymousData = async (userId: string) => {
    try {
        const anonFavs = JSON.parse(localStorage.getItem('eco_favorites') || '[]');
        const anonHist = JSON.parse(localStorage.getItem('eco_history_anon') || '[]');
        if (anonFavs.length === 0 && anonHist.length === 0) return;

        const userFavKey = `eco_favorites_${userId}`;
        const userHistKey = `eco_history_${userId}`;
        const userFavs = JSON.parse(localStorage.getItem(userFavKey) || '[]');
        const userHist = JSON.parse(localStorage.getItem(userHistKey) || '[]');

        const mergedFavs = Array.from(new Set([...userFavs, ...anonFavs]));
        const mergedHist = Array.from(new Set([...anonHist, ...userHist])).slice(0, 20);

        localStorage.setItem(userFavKey, JSON.stringify(mergedFavs));
        localStorage.setItem(userHistKey, JSON.stringify(mergedHist));

        if (navigator.onLine) {
            if (anonFavs.length > 0) {
                await supabase.from('favorites').upsert(
                    anonFavs.map((term: string) => ({ user_id: userId, term })),
                    { onConflict: 'user_id, term', ignoreDuplicates: true }
                );
            }
            if (anonHist.length > 0) {
                const historyInserts = anonHist.map((query: string) => ({ user_id: userId, query }));
                await supabase.from('search_history').insert(historyInserts);
            }
        }
        localStorage.removeItem('eco_favorites');
        localStorage.removeItem('eco_history_anon');
    } catch (error) {
        console.error("Erro ao migrar dados anónimos:", error);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
         fetchProfile(currentUser.id, currentUser);
         mergeAnonymousData(currentUser.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
          fetchProfile(currentUser.id, currentUser);
          if (event === 'SIGNED_IN') mergeAnonymousData(currentUser.id);
      } else {
          setProfile(null);
      }
      setLoading(false);
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline && user) processOfflineQueue();
  }, [isOnline, user]);

  const queueSyncAction = (type: 'FAVORITE' | 'HISTORY', subtype: 'ADD' | 'REMOVE', payload: any) => {
    if (!user) return;
    const newAction: SyncAction = {
      id: crypto.randomUUID(),
      type, subtype, payload, userId: user.id,
      timestamp: Date.now(), retryCount: 0
    };
    const currentQueue = JSON.parse(localStorage.getItem('eco_offline_queue') || '[]');
    localStorage.setItem('eco_offline_queue', JSON.stringify([...currentQueue, newAction]));
    if (isOnline) processOfflineQueue();
  };

  const processOfflineQueue = async () => {
    const queueJson = localStorage.getItem('eco_offline_queue');
    if (!queueJson) return;
    const queue: SyncAction[] = JSON.parse(queueJson);
    if (queue.length === 0) return;
    const myActions = queue.filter(action => action.userId === user?.id);
    const otherActions = queue.filter(action => action.userId !== user?.id);
    if (myActions.length === 0) return;

    const remainingActions: SyncAction[] = [];
    for (const action of myActions) {
      try {
        if ((action.retryCount || 0) > 3) continue;
        let error = null;
        if (action.type === 'FAVORITE') {
            if (action.subtype === 'ADD') {
                const { error: err } = await supabase.from('favorites').upsert({ user_id: user!.id, term: action.payload }, { onConflict: 'user_id, term', ignoreDuplicates: true });
                error = err;
            } else {
                const { error: err } = await supabase.from('favorites').delete().eq('user_id', user!.id).eq('term', action.payload);
                error = err;
            }
        } else if (action.type === 'HISTORY') {
            if (action.subtype === 'ADD') {
                const { error: err } = await supabase.from('search_history').insert({ user_id: user!.id, query: action.payload, created_at: new Date(action.timestamp).toISOString() });
                error = err;
            }
        }
        if (error) throw error;
      } catch (err) {
        remainingActions.push({ ...action, retryCount: (action.retryCount || 0) + 1 });
      }
    }
    localStorage.setItem('eco_offline_queue', JSON.stringify([...otherActions, ...remainingActions]));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    localStorage.removeItem('eco_favorites');
    localStorage.removeItem('eco_offline_queue');
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, isOnline, signOut, refreshProfile, queueSyncAction }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
