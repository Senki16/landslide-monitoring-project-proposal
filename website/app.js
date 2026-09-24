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
  const C = { blue: '#0a66ff', orange: '#f59e0b', red: '#ef4444', green: '#22c55e', yellow: '#eab308', grid: '#eef1f5', axis: '#d8dee8', ink: '#0f172a' };

  /* ---------- active nav link ---------- */
  const page = (location.pathname.split('/').pop() || 'index.html').replace('.html', '') || 'index';
  document.querySelectorAll('.nav nav a[data-page]').forEach((a) => a.classList.toggle('active', a.dataset.page === page));

  /* ---------- proposal visuals (only on pages that have them) ---------- */
  function bars(target, rows, max, fmtV, winIdx) {
    const box = $(target);
    if (!box) return;
    rows.forEach((r, i) => {
      const row = document.createElement('div');
      row.className = 'bar-row' + (i === winIdx ? ' win' : '');
      row.innerHTML = `<span>${r[0]}</span><div class="bar-track"><div class="bar-fill" style="width:${(r[1] / max) * 100}%"></div></div><span class="v">${fmtV(r)}</span>`;
      box.appendChild(row);
    });
  }
  bars('#alt-bars', [
    ['Geographic monitoring system', 68],
    ['Soil-management training', 41],
    ['Historical failure manual', 39],
    ['Relocation of population', 36],
  ], 75, (r) => `${r[1]} / 75`, 0);
  bars('#budget-bars', [
    ['Human resources', 601.8, 29.8], ['Administrative', 496.2, 24.6], ['Services & testing', 334.5, 16.6],
    ['Infrastructure', 288.1, 14.3], ['Equipment & software', 155.6, 7.7], ['Training & events', 111.6, 5.5],
    ['Travel', 25.4, 1.3], ['Materials & documentation', 7.5, 0.4],
  ], 601.8, (r) => `${fmt(r[1], 1)} M · ${r[2]}%`);
  bars('#sens-bars', [
    ['Base scenario', 1765.8, '31.8%'], ['Discount rate 9%', 2288.8, '31.8%'], ['Discount rate 15%', 1341.2, '31.8%'],
    ['Costs +20%', 1437.4, '26.2%'], ['Benefits −20%', 1084.3, '25.0%'], ['No avoided maintenance', 406.5, '17.1%'], ['Benefits −40%', 402.8, '17.3%'],
  ], 2288.8, (r) => `COP ${fmt(r[1], 0)} M · IRR ${r[2]}`, 0);

  const g = $('#gantt');
  if (g) {
    [
      ['Database', [[1, 8]], []],
      ['Dynamic risk matrix', [[3, 12]], [[13, 24]]],
      ['Neural network', [[7, 16]], []],
      ['Monitoring platform', [[9, 18]], []],
      ['Pilot tests & training', [[17, 24]], []],
      ['Reports & dissemination', [[19, 24]], []],
    ].forEach(([name, dev, ops], i) => {
      const row = document.createElement('div');
      row.className = 'g-row';
      let inner = '';
      dev.forEach(([a, b]) => { inner += `<div class="g-bar" style="left:${((a - 1) / 24) * 100}%;width:${((b - a + 1) / 24) * 100}%"></div>`; });
      ops.forEach(([a, b]) => { inner += `<div class="g-bar ops" style="left:${((a - 1) / 24) * 100}%;width:${((b - a + 1) / 24) * 100}%"></div>`; });
      row.innerHTML = `<span><b>SO${i + 1}</b> ${name}</span><div class="g-track">${inner}</div>`;
      g.appendChild(row);
    });
    const ax = document.createElement('div');
    ax.className = 'g-axis';
    ax.innerHTML = '<span></span><div><span>Month 1</span><span>6</span><span>12</span><span>18</span><span>24</span></div>';
    g.appendChild(ax);
  }

  const cf = $('#cf-chart');
  if (cf) {
    const nf = [-1458.1, 97.9, 770.4, 260.4, 770.4, 389.0, 997.9, 487.9, 997.9, 487.9, 997.9];
    const pv = [-1458.1, 87.4, 614.2, 185.4, 489.6, 220.7, 505.6, 220.7, 403.0, 175.9, 321.3];
    let c = 0; const cum = pv.map((v) => (c += v));
    const W = 560, H = 260, L = 48, R = 12, T = 18, B = 28;
    const min = -1600, max = 1900; const y = (v) => T + (max - v) / (max - min) * (H - T - B);
    const bw = (W - L - R) / 11;
    [-1500, -1000, -500, 0, 500, 1000, 1500].forEach((t) => {
      el('line', { x1: L, x2: W - R, y1: y(t), y2: y(t), stroke: t === 0 ? C.axis : C.grid }, cf);
      el('text', { x: L - 8, y: y(t) + 4, 'text-anchor': 'end' }, cf).textContent = fmt(t);
    });
    nf.forEach((v, i) => {
      el('rect', { x: L + i * bw + bw * 0.22, width: bw * 0.56, y: Math.min(y(v), y(0)), height: Math.abs(y(v) - y(0)), fill: i === 0 ? C.red : C.blue, rx: 4 }, cf);
      el('text', { x: L + i * bw + bw / 2, y: H - 8, 'text-anchor': 'middle' }, cf).textContent = i;
    });
    el('polyline', { points: cum.map((v, i) => `${L + i * bw + bw / 2},${y(v)}`).join(' '), fill: 'none', stroke: C.orange, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, cf);
    cum.forEach((v, i) => el('circle', { cx: L + i * bw + bw / 2, cy: y(v), r: 3.5, fill: '#fff', stroke: C.orange, 'stroke-width': 2 }, cf));
    el('text', { x: W - R, y: y(cum[10]) - 10, 'text-anchor': 'end', class: 'strong' }, cf).textContent = 'NPV COP 1,766 M';
  }

  /* ---------- live demo (home page only) ---------- */
  if (!$('#map')) return;
  const SITE = { name: 'Alto de Pavas', lat: 5.950459, lon: -74.861388 };
  const LEVELS = [
    { name: 'Normal', color: '#22c55e' },
    { name: 'Watch', color: '#eab308' },
    { name: 'Warning', color: '#f59e0b' },
    { name: 'Alert', color: '#ef4444' },
  ];
  const HAZ = ['Low', 'Moderate', 'High', 'Very high'];
  const EXP = { 3: 'High', 2: 'Medium', 1: 'Low' };
  const state = { hazard: null, reason: '' };
  const setText = (id, t) => { const n = $(id); if (n) n.textContent = t; };

  /* risk matrix grid (rows: exposure high→low, cols: hazard low→very high) */
  const MCOL = ['#7cc36a', '#a8d06b', '#d6df6a', '#f7d35e', '#f9a94d', '#f47a45', '#e8473e'];
  const mx = $('#matrix');
  [3, 2, 1].forEach((v) => {
    mx.insertAdjacentHTML('beforeend', `<div class="rl">${EXP[v]}</div>`);
    for (let h = 0; h < 4; h++) mx.insertAdjacentHTML('beforeend', `<div class="c" data-h="${h}" data-v="${v}" style="background:${MCOL[h + v]}" title="Hazard ${HAZ[h]} · exposure ${EXP[v]}"></div>`);
  });
  mx.insertAdjacentHTML('beforeend', '<div></div>' + HAZ.map((h) => `<div class="cl">${h}</div>`).join(''));
  mx.insertAdjacentHTML('beforeend', '<div class="axis">Rainfall hazard →</div>');

  if (!window.L) { setText('#alert-level', 'Map unavailable'); return; }
  const small = innerWidth < 900;
  const map = L.map('map', { zoomControl: false, scrollWheelZoom: false, attributionControl: true });
  map.setView([SITE.lat + 0.02, SITE.lon], small ? 10 : 11);
  if (!small) map.panBy([-innerWidth * 0.12, 0], { animate: false });
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Imagery © Esri', maxZoom: 18 }).addTo(map);
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', { maxZoom: 18, pane: 'shadowPane' }).addTo(map);

  L.circle([SITE.lat, SITE.lon], { radius: 1000, color: '#fff', weight: 2, dashArray: '4 4', fillColor: '#0a66ff', fillOpacity: 0.15 }).addTo(map)
    .bindPopup('<b>Alto de Pavas</b><br>Route 60, km 87 · curved section with back slope<br>1 km monitoring buffer');
  L.circleMarker([SITE.lat, SITE.lon], { radius: 8, color: '#fff', weight: 3, fillColor: '#0a66ff', fillOpacity: 1 }).addTo(map)
    .bindTooltip('Alto de Pavas', { permanent: true, direction: 'right', className: 'site-label', offset: [10, 0] });

  /* NASA GPM IMERG via GIBS */
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
        imergLayer = L.tileLayer(imergUrl(d), { opacity: 0.7, maxNativeZoom: 6, maxZoom: 18, attribution: 'NASA GPM IMERG · GIBS' });
        if ($('#imerg-toggle').checked) imergLayer.addTo(map);
        setText('#imerg-date', d);
        return;
      }
    }
    setText('#imerg-date', 'unavailable');
  })();
  $('#imerg-toggle').addEventListener('change', (e) => { if (imergLayer) (e.target.checked ? imergLayer.addTo(map) : map.removeLayer(imergLayer)); });

  /* NASA EONET events with NASA Worldview thumbnails */
  const eonetLayer = L.layerGroup().addTo(map);
  $('#eonet-toggle').addEventListener('change', (e) => (e.target.checked ? eonetLayer.addTo(map) : map.removeLayer(eonetLayer)));
  const DESC = { floods: 'Flooding reported in the region; heavy rain also raises slope-failure risk.', severeStorms: 'Severe storm activity; intense rainfall can trigger landslides.', landslides: 'Landslide event reported by NASA EONET sources.' };
  const thumb = (la, lo, date) => {
    const t = new Date(date); t.setUTCDate(t.getUTCDate() - 1);
    const b = [la - 2, lo - 3.5, la + 2, lo + 3.5].map((v) => v.toFixed(2)).join(',');
    return `https://wvs.earthdata.nasa.gov/api/v1/snapshot?REQUEST=GetSnapshot&LAYERS=MODIS_Terra_CorrectedReflectance_TrueColor,Coastlines_15m&CRS=EPSG:4326&TIME=${isoDay(t)}&BBOX=${b}&FORMAT=image/jpeg&WIDTH=336&HEIGHT=188`;
  };
  fetch('https://eonet.gsfc.nasa.gov/api/v3/events?category=landslides,floods,severeStorms&status=all&days=90&bbox=-82,13,-66,-5')
    .then((r) => r.json())
    .then((j) => {
      const list = $('#events'); list.innerHTML = '';
      const evs = (j.events || []).slice(0, 3);
      if (!evs.length) { list.innerHTML = '<li class="muted">No landslide, flood or storm events reported in the region in the last 90 days.</li>'; return; }
      evs.forEach((ev) => {
        const geo = ev.geometry[ev.geometry.length - 1];
        const [lo, la] = geo.type === 'Point' ? geo.coordinates : geo.coordinates[0][0];
        const date = new Date(geo.date);
        const cat = ev.categories[0];
        const title = ev.title.replace(/\s\d{5,}$/, '');
        L.circleMarker([la, lo], { radius: 8, color: '#fff', weight: 2, fillColor: '#f59e0b', fillOpacity: 0.95 }).addTo(eonetLayer).bindPopup(`<b>${title}</b><br>${cat.title} · ${isoDay(date)}`);
        const src = ev.sources && ev.sources[0] ? ev.sources[0].url : 'https://eonet.gsfc.nasa.gov/';
        list.insertAdjacentHTML('beforeend', `<li>
          <img class="thumb" loading="lazy" alt="NASA Terra MODIS true-color image near ${title}" src="${thumb(la, lo, geo.date)}">
          <div><span class="badge ${cat.id}">${cat.title}</span><h5>${title}</h5><p>${DESC[cat.id] || 'Natural event reported by NASA EONET.'} <a href="${src}" target="_blank" rel="noopener">Source</a></p></div>
          <span class="date">${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></li>`);
      });
    })
    .catch(() => { $('#events').innerHTML = '<li class="muted">NASA EONET is not reachable right now.</li>'; });

  /* NASA POWER: rainfall + soil wetness at the study site */
  const ymd = (dt) => dt.toISOString().slice(0, 10).replace(/-/g, '');
  const powerUrl = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=PRECTOTCORR,GWETTOP&community=AG&longitude=${SITE.lon}&latitude=${SITE.lat}&start=${ymd(new Date(Date.now() - 60 * 864e5))}&end=${ymd(new Date())}&format=JSON`;
  const delta = (id, now, prev, unit) => {
    const n = $(id); if (!n) return;
    if (prev == null) { n.textContent = unit; return; }
    const dlt = now - prev;
    n.className = 'd ' + (dlt > 0 ? 'up' : 'down');
    n.textContent = `${dlt > 0 ? '↑ +' : '↓ '}${fmt(dlt, 1)} mm ${unit}`;
  };
  fetch(powerUrl)
    .then((r) => r.json())
    .then((j) => {
      const P = j.properties.parameter.PRECTOTCORR, S = j.properties.parameter.GWETTOP;
      const days = Object.keys(P).filter((k) => P[k] > -900).sort();
      if (days.length < 20) throw new Error('not enough data');
      const rain = days.map((k) => P[k]);
      const swAll = days.map((k) => (S[k] > -900 ? S[k] : null));
      const n = rain.length, sum = (a) => a.reduce((x, y) => x + y, 0);
      const r1 = rain[n - 1], r1p = rain[n - 2];
      const r3 = sum(rain.slice(-3)), r3p = sum(rain.slice(-6, -3));
      const r15 = sum(rain.slice(-15));
      const sw = [...swAll].reverse().find((v) => v != null);
      let h = 0;
      if (r3 >= 100 || r15 >= 350) h = 3; else if (r3 >= 70 || r15 >= 250) h = 2; else if (r3 >= 40 || r15 >= 150) h = 1;
      const why = [`${fmt(r3, 1)} mm in 3 days`, `${fmt(r15, 0)} mm in 15 days`];
      if (sw != null && sw > 0.8 && h < 3) { h += 1; why.push('saturated soil'); }
      state.hazard = h; state.reason = why.join(' · ');
      const last = days[n - 1], lastTxt = `${last.slice(0, 4)}-${last.slice(4, 6)}-${last.slice(6)}`;
      setText('#a-r1', fmt(r1, 1)); setText('#a-r15', fmt(r15, 0));
      setText('#a-r1d', `as of ${new Date(lastTxt + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`); setText('#a-r15d', `hazard: ${HAZ[h].toLowerCase()}`);
      setText('#k-r1', fmt(r1, 1)); setText('#k-r3', fmt(r3, 1));
      delta('#k-r1d', r1, r1p, 'vs. previous day'); delta('#k-r3d', r3, r3p, 'vs. previous 3 days');
      if (sw != null) {
        setText('#k-sw', fmt(sw * 100, 0));
        const lvl = sw > 0.8 ? ['Saturated', '#ef4444'] : sw > 0.65 ? ['High', '#f59e0b'] : sw > 0.4 ? ['Moderate', '#eab308'] : ['Low', '#22c55e'];
        $('#k-swd').innerHTML = `<span class="dot" style="background:${lvl[1]}"></span>${lvl[0]}`;
      }
      $('#k-status').innerHTML = '<span class="dot" style="background:#22c55e"></span>Online · NASA data received';
      setText('#power-meta', `latest valid day ${lastTxt}`);
      render();
      drawRain(days.slice(-45), rain.slice(-45), rain);
    })
    .catch(() => {
      setText('#alert-level', 'Unavailable');
      setText('#alert-why', 'NASA POWER could not be reached. Try again in a moment.');
      $('#k-status').innerHTML = '<span class="dot" style="background:#ef4444"></span>Offline';
    });

  function render() {
    const e = +$('#exposure').value;
    setText('#r-exp', EXP[e]);
    mx.querySelectorAll('.c').forEach((c) => c.classList.toggle('on', state.hazard === +c.dataset.h && e === +c.dataset.v));
    if (state.hazard == null) return;
    const lv = Math.max(0, state.hazard - (3 - e));
    $('#alert-pill').dataset.level = lv;
    setText('#alert-level', LEVELS[lv].name);
    setText('#r-level', LEVELS[lv].name);
    $('#r-level').style.color = LEVELS[lv].color;
    setText('#r-haz', HAZ[state.hazard]);
    setText('#alert-why', `Hazard ${HAZ[state.hazard].toLowerCase()} · ${state.reason} · exposure ${EXP[e].toLowerCase()}`);
  }
  $('#exposure').addEventListener('change', render);
  render();

  function drawRain(days, rain, all) {
    const svg = $('#rain-chart'); svg.innerHTML = '';
    const W = 900, H = 250, L = 36, R = 44, T = 12, B = 30;
    const off = all.length - rain.length;
    const run15 = rain.map((_, i) => all.slice(Math.max(0, off + i - 14), off + i + 1).reduce((a, b) => a + b, 0));
    const maxR = Math.max(20, Math.ceil(Math.max(...rain) / 20) * 20);
    const maxC = Math.max(100, Math.ceil(Math.max(...run15) / 100) * 100);
    const bw = (W - L - R) / rain.length;
    const yR = (v) => H - B - (v / maxR) * (H - T - B), yC = (v) => H - B - (v / maxC) * (H - T - B);
    const defs = el('defs', {}, svg); const lg = el('linearGradient', { id: 'rg', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: 0, 'stop-color': '#2563eb' }, lg); el('stop', { offset: 1, 'stop-color': '#93c5fd' }, lg);
    for (let t = 0; t <= 4; t++) {
      el('line', { x1: L, x2: W - R, y1: yR((maxR / 4) * t), y2: yR((maxR / 4) * t), stroke: t ? '#eef1f5' : '#d8dee8' }, svg);
      el('text', { x: L - 8, y: yR((maxR / 4) * t) + 4, 'text-anchor': 'end' }, svg).textContent = fmt((maxR / 4) * t);
      el('text', { x: W - R + 8, y: yR((maxR / 4) * t) + 4 }, svg).textContent = fmt((maxC / 4) * t);
    }
    rain.forEach((v, i) => {
      const r = el('rect', { x: L + i * bw + 3, width: Math.max(1, bw - 6), y: yR(v), height: Math.max(0, H - B - yR(v)), fill: 'url(#rg)', rx: 3 }, svg);
      const d = days[i]; el('title', {}, r).textContent = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}: ${v.toFixed(1)} mm`;
      if (i % 7 === 0) el('text', { x: L + i * bw + bw / 2, y: H - 8, 'text-anchor': 'middle' }, svg).textContent = new Date(`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    el('polyline', { points: run15.map((v, i) => `${L + i * bw + bw / 2},${yC(v)}`).join(' '), fill: 'none', stroke: '#f59e0b', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, svg);
  }
})();
