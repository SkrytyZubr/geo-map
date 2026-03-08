import React, { useState, useRef, useEffect, useMemo, memo, useCallback, forwardRef } from 'react';
import { createPortal } from 'react-dom'; // 🔥 NOWOŚĆ: Importujemy Portal
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// --- KONTROLER MAPY ---
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 14, { duration: 1.5 });
  }, [center, map]);
  return null;
}

function MapZoomListener({ onZoomChange }) {
  const map = useMapEvents({ zoomend: () => onZoomChange(map.getZoom()) });
  useEffect(() => { onZoomChange(map.getZoom()); }, [map, onZoomChange]);
  return null;
}

const createIcon = (emoji, isVandalized) => L.divIcon({
  html: `<div style="background-color: ${isVandalized ? '#fef2f2' : 'white'}; border: 2px solid ${isVandalized ? '#ef4444' : '#10b981'}; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.2); transform: translateY(-5px); transition: all 0.3s;">${isVandalized ? '⚠️' : emoji}</div>`,
  className: 'custom-marker',
  iconSize: [36, 36],
  iconAnchor: [18, 36]
});

// --- WARSTWA POWIATÓW ---
const CountyOverlay = ({ counties, monuments }) => {
  const map = useMap();
  useEffect(() => {
    if (!counties || !counties.features || !map) return;
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#f43f5e', '#84cc16', '#6366f1'];
    const geoJsonLayer = L.geoJSON(counties, {
      style: (feature) => {
        const name = String(feature.properties?.nazwa || feature.properties?.JPT_NAZWA_ || feature.id || "1");
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return { fillColor: colors[Math.abs(hash) % colors.length], weight: 2, opacity: 0.9, color: 'white', dashArray: '5', fillOpacity: 0.25 };
      },
      onEachFeature: (feature, layer) => {
        layer.on({
          mouseover: (e) => { e.target.setStyle({ fillOpacity: 0.5, weight: 3 }); e.target.bringToFront(); },
          mouseout: (e) => { geoJsonLayer.resetStyle(e.target); },
          click: (e) => { map.flyToBounds(e.target.getBounds(), { padding: [50, 50], duration: 1.5 }); }
        });
      }
    }).addTo(map);

    const markers = [];
    geoJsonLayer.eachLayer(layer => {
      if (layer.getBounds && layer.feature) {
        const bounds = layer.getBounds();
        const center = bounds.getCenter(); 
        let count = 0;
        monuments.forEach(m => { if (bounds.contains([m.lat, m.lng])) count++; });
        const icon = L.divIcon({
          className: 'clear-custom-icon transition-all duration-300', 
          html: `<div style="transform: translate(-50%, -50%); cursor: pointer;" class="text-center pointer-events-none hover:scale-110"><span class="county-number font-black text-white block transition-all duration-300" style="text-shadow: 0 4px 12px rgba(0,0,0,0.5), 0 0 8px rgba(0,0,0,0.8);">${count}</span></div>`,
          iconSize: [0, 0] 
        });
        const marker = L.marker(center, { icon, interactive: false }).addTo(map);
        markers.push(marker);
      }
    });
    return () => { map.removeLayer(geoJsonLayer); markers.forEach(m => map.removeLayer(m)); };
  }, [counties, monuments, map]);
  return null;
};

