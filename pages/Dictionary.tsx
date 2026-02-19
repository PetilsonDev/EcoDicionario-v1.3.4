
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ecoTerms as initialTerms, validateAndSanitizeTerms, APP_VERSION, mergeTerms } from '../services/data'; 
import { supabase } from '../services/supabase';
import { DictionaryTerm } from '../types';
import { Search, X, Star, Copy, Check, ArrowUp, Share2, RefreshCw, Tag, WifiOff, History, Clock, Mic, MicOff } from 'lucide-react';
import * as ReactWindow from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useAuth } from '../context/AuthContext';

// Safe component wrappers
const List = (ReactWindow as any).VariableSizeList;
const AutoSizerAny = AutoSizer as any;

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');

// Improved Height Calculation Helper
const getItemSize = (index: number, width: number, terms: DictionaryTerm[]) => {
  const term = terms[index];
  if (!term) return 150;

  const isMobile = width < 768;
  
  // Layout Constants (based on Tailwind classes)
  const horizontalPadding = isMobile ? 40 : 52;
  const safeWidth = width - horizontalPadding;

  // Typography Metrics (Poppins approx)
  const titleSize = isMobile ? 18 : 20;
  const bodySize = isMobile ? 14 : 16;
  
  const titleCharWidth = titleSize * 0.55;
  const bodyCharWidth = bodySize * 0.50; 

  // 1. Calculate Title Height
  const titleAvailableWidth = safeWidth - 100; 
  const titleLines = Math.ceil((term.t.length * titleCharWidth) / titleAvailableWidth);
  const titleHeight = Math.max(1, titleLines) * (titleSize * 1.4); 

  // 2. Calculate Body Height
  const bodyLines = Math.ceil((term.d.length * bodyCharWidth) / safeWidth);
  const bodyHeight = bodyLines * (bodySize * 1.625); 

  // 3. Static Vertical Elements
  const staticHeight = isMobile ? 85 : 95;

  return Math.ceil(titleHeight + bodyHeight + staticHeight);
};

// Fuzzy Score Calculation Helper
const calculateRelevance = (termTitle: string, searchTerm: string): number => {
  const normalizedTerm = termTitle.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const normalizedSearch = searchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (!normalizedSearch) return 0;

  // 1. Exact Match (Highest Priority)
  if (normalizedTerm === normalizedSearch) return 100;
  
  // 2. Starts With
  if (normalizedTerm.startsWith(normalizedSearch)) return 80;
  
  // 3. Contains (Substring)
  if (normalizedTerm.includes(normalizedSearch)) return 60;

  // 4. Fuzzy Sequence (All chars in order)
  let searchIdx = 0;
  for (let i = 0; i < normalizedTerm.length; i++) {
    if (normalizedTerm[i] === normalizedSearch[searchIdx]) {
      searchIdx++;
      if (searchIdx === normalizedSearch.length) return 40; // Matched all chars in order
    }
  }

  return 0; // No match
};

// Skeleton Card Component
const SkeletonCard = () => (
  <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 border-l-4 border-l-gray-200 dark:border-l-gray-600 h-full flex flex-col animate-pulse">
    <div className="flex justify-between items-start gap-4 mb-3">
      <div className="flex flex-col gap-2 flex-1">
        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div className="h-6 w-3/4 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>
      <div className="flex gap-1">
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      </div>
    </div>
    <div className="space-y-2 mt-1">
      <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-4 w-4/6 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  </div>
);

