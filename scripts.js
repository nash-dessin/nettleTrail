// Loading the modules that handle weather data, trip saving, and trail details.
import { WeatherService } from './weatherService.js';
import { TripManager } from './tripManager.js';
import { Trail } from './trails.js';
import {
    getCities,
    getCoordinatesForCity,
    getFormValues,
    getSelectedTrail,
    getSeverity,
    getTrailsForCity,
    loadChartJs,
    renderBarLineChart,
    showError,
} from './utils.js';

const weatherService = new WeatherService();
const tripManager = new TripManager();

// Keeping the current app state in one place.
const region = {
    trails: [],
    selectedCity: null,
    selectedTrailName: null,
    filters: {
        severe: true,
        warning: true,
        caution: true,
        info: true,
    },
};

// Loading trail data from a mock JSON file and turn each item into a Trail object.
async function loadData() {
    try {
        const response = await fetch('./weather-mockData.json');
        const data = await response.json();
        region.trails = data.map((trailData) => new Trail(trailData));
    } catch (error) {
        console.error('Error loading data: Please try again later', error);
    }
}

// Drawing the map on the page and place a marker for the hike region.
window.initMap = function() {
  const mapElement = document.getElementById('google-map');
  if (!mapElement) return;

  const map = new google.maps.Map(mapElement, {
    center: { lat: 46.8523, lng: -121.7603 },
    zoom: 10,
    disableDefaultUI: true,
    styles: [
      { elementType: 'geometry', stylers: [{ color: '#0b1220' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#1b2633' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#e6eef8' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d1721' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#11202f' }] }
    ]
  });

  new google.maps.Marker({
    position: { lat: 46.8523, lng: -121.7603 },
    map,
    title: 'Selected trail region'
  });
};


// Build the city dropdown and attach change handling.
function setupCitySelect() {
    const select = document.querySelector('#city-select');
    const cities = getCities(region.trails);
    if (!select || !cities.length) return;

    select.innerHTML = cities
        .map((city) => `<option value="${city}">${city}</option>`)
        .join('');

    select.value = region.selectedCity;
    select.addEventListener('change', (event) => {
        region.selectedCity = event.target.value;
        region.selectedTrailName = null;
        setupTrailSelect();
        renderPage();
    });
}

function setupTrailSelect() {
    const select = document.querySelector('#trail-select');
    const city = region.selectedCity || getCities(region.trails)[0];
    const trails = getTrailsForCity(region.trails, city);
    if (!select || !trails.length) return;

    select.innerHTML = trails
        .map((trail) => `<option value="${trail.name}">${trail.name}</option>`)
        .join('');

    if (!region.selectedTrailName || !trails.some((trail) => trail.name === region.selectedTrailName)) {
        region.selectedTrailName = trails[0].name;
    }
    select.value = region.selectedTrailName;
    select.addEventListener('change', (event) => {
        region.selectedTrailName = event.target.value;
        renderTripPlanner();
    });
}


// Ask the weather service for daily weather data.
async function fetchWeatherDaily(latitude, longitude, dailyParams) {
    return weatherService.fetchWeather(latitude, longitude, dailyParams);
}

// Fetch and render the rain chart for the selected city.
async function updateWindRainGraphs(city) {
    const { lat, lon } = getCoordinatesForCity(region.trails, city);
    const dailyParams = ['precipitation_sum', 'precipitation_hours'];
    try {
        const weather = await fetchWeatherDaily(lat, lon, dailyParams);
        const labels = weather.time || [];
        const precipitation = weather.precipitation || [];
        const averageRain = precipitation.reduce((sum, value) => sum + value, 0) / (precipitation.length || 1);

        await loadChartJs();
        renderBarLineChart('rain-hours', labels, [
            {
                type: 'line',
                label: 'Precipitation (mm)',
                data: precipitation,
                borderColor: '#1f77b4',
                backgroundColor: 'rgba(31,119,180,0.2)',
                yAxisID: 'y',
            },
        ], {
            scales: { y: { beginAtZero: true } },
            plugins: {
                title: {
                    display: true,
                    text: `Avg precipitation: ${averageRain.toFixed(1)} mm`,
                    color: '#e2e8f0',
                },
            },
        });
    } catch (err) {
        console.error('Wind/Rain data error', err);
        showError('#rain-hours', 'Unable to load precipitation data.');
    }
}

// Fetch and render the main weather overview chart.
async function updateIndexGraph(city) {
    const { lat, lon } = getCoordinatesForCity(region.trails, city);
    const dailyParams = ['precipitation_sum', 'temperature_2m_max', 'temperature_2m_min', 'uv_index_max', 'weather_code'];
    try {
        const weather = await fetchWeatherDaily(lat, lon, dailyParams);
        const labels = weather.time || [];
        const tMax = weather.temperatureMax || [];
        const tMin = weather.temperatureMin || [];
        const precip = weather.precipitation || [];
        await loadChartJs();

        let container = document.getElementById('index-daily-chart');
        if (!container) {
            const sevenDay = document.getElementById('seven-day');
            if (!sevenDay) return;
            container = document.createElement('div');
            container.id = 'index-daily-chart';
            container.className = 'card chart-card';
            container.style.minHeight = '260px';
            sevenDay.parentNode.insertBefore(container, sevenDay);
        }

        renderBarLineChart('index-daily-chart', labels, [
            {
                type: 'line',
                label: 'Max Temp (°C)',
                data: tMax,
                borderColor: '#ff7f0e',
                backgroundColor: 'rgba(255,127,14,0.1)',
                yAxisID: 'y1',
            },
            {
                type: 'line',
                label: 'Min Temp (°C)',
                data: tMin,
                borderColor: '#2ca02c',
                backgroundColor: 'rgba(44,160,44,0.1)',
                yAxisID: 'y1',
            },
            {
                type: 'bar',
                label: 'Precipitation (mm)',
                data: precip,
                backgroundColor: 'rgba(31,119,180,0.4)',
                yAxisID: 'y',
            },
        ], {
            scales: {
                y: { position: 'left', beginAtZero: true },
                y1: { position: 'right', beginAtZero: false, grid: { drawOnChartArea: false } },
            },
        });
    } catch (err) {
        console.error('Index graph error', err);
        showError('#index-daily-chart', 'Unable to load overview weather data.');
    }
}

// Build the alert list based on trail weather warnings and filter settings.
function renderAlerts() {
    const list = document.querySelector('#alerts-list');
    if (!list) return;

    const alerts = region.trails
        .map((trail) => {
            const warnings = trail.generateWarnings({
                precipitation: 0,
                windSpeed: 12,
                uvIndex: 3,
                visibility: 10,
            });
            return {
                trail,
                severity: getSeverity(trail),
                warnings,
            };
        })
        .filter((entry) => region.filters[entry.severity]);

    list.innerHTML = alerts
        .map((entry) => {
            const alert = Trail.createAlert(`Alert for ${entry.trail.name}`, ...entry.warnings);
            return `
                <article class="alert-card">
                    <strong>${alert.title}</strong>
                    <p>${entry.severity.toUpperCase()}</p>
                    <ul>${alert.warnings.map((warning) => `<li>${warning}</li>`).join('')}</ul>
                </article>
            `;
        })
        .join('');
}

// Refresh the trip planner area with current trail choices and saved trips.
function renderTripPlanner() {
    const form = document.querySelector('#trip-form');
    if (!form) return;

    setupTrailSelect();
    updatePlannerSummary();
    renderSavedTrips();

    const beginnerArea = document.getElementById('beginner-trails');
    if (beginnerArea) {
        const beginnerTrails = Trail.filterBeginnerTrails(region.trails);
        beginnerArea.innerHTML = beginnerTrails.length
            ? `<strong>Beginner trails:</strong> ${beginnerTrails.map((trail) => trail.name).join(', ')}`
            : '<strong>No beginner trails available.</strong>';
    }
}

// Build a simple weather summary and safety score for the chosen trail.
function getTrailSummary(trail) {
    const weather = {
        precipitation: 4,
        windSpeed: 8,
        uvIndex: 5,
        visibility: 9,
        temperature: 18,
        humidity: 58,
    };

    const {
        temperature,
        humidity,
        windSpeed,
        uvIndex,
    } = weather;

    const score = trail.calculateScore(weather);
    const warnings = trail.generateWarnings(weather);
    const classification = Trail.classifyScore(score);

    return {
        score,
        warnings,
        classification,
        recommendedStart: '6:30 AM',
        estimatedFinish: '11:45 AM',
        weather,
    };
}

// Show the key trip suggestions and warnings in the planner area.
function updatePlannerSummary() {
    const trail = getSelectedTrail(region.trails, region.selectedTrailName);
    if (!trail) return;

    const summary = getTrailSummary(trail);
    const root = document.querySelector('#trip-results');
    if (!root) return;

    const { score, classification, recommendedStart, estimatedFinish, warnings } = summary;
    document.querySelector('#readiness-score').textContent = `${score}%`;
    document.querySelector('#recommended-start').textContent = recommendedStart;
    document.querySelector('#estimated-finish').textContent = estimatedFinish;

    const alertArea = document.querySelector('#planner-alerts');
    if (alertArea) {
        alertArea.innerHTML = warnings
            .map((warning) => `<div class="planner-alert">✓ ${warning}</div>`)
            .join('');
        if (!warnings.length) {
            alertArea.innerHTML = `<div class="planner-alert">✓ No immediate safety issues. ${classification}</div>`;
        }
    }
}

// Render the list of trips the user has saved before.
function renderSavedTrips() {
    const saved = document.querySelector('#saved-trips');
    if (!saved) return;

    const trips = tripManager.load();
    if (!trips.length) {
        saved.innerHTML = '<p>No saved trips yet.</p>';
        return;
    }

    saved.innerHTML = trips
        .map((trip) => {
            return `
                <article class="trail-card">
                    <h3>${trip.trail}</h3>
                    <p>${trip.region} · ${trip.date}</p>
                    <p>Group of ${trip.groupSize} · ${trip.duration}</p>
                    <p>Readiness: ${trip.readinessScore}%</p>
                </article>
            `;
        })
        .join('');
}

// Turn the form input into a trip object ready to save.
function createTripFromForm() {
    const { trailName, tripDate, groupSize, experience, duration } = getFormValues();
    const trail = region.trails.find((item) => item.name === trailName) || getSelectedTrail(region.trails, region.selectedTrailName);
    const summary = getTrailSummary(trail);

    return trail.saveTrip({
        date: tripDate || 'TBD',
        groupSize,
        experience,
        duration,
        readinessScore: summary.score,
        classification: summary.classification,
    });
}

// Save the trip when the user submits the form.
async function handleTripFormSubmit(event) {
    event.preventDefault();
    const trip = createTripFromForm();
    tripManager.save(trip);
    renderSavedTrips();
}

// Load the charts and lists needed to refresh the page.
async function renderPage() {
    const city = region.selectedCity || (region.trails[0] && region.trails[0].city) || 'Nairobi';
    await Promise.all([
        updateWindRainGraphs(city),
        updateIndexGraph(city),
    ]);
    renderAlerts();
    renderTripPlanner();
}

// Attach the trip planner form listener.
function initializeTripPlannerForm() {
    const form = document.querySelector('#trip-form');
    if (!form) return;
    form.addEventListener('submit', handleTripFormSubmit);
}

// Start the app by loading data, setting up controls, and rendering the page.
(async function init() {
    try {
        await loadData();
        region.selectedCity = region.trails.length ? getCities(region.trails)[0] : 'Nairobi';
        setupCitySelect();
        setupTrailSelect();
        bindAlertFilters();
        initializeTripPlannerForm();
        await renderPage();
    } catch (err) {
        console.error('Initialization error', err);
    }
})();

