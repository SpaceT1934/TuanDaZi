import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire('/Users/lixinwei/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json');
const { chromium } = require('playwright');

const browser = await chromium.launch({
  headless: true,
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const errors = [];

page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('pageerror', (error) => errors.push(error.message));

await page.goto(`file://${resolve(import.meta.dirname, '..', 'index.html')}`);
await page.waitForTimeout(1800);

await page.click('#open-room-modal');
await page.click('#create-room');
await page.click('#save-room-settings');
await page.click('#start-preferences');
await page.click('#submit-prefs');
await page.click('#build-route');
await page.waitForTimeout(1800);
await page.locator('.poi-card').nth(0).click();
await page.locator('.poi-card').nth(1).click();
await page.locator('.poi-card').nth(2).click();
await page.click('#next-step');
await page.waitForTimeout(800);

const routeScreen = await page.locator('.screen:not(.hidden)').first().getAttribute('data-screen');
const routeCards = await page.locator('#route-list .route-card').count();

await page.click('#confirm-route');
await page.waitForTimeout(800);
const liveScreen = await page.locator('.screen:not(.hidden)').first().getAttribute('data-screen');
const liveStops = await page.locator('#itinerary-list .trip-stop').count();

await page.click('#end-trip');
await page.waitForTimeout(300);
const endScreen = await page.locator('.screen:not(.hidden)').first().getAttribute('data-screen');
const endDialogVisible = await page.locator('#end-trip-dialog:not(.hidden)').count();

await page.click('#generate-notebook');
await page.waitForTimeout(200);
const stillLiveAfterChoice = await page.locator('.screen:not(.hidden)').first().getAttribute('data-screen');
const chosenNotebook = await page.locator('#generate-notebook.is-selected').count();
await page.click('#confirm-end-trip');
await page.waitForTimeout(500);
const notebookScreen = await page.locator('.screen:not(.hidden)').first().getAttribute('data-screen');
const notebookMedia = await page.locator('#notebook-media-grid .notebook-media').count();
const notebookHistory = await page.locator('.screen-18 .history-card, .screen-18 .history-panel').count();
const notebookSheet = await page.locator('.notebook-card--sheet').count();

await page.locator('#notebook-media-grid .notebook-media').first().click();
await page.waitForTimeout(300);
const mediaScreen = await page.locator('.screen:not(.hidden)').first().getAttribute('data-screen');

await page.click('#close-media');
await page.waitForTimeout(300);
await page.click('#notebook-home');
await page.waitForTimeout(300);
const homeHistory = await page.locator('#home-history-list .history-card').count();
const seeAllVisible = await page.locator('#home-history-see-all:not(.hidden)').count();

await browser.close();

const result = { routeScreen, routeCards, liveScreen, liveStops, endScreen, endDialogVisible, stillLiveAfterChoice, chosenNotebook, notebookScreen, notebookMedia, notebookHistory, notebookSheet, mediaScreen, homeHistory, seeAllVisible, errors };
console.log(JSON.stringify(result, null, 2));

if (errors.length) throw new Error(`Browser console errors: ${errors.join('; ')}`);
if (routeScreen !== '12' || routeCards < 3) throw new Error('Route adjustment flow did not render selected route cards');
if (liveScreen !== '13' || liveStops < 3) throw new Error('Live itinerary did not render selected stops');
if (endScreen !== '13' || endDialogVisible !== 1) throw new Error('End trip should open a dialog over the live itinerary');
if (stillLiveAfterChoice !== '13' || chosenNotebook !== 1) throw new Error('Choosing notebook should only select the option before confirmation');
if (notebookScreen !== '18' || notebookMedia < 1) throw new Error('Notebook screen did not render media');
if (notebookHistory !== 0) throw new Error('Notebook screen should not show trip history');
if (notebookSheet !== 1) throw new Error('Notebook should render as a compact scrapbook image sheet');
if (mediaScreen !== '19') throw new Error('Media viewer did not open');
if (homeHistory !== 1) throw new Error('Home history list did not receive the completed trip');
