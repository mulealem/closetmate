import React from 'react';
import { Cloud, CloudRain, Sun, CloudSnow, Wind, Thermometer } from 'lucide-react';
import type { WeatherData } from '../lib/weather';

interface WeatherCardProps {
  weather: WeatherData;
}

export default function WeatherCard({ weather }: WeatherCardProps) {
  const getWeatherIcon = (condition: string) => {
    const c = condition.toLowerCase();
    if (c.includes('rain') || c.includes('drizzle')) return CloudRain;
    if (c.includes('snow')) return CloudSnow;
    if (c.includes('cloud')) return Cloud;
    if (c.includes('clear') || c.includes('sun')) return Sun;
    return Cloud;
  };

  const getWeatherColor = (condition: string) => {
    const c = condition.toLowerCase();
    if (c.includes('rain') || c.includes('drizzle')) return 'text-blue-500';
    if (c.includes('snow')) return 'text-blue-300';
    if (c.includes('cloud')) return 'text-gray-400';
    if (c.includes('clear') || c.includes('sun')) return 'text-yellow-500';
    return 'text-gray-400';
  };

  const Icon = getWeatherIcon(weather.condition);
  const iconColor = getWeatherColor(weather.condition);

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-purple-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{weather.city}</h3>
          <p className="text-sm text-gray-600 capitalize">{weather.description}</p>
        </div>
        <Icon className={`h-8 w-8 ${iconColor}`} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Thermometer className="h-4 w-4 text-red-500" />
          <span className="text-2xl font-bold text-gray-800">{weather.temperature}°C</span>
        </div>
        <div className="flex items-center space-x-2">
          <Wind className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">{weather.windSpeed} m/s</span>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        Humidity: {weather.humidity}%
      </div>
    </div>
  );
}