import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Customowa ikona dla nowej pinezki
const pinIcon = L.divIcon({
  html: `<div style="font-size: 32px; transform: translate(-10px, -15px); text-shadow: 0 4px 6px rgba(0,0,0,0.3);">📍</div>`,
  className: 'custom-pin',
});

// Komponent obsługujący kliknięcia na mapie wewnątrz formularza
function LocationPicker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return position ? <Marker position={[position.lat, position.lng]} icon={pinIcon} /> : null;
}

export default function ReportTab({ onDataUpdate }) {
  const [step, setStep] = useState(1); 
  const [imageFile, setImageFile] = useState(null); 
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'Pojedyncze drzewo',
    desc: '',
    status: 'ZDROWE', // NOWOŚĆ: Domyślny status
    disease_desc: '', // NOWOŚĆ: Opis choroby
    lat: 54.3520, 
    lng: 18.6466
  });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setFormData(prev => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude })),
      (err) => console.log("Brak dostępu do GPS")
    );
  }, []);

  const handleAnalyze = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    setErrorMsg(null);

    const payload = new FormData();
    payload.append('image', file);

    try {
      const res = await fetch('http://localhost:5000/api/monuments/analyze', { 
        method: 'POST', body: payload 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Błąd analizy");

      // Wypełniamy formularz danymi, w tym statusem od AI
      setFormData(prev => ({
        ...prev,
        name: data.ai.species || 'Nieznany obiekt',
        desc: `${data.ai.fact} (Szacowany wiek: ${data.ai.age}).`,
        status: data.ai.status || 'ZDROWE',
        disease_desc: data.ai.disease_desc || ''
      }));
      setStep(2);
    } catch (err) {
      setErrorMsg(`AI miało problem: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitConfirm = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    
    const payload = new FormData();
    payload.append('image', imageFile);
    payload.append('name', formData.name);
    payload.append('type', formData.type);
    payload.append('desc', formData.desc);
    payload.append('lat', formData.lat);
    payload.append('lng', formData.lng);
    payload.append('status', formData.status);             // NOWOŚĆ
    payload.append('disease_desc', formData.disease_desc); // NOWOŚĆ

    try {
      const res = await fetch('http://localhost:5000/api/monuments/confirm', {
        method: 'POST',
        body: payload 
      });
      
      if (!res.ok) throw new Error("Nie udało się zapisać obiektu do bazy.");
      
      if (onDataUpdate) onDataUpdate(); 
      setStep(3); 
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gray-50 flex flex-col items-center custom-scrollbar">
      <div className="w-full max-w-xl bg-white rounded-[3rem] p-8 shadow-xl border border-gray-100 relative">
        
        <div className="mb-6 border-b border-gray-100 pb-4 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-black tracking-tighter text-gray-800">
              {step === 1 ? 'Dodaj Skarb' : step === 2 ? 'Weryfikacja' : 'Sukces!'}
            </h2>
            <p className="text-gray-400 text-sm font-medium italic mt-1">
              {step === 1 ? 'Zrób zdjęcie, a my zrobimy resztę.' : step === 2 ? 'Popraw dane, jeśli AI się pomyliło.' : 'Obiekt dodany na mapę.'}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-sm font-bold text-center">
            {errorMsg}
          </div>
        )}

        {/* --- KROK 1: UPLOAD --- */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div onClick={() => document.getElementById('cam').click()} className="w-full h-72 rounded-[2.5rem] bg-gray-50 border-4 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all hover:border-emerald-400 hover:bg-emerald-50 relative group">
              <div className="text-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-6xl block mb-4">📸</span>
                <p className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em]">Kliknij by otworzyć aparat</p>
              </div>
              <input id="cam" type="file" hidden accept="image/*" onChange={handleAnalyze} />
            </div>
            {loading && (
              <div className="mt-2 p-4 bg-indigo-50 rounded-3xl border border-indigo-100 flex items-center justify-center gap-3 animate-pulse">
                <span className="animate-spin text-xl">✨</span>
                <p className="text-indigo-900 font-bold text-xs tracking-widest uppercase">Gemini analizuje obraz...</p>
              </div>
            )}
          </div>
        )}

        {/* --- KROK 2: WERYFIKACJA --- */}
        {step === 2 && (
          <form onSubmit={handleSubmitConfirm} className="flex flex-col gap-4 animate-fade">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-3">Rozpoznany Gatunek</label>
                <input type="text" required className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 focus:bg-white focus:ring-2 focus:ring-emerald-400 transition-all font-bold text-gray-800" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-3">Typ obiektu</label>
                <select className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 focus:bg-white focus:ring-2 focus:ring-emerald-400 transition-all font-bold text-gray-800" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option>Pojedyncze drzewo</option>
                  <option>Aleja</option>
                  <option>Głaz narzutowy</option>
                  <option>Zgłoszenie użytkownika</option>
                </select>
              </div>
            </div>

            {/* NOWOŚĆ: SEKCJA ZDROWIA (Nie wyświetla się dla Głazów) */}
            {formData.type !== 'Głaz narzutowy' && (
              <div className={`p-4 rounded-3xl border transition-colors ${formData.status === 'ZDROWE' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/50 border-red-100'}`}>
                <p className={`text-[10px] font-black uppercase mb-3 text-center ${formData.status === 'ZDROWE' ? 'text-emerald-600' : 'text-red-600'}`}>🩺 Status Zdrowotny</p>
                <div className="flex flex-col gap-3">
                  <select 
                    className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-sm font-bold text-gray-800 w-full"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="ZDROWE">✅ ZDROWE</option>
                    <option value="CHORE">⚠️ CHORE</option>
                  </select>

                  {formData.status === 'CHORE' && (
                    <div className="flex flex-col gap-1 animate-fade">
                      <label className="text-[9px] font-bold text-gray-400 uppercase ml-2">Diagnoza i Zalecenia</label>
                      <textarea 
                        rows="2" 
                        placeholder="Opisz problem (np. ubytki kory, grzyby)..."
                        className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-sm text-gray-700 w-full"
                        value={formData.disease_desc} 
                        onChange={e => setFormData({...formData, disease_desc: e.target.value})} 
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5 mt-2">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-3 flex justify-between">
                <span>Opis ogólny</span>
              </label>
              <textarea rows="2" required className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 focus:bg-white focus:ring-2 focus:ring-emerald-400 transition-all font-medium text-gray-700 text-sm leading-relaxed" value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} />
            </div>

            <div className="bg-blue-50/50 p-4 rounded-3xl border border-blue-100 mt-2">
              <p className="text-[10px] font-black text-blue-500 uppercase mb-3 text-center">🗺️ Dotknij mapy, aby wskazać lokalizację</p>
              
              <div className="h-48 w-full rounded-2xl overflow-hidden border border-gray-200 shadow-inner z-0 relative">
                <MapContainer center={[formData.lat, formData.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationPicker 
                    position={formData} 
                    setPosition={(pos) => setFormData(prev => ({...prev, lat: pos.lat, lng: pos.lng}))} 
                  />
                </MapContainer>
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <button type="button" onClick={() => setStep(1)} className="px-6 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition-colors">Wróć</button>
              <button type="submit" disabled={loading} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-colors disabled:opacity-50">
                {loading ? 'ZAPISYWANIE...' : 'ZATWIERDŹ I DODAJ 🌿'}
              </button>
            </div>
          </form>
        )}

        {/* --- KROK 3: SUKCES --- */}
        {step === 3 && (
          <div className="flex flex-col items-center justify-center py-10 animate-fade">
            <span className="text-7xl mb-6">🎉</span>
            <h3 className="text-2xl font-black text-gray-800 mb-2">Udało się!</h3>
            <p className="text-center text-gray-500 mb-8 max-w-sm">Zapisaliśmy Twój skarb i dodaliśmy zdjęcie do galerii.</p>
            <button onClick={() => { setStep(1); setPreview(null); }} className="px-8 py-4 bg-gray-900 text-white rounded-full font-bold shadow-xl hover:bg-gray-800 transition-all">
              DODAJ KOLEJNY OBIEKT
            </button>
          </div>
        )}
      </div>
    </div>
  );
}