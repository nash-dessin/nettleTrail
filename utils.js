// Shared helper functions used across the app.

export function getCities(trails = []) {
    return Array.from(new Set(trails.map((trail) => trail.city))).sort();
}

export function getTrailsForCity(trails = [], city) {
    return trails.filter((trail) => trail.city === city);
}

export function getSelectedTrail(trails = [], selectedTrailName) {
    return trails.find((trail) => trail.name === selectedTrailName) || trails[0];
}

export function getSeverity(trail) {
    if (trail.difficulty === 'Hard' || trail.difficulty === 'Expedition') return 'severe';
    if (trail.difficulty === 'Moderate') return 'warning';
    return 'info';
}

export function showError(containerSelector, message) {
    const el = document.querySelector(containerSelector);
    if (!el) return;
    el.innerHTML = `<div class="card error">${message}</div>`;
}

export async function loadChartJs() {
    if (window.Chart) return;
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Chart.js'));
        document.head.appendChild(script);
    });
}

export function getCoordinatesForCity(trails = [], city) {
    const trail = trails.find((item) => item.city === city);
    return trail ? { lat: trail.latitude, lon: trail.longitude } : { lat: 52.52, lon: 13.41 };
}

export function renderBarLineChart(containerId, labels, datasets, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    let canvas = container.querySelector('canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        container.innerHTML = '';
        container.appendChild(canvas);
    }
    const ctx = canvas.getContext('2d');
    if (canvas._chart) canvas._chart.destroy();
    canvas._chart = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets },
        options: Object.assign({ responsive: true, maintainAspectRatio: false }, options),
    });
}

export function getFormValues() {
    const trailSelect = document.querySelector('#trail-select');
    const dateInput = document.querySelector('#trip-date');
    const groupSizeSelect = document.querySelector('#group-size');
    const experienceSelect = document.querySelector('#experience');
    const durationSelect = document.querySelector('#duration');

    return {
        trailName: trailSelect?.value,
        tripDate: dateInput?.value,
        groupSize: Number(groupSizeSelect?.value || 1),
        experience: experienceSelect?.value || 'Intermediate',
        duration: durationSelect?.value || 'Half Day',
    };
}
