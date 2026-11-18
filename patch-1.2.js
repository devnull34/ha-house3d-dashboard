// house3d-card 1.1.0 -> 1.2.0: basement stair stacked directly under the main stair (same footprint, same direction),
// lower-level walls/rooms re-fitted around it, garage rear window removed.
// Main stair footprint in lower-plan pixels: x 678-754, y 502-689.
function applyPatch(src) {
  const errs = [];
  const rep = (a, b) => { const n = src.split(a).length - 1; if (n !== 1) errs.push('count ' + n + ': ' + a.slice(0, 60)); else src = src.replace(a, () => b); };
  rep(`const CARD_VERSION = '1.1.0';`, `const CARD_VERSION = '1.2.0';`);
  rep(`p: [[617, 388], [700, 388], [700, 520], [765, 520], [765, 640], [617, 640]], t: 'room' },`, `p: [[617, 388], [700, 388], [700, 502], [678, 502], [678, 640], [617, 640]], t: 'room' },`);
  rep(`{ id: 'lower_hall', name: 'Hall', dims: \`4'2" × 5'1"\`, r: [617, 640, 700, 745], t: 'hall' },`, `{ id: 'lower_hall', name: 'Hall', dims: \`4'2" × 5'1"\`, p: [[617, 640], [678, 640], [678, 689], [754, 689], [754, 745], [617, 745]], t: 'hall' },`);
  rep(`p: [[700, 258], [1000, 258], [1000, 745], [765, 745], [765, 520], [700, 520]], t: 'living' },`, `p: [[700, 258], [1000, 258], [1000, 745], [754, 745], [754, 502], [700, 502]], t: 'living' },`);
  rep(`        [185, 258, 1000, 258, [[340, 400, 'w'], [708, 760, 'w'], [820, 905, 'd']]],`, `        [185, 258, 1000, 258, [[708, 760, 'w'], [820, 905, 'd']]],`);
  rep(`        [700, 258, 700, 520, [[318, 365, 'd'], [400, 450, 'd']]],`, `        [700, 258, 700, 502, [[318, 365, 'd'], [400, 450, 'd']]],`);
  rep(`        [700, 520, 765, 520],
        [765, 520, 765, 628],`, `        [678, 502, 754, 502],        // stair enclosure (under the main stair)
        [678, 502, 678, 640],
        [754, 502, 754, 689],`);
  rep(`        [617, 640, 700, 640, [[625, 690, 'd']]],`, `        [617, 640, 678, 640, [[625, 670, 'd']]],`);
  rep(`      stairs: [{ r: [700, 628, 765, 745], up: 'n' }],`, `      stairs: [{ r: [678, 502, 754, 689], up: 'n' }], // stacked directly under the main stair`);
  return { src, errs };
}

if (typeof module !== 'undefined' && require.main === module) {
  const fs = require('fs'), f = process.argv[2];
  const { src, errs } = applyPatch(fs.readFileSync(f, 'utf8'));
  if (errs.length) { console.error(errs); process.exit(1); }
  fs.writeFileSync(f, src); console.log('patched', src.length);
}
