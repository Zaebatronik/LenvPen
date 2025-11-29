import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COUNTRIES } from '../data/locations';
import { APP_VERSION } from '../config/version';

function SelectCountry() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  
  const filteredCountries = COUNTRIES.filter(country =>
    country.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectCountry = (country) => {
    navigate('/select-city', { state: { country } });
  };

  return (
    <div className="min-h-screen bg-lenvpen-dark flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="max-w-2xl w-full space-y-6">
        <h1 className="text-3xl font-bold text-lenvpen-text text-center">
          Выбери свою страну
        </h1>

        <p className="text-lg text-lenvpen-muted text-center">
          Начни вводить название страны для поиска
        </p>

        {/* Поиск */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Поиск страны..."
          className="w-full p-4 bg-lenvpen-bg text-lenvpen-text rounded-lg border border-lenvpen-border focus:border-lenvpen-orange outline-none transition-colors text-lg"
          autoFocus
        />

        {/* Список стран */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredCountries.map((country) => (
            <button
              key={country}
              onClick={() => handleSelectCountry(country)}
              className="w-full p-4 bg-lenvpen-card text-lenvpen-text rounded-lg hover:bg-lenvpen-orange hover:text-white transition-colors text-left text-lg font-medium"
            >
              {country}
            </button>
          ))}
          {filteredCountries.length === 0 && (
            <div className="text-center text-lenvpen-muted py-8">
              Страна не найдена
            </div>
          )}
        </div>

        <button
          onClick={() => navigate('/welcome')}
          className="btn-secondary w-full text-lg"
        >
          Назад
        </button>
      </div>

      {/* Версия */}
      <div className="absolute bottom-2 right-2 text-xs text-lenvpen-text opacity-30">
        {APP_VERSION}
      </div>
    </div>
  );
}

export default SelectCountry;
