import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CITIES } from '../data/locations';
import { APP_VERSION } from '../config/version';

function SelectCity() {
  const navigate = useNavigate();
  const location = useLocation();
  const country = location.state?.country;
  
  const [search, setSearch] = useState('');
  
  if (!country) {
    navigate('/select-country');
    return null;
  }

  const cities = CITIES[country] || [];
  const filteredCities = cities.filter(city =>
    city.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectCity = (city) => {
    navigate('/set-nickname', { state: { country, city } });
  };

  return (
    <div className="min-h-screen bg-lenvpen-dark flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="max-w-2xl w-full space-y-6">
        <h1 className="text-3xl font-bold text-lenvpen-text text-center">
          Выбери свой город
        </h1>

        <p className="text-lg text-lenvpen-muted text-center">
          Страна: <span className="text-lenvpen-orange font-medium">{country}</span>
        </p>

        {/* Поиск */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Поиск города..."
          className="w-full p-4 bg-lenvpen-bg text-lenvpen-text rounded-lg border border-lenvpen-border focus:border-lenvpen-orange outline-none transition-colors text-lg"
          autoFocus
        />

        {/* Список городов */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredCities.map((city) => (
            <button
              key={city}
              onClick={() => handleSelectCity(city)}
              className="w-full p-4 bg-lenvpen-card text-lenvpen-text rounded-lg hover:bg-lenvpen-orange hover:text-white transition-colors text-left text-lg font-medium"
            >
              {city}
            </button>
          ))}
          {filteredCities.length === 0 && (
            <div className="text-center text-lenvpen-muted py-8">
              Город не найден
            </div>
          )}
        </div>

        <button
          onClick={() => navigate('/select-country')}
          className="btn-secondary w-full text-lg"
        >
          Назад к выбору страны
        </button>
      </div>

      {/* Версия */}
      <div className="absolute bottom-2 right-2 text-xs text-lenvpen-text opacity-30">
        {APP_VERSION}
      </div>
    </div>
  );
}

export default SelectCity;
