// house3d-card 1.0.0 -> 1.1.0: edit mode, laundry doorway, 8 ft walls, full-storey stairs with stairwell openings.
// Usage (node): node patch-1.1.js house3d-card.js   — the same applyPatch() body is run in the HA page.
function applyPatch(src) {
  const errs = [];
  const rep = (a, b) => { const n = src.split(a).length - 1; if (n !== 1) errs.push('count ' + n + ': ' + a.slice(0, 60)); else src = src.replace(a, () => b); };
  const between = (a, z, b) => { const i = src.indexOf(a), j = src.indexOf(z, i); if (i < 0 || j < 0) errs.push('between ' + a); else src = src.slice(0, i) + b + src.slice(j); };

  rep(`const CARD_VERSION = '1.0.0';`, `const CARD_VERSION = '1.1.0';`);
  rep(`wall_height: 4.6,`, `wall_height: 8,`);
  rep(`        [338, 312, 622, 312, [[530, 580, 'd']]],`, `        [338, 312, 622, 312, [[360, 481, 'd'], [530, 580, 'd']]], // 60" laundry opening + bath door`);
  rep(`    this._floors = {}; this._rooms = {};`, `    this._floors = {}; this._rooms = {}; this._stairs = [];`);
  rep(String.raw`      // base slab
      box(-P.W / 2 - 0.3, -P.D / 2 - 0.3, P.W / 2 + 0.3, P.D / 2 + 0.3, -0.6, 0, M.slab);`, String.raw`      // base slab, with stairwell openings cut out
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
      }`);
  between(`      // stairs\n`, `      for (const fx of f.fixtures`, String.raw`      // stairs: each run climbs one full storey (floor to the floor above)
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
`);
  rep(`phi: id === 'all' ? 1.0 : 0.82, radius: id === 'all' ? 92 : 62`, `phi: id === 'all' ? 0.95 : 0.72, radius: id === 'all' ? 96 : 66`);
  rep(`      this._floors[f.id] = { def: f, grp, mats: allMats, y: grp.position.y, idx };`, `      this._floors[f.id] = { def: f, grp, mats: allMats, y: grp.position.y, idx, stairMat: M.stair };`);
  rep(`        if (mode === 'ghost') { m.transparent = true;`, `        if (mode === 'ghost' && !(F.idx === sel.idx - 1 && m === F.stairMat)) { m.transparent = true;`);
  rep(`    this._wrap.querySelector('.sub').textContent = id === 'all' ? '' : sel.def.name;`, `    // stairs below the shown floor stretch to meet it, so they read as going down through the stairwell
    for (const sg of this._stairs || []) sg.scale.y = id === 'all' || sg.userData.idx < sel.idx ? this._cfg.floor_gap / sg.userData.story : 1;
    this._wrap.querySelector('.sub').textContent = id === 'all' ? '' : sel.def.name;`);
  rep(`    if (!this._wrap) return;\n    const sig =`, `    if (!this._wrap) return;\n    if (this._editBtn) this._editBtn.style.display = h.user?.is_admin ? '' : 'none';\n    const sig =`);
  rep(`<button class="ib glass reset" title="Reset view"><ha-icon icon="mdi:crosshairs-gps"></ha-icon></button></div>`, `<button class="ib glass edit" title="Move devices"><ha-icon icon="mdi:cursor-move"></ha-icon></button><button class="ib glass reset" title="Reset view"><ha-icon icon="mdi:crosshairs-gps"></ha-icon></button></div>
      <div class="ebar glass"><span>Drag devices to move them · right-click one to reset it</span><button class="sv">Save</button><button class="cn">Cancel</button></div>`);
  rep(`    $('.reset').onclick = () => this._setFloor(this._floor, true);`, `    $('.reset').onclick = () => this._setFloor(this._floor, true);
    this._editBtn = $('.edit'); this._ebar = $('.ebar'); this._pending = {};
    this._editBtn.onclick = () => this._setEdit(!this._edit);
    $('.sv').onclick = () => this._saveEdits();
    $('.cn').onclick = () => { this._setEdit(false); this._collect(); };`);
  rep(`.err{color:#ff9a9a;padding:20px}`, String.raw`.err{color:#ff9a9a;padding:20px}
.ib.on{color:#fff;background:rgba(122,162,255,.28)}
.ebar{position:absolute;top:64px;left:50%;transform:translateX(-50%);display:none;align-items:center;gap:10px;padding:7px 8px 7px 14px;border-radius:12px;font-size:12.5px;z-index:100001;white-space:nowrap}
.ebar.show{display:flex}
.ebar button{all:unset;cursor:pointer;padding:6px 12px;border-radius:9px;font-size:12.5px;font-weight:600}
.ebar .sv{background:#7aa2ff;color:#0b0f17}
.ebar .cn{color:var(--h3-dim)}
.ebar .cn:hover{color:#fff}
.editing .m{cursor:grab}
.editing .m .d{outline:2px dashed rgba(122,162,255,.75);outline-offset:3px}
.m.drag{cursor:grabbing;transition:none}`);
  rep(`d.addEventListener('pointerdown', () => { long = false; timer = setTimeout(() => { long = true; this._more(e.eid); }, 500); });`, `d.addEventListener('pointerdown', (ev) => { if (this._edit) return this._dragStart(m, ev); long = false; timer = setTimeout(() => { long = true; this._more(e.eid); }, 500); });`);
  rep(`const d = document.createElement('div'); d.className = 'rl';`, `const d = document.createElement('div'); d.className = 'rl'; d.style.opacity = 0;`);
  rep(`const d = document.createElement('div'); d.className = 'm';`, `const d = document.createElement('div'); d.className = 'm'; d.style.opacity = 0;`);
  rep(`d.addEventListener('click', (ev) => { ev.stopPropagation(); if (long) return;`, `d.addEventListener('click', (ev) => { ev.stopPropagation(); if (long || this._edit) return;`);
  rep(`d.addEventListener('contextmenu', (ev) => { ev.preventDefault(); this._more(e.eid); });`, `d.addEventListener('contextmenu', (ev) => { ev.preventDefault(); if (this._edit) { this._pending[e.eid] = null; this._updEbar(); return; } this._more(e.eid); });`);
  rep(`d.addEventListener('pointerenter', () => this._showTip(e, d));`, `d.addEventListener('pointerenter', () => { if (!this._edit) this._showTip(e, d); });`);
  rep(`  _more(eid) {`, String.raw`  /* ---------------- edit mode ---------------- */
  _setEdit(on) {
    this._edit = on; if (!on) this._pending = {};
    this._wrap.classList.toggle('editing', on); this._editBtn.classList.toggle('on', on);
    this._ebar.classList.toggle('show', on); this._updEbar(); this._hideTip();
  }

  _updEbar() { const n = Object.keys(this._pending || {}).length; this._ebar.querySelector('.sv').textContent = n ? 'Save ' + n : 'Save'; }

  _dragStart(m, ev) {
    ev.preventDefault(); ev.stopPropagation();
    const T = this.T, el = m.el, R = this._rooms[m.e.room];
    el.setPointerCapture(ev.pointerId); el.classList.add('drag');
    const plane = new T.Plane(new T.Vector3(0, 1, 0), -(m.F.y + m.p.y)), rc = new T.Raycaster(), hit = new T.Vector3();
    const move = (e) => {
      const rect = this._canvas.getBoundingClientRect();
      rc.setFromCamera(new T.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1), this._cam);
      if (!rc.ray.intersectPlane(plane, hit)) return;
      let x = hit.x, z = hit.z;
      if (R) { x = Math.min(R.bb[2] - 0.4, Math.max(R.bb[0] + 0.4, x)); z = Math.min(R.bb[3] - 0.4, Math.max(R.bb[1] + 0.4, z)); }
      m.p.x = x; m.p.z = z; m.e.pos = [x, z]; if (m.glow) m.glow.position.set(x, 0.6, z);
      this._pending[m.e.eid] = { x: +(x + PLAN.W / 2).toFixed(2), z: +(z + PLAN.D / 2).toFixed(2) };
      this._dirty = true;
    };
    const up = () => { el.classList.remove('drag'); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); this._updEbar(); };
    el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  }

  async _saveEdits() {
    const pend = this._pending || {}, h = this._hass, sv = this._ebar.querySelector('.sv');
    if (!Object.keys(pend).length) { this._setEdit(false); return; }
    const seg = location.pathname.split('/')[1];
    const url_path = !seg || seg === 'lovelace' ? null : seg;
    sv.textContent = 'Saving…';
    try {
      const cfg = await h.callWS({ type: 'lovelace/config', url_path });
      const cards = [];
      const walk = (o) => { if (!o || typeof o !== 'object') return; if (Array.isArray(o)) { o.forEach(walk); return; } if (o.type === 'custom:house3d-card') cards.push(o); for (const k of ['views', 'cards', 'sections', 'card']) if (o[k]) walk(o[k]); };
      walk(cfg);
      const card = cards.find((c) => (c.title || 'Home') === this._cfg.title) || cards[0];
      if (!card) throw new Error('house3d card not found in this dashboard');
      card.entities = card.entities || {};
      for (const [eid, p] of Object.entries(pend)) {
        const cur = { ...(card.entities[eid] && typeof card.entities[eid] === 'object' ? card.entities[eid] : {}) };
        const it = (this._placed || []).find((x) => x.eid === eid);
        if (p === null) { delete cur.x; delete cur.z; }
        else { Object.assign(cur, p); if (it && it.room) cur.room = it.room; else if (it && it.floor) cur.floor = it.floor; }
        if (Object.keys(cur).length) card.entities[eid] = cur; else delete card.entities[eid];
      }
      await h.callWS({ type: 'lovelace/config/save', url_path, config: cfg });
      this._setEdit(false);
    } catch (err) { sv.textContent = 'Save failed'; console.error('house3d save', err); }
  }

  _more(eid) {`);
  return { src, errs };
}

if (typeof module !== 'undefined' && require.main === module) {
  const fs = require('fs'), f = process.argv[2];
  const { src, errs } = applyPatch(fs.readFileSync(f, 'utf8'));
  if (errs.length) { console.error(errs); process.exit(1); }
  fs.writeFileSync(f, src); console.log('patched', src.length);
}
