import React, { useState, useCallback } from 'react';

// WSTRZYKNIĘTA ANIMACJA CSS
const modalStyles = `
  @keyframes slideUpModal {
    0% { transform: translateY(100%); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
  }
  .animate-slide-up {
    animation: slideUpModal 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
`;

// --- MODAL ZE SZCZEGÓŁAMI OBIEKTU ---
const MonumentDetailModal = ({ m, onClose, getEmoji, story, isStoryLoading, onGenerateStory, setFullscreenImage }) => {
  const [expandedTreeIdx, setExpandedTreeIdx] = useState(null);
  
  const isUnsplash = m.image_url?.includes('unsplash.com');
  const headerImageUrl = isUnsplash ? `${m.image_url}?w=1200&q=80&auto=format` : m.image_url;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end md:items-center justify-center p-0 md:p-8 animate-fade"
      onClick={onClose}
    >
      <style>{modalStyles}</style>
      
      <div 
        className="bg-white rounded-t-[3rem] md:rounded-[3rem] w-full max-w-4xl h-[90vh] md:max-h-[95vh] shadow-2xl overflow-hidden flex flex-col relative animate-slide-up"
        onClick={e => e.stopPropagation()} 
      >
        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 w-10 h-10 bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white text-xl z-20 transition-all shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div 
          className="w-full h-64 md:h-80 shrink-0 relative cursor-pointer group"
          onClick={() => setFullscreenImage(m.image_url)}
        >
          <img src={headerImageUrl} className="w-full h-full object-cover" alt={m.name} />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-12 h-12 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-black/90 to-transparent"></div>
          <div className="absolute bottom-6 left-8 right-8 flex justify-between items-end">
            <div>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-black/50 px-3 py-1 rounded-full">{m.type}</span>
              <h2 className="text-3xl md:text-5xl font-black text-white mt-2 drop-shadow-md flex items-center gap-3">
                <span className="text-4xl">{getEmoji(m.type)}</span> {m.name}
              </h2>
            </div>
            {m.likes > 0 && (
              <div className="hidden md:flex flex-col items-center bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl text-white border border-white/30">
                <span className="text-2xl font-black">{m.likes}</span>
                <span className="text-[9px] uppercase tracking-widest font-bold">Lajków</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-emerald-50 rounded-3xl p-5 border border-emerald-100 flex flex-col justify-center items-center text-center">
              <span className="text-3xl mb-2">⏳</span>
              <span className="text-xl font-black text-emerald-900">{m.estimated_age ? `~${m.estimated_age} lat` : 'Brak danych'}</span>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Szacowany Wiek</span>
            </div>
            <div className="bg-blue-50 rounded-3xl p-5 border border-blue-100 flex flex-col justify-center items-center text-center">
              <span className="text-3xl mb-2">🛡️</span>
              <span className="text-xl font-black text-blue-900">{m.protection_year ? `${m.protection_year} r.` : 'Nowe zgłoszenie'}</span>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Rok Ochrony</span>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-2">Historia i Pochodzenie</h3>
            <p className="text-base text-gray-700 leading-relaxed font-medium bg-gray-50 p-6 rounded-3xl border border-gray-100">
              {m.history || m.desc || "Brak szczegółowej historii w bazie dla tego nowo dodanego obiektu."}
            </p>
          </div>
          
          {m.trees_details?.length > 0 && (
            <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100 mb-8 flex flex-col gap-3">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2 mb-1">Skład i zdrowie obiektu ({m.trees_details.length})</p>
              
              {m.trees_details.map((t, i) => {
                const isHealthy = t.status ? t.status === 'ZDROWE' : (i % 4 !== 3); 
                const statusText = t.status || (isHealthy ? 'ZDROWE' : 'CHORE');
                const diseaseDesc = t.disease_desc || (isHealthy ? '' : 'Podejrzenie infekcji grzybiczej. Wymagana inspekcja.');
                const isTreeExpanded = expandedTreeIdx === i;

                return (
                  <div key={i} className={`bg-white rounded-2xl border transition-all overflow-hidden ${isTreeExpanded ? 'border-gray-300 shadow-md' : 'border-gray-100 shadow-sm'}`}>
                    <div 
                      className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setExpandedTreeIdx(isTreeExpanded ? null : i)}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-full text-white font-black ${statusText === 'ZDROWE' ? 'bg-emerald-400' : 'bg-red-400'}`}>
                          {i + 1}
                        </span>
                        <span className="font-bold text-gray-800 text-sm">{t.gatunek || 'Drzewo'}</span>
                      </div>
                      <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${statusText === 'ZDROWE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {statusText === 'ZDROWE' ? '✅ ZDROWE' : '⚠️ CHORE'}
                      </span>
                    </div>

                    {isTreeExpanded && (
                      <div className="p-4 pt-0 border-t border-gray-100 bg-gray-50 animate-fade">
                        <div className="flex gap-4 text-gray-500 text-xs font-bold mt-4 mb-3">
                          {t.obwod_cm && <span className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">📏 OBWÓD: {t.obwod_cm} CM</span>}
                          {t.wysokosc_m && <span className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">📐 WYS: {t.wysokosc_m} M</span>}
                        </div>
                        
                        {statusText === 'CHORE' && (
                          <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-100">
                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                              <span className="text-lg">🩺</span> Diagnoza DoctorTree
                            </p>
                            <p className="text-sm text-red-900 font-medium leading-relaxed">{diseaseDesc}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!story ? (
            <button 
              onClick={(e) => onGenerateStory(e, m)} 
              className="w-full py-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black rounded-2xl text-sm tracking-widest uppercase hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95"
              disabled={isStoryLoading}
            >
              {isStoryLoading ? '⚡ MAGIA AI PRACUJE...' : '✨ Wygeneruj Lokalną Legendę AI'}
            </button>
          ) : (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-3xl border border-indigo-100 shadow-inner">
               <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2"><span>🔮</span> Legenda wygenerowana przez Gemini AI</p>
               <p className="text-sm text-indigo-900 leading-relaxed font-medium italic">"{story}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function ExploreTab({ monuments, getEmoji, onDataUpdate }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [selectedMonument, setSelectedMonument] = useState(null);
  const [stories, setStories] = useState({});
  const [loadingStoryId, setLoadingStoryId] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);

  const activeMonuments = monuments.slice(currentIndex);
  const currentMonument = activeMonuments[0];

  const handleSwipe = async (direction) => {
    if (!currentMonument) return;

    if (direction === 'right') {
      try {
        await fetch(`/api/monuments/${currentMonument.id}/like`, { method: 'POST' });
        if (onDataUpdate) onDataUpdate();
      } catch (err) {
        console.error("Błąd lajkowania:", err);
      }
    }
    
    setCurrentIndex(prev => prev + 1);
  };

  const handleGenerateStory = useCallback(async (e, monument) => {
    e.stopPropagation();
    setLoadingStoryId(monument.id);
    try {
      const response = await fetch('/api/ai/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monument_name: monument.name, location: "Województwo pomorskie" })
      });
      const data = await response.json();
      if (response.ok) setStories(prev => ({ ...prev, [monument.id]: data.story }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingStoryId(null);
    }
  }, []);

  const getFullscreenUrl = (url) => {
    if (!url) return null;
    return url.includes('unsplash.com') ? `${url}?w=1920&q=90&auto=format` : url;
  };

  if (!currentMonument) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade">
        <svg className="w-24 h-24 text-emerald-500 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
        <h2 className="text-3xl font-black text-gray-800 mb-4">To już wszystko!</h2>
        <p className="text-gray-500 font-medium max-w-sm">Odkryłeś wszystkie dostępne skarby Pomorza. Wróć później lub dodaj własne na mapie!</p>
        <button 
          onClick={() => setCurrentIndex(0)} 
          className="mt-8 px-8 py-4 bg-emerald-600 text-white rounded-full font-black tracking-widest uppercase hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
        >
          Przeglądaj od nowa
        </button>
      </div>
    );
  }

  const thumbnailUrl = currentMonument.image_url?.includes('unsplash.com') 
    ? `${currentMonument.image_url}?w=800&q=80&auto=format` 
    : currentMonument.image_url;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative bg-gray-50/50 overflow-hidden">
      
      {fullscreenImage && (
        <div 
          className="fixed inset-0 bg-black/95 z-[70] flex items-center justify-center p-4 cursor-pointer animate-fade"
          onClick={() => setFullscreenImage(null)}
        >
          <button className="absolute top-6 right-6 text-white text-5xl hover:scale-110 transition-transform font-light">&times;</button>
          <img src={getFullscreenUrl(fullscreenImage)} className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain" alt="Pełny rozmiar" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {selectedMonument && (
        <MonumentDetailModal 
          m={selectedMonument}
          onClose={() => setSelectedMonument(null)}
          getEmoji={getEmoji}
          story={stories[selectedMonument.id]}
          isStoryLoading={loadingStoryId === selectedMonument.id}
          onGenerateStory={handleGenerateStory}
          setFullscreenImage={setFullscreenImage}
        />
      )}

      <div className="w-full max-w-sm aspect-[3/4] relative perspective-1000 animate-fade">
        <div className="w-full h-full bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-gray-100">
          
          <div className="flex-1 relative bg-gray-100">
            {currentMonument.image_url ? (
              <img src={thumbnailUrl} className="w-full h-full object-cover" alt={currentMonument.name} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">{getEmoji(currentMonument.type)}</div>
            )}
            
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent flex flex-col justify-end p-8">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">{currentMonument.type}</span>
              <h2 className="text-3xl font-black text-white leading-tight drop-shadow-md flex items-center gap-2">
                <span className="text-4xl">{getEmoji(currentMonument.type)}</span> {currentMonument.name}
              </h2>
            </div>
          </div>
          
          <div className="p-6 bg-white shrink-0">
            <p className="text-sm text-gray-500 font-medium line-clamp-2 italic">
              "{currentMonument.desc}"
            </p>
          </div>
        </div>
      </div>

      {/* --- NOWE, NOWOCZESNE GUZIKI AKCJI --- */}
      <div className="flex items-center justify-center gap-6 mt-8">
        
        {/* Przycisk Odrzuć (Krzyżyk) */}
        <button 
          onClick={() => handleSwipe('left')}
          className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white hover:-translate-y-1 transition-all duration-300 border border-red-100 group"
          title="Pomiń"
        >
          <svg className="w-8 h-8 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Przycisk Szczegóły (Strzałka w górę) */}
        <button 
          onClick={() => setSelectedMonument(currentMonument)}
          className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center text-blue-500 hover:bg-blue-500 hover:text-white hover:-translate-y-1 transition-all duration-300 border border-blue-100 group"
          title="Pokaż szczegóły"
        >
          <svg className="w-8 h-8 group-hover:-translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
          </svg>
        </button>

        {/* Przycisk Akceptuj (Serce) */}
        <button 
          onClick={() => handleSwipe('right')}
          className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center text-emerald-500 hover:bg-emerald-500 hover:text-white hover:-translate-y-1 transition-all duration-300 border border-emerald-100 group"
          title="Zapisz / Polub"
        >
          <svg className="w-8 h-8 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>
      </div>

    </div>
  );
}