// End-to-end check of house3d-card 1.3.0 against test.html in headless Edge (CDP over Node's built-in WebSocket).
// usage: node verify-1.3.mjs   (serves this folder on :8765 itself; writes verify-*.png screenshots)
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const EDGE = process.env.EDGE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 8765, DBG = 9339;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const procs = [];
const fail = [];
const ok = (cond, msg, extra) => { console.log((cond ? 'PASS ' : 'FAIL ') + msg + (extra !== undefined ? '  ' + JSON.stringify(extra) : '')); if (!cond) fail.push(msg); };

procs.push(spawn('python', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { stdio: 'ignore' }));
procs.push(spawn(EDGE, ['--headless=new', `--remote-debugging-port=${DBG}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'h3edge-'))}`, '--window-size=1400,900', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', 'about:blank'], { stdio: 'ignore' }));

let ws, id = 0; const pend = new Map(), logs = [];
async function connect() {
  for (let i = 0; i < 60; i++) {
    try { const t = await (await fetch(`http://127.0.0.1:${DBG}/json/list`)).json(); const p = t.find((x) => x.type === 'page'); if (p) return p.webSocketDebuggerUrl; } catch (_) {}
    await sleep(250);
  }
  throw new Error('no CDP');
}
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: `(async()=>{${expr}})()`, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
const until = async (expr, ms = 30000) => { const t0 = Date.now(); for (;;) { const v = await ev(expr).catch(() => null); if (v) return v; if (Date.now() - t0 > ms) throw new Error('timeout: ' + expr); await sleep(150); } };
const shot = async (f) => { const { data } = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(f, Buffer.from(data, 'base64')); console.log('   screenshot', f); };
const mouse = (type, x, y, buttons = 1) => send('Input.dispatchMouseEvent', { type, x, y, button: type === 'mouseMoved' && !buttons ? 'none' : 'left', buttons, clickCount: 1 });

try {
  ws = new WebSocket(await connect());
  await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { const p = pend.get(d.id); pend.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); }
    if (d.method === 'Runtime.exceptionThrown') logs.push('EXC ' + d.params.exceptionDetails.exception?.description);
    if (d.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(d.params.type)) logs.push(d.params.type + ' ' + d.params.args.map((a) => a.value ?? a.description).join(' '));
  };
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/test.html?t=${Date.now()}` });

  // ---- boot / loading screen ----
  await until(`return window.c && c.shadowRoot && c.shadowRoot.querySelector('.lbar')`, 15000);
  ok(true, 'loading screen with progress bar rendered');
  await until(`return c._ready && !c.shadowRoot.querySelector('.load')`, 60000);
  ok(true, 'three.js loaded, loading screen removed');
  ok(await ev(`return document.querySelector('house3d-card') && (await import('./house3d-card.js'), true)`), 'module imports');
  const R = (expr) => ev(`const S=c.shadowRoot, $=(q)=>S.querySelector(q), $$=(q)=>[...S.querySelectorAll(q)]; ${expr}`);
  ok(await R(`return $('.lst ha-icon').getAttribute('icon')==='mdi:format-list-bulleted'`), 'drawer toggle button in top bar');
  ok(await R(`return c._cam.near===0.1 && c._cam.far===8000`), 'camera near/far unlocked (1.3 limits)');
  await R(`c.shadowRoot.querySelector('canvas').dispatchEvent(new WheelEvent('wheel',{deltaY:-5000,cancelable:true})); return 1`);
  ok(await R(`return c._rig.radius < 3`), 'zoom-in limit ~1.5 (was 12)', await R(`return c._rig.radius`));
  await R(`c._setFloor('all', true, true); return 1`);

  // ---- drawer tabs ----
  await R(`$('.lst').click(); return 1`);
  ok(await R(`return $('.drw').classList.contains('show')`), 'drawer opens');
  const counts = await R(`return Object.fromEntries($$('.tabs button').map(b=>[b.dataset.tab, +b.querySelector('b').textContent]))`);
  ok(JSON.stringify(counts) === JSON.stringify({ all: 36, unassigned: 10, placed: 23, hidden: 3 }), 'tab counts All/Unassigned/Placed/Hidden', counts);
  const tabRows = async (t) => R(`$$('.tabs button').find(b=>b.dataset.tab==='${t}').click(); return $$('.row').map(r=>r.dataset.eid)`);
  const un = await tabRows('unassigned');
  ok(['light.wiz_09d07a', 'light.wiz_e555b7', 'media_player.googletv6405', 'switch.shed_pump', 'lock.side_door'].every((e) => un.includes(e)), 'unassigned tab lists no-area / unmapped / room:"" entities', un);
  const hid = await tabRows('hidden');
  ok(['switch.socket_1', 'switch.emergency_heat', 'media_player.old_cast'].every((e) => hid.includes(e)), 'hidden tab lists exclude + entities:false', hid);
  await tabRows('placed');
  const row = await R(`const r=$$('.row').find(r=>r.dataset.eid==='climate.thermostat'); return { name:r.querySelector('b').textContent, eid:r.querySelector('small').textContent, st:r.querySelector('.st').textContent, room:r.querySelector('select').value, icon:!!r.querySelector('.di ha-icon,.di ha-state-icon'), groups:[...r.querySelectorAll('optgroup')].map(g=>g.label), first:r.querySelector('option').outerHTML }`);
  ok(row.name === 'thermostat' && row.eid === 'climate.thermostat' && row.st === 'heat' && row.room === 'family' && row.icon, 'row shows icon, name, entity_id, state, room', row);
  ok(JSON.stringify(row.groups) === JSON.stringify(['Upper Floor', 'Main Floor', 'Lower Level']) && row.first.includes('value=""') && row.first.includes('(Unassigned)'), 'room select grouped by floor with (Unassigned)=""', row);
  ok(await R(`return $$('.row').find(r=>r.dataset.eid==='vacuum.roomba').querySelector('select').value==='@floor'`), 'floor-only entity shows "(Main Floor · no room)"');

  // ---- search ----
  await tabRows('all');
  const q = async (s) => R(`const i=$('.q'); i.value=${JSON.stringify(s)}; i.dispatchEvent(new Event('input')); return $$('.row').map(r=>r.dataset.eid)`);
  ok(JSON.stringify((await q('roomba')).sort()) === '["vacuum.roomba"]', 'search by name');
  ok((await q('binary_sensor.garage')).join() === 'binary_sensor.garage_door', 'search by entity_id');
  const byRoom = await q('family room');
  ok(byRoom.includes('light.family') && byRoom.includes('climate.thermostat') && !byRoom.includes('light.kitchen'), 'search by room name', byRoom);
  await q('');

  // ---- live state in drawer ----
  await R(`window.__s = $$('.row').find(r=>r.dataset.eid==='fan.master_fan').querySelector('.st'); return 1`);
  await ev(`const s=c.hass.states; window.push({}); await hass.callService('homeassistant','toggle',{entity_id:'fan.master_fan'}); return 1`);
  ok(await until(`return window.__s.textContent==='off'`, 3000), 'drawer state column updates live');

  // ---- room select: assign / unassign (saved immediately: dashboard + entity registry) ----
  const setSel = (eid, v) => R(`const s=$$('.row').find(r=>r.dataset.eid==='${eid}').querySelector('select'); s.value='${v}'; s.dispatchEvent(new Event('change')); return 1`);
  const idle = () => until(`return !c._busy && !(c._saving&&c._saving.size)`, 8000);
  const lastSave = () => ev(`const l=window.wsLog.filter(m=>m.type==='lovelace/config/save'); return l.length ? l[l.length-1].config.views[0].cards[0] : null`);
  await R(`window.wsLog.length=0; c._setFloor('all', true, true); return 1`);
  await setSel('lock.side_door', 'kitchen');
  ok(await R(`return !c._edit && c._placed.some(p=>p.eid==='lock.side_door'&&p.room==='kitchen') && c._markers.some(m=>m.e.eid==='lock.side_door')`), 'select room -> mapped into room immediately, marker created, no edit mode needed');
  await idle();
  let card = await lastSave();
  ok(card && card.entities['lock.side_door']?.room === 'kitchen' && card.entities['light.deck_string']?.x === 30.5 && card.entities['media_player.old_cast'] === false, 'room change saved to dashboard at once (other overrides untouched)', card?.entities);
  let upd = await ev(`return window.wsLog.filter(m=>m.type==='config/entity_registry/update')`);
  ok(upd.length === 1 && upd[0].entity_id === 'lock.side_door' && upd[0].area_id === 'kitchen', 'entity_registry/update sent with mapped HA area', upd);
  ok((await ev(`return getEntities()['lock.side_door'].area_id`)) === 'kitchen', 'mock registry reflects new area');
  await sleep(800);
  ok(await R(`return c._floor==='main' && Math.hypot(c._rig.target.x-(c._rooms.kitchen.bb[0]+c._rooms.kitchen.bb[2])/2, c._rig.target.z-(c._rooms.kitchen.bb[1]+c._rooms.kitchen.bb[3])/2) < 0.01`), 'camera flies to the new room');
  ok(/side door → Kitchen/.test(await R(`return $('.toast').textContent`)) && /1 HA area updated/.test(await R(`return $('.toast').textContent`)), 'toast confirms', await R(`return $('.toast').textContent`));
  await setSel('light.living_ceiling', '');
  await idle();
  ok(await R(`return !c._markers.some(m=>m.e.eid==='light.living_ceiling') && c._all.find(r=>r.eid==='light.living_ceiling').placed===false`), '(Unassigned) removes it from the map');
  ok((await lastSave())?.entities['light.living_ceiling']?.room === '' && (await ev(`return getEntities()['light.living_ceiling'].area_id`)) === null, 'unassigned -> room:"" saved + area_id null');
  await R(`window.wsLog.length=0; return 1`);
  await setSel('light.wiz_09d07a', 'nook'); await setSel('light.wiz_f3a48b', 'dining');
  await idle();
  upd = await ev(`return window.wsLog.filter(m=>m.type==='config/entity_registry/update').map(m=>m.entity_id)`);
  card = await lastSave();
  ok(card.entities['light.wiz_09d07a']?.room === 'nook' && card.entities['light.wiz_f3a48b']?.room === 'dining' && !upd.length, 'rapid changes both saved (queued); rooms without an HA area / unregistered skip area sync', { e: card.entities, upd });
  ok(await R(`return c._cfg.entities['light.wiz_09d07a']?.room==='nook' && c._cfg.entities['light.wiz_f3a48b']?.room==='dining'`), 'state survives HA re-render (setConfig) after save');

  // ---- hide / unhide (saved immediately) ----
  await R(`$$('.row').find(r=>r.dataset.eid==='light.wiz_e555b7').querySelector('.eye').click(); return 1`); await idle();
  await R(`$$('.row').find(r=>r.dataset.eid==='switch.socket_1').querySelector('.eye').click(); return 1`); await idle();
  const c2 = await R(`return Object.fromEntries($$('.tabs button').map(b=>[b.dataset.tab, +b.querySelector('b').textContent]))`);
  ok(c2.hidden === 3 && (await R(`return c._cfg.exclude.includes('light.wiz_e555b7') && !c._cfg.exclude.includes('switch.socket_1') && c._all.find(r=>r.eid==='light.wiz_e555b7').hidden`)), 'eye hides/unhides; hidden stays listed under Hidden', c2);
  card = await lastSave();
  ok(card.exclude.includes('light.wiz_e555b7') && !card.exclude.includes('switch.socket_1') && card.exclude.includes('switch.emergency_heat'), 'hide/unhide saved to dashboard exclude', card.exclude);

  // ---- locate button ----
  await R(`c._setFloor('all', true, true); return 1`);
  await R(`$$('.row').find(r=>r.dataset.eid==='light.master').querySelector('.loc').click(); return 1`);
  const pulses = await R(`return (c._pulses||[]).length`);
  await sleep(900);
  const foc = await R(`const m=c._markers.find(m=>m.e.eid==='light.master'); return { floor:c._floor, d:Math.hypot(c._rig.target.x-m.p.x, c._rig.target.z-m.p.z), r:c._rig.radius, ping:m.el.classList.contains('ping') }`);
  ok(foc.floor === 'upper' && foc.d < 0.01 && Math.abs(foc.r - 26) < 0.01 && foc.ping && pulses === 2, 'locate switches floor, flies camera to marker, pulse ring', { ...foc, pulses });
  ok(await R(`return $$('.row').find(r=>r.dataset.eid==='media_player.viziocastdisplay4519').querySelector('.loc').disabled`), 'locate disabled for unplaced devices');
  await shot('verify-drawer.png');
  await sleep(2200);
  ok(await R(`return (c._pulses||[]).length===0`), 'pulse rings clean themselves up');

  // ---- unplaced chip opens drawer on Unassigned ----
  await R(`$('.drw .x').click(); return 1`);
  await R(`$$('.chip').find(ch=>/unplaced/.test(ch.textContent)).click(); return 1`);
  ok(await R(`return c._drwOpen && c._tab==='unassigned' && $$('.tabs button.on')[0].dataset.tab==='unassigned'`), 'unplaced chip opens drawer on Unassigned tab');

  // ---- mouse drag into another room (real pointer events, edit mode) ----
  await R(`$('.drw .x').click(); $('.edit').click(); c._setFloor('upper', true, true); window.wsLog.length=0; return 1`);
  ok(await R(`return c._edit && $('.ebar').classList.contains('show')`), 'edit mode on');
  await sleep(300);
  const pos = await R(`const T=c.T, m=c._markers.find(m=>m.e.eid==='light.master'), Rm=c._rooms.bedroom_s, F=c._floors.upper;
    const scr=(x,z)=>{ const v=new T.Vector3(x, F.y+3, z).project(c._cam); const b=c._canvas.getBoundingClientRect(); return [b.left+(v.x+1)/2*b.width, b.top+(1-v.y)/2*b.height]; };
    const r=m.el.querySelector('.d').getBoundingClientRect(); return { from:[r.left+r.width/2, r.top+r.height/2], to:scr((Rm.bb[0]+Rm.bb[2])/2+1.5,(Rm.bb[1]+Rm.bb[3])/2+2) }`);
  await mouse('mouseMoved', ...pos.from, 0); await mouse('mousePressed', ...pos.from);
  for (let i = 1; i <= 12; i++) { await mouse('mouseMoved', pos.from[0] + (pos.to[0] - pos.from[0]) * i / 12, pos.from[1] + (pos.to[1] - pos.from[1]) * i / 12); await sleep(16); }
  const tip = await R(`return $('.tip').textContent`);
  ok(/Bedroom/.test(tip) && tip.includes('→'), 'room under cursor shown while dragging', tip);
  await shot('verify-drag.png');
  await mouse('mouseReleased', ...pos.to, 0);
  await sleep(100);
  const dr = await R(`return { o:c._cfg.entities['light.master'], placed:c._placed.find(p=>p.eid==='light.master')?.room, rc:c._roomChanged.has('light.master') }`);
  ok(dr.o && dr.o.room === 'bedroom_s' && dr.o.x != null && dr.placed === 'bedroom_s' && dr.rc, 'drop into another room reassigns it', dr);
  ok(await R(`return $('.ebar .sv').textContent==='Save 1' && !window.wsLog.length`), 'drag stays pending until Save');

  // drag outside every room -> floor-only
  const pos2 = await R(`const T=c.T, m=c._markers.find(m=>m.e.eid==='fan.master_fan'), F=c._floors.upper;
    const v=new T.Vector3(c._rooms.primary.bb[2]+1.2, F.y+3, 0).project(c._cam), b=c._canvas.getBoundingClientRect();
    const r=m.el.querySelector('.d').getBoundingClientRect(); return { from:[r.left+r.width/2, r.top+r.height/2], to:[b.left+(v.x+1)/2*b.width, b.top+(1-v.y)/2*b.height] }`);
  await mouse('mouseMoved', ...pos2.from, 0); await mouse('mousePressed', ...pos2.from);
  for (let i = 1; i <= 10; i++) { await mouse('mouseMoved', pos2.from[0] + (pos2.to[0] - pos2.from[0]) * i / 10, pos2.from[1] + (pos2.to[1] - pos2.from[1]) * i / 10); await sleep(16); }
  ok(/no room/.test(await R(`return $('.tip').textContent`)), 'tip says "no room" outside rooms');
  await mouse('mouseReleased', ...pos2.to, 0);
  await sleep(100);
  const fo = await R(`return c._cfg.entities['fan.master_fan']`);
  ok(fo && fo.room === '' && fo.floor === 'upper' && fo.x > 45, 'dropped outside rooms -> floor-only marker on same floor', fo);
  ok(await R(`return c._markers.some(m=>m.e.eid==='fan.master_fan' && m.e.floor==='upper')`), 'floor-only marker still drawn');

  // ---- save ----
  await R(`window.wsLog.length=0; $('.ebar .sv').click(); return 1`);
  await until(`return !c._edit`, 8000);
  const log = await ev(`return window.wsLog`);
  card = log.find((m) => m.type === 'lovelace/config/save')?.config.views[0].cards[0];
  ok(card && card.entities['light.master'].room === 'bedroom_s' && card.entities['light.master'].x != null && card.entities['fan.master_fan'].floor === 'upper'
    && card.entities['lock.side_door'].room === 'kitchen' && card.entities['light.deck_string'].x === 30.5, 'Save writes x/z + room, keeps earlier overrides', card?.entities);
  upd = log.filter((m) => m.type === 'config/entity_registry/update');
  ok(!upd.length, 'no area update for rooms without an HA area / floor-only', upd);
  const toast = await R(`return $('.toast').textContent`);
  ok(/Saved 2 changes/.test(toast) && /1 area sync skipped/.test(toast), 'toast summarises save', toast);

  // ---- reset position + cancel reverts ----
  await R(`$('.edit').click(); return 1`);
  await R(`c._resetPos('light.deck_string'); return 1`);
  ok(await R(`return c._cfg.entities['light.deck_string'].x==null && c._changed.has('light.deck_string')`), '_resetPos drops saved x/z (pending)');
  await R(`$('.ebar .cn').click(); return 1`);
  ok(await R(`return !c._edit && c._cfg.entities['light.deck_string'].x===30.5`), 'Cancel reverts unsaved changes');
  // drawer change while edit mode is open survives a later Cancel
  await R(`$('.edit').click(); $('.lst').click(); $$('.tabs button').find(b=>b.dataset.tab==='all').click(); return 1`);
  await setSel('light.kitchen', 'garage'); await idle();
  await R(`$('.ebar .cn').click(); return 1`);
  ok(await R(`return c._placed.find(p=>p.eid==='light.kitchen').room==='garage'`), 'drawer change saved during edit mode is not undone by Cancel');


  // ---- non-admin is read-only ----
  await ev(`window.push({ user: { is_admin: false } }); return 1`);
  ok(await R(`return $$('.row select').every(s=>s.disabled) && $$('.row .eye').every(b=>b.disabled) && $('.edit').style.display==='none'`), 'non-admin: drawer read-only, no edit button');
  await R(`c._setFloor('main', true, true); return 1`);
  await sleep(400);
  await shot('verify-final.png');

  const errs = logs.filter((l) => !/three\.module\.min\.js|404|Failed to load resource|house3d area sync/.test(l)); // area-sync warning is expected (2 deliberate skips)
  ok(errs.length === 0, 'no page exceptions/console errors', errs);
} catch (e) { fail.push(String(e.stack || e)); console.error(e); }
finally {
  try { ws?.close(); } catch (_) {}
  for (const p of procs) { try { process.platform === 'win32' ? spawn('taskkill', ['/pid', String(p.pid), '/T', '/F'], { stdio: 'ignore' }) : p.kill(); } catch (_) {} }
  console.log(fail.length ? `\n${fail.length} FAILED` : '\nALL PASSED');
  setTimeout(() => process.exit(fail.length ? 1 : 0), 500);
}
