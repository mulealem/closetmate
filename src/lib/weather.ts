const BASE_URL = 'https://api.open-meteo.com/v1';
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1';

export interface WeatherData {
  temperature: number;
  condition: string;
  description: string;
  humidity: number;
  windSpeed: number;
  icon: string;
  city: string;
}

// Weather code to condition mapping for Open-Meteo
const getWeatherCondition = (weatherCode: number): { condition: string; description: string; icon: string } => {
  // Open-Meteo weather codes: https://open-meteo.com/en/docs
  if (weatherCode === 0) return { condition: 'Clear', description: 'clear sky', icon: '01d' };
  if (weatherCode <= 3) return { condition: 'Clouds', description: 'partly cloudy', icon: '02d' };
  if (weatherCode <= 48) return { condition: 'Fog', description: 'fog', icon: '50d' };
  if (weatherCode <= 57) return { condition: 'Drizzle', description: 'light drizzle', icon: '09d' };
  if (weatherCode <= 67) return { condition: 'Rain', description: 'rain', icon: '10d' };
  if (weatherCode <= 77) return { condition: 'Snow', description: 'snow', icon: '13d' };
  if (weatherCode <= 82) return { condition: 'Rain', description: 'rain showers', icon: '09d' };
  if (weatherCode <= 86) return { condition: 'Snow', description: 'snow showers', icon: '13d' };
  if (weatherCode <= 99) return { condition: 'Thunderstorm', description: 'thunderstorm', icon: '11d' };
  return { condition: 'Unknown', description: 'unknown', icon: '01d' };
};

export async function getWeatherByCity(city: string): Promise<WeatherData | null> {
  try {
    // First, get coordinates for the city using Open-Meteo's geocoding API
    const geocodingResponse = await fetch(
      `${GEOCODING_URL}/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );

    if (!geocodingResponse.ok) {
      throw new Error(`Geocoding API error: ${geocodingResponse.status}`);
    }

    const geocodingData = await geocodingResponse.json();
    
    if (!geocodingData.results || geocodingData.results.length === 0) {
      throw new Error('City not found');
    }

    const location = geocodingData.results[0];
    const { latitude, longitude, name, country } = location;

    // Get weather data using coordinates
    return await getWeatherByCoords(latitude, longitude, `${name}, ${country}`);
  } catch (error) {
    console.error('Failed to fetch weather data by city:', error);
    return null;
  }
}

export async function getWeatherByCoords(lat: number, lon: number, cityName?: string): Promise<WeatherData | null> {
  try {
    const response = await fetch(
      `${BASE_URL}/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();
    const current = data.current;

    if (!current) {
      throw new Error('No current weather data available');
    }

    const weatherInfo = getWeatherCondition(current.weather_code);

    return {
      temperature: Math.round(current.temperature_2m),
      condition: weatherInfo.condition,
      description: weatherInfo.description,
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m * 10) / 10, // Round to 1 decimal
      icon: weatherInfo.icon,
      city: cityName || 'Current Location',
    };
  } catch (error) {
    console.error('Failed to fetch weather data by coordinates:', error);
    return null;
  }
}

// Get user's current location using browser geolocation
export function getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let errorMessage = 'Failed to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
}