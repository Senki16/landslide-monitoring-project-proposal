/* SlopeWatch — interactive demo map (NASA open data, no API keys) */
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const fmt = (n, d = 0) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const iso = (dt) => dt.toISOString().slice(0, 10);
  const ymd = (dt) => iso(dt).replace(/-/g, '');
  const SITE = { name: 'Alto de Pavas', lat: 5.950459, lon: -74.861388 };
  const LEVELS = [
    { name: 'Normal', color: '#22c55e' }, { name: 'Watch', color: '#eab308' },
    { name: 'Warning', color: '#f59e0b' }, { name: 'Alert', color: '#ef4444' },
  ];
  const HAZ = ['Low', 'Moderate', 'High', 'Very high'];
  const PLACES = [
    ['Alto de Pavas (study site)', 5.950459, -74.861388], ['San Francisco, Antioquia', 5.9636, -75.1016],
    ['San Luis, Antioquia', 6.0428, -74.9937], ['Cocorná, Antioquia', 6.0586, -75.1856],
    ['Río Claro, Antioquia', 5.9020, -74.8580], ['Puerto Triunfo, Antioquia', 5.8726, -74.6405],
    ['Rionegro, Antioquia', 6.1551, -75.3737], ['Medellín, Antioquia', 6.2442, -75.5812],
    ['Guatapé, Antioquia', 6.2325, -75.1587], ['Granada, Antioquia', 6.1428, -75.1850],
  ];
  if (!window.L) return;

  /* ---------- map & base layers ---------- */
  const map = L.map('map', { zoomControl: false, minZoom: 5, maxZoom: 16 }).setView([6.0, -74.98], 10);
  const imagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Imagery © Esri', maxZoom: 18 }).addTo(map);
  const light = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', { attribution: 'Basemap © Esri', maxZoom: 16 });
  const labels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', { maxZoom: 18, pane: 'shadowPane' }).addTo(map);
  L.control.scale({ position: 'bottomright', metric: true, imperial: false, maxWidth: 140 }).addTo(map);

  /* ---------- NASA layers ---------- */
  const gibs = (layer, d, lvl, ext) => `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer}/default/${d}/GoogleMapsCompatible_Level${lvl}/{z}/{y}/{x}.${ext}`;
  let imergDate = null, imergLayer = null, modisLayer = null;
  const setImerg = (d) => {
    imergDate = d;
    const on = $('#t-rain').checked;
    if (imergLayer) map.removeLayer(imergLayer);
    imergLayer = L.tileLayer(gibs('IMERG_Precipitation_Rate', d, 6, 'png'), { opacity: 0.72, maxNativeZoom: 6, maxZoom: 18, attribution: 'NASA GPM IMERG · GIBS', zIndex: 5 });
    if (on) imergLayer.addTo(map);
    if (modisLayer) { map.removeLayer(modisLayer); modisLayer = null; if ($('#t-modis').checked) addModis(); }
    $('#tl-date').textContent = new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };
  const addModis = () => {
    modisLayer = L.tileLayer(gibs('MODIS_Terra_CorrectedReflectance_TrueColor', imergDate, 9, 'jpg'), { maxNativeZoom: 9, maxZoom: 18, attribution: 'NASA MODIS Terra · GIBS', zIndex: 3 }).addTo(map);
  };

  /* study site & risk zone */
  const siteLayer = L.layerGroup([
    L.circle([SITE.lat, SITE.lon], { radius: 1000, color: '#fff', weight: 2, dashArray: '5 5', fillColor: '#ef4444', fillOpacity: 0.18 }),
    L.circle([SITE.lat, SITE.lon], { radius: 3000, color: '#f59e0b', weight: 1.5, fillOpacity: 0.04 }),
    L.polyline([[5.951316, -74.865089], [5.950459, -74.861388]], { color: '#ef4444', weight: 6 }),
    L.circleMarker([SITE.lat, SITE.lon], { radius: 8, color: '#fff', weight: 3, fillColor: '#0a66ff', fillOpacity: 1 })
      .bindTooltip('Alto de Pavas · study site', { permanent: true, direction: 'right', className: 'site-label', offset: [10, 0] }),
  ]).addTo(map);

  /* EONET events */
  const eventsLayer = L.layerGroup().addTo(map);
  fetch('https://eonet.gsfc.nasa.gov/api/v3/events?category=landslides,floods,severeStorms&status=all&days=90&bbox=-82,13,-66,-5')
    .then((r) => r.json())
    .then((j) => (j.events || []).forEach((ev) => {
      const g = ev.geometry[ev.geometry.length - 1];
      const [lo, la] = g.type === 'Point' ? g.coordinates : g.coordinates[0][0];
      L.circleMarker([la, lo], { radius: 8, color: '#fff', weight: 2, fillColor: '#f59e0b', fillOpacity: 0.95 })
        .bindPopup(`<b>${ev.title.replace(/\s\d{5,}$/, '')}</b><br>${ev.categories[0].title} · ${g.date.slice(0, 10)}<br><small>NASA EONET</small>`)
        .addTo(eventsLayer);
    })).catch(() => {});

  /* layer toggles */
  const toggle = (id, fn) => $(id).addEventListener('change', (e) => fn(e.target.checked));
  toggle('#t-rain', (on) => { if (imergLayer) on ? imergLayer.addTo(map) : map.removeLayer(imergLayer); });
  toggle('#t-modis', (on) => { on ? addModis() : modisLayer && (map.removeLayer(modisLayer), (modisLayer = null)); });
  toggle('#t-site', (on) => (on ? siteLayer.addTo(map) : map.removeLayer(siteLayer)));
  toggle('#t-events', (on) => (on ? eventsLayer.addTo(map) : map.removeLayer(eventsLayer)));
  toggle('#t-labels', (on) => (on ? labels.addTo(map) : map.removeLayer(labels)));

  /* map buttons */
  $('#zin').onclick = () => map.zoomIn();
  $('#zout').onclick = () => map.zoomOut();
  $('#locate').onclick = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((p) => select(p.coords.latitude, p.coords.longitude, 'Your location', true), () => {});
  };
  let baseSat = true;
  $('#basemap').onclick = () => {
    baseSat = !baseSat;
    if (baseSat) { map.removeLayer(light); imagery.addTo(map); } else { map.removeLayer(imagery); light.addTo(map); }
    $('#basemap').classList.toggle('on', !baseSat);
  };

  /* ---------- timeline over the last 7 days of IMERG ---------- */
  const probe = (d) => new Promise((res) => {
    const img = new Image(); img.onload = () => res(true); img.onerror = () => res(false);
    img.src = gibs('IMERG_Precipitation_Rate', d, 6, 'png').replace('{z}', 6).replace('{y}', 30).replace('{x}', 18);
  });
  let days = [], timer = null;
  const slider = $('#tl-range');
  (async () => {
    let latest = null;
    for (let b = 0; b < 6 && !latest; b++) { const d = iso(new Date(Date.now() - b * 864e5)); if (await probe(d)) latest = d; }
    if (!latest) { $('#tl-date').textContent = 'NASA IMERG unavailable'; return; }
    const end = new Date(latest + 'T12:00:00Z');
    days = [...Array(7)].map((_, i) => iso(new Date(end - (6 - i) * 864e5)));
    slider.max = days.length - 1; slider.value = days.length - 1;
    setImerg(latest); setLive(true);
  })();
  const setLive = (on) => $('#tl-live').classList.toggle('on', on);
  slider.addEventListener('input', () => { setImerg(days[+slider.value]); setLive(+slider.value === days.length - 1); });
  $('#tl-play').onclick = () => {
    if (timer) { clearInterval(timer); timer = null; $('#tl-play').classList.remove('playing'); return; }
    $('#tl-play').classList.add('playing');
    let i = 0; slider.value = 0; setImerg(days[0]); setLive(false);
    timer = setInterval(() => {
      i++; if (i >= days.length) { clearInterval(timer); timer = null; $('#tl-play').classList.remove('playing'); setLive(true); return; }
      slider.value = i; setImerg(days[i]); setLive(i === days.length - 1);
    }, 1400);
  };
  $('#tl-live').onclick = () => { if (!days.length) return; slider.value = days.length - 1; setImerg(days[days.length - 1]); setLive(true); };

  /* ---------- location analysis (NASA POWER) ---------- */
  let pin = null;
  const kmTo = (la, lo) => {
    const R = 6371, r = Math.PI / 180, dLa = (la - SITE.lat) * r, dLo = (lo - SITE.lon) * r;
    const a = Math.sin(dLa / 2) ** 2 + Math.cos(SITE.lat * r) * Math.cos(la * r) * Math.sin(dLo / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  };
  function select(lat, lon, name, fly) {
    if (pin) map.removeLayer(pin);
    if (kmTo(lat, lon) > 0.05) pin = L.marker([lat, lon], { icon: L.divIcon({ className: 'pin', html: '<span></span>', iconSize: [22, 22], iconAnchor: [11, 22] }) }).addTo(map);
    else pin = null;
    if (fly) map.flyTo([lat, lon], Math.max(map.getZoom(), 11), { duration: 0.8 });
    $('#loc-name').textContent = name;
    $('#loc-sub').textContent = `${lat.toFixed(4)}, ${lon.toFixed(4)} · ${fmt(kmTo(lat, lon), 1)} km from study site`;
    $('#k-loc').textContent = name.split(',')[0];
    $('#k-locd').textContent = `${fmt(kmTo(lat, lon), 1)} km from Alto de Pavas`;
    ['#p-level', '#k-level'].forEach((s) => ($(s).textContent = '…'));
    const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=PRECTOTCORR,GWETTOP&community=AG&longitude=${lon.toFixed(4)}&latitude=${lat.toFixed(4)}&start=${ymd(new Date(Date.now() - 40 * 864e5))}&end=${ymd(new Date())}&format=JSON`;
    $('#status').innerHTML = '<span class="dot" style="background:#eab308"></span>Loading';
    fetch(url).then((r) => r.json()).then((j) => {
      const P = j.properties.parameter.PRECTOTCORR, S = j.properties.parameter.GWETTOP;
      const d = Object.keys(P).filter((k) => P[k] > -900).sort();
      const rain = d.map((k) => P[k]); const n = rain.length;
      const sum = (a) => a.reduce((x, y) => x + y, 0);
      const r1 = rain[n - 1], r1p = rain[n - 2], r3 = sum(rain.slice(-3)), r3p = sum(rain.slice(-6, -3)), r15 = sum(rain.slice(-15));
      const swv = d.map((k) => S[k]).filter((v) => v > -900); const sw = swv[swv.length - 1];
      let h = 0;
      if (r3 >= 100 || r15 >= 350) h = 3; else if (r3 >= 70 || r15 >= 250) h = 2; else if (r3 >= 40 || r15 >= 150) h = 1;
      if (sw > 0.8 && h < 3) h++;
      const near = kmTo(lat, lon) <= 3 ? 0 : 1; // study-site exposure is high; elsewhere assume medium
      const lv = Math.max(0, h - near);
      const last = new Date(`${d[n - 1].slice(0, 4)}-${d[n - 1].slice(4, 6)}-${d[n - 1].slice(6)}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dl = (a, b) => `${a - b >= 0 ? '↑ +' : '↓ '}${fmt(a - b, 1)} mm`;
      $('#p-pill').dataset.level = lv; $('#p-level').textContent = LEVELS[lv].name;
      $('#p-r1').textContent = fmt(r1, 1); $('#p-r1d').textContent = `${dl(r1, r1p)} vs. previous day`; $('#p-r1d').className = 'd ' + (r1 >= r1p ? 'up' : 'down');
      $('#p-r15').textContent = fmt(r15, 0); $('#p-r15d').textContent = `Hazard ${HAZ[h].toLowerCase()} · as of ${last}`;
      $('#k-r1').textContent = fmt(r1, 1); $('#k-r1d').textContent = dl(r1, r1p); $('#k-r1d').className = 'd ' + (r1 >= r1p ? 'up' : 'down');
      $('#k-r3').textContent = fmt(r3, 1); $('#k-r3d').textContent = dl(r3, r3p); $('#k-r3d').className = 'd ' + (r3 >= r3p ? 'up' : 'down');
      const sl = sw > 0.8 ? ['Saturated', '#ef4444'] : sw > 0.65 ? ['High', '#f59e0b'] : sw > 0.4 ? ['Moderate', '#eab308'] : ['Low', '#22c55e'];
      $('#k-sw').textContent = fmt(sw * 100, 0); $('#k-swd').innerHTML = `<span class="dot" style="background:${sl[1]}"></span>${sl[0]}`;
      $('#k-level').textContent = LEVELS[lv].name; $('#k-level').style.color = LEVELS[lv].color;
      $('#k-leveld').textContent = near ? 'medium exposure assumed' : 'high exposure (study site)';
      $('#status').innerHTML = '<span class="dot" style="background:#22c55e"></span>Live data';
    }).catch(() => {
      $('#status').innerHTML = '<span class="dot" style="background:#ef4444"></span>Offline';
      $('#p-level').textContent = 'Unavailable';
    });
  }
  map.on('click', (e) => select(e.latlng.lat, e.latlng.lng, 'Selected point', false));

  /* ---------- search ---------- */
  const input = $('#search'), results = $('#results');
  let t = null;
  const show = (items) => {
    results.innerHTML = items.map((p, i) => `<button type="button" data-i="${i}">${p[0]}</button>`).join('');
    results.hidden = !items.length;
    results.querySelectorAll('button').forEach((b) => (b.onclick = () => {
      const p = items[+b.dataset.i]; input.value = p[0]; results.hidden = true; select(p[1], p[2], p[0], true);
    }));
  };
  input.addEventListener('focus', () => { if (!input.value) show(PLACES); });
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    const local = PLACES.filter((p) => p[0].toLowerCase().includes(q));
    show(local);
    clearTimeout(t);
    if (q.length < 3) return;
    t = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=co&q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((js) => show(local.concat(js.map((x) => [x.display_name.split(',').slice(0, 3).join(','), +x.lat, +x.lon]))))
        .catch(() => {});
    }, 450);
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('.search')) results.hidden = true; });

  select(SITE.lat, SITE.lon, 'Alto de Pavas (study site)', false);
})();
