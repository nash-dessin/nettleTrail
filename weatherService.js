// Turn raw weather numbers into a simple safety score from 0 to 100.
export function calculateScore(weather = {}) {
    const { precipitation = 0, windSpeed = 0, uvIndex = 0, visibility = 10 } = weather;

    let score = 100;
    if (precipitation > 60) score -= 30;
    if (windSpeed > 35) score -= 20;
    if (uvIndex > 9) score -= 10;
    if (visibility < 4) score -= 20;
    return Math.max(0, Math.min(100, score));
}

// WeatherService handles building the API URL, fetching weather data, and cleaning the result.
class WeatherService {
    constructor() {
        this.defaultWeather = {
            temperature: 18,
            humidity: 50,
            windSpeed: 12,
            uvIndex: 3,
            precipitation: 0,
            visibility: 10,
        };
    }

    // Create the Open-Meteo request URL for a location and selected daily fields.
    buildApiUrl(latitude, longitude, dailyParams = []) {
        const base = 'https://api.open-meteo.com/v1/forecast';
        const daily = encodeURIComponent(dailyParams.join(','));
        return `${base}?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&daily=${daily}&timezone=auto`;
    }

    // Fetch JSON from the weather API and cancel if it takes too long.
    async fetchWithTimeout(url, timeout = 12000) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timer);
            if (!response.ok) {
                throw new Error(`Weather API request failed: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            clearTimeout(timer);
            throw error;
        }
    }

    // Fetch the weather and normalize the data into the app's expected shape.
    async fetchWeather(latitude, longitude, dailyParams = []) {
        const url = this.buildApiUrl(latitude, longitude, dailyParams);
        const raw = await this.fetchWithTimeout(url);
        return this.processWeather(raw);
    }

    // Turn the raw API response into a clean weather object the app can use.
    processWeather(raw) {
        const daily = raw.daily || {};
        const precipitation = daily.precipitation_sum || [];
        const temperatureMax = daily.temperature_2m_max || [];
        const temperatureMin = daily.temperature_2m_min || [];
        const uvIndex = daily.uv_index_max || [];
        const weatherCode = daily.weather_code || [];
        const precipitationHours = daily.precipitation_hours || [];

        const time = daily.time || [];
        const average = (values = []) => {
            if (!values.length) return 0;
            return values.reduce((sum, value) => sum + value, 0) / values.length;
        };

        const processed = {
            time,
            precipitation,
            precipitationHours,
            temperatureMax,
            temperatureMin,
            uvIndex,
            weatherCode,
            averagePrecipitation: average(precipitation),
            averageTemperature: average([...temperatureMax, ...temperatureMin]),
            averageUvIndex: average(uvIndex),
            averageVisibility: 10,
            windSpeed: this.defaultWeather.windSpeed,
        };

        return {
            ...this.defaultWeather,
            ...processed,
            weatherSummary: {
                temperature: Math.round(processed.averageTemperature),
                uvIndex: Math.round(processed.averageUvIndex),
                precipitation: Number(processed.averagePrecipitation.toFixed(1)),
            },
        };
    }

    // Add common unit conversions so the UI can show Fahrenheit, miles per hour, and inches.
    convertUnits(weather = {}) {
        const { temperature = 0, windSpeed = 0, precipitation = 0 } = weather;
        return {
            ...weather,
            temperatureF: Math.round((temperature * 9) / 5 + 32),
            windMph: +(windSpeed * 0.621371).toFixed(1),
            precipitationInches: +(precipitation * 0.0393701).toFixed(2),
        };
    }
}
