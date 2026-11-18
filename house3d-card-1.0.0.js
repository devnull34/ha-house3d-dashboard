/* house3d-card — 3D floor plan with live Home Assistant devices */
const CARD_VERSION = '1.0.0';
const THREE_URLS = ['/local/house3d/three.module.min.js', 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js'];

/* ---------- House geometry (traced from the Cubicasa plans, in plan pixels) ----------
   Each floor's exterior bbox is mapped onto W x D feet; rooms/walls are in the same pixels.
   Wall: [x1,y1,x2,y2, openings[[from,to,'w'|'d'|'g']]]                                   */
const PLAN = {
  W: 45.7, D: 27.9,
  floors: [
    {
      id: 'lower', name: 'Lower Level', short: 'Lower', bbox: [185, 258, 1000, 745],
      rooms: [
        { id: 'garage', name: 'Garage', dims: `23'7" × 26'7"`, r: [185, 258, 617, 745], t: 'garage' },
        { id: 'lower_bath', name: 'Bath', dims: `4'2" × 6'9"`, r: [617, 258, 700, 388], t: 'bath' },
        { id: 'lower_room', name: 'Room', dims: `7'9" × 14'1"`, p: [[617, 388], [700, 388], [700, 520], [765, 520], [765, 640], [617, 640]], t: 'room' },
        { id: 'lower_hall', name: 'Hall', dims: `4'2" × 5'1"`, r: [617, 640, 700, 745], t: 'hall' },
        { id: 'rec_room', name: 'Recreation Room', dims: `16'11" × 26'7"`, p: [[700, 258], [1000, 258], [1000, 745], [765, 745], [765, 520], [700, 520]], t: 'living' },
        { id: 'covered_deck', name: 'Covered Deck', dims: `15'9" × 12'8"`, r: [715, 20, 1015, 258], t: 'deck', out: true },
      ],
      walls: [
        [185, 258, 1000, 258, [[340, 400, 'w'], [708, 760, 'w'], [820, 905, 'd']]],
        [185, 745, 1000, 745],
        [185, 258, 185, 745, [[285, 465, 'g'], [485, 525, 'd'], [545, 715, 'g']]],
        [1000, 258, 1000, 745, [[285, 405, 'w']]],
        [617, 258, 617, 745, [[655, 715, 'd']]],
        [617, 388, 700, 388],
        [700, 258, 700, 520, [[318, 365, 'd'], [400, 450, 'd']]],
        [700, 520, 765, 520],
        [765, 520, 765, 628],
        [617, 640, 700, 640, [[625, 690, 'd']]],
      ],
      stairs: [{ r: [700, 628, 765, 745], up: 'n' }],
      posts: [[715, 20], [1015, 20], [715, 118], [1015, 118], [715, 190], [1015, 190]],
      fixtures: [],
    },
    {
      id: 'main', name: 'Main Floor', short: 'Main', bbox: [185, 265, 975, 745],
      rooms: [
        { id: 'living', name: 'Living Room', dims: `18'3" × 13'4"`, r: [185, 510, 503, 745], t: 'living' },
        { id: 'dining', name: 'Dining Room', dims: `12'7" × 13'11"`, r: [185, 265, 408, 510], t: 'living' },
        { id: 'kitchen', name: 'Kitchen', dims: `10'8" × 13'7"`, r: [408, 265, 590, 505], t: 'kitchen' },
        { id: 'nook', name: 'Breakfast Nook', dims: `8'5" × 13'7"`, r: [590, 265, 737, 505], t: 'kitchen' },
        { id: 'family', name: 'Family Room', dims: `13'5" × 27'7"`, r: [737, 265, 975, 745], t: 'living' },
        { id: 'foyer', name: 'Foyer', dims: `13'1" × 13'7"`, p: [[503, 690], [575, 690], [575, 505], [737, 505], [737, 745], [503, 745]], t: 'hall' },
        { id: 'half_bath', name: 'Bath', dims: `3'6" × 6'7"`, r: [503, 470, 575, 615], t: 'bath' },
        { id: 'deck', name: 'Deck', dims: `19'10" × 13'8"`, p: [[625, 25], [970, 25], [970, 265], [525, 265], [525, 195], [625, 195]], t: 'deck', out: true },
      ],
      walls: [
        [185, 265, 975, 265, [[248, 347, 'w'], [482, 533, 'w'], [625, 715, 'w'], [795, 882, 'd']]],
        [185, 745, 975, 745, [[237, 292, 'w'], [357, 410, 'w'], [520, 548, 'w'], [552, 605, 'd'], [610, 638, 'w'], [745, 800, 'w'], [862, 915, 'w']]],
        [185, 265, 185, 745],
        [975, 265, 975, 745],
        [408, 265, 408, 410],
        [408, 460, 408, 510],
        [185, 510, 240, 510],
        [350, 510, 503, 510],
        [503, 470, 503, 745],
        [575, 470, 575, 690],
        [503, 470, 575, 470, [[515, 562, 'd']]],
        [503, 615, 575, 615],
        [503, 690, 575, 690, [[515, 565, 'd']]],
        [737, 505, 737, 690],
      ],
      stairs: [{ r: [663, 505, 737, 690], up: 'n', rail: true }],
      fixtures: [
        { r: [487, 365, 598, 408], h: 3, c: '#3a4458' },            // island
        { r: [410, 268, 595, 300], h: 3, c: '#323b4d' },            // back counter
        { r: [410, 300, 445, 408], h: 3, c: '#323b4d' },            // range wall
        { r: [975, 545, 1015, 645], h: 7.5, c: '#4a3b36' },         // chimney
        { r: [932, 552, 975, 638], h: 1, c: '#5a463f' },            // hearth
      ],
    },
    {
      id: 'upper', name: 'Upper Floor', short: 'Upper', bbox: [47, 68, 1153, 748],
      rooms: [
        { id: 'bedroom_nw', name: 'Bedroom', dims: `11'7" × 13'6"`, r: [47, 68, 338, 402], t: 'bed' },
        { id: 'laundry', name: 'Laundry', dims: `6'7" × 3'6"`, r: [338, 205, 502, 302], t: 'bath' },
        { id: 'hall_bath', name: 'Bath', dims: `9'1" × 9'9"`, p: [[400, 68], [622, 68], [622, 312], [502, 312], [502, 205], [400, 205]], t: 'bath' },
        { id: 'primary_bath', name: 'Primary Bath', dims: `13'7" × 11'8"`, p: [[622, 68], [700, 68], [700, 20], [890, 20], [890, 68], [962, 68], [962, 262], [622, 262]], t: 'bath' },
        { id: 'wic', name: 'W.I.C.', dims: `7'6" × 7'6"`, r: [962, 68, 1153, 262], t: 'hall' },
        { id: 'upper_hall', name: 'Hall', dims: `19'9" × 4'4"`, r: [338, 302, 818, 402], t: 'hall' },
        { id: 'bedroom_sw', name: 'Bedroom', dims: `15'2" × 13'8"`, r: [47, 402, 425, 748], t: 'bed' },
        { id: 'bedroom_s', name: 'Bedroom', dims: `12'7" × 13'8"`, r: [425, 402, 733, 748], t: 'bed' },
        { id: 'primary', name: 'Primary Bedroom', dims: `13'5" × 19'8"`, r: [818, 262, 1153, 748], t: 'bed' },
      ],
      walls: [
        [47, 68, 700, 68, [[165, 225, 'w'], [475, 530, 'w']]],
        [700, 20, 700, 68], [700, 20, 890, 20, [[735, 840, 'w']]], [890, 20, 890, 68],
        [890, 68, 1153, 68],
        [47, 748, 1153, 748, [[130, 205, 'w'], [295, 370, 'w'], [555, 615, 'w'], [830, 895, 'w'], [990, 1060, 'w']]],
        [47, 68, 47, 748],
        [1153, 68, 1153, 748],
        [338, 68, 338, 402, [[330, 385, 'd']]],
        [47, 402, 733, 402, [[350, 410, 'd'], [435, 490, 'd']]],
        [425, 402, 425, 748],
        [733, 402, 733, 748, [[650, 705, 'd']]],
        [818, 262, 818, 748, [[320, 380, 'd']]],
        [338, 312, 622, 312, [[530, 580, 'd']]],
        [338, 205, 502, 205],
        [400, 68, 400, 205],
        [502, 205, 502, 312],
        [622, 68, 622, 312],
        [622, 262, 1153, 262, [[830, 875, 'd'], [1025, 1075, 'd']]],
        [962, 68, 962, 262],
        [622, 312, 818, 312, [[640, 700, 'd']]],
      ],
      stairs: [{ r: [733, 405, 818, 650], up: 'n', void: true }],
      fixtures: [],
    },
  ],
};

const ROOM_TINT = { living: '#1d2534', kitchen: '#212433', bed: '#1f2232', bath: '#18292f', hall: '#1a1f2a', garage: '#181b21', room: '#1c2130', deck: '#272119' };

const ALIASES = {
  garage: ['garage'], rec_room: ['recreation room', 'rec room', 'basement', 'game room', 'playroom', 'family room downstairs'],
  lower_bath: ['basement bath', 'basement bathroom', 'downstairs bath', 'lower bath'], lower_room: ['basement room', 'storage', 'utility', 'utility room', 'mechanical'],
  lower_hall: ['basement hall'], covered_deck: ['covered deck', 'patio', 'porch'],
  living: ['living room', 'living', 'lounge'], dining: ['dining room', 'dining'], kitchen: ['kitchen'], nook: ['breakfast nook', 'nook'],
  family: ['family room', 'den', 'great room', 'tv room'], foyer: ['foyer', 'entry', 'entryway', 'front door', 'entrance'],
  half_bath: ['half bath', 'powder room', 'guest bath'], deck: ['deck', 'backyard', 'back deck'],
  bedroom_nw: ['bedroom 1'], bedroom_sw: ['bedroom 2'], bedroom_s: ['bedroom 3'],
  laundry: ['laundry', 'laundry room'], hall_bath: ['bathroom', 'hall bath', 'hall bathroom', 'upstairs bath'],
  primary_bath: ['primary bath', 'primary bathroom', 'master bath', 'master bathroom', 'ensuite'],
  wic: ['walk in closet', 'wic', 'closet', 'master closet', 'primary closet'], upper_hall: ['hallway', 'upstairs hall', 'upstairs', 'hall'],
  primary: ['primary bedroom', 'master bedroom', 'master', 'primary', 'bedroom'],
};

const MARKER_DOMAINS = new Set(['light', 'switch', 'fan', 'climate', 'media_player', 'cover', 'lock', 'camera', 'vacuum', 'humidifier', 'water_heater', 'alarm_control_panel', 'valve', 'siren', 'input_boolean', 'binary_sensor', 'sensor', 'remote']);
const BIN_CLASSES = new Set(['door', 'window', 'garage_door', 'opening', 'motion', 'occupancy', 'presence', 'moisture', 'smoke', 'gas', 'carbon_monoxide', 'lock', 'vibration', 'sound']);
const STAT_SENSORS = new Set(['temperature', 'humidity']);
const TOGGLE = new Set(['light', 'switch', 'fan', 'input_boolean', 'siren', 'humidifier']);
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const CSS = `
:host{display:block;--h3-bg:#0b0f17;--h3-panel:rgba(18,23,34,.72);--h3-line:rgba(255,255,255,.08);--h3-text:#e8edf6;--h3-dim:#8a94a8;--h3-accent:#7aa2ff}
ha-card{overflow:hidden;background:var(--h3-bg);border:1px solid var(--h3-line);border-radius:var(--ha-card-border-radius,16px)}
.wrap{position:relative;width:100%;height:var(--h3-height,640px);background:radial-gradient(120% 90% at 50% 10%,#18223a 0%,#0d121c 55%,#080b11 100%);font-family:var(--paper-font-body1_-_font-family,Inter,system-ui,sans-serif);color:var(--h3-text);user-select:none;-webkit-user-select:none}
canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;outline:none}
.ov{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.glass{background:var(--h3-panel);backdrop-filter:blur(14px) saturate(140%);-webkit-backdrop-filter:blur(14px) saturate(140%);border:1px solid var(--h3-line);box-shadow:0 8px 30px rgba(0,0,0,.35)}
.top{position:absolute;left:14px;right:14px;top:14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;pointer-events:none}
.top>*{pointer-events:auto}
.title{padding:9px 14px;border-radius:12px;font-weight:600;letter-spacing:.2px;font-size:15px;display:flex;align-items:center;gap:8px}
.title small{color:var(--h3-dim);font-weight:500;font-size:12px}
.seg{display:flex;padding:4px;border-radius:12px;gap:2px}
.seg button{all:unset;cursor:pointer;padding:6px 12px;border-radius:9px;font-size:13px;color:var(--h3-dim);transition:all .2s}
.seg button:hover{color:var(--h3-text)}
.seg button.on{background:rgba(122,162,255,.18);color:#fff;box-shadow:inset 0 0 0 1px rgba(122,162,255,.45)}
.sp{flex:1}
.ib{all:unset;cursor:pointer;width:36px;height:36px;border-radius:11px;display:grid;place-items:center;color:var(--h3-dim)}
.ib:hover{color:#fff}
.ib ha-icon{--mdc-icon-size:20px}
.chips{position:absolute;left:14px;bottom:14px;right:14px;display:flex;gap:8px;flex-wrap:wrap;pointer-events:none}
.chip{pointer-events:auto;display:flex;align-items:center;gap:6px;padding:7px 11px;border-radius:999px;font-size:12.5px;color:var(--h3-text)}
.chip ha-icon{--mdc-icon-size:16px;color:var(--c,var(--h3-dim))}
.chip.btn{cursor:pointer}
.m{position:absolute;left:0;top:0;pointer-events:auto;cursor:pointer;display:flex;flex-direction:column;align-items:center;will-change:transform;transition:opacity .25s}
.m .d{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:rgba(22,28,40,.85);border:1px solid rgba(255,255,255,.14);color:#aab3c5;box-shadow:0 4px 14px rgba(0,0,0,.45);transition:all .25s;backdrop-filter:blur(6px)}
.m .d ha-state-icon,.m .d ha-icon{--mdc-icon-size:17px}
.m.act .d{background:var(--c);color:#10141c;border-color:transparent;box-shadow:0 0 0 4px color-mix(in srgb,var(--c) 25%,transparent),0 0 22px color-mix(in srgb,var(--c) 70%,transparent)}
.m.una .d{opacity:.45;border-style:dashed}
.m .v{margin-top:3px;font-size:10.5px;font-weight:600;padding:1px 6px;border-radius:6px;background:rgba(10,14,22,.8);color:#dfe6f3;white-space:nowrap}
.m .v:empty{display:none}
.m:hover .d{transform:scale(1.15)}
.rl{position:absolute;left:0;top:0;pointer-events:auto;cursor:pointer;text-align:center;white-space:nowrap;will-change:transform;transition:opacity .25s;line-height:1.15}
.rl .n{font-size:10.5px;letter-spacing:1.4px;text-transform:uppercase;color:rgba(220,228,245,.78);font-weight:600;text-shadow:0 1px 6px rgba(0,0,0,.9)}
.rl .s{font-size:11px;color:#9fe3c8;font-weight:600;text-shadow:0 1px 6px rgba(0,0,0,.9)}
.rl .s:empty{display:none}
.rl:hover .n{color:#fff}
.tip{position:absolute;pointer-events:none;padding:8px 11px;border-radius:10px;font-size:12px;opacity:0;transition:opacity .15s;z-index:99999;max-width:240px}
.tip b{display:block;font-weight:600;margin-bottom:2px}
.tip span{color:var(--h3-dim)}
.pop{position:absolute;left:14px;bottom:58px;max-height:50%;overflow:auto;border-radius:14px;padding:6px;min-width:240px;display:none;z-index:100000}
.pop.show{display:block}
.pop div{padding:7px 10px;border-radius:8px;font-size:12.5px;cursor:pointer;display:flex;justify-content:space-between;gap:12px}
.pop div:hover{background:rgba(255,255,255,.06)}
.pop div span{color:var(--h3-dim)}
.load{position:absolute;inset:0;display:grid;place-items:center;color:var(--h3-dim);font-size:13px}
.err{color:#ff9a9a;padding:20px}
`;

class House3DCard extends HTMLElement {
  static getStubConfig() { return { title: 'Home' }; }
  getCardSize() { return 10; }
  getGridOptions() { return { columns: 'full', rows: 10, min_rows: 6 }; }

  setConfig(config) {
    this._cfg = { title: 'Home', default_floor: 'all', wall_height: 4.6, floor_gap: 14, height: null, rooms: {}, entities: {}, exclude: [], ...config };
    if (!this.shadowRoot) this._dom();
    if (this._cfg.height) this._wrap.style.setProperty('--h3-height', this._cfg.height);
    this._sig = null;
    if (this._alive && !this._booted) { this._booted = true; this._boot(); }
    if (this._hass) this.hass = this._hass;
  }

  set hass(h) {
    this._hass = h;
    if (!this._wrap) return;
    const sig = [h.entities, h.devices, h.areas, Object.keys(h.states).length].map((x) => (typeof x === 'object' ? x : String(x)));
    if (!this._sig || sig.some((x, i) => x !== this._sig[i])) { this._sig = sig; this._collect(); }
    this._sync();
  }
  get hass() { return this._hass; }

  connectedCallback() {
    this._alive = true;
    if (!this._cfg) return;
    if (!this._booted) { this._booted = true; this._boot(); }
    else this._loop();
  }
  disconnectedCallback() { this._alive = false; cancelAnimationFrame(this._raf); }

  /* ---------------- DOM ---------------- */
  _dom() {
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${CSS}</style><ha-card><div class="wrap">
      <canvas tabindex="0"></canvas><div class="ov"></div>
      <div class="top"><div class="title glass"><ha-icon icon="mdi:home-variant-outline" style="--mdc-icon-size:18px;color:var(--h3-accent)"></ha-icon><span class="tt"></span><small class="sub"></small></div>
        <div class="seg glass"></div><div class="sp"></div>
        <button class="ib glass reset" title="Reset view"><ha-icon icon="mdi:crosshairs-gps"></ha-icon></button></div>
      <div class="chips"></div><div class="pop glass"></div><div class="tip glass"></div>
      <div class="load">Loading 3D engine…</div></div></ha-card>`;
    const $ = (s) => root.querySelector(s);
    Object.assign(this, { _wrap: $('.wrap'), _canvas: $('canvas'), _ov: $('.ov'), _seg: $('.seg'), _chips: $('.chips'), _tip: $('.tip'), _pop: $('.pop'), _load: $('.load') });
    $('.reset').onclick = () => this._setFloor(this._floor, true);
    this._wrap.addEventListener('click', (e) => { if (!e.composedPath().some((n) => n.classList?.contains('pop') || n.classList?.contains('btn'))) this._pop.classList.remove('show'); });
  }

  async _boot() {
    let err;
    for (const u of this._cfg.three_url ? [this._cfg.three_url] : THREE_URLS) { try { this.T = await import(u); break; } catch (e) { err = e; } }
    if (!this.T) { this._load.innerHTML = `<div class="err">Could not load three.js (${err?.message}). Set <code>three_url</code>.</div>`; return; }
    this._load.remove();
    this._initScene();
    this._buildHouse();
    this._buildSeg();
    if (this._hass) { this._collect(); this._sync(); }
    this._setFloor(this._cfg.default_floor, true, true);
    this._loop();
  }

  /* ---------------- three.js scene ---------------- */
  _initScene() {
    const T = this.T;
    const r = (this._r = new T.WebGLRenderer({ canvas: this._canvas, antialias: true, alpha: true }));
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    this._scene = new T.Scene();
    this._scene.fog = new T.Fog(0x0b0f17, 140, 260);
    this._cam = new T.PerspectiveCamera(38, 1, 0.5, 600);
    this._scene.add(new T.HemisphereLight(0xbfd4ff, 0x1a1410, 0.9));
    const sun = new T.DirectionalLight(0xffffff, 1.4); sun.position.set(-30, 60, 40); this._scene.add(sun);
    const rim = new T.DirectionalLight(0x7aa2ff, 0.5); rim.position.set(40, 30, -50); this._scene.add(rim);
    // ground disc
    const g = document.createElement('canvas'); g.width = g.height = 256;
    const gx = g.getContext('2d'); const gr = gx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, 'rgba(60,80,120,.35)'); gr.addColorStop(1, 'rgba(60,80,120,0)'); gx.fillStyle = gr; gx.fillRect(0, 0, 256, 256);
    const ground = new T.Mesh(new T.CircleGeometry(70, 64), new T.MeshBasicMaterial({ map: new T.CanvasTexture(g), transparent: true, depthWrite: false }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.8; this._scene.add(ground);
    const grid = new T.GridHelper(120, 60, 0x2a3550, 0x182033); grid.position.y = -0.79; grid.material.transparent = true; grid.material.opacity = 0.35; this._scene.add(grid);
    // glow texture
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const cx = c.getContext('2d'); const cg = cx.createRadialGradient(64, 64, 0, 64, 64, 64);
    cg.addColorStop(0, 'rgba(255,255,255,1)'); cg.addColorStop(0.25, 'rgba(255,255,255,.55)'); cg.addColorStop(1, 'rgba(255,255,255,0)');
    cx.fillStyle = cg; cx.fillRect(0, 0, 128, 128);
    this._glowTex = new T.CanvasTexture(c);
    // camera rig
    this._rig = { target: new T.Vector3(), theta: -0.6, phi: 0.95, radius: 80 };
    this._goal = null;
    this._controls();
    new ResizeObserver(() => this._resize()).observe(this._wrap);
    this._resize();
  }

  _resize() {
    if (!this._r) return;
    const w = this._wrap.clientWidth, h = this._wrap.clientHeight;
    if (!w || !h) return;
    this._r.setSize(w, h, false); this._cam.aspect = w / h; this._cam.updateProjectionMatrix();
    this._W = w; this._H = h; this._dirty = true;
  }

  _mats(floorId) {
    const T = this.T;
    const mk = (o) => { const m = new T.MeshStandardMaterial(o); m.userData.base = { opacity: o.opacity ?? 1, transparent: !!o.transparent }; return m; };
    return {
      wall: mk({ color: 0x2b3448, roughness: 0.85, metalness: 0.05 }),
      ext: mk({ color: 0x323c52, roughness: 0.8, metalness: 0.05 }),
      cap: mk({ color: 0x9db8ff, emissive: 0x4a6cc0, emissiveIntensity: 0.55, roughness: 0.4 }),
      glass: mk({ color: 0x8ec5ff, emissive: 0x2a5a9a, emissiveIntensity: 0.5, transparent: true, opacity: 0.35, roughness: 0.1 }),
      slab: mk({ color: 0x0e131c, roughness: 1 }),
      stair: mk({ color: 0x3a4560, roughness: 0.7 }),
      post: mk({ color: 0x5b4a3a, roughness: 0.8 }),
      rail: mk({ color: 0x8a97b5, roughness: 0.5, transparent: true, opacity: 0.6 }),
    };
  }

  _buildHouse() {
    const T = this.T, P = PLAN, H = this._cfg.wall_height;
    this._floors = {}; this._rooms = {};
    P.floors.forEach((f, idx) => {
      const [bx1, by1, bx2, by2] = f.bbox;
      const X = (px) => ((px - bx1) / (bx2 - bx1)) * P.W - P.W / 2;
      const Z = (py) => ((py - by1) / (by2 - by1)) * P.D - P.D / 2;
      const grp = new T.Group(); grp.position.y = idx * this._cfg.floor_gap; this._scene.add(grp);
      const M = this._mats(f.id);
      const allMats = Object.values(M);
      const box = (x1, z1, x2, z2, y1, y2, mat) => {
        const m = new T.Mesh(new T.BoxGeometry(Math.max(Math.abs(x2 - x1), 0.05), y2 - y1, Math.max(Math.abs(z2 - z1), 0.05)), mat);
        m.position.set((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2); grp.add(m); return m;
      };
      // base slab
      box(-P.W / 2 - 0.3, -P.D / 2 - 0.3, P.W / 2 + 0.3, P.D / 2 + 0.3, -0.6, 0, M.slab);
      // rooms
      for (const rm of f.rooms) {
        const poly = (rm.p || [[rm.r[0], rm.r[1]], [rm.r[2], rm.r[1]], [rm.r[2], rm.r[3]], [rm.r[0], rm.r[3]]]).map(([x, y]) => [X(x), Z(y)]);
        const shape = new T.Shape(poly.map(([x, z]) => new T.Vector2(x, z)));
        const geo = new T.ExtrudeGeometry(shape, { depth: rm.out ? 0.5 : 0.12, bevelEnabled: false });
        geo.rotateX(Math.PI / 2); geo.translate(0, rm.out ? 0.02 : 0.13, 0);
        const tint = new T.Color(ROOM_TINT[rm.t] || '#1d2230');
        const mat = new T.MeshStandardMaterial({ color: tint, roughness: 0.9, emissive: 0x000000 });
        mat.userData.base = { opacity: 1, transparent: false }; allMats.push(mat);
        const mesh = new T.Mesh(geo, mat); mesh.userData.room = rm.id; grp.add(mesh);
        const xs = poly.map((p) => p[0]), zs = poly.map((p) => p[1]);
        const bb = [Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs)];
        this._rooms[rm.id] = { ...rm, floor: f.id, poly, bb, mesh, mat, tint, ents: [], stats: [] };
        if (rm.out) { // railing outline for decks (skip edge touching the house)
          for (let i = 0; i < poly.length; i++) {
            const [ax, az] = poly[i], [bx, bz] = poly[(i + 1) % poly.length];
            if (Math.abs(az - bz) < 0.01 && Math.abs(az - (-P.D / 2)) < 0.4) continue;
            box(ax, az, bx, bz, 2.9, 3.05, M.rail);
          }
        }
      }
      // walls
      const ext = (w) => (w[0] === w[2] && (w[0] === bx1 || w[0] === bx2)) || (w[1] === w[3] && (w[1] === by1 || w[1] === by2)) || w[1] < by1 || w[3] < by1;
      for (const w of f.walls) {
        const [x1, y1, x2, y2, open = []] = w;
        const horiz = y1 === y2;
        const t = ext(w) ? 0.55 : 0.33, mat = ext(w) ? M.ext : M.wall;
        const a0 = horiz ? Math.min(x1, x2) : Math.min(y1, y2), a1 = horiz ? Math.max(x1, x2) : Math.max(y1, y2);
        const seg = (pa, pb, ya, yb, m) => {
          if (pb - pa <= 0.5) return;
          if (horiz) { const z = Z(y1); box(X(pa), z - t / 2, X(pb), z + t / 2, ya, yb, m); }
          else { const x = X(x1); box(x - t / 2, Z(pa), x + t / 2, Z(pb), ya, yb, m); }
        };
        let cur = a0;
        for (const [o0, o1, k] of [...open].sort((p, q) => p[0] - q[0])) {
          seg(cur, o0, 0, H, mat); seg(cur, o0, H, H + 0.08, M.cap);
          const top = k === 'w' ? 6.8 : k === 'g' ? 7.2 : 6.9;
          if (top < H) { seg(o0, o1, top, H, mat); seg(o0, o1, H, H + 0.08, M.cap); }
          if (k === 'w') { seg(o0, o1, 0, 2.8, mat); if (horiz) box(X(o0), Z(y1) - 0.04, X(o1), Z(y1) + 0.04, 2.8, Math.min(top, H), M.glass); else box(X(x1) - 0.04, Z(o0), X(x1) + 0.04, Z(o1), 2.8, Math.min(top, H), M.glass); }
          if (k === 'g') { if (horiz) box(X(o0), Z(y1) - 0.05, X(o1), Z(y1) + 0.05, 0, Math.min(7.2, H), M.glass); else box(X(x1) - 0.05, Z(o0), X(x1) + 0.05, Z(o1), 0, Math.min(7.2, H), M.glass); }
          cur = o1;
        }
        seg(cur, a1, 0, H, mat); seg(cur, a1, H, H + 0.08, M.cap);
      }
      // stairs
      for (const s of f.stairs || []) {
        const [sx1, sy1, sx2, sy2] = s.r; const n = 12;
        const zA = Z(sy2), zB = Z(sy1), step = (zA - zB) / n; // rising toward north (smaller z)
        for (let i = 0; i < n; i++) {
          const h = s.void ? 0.15 : ((i + 1) / n) * (H * 0.92);
          box(X(sx1) + 0.15, zA - step * (i + 1), X(sx2) - 0.15, zA - step * i, 0, h, M.stair);
        }
        if (s.rail) box(X(sx1) - 0.05, Z(sy1), X(sx1) + 0.05, Z(sy2), 0, 3.2, M.rail);
      }
      for (const fx of f.fixtures || []) box(X(fx.r[0]), Z(fx.r[1]), X(fx.r[2]), Z(fx.r[3]), 0.13, fx.h, new T.MeshStandardMaterial({ color: fx.c, roughness: 0.8 }));
      for (const [px, py] of f.posts || []) box(X(px) - 0.25, Z(py) - 0.25, X(px) + 0.25, Z(py) + 0.25, 0, this._cfg.floor_gap - 0.6, M.post);
      grp.traverse((o) => { if (o.material && !allMats.includes(o.material)) { o.material.userData.base = { opacity: 1, transparent: false }; allMats.push(o.material); } });
      this._floors[f.id] = { def: f, grp, mats: allMats, y: grp.position.y, idx };
    });
  }

  _buildSeg() {
    const opts = [['all', 'All'], ...[...PLAN.floors].reverse().map((f) => [f.id, f.short])];
    this._seg.innerHTML = '';
    for (const [id, label] of opts) {
      const b = document.createElement('button'); b.textContent = label; b.dataset.f = id;
      b.onclick = () => this._setFloor(id); this._seg.appendChild(b);
    }
    this._wrap.querySelector('.tt').textContent = this._cfg.title;
  }

  _setFloor(id, resetCam = true, instant = false) {
    if (!this._floors) return;
    if (id !== 'all' && !this._floors[id]) id = 'all';
    this._floor = id;
    this._seg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.f === id));
    const sel = this._floors[id];
    for (const [fid, F] of Object.entries(this._floors)) {
      const mode = id === 'all' ? 'full' : fid === id ? 'full' : F.idx < sel.idx ? 'ghost' : 'hidden';
      F.mode = mode; F.grp.visible = mode !== 'hidden';
      for (const m of F.mats) {
        const b = m.userData.base || { opacity: 1, transparent: false };
        if (mode === 'ghost') { m.transparent = true; m.opacity = b.opacity * 0.12; m.depthWrite = false; }
        else { m.transparent = b.transparent; m.opacity = b.opacity; m.depthWrite = !b.transparent; }
        m.needsUpdate = true;
      }
    }
    this._wrap.querySelector('.sub').textContent = id === 'all' ? '' : sel.def.name;
    if (resetCam) {
      const tY = id === 'all' ? this._cfg.floor_gap : sel.y;
      const goal = { target: new this.T.Vector3(0, tY, 1), theta: -0.55, phi: id === 'all' ? 1.0 : 0.82, radius: id === 'all' ? 92 : 62 };
      if (this._W && this._W / this._H < 1) goal.radius *= 1.6;
      this._animTo(goal, instant);
    }
    this._dirty = true;
  }

  _focusRoom(rid) {
    const R = this._rooms[rid]; if (!R) return;
    if (this._floor !== R.floor && this._floor !== 'all') this._setFloor(R.floor, false);
    if (this._floor === 'all') this._setFloor(R.floor, false);
    const cx = (R.bb[0] + R.bb[2]) / 2, cz = (R.bb[1] + R.bb[3]) / 2, size = Math.max(R.bb[2] - R.bb[0], R.bb[3] - R.bb[1]);
    this._animTo({ target: new this.T.Vector3(cx, this._floors[R.floor].y, cz), theta: this._rig.theta, phi: 0.75, radius: Math.max(24, size * 2.4) });
  }

  _animTo(goal, instant) {
    if (instant) { Object.assign(this._rig, { ...goal, target: goal.target.clone() }); this._goal = null; this._dirty = true; return; }
    this._goal = { from: { ...this._rig, target: this._rig.target.clone() }, to: goal, t0: performance.now(), dur: 700 };
  }

  /* ---------------- orbit controls ---------------- */
  _controls() {
    const el = this._canvas, rig = this._rig, ptrs = new Map();
    let last = null, moved = 0, pinch = null, btn = 0;
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    el.addEventListener('pointerdown', (e) => { el.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); last = { x: e.clientX, y: e.clientY }; moved = 0; btn = e.button; this._goal = null; this._hideTip(); });
    el.addEventListener('pointermove', (e) => {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y), mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        if (pinch) { rig.radius = Math.min(220, Math.max(12, rig.radius * (pinch.d / d))); this._pan(mid.x - pinch.mid.x, mid.y - pinch.mid.y); }
        pinch = { d, mid }; this._dirty = true; return;
      }
      const dx = e.clientX - last.x, dy = e.clientY - last.y; last = { x: e.clientX, y: e.clientY }; moved += Math.abs(dx) + Math.abs(dy);
      if (btn === 2 || btn === 1 || e.shiftKey) this._pan(dx, dy);
      else { rig.theta -= dx * 0.006; rig.phi = Math.min(1.45, Math.max(0.12, rig.phi - dy * 0.006)); }
      this._dirty = true;
    });
    const up = (e) => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (ptrs.size === 1) last = [...ptrs.values()][0]; };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', (e) => { e.preventDefault(); rig.radius = Math.min(220, Math.max(12, rig.radius * Math.exp(e.deltaY * 0.0012))); this._goal = null; this._dirty = true; }, { passive: false });
    el.addEventListener('click', (e) => { if (moved > 6) return; this._pick(e); });
  }

  _pan(dx, dy) {
    const T = this.T, rig = this._rig, k = rig.radius * 0.0016;
    const fwd = new T.Vector3(-Math.sin(rig.theta), 0, -Math.cos(rig.theta)), right = new T.Vector3(Math.cos(rig.theta), 0, -Math.sin(rig.theta));
    rig.target.addScaledVector(right, -dx * k).addScaledVector(fwd, dy * k);
  }

  _pick(e) {
    const T = this.T, rect = this._canvas.getBoundingClientRect();
    const v = new T.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    const rc = new T.Raycaster(); rc.setFromCamera(v, this._cam);
    const meshes = Object.values(this._rooms).filter((R) => this._floors[R.floor].mode === 'full').map((R) => R.mesh);
    const hit = rc.intersectObjects(meshes, false)[0];
    if (hit) this._focusRoom(hit.object.userData.room);
  }

  /* ---------------- entities ---------------- */
  _areaRoomMap() {
    const h = this._hass, out = {}, areas = h.areas || {};
    const byName = {}; for (const a of Object.values(areas)) byName[norm(a.name)] = a.area_id;
    const taken = new Set();
    for (const [rid, area] of Object.entries(this._cfg.rooms || {})) {
      for (const a of [].concat(area)) { const id = areas[a] ? a : byName[norm(a)]; if (id) { out[id] = rid; taken.add(rid); } }
    }
    if (this._cfg.auto_rooms !== false) {
      for (const [rid, names] of Object.entries(ALIASES)) {
        if (taken.has(rid)) continue;
        for (const n of names) { const id = byName[norm(n)] || (areas[n.replace(/ /g, '_')] && n.replace(/ /g, '_')); if (id && !out[id]) { out[id] = rid; taken.add(rid); break; } }
      }
    }
    return out;
  }

  _collect() {
    if (!this._rooms || !this._hass) return;
    const h = this._hass, amap = this._areaRoomMap(), cfgE = this._cfg.entities || {}, excl = new Set(this._cfg.exclude || []);
    const incDomains = this._cfg.domains ? new Set(this._cfg.domains) : MARKER_DOMAINS;
    for (const R of Object.values(this._rooms)) { R.ents = []; R.stats = []; }
    this._unplaced = []; this._placed = [];
    for (const [eid, st] of Object.entries(h.states)) {
      const dom = eid.split('.')[0], o = cfgE[eid];
      if (excl.has(eid) || o === false || (!incDomains.has(dom) && !o)) continue;
      const reg = h.entities?.[eid];
      if (!o && reg && (reg.hidden || reg.entity_category)) continue;
      const dc = st.attributes.device_class;
      let kind = 'marker';
      if (dom === 'sensor') { if (STAT_SENSORS.has(dc)) kind = 'stat'; else if (!o) continue; }
      if (dom === 'binary_sensor' && !BIN_CLASSES.has(dc) && !o) continue;
      const area = reg?.area_id || h.devices?.[reg?.device_id]?.area_id;
      const rid = (o && o.room) || amap[area];
      const R = this._rooms[rid];
      if (!R && !(o && o.floor)) { if (kind === 'marker' && reg) this._unplaced.push(eid); continue; }
      if (kind === 'stat') { if (R) R.stats.push(eid); continue; }
      const item = { eid, dom, room: rid, o };
      if (R) R.ents.push(item); this._placed.push(item);
    }
    this._layout();
    this._buildOverlay();
  }

  _layout() {
    const inside = (poly, x, z) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; } return c; };
    for (const R of Object.values(this._rooms)) {
      const [x1, z1, x2, z2] = R.bb, cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
      R.label = inside(R.poly, cx, cz) ? [cx, cz] : null;
      const n = R.ents.filter((e) => !(e.o && e.o.x != null)).length;
      let pts = [];
      for (let step = 2.6; step > 0.9 && pts.length < n; step -= 0.4) {
        pts = [];
        for (let x = x1 + 1.1; x <= x2 - 1.1; x += step) for (let z = z1 + 1.1; z <= z2 - 1.1; z += step) if (inside(R.poly, x, z)) pts.push([x, z]);
        if (!R.label && pts.length) R.label = pts[Math.floor(pts.length / 2)];
        const [lx, lz] = R.label || [cx, cz];
        pts = pts.filter(([x, z]) => !(Math.abs(z - lz) < 2 && Math.abs(x - lx) < 4.5));
        pts.sort((a, b) => Math.hypot(a[0] - lx, (a[1] - lz) * 1.3) - Math.hypot(b[0] - lx, (b[1] - lz) * 1.3));
      }
      if (!R.label) R.label = [cx, cz];
      let i = 0;
      for (const e of R.ents) {
        if (e.o && e.o.x != null) { e.pos = [e.o.x - PLAN.W / 2, e.o.z - PLAN.D / 2]; continue; }
        e.pos = pts[i++] || [cx + (i % 3) - 1, cz + Math.floor(i / 3)];
      }
      for (const e of R.ents) e.floor = R.floor;
    }
    for (const e of this._placed) if (!e.room && e.o) { e.floor = e.o.floor; e.pos = [(e.o.x ?? PLAN.W / 2) - PLAN.W / 2, (e.o.z ?? PLAN.D / 2) - PLAN.D / 2]; }
  }

  _buildOverlay() {
    const T = this.T;
    this._ov.innerHTML = '';
    for (const g of this._glows || []) g.parent?.remove(g);
    this._glows = [];
    this._labels = [];
    for (const R of Object.values(this._rooms)) {
      const d = document.createElement('div'); d.className = 'rl';
      d.innerHTML = `<div class="n"></div><div class="s"></div>`;
      d.querySelector('.n').textContent = (this._cfg.room_names || {})[R.id] || R.name;
      d.title = `${R.name} · ${R.dims}`;
      d.onclick = () => this._focusRoom(R.id);
      this._ov.appendChild(d);
      this._labels.push({ el: d, R, p: new T.Vector3(R.label[0], 0.4, R.label[1]) });
    }
    this._markers = [];
    const icon = customElements.get('ha-state-icon') ? 'ha-state-icon' : 'ha-icon';
    for (const e of this._placed) {
      const d = document.createElement('div'); d.className = 'm';
      d.innerHTML = `<div class="d"><${icon}></${icon}></div><div class="v"></div>`;
      let timer, long = false;
      d.addEventListener('pointerdown', () => { long = false; timer = setTimeout(() => { long = true; this._more(e.eid); }, 500); });
      d.addEventListener('pointerup', () => clearTimeout(timer));
      d.addEventListener('pointerleave', () => { clearTimeout(timer); this._hideTip(); });
      d.addEventListener('click', (ev) => { ev.stopPropagation(); if (long) return; if (TOGGLE.has(e.dom) && this._cfg.tap_action !== 'more-info') this._hass.callService(e.dom === 'humidifier' ? 'humidifier' : 'homeassistant', 'toggle', { entity_id: e.eid }); else this._more(e.eid); });
      d.addEventListener('contextmenu', (ev) => { ev.preventDefault(); this._more(e.eid); });
      d.addEventListener('pointerenter', () => this._showTip(e, d));
      this._ov.appendChild(d);
      const F = this._floors[e.floor];
      const m = { el: d, e, ic: d.querySelector(icon), v: d.querySelector('.v'), p: new T.Vector3(e.pos[0], 3, e.pos[1]), F };
      if (e.dom === 'light') {
        const sp = new T.Sprite(new T.SpriteMaterial({ map: this._glowTex, color: 0xffc678, transparent: true, blending: T.AdditiveBlending, depthWrite: false, opacity: 0 }));
        sp.scale.set(9, 9, 1); sp.position.set(e.pos[0], 0.6, e.pos[1]); F.grp.add(sp); m.glow = sp; this._glows.push(sp);
      }
      this._markers.push(m);
    }
    this._lastStates = new Map();
    this._dirty = true;
  }

  _more(eid) { this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: eid }, bubbles: true, composed: true })); }

  _fmt(st) {
    try { if (this._hass.formatEntityState) return this._hass.formatEntityState(st); } catch (_) { /* fall through */ }
    const u = st.attributes.unit_of_measurement; return u ? `${st.state} ${u}` : st.state;
  }

  _visual(st, dom) {
    const s = st.state, a = st.attributes, dc = a.device_class;
    let act = false, c = '#7aa2ff', v = '';
    switch (dom) {
      case 'light': act = s === 'on'; c = a.rgb_color ? `rgb(${a.rgb_color.join(',')})` : '#ffc678'; if (act && a.brightness != null) v = `${Math.round((a.brightness / 255) * 100)}%`; break;
      case 'switch': case 'input_boolean': act = s === 'on'; c = '#4fd1c5'; break;
      case 'fan': act = s === 'on'; c = '#63b3ed'; break;
      case 'media_player': act = s === 'playing' || s === 'on' || s === 'paused'; c = '#b794f4'; if (s === 'playing' && a.media_title) v = a.media_title.slice(0, 18); break;
      case 'climate': act = s !== 'off'; c = a.hvac_action === 'cooling' || s === 'cool' ? '#63b3ed' : '#f6ad55'; if (a.current_temperature != null) v = `${a.current_temperature}°${a.temperature != null ? ` → ${a.temperature}°` : ''}`; break;
      case 'cover': act = s === 'open' || s === 'opening'; c = '#f6e05e'; break;
      case 'lock': act = s === 'unlocked' || s === 'open'; c = '#fc8181'; break;
      case 'binary_sensor': act = s === 'on'; c = ['moisture', 'smoke', 'gas', 'carbon_monoxide'].includes(dc) ? '#fc8181' : ['motion', 'occupancy', 'presence'].includes(dc) ? '#68d391' : '#f6e05e'; break;
      case 'vacuum': act = s === 'cleaning' || s === 'returning'; c = '#68d391'; break;
      case 'sensor': v = this._fmt(st); break;
      default: act = ['on', 'open', 'playing', 'armed_away', 'armed_home', 'heat', 'cool', 'cleaning'].includes(s); break;
    }
    return { act, c, v, una: s === 'unavailable' || s === 'unknown' };
  }

  _sync() {
    if (!this._markers || !this._hass) return;
    const h = this._hass;
    let changed = false;
    const roomGlow = {};
    for (const m of this._markers) {
      const st = h.states[m.e.eid];
      if (!st) continue;
      const vis = this._visual(st, m.e.dom);
      if (m.e.dom === 'light' && vis.act) {
        const br = st.attributes.brightness != null ? st.attributes.brightness / 255 : 1;
        (roomGlow[m.e.room] ||= []).push([vis.c, br]);
      }
      if (this._lastStates.get(m.e.eid) === st) continue;
      this._lastStates.set(m.e.eid, st); changed = true;
      if (m.ic.tagName === 'HA-STATE-ICON') { m.ic.hass = h; m.ic.stateObj = st; }
      else m.ic.icon = st.attributes.icon || `mdi:${{ light: 'lightbulb', switch: 'toggle-switch', fan: 'fan', climate: 'thermostat', media_player: 'speaker', cover: 'window-shutter', lock: 'lock', camera: 'cctv', vacuum: 'robot-vacuum', binary_sensor: 'motion-sensor' }[m.e.dom] || 'circle'}`;
      m.el.classList.toggle('act', vis.act); m.el.classList.toggle('una', vis.una);
      m.el.style.setProperty('--c', vis.c); m.v.textContent = vis.v; m.vis = vis; m.st = st;
      if (m.glow) { m.glow.material.color.set(vis.c.startsWith('rgb') ? vis.c.replace(/\s/g, '') : vis.c); m.glow.material.opacity = vis.act ? 0.25 + 0.6 * (st.attributes.brightness != null ? st.attributes.brightness / 255 : 1) : 0; }
      if (this._tipFor === m.e.eid) this._showTip(m.e, m.el);
    }
    // rooms: emissive tint from lights, stats
    const T = this.T;
    for (const R of Object.values(this._rooms)) {
      const gl = roomGlow[R.id];
      const target = new T.Color(0, 0, 0);
      if (gl) for (const [c, br] of gl) target.add(new T.Color(c.startsWith('rgb') ? c.replace(/\s/g, '') : c).multiplyScalar(0.05 + 0.1 * br));
      if (!R.mat.emissive.equals(target)) { R.mat.emissive.copy(target); changed = true; }
    }
    for (const L of this._labels || []) {
      const parts = [];
      const temps = L.R.stats.map((e) => h.states[e]).filter((s) => s && s.attributes.device_class === 'temperature' && !isNaN(parseFloat(s.state)));
      const hums = L.R.stats.map((e) => h.states[e]).filter((s) => s && s.attributes.device_class === 'humidity' && !isNaN(parseFloat(s.state)));
      if (temps.length) parts.push(`${(temps.reduce((a, s) => a + parseFloat(s.state), 0) / temps.length).toFixed(1)}${temps[0].attributes.unit_of_measurement || '°'}`);
      if (hums.length) parts.push(`${Math.round(hums.reduce((a, s) => a + parseFloat(s.state), 0) / hums.length)}%`);
      const txt = parts.join(' · ');
      const s = L.el.querySelector('.s'); if (s.textContent !== txt) s.textContent = txt;
    }
    this._chipsUpdate();
    if (changed) this._dirty = true;
  }

  _chipsUpdate() {
    const h = this._hass, ms = this._markers || [];
    const on = (d, f = () => true) => ms.filter((m) => m.e.dom === d && m.vis?.act && f(m)).length;
    const lights = on('light'), media = on('media_player'), motion = on('binary_sensor', (m) => ['motion', 'occupancy', 'presence'].includes(m.st.attributes.device_class));
    const open = on('binary_sensor', (m) => ['door', 'window', 'garage_door', 'opening'].includes(m.st.attributes.device_class)) + on('cover') + on('lock');
    const alerts = on('binary_sensor', (m) => ['moisture', 'smoke', 'gas', 'carbon_monoxide'].includes(m.st.attributes.device_class));
    const temps = Object.values(this._rooms).flatMap((R) => R.stats).map((e) => h.states[e]).filter((s) => s && s.attributes.device_class === 'temperature' && !isNaN(parseFloat(s.state)));
    const chips = [];
    const has = (d) => ms.some((m) => m.e.dom === d);
    if (has('light')) chips.push(['mdi:lightbulb-group', `${lights} light${lights === 1 ? '' : 's'} on`, lights ? '#ffc678' : null, 'lights']);
    if (temps.length) chips.push(['mdi:thermometer', `${(temps.reduce((a, s) => a + parseFloat(s.state), 0) / temps.length).toFixed(1)}${temps[0].attributes.unit_of_measurement || '°'} avg`, '#9fe3c8']);
    if (has('media_player')) chips.push(['mdi:play-circle-outline', `${media} playing`, media ? '#b794f4' : null]);
    if (motion) chips.push(['mdi:motion-sensor', `${motion} motion`, '#68d391']);
    if (open) chips.push(['mdi:door-open', `${open} open`, '#f6e05e']);
    if (alerts) chips.push(['mdi:alert', `${alerts} alert${alerts > 1 ? 's' : ''}`, '#fc8181']);
    if (this._unplaced?.length) chips.push(['mdi:map-marker-question-outline', `${this._unplaced.length} unplaced`, null, 'unplaced']);
    const key = JSON.stringify(chips);
    if (key === this._chipKey) return; this._chipKey = key;
    this._chips.innerHTML = '';
    for (const [ic, txt, c, act] of chips) {
      const d = document.createElement('div'); d.className = `chip glass${act ? ' btn' : ''}`;
      d.innerHTML = `<ha-icon icon="${ic}"></ha-icon><span></span>`; d.querySelector('span').textContent = txt;
      if (c) d.style.setProperty('--c', c);
      if (act === 'unplaced') d.onclick = () => this._showList(this._unplaced, 'No area mapped to a room');
      if (act === 'lights') d.onclick = () => this._showList(ms.filter((m) => m.e.dom === 'light').map((m) => m.e.eid));
      this._chips.appendChild(d);
    }
  }

  _showList(eids) {
    const h = this._hass;
    this._pop.innerHTML = '';
    for (const eid of eids) {
      const st = h.states[eid]; if (!st) continue;
      const d = document.createElement('div');
      d.innerHTML = '<b></b><span></span>'; d.querySelector('b').textContent = st.attributes.friendly_name || eid; d.querySelector('span').textContent = this._fmt(st);
      d.onclick = () => this._more(eid); this._pop.appendChild(d);
    }
    this._pop.classList.toggle('show');
  }

  _showTip(e, el) {
    const st = this._hass.states[e.eid]; if (!st) return;
    this._tipFor = e.eid;
    const R = this._rooms[e.room];
    this._tip.innerHTML = '<b></b><span></span>';
    this._tip.querySelector('b').textContent = st.attributes.friendly_name || e.eid;
    this._tip.querySelector('span').textContent = `${this._fmt(st)}${R ? ` · ${R.name}` : ''}`;
    const r = el.getBoundingClientRect(), w = this._wrap.getBoundingClientRect();
    this._tip.style.left = `${Math.min(r.left - w.left + 20, w.width - 200)}px`; this._tip.style.top = `${r.top - w.top - 46}px`; this._tip.style.opacity = 1;
  }
  _hideTip() { this._tipFor = null; this._tip.style.opacity = 0; }

  /* ---------------- render loop ---------------- */
  _loop() {
    cancelAnimationFrame(this._raf);
    const tick = (now) => {
      if (!this._alive) return;
      this._raf = requestAnimationFrame(tick);
      if (this._goal) {
        const g = this._goal, t = Math.min(1, (now - g.t0) / g.dur), k = 1 - Math.pow(1 - t, 3);
        const rig = this._rig;
        rig.target.lerpVectors(g.from.target, g.to.target, k);
        rig.theta = g.from.theta + (g.to.theta - g.from.theta) * k; rig.phi = g.from.phi + (g.to.phi - g.from.phi) * k; rig.radius = g.from.radius + (g.to.radius - g.from.radius) * k;
        if (t >= 1) this._goal = null; this._dirty = true;
      }
      if (!this._dirty || !this._W) return;
      this._dirty = false;
      this._render();
    };
    this._raf = requestAnimationFrame(tick);
  }

  _render() {
    const { _rig: rig, _cam: cam } = this;
    cam.position.set(rig.target.x + rig.radius * Math.sin(rig.phi) * Math.sin(rig.theta), rig.target.y + rig.radius * Math.cos(rig.phi), rig.target.z + rig.radius * Math.sin(rig.phi) * Math.cos(rig.theta));
    cam.lookAt(rig.target); cam.updateMatrixWorld();
    this._r.render(this._scene, cam);
    const v = new this.T.Vector3(), W = this._W, H = this._H;
    const place = (el, p, F, dy) => {
      if (F.mode !== 'full') { el.style.opacity = 0; el.style.pointerEvents = 'none'; return; }
      v.copy(p); v.y += F.y; const dist = v.distanceTo(cam.position); v.project(cam);
      if (v.z > 1) { el.style.opacity = 0; return; }
      el.style.opacity = 1; el.style.pointerEvents = '';
      el.style.transform = `translate(-50%,${dy}) translate(${((v.x + 1) / 2) * W}px,${((1 - v.y) / 2) * H}px)`;
      el.style.zIndex = String(10000 - Math.round(dist * 10));
    };
    const hideLabels = this._floor === 'all';
    for (const L of this._labels || []) { if (hideLabels) { L.el.style.opacity = 0; L.el.style.pointerEvents = 'none'; } else place(L.el, L.p, this._floors[L.R.floor], '-50%'); }
    for (const m of this._markers || []) place(m.el, m.p, m.F, '-15px');
  }
}

customElements.define('house3d-card', House3DCard);
window.customCards = window.customCards || [];
window.customCards.push({ type: 'house3d-card', name: 'House 3D', description: '3D floor plan with live devices', preview: false });
console.info(`%c HOUSE3D-CARD %c ${CARD_VERSION} `, 'background:#7aa2ff;color:#0b0f17;font-weight:700', 'background:#1b2333;color:#cfd8e6');
