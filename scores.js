// Take the trail details and planner choices, then return a simple readiness score out of 100.
function calculateTrailReadiness(trail, planner = {}) {
  if (!trail) {
    return 0;
  }

  const weather = trail.weather?.current || {};
  const distance = Number(trail.distanceKm) || 0;
  const duration = Number(trail.durationHours) || 0;
  const difficultyFactor = trail.difficulty === 'Hard' ? 0.9 : trail.difficulty === 'Moderate' ? 1 : 1.05;
  const experienceFactor = planner.experience === 'Advanced' ? 0.9 : planner.experience === 'Intermediate' ? 1 : 0.95;
  const groupFactor = Number(planner.groupSize) > 3 ? 0.95 : 1;
  const durationFactor = planner.duration === 'Multi-Day' ? 0.9 : planner.duration === 'Scenic trip' ? 1.02 : 1;

  const distancePenalty = Math.max(0, distance - 10) * 0.7;
  const durationPenalty = Math.max(0, duration - 3) * 1.8;
  const precipitationPenalty = Math.max(0, (Number(weather.precipitation) || 0) - 5) * 0.4;
  const windPenalty = Math.max(0, (Number(weather.wind) || 0) - 8) * 0.25;

  const rawScore = 100 - distancePenalty - durationPenalty - precipitationPenalty - windPenalty;
  const adjustedScore = rawScore * difficultyFactor * experienceFactor * groupFactor * durationFactor;

  return Math.max(0, Math.min(100, Math.round(adjustedScore)));
}

// Suggest a start time based on the trail's weather and conditions.
function getRecommendedStart(trail) {
  if (!trail) {
    return '6:30 AM';
  }

  const weather = trail.weather?.current || {};
  const isCold = Number(weather.temp) <= 8;
  const isRainy = Number(weather.precipitation) >= 20;
  const isWindy = Number(weather.wind) >= 20;

  if (isRainy || isWindy) {
    return '7:00 AM';
  }

  if (isCold) {
    return '7:30 AM';
  }

  return '6:30 AM';
}

// Take the planned start time and hike duration, then estimate when the hike will finish.
function getEstimatedFinish(trail, planner = {}) {
  if (!trail) {
    return '—';
  }

  const durationHours = Number(trail.durationHours) || 4;
  const start = planner.recommendedStart || getRecommendedStart(trail);

  const match = String(start).match(/(\d+):(\d+)\s*(AM|PM)?/i);
  const hourPart = match?.[1];
  const minutePart = match?.[2];
  const suffix = match?.[3];
  if (!hourPart) {
    return '—';
  }

  let hour = Number(hourPart);
  const minute = Number(minutePart || 0);
  const meridiem = (suffix || '').toUpperCase();

  if (meridiem === 'PM' && hour < 12) {
    hour += 12;
  } else if (meridiem === 'AM' && hour === 12) {
    hour = 0;
  }

  const totalMinutes = hour * 60 + minute + durationHours * 60;
  const finishHour = Math.floor(totalMinutes / 60) % 24;
  const finishMinute = totalMinutes % 60;
  const finishMeridiem = finishHour >= 12 ? 'PM' : 'AM';
  const normalizedHour = finishHour % 12 || 12;

  return `${normalizedHour}:${String(finishMinute).padStart(2, '0')} ${finishMeridiem}`;
}

module.exports = {
  getEstimatedFinish,
  getRecommendedStart,
};
