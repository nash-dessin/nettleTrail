import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTrailReadiness, getEstimatedFinish, getRecommendedStart } from './scores.js';

test('calculateTrailReadiness scores a moderate trail using weather and planner inputs', () => {
  const trail = {
    name: 'Ngong Hills Trail',
    difficulty: 'Moderate',
    distanceKm: 20,
    durationHours: 5,
    weather: {
      current: {
        temp: 20,
        wind: 12,
        precipitation: 10,
      },
    },
  };

  const score = calculateTrailReadiness(trail, { experience: 'Beginner', groupSize: 3, duration: 'Full Day' });
  assert.equal(score, 82);
});

test('getRecommendedStart and getEstimatedFinish return planner-friendly times', () => {
  const trail = {
    name: 'Mt Longonot Summit',
    difficulty: 'Hard',
    durationHours: 5,
    weather: {
      current: {
        temp: 18,
        wind: 12,
        precipitation: 10,
      },
    },
  };

  assert.equal(getRecommendedStart(trail), '6:30 AM');
  assert.equal(getEstimatedFinish(trail, { recommendedStart: '6:30 AM' }), '11:30 AM');
});
