/* house3d-card — 3D floor plan with live Home Assistant devices */
const CARD_VERSION = '1.3.0';
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
        { id: 'lower_room', name: 'Room', dims: `7'9" × 14'1"`, p: [[617, 388], [700, 388], [700, 502], [678, 502], [678, 640], [617, 640]], t: 'room' },
        { id: 'lower_hall', name: 'Hall', dims: `4'2" × 5'1"`, p: [[617, 640], [678, 640], [678, 689], [754, 689], [754, 745], [617, 745]], t: 'hall' },
        { id: 'rec_room', name: 'Recreation Room', dims: `16'11" × 26'7"`, p: [[700, 258], [1000, 258], [1000, 745], [754, 745], [754, 502], [700, 502]], t: 'living' },
        { id: 'covered_deck', name: 'Covered Deck', dims: `15'9" × 12'8"`, r: [715, 20, 1015, 258], t: 'deck', out: true },
      ],
      walls: [
        [185, 258, 1000, 258, [[708, 760, 'w'], [820, 905, 'd']]],
        [185, 745, 1000, 745],
        [185, 258, 185, 745, [[285, 465, 'g'], [485, 525, 'd'], [545, 715, 'g']]],
        [1000, 258, 1000, 745, [[285, 405, 'w']]],
        [617, 258, 617, 745, [[655, 715, 'd']]],
        [617, 388, 700, 388],
        [700, 258, 700, 502, [[318, 365, 'd'], [400, 450, 'd']]],
        [678, 502, 754, 502],        // stair enclosure (under the main stair)
        [678, 502, 678, 640],
        [754, 502, 754, 689],
        [617, 640, 678, 640, [[625, 670, 'd']]],
      ],
      stairs: [{ r: [678, 502, 754, 689], up: 'n' }], // stacked directly under the main stair
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
        [338, 312, 622, 312, [[360, 481, 'd'], [530, 580, 'd']]], // 60" laundry opening + bath door
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
const inside = (poly, x, z) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; } return c; };
const DOM_ICON = { light: 'lightbulb', switch: 'toggle-switch', fan: 'fan', climate: 'thermostat', media_player: 'speaker', cover: 'window-shutter', lock: 'lock', camera: 'cctv', vacuum: 'robot-vacuum', binary_sensor: 'motion-sensor', sensor: 'gauge', remote: 'remote', input_boolean: 'toggle-switch-outline', humidifier: 'air-humidifier', water_heater: 'water-boiler', alarm_control_panel: 'shield-home', valve: 'valve', siren: 'bullhorn' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clone = (o) => (o == null || typeof o !== 'object' ? o : JSON.parse(JSON.stringify(o)));

const CSS = `
:host{display:block;--h3-bg:#0b0f17;--h3-panel:rgba(18,23,34,.72);--h3-line:rgba(255,255,255,.08);--h3-text:#e8edf6;--h3-dim:#8a94a8;--h3-accent:#7aa2ff}
ha-card{display:block;overflow:hidden;background:var(--h3-bg);border:1px solid var(--h3-line);border-radius:var(--ha-card-border-radius,16px)}
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
.load{position:absolute;inset:0;display:grid;place-items:center;color:var(--h3-dim);font-size:13px;z-index:200000;transition:opacity .3s}
.lbox{width:min(380px,82%);padding:16px 18px 14px;border-radius:14px}
.lt{display:flex;justify-content:space-between;gap:12px;font-size:13px;font-weight:600;color:var(--h3-text);margin-bottom:10px}
.lpct{color:var(--h3-accent);font-variant-numeric:tabular-nums}
.lbar{height:6px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden}
.lbar i{display:block;height:100%;width:0;border-radius:99px;background:linear-gradient(90deg,#5b7cff,#7aa2ff,#9fe3c8);transition:width .2s}
.llog{margin-top:10px;font:11px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--h3-dim);min-height:4.65em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.llog div{overflow:hidden;text-overflow:ellipsis}
.llog div:last-child{color:#cfd8e6}
.err{color:#ff9a9a;padding:20px}
.ib.on{color:#fff;background:rgba(122,162,255,.28)}
.ebar{position:absolute;top:64px;left:50%;transform:translateX(-50%);display:none;align-items:center;gap:10px;padding:7px 8px 7px 14px;border-radius:12px;font-size:12.5px;z-index:100001;white-space:nowrap}
.ebar.show{display:flex}
.ebar button{all:unset;cursor:pointer;padding:6px 12px;border-radius:9px;font-size:12.5px;font-weight:600}
.ebar .sv{background:#7aa2ff;color:#0b0f17}
.ebar .cn{color:var(--h3-dim)}
.ebar .cn:hover{color:#fff}
.editing .m{cursor:grab}
.editing .m .d{outline:2px dashed rgba(122,162,255,.75);outline-offset:3px}
.m.drag{cursor:grabbing;transition:none}
.m.ping .d{animation:h3ping 1.4s ease-out 2}
@keyframes h3ping{0%{box-shadow:0 0 0 0 rgba(122,162,255,.9)}100%{box-shadow:0 0 0 22px rgba(122,162,255,0)}}
.drw{position:absolute;top:64px;right:14px;bottom:14px;width:min(360px,calc(100% - 28px));border-radius:14px;display:flex;flex-direction:column;z-index:100002;transform:translateX(calc(100% + 24px));opacity:0;pointer-events:none;transition:transform .25s ease,opacity .25s ease}
.drw.show{transform:none;opacity:1;pointer-events:auto}
.drw .hd{display:flex;align-items:center;gap:8px;padding:10px 10px 6px 14px;font-weight:600;font-size:14px}
.drw .hd .sp{flex:1}
.drw .hd .ib{width:30px;height:30px}
.drw .q{margin:0 10px 8px;padding:8px 11px;border-radius:9px;border:1px solid var(--h3-line);background:rgba(0,0,0,.25);color:var(--h3-text);font:inherit;font-size:12.5px;outline:none;user-select:text;-webkit-user-select:text}
.drw .q:focus{border-color:rgba(122,162,255,.6)}
.drw .tabs{display:flex;gap:2px;margin:0 10px 8px;padding:3px;border-radius:10px;background:rgba(0,0,0,.2)}
.drw .tabs button{all:unset;cursor:pointer;flex:1;text-align:center;padding:5px 4px;border-radius:7px;font-size:11.5px;color:var(--h3-dim);white-space:nowrap}
.drw .tabs button b{font-weight:600;margin-left:3px;color:inherit;opacity:.75}
.drw .tabs button.on{background:rgba(122,162,255,.18);color:#fff;box-shadow:inset 0 0 0 1px rgba(122,162,255,.45)}
.drw .ls{flex:1;overflow:auto;padding:0 6px 8px}
.drw .em{padding:24px 12px;text-align:center;color:var(--h3-dim);font-size:12.5px}
.row{display:grid;grid-template-columns:30px minmax(0,1fr) auto;grid-template-rows:auto auto;column-gap:8px;row-gap:5px;padding:8px;border-radius:10px;cursor:pointer;align-items:center}
.row:hover{background:rgba(255,255,255,.05)}
.row.pend{box-shadow:inset 3px 0 0 #7aa2ff}
.row.hid{opacity:.55}
.row .di{grid-row:1/3;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.06);color:#aab3c5;--mdc-icon-size:17px;align-self:start}
.row.act .di{background:var(--c);color:#10141c}
.row .nm{min-width:0;line-height:1.25}
.row .nm b{display:block;font-size:12.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.row .nm small{display:block;font-size:10.5px;color:var(--h3-dim);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:ui-monospace,SFMono-Regular,Consolas,monospace}
.row .st{font-size:11.5px;color:#cfd8e6;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:right}
.row select{min-width:0;padding:4px 6px;border-radius:7px;border:1px solid var(--h3-line);background:#121826;color:var(--h3-text);font:inherit;font-size:11.5px;outline:none;cursor:pointer}
.row select:disabled,.row .eye:disabled{opacity:.5;cursor:default}
.row .acts{display:flex;gap:2px;justify-self:end}
.row .eye,.row .loc{all:unset;cursor:pointer;width:26px;height:26px;border-radius:7px;display:grid;place-items:center;color:var(--h3-dim);--mdc-icon-size:17px}
.row .eye:hover,.row .loc:hover{color:#fff;background:rgba(255,255,255,.07)}
.row .loc:disabled{opacity:.3;cursor:default}
.row.busy select,.row.busy .eye{opacity:.5;pointer-events:none}
.toast{position:absolute;left:50%;bottom:62px;transform:translateX(-50%);padding:8px 14px;border-radius:10px;font-size:12.5px;z-index:100003;opacity:0;pointer-events:none;transition:opacity .25s;max-width:80%;text-align:center}
.toast.show{opacity:1}
`;

class House3DCard extends HTMLElement {
  static getStubConfig() { return { title: 'Home' }; }
  getCardSize() { return 10; }
  getGridOptions() { return { columns: 'full', rows: 10, min_rows: 6 }; }

  setConfig(config) {
    // don't clobber unsaved edits, or drawer changes whose dashboard save is still in flight
    const keep = (this._edit || this._busy) && this._cfg ? { entities: this._cfg.entities, exclude: this._cfg.exclude } : null;
    this._cfg = { title: 'Home', default_floor: 'all', wall_height: 8, floor_gap: 14, height: null, rooms: {}, entities: {}, exclude: [], ...config, ...(keep || {}) };
    if (!this.shadowRoot) this._dom();
    if (this._cfg.height) this._wrap.style.setProperty('--h3-height', this._cfg.height);
    this._sig = null;
    if (this._alive && !this._booted) { this._booted = true; this._boot(); }
    if (this._hass) this.hass = this._hass;
  }

  set hass(h) {
    this._hass = h;
    if (!this._wrap) return;
    if (this._editBtn) this._editBtn.style.display = h.user?.is_admin ? '' : 'none';
    const admin = !!h.user?.is_admin, adminChanged = admin !== this._admin;
    this._admin = admin;
    if (adminChanged) { if (!admin && this._edit) this._setEdit(false); else this._renderDrawer(); }
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
        <button class="ib glass lst" title="Devices"><ha-icon icon="mdi:format-list-bulleted"></ha-icon></button><button class="ib glass edit" title="Move devices"><ha-icon icon="mdi:cursor-move"></ha-icon></button><button class="ib glass reset" title="Reset view"><ha-icon icon="mdi:crosshairs-gps"></ha-icon></button></div>
      <div class="ebar glass"><span>Drag devices anywhere on their floor · drop into a room to reassign · right-click resets</span><button class="sv">Save</button><button class="cn">Cancel</button></div>
      <div class="drw glass"><div class="hd"><span>Devices</span><span class="sp"></span><button class="ib x" title="Close"><ha-icon icon="mdi:close"></ha-icon></button></div>
        <input class="q" type="search" placeholder="Search name, entity_id or room…" autocomplete="off" spellcheck="false">
        <div class="tabs"></div><div class="ls"></div></div>
      <div class="chips"></div><div class="pop glass"></div><div class="tip glass"></div><div class="toast glass"></div>
      <div class="load"><div class="lbox glass"><div class="lt"><span class="lmsg">Loading 3D view</span><span class="lpct">0%</span></div><div class="lbar"><i></i></div><div class="llog"></div></div></div></div></ha-card>`;
    const $ = (s) => root.querySelector(s);
    Object.assign(this, { _wrap: $('.wrap'), _canvas: $('canvas'), _ov: $('.ov'), _seg: $('.seg'), _chips: $('.chips'), _tip: $('.tip'), _pop: $('.pop'), _load: $('.load') });
    $('.reset').onclick = () => this._setFloor(this._floor, true);
    this._editBtn = $('.edit'); this._ebar = $('.ebar'); this._changed = new Set(); this._roomChanged = new Set();
    this._editBtn.onclick = () => this._setEdit(!this._edit);
    $('.sv').onclick = () => this._saveEdits();
    $('.cn').onclick = () => this._setEdit(false);
    // device drawer
    Object.assign(this, { _drw: $('.drw'), _drwList: $('.drw .ls'), _drwTabs: $('.drw .tabs'), _drwQ: $('.drw .q'), _lstBtn: $('.lst'), _toastEl: $('.toast') });
    this._tab = 'all';
    this._lstBtn.onclick = () => this._toggleDrawer();
    $('.drw .x').onclick = () => this._toggleDrawer(false);
    this._drwQ.addEventListener('input', () => this._renderDrawer());
    for (const ev of ['keydown', 'keyup', 'keypress']) this._drwQ.addEventListener(ev, (e) => e.stopPropagation()); // keep HA shortcuts out of the search box
    this._wrap.addEventListener('click', (e) => { if (!e.composedPath().some((n) => n.classList?.contains('pop') || n.classList?.contains('btn'))) this._pop.classList.remove('show'); });
  }

  /* ---------------- loading progress ---------------- */
  _prog(pct, msg, log) {
    const L = this._load; if (!L || !L.isConnected) return;
    if (pct != null) { L.querySelector('.lbar i').style.width = pct + '%'; L.querySelector('.lpct').textContent = Math.round(pct) + '%'; }
    if (msg) L.querySelector('.lmsg').textContent = msg;
    if (log) {
      const box = L.querySelector('.llog'), d = document.createElement('div');
      d.textContent = '› ' + log; box.appendChild(d);
      while (box.children.length > 3) box.firstChild.remove();
    }
  }

  _frame() { return new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0))); }

  async _loadThree(url) {
    const t0 = performance.now(), kb = (n) => Math.round(n / 1024);
    this._prog(2, 'Downloading 3D engine', 'GET ' + url.replace(/^https?:\/\//, ''));
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const total = +res.headers.get('content-length') || 0;
    let blob;
    if (res.body && res.body.getReader) {
      const rd = res.body.getReader(), chunks = []; let got = 0, last = 0;
      for (;;) {
        const { done, value } = await rd.read(); if (done) break;
        chunks.push(value); got += value.length;
        const now = performance.now();
        if (now - last > 100) { last = now; this._prog(2 + (total ? Math.min(1, got / total) : 0.5) * 56, 'Downloading 3D engine · ' + kb(got) + (total ? ' / ' + kb(total) : '') + ' KB'); }
      }
      blob = new Blob(chunks, { type: 'text/javascript' });
    } else blob = new Blob([await res.arrayBuffer()], { type: 'text/javascript' });
    const secs = (performance.now() - t0) / 1000;
    this._prog(58, 'Starting 3D engine', 'received ' + kb(blob.size) + ' KB in ' + secs.toFixed(1) + ' s (' + Math.round(kb(blob.size) / Math.max(secs, 0.01)) + ' KB/s)');
    const u = URL.createObjectURL(blob);
    try { return await import(u); } finally { URL.revokeObjectURL(u); }
  }

  async _boot() {
    let err;
    for (const u of this._cfg.three_url ? [this._cfg.three_url] : THREE_URLS) {
      try { this.T = await this._loadThree(u); break; } catch (e) { err = e; this._prog(null, null, 'failed ' + u.replace(/^https?:\/\//, '') + ': ' + e.message); }
    }
    if (!this.T) { this._prog(null, 'Could not load the 3D engine', 'set three_url in the card config to a reachable copy of three.module.min.js'); return; }
    this._prog(62, 'Starting renderer', 'three.js r' + this.T.REVISION + ' loaded');
    await this._frame();
    this._initScene();
    try { const gl = this._r.getContext(), dbg = gl.getExtension('WEBGL_debug_renderer_info'); this._prog(66, 'Building house', 'GPU: ' + (dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.VERSION))); } catch (_) { this._prog(66, 'Building house'); }
    await this._frame();
    await this._buildHouse();
    this._buildSeg();
    this._ready = true;
    this._prog(92, 'Placing devices');
    await this._frame();
    if (this._hass) { this._collect(); this._sync(); this._prog(96, null, (this._placed || []).length + ' devices placed, ' + (this._unplaced || []).length + ' unplaced'); }
    this._setFloor(this._cfg.default_floor, true, true);
    this._loop();
    this._prog(100, 'Ready', 'rendering ' + this._W + '×' + this._H + ' px');
    await new Promise((r) => setTimeout(r, 450));
    this._load.style.opacity = 0; this._load.style.pointerEvents = 'none';
    setTimeout(() => this._load.remove(), 350);
  }

  /* ---------------- three.js scene ---------------- */
  _initScene() {
    const T = this.T;
    const r = (this._r = new T.WebGLRenderer({ canvas: this._canvas, antialias: true, alpha: true }));
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    this._scene = new T.Scene();
    this._scene.fog = new T.Fog(0x0b0f17, 140, 260);
    this._cam = new T.PerspectiveCamera(38, 1, 0.1, 8000);
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

  async _buildHouse() {
    const T = this.T, P = PLAN, H = this._cfg.wall_height;
    this._floors = {}; this._rooms = {}; this._stairs = [];
    for (const [idx, f] of P.floors.entries()) {
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
      // base slab, with stairwell openings cut out
      {
        const w2 = P.W / 2 + 0.3, d2 = P.D / 2 + 0.3;
        const sh = new T.Shape([new T.Vector2(-w2, -d2), new T.Vector2(w2, -d2), new T.Vector2(w2, d2), new T.Vector2(-w2, d2)]);
        for (const s of (f.stairs || []).filter((q) => q.void)) {
          const [a, b, c, d] = s.r;
          sh.holes.push(new T.Path([new T.Vector2(X(a), Z(b)), new T.Vector2(X(a), Z(d)), new T.Vector2(X(c), Z(d)), new T.Vector2(X(c), Z(b))]));
        }
        const sg = new T.ExtrudeGeometry(sh, { depth: 0.6, bevelEnabled: false });
        sg.rotateX(Math.PI / 2);
        grp.add(new T.Mesh(sg, M.slab));
      }
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
      // stairs: each run climbs one full storey (floor to the floor above)
      for (const s of f.stairs || []) {
        if (s.void) continue; // arrival opening, cut out of this floor's slab above
        const [sx1, sy1, sx2, sy2] = s.r, n = 15, story = H + 1, north = s.up !== 's';
        const xa = X(sx1), xb = X(sx2), za = Z(sy1), zb = Z(sy2), len = zb - za, run = len / n;
        const sg = new T.Group(); sg.userData.story = story; sg.userData.idx = idx; grp.add(sg); this._stairs.push(sg);
        for (let i = 0; i < n; i++) {
          const z0 = north ? zb - run * (i + 1) : za + run * i, top = ((i + 1) / n) * story;
          const st = new T.Mesh(new T.BoxGeometry(xb - xa - 0.3, top, run), M.stair);
          st.position.set((xa + xb) / 2, top / 2, z0 + run / 2); sg.add(st);
        }
        if (s.rail) {
          const L = Math.hypot(len, story), rl = new T.Mesh(new T.BoxGeometry(0.12, 0.12, L), M.rail);
          rl.position.set(xa + 0.1, story / 2 + 3, (za + zb) / 2); rl.rotation.x = (north ? 1 : -1) * Math.atan2(story, len); sg.add(rl);
        }
      }
      for (const fx of f.fixtures || []) box(X(fx.r[0]), Z(fx.r[1]), X(fx.r[2]), Z(fx.r[3]), 0.13, fx.h, new T.MeshStandardMaterial({ color: fx.c, roughness: 0.8 }));
      for (const [px, py] of f.posts || []) box(X(px) - 0.25, Z(py) - 0.25, X(px) + 0.25, Z(py) + 0.25, 0, this._cfg.floor_gap - 0.6, M.post);
      grp.traverse((o) => { if (o.material && !allMats.includes(o.material)) { o.material.userData.base = { opacity: 1, transparent: false }; allMats.push(o.material); } });
      this._floors[f.id] = { def: f, grp, mats: allMats, y: grp.position.y, idx, stairMat: M.stair };
      this._prog(66 + 8 * (idx + 1), null, f.name + ': ' + f.rooms.length + ' rooms, ' + f.walls.length + ' walls, ' + (f.stairs || []).filter((s) => !s.void).length + ' stair runs');
      await this._frame();
    }
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
        if (mode === 'ghost' && !(F.idx === sel.idx - 1 && m === F.stairMat)) { m.transparent = true; m.opacity = b.opacity * 0.12; m.depthWrite = false; }
        else { m.transparent = b.transparent; m.opacity = b.opacity; m.depthWrite = !b.transparent; }
        m.needsUpdate = true;
      }
    }
    // stairs below the shown floor stretch to meet it, so they read as going down through the stairwell
    for (const sg of this._stairs || []) sg.scale.y = id === 'all' || sg.userData.idx < sel.idx ? this._cfg.floor_gap / sg.userData.story : 1;
    this._wrap.querySelector('.sub').textContent = id === 'all' ? '' : sel.def.name;
    if (resetCam) {
      const tY = id === 'all' ? this._cfg.floor_gap : sel.y;
      const goal = { target: new this.T.Vector3(0, tY, 1), theta: -0.55, phi: id === 'all' ? 0.95 : 0.72, radius: id === 'all' ? 96 : 66 };
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
        if (pinch) { rig.radius = Math.min(1500, Math.max(1.5, rig.radius * (pinch.d / d))); this._pan(mid.x - pinch.mid.x, mid.y - pinch.mid.y); }
        pinch = { d, mid }; this._dirty = true; return;
      }
      const dx = e.clientX - last.x, dy = e.clientY - last.y; last = { x: e.clientX, y: e.clientY }; moved += Math.abs(dx) + Math.abs(dy);
      if (btn === 2 || btn === 1 || e.shiftKey) this._pan(dx, dy);
      else { rig.theta -= dx * 0.006; rig.phi = Math.min(1.565, Math.max(0.01, rig.phi - dy * 0.006)); }
      this._dirty = true;
    });
    const up = (e) => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (ptrs.size === 1) last = [...ptrs.values()][0]; };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', (e) => { e.preventDefault(); rig.radius = Math.min(1500, Math.max(1.5, rig.radius * Math.exp(e.deltaY * 0.0012))); this._goal = null; this._dirty = true; }, { passive: false });
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
    if (!this._ready || !this._rooms || !this._hass) return;
    const h = this._hass, amap = this._areaRoomMap(), cfgE = this._cfg.entities || {}, excl = new Set(this._cfg.exclude || []);
    const incDomains = this._cfg.domains ? new Set(this._cfg.domains) : MARKER_DOMAINS;
    for (const R of Object.values(this._rooms)) { R.ents = []; R.stats = []; }
    this._unplaced = []; this._placed = []; this._all = [];
    for (const [eid, st] of Object.entries(h.states)) {
      const dom = eid.split('.')[0], raw = cfgE[eid], o = raw && typeof raw === 'object' ? raw : null;
      const hidden = excl.has(eid) || raw === false;
      if (!incDomains.has(dom) && !o && !hidden) continue;
      const reg = h.entities?.[eid];
      if (!o && !hidden && reg && (reg.hidden || reg.entity_category)) continue;
      const dc = st.attributes.device_class;
      let kind = 'marker';
      if (dom === 'sensor') { if (STAT_SENSORS.has(dc)) kind = 'stat'; else if (!o && !hidden) continue; }
      if (dom === 'binary_sensor' && !BIN_CLASSES.has(dc) && !o && !hidden) continue;
      const area = reg?.area_id || h.devices?.[reg?.device_id]?.area_id;
      // an explicit `room` key in the card config wins; room: '' means "deliberately unassigned"
      const rid = o && 'room' in o ? o.room || '' : amap[area] || '';
      const R = this._rooms[rid];
      const floorOnly = !R && !!(o && o.floor && this._floors[o.floor] && kind === 'marker');
      const rec = { eid, dom, kind, room: R ? rid : '', floor: R ? R.floor : floorOnly ? o.floor : '', hidden, placed: !hidden && (!!R || floorOnly) };
      this._all.push(rec);
      if (hidden) continue;
      if (!rec.placed) { if (kind === 'marker' && reg) this._unplaced.push(eid); continue; }
      if (kind === 'stat') { R.stats.push(eid); continue; }
      const item = { eid, dom, room: R ? rid : null, o };
      if (R) R.ents.push(item); else item.floor = o.floor;
      this._placed.push(item);
    }
    this._layout();
    this._buildOverlay();
    this._renderDrawer();
  }

  _layout() {
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
      const d = document.createElement('div'); d.className = 'rl'; d.style.opacity = 0;
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
      const d = document.createElement('div'); d.className = 'm'; d.style.opacity = 0;
      d.innerHTML = `<div class="d"><${icon}></${icon}></div><div class="v"></div>`;
      let timer, long = false;
      d.addEventListener('pointerdown', (ev) => { if (this._edit) return this._dragStart(m, ev); long = false; timer = setTimeout(() => { long = true; this._more(e.eid); }, 500); });
      d.addEventListener('pointerup', () => clearTimeout(timer));
      d.addEventListener('pointerleave', () => { clearTimeout(timer); this._hideTip(); });
      d.addEventListener('click', (ev) => { ev.stopPropagation(); if (long || this._edit) return; if (TOGGLE.has(e.dom) && this._cfg.tap_action !== 'more-info') this._hass.callService(e.dom === 'humidifier' ? 'humidifier' : 'homeassistant', 'toggle', { entity_id: e.eid }); else this._more(e.eid); });
      d.addEventListener('contextmenu', (ev) => { ev.preventDefault(); if (this._edit) { this._resetPos(e.eid); return; } this._more(e.eid); });
      d.addEventListener('pointerenter', () => { if (!this._edit) this._showTip(e, d); });
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

  /* ---------------- edit mode ---------------- */
  // Entering edit mode snapshots the card's `entities` / `exclude`; all changes (drag, room select, hide) are applied
  // live to a working copy in this._cfg and only written to the dashboard (and HA's entity registry) on Save.
  _setEdit(on, keep = false) {
    on = !!on;
    if (on && !this._admin) return;
    if (on && !this._edit) {
      this._snap = { entities: clone(this._cfg.entities || {}), exclude: [...(this._cfg.exclude || [])] };
      this._cfg = { ...this._cfg, entities: clone(this._snap.entities), exclude: [...this._snap.exclude] };
    }
    const revert = !on && this._edit && !keep && this._snap && this._changed.size;
    if (!on) {
      if (revert) this._cfg = { ...this._cfg, entities: this._snap.entities, exclude: this._snap.exclude };
      this._snap = null; this._changed.clear(); this._roomChanged.clear();
    }
    this._edit = on;
    this._wrap.classList.toggle('editing', on); this._editBtn.classList.toggle('on', on);
    this._ebar.classList.toggle('show', on); this._updEbar(); this._hideTip();
    if (revert) this._collect(); else this._renderDrawer();
  }

  _ensureEdit() { if (!this._edit) this._setEdit(true); return this._edit; }

  _updEbar() { const n = this._changed.size; this._ebar.querySelector('.sv').textContent = n ? 'Save ' + n : 'Save'; }

  _roomName(rid) { const R = this._rooms?.[rid]; return R ? (this._cfg.room_names || {})[rid] || R.name : ''; }

  // working copy of one entity's card override (normalises `entities.x: false` into the exclude list)
  _ent(eid) {
    const E = this._cfg.entities, v = E[eid];
    if (v === false) { delete E[eid]; if (!this._cfg.exclude.includes(eid)) this._cfg.exclude = [...this._cfg.exclude, eid]; }
    return v && typeof v === 'object' ? { ...v } : {};
  }

  // working copy that is safe to mutate (HA may hand setConfig a frozen object)
  _work() {
    if (this._edit) return; // edit mode already works on a private copy (see _setEdit)
    this._cfg = { ...this._cfg, entities: clone(this._cfg.entities || {}), exclude: [...(this._cfg.exclude || [])] };
  }

  _refresh() { this._collect(); this._sync(); }

  // edit-mode change (drag / reset): stays pending until Save
  _put(eid, o, roomChanged) {
    const E = this._cfg.entities;
    if (Object.keys(o).length) E[eid] = o; else delete E[eid];
    this._changed.add(eid); if (roomChanged) this._roomChanged.add(eid);
    this._updEbar(); this._refresh();
  }

  // Drawer room select: applied and saved immediately (dashboard config + HA entity registry area).
  _setRoom(eid, rid) {
    if (!this._admin || !this._rooms) return;
    this._work();
    let o = this._ent(eid);
    if (rid && this._rooms[rid]) {
      const R = this._rooms[rid];
      o.room = rid; delete o.floor;
      // keep a saved position only if it already lies inside the new room; otherwise auto-place around the room centre
      if (o.x != null && !inside(R.poly, o.x - PLAN.W / 2, (o.z ?? 0) - PLAN.D / 2)) { delete o.x; delete o.z; }
    } else o = { room: '' }; // explicit "unassigned": overrides any HA area mapping, removes it from the map
    this._cfg.entities[eid] = o;
    this._refresh();
    if (rid && this._rooms[rid]) this._focusRoom(rid);
    return this._commitNow(eid, true, rid ? `→ ${this._roomName(rid)}` : '→ Unassigned');
  }

  // Drawer hide/unhide: applied and saved immediately.
  _setHidden(eid, hide) {
    if (!this._admin || !this._rooms) return;
    this._work();
    this._ent(eid);
    const ex = new Set(this._cfg.exclude);
    if (hide) ex.add(eid); else ex.delete(eid);
    this._cfg.exclude = [...ex];
    this._refresh();
    return this._commitNow(eid, false, hide ? 'hidden' : 'shown');
  }

  // Right-click a marker in edit mode: drop its saved x/z so it is auto-placed in its room again (pending until Save).
  _resetPos(eid) {
    if (!this._ensureEdit()) return;
    const o = this._ent(eid);
    if (o.x == null && o.z == null) return;
    delete o.x; delete o.z;
    this._put(eid, o, false);
    this._toast(`${this._name(eid)}: position reset`);
  }

  _name(eid) { return this._hass?.states[eid]?.attributes.friendly_name || eid; }

  // Save one drawer change right away. If edit mode is open, the change is folded into its snapshot
  // so a later Cancel doesn't undo something that is already saved.
  async _commitNow(eid, roomChanged, what) {
    const rooms = roomChanged || this._roomChanged.has(eid) ? [eid] : [];
    if (this._snap) {
      const E = this._cfg.entities;
      if (eid in E) this._snap.entities[eid] = clone(E[eid]); else delete this._snap.entities[eid];
      this._snap.exclude = this._snap.exclude.filter((x) => x !== eid);
      if (this._cfg.exclude.includes(eid)) this._snap.exclude.push(eid);
      this._changed.delete(eid); this._roomChanged.delete(eid); this._updEbar();
    }
    (this._saving ||= new Set()).add(eid); this._renderDrawer();
    try {
      const res = await this._commit([eid], rooms);
      this._toast([`${this._name(eid)} ${what}`, ...this._areaBits(res)].join(' · '));
      return res;
    } catch (err) {
      this._toast(`Save failed for ${this._name(eid)}: ${err?.message || err?.code || err}`); console.error('house3d save', err);
    } finally { this._saving.delete(eid); this._renderDrawer(); }
  }

  _areaBits(res) {
    const bits = [];
    if (res.updated) bits.push(`${res.updated} HA area${res.updated === 1 ? '' : 's'} updated`);
    if (res.skipped.length) bits.push(`${res.skipped.length} area sync skipped`);
    if (res.failed.length) bits.push(`${res.failed.length} area update${res.failed.length === 1 ? '' : 's'} failed`);
    if (res.skipped.length || res.failed.length) console.warn('house3d area sync', res);
    return bits;
  }

  // Write the given entities' overrides / exclude flags into the dashboard config, then mirror room changes into
  // HA's entity registry. Commits are queued so overlapping saves never read a stale dashboard config.
  _commit(eids, roomEids) {
    const run = async () => {
      this._busy = (this._busy || 0) + 1;
      try {
        const h = this._hass, seg = location.pathname.split('/')[1];
        const url_path = !seg || seg === 'lovelace' ? null : seg;
        const cfg = await h.callWS({ type: 'lovelace/config', url_path });
        const cards = [];
        const walk = (o) => { if (!o || typeof o !== 'object') return; if (Array.isArray(o)) { o.forEach(walk); return; } if (o.type === 'custom:house3d-card') cards.push(o); for (const k of ['views', 'cards', 'sections', 'card']) if (o[k]) walk(o[k]); };
        walk(cfg);
        const card = cards.find((c) => (c.title || 'Home') === this._cfg.title) || cards[0];
        if (!card) throw new Error('house3d card not found in this dashboard');
        // merge only the entities touched here, so unrelated hand edits to the YAML survive
        const E = this._cfg.entities || {}, wEx = new Set(this._cfg.exclude || []);
        const cE = { ...(card.entities && typeof card.entities === 'object' ? card.entities : {}) }, cEx = new Set(card.exclude || []);
        for (const eid of eids) {
          if (eid in E) cE[eid] = clone(E[eid]); else delete cE[eid];
          if (wEx.has(eid)) cEx.add(eid); else cEx.delete(eid);
        }
        card.entities = cE;
        if (cEx.size || card.exclude) card.exclude = [...cEx];
        await h.callWS({ type: 'lovelace/config/save', url_path, config: cfg });
        return await this._syncAreas(roomEids);
      } finally { this._busy--; }
    };
    const p = (this._q || Promise.resolve()).then(run, run);
    this._q = p.catch(() => {});
    return p;
  }

  _roomAt(fid, x, z) { return Object.values(this._rooms).find((R) => R.floor === fid && inside(R.poly, x, z)) || null; }

  _dragStart(m, ev) {
    ev.preventDefault(); ev.stopPropagation();
    if (ev.button === 2) return;
    const T = this.T, el = m.el, fid = m.e.floor, F = this._floors[fid];
    const fr = Object.values(this._rooms).filter((R) => R.floor === fid);
    const lim = [Math.min(...fr.map((R) => R.bb[0])) - 1.5, Math.min(...fr.map((R) => R.bb[1])) - 1.5, Math.max(...fr.map((R) => R.bb[2])) + 1.5, Math.max(...fr.map((R) => R.bb[3])) + 1.5];
    el.setPointerCapture(ev.pointerId); el.classList.add('drag');
    const plane = new T.Plane(new T.Vector3(0, 1, 0), -(F.y + m.p.y)), rc = new T.Raycaster(), hit = new T.Vector3();
    const x0 = ev.clientX, y0 = ev.clientY, name = this._hass.states[m.e.eid]?.attributes.friendly_name || m.e.eid;
    let moved = false, over = this._rooms[m.e.room] || null;
    const move = (e) => {
      if (!moved && Math.hypot(e.clientX - x0, e.clientY - y0) < 4) return;
      moved = true;
      const rect = this._canvas.getBoundingClientRect();
      rc.setFromCamera(new T.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1), this._cam);
      if (!rc.ray.intersectPlane(plane, hit)) return;
      const x = Math.min(lim[2], Math.max(lim[0], hit.x)), z = Math.min(lim[3], Math.max(lim[1], hit.z));
      m.p.x = x; m.p.z = z; m.e.pos = [x, z]; if (m.glow) m.glow.position.set(x, 0.6, z);
      over = this._roomAt(fid, x, z);
      const W = this._wrap.getBoundingClientRect(), same = over && over.id === m.e.room;
      this._tip.innerHTML = '<b></b><span></span>';
      this._tip.querySelector('b').textContent = name;
      this._tip.querySelector('span').textContent = over ? (same ? '' : '→ ') + this._roomName(over.id) : `no room · ${F.def.name}`;
      this._tip.style.left = `${Math.min(e.clientX - W.left + 18, W.width - 200)}px`; this._tip.style.top = `${e.clientY - W.top - 52}px`; this._tip.style.opacity = 1;
      this._dirty = true;
    };
    const up = () => {
      el.classList.remove('drag'); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
      this._hideTip();
      if (!moved) return;
      const o = this._ent(m.e.eid), prev = m.e.room || null, now = over ? over.id : null;
      o.x = +(m.p.x + PLAN.W / 2).toFixed(2); o.z = +(m.p.z + PLAN.D / 2).toFixed(2);
      if (now) { o.room = now; delete o.floor; } else { o.room = ''; o.floor = fid; } // dropped outside every room: floor-only marker
      this._put(m.e.eid, o, now !== prev);
    };
    el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  }

  async _saveEdits() {
    const sv = this._ebar.querySelector('.sv'), ch = [...this._changed];
    if (!ch.length) { this._setEdit(false); return; }
    sv.textContent = 'Saving…';
    try {
      const res = await this._commit(ch, [...this._roomChanged]);
      this._setEdit(false, true);
      this._toast([`Saved ${ch.length} change${ch.length === 1 ? '' : 's'}`, ...this._areaBits(res)].join(' · '));
    } catch (err) { sv.textContent = 'Save failed'; this._toast('Save failed: ' + (err?.message || err?.code || err)); console.error('house3d save', err); }
  }

  // Mirror room changes into HA's entity registry so the default (area-based) dashboards follow.
  async _syncAreas(eids) {
    const h = this._hass, amap = this._areaRoomMap(), E = this._cfg.entities || {}, out = { updated: 0, skipped: [], failed: [] };
    for (const eid of eids) {
      const o = E[eid], reg = h.entities?.[eid];
      if (!o || typeof o !== 'object' || !('room' in o)) continue;
      if (!o.room && o.floor) continue; // dropped on the floor outside any room: leave the HA area alone
      if (!reg) { out.skipped.push(`${eid}: not in the entity registry (no unique_id)`); continue; }
      const rid = o.room || '', devArea = h.devices?.[reg.device_id]?.area_id || null, cur = reg.area_id || devArea || null;
      let want = null;
      if (rid) {
        const cands = Object.keys(amap).filter((a) => amap[a] === rid);
        if (!cands.length) { out.skipped.push(`${eid}: no HA area is mapped to "${this._roomName(rid)}" (add it under the card's rooms:)`); continue; }
        want = cands.includes(cur) ? cur : cands[0];
      } else if (devArea) out.skipped.push(`${eid}: unassigned, but still inherits its device's area "${h.areas?.[devArea]?.name || devArea}"`);
      const area_id = want && want === devArea ? null : want; // null = follow the device's area
      if ((reg.area_id || null) === area_id) continue;
      try { await h.callWS({ type: 'config/entity_registry/update', entity_id: eid, area_id }); out.updated++; } catch (e) { out.failed.push(`${eid}: ${e?.message || e?.code || e}`); }
    }
    return out;
  }

  _toast(msg) {
    const t = this._toastEl; t.textContent = msg; t.classList.add('show');
    clearTimeout(this._toastT); this._toastT = setTimeout(() => t.classList.remove('show'), 5000);
  }

  /* ---------------- device drawer ---------------- */
  _toggleDrawer(on = !this._drwOpen, tab) {
    this._drwOpen = on; if (tab) this._tab = tab;
    this._drw.classList.toggle('show', on); this._lstBtn.classList.toggle('on', on);
    if (on) this._renderDrawer(); else this._rowSt = null;
  }

  _roomOptions() {
    let html = '<option value="">(Unassigned)</option>';
    for (const f of [...PLAN.floors].reverse()) {
      const names = f.rooms.map((r) => this._roomName(r.id));
      html += `<optgroup label="${esc(f.name)}">`;
      f.rooms.forEach((r, i) => { const n = names[i]; html += `<option value="${esc(r.id)}">${esc(names.filter((x) => x === n).length > 1 ? `${n} (${r.dims})` : n)}</option>`; });
      html += '</optgroup>';
    }
    return html;
  }

  _renderDrawer() {
    if (!this._drwOpen || !this._all || !this._hass) return;
    const h = this._hass, all = this._all, q = norm(this._drwQ.value);
    const tabOf = (r) => (r.hidden ? 'hidden' : r.placed ? 'placed' : 'unassigned');
    const counts = { all: all.length, unassigned: 0, placed: 0, hidden: 0 };
    for (const r of all) counts[tabOf(r)]++;
    this._drwTabs.innerHTML = '';
    for (const [id, label] of [['all', 'All'], ['unassigned', 'Unassigned'], ['placed', 'Placed'], ['hidden', 'Hidden']]) {
      const b = document.createElement('button'); b.className = id === this._tab ? 'on' : ''; b.dataset.tab = id;
      b.innerHTML = `${label}<b>${counts[id]}</b>`; b.onclick = () => { this._tab = id; this._drwList.scrollTop = 0; this._renderDrawer(); };
      this._drwTabs.appendChild(b);
    }
    const fname = (fid) => this._floors[fid]?.def.name || '';
    const nameOf = (r) => h.states[r.eid]?.attributes.friendly_name || r.eid;
    const rows = all
      .filter((r) => this._tab === 'all' || tabOf(r) === this._tab)
      .filter((r) => !q || norm(`${nameOf(r)} ${r.eid} ${this._roomName(r.room)} ${r.floor && !r.room ? fname(r.floor) : ''}`).includes(q))
      .sort((a, b) => nameOf(a).localeCompare(nameOf(b)));
    const top = this._drwList.scrollTop, opts = this._roomOptions(), icon = customElements.get('ha-state-icon') ? 'ha-state-icon' : 'ha-icon', ro = !this._admin;
    this._drwList.innerHTML = '';
    this._rowSt = new Map();
    if (!rows.length) this._drwList.innerHTML = `<div class="em">${q ? 'No devices match your search' : this._tab === 'hidden' ? 'No hidden devices' : this._tab === 'unassigned' ? 'Every device is on the map' : 'No devices'}</div>`;
    const frag = document.createDocumentFragment();
    for (const r of rows) {
      const d = document.createElement('div');
      d.className = `row${r.hidden ? ' hid' : ''}${this._changed.has(r.eid) ? ' pend' : ''}${this._saving?.has(r.eid) ? ' busy' : ''}`; d.dataset.eid = r.eid;
      const fo = r.floor && !r.room ? `<option value="@floor" disabled>(${esc(fname(r.floor))} · no room)</option>` : '';
      const canLoc = r.placed && !r.hidden;
      d.innerHTML = `<div class="di"><${icon}></${icon}></div><div class="nm"><b></b><small></small></div><span class="st"></span>
        <select title="Room"${ro ? ' disabled' : ''}>${fo}${opts}</select>
        <span class="acts"><button class="loc" title="${canLoc ? 'Locate on map' : 'Not on the map'}"${canLoc ? '' : ' disabled'}><ha-icon icon="mdi:crosshairs"></ha-icon></button>
        <button class="eye" title="${r.hidden ? 'Show on map' : 'Hide from map'}"${ro ? ' disabled' : ''}><ha-icon icon="mdi:${r.hidden ? 'eye-off' : 'eye'}"></ha-icon></button></span>`;
      d.querySelector('b').textContent = nameOf(r);
      d.querySelector('small').textContent = r.eid;
      const sel = d.querySelector('select');
      sel.value = fo ? '@floor' : r.room;
      sel.onclick = (e) => e.stopPropagation();
      sel.onchange = () => this._setRoom(r.eid, sel.value);
      d.querySelector('.eye').onclick = (e) => { e.stopPropagation(); this._setHidden(r.eid, !r.hidden); };
      d.querySelector('.loc').onclick = (e) => { e.stopPropagation(); this._locate(r.eid); };
      d.onclick = () => this._focusEntity(r);
      const ent = { row: d, st: d.querySelector('.st'), ic: d.querySelector(icon), dom: r.dom, last: null };
      this._rowSt.set(r.eid, ent); this._rowUpd(ent, h.states[r.eid]);
      frag.appendChild(d);
    }
    this._drwList.appendChild(frag);
    this._drwList.scrollTop = top;
  }

  _rowUpd(r, st) {
    if (!st || r.last === st) return;
    r.last = st;
    const vis = this._visual(st, r.dom);
    r.st.textContent = this._fmt(st);
    r.row.classList.toggle('act', vis.act); r.row.style.setProperty('--c', vis.c);
    if (r.ic.tagName === 'HA-STATE-ICON') { r.ic.hass = this._hass; r.ic.stateObj = st; }
    else r.ic.icon = st.attributes.icon || `mdi:${DOM_ICON[r.dom] || 'circle'}`;
  }

  _focusEntity(r) {
    if (this._locate(r.eid)) return;
    if (r.room && !r.hidden) this._focusRoom(r.room); else this._more(r.eid);
  }

  // Fly the camera to a device's marker (switching floor if needed) and pulse it. Returns false if it isn't on the map.
  _locate(eid) {
    const m = (this._markers || []).find((x) => x.e.eid === eid);
    if (!m) return false;
    const fid = m.e.floor;
    if (this._floor !== fid) this._setFloor(fid, false);
    this._animTo({ target: new this.T.Vector3(m.p.x, this._floors[fid].y, m.p.z), theta: this._rig.theta, phi: 0.8, radius: 26 });
    m.el.classList.remove('ping'); void m.el.offsetWidth; m.el.classList.add('ping');
    clearTimeout(m.pingT); m.pingT = setTimeout(() => m.el.classList.remove('ping'), 3000);
    this._pulse(m);
    return true;
  }

  // expanding ring on the floor under a marker (drawn in 3D so it reads at any camera angle)
  _pulse(m) {
    const T = this.T;
    if (!this._ringGeo) this._ringGeo = new T.RingGeometry(0.75, 1, 48);
    (this._pulses ||= []).filter((p) => p.m === m).forEach((p) => (p.t0 = -1e9)); // restart instead of stacking
    for (let k = 0; k < 2; k++) {
      const mesh = new T.Mesh(this._ringGeo, new T.MeshBasicMaterial({ color: 0x7aa2ff, transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide }));
      mesh.rotation.x = -Math.PI / 2; mesh.position.set(m.p.x, 0.32, m.p.z); mesh.renderOrder = 5;
      m.F.grp.add(mesh);
      this._pulses.push({ m, mesh, t0: performance.now() + k * 450, dur: 1400 });
    }
    this._dirty = true;
  }

  _tickPulses(now) {
    const ps = this._pulses; if (!ps?.length) return;
    this._pulses = ps.filter((p) => {
      const t = (now - p.t0) / p.dur;
      if (t >= 1) { p.mesh.parent?.remove(p.mesh); p.mesh.material.dispose(); return false; }
      const k = Math.max(0, t);
      p.mesh.scale.setScalar(0.6 + 5.5 * (1 - Math.pow(1 - k, 2)));
      p.mesh.material.opacity = t < 0 ? 0 : 0.9 * (1 - k);
      return true;
    });
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
      else m.ic.icon = st.attributes.icon || `mdi:${DOM_ICON[m.e.dom] || 'circle'}`;
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
    if (this._drwOpen && this._rowSt) for (const [eid, r] of this._rowSt) this._rowUpd(r, h.states[eid]);
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
      if (act === 'unplaced') d.onclick = () => this._toggleDrawer(true, 'unassigned');
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
      this._tickPulses(now);
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
    if (this._scene.fog) { this._scene.fog.near = rig.radius * 1.3 + 40; this._scene.fog.far = rig.radius * 1.3 + 220; }
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
