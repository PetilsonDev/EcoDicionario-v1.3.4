
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Star, Copy, Check, Share2, ArrowLeft, Heart, Trash2 } from 'lucide-react';
import { DictionaryTerm } from '../types';
import { ecoTerms as initialTerms } from '../services/data';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';

const Favorites: React.FC = () => {
  const navigate = useNavigate();
  const { user, isOnline, queueSyncAction } = useAuth();
  
  const [favoriteTerms, setFavoriteTerms] = useState<DictionaryTerm[]>([]);
  const [search, setSearch] = useState('');
  const [copiedTerm, setCopiedTerm] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados
  useEffect(() => {
    loadFavorites();
  }, [user]);

  const loadFavorites = () => {
    setIsLoading(true);
    try {
      // 1. Obter lista de IDs (títulos) dos favoritos
      const favKey = user ? `eco_favorites_${user.id}` : 'eco_favorites';
      const favList: string[] = JSON.parse(localStorage.getItem(favKey) || '[]');

      if (favList.length === 0) {
        setFavoriteTerms([]);
        setIsLoading(false);
        return;
      }

      // 2. Obter base de dados completa de termos
      const localDb = localStorage.getItem('eco_database');
      const allTerms: DictionaryTerm[] = localDb ? JSON.parse(localDb) : initialTerms;

      // 3. Filtrar os objetos completos
      const filtered = allTerms.filter(term => favList.includes(term.t));
      
      // Ordenar alfabeticamente
      setFavoriteTerms(filtered.sort((a, b) => a.t.localeCompare(b.t)));
    } catch (e) {
      console.error("Erro ao carregar favoritos", e);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFavorite = async (term: string) => {
    // 1. Atualizar UI imediatamente (Optimistic UI)
    const updatedList = favoriteTerms.filter(item => item.t !== term);
    setFavoriteTerms(updatedList);

    // 2. Atualizar LocalStorage
    const favKey = user ? `eco_favorites_${user.id}` : 'eco_favorites';
    const currentFavs: string[] = JSON.parse(localStorage.getItem(favKey) || '[]');
    const newFavs = currentFavs.filter(t => t !== term);
    localStorage.setItem(favKey, JSON.stringify(newFavs));

    // 3. Sincronizar com Supabase se logado
    if (user) {
      try {
        if (isOnline) {
          await supabase.from('favorites').delete().eq('user_id', user.id).eq('term', term);
        } else {
          throw new Error("Offline");
        }
      } catch (e) {
        queueSyncAction('FAVORITE', 'REMOVE', term);
      }
    }
  };

  const handleCopy = async (term: string, definition: string) => {
    const textToCopy = `${term}\n${definition}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedTerm(term);
      setTimeout(() => setCopiedTerm(null), 2000);
    } catch (err) {
      console.error("Falha ao copiar", err);
    }
  };

  const handleShare = async (term: string, definition: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'EcoDicionário AO',
          text: `🌿 *${term}*\n\n${definition}\n\nSaiba mais no EcoDicionário:`
        });
      } catch (e) {
        handleCopy(term, definition);
      }
    } else {
      handleCopy(term, definition);
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <span key={i} className="bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-200 rounded px-0.5">{part}</span> 
        : part
    );
  };

  const filteredList = favoriteTerms.filter(term => 
    term.t.toLowerCase().includes(search.toLowerCase()) || 
    term.d.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto py-6 animate-fade-in px-2 md:px-0 pb-20">
      
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
           <button 
             onClick={() => navigate('/')} 
             className="flex items-center gap-1 text-sm text-gray-500 hover:text-eco-600 mb-2 transition-colors"
           >
             <ArrowLeft size={16} /> Voltar ao Dicionário
           </button>
           <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-white flex items-center gap-2">
             <Star className="text-yellow-500 fill-yellow-500" size={28} />
             Meus Favoritos
           </h1>
           <p className="text-sm text-gray-500 dark:text-gray-400">
             {favoriteTerms.length} {favoriteTerms.length === 1 ? 'termo guardado' : 'termos guardados'}
           </p>
        </div>
      </div>

      {/* Search Bar */}
      {favoriteTerms.length > 0 && (
        <div className="relative mb-6">
            <input 
              type="text" 
              placeholder="Pesquisar nos favoritos..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-10 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-base shadow-sm focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10 outline-none transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 w-full">
        {isLoading ? (
           <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-yellow-200 border-t-yellow-500 rounded-full animate-spin"></div></div>
        ) : filteredList.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
             {filteredList.map((term, index) => {
                 const isCopied = copiedTerm === term.t;
                 return (
                    <div key={index} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 border-l-4 border-l-yellow-400 hover:shadow-md transition-all group animate-slide-up">
                        <div className="flex justify-between items-start gap-4 mb-2">
                            <div className="flex flex-col gap-1 flex-1">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                                    {term.c || 'Geral'}
                                </span>
                                <h3 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                                    {highlightText(term.t, search)}
                                </h3>
                            </div>
                            
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    onClick={() => handleShare(term.t, term.d)}
                                    className="p-2 rounded-full text-gray-300 dark:text-gray-600 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                                    title="Partilhar"
                                >
                                    <Share2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleCopy(term.t, term.d)}
                                    className={`p-2 rounded-full transition-all ${isCopied ? 'text-green-500 bg-green-50' : 'text-gray-300 dark:text-gray-600 hover:text-green-500 hover:bg-green-50 dark:hover:bg-gray-700'}`}
                                    title="Copiar"
                                >
                                    {isCopied ? <Check size={18} /> : <Copy size={18} />}
                                </button>
                                <button
                                    onClick={() => removeFavorite(term.t)}
                                    className="p-2 rounded-full text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-all"
                                    title="Remover dos favoritos"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm md:text-base text-justify">
                            {term.d}
                        </p>
                    </div>
                 );
             })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
            {search ? (
                 <>
                    <Search size={48} className="mb-4 opacity-20" />
                    <p className="text-lg font-medium">Nenhum favorito encontrado</p>
                    <p className="text-sm">Não encontramos "{search}" na sua lista.</p>
                    <button 
                        onClick={() => setSearch('')}
                        className="mt-4 text-eco-600 font-bold hover:underline"
                    >
                        Limpar pesquisa
                    </button>
                 </>
            ) : (
                <>
                    <Heart size={48} className="mb-4 opacity-20 text-red-500 fill-current" />
                    <p className="text-lg font-medium">Sua lista está vazia</p>
                    <p className="text-sm max-w-xs mx-auto mt-1 mb-6">
                        Explore o dicionário e clique na estrela <Star size={12} className="inline fill-yellow-500 text-yellow-500" /> para guardar os termos importantes aqui.
                    </p>
                    <button 
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-eco-600 text-white rounded-xl font-bold shadow-lg hover:bg-eco-700 transition-all hover:scale-105"
                    >
                        Explorar Dicionário
                    </button>
                </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
