import React, { useState, useEffect } from 'react';
import MapTab from './MapTab';
import ExploreTab from './ExploreTab';
import ReportTab from './ReportTab';
import VandalismTab from './VandalismTab';
import DoctorTree from './DoctorTree';
import 'leaflet/dist/leaflet.css';

const getIconEmoji = (type) => {
  const t = (type || "").toLowerCase();
  if (t.includes('aleja')) return '🛣️';
  if (t.includes('las') || t.includes('buki') || t.includes('grupa')) return '🌲';
  if (t.includes('głaz') || t.includes('kamień')) return '🪨';
  return '🌳';
};

export default function App() {
  const [monuments, setMonuments] = useState([]);
  const [activeTab, setActiveTab] = useState('mapa');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDoctorOpen, setIsDoctorOpen] = useState(false);
  
  const [vandalismTarget, setVandalismTarget] = useState('');

  // Wyodrębniłem pobieranie danych do oddzielnej, re-używalnej funkcji
  const fetchData = () => {
    fetch("http://localhost:5000/api/monuments")
      .then(res => res.json())
      .then(data => {
        setMonuments(data);
        console.log("🔄 Dane odświeżone z serwera!");
      })
      .catch(err => console.error("Błąd API:", err));
  };

  // Ładowanie przy pierwszym uruchomieniu
  useEffect(() => {
    fetchData();
  }, []);

  const handleReportVandalism = (monumentName) => {
    setVandalismTarget(monumentName);
    setActiveTab('wandalizm');
  };

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] font-sans text-gray-800 overflow-hidden">
      
      {/* TOPBAR */}
      <header className="h-20 bg-white/90 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 shadow-sm z-50 shrink-0">
        <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => window.location.reload()}>
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-600 rounded-xl shadow-lg flex items-center justify-center text-white text-xl">🌿</div>
          <h1 className="font-extrabold text-2xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-emerald-500">SkarbyPomorza</h1>
        </div>
      
        <div className="relative flex-1 max-w-xl mx-8">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input 
            type="text" 
            placeholder="Szukaj dębów, miejscowości..." 
            className="w-full pl-12 pr-6 py-3 bg-gray-100/50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all shadow-inner"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button 
          onClick={() => setIsDoctorOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-full font-black text-sm tracking-widest uppercase shadow-lg shadow-teal-200/50 hover:-translate-y-0.5 hover:shadow-xl transition-all active:scale-95 shrink-0"
        >
          <span className="text-xl">🩺</span> DoctorTree
        </button>
      </header>

      {/* NAWIGACJA ZAKŁADEK */}
      <nav className="w-full bg-white/80 backdrop-blur-md border-b border-gray-100 flex flex-col shadow-md z-40 shrink-0 relative">
        <div className="flex w-full p-3 gap-3">
          <button 
            onClick={() => setActiveTab('mapa')}
            className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-full transition-all duration-300 transform active:scale-95 border-2 ${
              activeTab === 'mapa' ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-gray-100/80 border-transparent text-gray-500 hover:bg-gray-200/80 hover:text-gray-700'
            }`}
          >
            <span className="text-xl">🗺️</span><span className="text-xs font-black tracking-widest">MAPA</span>
          </button>

          <button 
            onClick={() => setActiveTab('swipe')}
            className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-full transition-all duration-300 transform active:scale-95 border-2 ${
              activeTab === 'swipe' ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-gray-100/80 border-transparent text-gray-500 hover:bg-gray-200/80 hover:text-gray-700'
            }`}
          >
            <span className="text-xl">📱</span><span className="text-xs font-black tracking-widest">ODKRYWCA</span>
          </button>

          <button 
            onClick={() => setActiveTab('zgloszenie')}
            className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-full transition-all duration-300 transform active:scale-95 border-2 ${
              activeTab === 'zgloszenie' ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-gray-100/80 border-transparent text-gray-500 hover:bg-gray-200/80 hover:text-gray-700'
            }`}
          >
            <span className="text-xl">📸</span><span className="text-xs font-black tracking-widest">ZGŁOŚ SKARB</span>
          </button>
        </div>
      </nav>

      {/* TREŚĆ GŁÓWNA */}
      <main className="flex flex-1 overflow-hidden p-4 gap-4 relative z-0">
        {activeTab === 'mapa' && (
          <MapTab 
            monuments={monuments} 
            searchQuery={searchQuery} 
            getEmoji={getIconEmoji} 
            onReportVandalism={handleReportVandalism} 
          />
        )}
        {activeTab === 'swipe' && (
          <ExploreTab monuments={monuments} getEmoji={getIconEmoji} onDataUpdate={fetchData} />
        )}
        {activeTab === 'zgloszenie' && (
          <ReportTab onDataUpdate={fetchData} />
        )}
        {activeTab === 'wandalizm' && (
          <VandalismTab 
            initialObjectName={vandalismTarget} 
            onSuccess={() => {
              fetchData(); // 🔄 Pobieramy nowe dane
              setActiveTab('mapa'); // Automatyczny powrót do mapy po sukcesie
            }} 
          />
        )}
      </main>

      {isDoctorOpen && <DoctorTree onClose={() => setIsDoctorOpen(false)} />}
    </div>
  );
}