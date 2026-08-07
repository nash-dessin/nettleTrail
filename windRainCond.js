// Read the trail wind speed from the data, even if it's stored as text.
function parseWindSpeed(trail) {
  if (!trail) {
    return 0;
  }

  const rawValue = trail.averageWindSpeed || trail.weather?.current?.wind;
  if (typeof rawValue === 'number') {
    return rawValue;
  }

  const match = String(rawValue || '').match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

// Turn a wind number into a simple label like Calm, Moderate, or Dangerous.
function getWindCategory(speed) {
  const value = Number(speed) || 0;

  if (value <= 5) {
    return 'Calm';
  }

  if (value <= 15) {
    return 'Light Breeze';
  }

  if (value <= 25) {
    return 'Moderate';
  }

  if (value <= 40) {
    return 'Strong';
  }

  return 'Dangerous';
}

// Give a short safety tip based on how strong the wind is.
function getWindAdvice(speed) {
  const category = getWindCategory(speed);

  switch (category) {
    case 'Calm':
      return 'Enjoy calm conditions and keep a steady pace.';
    case 'Light Breeze':
      return 'Keep pack secure and expect mild gusts.';
    case 'Moderate':
      return 'Secure loose gear and watch exposed ridges.';
    case 'Strong':
      return 'Avoid exposed ridges and use extra caution.';
    case 'Dangerous':
      return 'Postpone the hike if conditions worsen.';
    default:
      return 'Stay alert to changing winds.';
  }
}

// Turn a rain chance value into a quick explanation of what to expect.
function interpretRainChance(chance, description = '') {
  const value = Number(chance) || 0;
  const lowerDescription = String(description || '').toLowerCase();

  if (value >= 60 || /storm|thunder|heavy/i.test(lowerDescription)) {
    return ['Heavy rainfall likely.', 'Avoid exposed trails.'];
  }

  if (value >= 20 || /rain|shower/i.test(lowerDescription)) {
    return ['Scattered showers possible.', 'Waterproof footwear recommended.'];
  }

  return ['Clear weather expected.', 'Enjoy the trail with minimal weather concerns.'];
}

// Convert rain accumulation text into an easy label like Low, Moderate, or High.
function getRainAccumulationLabel(trail) {
  const value = trail?.rainAccumulation || trail?.weather?.current?.precipitation;

  if (!value) {
    return '—';
  }

  const normalized = String(value).toLowerCase();

  if (/significant|heavy|high/.test(normalized)) {
    return 'High accumulation';
  }

  if (/moderate|medium/.test(normalized)) {
    return 'Moderate accumulation';
  }

  if (/minimal|low|light/.test(normalized)) {
    return 'Low accumulation';
  }

  return value;
}

// Load the trail data and fill the Wind & Rain page with current values and advice.
async function initWindRainPage() {
  try {
    const resp = await fetch('mockTrailData.json');
    if (!resp.ok) return;
    const data = await resp.json();
    const regionSelect = document.getElementById('city-select');
    const region = regionSelect?.value || data[0]?.region;
    const trail = data.find((t) => t.region === region) || data[0];

    const windMetricEl = document.getElementById('wind-metric-speed');
    const windAdviceEl = document.getElementById('wind-advice');
    const rainIntensityEl = document.getElementById('rain-intensity');
    const rainTotalEl = document.getElementById('rain-total');
    const rainHoursEl = document.getElementById('rain-hours');

    const current = trail?.weather?.current || {};
    const wind = parseWindSpeed(trail) || current.wind || 0;

    if (windMetricEl) windMetricEl.textContent = `${wind} km/h`;
    if (windAdviceEl) windAdviceEl.textContent = getWindAdvice(wind);

    // Rain info
    if (rainIntensityEl) {
      // prefer descriptive label from trail, otherwise interpret chance
      rainIntensityEl.textContent = trail.rainIntensity || interpretRainChance(current.precipitation, current.description)[0];
    }

    if (rainTotalEl) {
      rainTotalEl.textContent = getRainAccumulationLabel(trail);
    }

    if (rainHoursEl) {
      const hourly = trail?.weather?.hourly || trail?.hourlyForecast || [];
      rainHoursEl.innerHTML = hourly.map((h) => `
        <div class="hourly-point">
          <span>${h.time}</span>
          <strong>${h.condition}</strong>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Could not initialize Wind & Rain page:', err);
  }
}

export {
  getRainAccumulationLabel,
  getWindAdvice,
  getWindCategory,
  interpretRainChance,
  parseWindSpeed,
  initWindRainPage,
};

// auto-init when this module is loaded on the Wind & Rain page
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initWindRainPage();
  });
}