// Row component
const Row = ({ index, style, data }: any) => {
  const { terms, favorites, copiedTerm, search, toggleFavorite, handleCopy, handleShare, highlightText } = data;
  const term = terms[index];
  
  if (!term) return null;

  const isFav = favorites.includes(term.t);
  const isCopied = copiedTerm === term.t;

  const getCategoryColor = (cat: string) => {
    switch(cat) {
        case 'Angola': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
        case 'HST': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
        case 'Gestão': return 'bg-blue-100 text-blue-700 dark:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
        case 'Leis e Normas': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
        case 'Ecologia': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
        case 'Mudanças climáticas': return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300';
        default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div style={style} className="px-1 md:px-2 pb-3 pr-8 md:pr-2">
      <div 
        className="bg-white dark:bg-gray-800 p-4 md:p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 border-l-4 border-l-eco-500 hover:shadow-md transition-all group relative h-full flex flex-col"
      >
        <div className="flex justify-between items-start gap-4 mb-2">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
                 <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full w-fit ${getCategoryColor(term.c)}`}>
                    <Tag size={10} />
                    {term.c || 'Geral'}
                 </span>
                <h3 className="text-lg md:text-xl font-bold text-eco-800 dark:text-eco-400 group-hover:text-eco-600 dark:group-hover:text-eco-300 transition-colors break-words leading-tight">
                    {highlightText(term.t, search)}
                </h3>
            </div>
          
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleShare(term.t, term.d);
              }}
              className="p-1.5 rounded-full text-gray-300 dark:text-gray-600 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300"
            >
              <Share2 size={20} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopy(term.t, term.d);
              }}
              className={`p-1.5 rounded-full transition-all duration-300 ${
                isCopied
                  ? 'text-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'text-gray-300 dark:text-gray-600 hover:text-eco-500 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {isCopied ? <Check size={20} className="animate-scale-in" /> : <Copy size={20} />}
            </button>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(term.t);
              }}
              className={`p-1.5 rounded-full transition-all duration-300 ${
                isFav 
                  ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100' 
                  : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Star 
                size={20} 
                fill={isFav ? "currentColor" : "none"} 
                className={`transition-transform duration-300 ${isFav ? 'scale-110' : 'scale-100'}`}
              />
            </button>
          </div>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm md:text-base text-justify mt-1 selectable-text">
          {term.d}
        </p>
      </div>
    </div>
  );
};

const Dictionary: React.FC = () => {
  const { user, isOnline, queueSyncAction } = useAuth();
  const [search, setSearch] = useState('');
  const [filterLetter, setFilterLetter] = useState('all');
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [isListening, setIsListening] = useState(false);
  
  const [currentTerms, setCurrentTerms] = useState<DictionaryTerm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState<string[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [favorites, setFavorites] = useState<string[]>([]);

  const [copiedTerm, setCopiedTerm] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Scrubber state
  const [scrubPreview, setScrubPreview] = useState<string | null>(null);
  const [isMouseScrubbing, setIsMouseScrubbing] = useState(false);

  const listRef = useRef<any>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const scrubberRef = useRef<HTMLDivElement>(null);

  const alphabet = ALPHABET;

  // Helpers para chaves de armazenamento local
  const getFavoritesKey = () => user ? `eco_favorites_${user.id}` : 'eco_favorites';
  const getHistoryKey = () => user ? `eco_history_${user.id}` : 'eco_history_anon';

  const categories = useMemo(() => {
      const source = currentTerms.length > 0 ? currentTerms : initialTerms;
      const cats = new Set(source.map(t => t.c || 'Geral'));
      return ['Todas', ...Array.from(cats).sort()];
  }, [currentTerms]);

  useEffect(() => {
    return () => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    };
    if (showHistory) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showHistory]);

  // Carregar dados de FAVORITOS ao iniciar ou mudar utilizador
  useEffect(() => {
    const loadLocalFavorites = () => {
        try {
            const key = getFavoritesKey();
            const saved = localStorage.getItem(key);
            setFavorites(saved ? JSON.parse(saved) : []);
        } catch {
            setFavorites([]);
        }
    };
    
    loadLocalFavorites();
  }, [user]); 

  // Carregar dados principais (Termos)
  useEffect(() => {
    const initializeData = async () => {
        setIsLoading(true);
        try {
            const storedVersion = localStorage.getItem('eco_version');
            const savedTerms = localStorage.getItem('eco_database');

            if (storedVersion === APP_VERSION && savedTerms) {
                const parsed = JSON.parse(savedTerms);
                setCurrentTerms(Array.isArray(parsed) && parsed.length > 0 ? parsed : initialTerms);
            } else {
                setCurrentTerms(initialTerms);
                localStorage.setItem('eco_database', JSON.stringify(initialTerms));
                localStorage.setItem('eco_version', APP_VERSION);
            }
            setIsLoading(false);
        } catch (e) {
            console.error("Error loading local data", e);
            setCurrentTerms(initialTerms);
            setIsLoading(false);
        }

        if (isOnline) {
            setIsSyncing(true);
            const lastSyncISO = localStorage.getItem('eco_last_sync_iso');
            let query = supabase.from('terms').select('t, d, c, updated_at, deleted_at');
            if (lastSyncISO) {
                query = query.gt('updated_at', lastSyncISO);
            }

            const { data, error } = await query;
            if (!error && data && data.length > 0) {
                 const formattedData = data.map((item: any) => ({ 
                     t: item.t, d: item.d, c: item.c, deleted_at: item.deleted_at 
                 }));
                 const validatedNewTerms = validateAndSanitizeTerms(formattedData);
                 const now = new Date();
                 localStorage.setItem('eco_last_sync', now.toLocaleDateString('pt-PT', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                 }));
                 localStorage.setItem('eco_last_sync_iso', now.toISOString());

                 if (validatedNewTerms.length > 0) {
                     setCurrentTerms(prevTerms => {
                        const mergedTerms = mergeTerms(prevTerms, validatedNewTerms);
                        if (mergedTerms.length !== prevTerms.length || JSON.stringify(mergedTerms) !== JSON.stringify(prevTerms)) {
                             localStorage.setItem('eco_database', JSON.stringify(mergedTerms));
                             return mergedTerms;
                        }
                        return prevTerms;
                     });
                 }
            }
            setIsSyncing(false);
        }
    };
    initializeData();
  }, [isOnline]);

  useEffect(() => {
      const syncFavorites = async () => {
          if (!user) return;
          if (isOnline) {
              try {
                  const { data: cloudData } = await supabase.from('favorites').select('term').eq('user_id', user.id);
                  const cloudFavs = cloudData ? cloudData.map(f => f.term) : [];
                  const localKey = getFavoritesKey();
                  const localStored = JSON.parse(localStorage.getItem(localKey) || '[]');
                  const toUpload = localStored.filter((f: string) => !cloudFavs.includes(f));

                  if (toUpload.length > 0) {
                      await supabase.from('favorites').upsert(
                          toUpload.map((term: string) => ({ user_id: user.id, term })),
                          { onConflict: 'user_id, term', ignoreDuplicates: true }
                      );
                  }
                  const finalSet = new Set([...localStored, ...cloudFavs]);
                  const finalArray = Array.from(finalSet);
                  setFavorites(finalArray);
                  localStorage.setItem(localKey, JSON.stringify(finalArray));
              } catch (error) {
                  console.error("Erro ao sincronizar favoritos:", error);
              }
          }
      };
      const timer = setTimeout(() => syncFavorites(), 500);
      return () => clearTimeout(timer);
  }, [user, isOnline]); 

  useEffect(() => {
     localStorage.setItem(getFavoritesKey(), JSON.stringify(favorites));
  }, [favorites, user]);

  const toggleHistory = async () => {
    const localHistory = JSON.parse(localStorage.getItem(getHistoryKey()) || '[]');
    setHistoryItems(localHistory);

    if (!showHistory && user && isOnline) {
        setIsLoadingHistory(true);
        try {
            const { data } = await supabase.from('search_history')
                .select('query').eq('user_id', user.id)
                .order('created_at', { ascending: false }).limit(20);
            if (data) {
                const cloudItems = (data as any[]).map((d: any) => String(d.query));
                const unique = Array.from(new Set([...cloudItems, ...localHistory]));
                const limited = unique.slice(0, 10);
                setHistoryItems(limited);
                localStorage.setItem(getHistoryKey(), JSON.stringify(limited));
            }
        } catch (error) {
            console.error("Erro ao buscar histórico", error);
        } finally {
            setIsLoadingHistory(false);
        }
    }
    setShowHistory(!showHistory);
  };

  const handleHistoryClick = (query: string) => {
    setSearch(query);
    setShowHistory(false);
  };

  const toggleFavorite = async (term: string) => {
    const isAdding = !favorites.includes(term);
    const newFavorites = isAdding ? [...favorites, term] : favorites.filter(t => t !== term);
    setFavorites(newFavorites);
    if (user) {
        try {
            if (isOnline) {
                if (isAdding) {
                    await supabase.from('favorites').upsert({ user_id: user.id, term }, { onConflict: 'user_id, term', ignoreDuplicates: true });
                } else {
                    await supabase.from('favorites').delete().eq('user_id', user.id).eq('term', term);
                }
            } else { throw new Error("Offline"); }
        } catch (e) { queueSyncAction('FAVORITE', isAdding ? 'ADD' : 'REMOVE', term); }
    }
  };

  const handleSearchChange = (val: string) => {
      setSearch(val);
      if (showHistory) setShowHistory(false);
      if (val.length > 2) {
          if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
          searchTimeoutRef.current = setTimeout(async () => {
              const histKey = getHistoryKey();
              const currentHist = JSON.parse(localStorage.getItem(histKey) || '[]');
              const newHist = [val, ...currentHist.filter((h: string) => h !== val)].slice(0, 10);
              localStorage.setItem(histKey, JSON.stringify(newHist));
              if (user) {
                  try {
                      if (isOnline) { await supabase.from('search_history').insert({ user_id: user.id, query: val }); } 
                      else { queueSyncAction('HISTORY', 'ADD', val); }
                  } catch (e) { console.error("Erro ao salvar histórico", e); }
              }
          }, 2000); 
      }
  };

  const handleVoiceSearch = () => {
    if (!isOnline) { alert("A pesquisa por voz requer uma conexão com a internet."); return; }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("O seu navegador não suporta pesquisa por voz. Tente usar o Google Chrome ou Edge."); return; }
    if (isListening) return; 
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-PT';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) handleSearchChange(transcript);
      };
      recognition.start();
    } catch (e) { setIsListening(false); }
  };

  const handleCopy = async (term: string, definition: string) => {
    const textToCopy = `${term}\n${definition}`;
    let success = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
        success = true;
      } else { throw new Error("Clipboard API unavailable"); }
    } catch (err) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.style.position = "fixed"; textArea.style.opacity = "0";
        document.body.appendChild(textArea); textArea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch (e) { console.error("Fallback copy failed", e); }
    }
    if (success) {
      setCopiedTerm(term);
      setTimeout(() => setCopiedTerm(null), 2000);
    }
  };

  const handleShare = async (term: string, definition: string) => {
    if (navigator.share) {
      const shareData: any = {
        title: 'EcoDicionário AO',
        text: `🌿 *${term}*\n\n${definition}\n\nSaiba mais no EcoDicionário:`
      };
      if (window.location.protocol.startsWith('http')) shareData.url = window.location.href;
      try { await navigator.share(shareData); } catch (e) { handleCopy(term, definition); }
    } else { handleCopy(term, definition); }
  };

  const scrollToTop = () => listRef.current?.scrollTo(0);
  const onScroll = ({ scrollOffset }: { scrollOffset: number }) => setShowScrollTop(scrollOffset > 300);

  const filteredTerms = useMemo(() => {
    const baseFiltered = currentTerms.filter(term => {
      if (filterCategory !== 'Todas' && (term.c || 'Geral') !== filterCategory) return false;
      if (filterLetter !== 'all') {
        const firstChar = term.t.charAt(0).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return firstChar === filterLetter;
      }
      return true;
    });

    if (search.trim()) {
       return baseFiltered
          .map(term => ({ term, score: calculateRelevance(term.t, search) }))
          .filter(item => item.score > 0)
          .sort((a, b) => a.term.t.localeCompare(b.term.t, 'pt-PT')) // Ordenação Alfabética estrita como prioridade
          .map(item => item.term);
    }
    return baseFiltered.sort((a, b) => a.t.localeCompare(b.t, 'pt-PT'));
  }, [search, filterLetter, filterCategory, currentTerms]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo(0);
      try { listRef.current.resetAfterIndex(0); } catch(e){}
    }
  }, [search, filterLetter, filterCategory]);

  // Lógica de "Scrubbing" Alfabético (Toque e Rato)
  const handleScrub = useCallback((clientY: number) => {
      if (!scrubberRef.current) return;
      const rect = scrubberRef.current.getBoundingClientRect();
      const y = clientY - rect.top;
      const percent = Math.min(Math.max(y / rect.height, 0), 1);
      const index = Math.min(Math.floor(percent * alphabet.length), alphabet.length - 1);
      const letter = alphabet[index];
      
      if (letter !== filterLetter) {
          setFilterLetter(letter);
          setScrubPreview(letter);
          // Haptic feedback if available
          if (window.navigator && window.navigator.vibrate) {
              window.navigator.vibrate(10);
          }
      }
  }, [alphabet, filterLetter]);

  // Eventos de Toque
  const onTouchScrub = (e: React.TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      handleScrub(e.touches[0].clientY);
  };

  const onTouchEnd = () => {
      setScrubPreview(null);
  };

  // Eventos de Rato (Para PC em modo mobile)
  const onMouseDownScrub = (e: React.MouseEvent) => {
      e.preventDefault();
      setIsMouseScrubbing(true);
      handleScrub(e.clientY);
  };

  const onMouseMoveScrub = (e: React.MouseEvent) => {
      if (isMouseScrubbing) {
          e.preventDefault();
          handleScrub(e.clientY);
      }
  };

  const onMouseUpScrub = () => {
      setIsMouseScrubbing(false);
      setScrubPreview(null);
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    if (text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(new RegExp(query.normalize("NFD").replace(/[\u0300-\u036f]/g, ""), 'i'))) {
        const parts = text.split(regex);
        if (parts.length === 1 && text.toLowerCase().includes(query.toLowerCase())) return text; 
        return parts.map((part, i) => regex.test(part) ? <span key={i} className="bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-200 rounded px-0.5">{part}</span> : part);
    }
    return text;
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-100px)] flex flex-col animate-fade-in relative">
      
      {/* Alphabet Scrubber - Mobile Only (Ajustado z-index para z-40) */}
      <div 
        ref={scrubberRef}
        // Fix: Removed duplicate onTouchStart attribute which caused a syntax error
        onTouchStart={onTouchScrub}
        onTouchMove={onTouchScrub}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDownScrub}
        onMouseMove={onMouseMoveScrub}
        onMouseUp={onMouseUpScrub}
        onMouseLeave={onMouseUpScrub}
        className="md:hidden fixed right-0 top-1/2 -translate-y-1/2 z-40 w-8 h-[70vh] flex flex-col justify-around items-center py-4 select-none touch-none cursor-pointer overflow-hidden"
      >
        <div className="flex flex-col h-full w-full justify-around items-center bg-white/10 dark:bg-black/10 backdrop-blur-sm rounded-l-2xl border-y border-l border-gray-200/50 dark:border-gray-700/50 py-2">
            <button 
                onClick={() => setFilterLetter('all')}
                className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full transition-colors ${filterLetter === 'all' ? 'bg-eco-600 text-white' : 'text-gray-400'}`}
            >
                #
            </button>
            {alphabet.map(l => (
                <span 
                    key={l} 
                    className={`text-[11px] font-extrabold w-5 h-5 flex items-center justify-center rounded-full transition-colors pointer-events-none ${filterLetter === l ? 'bg-eco-600 text-white scale-125' : 'text-gray-400'}`}
                >
                    {l}
                </span>
            ))}
        </div>
      </div>

      {/* Scrub Preview Overlay (Ajustado z-index para z-[100]) */}
      {scrubPreview && (
          <div className="md:hidden fixed inset-0 z-[100] flex items-center justify-center pointer-events-none transition-opacity animate-scale-in">
              <div className="w-24 h-24 bg-eco-600/90 backdrop-blur-md rounded-3xl shadow-2xl flex items-center justify-center border-4 border-white/20">
                  <span className="text-white text-5xl font-black">{scrubPreview}</span>
              </div>
          </div>
      )}

      {/* Fixed Header Section */}
      <div className="shrink-0 bg-gray-50 dark:bg-gray-900 z-10 transition-colors duration-300 pb-1 pt-1">
        
        {/* Search & History */}
        <div className="relative mb-2 max-w-2xl mx-auto px-1 flex gap-2" ref={historyRef}>
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="Pesquisar termo..." 
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              disabled={isLoading}
              className="w-full pl-10 pr-16 py-3 rounded-xl border-2 border-eco-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-base shadow-sm focus:border-eco-500 focus:ring-4 focus:ring-eco-500/10 outline-none transition-all disabled:opacity-50"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {search && (
                <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600 p-1">
                    <X size={16} />
                </button>
                )}
                <button
                    onClick={handleVoiceSearch}
                    disabled={!isOnline}
                    className={`p-1.5 rounded-full transition-all ${!isOnline ? 'text-gray-300' : isListening ? 'bg-red-100 text-red-500 animate-pulse' : 'text-gray-400 hover:text-eco-600'}`}
                >
                    {!isOnline ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
            </div>

            {isSyncing && isOnline && (
               <div className="absolute right-20 top-1/2 -translate-y-1/2">
                  <RefreshCw className="animate-spin text-eco-500" size={16} />
               </div>
            )}
          </div>

          <button
              onClick={toggleHistory}
              disabled={isLoading}
              className={`px-3 rounded-xl border-2 transition-all flex items-center justify-center ${showHistory ? 'bg-eco-100 border-eco-500 text-eco-700 dark:bg-eco-900/40' : 'bg-white dark:bg-gray-800 border-eco-200 dark:border-gray-700 text-gray-500'}`}
          >
              <History size={20} />
          </button>
          {showHistory && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-fade-in">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500 flex items-center gap-1 uppercase tracking-wider"><Clock size={12} /> Recentes</span>
                      <button onClick={() => setShowHistory(false)}><X size={14} /></button>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                      {isLoadingHistory ? (
                          <div className="p-4 text-center text-xs flex justify-center gap-2 animate-pulse"><RefreshCw size={12} className="animate-spin" /> Carregando...</div>
                      ) : historyItems.length > 0 ? (
                          <ul>
                              {historyItems.map((item, idx) => (
                                  <li key={idx}>
                                      <button onClick={() => handleHistoryClick(item)} className="w-full text-left px-4 py-3 hover:bg-eco-50 dark:hover:bg-eco-900/20 text-sm flex items-center gap-2">
                                          <Search size={14} className="text-gray-400" />{item}
                                      </button>
                                  </li>
                              ))}
                          </ul>
                      ) : <div className="p-6 text-center text-gray-400 text-sm">Nenhum histórico.</div>}
                  </div>
              </div>
          )}
        </div>

        {/* Categories Bar */}
        <div className="flex overflow-x-auto gap-2 pb-2 px-1 scrollbar-hide mb-1 touch-pan-x">
             {categories.map(cat => (
                 <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    disabled={isLoading}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all whitespace-nowrap border ${
                        filterCategory === cat
                        ? 'bg-eco-100 text-eco-700 border-eco-200 dark:bg-eco-900/40'
                        : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                    }`}
                 >
                     {cat}
                 </button>
             ))}
        </div>

        {/* Desktop Alphabet Bar (Single line scrollable with no visible scrollbar) */}
        <div className="hidden md:flex flex-nowrap overflow-x-auto gap-2 border-b border-gray-200 dark:border-gray-700 pb-3 px-1 scrollbar-hide">
          <button 
            onClick={() => setFilterLetter('all')} disabled={isLoading}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterLetter === 'all' ? 'bg-eco-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-600 hover:bg-eco-50 border border-gray-100 dark:border-gray-700'}`}
          >
            Todos
          </button>
          {alphabet.map(letter => (
            <button 
              key={letter} onClick={() => setFilterLetter(letter)} disabled={isLoading}
              className={`shrink-0 w-8 h-8 rounded-lg text-sm font-bold transition-all flex items-center justify-center ${filterLetter === letter ? 'bg-eco-600 text-white shadow-md transform scale-110' : 'bg-white dark:bg-gray-800 text-gray-600 hover:bg-eco-50 border border-gray-100 dark:border-gray-700'}`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 w-full pt-2">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 px-1">
             {[...Array(6)].map((_, i) => <div key={i} className="h-40"><SkeletonCard /></div>)}
          </div>
        ) : filteredTerms.length > 0 ? (
          <AutoSizerAny>
            {({ height, width }: any) => (
              <List
                ref={listRef}
                height={height}
                width={width}
                itemCount={filteredTerms.length}
                overscanCount={4}
                onScroll={onScroll}
                itemSize={(index: number) => getItemSize(index, width, filteredTerms)}
                itemData={{
                  terms: filteredTerms,
                  favorites, copiedTerm, search, toggleFavorite, handleCopy, handleShare, highlightText
                }}
                key={`${width}-${filteredTerms.length}`} 
              >
                {Row}
              </List>
            )}
          </AutoSizerAny>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 mx-1">
            <Search size={48} className="mb-4 opacity-20" />
            <p className="text-lg font-medium">Nenhum termo encontrado</p>
            <button 
               onClick={() => {setSearch(''); setFilterLetter('all'); setFilterCategory('Todas');}}
               className="mt-4 px-4 py-2 bg-eco-100 dark:bg-eco-900/30 text-eco-700 rounded-lg font-bold text-sm"
            >
              Ver Todos
            </button>
          </div>
        )}
      </div>

      {/* Back to Top */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-10 md:bottom-8 md:right-8 z-50 p-3 bg-eco-600 text-white rounded-full shadow-lg transition-all transform ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
      >
        <ArrowUp size={24} strokeWidth={2.5} />
      </button>
    </div>
  );
};

export default Dictionary;
