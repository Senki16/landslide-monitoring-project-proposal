# SlopeWatch — proposal website and live demo

Static website (no build step, no API keys) that presents the project proposal in English and includes a live demo of the early-warning console fed by NASA open data:

- **NASA GPM IMERG** precipitation rate tiles (via NASA GIBS) on the map, latest available day.
- **NASA POWER** daily precipitation (`PRECTOTCORR`) and surface soil wetness (`GWETTOP`) at Alto de Pavas (5.950459, −74.861388).
- **NASA EONET** landslide, flood and severe-storm events in north-western South America (last 90 days).

The demo turns antecedent rainfall into a hazard level and combines it with the section's exposure in the dynamic risk matrix (R = H × V × E). Thresholds are illustrative, not calibrated.

## Run locally

Open the site through any static server, for example:

```bash
cd website
python -m http.server 8000
# http://localhost:8000
```

## Deploy on Vercel

1. Import the repository in Vercel.
2. Set **Root Directory** to `website` and **Framework Preset** to *Other* (no build command, no output directory).
3. Deploy.

GitHub Pages also works: publish the `website/` folder.

## Pages

| File | Content |
|---|---|
| `index.html` | Home: hero map with alert level, rainfall chart, KPIs, risk matrix and NASA events |
| `demo.html` | Full-screen interactive demo: search or click any point, NASA layer toggles, 7-day rainfall timeline |
| `overview.html` | Proposal overview and key figures |
| `problem.html` | Problem, statistics and study site |
| `solution.html` | Platform pipeline, alternatives and objectives |
| `plan.html` | 24-month schedule, team and partners |
| `finance.html` | Budget, funding and financial evaluation |
| `styles.css` | Shared styles (responsive) |
| `app.js` | Charts and home dashboard logic |
| `demo.js` | Interactive demo map logic (NASA POWER, IMERG, MODIS, EONET; OpenStreetMap Nominatim search) |
