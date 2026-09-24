/* SlopeWatch — proposal site + live NASA demo (no build step, no API keys) */
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const fmt = (n, d = 0) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const SVGNS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs = {}, parent) => {
    const e = document.createElementNS(SVGNS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };

  /* ---------- static proposal visuals ---------- */
  function bars(target, rows, max, fmtV, winIdx) {
    const box = $(target);
    rows.forEach((r, i) => {
      const row = document.createElement('div');
      row.className = 'bar-row' + (i === winIdx ? ' win' : '');
      row.innerHTML = `<span>${r[0]}</span><div class="bar-track"><div class="bar-fill" style="width:${(r[1] / max) * 100}%"></div></div><span class="v">${fmtV(r)}</span>`;
      box.appendChild(row);
    });
  }
  bars('#alt-bars', [
    ['Alt. 2 · Geographic monitoring system', 68],
    ['Alt. 3 · Soil-management training', 41],
    ['Alt. 4 · Historical failure manual', 39],
    ['Alt. 1 · Relocation of population', 36],
  ], 75, (r) => `${r[1]} / 75`, 0);
  bars('#budget-bars', [
    ['Human resources', 601.8, 29.8], ['Administrative', 496.2, 24.6], ['Services & testing', 334.5, 16.6],
    ['Infrastructure', 288.1, 14.3], ['Equipment & software', 155.6, 7.7], ['Training & events', 111.6, 5.5],
    ['Travel', 25.4, 1.3], ['Materials & documentation', 7.5, 0.4],
  ], 601.8, (r) => `${fmt(r[1], 1)} M · ${r[2]}%`);

  const gantt = [
    ['SO1 · Database', [[1, 8]], []],
    ['SO2 · Dynamic risk matrix', [[3, 12]], [[13, 24]]],
    ['SO3 · Neural network', [[7, 16]], []],
    ['SO4 · Monitoring platform', [[9, 18]], []],
    ['SO5 · Pilot tests & training', [[17, 24]], []],
    ['SO6 · Reports & dissemination', [[19, 24]], []],
  ];
  const g = $('#gantt');
  gantt.forEach(([name, dev, ops]) => {
    const row = document.createElement('div');
    row.className = 'g-row';
    let inner = '';
    dev.forEach(([a, b]) => { inner += `<div class="g-bar" style="left:${((a - 1) / 24) * 100}%;width:${((b - a + 1) / 24) * 100}%"></div>`; });
    ops.forEach(([a, b]) => { inner += `<div class="g-bar ops" style="left:${((a - 1) / 24) * 100}%;width:${((b - a + 1) / 24) * 100}%"></div>`; });
    row.innerHTML = `<span>${name}</span><div class="g-track">${inner}</div>`;
    g.appendChild(row);
  });
  const ax = document.createElement('div');
  ax.className = 'g-axis';
  ax.innerHTML = '<span></span><div><span>M1</span><span>M6</span><span>M12</span><span>M18</span><span>M24</span></div>';
  g.appendChild(ax);

  (function cashFlow() {
    const nf = [-1458.1, 97.9, 770.4, 260.4, 770.4, 389.0, 997.9, 487.9, 997.9, 487.9, 997.9];
    const pv = [-1458.1, 87.4, 614.2, 185.4, 489.6, 220.7, 505.6, 220.7, 403.0, 175.9, 321.3];
    let c = 0; const cum = pv.map((v) => (c += v));
    const svg = $('#cf-chart'); const W = 520, H = 240, L = 46, R = 10, T = 12, B = 26;
    const min = -1600, max = 1900; const y = (v) => T + (max - v) / (max - min) * (H - T - B);
    const bw = (W - L - R) / 11;
    [-1500, -1000, -500, 0, 500, 1000, 1500].forEach((t) => {
      el('line', { x1: L, x2: W - R, y1: y(t), y2: y(t), stroke: t === 0 ? '#5d6d64' : '#26332c' }, svg);
      el('text', { x: L - 6, y: y(t) + 4, 'text-anchor': 'end' }, svg).textContent = fmt(t);
    });
    nf.forEach((v, i) => {
      el('rect', { x: L + i * bw + bw * 0.2, width: bw * 0.6, y: Math.min(y(v), y(0)), height: Math.abs(y(v) - y(0)), fill: i === 0 ? '#d64545' : '#4ea3e6', rx: 2 }, svg);
      el('text', { x: L + i * bw + bw / 2, y: H - 8, 'text-anchor': 'middle' }, svg).textContent = i;
    });
    el('polyline', { points: cum.map((v, i) => `${L + i * bw + bw / 2},${y(v)}`).join(' '), fill: 'none', stroke: '#e9a23b', 'stroke-width': 2.5 }, svg);
    cum.forEach((v, i) => el('circle', { cx: L + i * bw + bw / 2, cy: y(v), r: 3, fill: '#e9a23b' }, svg));
    el('text', { x: W - R, y: y(cum[10]) - 8, 'text-anchor': 'end', style: 'fill:#e8efe9;font-weight:600' }, svg).textContent = 'NPV COP 1,766 M';
  })();

  /* ---------- live demo ---------- */
  const SITE = { name: 'Alto de Pavas', lat: 5.950459, lon: -74.861388 };
  const LEVELS = [
    { name: 'Normal', cls: 'lv0', color: '#3f9d6d' },
    { name: 'Watch', cls: 'lv1', color: '#e0c23f' },
    { name: 'Warning', cls: 'lv2', color: '#e9853b' },
    { name: 'Alert', cls: 'lv3', color: '#d64545' },
  ];
  const HAZ = ['low', 'moderate', 'high', 'very high'];
  const state = { hazard: null, reason: '' };

  if (!window.L) { $('#alert-level').textContent = 'Map library unavailable'; return; }

  const map = L.map('map', { zoomControl: true, scrollWheelZoom: false }).setView([6.0, -74.97], 10);
  const dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO', subdomains: 'abcd', maxZoom: 19,
  }).addTo(map);
  const sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Imagery &copy; Esri', maxZoom: 19,
  });
  L.control.layers({ 'Dark map': dark, 'Satellite imagery': sat }, {}, { position: 'topright' }).addTo(map);

  L.circle([SITE.lat, SITE.lon], { radius: 1000, color: '#e9a23b', weight: 2, fillOpacity: 0.12 }).addTo(map)
    .bindPopup('<b>Alto de Pavas</b><br>Route 60, km 87 · curved section with back slope<br>1 km monitoring buffer');
  L.polyline([[5.951316, -74.865089], [5.950459, -74.861388]], { color: '#e9a23b', weight: 6 }).addTo(map);
  L.circleMarker([SITE.lat, SITE.lon], { radius: 6, color: '#fff', weight: 2, fillColor: '#e9a23b', fillOpacity: 1 }).addTo(map)
    .bindTooltip('Alto de Pavas · study focus', { permanent: true, direction: 'right', className: 'site-label', offset: [8, 0] });
  [['San Francisco', 5.9636, -75.1016], ['San Luis', 6.0428, -74.9937], ['Cocorná', 6.0586, -75.1856]].forEach(([n, la, lo]) =>
    L.circleMarker([la, lo], { radius: 4, color: '#9aaba1', weight: 1, fillColor: '#9aaba1', fillOpacity: 0.9 }).addTo(map)
      .bindTooltip(n, { direction: 'top', className: 'site-label' }));

  /* NASA GPM IMERG via GIBS: find the most recent day with tiles */
  const imergUrl = (d) => `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/IMERG_Precipitation_Rate/default/${d}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`;
  const isoDay = (dt) => dt.toISOString().slice(0, 10);
  const probe = (d) => new Promise((res) => {
    const img = new Image();
    img.onload = () => res(true); img.onerror = () => res(false);
    img.src = imergUrl(d).replace('{z}', 6).replace('{y}', 30).replace('{x}', 18);
  });
  let imergLayer = null;
  (async () => {
    for (let back = 0; back < 6; back++) {
      const d = isoDay(new Date(Date.now() - back * 864e5));
      if (await probe(d)) {
        imergLayer = L.tileLayer(imergUrl(d), { opacity: 0.75, maxNativeZoom: 6, maxZoom: 19, attribution: 'NASA GPM IMERG · GIBS' });
        if ($('#imerg-toggle').checked) imergLayer.addTo(map);
        $('#imerg-date').textContent = `IMERG precipitation rate · ${d}`;
        return;
      }
    }
    $('#imerg-date').textContent = 'IMERG tiles unavailable right now';
  })();
  $('#imerg-toggle').addEventListener('change', (e) => {
    if (!imergLayer) return;
    e.target.checked ? imergLayer.addTo(map) : map.removeLayer(imergLayer);
  });

  /* NASA EONET: natural events in the region */
  const eonetLayer = L.layerGroup().addTo(map);
  $('#eonet-toggle').addEventListener('change', (e) => (e.target.checked ? eonetLayer.addTo(map) : map.removeLayer(eonetLayer)));
  fetch('https://eonet.gsfc.nasa.gov/api/v3/events?category=landslides,floods,severeStorms&status=all&days=90&bbox=-82,13,-66,-5')
    .then((r) => r.json())
    .then((j) => {
      const list = $('#events'); list.innerHTML = '';
      const evs = (j.events || []).slice(0, 12);
      if (!evs.length) { list.innerHTML = '<li class="muted">No landslide, flood or storm events reported by EONET in the region in the last 90 days.</li>'; return; }
      evs.forEach((ev) => {
        const geo = ev.geometry[ev.geometry.length - 1];
        let [lo, la] = geo.type === 'Point' ? geo.coordinates : geo.coordinates[0][0];
        const date = geo.date.slice(0, 10);
        const cat = ev.categories.map((c) => c.title).join(', ');
        L.circleMarker([la, lo], { radius: 7, color: '#4ea3e6', weight: 2, fillOpacity: 0.35 }).addTo(eonetLayer)
          .bindPopup(`<b>${ev.title}</b><br>${cat} · ${date}`);
        const li = document.createElement('li');
        li.innerHTML = `${ev.title}<small>${cat} · ${date}</small>`;
        list.appendChild(li);
      });
    })
    .catch(() => { $('#events').innerHTML = '<li class="muted">NASA EONET is not reachable right now.</li>'; });

  /* NASA POWER: daily rainfall + surface soil wetness at the study site */
  const ymd = (dt) => dt.toISOString().slice(0, 10).replace(/-/g, '');
  const end = new Date(); const start = new Date(Date.now() - 60 * 864e5);
  const powerUrl = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=PRECTOTCORR,GWETTOP&community=AG&longitude=${SITE.lon}&latitude=${SITE.lat}&start=${ymd(start)}&end=${ymd(end)}&format=JSON`;
  fetch(powerUrl)
    .then((r) => r.json())
    .then((j) => {
      const P = j.properties.parameter.PRECTOTCORR, S = j.properties.parameter.GWETTOP;
      const days = Object.keys(P).filter((k) => P[k] > -900).sort();
      if (days.length < 16) throw new Error('not enough data');
      const rain = days.map((k) => P[k]);
      const sw = days.map((k) => (S[k] > -900 ? S[k] : null));
      const n = rain.length, sum = (a) => a.reduce((x, y) => x + y, 0);
      const r1 = rain[n - 1], r3 = sum(rain.slice(-3)), r15 = sum(rain.slice(-15));
      const swLast = [...sw].reverse().find((v) => v != null);
      let h = 0; const why = [];
      if (r3 >= 100 || r15 >= 350) h = 3; else if (r3 >= 70 || r15 >= 250) h = 2; else if (r3 >= 40 || r15 >= 150) h = 1;
      why.push(`${fmt(r3, 1)} mm in 3 days, ${fmt(r15, 0)} mm in 15 days`);
      if (swLast != null && swLast > 0.8 && h < 3) { h += 1; why.push(`saturated soil (${swLast.toFixed(2)})`); }
      state.hazard = h; state.reason = why.join(' · ');
      const last = days[n - 1];
      $('#m-r1').textContent = fmt(r1, 1); $('#m-r3').textContent = fmt(r3, 1); $('#m-r15').textContent = fmt(r15, 0);
      $('#m-sw').textContent = swLast != null ? swLast.toFixed(2) : '–';
      $('#power-meta').textContent = `NASA POWER · latest valid day ${last.slice(0, 4)}-${last.slice(4, 6)}-${last.slice(6)}`;
      render();
      drawRain(days.slice(-45), rain.slice(-45), rain);
    })
    .catch(() => {
      $('#alert-level').textContent = 'Data unavailable';
      $('#alert-why').textContent = 'NASA POWER could not be reached. Try again in a moment.';
    });

  function render() {
    const e = +$('#exposure').value;
    document.querySelectorAll('#matrix tbody tr').forEach((tr) => {
      const v = +tr.dataset.v;
      tr.querySelectorAll('td').forEach((td, hz) => {
        const lv = Math.max(0, hz - (3 - v));
        td.style.background = LEVELS[lv].color;
        td.classList.toggle('on', state.hazard === hz && v === e);
      });
    });
    if (state.hazard == null) return;
    const lv = Math.max(0, state.hazard - (3 - e));
    const card = $('#alert-card');
    card.className = 'alert-card ' + LEVELS[lv].cls;
    $('#alert-level').textContent = LEVELS[lv].name;
    $('#alert-why').textContent = `Hazard ${HAZ[state.hazard]} · ${state.reason}`;
  }
  $('#exposure').addEventListener('change', render);
  render();

  function drawRain(days, rain, all) {
    const svg = $('#rain-chart'); svg.innerHTML = '';
    const W = 900, H = 220, L = 40, R = 46, T = 12, B = 28;
    const off = all.length - rain.length;
    const run15 = rain.map((_, i) => all.slice(Math.max(0, off + i - 14), off + i + 1).reduce((a, b) => a + b, 0));
    const maxR = Math.max(20, Math.ceil(Math.max(...rain) / 20) * 20);
    const maxC = Math.max(100, Math.ceil(Math.max(...run15) / 50) * 50);
    const bw = (W - L - R) / rain.length;
    const yR = (v) => H - B - (v / maxR) * (H - T - B), yC = (v) => H - B - (v / maxC) * (H - T - B);
    for (let t = 0; t <= 4; t++) {
      const v = (maxR / 4) * t;
      el('line', { x1: L, x2: W - R, y1: yR(v), y2: yR(v), stroke: '#26332c' }, svg);
      el('text', { x: L - 6, y: yR(v) + 4, 'text-anchor': 'end' }, svg).textContent = fmt(v);
      el('text', { x: W - R + 6, y: yR(v) + 4 }, svg).textContent = fmt((maxC / 4) * t);
    }
    [150, 250, 350].filter((v) => v <= maxC).forEach((v) => {
      el('line', { x1: L, x2: W - R, y1: yC(v), y2: yC(v), stroke: '#e9a23b', 'stroke-dasharray': '4 4', opacity: 0.45 }, svg);
    });
    rain.forEach((v, i) => {
      const r = el('rect', { x: L + i * bw + 1, width: Math.max(1, bw - 2), y: yR(v), height: H - B - yR(v), fill: '#4ea3e6', rx: 1.5 }, svg);
      const d = days[i]; el('title', {}, r).textContent = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}: ${v.toFixed(1)} mm`;
      if (i % 7 === 0) el('text', { x: L + i * bw + bw / 2, y: H - 8, 'text-anchor': 'middle' }, svg).textContent = `${d.slice(4, 6)}/${d.slice(6)}`;
    });
    el('polyline', { points: run15.map((v, i) => `${L + i * bw + bw / 2},${yC(v)}`).join(' '), fill: 'none', stroke: '#e9a23b', 'stroke-width': 2.2 }, svg);
  }
})();