// --- KARTA OBIEKTU ---
const MonumentCard = memo(forwardRef(({ m, isExpanded, isHot, getEmoji, onSelect, onShowMore, onReportVandalism }, ref) => {
  const isUnsplash = m.image_url?.includes('unsplash.com');
  const thumbnailUrl = isUnsplash ? `${m.image_url}?w=800&q=80&auto=format` : m.image_url;

  return (
    <div 
      ref={ref} 
      onClick={() => onSelect(m.id, m.lat, m.lng)} 
      className={`relative w-full bg-white rounded-[2rem] border overflow-hidden cursor-pointer transform-gpu transition-all duration-300 ${isExpanded ? (m.is_vandalized ? 'border-red-400 ring-4 ring-red-50 shadow-2xl' : 'border-emerald-400 ring-4 ring-emerald-50 shadow-2xl') : 'border-gray-100 shadow-md hover:shadow-xl hover:border-emerald-200'}`}
    >
      {m.is_vandalized && <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500 z-30 animate-pulse"></div>}
      {isHot && <div className="absolute top-4 right-4 z-20 bg-orange-500 text-white px-4 py-2 rounded-full text-[11px] font-black animate-bounce shadow-lg">🔥 HOT</div>}
      {m.is_vandalized && <div className="absolute top-4 left-4 z-20 bg-red-600 text-white w-9 h-9 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-pulse">⚠️</div>}

      <div className={`relative w-full transition-[height] duration-500 ${isExpanded ? 'h-56 group' : 'h-40'}`}>
        <img src={thumbnailUrl} loading="lazy" className="w-full h-full object-cover" alt={m.name} />
        {!isExpanded && <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-white font-bold text-sm tracking-widest uppercase bg-black/50 px-5 py-2 rounded-full backdrop-blur-sm shadow-lg">Kliknij by rozwinąć</span></div>}
      </div>
      
      <div className="p-6">
        <h3 className={`text-xl font-black flex items-center gap-3 transition-colors ${isExpanded ? (m.is_vandalized ? 'text-red-600' : 'text-emerald-600') : 'text-gray-800 line-clamp-1'}`}>
          <span className="text-2xl">{m.is_vandalized ? '⚠️' : getEmoji(m.type)}</span> {m.name}
        </h3>
        <span className={`text-[11px] font-black uppercase tracking-widest mt-2 block ${m.is_vandalized ? 'text-red-500' : 'text-emerald-500'}`}>
          {m.is_vandalized ? 'ZGŁOSZONO ZNISZCZENIE' : m.type}
        </span>

        {isExpanded && (
          <div className="mt-5 animate-fade" onClick={(e) => e.stopPropagation()}>
            <p className={`text-sm leading-relaxed mb-5 italic border-l-4 pl-4 ${m.is_vandalized ? 'border-red-100 text-red-900/70' : 'border-emerald-100 text-gray-600'}`}>
              {m.history || m.desc}
            </p>
            <div className="flex gap-2">
              <button onClick={(e) => { e.stopPropagation(); onShowMore(m); }} className={`flex-1 py-4 text-white font-black rounded-xl text-xs tracking-widest uppercase transition-all active:scale-95 transform ${m.is_vandalized ? 'bg-gradient-to-r from-red-500 to-red-600 hover:shadow-red-200' : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:shadow-emerald-200'} hover:shadow-lg`}>
                {m.is_vandalized ? 'Szczegóły Alertu 🚨' : 'Szczegóły 🌿'}
              </button>
              <button onClick={(e) => { e.stopPropagation(); onReportVandalism(m.name); }} className={`px-5 py-4 font-black rounded-xl transition-all active:scale-95 border shadow-sm ${m.is_vandalized ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-500 hover:text-white'}`}>
                <span className="text-lg">⚠️</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}));

// --- PEŁNY MODAL ZE SZCZEGÓŁAMI (Z UŻYCIEM PORTALU) ---
const MonumentDetailModal = ({ m, onClose, getEmoji, story, isStoryLoading, onGenerateStory, setFullscreenImage, onReportVandalism }) => {
  const [expandedTreeIdx, setExpandedTreeIdx] = useState(0); 
  const headerImageUrl = m.image_url?.includes('unsplash.com') ? `${m.image_url}?w=1200&q=80&auto=format` : m.image_url;

  // 🔥 Używamy createPortal, żeby modal wyrenderował się NA SAMYM WIERZCHU całej aplikacji!
  return createPortal(
    <div 
      className="fixed inset-0 w-full h-full flex items-center justify-center p-4 md:p-8 animate-fade" 
      style={{ zIndex: 99999, backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(5px)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-[2.5rem] w-full max-w-4xl flex flex-col relative shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden" 
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 w-12 h-12 bg-black/30 hover:bg-black/50 shadow-lg rounded-full flex items-center justify-center text-white text-2xl z-[11000] transition-all hover:scale-110 active:scale-90 border border-white/20 backdrop-blur-md"
        >
          ✕
        </button>

        <div className="overflow-y-auto custom-scrollbar w-full flex-1">
          <div className="w-full h-64 md:h-80 shrink-0 relative cursor-pointer group" onClick={() => setFullscreenImage(m.image_url)}>
            <img src={headerImageUrl} className="w-full h-full object-cover" alt={m.name} />
            <div className={`absolute top-6 left-8 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl border-2 border-white/20 backdrop-blur-md ${m.is_vandalized ? 'bg-red-600/90 text-white animate-pulse' : 'bg-emerald-500/90 text-white'}`}>
              {m.is_vandalized ? '⚠️ Zgłoszono wandalizm' : '✅ Obiekt bezpieczny'}
            </div>
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-white text-4xl drop-shadow-lg">🔍</span></div>
            <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-black/90 to-transparent"></div>
            <div className="absolute bottom-6 left-8 right-8 flex justify-between items-end">
              <div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-black/50 px-3 py-1 rounded-full">{m.type}</span>
                <h2 className="text-3xl md:text-5xl font-black text-white mt-2 drop-shadow-md flex items-center gap-3">{getEmoji(m.type)} {m.name}</h2>
              </div>
              {m.likes > 0 && (
                <div className="hidden md:flex flex-col items-center bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl text-white border border-white/30">
                  <span className="text-2xl font-black">{m.likes}</span><span className="text-[9px] uppercase tracking-widest font-bold">Lajków</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-8">
            {m.is_vandalized && m.vandalism_details && (
              <div className="mb-8 bg-red-50 border-2 border-red-200 rounded-[2.5rem] overflow-hidden shadow-inner animate-fade">
                <div className="bg-red-600 px-8 py-3 flex justify-between items-center">
                  <span className="text-white font-black text-[11px] uppercase tracking-[0.2em]">Raport o zniszczeniu</span>
                  <span className="text-red-100 text-[11px] font-bold">
                    {m.vandalism_details.reported_at ? new Date(m.vandalism_details.reported_at * 1000).toLocaleDateString('pl-PL') : 'Brak daty'}
                  </span>
                </div>
                <div className="p-8 flex flex-col md:flex-row gap-8 items-start">
                  <div className="w-full md:w-32 h-32 shrink-0 rounded-[1.5rem] overflow-hidden border-4 border-white shadow-xl cursor-pointer group relative" onClick={() => setFullscreenImage(m.vandalism_details.report_image || m.vandalism_details.image_url)}>
                    <img src={m.vandalism_details.report_image || m.vandalism_details.image_url} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Dowód" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-white text-xs font-bold">POWIĘKSZ</span></div>
                  </div>
                  <div className="flex-1">
                    <div className="inline-block bg-red-200/50 text-red-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">{m.vandalism_details.type || 'Inne uszkodzenie'}</div>
                    <p className="text-red-900/80 text-base font-medium leading-relaxed italic border-l-4 border-red-200 pl-4">"{m.vandalism_details.description || 'Brak dodatkowego opisu zgłoszenia.'}"</p>
                    <div className="mt-5 flex items-center gap-3">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                      </span>
                      <span className="text-[11px] font-black text-red-700 uppercase tracking-widest">Status: {m.vandalism_details.status || 'Weryfikacja przez straż leśną'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-emerald-50 rounded-3xl p-5 border border-emerald-100 flex flex-col justify-center items-center text-center"><span className="text-3xl mb-2">⏳</span><span className="text-xl font-black text-emerald-900">{m.estimated_age ? `~${m.estimated_age} lat` : 'Brak danych'}</span><span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Szacowany Wiek</span></div>
              <div className="bg-blue-50 rounded-3xl p-5 border border-blue-100 flex flex-col justify-center items-center text-center"><span className="text-3xl mb-2">🛡️</span><span className="text-xl font-black text-blue-900">{m.protection_year ? `${m.protection_year} r.` : 'Nowe zgłoszenie'}</span><span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Rok Ochrony</span></div>
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-2">Historia i Pochodzenie</h3>
              <p className="text-base text-gray-700 leading-relaxed font-medium bg-gray-50 p-6 rounded-3xl border border-gray-100">{m.history || m.desc || "Brak szczegółowej historii."}</p>
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
                      <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setExpandedTreeIdx(isTreeExpanded ? null : i)}>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-full text-white font-black ${statusText === 'ZDROWE' ? 'bg-emerald-400' : 'bg-red-400'}`}>{i + 1}</span>
                          <span className="font-bold text-gray-800 text-sm">{t.gatunek || 'Drzewo'}</span>
                        </div>
                        <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${statusText === 'ZDROWE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{statusText === 'ZDROWE' ? '✅ ZDROWE' : '⚠️ CHORE'}</span>
                      </div>

                      {isTreeExpanded && (
                        <div className="p-4 pt-0 border-t border-gray-100 bg-gray-50 animate-fade">
                          <div className="flex gap-4 text-gray-500 text-xs font-bold mt-4 mb-3">
                            {t.obwod_cm && <span className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">📏 OBWÓD: {t.obwod_cm} CM</span>}
                            {t.wysokosc_m && <span className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">📐 WYS: {t.wysokosc_m} M</span>}
                          </div>
                          {statusText === 'CHORE' && (
                            <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-100">
                              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2 flex items-center gap-2"><span className="text-lg">🩺</span> Diagnoza DoctorTree</p>
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

            <div className="flex flex-col gap-3">
              {!story ? (
                <button onClick={(e) => onGenerateStory(e, m)} className="w-full py-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black rounded-[1.5rem] text-sm tracking-widest uppercase hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95" disabled={isStoryLoading}>
                  {isStoryLoading ? '⚡ MAGIA AI PRACUJE...' : '✨ Wygeneruj Lokalną Legendę AI'}
                </button>
              ) : (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-3xl border border-indigo-100 shadow-inner">
                   <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2"><span>🔮</span> Legenda wygenerowana przez Gemini AI</p>
                   <p className="text-sm text-indigo-900 leading-relaxed font-medium italic">"{story}"</p>
                </div>
              )}
              <button onClick={(e) => { e.stopPropagation(); onReportVandalism(m.name); onClose(); }} className={`w-full py-5 font-black rounded-[1.5rem] text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-3 border shadow-sm ${m.is_vandalized ? 'bg-white text-red-600 border-red-200 hover:bg-red-50' : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'}`}>
                <span className="text-2xl">{m.is_vandalized ? '➕' : '⚠️'}</span> {m.is_vandalized ? 'Dodaj kolejne zgłoszenie' : 'Zgłoś uszkodzenie lub wandalizm'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body // Gwarantuje ominięcie wszystkich barier Z-index
  );
};

// --- MARKERY ---
const MemoizedMarkers = memo(({ filtered, handleSelect, getEmoji }) => (
  <>
    {filtered.map(m => (
      <Marker key={m.id} position={[m.lat, m.lng]} icon={createIcon(getEmoji(m.type), m.is_vandalized)} eventHandlers={{ click: () => handleSelect(m.id, m.lat, m.lng) }}>
        <Popup className="rounded-xl">
          <div className="text-center p-1 font-bold">
            {m.is_vandalized && <span className="block text-[10px] text-red-600 mb-1">⚠️ USZKODZONY</span>}
            <span className={m.is_vandalized ? 'text-red-700' : 'text-emerald-700'}>{m.name}</span>
          </div>
        </Popup>
      </Marker>
    ))}
  </>
));

export default function MapTab({ monuments, searchQuery, getEmoji, onReportVandalism }) {
  const [filterType, setFilterType] = useState('wszystkie');
  const [activeLocation, setActiveLocation] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(9);
  const [expandedId, setExpandedId] = useState(null); 
  const [selectedMonument, setSelectedMonument] = useState(null); 
  const [stories, setStories] = useState({});
  const [loadingStoryId, setLoadingStoryId] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null); 
  const [countiesData, setCountiesData] = useState(null);
  const listRefs = useRef({});

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/ppatrzyk/polska-geojson/master/powiaty/powiaty-min.geojson')
      .then(res => res.json())
      .then(data => {
        const pomorskieNames = ['bytowski', 'chojnicki', 'człuchowski', 'gdański', 'kartuski', 'kościerski', 'kwidzyński', 'lęborski', 'malborski', 'nowodworski', 'pucki', 'słupski', 'starogardzki', 'sztumski', 'tczewski', 'wejherowski', 'gdańsk', 'gdynia', 'sopot'];
        const pomorskie = { ...data, features: data.features.filter(f => pomorskieNames.some(p => String(f.properties?.nazwa || f.properties?.JPT_NAZWA_ || "").toLowerCase().includes(p))) };
        setCountiesData(pomorskie);
      })
      .catch(err => console.error(err));
  }, []);

  const top3Ids = useMemo(() => [...monuments].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 3).filter(m => (m.likes || 0) > 0).map(m => m.id), [monuments]);
  const filtered = useMemo(() => monuments.filter(m => {
    const s = searchQuery.toLowerCase();
    const type = (m.type || "").toLowerCase();
    const matchesSearch = (m.name || "").toLowerCase().includes(s) || type.includes(s);
    const matchesType = filterType === 'wszystkie' || (filterType === 'drzewa' && (type.includes('drzewo') || type.includes('dąb'))) || (filterType === 'aleje' && type.includes('aleja')) || (filterType === 'głazy' && type.includes('głaz'));
    return s !== "" ? matchesSearch : matchesType;
  }), [monuments, searchQuery, filterType]);

  const handleSelect = useCallback((mId, lat, lng) => {
    setActiveLocation([lat, lng]);
    setExpandedId(prev => {
      if (prev !== mId) {
        setTimeout(() => {
          listRefs.current[mId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
      }
      return prev !== mId ? mId : null;
    });
  }, []);

  return (
    <>
      {/* Również modal ze zdjęciem fullscreen został wyciągnięty przez Portal */}
      {fullscreenImage && createPortal(
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 cursor-pointer" style={{ zIndex: 999999 }} onClick={() => setFullscreenImage(null)}>
          <button className="absolute top-6 right-6 text-white text-5xl hover:scale-110 transition-transform font-light">&times;</button>
          <img src={fullscreenImage} className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain" alt="Pełny rozmiar" />
        </div>,
        document.body
      )}

      {selectedMonument && (
        <MonumentDetailModal 
          m={selectedMonument} onClose={() => setSelectedMonument(null)} getEmoji={getEmoji}
          story={stories[selectedMonument.id]} isStoryLoading={loadingStoryId === selectedMonument.id}
          onGenerateStory={async (e, m) => {
            setLoadingStoryId(m.id);
            try {
              const res = await fetch('/api/ai/story', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ monument_name: m.name, location: "województwo pomorskie" }) });
              const d = await res.json();
              setStories(prev => ({ ...prev, [m.id]: d.story }));
            } catch (e) {} finally { setLoadingStoryId(null); }
          }}
          setFullscreenImage={setFullscreenImage} onReportVandalism={onReportVandalism}
        />
      )}

      <aside className="w-1/3 h-full overflow-y-auto pr-4 custom-scrollbar">
        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
          {['wszystkie', 'drzewa', 'aleje', 'głazy'].map(t => (
            <button key={t} onClick={() => setFilterType(t)} className={`px-5 py-2.5 rounded-full text-[11px] font-black uppercase border-2 shrink-0 ${filterType === t ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'}`}>{t}</button>
          ))}
        </div>
        <div className="flex flex-col gap-6 pb-12 w-full">
          {filtered.map(m => (
            <MonumentCard 
              key={m.id} m={m} ref={el => listRefs.current[m.id] = el}
              isExpanded={expandedId === m.id} isHot={monuments.slice(0,3).some(top => top.id === m.id)}
              getEmoji={getEmoji} onSelect={handleSelect} onShowMore={setSelectedMonument} onReportVandalism={onReportVandalism}
            />
          ))}
        </div>
      </aside>

      <section className={`w-2/3 h-full rounded-[2.5rem] overflow-hidden border border-gray-200 relative z-0 ${currentZoom <= 7 ? 'hide-labels' : currentZoom === 8 ? 'small-labels' : ''}`}>
        <style>{`.hide-labels .clear-custom-icon { opacity: 0 !important; pointer-events: none !important; } .small-labels .clear-custom-icon .county-number { font-size: 1.5rem !important; }`}</style>
        <MapContainer center={[54.35, 18.64]} zoom={9} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          <MapController center={activeLocation} />
          <MapZoomListener onZoomChange={setCurrentZoom} />
          {currentZoom <= 10 && <CountyOverlay counties={countiesData} monuments={filtered} />}
          {currentZoom > 10 && <MemoizedMarkers filtered={filtered} handleSelect={handleSelect} getEmoji={getEmoji} />}
        </MapContainer>
      </section>
    </>
  );
}