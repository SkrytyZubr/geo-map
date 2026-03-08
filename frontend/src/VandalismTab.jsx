import React, { useState } from 'react';

// Odbieramy props initialObjectName oraz nowo dodany onSuccess
export default function VandalismTab({ initialObjectName = '', onSuccess }) {
  const [step, setStep] = useState(1);
  
  // Wrzucamy przekazaną nazwę jako wartość domyślną
  const [formData, setFormData] = useState({
    objectName: initialObjectName, 
    dangerType: 'Śmieci / Dzikie wysypisko 🗑️',
    description: '',
    image: null
  });
  
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Walidacja: Upewniamy się, że użytkownik dodał zdjęcie
    if (!formData.image) {
        setErrorMessage('Zdjęcie jest wymagane jako dowód zgłoszenia!');
        return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    // Tworzymy obiekt FormData, by móc wysłać plik ze zdjęciem do backendu
    const submitData = new FormData();
    submitData.append("image", formData.image);
    submitData.append("objectName", formData.objectName);
    submitData.append("dangerType", formData.dangerType);
    submitData.append("description", formData.description);

    try {
      // Właściwe zapytanie do serwera
      const response = await fetch('http://localhost:5000/api/vandalism', {
        method: 'POST',
        body: submitData
      });

      if (response.ok) {
        setStep(2); // Przejdź do ekranu sukcesu
        
        // Pokaż ekran sukcesu przez 3 sekundy, a potem odśwież aplikację i wróć do mapy
        setTimeout(() => {
            if (onSuccess) onSuccess(); 
        }, 3000);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.detail || "Wystąpił błąd podczas wysyłania zgłoszenia.");
      }
    } catch (error) {
      console.error("Błąd sieci:", error);
      setErrorMessage("Nie udało się połączyć z serwerem. Sprawdź połączenie.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 2) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-white rounded-[2.5rem] shadow-inner border border-red-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-orange-500 to-red-500"></div>
        <div className="max-w-md text-center animate-fade">
          <div className="w-24 h-24 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 shadow-inner animate-pulse">
            🚨
          </div>
          <h2 className="text-3xl font-black text-gray-800 mb-4">Zgłoszenie przyjęte!</h2>
          <p className="text-gray-600 mb-4 font-medium leading-relaxed">
            Dziękujemy za Twoją czujność. Informacje o zagrożeniu obiektu <strong className="text-gray-800">"{formData.objectName}"</strong> zostały natychmiast przekazane do bazy danych.
          </p>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-6">
            Zaraz zostaniesz przeniesiony na mapę...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
      <div className="max-w-3xl mx-auto bg-white rounded-[2.5rem] shadow-xl border border-red-100 overflow-hidden relative">
        
        <div className="w-full h-3 bg-gradient-to-r from-red-600 via-orange-500 to-red-600"></div>

        <div className="p-8 md:p-12">
          <div className="mb-8">
            <span className="inline-block px-4 py-1.5 bg-red-100 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
              Strażnik Natury
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-800 mb-3">Zgłoś Wandalizm ⚠️</h2>
            <p className="text-gray-500 font-medium">
              Widzisz zniszczony pomnik przyrody? Śmieci, połamane gałęzie, a może ślady po ognisku? 
              Zgłoś to natychmiast, abyśmy mogli powiadomić odpowiednie służby ratunkowe.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 font-bold text-sm rounded-r-xl">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Dowód zniszczeń (Zdjęcie)</label>
              <label className="block w-full h-48 border-2 border-dashed border-red-200 bg-red-50/50 rounded-3xl hover:bg-red-50 transition-colors cursor-pointer relative overflow-hidden group">
                {imagePreview ? (
                  <img src={imagePreview} alt="Podgląd" className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 group-hover:text-red-500 transition-colors">
                    <span className="text-4xl mb-2">📸</span>
                    <span className="font-bold text-sm">Kliknij, aby dodać zdjęcie (Wymagane)</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} required />
              </label>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Gdzie to się stało? (Nazwa obiektu / Lokalizacja)</label>
              <input 
                type="text" 
                required
                placeholder="np. Gruby Dąb w Oliwie..." 
                className="w-full bg-gray-50 border border-gray-200 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-400 font-bold text-emerald-800 transition-all"
                value={formData.objectName}
                onChange={e => setFormData({...formData, objectName: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Rodzaj Zagrożenia</label>
              <div className="relative">
                <select 
                  className="w-full bg-gray-50 border border-gray-200 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-400 font-bold text-gray-700 appearance-none cursor-pointer transition-all"
                  value={formData.dangerType}
                  onChange={e => setFormData({...formData, dangerType: e.target.value})}
                >
                  <option>Śmieci / Dzikie wysypisko 🗑️</option>
                  <option>Uszkodzenie mechaniczne (kora/gałęzie) 🪓</option>
                  <option>Pożar / Ślady ogniska 🔥</option>
                  <option>Choroba / Szkodniki 🐛</option>
                  <option>Inne zagrożenie ❓</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-6 text-gray-500">▼</div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Opisz sytuację</label>
              <textarea 
                required
                rows="4" 
                placeholder="Podaj więcej szczegółów... (np. leży sterta opon, ktoś wyciął gałęzie)" 
                className="w-full bg-gray-50 border border-gray-200 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-400 font-medium resize-none transition-all"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              ></textarea>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`w-full py-5 rounded-[1.5rem] font-black text-sm tracking-widest uppercase text-white shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-3 ${
                isSubmitting ? 'bg-gray-400 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-red-500 to-orange-600 hover:shadow-red-200 hover:-translate-y-1'
              }`}
            >
              {isSubmitting ? 'Wysyłanie zgłoszenia...' : <><span className="text-xl">🚨</span> Wyślij Alert do Służb</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}