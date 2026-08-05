// Trail holds all the details for a single hiking route.
export class Trail {
    constructor(data = {}) {
        this.name = data.name;
        this.city = data.city;
        this.region = data.region;
        this.latitude = data.latitude;
        this.longitude = data.longitude;
        this.distanceKm = data.distanceKm;
        this.durationHours = data.durationHours;
        this.difficulty = data.difficulty;
        this.terrain = data.terrain;
        this.features = data.features || [];
        // Preserve additional mock-data fields used by the UI
        this.averageWindSpeed = data.averageWindSpeed;
        this.windAdv = data.windAdv;
        this.rainIntensity = data.rainIntensity;
        this.rainAccumulation = data.rainAccumulation;
        this.visibility = data.visibility;
        this.forecastDesc = data.forecastDesc;
        this.forecastTemp = data.forecastTemp;
        this.forecastSub = data.forecastSub;
        this.hourlyForecast = data.hourlyForecast;
        this.riskOverview = data.riskOverview;
    }

    // Give a ride-or-not score based on basic weather conditions.
    calculateScore(weather = {}) {
        const {
            precipitation = 0,
            windSpeed = 0,
            uvIndex = 0,
            visibility = 10,
        } = weather;

        let score = 100;
        if (precipitation > 60) score -= 30;
        if (windSpeed > 35) score -= 20;
        if (uvIndex > 9) score -= 10;
        if (visibility < 4) score -= 20;
        return Math.max(0, Math.min(100, score));
    }

    // Make a list of warnings based on weather thresholds.
    generateWarnings(weather = {}) {
        const { precipitation = 0, windSpeed = 0, uvIndex = 0, visibility = 10 } = weather;
        const warnings = [];

        if (precipitation > 60) warnings.push('Heavy rain expected.');
        if (windSpeed > 35) warnings.push('Strong winds may impact your hike.');
        if (uvIndex > 9) warnings.push('UV index is high—use sunscreen and a hat.');
        if (visibility < 4) warnings.push('Low visibility conditions expected.');

        return warnings;
    }

    // Return a short phrase that describes how hard the trail is.
    estimateDifficulty() {
        const base = {
            Easy: 'Beginner friendly',
            Moderate: 'Intermediate challenge',
            Hard: 'Advanced trail',
            Expedition: 'Expert only',
        };
        return base[this.difficulty] || 'Unknown difficulty';
    }

    // Create a saved trip record with some default values.
    saveTrip(overrides = {}) {
        const defaults = {
            experience: 'Intermediate',
            groupSize: 2,
            duration: 'Half Day',
            fitnessLevel: 'Moderate',
        };
        const trip = {
            id: `trip-${Date.now()}`,
            trail: this.name,
            city: this.city,
            region: this.region,
            distanceKm: this.distanceKm,
            durationHours: this.durationHours,
            difficulty: this.difficulty,
            terrain: this.terrain,
            features: [...this.features],
            ...defaults,
            ...overrides,
        };
        return trip;
    }

    // Find only easy trails in a list.
    static filterBeginnerTrails(trails = []) {
        return trails.filter((trail) => trail.difficulty === 'Easy');
    }

    // Build a simple alert object from a title and warning lines.
    static createAlert(title, ...warnings) {
        return {
            title,
            warnings,
        };
    }

    // Turn a numeric score into a human-friendly category.
    static classifyScore(score) {
        if (score >= 90) return 'Excellent';
        if (score >= 70) return 'Good';
        if (score >= 50) return 'Caution';
        return 'Avoid';
    }

    // Average a list of numbers, or return zero when the input is empty.
    static averageMetric(values = []) {
        if (!values.length) return 0;
        return values.reduce((sum, item) => sum + item, 0) / values.length;
    }
}
