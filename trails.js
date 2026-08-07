import {
  calculateTrailReadiness,
  getEstimatedFinish,
  getRecommendedStart,
} from './scores.js';

let trailWeatherData = [];
let generatedAlerts = [];

const regionSelect = document.getElementById('city-select');
const trailSelect = document.getElementById('trail-select');
const trailSummaryContent = document.getElementById('trail-summary-content');
const readinessPercentageEl = document.getElementById('readiness-percentage');
const recommendedStartEl = document.getElementById('recommended-start');
const estimatedFinishEl = document.getElementById('estimated-finish');
const plannerAlertsEl = document.getElementById('planner-alerts');
const experienceSelect = document.getElementById('experience');
const groupSizeSelect = document.getElementById('group-size');
const durationSelect = document.getElementById('duration');
const tripDateInput = document.getElementById('trip-date');

const forecastDescriptionEl = document.getElementById('forecast-description');
const forecastTempEl = document.getElementById('forecast-temp');
const trailNameEl = document.getElementById('trail-name');
const altitudeEl = document.getElementById('altitude');
const feelsLikeEl = document.getElementById('feels-like');
const windSpeedEl = document.getElementById('wind-speed');
const hourlyChartEl = document.getElementById('hourly-chart');

const riskBadgeEl = document.getElementById('risk-badge');
const riskDescriptionEl = document.getElementById('risk-description');
const riskCopyEl = document.getElementById('risk-copy');

const metricTempEl = document.getElementById('metric-temp');
const metricWindEl = document.getElementById('metric-wind');
const metricPrecipEl = document.getElementById('metric-precip');
const metricVisibilityEl = document.getElementById('metric-visibility');
const currentConditionsEl = document.getElementById('current-conditions');
const sevenDayEl = document.getElementById('seven-day');

const elevationMetric = document.getElementById('elevation-metric');
const elevationMeta = document.getElementById('elevation-meta');
const highestPointEl = document.getElementById('highest-point');
const elevationGainEl = document.getElementById('elevation-gain');
const locationPhotoContainer = document.getElementById('location-photo');

let regionImageRotation = {
  currentRegion: '',
  images: [],
  index: 0,
  timer: null,
};

