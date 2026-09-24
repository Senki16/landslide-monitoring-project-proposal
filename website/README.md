# SlopeWatch — proposal website and live demo

Static website (no build step, no API keys) that presents the project proposal in English and includes a live demo of the early-warning console fed by NASA open data:

- **NASA GPM IMERG** precipitation rate tiles (via NASA GIBS) on the map, latest available day.
- **NASA POWER** daily precipitation (`PRECTOTCORR`) and surface soil wetness (`GWETTOP`) at Alto de Pavas (5.950459, −74.861388).
- **NASA EONET** landslide, flood and severe-storm events in north-western South America (last 90 days).

The demo turns antecedent rainfall into a hazard level and combines it with the section's exposure in the dynamic risk matrix (R = H × V × E). Thresholds are illustrative, not calibrated.

## Run locally

Open `index.html` through any static server, for example:

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

## Files

| File | Content |
|---|---|
| `index.html` | Page structure and proposal content |
| `styles.css` | Styles (responsive) |
| `app.js` | Charts, map and live NASA data logic |
