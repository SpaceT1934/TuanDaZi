import { readFileSync } from 'node:fs';

globalThis.window = {};
eval(readFileSync(new URL('../mock-api.js', import.meta.url), 'utf8'));

const selectedIds = ['hotpot', 'japanese', 'sichuan'];
const optimized = await window.MockApi.planRoute({ selectedIds, respectOrder: false });
const manual = await window.MockApi.planRoute({ selectedIds, respectOrder: true });

const optimizedIds = optimized.selected.map((poi) => poi.id);
const manualIds = manual.selected.map((poi) => poi.id);

if (manualIds.join(',') !== selectedIds.join(',')) {
  throw new Error(`Manual order changed unexpectedly: ${manualIds.join('>')}`);
}

if (optimizedIds.join(',') === selectedIds.join(',')) {
  throw new Error('Optimized route should not blindly follow click order');
}

if (optimized.legs.length !== selectedIds.length) {
  throw new Error('Optimized route should include one leg per selected POI');
}

console.log(JSON.stringify({
  optimized: optimizedIds,
  manual: manualIds,
  totalDistanceLabel: optimized.totalDistanceLabel,
}, null, 2));
