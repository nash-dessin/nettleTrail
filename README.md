# NettleTrail Dashboard

NettleTrail is a static hiking planner focused on trails and nearby weather for route planning.

What this workspace contains

- A multi-page static site (separate HTML pages) for each major section of the app.
- A local JSON dataset used by the UI via the Fetch API.

Highlights

- Multi-page layout: each section is its own HTML file and navigation uses standard anchor links.
- Data-driven UI: `scripts.js` loads `weather-mockData.json` with `fetch()` and renders the relevant trail information.

Files

- index.html — Overview / landing page
- trailMap.html — Trail map and waypoint summary
- elevationForecast.html — Elevation / banded forecast view
- windRain.html — Wind & rain analytics (toggle panels)
- safety.html — Safety checklist and hazard notes
- alerts.html — Active alerts and alert history
- styles.css — Shared styling and theme
- scripts.js — App logic: fetches `weather-mockData.json` and renders per-page content
- weather-mockData.json — Local dataset (array of trail objects)
- chart.js — small chart helpers used by some pages

Data format

The app expects `weather-mockData.json` to be an array of trail objects with fields similar to:

{
	"name": "Trail Name",
	"city": "City Name",
	"region": "Region",
	"distanceKm": 12,
	"durationHours": 3,
	"difficulty": "Moderate",
	"terrain": "Rocky ridge",
	"features": ["waterfall", "views"]
}

`scripts.js` uses `fetch('./weather-mockData.json')` and derives cities and per-city trail lists from that array.

Running locally

Open `index.html` in your browser. 