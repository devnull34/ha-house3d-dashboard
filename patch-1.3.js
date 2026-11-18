// house3d-card 1.2.0 -> 1.3.0: no practical zoom/tilt limits (fog follows the camera),
// loading screen with a real progress bar (streamed three.js download) and a live step log.
function applyPatch(src) {
  const errs = [];
  const rep = (a, b) => { const n = src.split(a).length - 1; if (n !== 1) errs.push('count ' + n + ': ' + a.slice(0, 60)); else src = src.replace(a, () => b); };
  const repAll = (a, b, want) => { const n = src.split(a).length - 1; if (n !== want) errs.push('countAll ' + n + ': ' + a.slice(0, 60)); else src = src.split(a).join(b); };

  rep(`const CARD_VERSION = '1.2.0';`, `const CARD_VERSION = '1.3.0';`);

  // --- limits ---
  repAll(`Math.min(220, Math.max(12, rig.radius *`, `Math.min(1500, Math.max(1.5, rig.radius *`, 2);
  rep(`rig.phi = Math.min(1.45, Math.max(0.12, rig.phi - dy * 0.006));`, `rig.phi = Math.min(1.565, Math.max(0.01, rig.phi - dy * 0.006));`);
  rep(`this._cam = new T.PerspectiveCamera(38, 1, 0.5, 600);`, `this._cam = new T.PerspectiveCamera(38, 1, 0.1, 8000);`);
  rep(`    cam.lookAt(rig.target); cam.updateMatrixWorld();`, `    cam.lookAt(rig.target); cam.updateMatrixWorld();
    if (this._scene.fog) { this._scene.fog.near = rig.radius * 1.3 + 40; this._scene.fog.far = rig.radius * 1.3 + 220; }`);

  // --- loading screen ---
  rep(`<div class="load">Loading 3D engine…</div>`, `<div class="load"><div class="lbox glass"><div class="lt"><span class="lmsg">Loading 3D view</span><span class="lpct">0%</span></div><div class="lbar"><i></i></div><div class="llog"></div></div></div>`);
  rep(`.load{position:absolute;inset:0;display:grid;place-items:center;color:var(--h3-dim);font-size:13px}`, `.load{position:absolute;inset:0;display:grid;place-items:center;color:var(--h3-dim);font-size:13px;z-index:200000;transition:opacity .3s}
.lbox{width:min(380px,82%);padding:16px 18px 14px;border-radius:14px}
.lt{display:flex;justify-content:space-between;gap:12px;font-size:13px;font-weight:600;color:var(--h3-text);margin-bottom:10px}
.lpct{color:var(--h3-accent);font-variant-numeric:tabular-nums}
.lbar{height:6px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden}
.lbar i{display:block;height:100%;width:0;border-radius:99px;background:linear-gradient(90deg,#5b7cff,#7aa2ff,#9fe3c8);transition:width .2s}
.llog{margin-top:10px;font:11px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--h3-dim);min-height:4.65em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.llog div{overflow:hidden;text-overflow:ellipsis}
.llog div:last-child{color:#cfd8e6}`);

  rep(`  async _boot() {
    let err;
    for (const u of this._cfg.three_url ? [this._cfg.three_url] : THREE_URLS) { try { this.T = await import(u); break; } catch (e) { err = e; } }
    if (!this.T) { this._load.innerHTML = \`<div class="err">Could not load three.js (\${err?.message}). Set <code>three_url</code>.</div>\`; return; }
    this._load.remove();
    this._initScene();
    this._buildHouse();
    this._buildSeg();
    if (this._hass) { this._collect(); this._sync(); }
    this._setFloor(this._cfg.default_floor, true, true);
    this._loop();
  }`, String.raw`  /* ---------------- loading progress ---------------- */
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
  }`);
  rep(`    if (!this._rooms || !this._hass) return;`, `    if (!this._ready || !this._rooms || !this._hass) return;`);

  // --- build floors one at a time so progress can paint ---
  rep(`  _buildHouse() {`, `  async _buildHouse() {`);
  rep(`    P.floors.forEach((f, idx) => {`, `    for (const [idx, f] of P.floors.entries()) {`);
  rep(`      this._floors[f.id] = { def: f, grp, mats: allMats, y: grp.position.y, idx, stairMat: M.stair };
    });
  }`, `      this._floors[f.id] = { def: f, grp, mats: allMats, y: grp.position.y, idx, stairMat: M.stair };
      this._prog(66 + 8 * (idx + 1), null, f.name + ': ' + f.rooms.length + ' rooms, ' + f.walls.length + ' walls, ' + (f.stairs || []).filter((s) => !s.void).length + ' stair runs');
      await this._frame();
    }
  }`);
  return { src, errs };
}

if (typeof module !== 'undefined' && require.main === module) {
  const fs = require('fs'), f = process.argv[2];
  const { src, errs } = applyPatch(fs.readFileSync(f, 'utf8'));
  if (errs.length) { console.error(errs); process.exit(1); }
  fs.writeFileSync(f, src); console.log('patched', src.length);
}
