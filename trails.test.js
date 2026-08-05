import { 
    Trail } from './trails.js';

describe('Trail scoring and warnings', () => {
    const trail = new Trail({
        name: 'Mt Longonot Summit',
        city: 'Nakuru',
        region: 'Nakuru',
        latitude: -0.9225,
        longitude: 36.3989,
        distanceKm: 21,
        durationHours: 6,
        difficulty: 'Hard',
        terrain: 'Crater rim',
        features: ['volcano', 'lake views', 'ridges'],
    });

    test('calculateScore returns 100 for safe weather', () => {
        const score = trail.calculateScore({ precipitation: 0, windSpeed: 5, uvIndex: 3, visibility: 10 });
        expect(score).toBe(100);
    });

    test('calculateScore reduces points for heavy rain, wind, high UV, and low visibility', () => {
        const weather = { precipitation: 70, windSpeed: 40, uvIndex: 10, visibility: 2 };
        const score = trail.calculateScore(weather);
        expect(score).toBe(20);
    });

    test('generateWarnings includes expected warnings for dangerous weather', () => {
        const warnings = trail.generateWarnings({ precipitation: 70, windSpeed: 40, uvIndex: 10, visibility: 2 });
        expect(warnings).toEqual([
            'Heavy rain expected.',
            'Strong winds may impact your hike.',
            'UV index is high—use sunscreen and a hat.',
            'Low visibility conditions expected.',
        ]);
    });

    test('classifyScore returns Excellent when score is 95', () => {
        expect(Trail.classifyScore(95)).toBe('Excellent');
    });

    test('classifyScore returns Good when score is 75', () => {
        expect(Trail.classifyScore(75)).toBe('Good');
    });

    test('classifyScore returns Caution when score is 60', () => {
        expect(Trail.classifyScore(60)).toBe('Caution');
    });

    test('classifyScore returns Avoid when score is 35', () => {
        expect(Trail.classifyScore(35)).toBe('Avoid');
    });
});
