
import React, { useEffect, useState } from 'react';
import { BookOpen, Leaf } from 'lucide-react';
import { APP_VERSION } from '../services/data';

const SplashScreen: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 2800; // 2.8 segundos para atingir 100%

    const timer = setInterval(() => {
      const timePassed = Date.now() - startTime;
      const nextProgress = Math.min((timePassed / duration) * 100, 100);
      
      setProgress(nextProgress);

      if (nextProgress >= 100) {
        clearInterval(timer);
      }
    }, 30);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-eco-600 overflow-hidden font-sans">
      
      {/* Decorative Background Elements (Blobs) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-white blur-3xl opacity-20"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-white blur-3xl opacity-20"></div>
      </div>

      {/* Top Spacer */}
      <div className="h-1/4"></div>

      {/* Central Branding Stack */}
      <div className="flex flex-col items-center justify-center z-10 relative">
        {/* Brand Icon Stack */}
        <div className="mb-8 relative flex items-center justify-center bg-white/20 backdrop-blur-sm p-8 rounded-full shadow-2xl ring-1 ring-white/30">
          <BookOpen className="text-white w-20 h-20" strokeWidth={1.5} />
          <div className="absolute -top-2 -right-2 bg-eco-500 rounded-full p-1 border-4 border-eco-600 shadow-lg">
             <Leaf className="text-white w-8 h-8 fill-current" />
          </div>
        </div>

        {/* Typography */}
        <div className="text-center text-white">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-none mb-2 drop-shadow-sm">
            EcoDicionário
          </h1>
          <h2 className="text-white/80 text-lg md:text-xl font-medium tracking-[0.3em] uppercase">
            Angola
          </h2>
        </div>
      </div>

      {/* Loading Indicator Section */}
      <div className="w-full max-w-xs px-6 pb-16 z-10">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center px-1">
            <p className="text-white/80 text-sm font-medium animate-pulse">Iniciando dicionário...</p>
            {/* Texto de percentagem dinâmico */}
            <p className="text-white text-xs font-bold font-mono min-w-[3ch] text-right">
                {Math.floor(progress)}%
            </p>
          </div>
          
          {/* Loading Bar */}
          <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
            <div 
                className="h-full bg-white rounded-full transition-all ease-out" 
                style={{ 
                    width: `${progress}%`,
                    // Removemos a transitionDuration CSS fixa para seguir o JS suavemente
                }}
            ></div>
          </div>
        </div>

        {/* App Version */}
        <p className="text-center text-white/40 text-[10px] mt-8 tracking-widest uppercase font-medium">
          Versão {APP_VERSION} • EcoDicionário
        </p>
      </div>

      {/* Static Background Map Overlay */}
      {!imgError && (
        <div className="absolute inset-0 opacity-10 z-0 flex items-center justify-center pointer-events-none">
          <img 
              className="w-full h-full object-contain scale-125 md:scale-100" 
              src="https://raw.githubusercontent.com/Petilson-Seculo/eco-dicionario-angola/refs/heads/main/background-loader.png"
              alt="Mapa de Angola" 
              onError={() => setImgError(true)}
          />
        </div>
      )}
    </div>
  );
};

export default SplashScreen;
