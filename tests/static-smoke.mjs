import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const app = readFileSync(resolve(root, 'src/app.js'), 'utf8');

const requiredHtml = [
  'class="screen screen-18',
  'class="screen screen-19',
  'id="home-history-list"',
  'id="home-history-see-all"',
  'id="end-trip-dialog"',
  'id="end-trip-stats"',
  'id="confirm-end-trip"',
  'id="notebook-card"',
  'id="media-viewer-content"',
];

const requiredFunctions = [
  'function renderEndTripDialog',
  'function renderNotebook',
  'function renderHistory',
  'function finishTrip',
  'function generateNotebookFromTrip',
  'function saveNotebookImage',
  'function shareNotebook',
  'function createNotebookShareImage',
  'function stepMedia',
];

for (const needle of requiredHtml) {
  if (!html.includes(needle)) {
    throw new Error(`Missing HTML marker: ${needle}`);
  }
}

for (const needle of requiredFunctions) {
  if (!app.includes(needle)) {
    throw new Error(`Missing app function: ${needle}`);
  }
}

if (!app.includes('manualRouteOrder')) {
  throw new Error('Route ordering should distinguish optimized order from manual edits');
}

if (html.includes('history-panel--notebook') || html.includes('id="notebook-history-list"')) {
  throw new Error('Notebook page should not show trip history');
}

if (app.includes("state.screen = '16'")) {
  throw new Error('End trip should open a dialog instead of navigating to a separate screen');
}

if (!app.includes('homeHistoryExpanded') || !app.includes('renderHistoryCards({ limit:')) {
  throw new Error('Home history should default to a limited list with see all support');
}

if (!app.includes('endTripChoice') || !app.includes('function confirmEndTrip')) {
  throw new Error('End trip dialog should support selection before confirmation');
}

if (!app.includes('notebook-card--sheet') || !app.includes('notebook-layout')) {
  throw new Error('Notebook should use the compact image-like scrapbook layout');
}
