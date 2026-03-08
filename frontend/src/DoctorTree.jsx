import React, { useState } from 'react';

export default function DoctorTree({ onClose }) {
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('http://localhost:5000/api/doctortree', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.detail || "Nie udało się przeanalizować zdjęcia.");
      
      setResult(data.diagnosis);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isHealthy = result?.status === 'ZDROWE';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade">
      
      {/* KLUCZOWA ZMIANA: max-h-[90vh] ogranicza wysokość okna, wymuszając pojawienie się suwaka */}
      <div className="bg-white rounded-[3rem] w-full max-w-lg max-h-[90vh] shadow-2xl overflow-hidden flex flex-col relative">
        
        {/* Przycisk Zamknij (X) - wyciągnięty na samą górę, z wysokim z-index i białym kolorem */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-xl text-white font-black transition-all z-20"
          title="Zamknij"
        >
          ✕
        </button>

        {/* HEADER - zablokowany przed kurczeniem (shrink-0) */}
        <div className="p-8 pb-6 bg-gradient-to-r from-teal-500 to-emerald-600 text-white shrink-0 relative">
          <div className="text-5xl mb-4 drop-shadow-md">🩺🌳</div>
          <h2 className="text-3xl font-black tracking-tight drop-shadow-sm pr-8">DoctorTree AI</h2>
          <p className="opacity-90 font-medium mt-2">Wgraj zdjęcie liścia, kory lub całego drzewa, a AI zdiagnozuje jego stan zdrowia.</p>
        </div>

        {/* ZAWARTOŚĆ (SCROLLOWALNA) */}
        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar bg-white">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl font-bold text-center text-sm border border-red-100">
              {error}
            </div>
          )}

          {/* UPLOAD ZDJĘCIA */}
          <div 
            onClick={() => document.getElementById('doctor-cam').click()}
            className="w-full h-56 rounded-[2rem] bg-gray-50 border-4 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all hover:border-teal-400 group relative shrink-0"
          >
            {preview ? (
              <>
                <img src={preview} className="w-full h-full object-cover opacity-90" alt="Podgląd" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white font-bold bg-black/50 px-4 py-2 rounded-full">Zmień zdjęcie</span>
                </div>
              </>
            ) : (
              <div className="text-center">
                <span className="text-4xl block mb-2 group-hover:scale-110 transition-transform">📸</span>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Wybierz zdjęcie do analizy</p>
              </div>
            )}
            <input id="doctor-cam" type="file" hidden accept="image/*" onChange={handleFileChange} />
          </div>

          {/* LOADER */}
          {loading && (
            <div className="mt-6 p-6 bg-teal-50 rounded-3xl border border-teal-100 flex items-center justify-center gap-4 animate-pulse shrink-0">
              <span className="animate-spin text-3xl">🔬</span>
              <p className="text-teal-900 font-bold text-sm tracking-widest uppercase">Trwa diagnoza AI...</p>
            </div>
          )}

          {/* WYNIKI AI */}
          {result && !loading && (
            <div className={`mt-6 p-6 rounded-3xl border ${isHealthy ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'} animate-fade shrink-0`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{isHealthy ? '✅' : '⚠️'}</span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Status drzewa</p>
                  <p className={`text-2xl font-black ${isHealthy ? 'text-emerald-700' : 'text-red-700'}`}>
                    {result.status}
                  </p>
                </div>
              </div>

              {!isHealthy && (
                <div className="flex flex-col gap-4 mt-6">
                  <div>
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">🐛 Rozpoznany Problem</p>
                    <p className="text-sm font-bold text-red-900 bg-white/50 p-4 rounded-xl leading-relaxed">{result.problem}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">🔍 Możliwa Przyczyna</p>
                    <p className="text-sm font-bold text-orange-900 bg-white/50 p-4 rounded-xl leading-relaxed">{result.cause}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">💊 Sugerowane Leczenie</p>
                    <p className="text-sm font-bold text-blue-900 bg-white/50 p-4 rounded-xl leading-relaxed">{result.treatment}</p>
                  </div>
                </div>
              )}

              {isHealthy && (
                <p className="text-sm font-bold text-emerald-800 bg-white/50 p-4 rounded-xl mt-2 text-center leading-relaxed">
                  Świetne wieści! To drzewo wygląda na w pełni zdrowe i pełne życia. Oby tak dalej! 🌿
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}