// Loading trail data from the local JSON file, then fill the page controls and show the first region.
async function loadWeatherData() {
  try {
    const response = await fetch('mockTrailData.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    trailWeatherData = await response.json();
    populateRegionSelector();
    // building and rendering alerts for the Alerts page
    buildAlerts();
    renderAlertsList();
    attachAlertFilters();

    const initialRegion = regionSelect?.value || trailWeatherData[0]?.region;
    populateTrailSelector(initialRegion);
    updateTrailDetails(initialRegion);
  } catch (error) {
    console.error('Could not load trail data:', error);
    if (trailSummaryContent) {
      trailSummaryContent.innerHTML = '<p class="summary-empty">Unable to load trail details right now.</p>';
    }
  }
}

// Filling the region dropdown with all available regions from the loaded trail data.
function populateRegionSelector() {
  if (!regionSelect || !Array.isArray(trailWeatherData)) {
    return;
  }

  const regions = [...new Set(trailWeatherData.map((item) => item.region).filter(Boolean))];
  regionSelect.innerHTML = '';

  regions.forEach((region) => {
    const option = document.createElement('option');
    option.value = region;
    option.textContent = region;
    regionSelect.appendChild(option);
  });

  if (!regionSelect.value && regions.length) {
    regionSelect.value = regions[0];
  }
}

// Returning the list of trails that match the chosen region.
function trails(filter = {}) {
  if (!Array.isArray(trailWeatherData)) {
    return [];
  }

  return trailWeatherData.filter((trail) => {
    if (filter.region && trail.region !== filter.region && trail.county !== filter.region) {
      return false;
    }

    return true;
  });
}

// Creating alert messages for each trail based on the current weather values.
function buildAlerts() {
  if (!Array.isArray(trailWeatherData)) return [];
  generatedAlerts = trailWeatherData.flatMap((trail) => {
    const current = trail.weather?.current || {};
    const precip = Number(current.precipitation) || 0;
    const wind = Number(current.wind) || 0;
    const visibility = Number(current.visibility) || Infinity;
    const risk = (trail.riskOverview && trail.riskOverview.riskLevel) || '';

    const alerts = [];

    if (precip >= 30 || wind >= 35 || visibility <= 3 || /High/i.test(risk)) {
      alerts.push({ severity: 'severe', title: `${trail.name}: Severe conditions`, message: `Significant weather: precipitation ${precip}%, wind ${wind} km/h`, trail: trail.name });
    } else if (precip >= 20 || wind >= 25) {
      alerts.push({ severity: 'warning', title: `${trail.name}: Warning`, message: `Elevated weather: precipitation ${precip}%, wind ${wind} km/h`, trail: trail.name });
    } else if (precip >= 10 || wind >= 15) {
      alerts.push({ severity: 'caution', title: `${trail.name}: Caution`, message: `Some adverse conditions: precipitation ${precip}%, wind ${wind} km/h`, trail: trail.name });
    } else {
      alerts.push({ severity: 'info', title: `${trail.name}: Info`, message: `${trail.name} conditions are nominal.`, trail: trail.name });
    }

    return alerts;
  });

  return generatedAlerts;
}

// Showing the alerts on the alerts page, filtered by the selected severity levels.
function renderAlertsList(filterSeverities = new Set(['severe', 'warning', 'caution', 'info'])) {
  const listEl = document.getElementById('alerts-list');
  if (!listEl) return;
  const items = (generatedAlerts.length ? generatedAlerts : buildAlerts()).filter((a) => filterSeverities.has(a.severity));
  listEl.innerHTML = items.map((a) => `
    <div class="alert-item alert-${a.severity}">
      <strong>${a.title}</strong>
      <p>${a.message}</p>
    </div>
  `).join('');
}

// Read the alert filter checkboxes and return which severities are enabled.
function getSelectedFilters() {
  const severities = [];
  ['severe', 'warning', 'caution', 'info'].forEach((s) => {
    const el = document.getElementById(`filter-${s}`);
    if (el && el.checked) severities.push(s);
  });
  return new Set(severities);
}

// Wire up the alert filter checkboxes so the alerts update live when the user changes them.
function attachAlertFilters() {
  ['severe', 'warning', 'caution', 'info'].forEach((s) => {
    const el = document.getElementById(`filter-${s}`);
    if (el) el.addEventListener('change', () => renderAlertsList(getSelectedFilters()));
  });
}

// Pick the selected trail, or fall back to the first trail in the selected region.
function activeTrail(region, trailName) {
  const regionTrails = trails({ region });
  if (!regionTrails.length) {
    return null;
  }

  if (trailName) {
    const selected = regionTrails.find((trail) => trail.name === trailName);
    if (selected) {
      return selected;
    }
  }

  return regionTrails[0];
}

// Find a trail by its exact name.
function getTrailByName(name) {
  if (!name) {
    return null;
  }

  return trailWeatherData.find((item) => item.name === name) || null;
}

// Fill the trail dropdown for the selected region and choose a default trail.
function populateTrailSelector(region, selectedTrailName) {
  if (!trailSelect) {
    return;
  }

  const regionTrails = trails({ region });
  trailSelect.innerHTML = '';

  if (!regionTrails.length) {
    trailSelect.disabled = true;
    trailSelect.innerHTML = '<option value="">No trails available</option>';
    return;
  }

  trailSelect.disabled = false;
  regionTrails.forEach((trail) => {
    const option = document.createElement('option');
    option.value = trail.name;
    option.textContent = trail.name;
    trailSelect.appendChild(option);
  });

  const defaultTrail = selectedTrailName && regionTrails.some((trail) => trail.name === selectedTrailName)
    ? selectedTrailName
    : regionTrails[0].name;

  trailSelect.value = defaultTrail;
}

// Turn weather numbers into a simple trail risk label and explanation.
function calculateRisk(weather) {
  if (!weather || !weather.current) {
    return {
      badge: 'Low',
      description: 'No weather data available to calculate risk.',
      color: 'green',
    };
  }

  const { current } = weather;
  const description = current.description || '';
  const hasRain = current.precipitation >= 15 || /rain|shower|storm/i.test(description);
  const strongWind = current.wind >= 18;
  const hot = current.temp >= 28;

  if (hasRain) {
    return {
      badge: 'High',
      description: 'Heavy rain may impact trail conditions. Expect wet paths and limited visibility.',
      color: 'red',
    };
  }

  if (strongWind) {
    return {
      badge: 'Moderate',
      description: 'Wind speeds are elevated near exposed ridges.',
      color: 'orange',
    };
  }

  if (hot) {
    return {
      badge: 'Medium',
      description: 'Hot temperatures require extra hydration and sun protection.',
      color: 'yellow',
    };
  }

  return {
    badge: 'Low',
    description: 'Conditions are stable for hiking with little expected risk.',
    color: 'green',
  };
}

// Create easy-to-read advice notes based on the current weather.
function generateAdvice(weather) {
  if (!weather || !weather.current) {
    return ['Review trail conditions before departure.'];
  }

  const advice = [];
  const current = weather.current;
  const description = current.description || '';

  if (current.humidity >= 75) {
    advice.push('Stay hydrated. High humidity increases fatigue.');
  }

  if (current.precipitation >= 15 || /rain|shower|storm/i.test(description)) {
    advice.push('Waterproof footwear recommended.');
  }

  if (current.wind >= 18) {
    advice.push('Windproof layers advised. Gusts can be strong in exposed areas.');
  }

  if (current.temp <= 5) {
    advice.push('Wear warm layers. Cold conditions increase the risk of hypothermia.');
  }

  if (current.temp >= 28) {
    advice.push('Use sunscreen and drink water regularly.');
  }

  if (!advice.length) {
    advice.push('Comfortable hiking temperature.');
    advice.push('Carry a light jacket.');
    advice.push('Excellent visibility.');
  }

  return advice;
}


// Update the header panel with the selected trail’s summary weather details.
function renderHero(trail) {
  if (!trail) {
    return;
  }

  const { name, weather } = trail;
  const { current = {}, hourly = [] } = weather || {};
  const altitude = trail['highest pointM'];

  if (forecastDescriptionEl) {
    forecastDescriptionEl.textContent = current.description || trail.forecastDesc || '';
  }

  if (forecastTempEl) {
    forecastTempEl.textContent = current.temp != null ? `${current.temp}°C` : trail.forecastTemp || '';
  }

  if (trailNameEl) {
    trailNameEl.textContent = ` ${name}`;
  }

  if (altitudeEl) {
    altitudeEl.textContent = `${altitude} m`;
  }

  if (feelsLikeEl) {
    feelsLikeEl.textContent = current.feelsLike != null ? `Feels like ${current.feelsLike}°C` : '';
  }

  if (windSpeedEl) {
    windSpeedEl.textContent = current.wind != null ? `Wind ${current.wind} km/h` : '';
  }

  if (hourlyChartEl) {
    const hourlyItems = Array.isArray(hourly) ? hourly : trail.hourlyForecast || [];
    const filteredHourly = hourlyItems.filter((item) => {
      const match = String(item.time).match(/^(\d{1,2}):(\d{2})/);
      if (!match) {
        return false;
      }
      const hour = Number(match[1]);
      return hour <= 12;
    });

    hourlyChartEl.innerHTML = filteredHourly.map((item) => `
      <div class="hourly-point">
        <span>${item.time}</span>
        <strong>${item.temp}</strong>
      </div>
    `).join('');
  }
}

// Fill in the sidebar stats like temperature, wind and visibility.
function renderStats(trail) {
  if (!trail) {
    return;
  }

  const current = trail.weather?.current || {};

  if (metricTempEl) {
    metricTempEl.textContent = current.temp != null ? `${current.temp}°C` : trail.forecastTemp || '';
  }

  if (metricWindEl) {
    metricWindEl.textContent = current.wind != null ? `${current.wind} km/h` : trail.averageWindSpeed || '';
  }

  if (metricPrecipEl) {
    metricPrecipEl.textContent = current.precipitation != null ? `${current.precipitation}%` : trail.rainIntensity || '';
  }

  if (metricVisibilityEl) {
    metricVisibilityEl.textContent = current.visibility != null ? `${current.visibility} km` : trail.visibility || '';
  }
}

// Show the 7-day forecast cards for the selected trail.
function renderForecast(trail) {
  if (!sevenDayEl) {
    return;
  }

  const daily = trail.weather?.daily || [];
  if (!daily.length) {
    sevenDayEl.innerHTML = '<p>No 7-day forecast data available.</p>';
    return;
  }

  sevenDayEl.innerHTML = daily.map((day) => `
    <article class="forecast-mini-card">
      <span>${day.day}</span>
      <span class="forecast-emoji">${mapConditionToEmoji(day.condition)}</span>
      <span>${day.max}° / ${day.min}°</span>
    </article>
  `).join('');
}

// Display the trail risk badge and supporting text.
function renderRisk(trail) {
  const weather = trail.weather;
  const risk = calculateRisk(weather);

  if (riskBadgeEl) {
    riskBadgeEl.textContent = risk.badge;
    riskBadgeEl.className = `risk-badge ${risk.badge.toLowerCase()}`;
  }

  if (riskDescriptionEl) {
    riskDescriptionEl.textContent = risk.description;
  }

  if (riskCopyEl) {
    riskCopyEl.textContent = weather?.current?.description || trail.forecastDesc || '';
  }
}

// Render quick condition advice cards for the user.
function renderSmartCards(trail) {
  if (!currentConditionsEl) {
    return;
  }

  const advice = generateAdvice(trail.weather);
  currentConditionsEl.innerHTML = advice.map((note) => `
    <div class="card condition-card">
      <p>${note}</p>
    </div>
  `).join('');
}

// Refresh the overview section whenever a region or trail changes.
function tweakOverview(region, trailName) {
  const trail = activeTrail(region, trailName);
  if (!trail) {
    return;
  }

  renderHero(trail);
  renderStats(trail);
  renderForecast(trail);
  renderRisk(trail);
  renderSmartCards(trail);
}

// Update the lower summary cards with elevation and hike details.
function updateMetricDetails(trail) {
  if (!trail) {
    return;
  }

  if (elevationMetric) {
    elevationMetric.textContent = `${trail['highest pointM']}m`;
  }

  if (elevationMeta) {
    elevationMeta.textContent = 'Elevation';
  }

  if (highestPointEl) {
    highestPointEl.textContent = `Highest point: ${trail['highest pointM']} m`;
  }

  if (elevationGainEl) {
    elevationGainEl.textContent = `Elevation gain: ${trail.elevationGainM} m`;
  }
}

// Fill the trail summary panel with the selected trail’s key details.
function updateTrailSummary(trail) {
  if (!trailSummaryContent) {
    return;
  }

  if (!trail) {
    trailSummaryContent.innerHTML = '<p class="summary-empty">No trail details found for that region.</p>';
    return;
  }

  const facilities = Array.isArray(trail.facilities) && trail.facilities.length
    ? trail.facilities.map((facility) => `<span class="facility-pill">${facility}</span>`).join(' ')
    : '<span class="facility-pill">No facilities listed</span>';

  trailSummaryContent.innerHTML = `
    <h3 class="summary-title">${trail.name}</h3>
    <ul class="summary-list">
      <li><span>Length</span><strong>${trail.distanceKm} km</strong></li>
      <li><span>Difficulty</span><strong>${trail.difficulty}</strong></li>
      <li><span>Elevation gain</span><strong>${trail.elevationGainM ? `${trail.elevationGainM} m` : '—'}</strong></li>
      <li><span>Time taken</span><strong>${trail.durationHours} hrs</strong></li>
      <li><span>Available facilities</span><strong>${facilities}</strong></li>
    </ul>
  `;
}

// Collect the planner form values so the trip readiness score can use them.
function getPlannerInputs() {
  return {
    experience: experienceSelect?.value || 'Beginner',
    groupSize: Number(groupSizeSelect?.value || 1),
    duration: durationSelect?.value || 'Half Day',
    tripDate: tripDateInput?.value || '',
  };
}

// Update the planner summary panel with the score, start time, and warnings.
function updatePlannerSummary(trail) {
  if (!trail) {
    return;
  }

  const plannerInputs = getPlannerInputs();
  const score = calculateTrailReadiness(trail, plannerInputs);
  const recommendedStart = getRecommendedStart(trail);
  const estimatedFinish = getEstimatedFinish(trail, { recommendedStart });

  if (readinessPercentageEl) {
    readinessPercentageEl.textContent = `${score}%`;
  }

  if (recommendedStartEl) {
    recommendedStartEl.textContent = recommendedStart;
  }

  if (estimatedFinishEl) {
    estimatedFinishEl.textContent = estimatedFinish;
  }

  if (plannerAlertsEl) {
    const current = trail.weather?.current || {};
    const alerts = [];
    if ((Number(current.precipitation) || 0) >= 20) {
      alerts.push('Rain is likely, so bring waterproof gear.');
    }
    if ((Number(current.wind) || 0) >= 20) {
      alerts.push('Wind is strong in exposed sections.');
    }
    if (trail.difficulty === 'Hard') {
      alerts.push('Expect a demanding climb and slower pace.');
    }

    plannerAlertsEl.innerHTML = alerts.length
      ? alerts.map((alert) => `<div class="planner-alert">✓ ${alert}</div>`).join('')
      : '<div class="planner-alert">✓ Conditions look generally suitable for this hike.</div>';
  }
}

function updateTrailDetails(region, trailName) {
  const trail = activeTrail(region, trailName);
  populateTrailSelector(region, trail?.name);
  updateMetricDetails(trail);
  updateTrailSummary(trail);
  tweakOverview(region, trailName);
  updatePlannerSummary(trail);
  startPhotoRotation(region, trail?.name);
}

// Get the image URLs for a single trail, using the trail’s image list.
function getTrailImages(trail) {
  if (!trail) return [];
  return Array.isArray(trail.images)
    ? trail.images.filter(Boolean)
    : trail.image
      ? [trail.image]
      : [];
}

// Collect all images for the chosen region from every trail in that region.
function getRegionImages(region) {
  if (!region) return [];
  return trails({ region }).flatMap((trail) => getTrailImages(trail));
}

// Show one picture in the photo area for the selected trail or region.
function showPhoto(images = [], label = '') {
  if (!locationPhotoContainer) return;
  locationPhotoContainer.innerHTML = '';

  if (!images.length) {
    locationPhotoContainer.textContent = label
      ? `No images available for ${label}.`
      : 'No trail images available.';
    return;
  }

  const imageUrl = images[regionImageRotation.index % images.length];
  const img = document.createElement('img');
  img.src = imageUrl;
  img.alt = label ? `${label} trail photo` : 'Trail photo';
  img.loading = 'lazy';
  locationPhotoContainer.appendChild(img);

  regionImageRotation.images = images;
  regionImageRotation.index = regionImageRotation.index % images.length;
}

// Start changing the photo every few seconds, using trail-specific images if available.
function startPhotoRotation(region, trailName) {
  if (regionImageRotation.timer) {
    clearInterval(regionImageRotation.timer);
    regionImageRotation.timer = null;
  }

  const trail = trailName ? getTrailByName(trailName) : null;
  const images = trail ? getTrailImages(trail) : getRegionImages(region);
  const label = trail ? trail.name : region;

  regionImageRotation.index = 0;
  showPhoto(images, label);

  if (images.length < 2) {
    return;
  }

  regionImageRotation.timer = setInterval(() => {
    regionImageRotation.index = (regionImageRotation.index + 1) % images.length;
    showPhoto(images, label);
  }, 5000);
}

// When the user changes the region, refresh the page details and photo slideshow.
if (regionSelect) {
  regionSelect.addEventListener('change', (event) => {
    updateTrailDetails(event.target.value);
  });
}

// When the user picks a specific trail, show the matching trail details and photos.
if (trailSelect) {
  trailSelect.addEventListener('change', (event) => {
    const selectedTrailName = event.target.value;
    const currentRegion = regionSelect?.value;
    updateTrailDetails(currentRegion, selectedTrailName);
  });
}

function attachPlannerFieldListeners() {
  [experienceSelect, groupSizeSelect, durationSelect, tripDateInput].forEach((field) => {
    if (!field) {
      return;
    }

    field.addEventListener('change', () => {
      const selectedTrailName = trailSelect?.value;
      const currentRegion = regionSelect?.value;
      const trail = activeTrail(currentRegion, selectedTrailName);
      if (trail) {
        updatePlannerSummary(trail);
      }
    });
  });
}

attachPlannerFieldListeners();
loadWeatherData();
