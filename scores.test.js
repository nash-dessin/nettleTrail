const {
  getEstimatedFinish,
  getRecommendedStart
} = require('./scores');


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

  expect(getRecommendedStart(trail)).toBe('6:30 AM');
  expect(getEstimatedFinish(trail, { recommendedStart: '6:30 AM' })).toBe('11:30 AM');
});
