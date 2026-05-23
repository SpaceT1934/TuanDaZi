(() => {
const { getAllPois, getPoiById, getPoiRecommendations, getUserContext, planRoute, searchPois } = window.MockApi;

const preferenceSets = {
  foods: ['火锅', '粤菜', '川湘菜', '烧烤', '日料'],
  avoid: ['不吃辣', '忌香菜', '不吃葱蒜', '海鲜过敏'],
  fun: ['剧本杀', '密室逃脱', '电竞', '美甲美睫', '户外攀岩'],
};

const members = [
  { name: 'Xinwei', avatar: 'X', tone: 'yellow', photo: 'food', summary: '火锅 / 不太辣 / 100以内', status: '已提交', tags: ['火锅', '西单', '少走路'] },
  { name: 'Yuki', avatar: 'Y', tone: 'green', photo: 'dessert', summary: '粤菜 / 甜品 / 想拍照', status: '已提交', tags: ['甜品', '拍照', '清淡'] },
  { name: 'Leo', avatar: 'L', tone: 'blue', photo: 'play', summary: '咖啡 / 少排队 / 近地铁', status: '待确认', tags: ['咖啡', '电竞', '近地铁'] },
];

const state = {
  screen: '04',
  origin: null,
  filters: ['综合最优', '美食', '玩乐', '近地铁'],
  activeFilter: '综合最优',
  recommendations: [],
  previewIds: [],
  previewSelectedIds: [],
  searchResults: [],
  searchQuery: '',
  selectedIds: [],
  routePlan: null,
  loadingTimer: null,
  selectedPrefs: {
    categories: ['火锅', '咖啡', '甜品', '剧本杀', '烧烤'],
    fun: ['剧本杀', '密室逃脱', '电竞', '美甲美睫', '户外攀岩'],
    avoid: ['香菜', '葱蒜'],
    startHour: 18,
    foods: ['火锅', '粤菜', '川湘菜'],
    foodsInput: '',
    avoidInput: '',
    funInput: '',
    locationInput: '北京市西单大悦城',
  },
};

const el = {
  screen04: document.querySelector('.screen-04'),
  screen05: document.querySelector('.screen-05'),
  screen06: document.querySelector('.screen-06'),
  screen07: document.querySelector('.screen-07'),
  screen08: document.querySelector('.screen-08'),
  screen09: document.querySelector('.screen-09'),
  screen10: document.querySelector('.screen-10'),
  screen11: document.querySelector('.screen-11'),
  screen12: document.querySelector('.screen-12'),
  back04: document.getElementById('back04'),
  back05: document.getElementById('back05'),
  back06: document.getElementById('back06'),
  back07: document.getElementById('back07'),
  back08: document.getElementById('back08'),
  back09: document.getElementById('back09'),
  back10: document.getElementById('back10'),
  back11: document.getElementById('back11'),
  back12: document.getElementById('back12'),
  openRoomModal: document.getElementById('open-room-modal'),
  quickJoinRoom: document.getElementById('quick-join-room'),
  createRoom: document.getElementById('create-room'),
  joinRoom: document.getElementById('join-room'),
  roomCodeInput: document.getElementById('room-code-input'),
  sendInvite: document.getElementById('send-invite'),
  addInviteFriend: document.getElementById('add-invite-friend'),
  saveRoomSettings: document.getElementById('save-room-settings'),
  copyRoomLink: document.getElementById('copy-room-link'),
  startPreferences: document.getElementById('start-preferences'),
  tripTypeGrid: document.getElementById('trip-type-grid'),
  tripTypeCustom: document.getElementById('trip-type-custom'),
  tripTimeInput: document.getElementById('trip-time-input'),
  routePrefInput: document.getElementById('route-pref-input'),
  optionSheet: document.getElementById('option-sheet'),
  optionSheetTitle: document.getElementById('option-sheet-title'),
  optionList: document.getElementById('option-list'),
  locationInput: document.getElementById('location-input'),
  submitPrefs: document.getElementById('submit-prefs'),
  buildRoute: document.getElementById('build-route'),
  skipLoading: document.getElementById('skip-loading'),
  foodChips: document.getElementById('food-chips'),
  avoidChips: document.getElementById('avoid-chips'),
  funChips: document.getElementById('fun-chips'),
  foodInput: document.getElementById('food-input'),
  avoidInput: document.getElementById('avoid-input'),
  funInput: document.getElementById('fun-input'),
  memberList: document.getElementById('member-list'),
  loadingDots: document.getElementById('loading-dots'),
  nextStep: document.getElementById('next-step'),
  addMore: document.getElementById('add-more'),
  confirmRoute: document.getElementById('confirm-route'),
  recommendationList: document.getElementById('recommendation-list'),
  routeList: document.getElementById('route-list'),
  filterRow: document.getElementById('filter-row'),
  toast: document.getElementById('toast'),
  map11: document.getElementById('map11'),
  map12: document.getElementById('map12'),
  routeDistance: document.getElementById('route-distance'),
  poiSearch: document.getElementById('poi-search'),
  searchResults: document.getElementById('search-results'),
};

const map11 = createMapAdapter(el.map11, handleMapPoiClick);
const map12 = createMapAdapter(el.map12, handleMapPoiClick);

let loadingAnimationFrame = 0;
let eventsBound = false;

async function bootstrap() {
  updateViewportScale();
  if (typeof window !== 'undefined') window.addEventListener('resize', updateViewportScale);
  bindEvents();
  syncPreferenceModel();
  render();

  try {
    state.origin = await resolveUserLocation();
    await refreshRecommendations();
    state.routePlan = await planRoute({ origin: await ensureOrigin(), selectedIds: state.selectedIds, prefs: state.selectedPrefs, respectOrder: state.screen === '12' });
  } catch (error) {
    console.error('初始化位置和推荐数据失败，已使用 mock 数据兜底', error);
    state.origin = await getUserContext();
    await refreshRecommendations();
  }
  render();
}

function bindEvents() {
  if (eventsBound) return;
  eventsBound = true;

  el.openRoomModal.addEventListener('click', () => {
    state.screen = '05';
    render();
  });

  el.quickJoinRoom.addEventListener('click', () => {
    state.screen = '05';
    render();
  });

  el.createRoom.addEventListener('click', () => {
    state.screen = '06';
    render();
  });

  el.joinRoom.addEventListener('click', () => {
    const code = el.roomCodeInput.value.trim();
    if (!/^\d{4}$/.test(code)) {
      showToast('请输入 4 位房间码');
      el.roomCodeInput.focus();
      return;
    }
    state.screen = '08';
    render();
    showToast(`已加入房间 ${code}`);
  });

  el.saveRoomSettings.addEventListener('click', () => {
    state.screen = '07';
    render();
  });

  el.copyRoomLink.addEventListener('click', () => {
    copyInviteLink();
  });

  el.sendInvite.addEventListener('click', () => {
    generateInviteImage();
  });

  el.addInviteFriend.addEventListener('click', () => {
    generateInviteImage();
  });

  el.startPreferences.addEventListener('click', () => {
    state.screen = '08';
    render();
  });

  el.tripTypeGrid.querySelectorAll('[data-trip-type]').forEach((button) => {
    button.addEventListener('click', () => {
      button.classList.toggle('is-selected');
      if (!el.tripTypeGrid.querySelectorAll('[data-trip-type].is-selected').length) {
        button.classList.add('is-selected');
      }
    });
  });

  el.tripTypeCustom.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const value = el.tripTypeCustom.value.trim();
    if (!value) return;
    const exists = [...el.tripTypeGrid.querySelectorAll('[data-trip-type]')].some((button) => button.dataset.tripType === value);
    if (!exists) {
      const button = document.createElement('button');
      button.className = 'trip-type-card trip-type-card--custom is-selected';
      button.dataset.tripType = value;
      button.type = 'button';
      button.innerHTML = `<span>＋</span><strong>${value}</strong>`;
      button.addEventListener('click', () => button.classList.toggle('is-selected'));
      el.tripTypeGrid.appendChild(button);
    }
    el.tripTypeCustom.value = '';
  });

  document.querySelectorAll('.switch').forEach((button) => {
    button.addEventListener('click', () => button.classList.toggle('is-on'));
  });

  document.querySelectorAll('[data-location]').forEach((button) => {
    button.addEventListener('click', () => {
      el.locationInput.value = button.dataset.location;
      state.selectedPrefs.locationInput = button.dataset.location;
      showToast('已选择 mock 位置');
    });
  });

  document.querySelectorAll('[data-open-sheet]').forEach((row) => {
    row.addEventListener('click', () => openOptionSheet(row.dataset.openSheet));
  });

  el.optionSheet.addEventListener('click', (event) => {
    if (event.target === el.optionSheet) closeOptionSheet();
  });

  el.submitPrefs.addEventListener('click', () => {
    syncPreferenceModel();
    state.screen = '09';
    render();
  });

  el.buildRoute.addEventListener('click', () => {
    syncPreferenceModel();
    state.screen = '10';
    render();
    startLoadingSequence();
  });

  el.skipLoading.addEventListener('click', () => {
    finishLoadingSequence();
  });

  el.back04.addEventListener('click', () => showToast('已经是第一屏了'));
  el.back05.addEventListener('click', () => {
    state.screen = '04';
    render();
  });
  el.back06.addEventListener('click', () => {
    state.screen = '05';
    render();
  });
  el.back07.addEventListener('click', () => {
    state.screen = '06';
    render();
  });
  el.back08.addEventListener('click', () => {
    state.screen = '07';
    render();
  });
  el.back09.addEventListener('click', () => {
    state.screen = '08';
    render();
  });
  el.back10.addEventListener('click', () => {
    clearLoadingSequence();
    state.screen = '09';
    render();
  });

  el.nextStep.addEventListener('click', async () => {
    if (!state.previewSelectedIds.length) {
      showToast('请先选择想加入行程的店铺');
      return;
    }
    state.selectedIds = state.previewSelectedIds.slice();
    state.routePlan = await planRoute({ origin: await ensureOrigin(), selectedIds: state.selectedIds, prefs: state.selectedPrefs, respectOrder: false });
    state.screen = '12';
    render();
  });

  el.back12.addEventListener('click', () => {
    state.screen = '11';
    render();
  });

  el.back11.addEventListener('click', () => {
    state.screen = '10';
    render();
  });

  el.addMore.addEventListener('click', () => {
    state.screen = '11';
    render();
    showToast('可继续挑选更多店铺');
  });

  el.confirmRoute.addEventListener('click', () => {
    showToast('路线已确认，mock 接口已接通');
  });

  bindPreferenceInputs();
  bindSearchInput();
}

async function refreshRecommendations() {
  const origin = await ensureOrigin();
  state.recommendations = await getPoiRecommendations({ center: origin, prefs: state.selectedPrefs });
  state.previewIds = state.recommendations.slice(0, 3).map((poi) => poi.id);
}

async function applyPoiSelection(poiId, { respectOrder = state.screen === '12', toast = true } = {}) {
  const poi = getPoiById(poiId);
  const wasSelected = state.selectedIds.includes(poiId);
  toggleSelection(poiId);
  const origin = await ensureOrigin();
  state.routePlan = await planRoute({
    origin,
    selectedIds: state.selectedIds,
    prefs: state.selectedPrefs,
    respectOrder,
  });
  renderRecommendations();
  renderRoute();
  drawMaps();
  if (toast && poi) {
    showToast(wasSelected ? `已移除 ${poi.name}` : `已添加 ${poi.name}`);
  }
}

async function handleMapPoiClick(poi) {
  if (state.screen === '11') {
    await togglePreviewPoiSelection(poi.id);
    return;
  }
  await applyPoiSelection(poi.id, { respectOrder: true });
}

async function togglePreviewPoiSelection(poiId) {
  const set = new Set(state.previewSelectedIds);
  if (set.has(poiId)) set.delete(poiId);
  else set.add(poiId);
  state.previewSelectedIds = [...set];
  const origin = await ensureOrigin();
  state.routePlan = state.previewSelectedIds.length
    ? await planRoute({ origin, selectedIds: state.previewSelectedIds, prefs: state.selectedPrefs, respectOrder: false })
    : { selected: [], totalDistanceLabel: '待选' };
  renderRecommendations();
  drawMaps();
}

function render() {
  state.routePlan = state.routePlan || { selected: [] };
  el.screen04.classList.toggle('hidden', state.screen !== '04');
  el.screen05.classList.toggle('hidden', state.screen !== '05');
  el.screen06.classList.toggle('hidden', state.screen !== '06');
  el.screen07.classList.toggle('hidden', state.screen !== '07');
  el.screen08.classList.toggle('hidden', state.screen !== '08');
  el.screen09.classList.toggle('hidden', state.screen !== '09');
  el.screen10.classList.toggle('hidden', state.screen !== '10');
  el.screen11.classList.toggle('hidden', state.screen !== '11');
  el.screen12.classList.toggle('hidden', state.screen !== '12');

  renderPreferences();
  renderMembers();
  renderLoadingDots();
  renderFilters();
  renderSearch();
  renderRecommendations();
  renderRoute();
  drawMaps();
}

function renderPreferences() {
  el.foodChips.innerHTML = renderChipButtons(preferenceSets.foods, state.selectedPrefs.foods, 'foods');
  el.avoidChips.innerHTML = renderChipButtons(preferenceSets.avoid, state.selectedPrefs.avoid, 'avoid');
  el.funChips.innerHTML = renderChipButtons(preferenceSets.fun, state.selectedPrefs.fun, 'fun');

  el.locationInput.value = state.selectedPrefs.locationInput;
  el.foodInput.value = state.selectedPrefs.foodsInput;
  el.avoidInput.value = state.selectedPrefs.avoidInput;
  el.funInput.value = state.selectedPrefs.funInput;

  [el.foodChips, el.avoidChips, el.funChips].forEach((container) => {
    container.querySelectorAll('[data-chip-group]').forEach((button) => {
      button.addEventListener('click', () => {
        const group = button.dataset.chipGroup;
        const value = button.dataset.chipValue;
        const list = state.selectedPrefs[group];
        const next = new Set(list);
        if (next.has(value)) next.delete(value);
        else next.add(value);
        state.selectedPrefs[group] = [...next];
        renderPreferences();
      });
    });
  });
}

function renderChipButtons(values, selectedValues, group) {
  return values
    .map((value) => `<button class="chip-option ${selectedValues.includes(value) ? 'is-selected' : ''}" data-chip-group="${group}" data-chip-value="${value}">${value}</button>`)
    .join('');
}

function syncPreferenceModel() {
  const tokenize = (text) =>
    text
      .split(/[\s,，、/|;；]+/)
      .map((item) => item.trim())
      .filter(Boolean);

  const foods = [...new Set([...state.selectedPrefs.foods, ...tokenize(state.selectedPrefs.foodsInput)])];
  const avoid = [...new Set([...state.selectedPrefs.avoid, ...tokenize(state.selectedPrefs.avoidInput)])];
  const fun = [...new Set([...preferenceSets.fun, ...tokenize(state.selectedPrefs.funInput)])];

  state.selectedPrefs.categories = foods;
  state.selectedPrefs.avoid = avoid;
  state.selectedPrefs.fun = fun;
}

function bindPreferenceInputs() {
  const update = (field, value) => {
    state.selectedPrefs[field] = value;
  };
  el.locationInput.addEventListener('input', () => update('locationInput', el.locationInput.value));
  el.foodInput.addEventListener('input', () => update('foodsInput', el.foodInput.value));
  el.avoidInput.addEventListener('input', () => update('avoidInput', el.avoidInput.value));
  el.funInput.addEventListener('input', () => update('funInput', el.funInput.value));
  bindManualChipInput(el.foodInput, 'foods', 'foodsInput');
  bindManualChipInput(el.avoidInput, 'avoid', 'avoidInput');
  bindManualChipInput(el.funInput, 'fun', 'funInput');
}

function bindManualChipInput(input, group, inputField) {
  input.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const value = input.value.trim();
    if (!value) return;
    if (!preferenceSets[group].includes(value)) preferenceSets[group].push(value);
    if (!state.selectedPrefs[group].includes(value)) state.selectedPrefs[group].push(value);
    state.selectedPrefs[inputField] = '';
    input.value = '';
    renderPreferences();
  });
}

function renderMembers() {
  el.memberList.innerHTML = members
    .map(
      (member, index) => `
        <article class="member-card member-card--status member-card--${member.photo} ${index === 0 ? 'is-owner' : ''}">
          <div class="member-photo">
            <span class="avatar ${member.tone}">${member.avatar}</span>
          </div>
          <div>
            <div class="member-name">${member.name}${index === 0 ? '<em>房主</em>' : ''}</div>
            <div class="member-meta">${member.summary}</div>
            <div class="member-pref-tags">${member.tags.map((tag) => `<span>${tag}</span>`).join('')}</div>
          </div>
          <div class="member-tag ${member.status === '已提交' ? 'member-tag--done' : 'member-tag--wait'}">${member.status}</div>
        </article>
      `,
    )
    .join('');
}

function renderLoadingDots() {
  el.loadingDots.innerHTML = ['','', ''].map(() => '<span></span>').join('');
}

function updateViewportScale() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.innerWidth <= 430) {
    document.documentElement.style.setProperty('--app-scale', '1');
    return;
  }
  const scale = Math.min((window.innerWidth - 32) / 390, (window.innerHeight - 32) / 844, 1);
  document.documentElement.style.setProperty('--app-scale', String(Math.max(0.72, scale)));
}

function startLoadingSequence() {
  clearLoadingSequence();
  state.loadingTimer = setTimeout(() => {
    finishLoadingSequence();
  }, 1500);
}

async function finishLoadingSequence() {
  clearLoadingSequence();
  try {
    if (!state.recommendations.length) {
      await refreshRecommendations();
    }
    state.previewIds = (state.recommendations.length ? state.recommendations : getAllPois()).slice(0, 3).map((poi) => poi.id);
    state.previewSelectedIds = [];
    state.routePlan = { selected: [], totalDistanceLabel: '待选' };
  } catch (error) {
    console.error('生成 AI 路线失败，已使用兜底推荐', error);
    state.previewIds = getAllPois().slice(0, 3).map((poi) => poi.id);
    state.previewSelectedIds = [];
    state.routePlan = { selected: [], totalDistanceLabel: '待选' };
  }
  state.screen = '11';
  render();
}

function clearLoadingSequence() {
  if (state.loadingTimer) clearTimeout(state.loadingTimer);
  state.loadingTimer = null;
}

function renderFilters() {
  el.filterRow.innerHTML = state.filters
    .map((filter) => `<button class="chip ${filter === state.activeFilter ? 'is-active' : ''}" data-filter="${filter}">${filter}</button>`)
    .join('');

  el.filterRow.querySelectorAll('[data-filter]').forEach((button) => {
      button.addEventListener('click', async () => {
        state.activeFilter = button.dataset.filter;
        state.selectedPrefs.mode = state.activeFilter;
        state.recommendations = await getPoiRecommendations({ center: await ensureOrigin(), prefs: state.selectedPrefs });
        state.previewIds = state.recommendations.slice(0, 3).map((poi) => poi.id);
        renderFilters();
        renderRecommendations();
        drawMaps();
    });
  });
}

async function renderSearch() {
  if (!el.searchResults) return;
  if (state.screen !== '12') {
    el.searchResults.classList.add('hidden');
    el.searchResults.innerHTML = '';
    return;
  }
  const query = state.searchQuery.trim();
  if (!query) {
    el.searchResults.classList.add('hidden');
    el.searchResults.innerHTML = '';
  } else {
    state.searchResults = await searchPois(query, await ensureOrigin());
    el.searchResults.classList.remove('hidden');
    el.searchResults.innerHTML = state.searchResults.map((poi) => renderSearchItem(poi)).join('');
  }
  el.searchResults.querySelectorAll('[data-search-poi]').forEach((item) => {
    item.addEventListener('click', async () => {
      await applyPoiSelection(item.dataset.searchPoi, { respectOrder: true, toast: true });
      state.screen = '12';
      render();
    });
  });
}

function renderSearchItem(poi) {
  const selected = state.selectedIds.includes(poi.id);
  return `
    <article class="search-result ${selected ? 'is-selected' : ''}" data-search-poi="${poi.id}">
      <div>
        <div class="search-result-title">${poi.name}</div>
        <div class="search-result-meta">${poi.category} · ${poi.rating.toFixed(1)}分 · ¥${poi.price}/人 · ${poi.distanceLabel || formatDistanceApprox(poi)}</div>
      </div>
      <div class="search-result-indicator ${selected ? 'is-on' : ''}">${selected ? '✓' : ''}</div>
    </article>
  `;
}

function renderRecommendations() {
  const items = state.screen === '11'
    ? state.recommendations.slice(0, 3)
    : state.recommendations.length
      ? state.recommendations
      : getAllPois().slice(0, 5);
  el.recommendationList.innerHTML = items
    .map((poi, index) => {
      const checked = state.screen === '11' ? state.previewSelectedIds.includes(poi.id) : state.selectedIds.includes(poi.id);
      return `
        <article class="poi-card ${checked ? 'is-selected' : ''}" data-poi-id="${poi.id}">
          <div class="poi-icon ${poi.mood}">${poi.subCategory}</div>
          <div>
            <h3 class="poi-title">${poi.name}</h3>
            <div class="poi-meta">${poi.rating.toFixed(1)}分 · ¥${poi.price}/人 · 距离${poi.distanceLabel || formatDistanceApprox(poi)}</div>
            <div class="poi-tags">${poi.tags.join(' · ')}</div>
          </div>
          <div class="select-circle ${checked ? 'is-on' : ''}">${checked ? '✓' : ''}</div>
        </article>
      `;
    })
    .join('');

  el.recommendationList.querySelectorAll('[data-poi-id]').forEach((card) => {
    card.addEventListener('click', async () => {
      if (state.screen === '11') {
        await togglePreviewPoiSelection(card.dataset.poiId);
        return;
      }
      await applyPoiSelection(card.dataset.poiId, { respectOrder: false, toast: false });
    });
  });

  el.routeDistance.textContent = state.screen === '11' && !state.previewSelectedIds.length ? '待选' : (state.routePlan?.totalDistanceLabel || '3.6km');
}

function renderRoute() {
  const selected = state.routePlan?.selected?.length ? state.routePlan.selected : state.selectedIds.map((id) => getPoiById(id)).filter(Boolean);
  el.routeList.innerHTML = selected
    .map((poi, index) => {
      const num = index + 1;
      return `
        <article class="route-card" data-route-id="${poi.id}" draggable="true">
          <div class="poi-icon ${poi.mood}">图片</div>
          <div>
            <h3 class="poi-title">${poi.name}</h3>
            <div class="poi-meta">${poi.eta}:00 · ${poi.rating.toFixed(1)}分 · ¥${poi.price}/人</div>
            <div class="poi-tags">${poi.tags.join(' · ')}</div>
          </div>
          <div class="route-actions">
            <div class="drag-handle">⋮⋮</div>
            <button class="route-move" data-move-up="${poi.id}">↑</button>
            <button class="route-move" data-move-down="${poi.id}">↓</button>
            <button class="route-delete" data-delete-route="${poi.id}" aria-label="删除 ${poi.name}">×</button>
          </div>
        </article>
      `;
    })
    .join('');

  bindRouteDnD();
  bindRouteMoves();
  bindRouteDeletes();
}

function bindRouteDnD() {
  const cards = [...el.routeList.querySelectorAll('[data-route-id]')];
  cards.forEach((card) => {
    card.addEventListener('dragstart', (event) => {
      event.dataTransfer.setData('text/plain', card.dataset.routeId);
    });
    card.addEventListener('dragover', (event) => event.preventDefault());
    card.addEventListener('drop', async (event) => {
      event.preventDefault();
      const fromId = event.dataTransfer.getData('text/plain');
      const toId = card.dataset.routeId;
      if (!fromId || fromId === toId) return;
      const fromIndex = state.selectedIds.indexOf(fromId);
      const toIndex = state.selectedIds.indexOf(toId);
      if (fromIndex < 0 || toIndex < 0) return;
      const next = state.selectedIds.slice();
      next.splice(toIndex, 0, next.splice(fromIndex, 1)[0]);
      state.selectedIds = next;
      state.routePlan = await planRoute({ origin: await ensureOrigin(), selectedIds: state.selectedIds, prefs: state.selectedPrefs, respectOrder: true });
      renderRoute();
      drawMaps();
      showToast('顺序已调整');
    });
  });
}

function bindRouteMoves() {
  el.routeList.querySelectorAll('[data-move-up],[data-move-down]').forEach((button) => {
    button.addEventListener('click', async (event) => {
      event.stopPropagation();
      const id = button.dataset.moveUp || button.dataset.moveDown;
      const currentIndex = state.selectedIds.indexOf(id);
      if (currentIndex < 0) return;
      const next = state.selectedIds.slice();
      if (button.dataset.moveUp && currentIndex > 0) {
        [next[currentIndex - 1], next[currentIndex]] = [next[currentIndex], next[currentIndex - 1]];
      } else if (button.dataset.moveDown && currentIndex < next.length - 1) {
        [next[currentIndex + 1], next[currentIndex]] = [next[currentIndex], next[currentIndex + 1]];
      } else {
        return;
      }
      state.selectedIds = next;
      state.routePlan = await planRoute({ origin: await ensureOrigin(), selectedIds: state.selectedIds, prefs: state.selectedPrefs, respectOrder: true });
      renderRoute();
      drawMaps();
    });
  });
}

function bindRouteDeletes() {
  el.routeList.querySelectorAll('[data-delete-route]').forEach((button) => {
    button.addEventListener('click', async (event) => {
      event.stopPropagation();
      const id = button.dataset.deleteRoute;
      const poi = getPoiById(id);
      state.selectedIds = state.selectedIds.filter((selectedId) => selectedId !== id);
      state.previewSelectedIds = state.previewSelectedIds.filter((selectedId) => selectedId !== id);
      state.routePlan = state.selectedIds.length
        ? await planRoute({ origin: await ensureOrigin(), selectedIds: state.selectedIds, prefs: state.selectedPrefs, respectOrder: true })
        : { selected: [], totalDistanceLabel: '待选' };
      renderRoute();
      renderRecommendations();
      drawMaps();
      showToast(poi ? `已删除 ${poi.name}` : '已删除点位');
    });
  });
}

function drawMaps() {
  const selectedPois = state.routePlan?.selected?.length
    ? state.routePlan.selected
    : state.selectedIds.map((id) => getPoiById(id)).filter(Boolean);
  const currentRecommendationPois = state.recommendations.slice(0, 3);
  const previewPois = state.previewSelectedIds.map((id) => getPoiById(id)).filter(Boolean);
  const selectedPreviewPois = state.previewSelectedIds.map((id) => getPoiById(id)).filter(Boolean);
  map11.render({
    origin: state.origin,
    points: previewPois,
    selectedPoints: selectedPreviewPois,
    hideUnselected: false,
    showMemberRoutes: true,
    routeLabel: state.routePlan?.totalDistanceLabel,
  });
  map12.render({
    origin: state.origin,
    points: selectedPois,
    selectedPoints: selectedPois,
    hideUnselected: true,
    routeFromOrigin: false,
    routeLabel: state.routePlan?.totalDistanceLabel,
  });
}

function toggleSelection(poiId) {
  const set = new Set(state.selectedIds);
  if (set.has(poiId)) set.delete(poiId);
  else set.add(poiId);
  state.selectedIds = [...set];
}

function bindSearchInput() {
  if (!el.poiSearch) return;
  el.poiSearch.addEventListener('input', async () => {
    state.searchQuery = el.poiSearch.value;
    await renderSearch();
  });
}

function openOptionSheet(type) {
  const config = {
    time: {
      title: '选择出行时间',
      input: el.tripTimeInput,
      className: 'option-list option-list--picker',
    },
    route: {
      title: '选择路线偏好',
      input: el.routePrefInput,
      className: 'option-list option-list--route',
      values: [
        { label: '少走路 · 高分优先' },
        { label: '地铁直达 · 少排队' },
        { label: '预算友好 · 拍照出片' },
        { label: '甜品收尾 · 可聊天' },
      ],
    },
  }[type];
  if (!config) return;
  el.optionSheetTitle.textContent = config.title;
  el.optionList.className = config.className;
  if (type === 'time') {
    const now = new Date();
    const date = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    el.optionList.innerHTML = `
      <label class="calendar-field"><span>日期</span><input id="trip-date-picker" type="date" value="${yyyy}-${mm}-${dd}" /></label>
      <label class="calendar-field"><span>时间</span><input id="trip-clock-picker" type="time" value="14:00" /></label>
      <button class="option-confirm" id="trip-time-confirm">确认出行时间</button>
    `;
    el.optionList.querySelector('#trip-time-confirm').addEventListener('click', () => {
      const dateValue = el.optionList.querySelector('#trip-date-picker').value;
      const timeValue = el.optionList.querySelector('#trip-clock-picker').value || '14:00';
      config.input.value = formatTripDateTime(dateValue, timeValue);
      closeOptionSheet();
      showToast('已更新出行时间');
    });
    el.optionSheet.classList.remove('hidden');
    return;
  }
  el.optionList.innerHTML = [
    ...config.values.map((item) => `<button class="option-item" data-option-value="${item.label}">${item.label}</button>`),
    `<label class="custom-option"><span>自定义</span><input id="route-custom-input" placeholder="比如：先吃饭再玩、避开排队" /></label>`,
    `<button class="option-confirm" id="route-custom-confirm">确认路线偏好</button>`,
  ].join('');
  el.optionList.querySelectorAll('[data-option-value]').forEach((button) => {
    button.addEventListener('click', () => {
      config.input.value = button.dataset.optionValue;
      closeOptionSheet();
      showToast('已更新设置');
    });
  });
  el.optionList.querySelector('#route-custom-confirm').addEventListener('click', () => {
    const custom = el.optionList.querySelector('#route-custom-input').value.trim();
    if (!custom) {
      el.optionList.querySelector('#route-custom-input').focus();
      return;
    }
    config.input.value = custom;
    closeOptionSheet();
    showToast('已更新路线偏好');
  });
  el.optionSheet.classList.remove('hidden');
}

function formatTripDateTime(dateValue, timeValue) {
  if (!dateValue) return `${timeValue} 开始`;
  const date = new Date(`${dateValue}T00:00:00`);
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]} ${timeValue} 开始`;
}

async function ensureOrigin() {
  if (state.origin?.lat && state.origin?.lng) return state.origin;
  state.origin = await getUserContext();
  return state.origin;
}

function closeOptionSheet() {
  el.optionSheet.classList.add('hidden');
}

async function copyInviteLink() {
  const link = 'https://meituan.example/route-room/8273';
  try {
    await navigator.clipboard.writeText(link);
    showToast('邀请链接已复制');
  } catch (error) {
    showToast('已生成邀请链接：8273');
  }
}

function generateInviteImage() {
  const canvas = document.createElement('canvas');
  canvas.width = 750;
  canvas.height = 1000;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFD100';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#111';
  ctx.font = '900 54px sans-serif';
  ctx.fillText('周末美食路线', 72, 150);
  ctx.font = '800 30px sans-serif';
  ctx.fillText('房间码 8273', 72, 224);
  ctx.fillText('周六 14:00 · 美食 · 最多5人', 72, 286);
  ctx.fillStyle = '#fff';
  roundRect(ctx, 72, 350, 606, 370, 36);
  ctx.fill();
  ctx.fillStyle = '#FF5A22';
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(170, 560);
  ctx.bezierCurveTo(300, 420, 440, 650, 580, 470);
  ctx.stroke();
  ctx.fillStyle = '#111';
  ctx.font = '900 34px sans-serif';
  ctx.fillText('高分餐厅 + 饭后甜品', 126, 790);
  ctx.font = '700 26px sans-serif';
  ctx.fillText('扫码加入，一起补充偏好', 126, 840);

  const link = document.createElement('a');
  link.download = 'meituan-route-invite-8273.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('已生成邀请图片卡片');
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function showToast(message) {
  el.toast.textContent = message;
  el.toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => el.toast.classList.remove('show'), 1800);
}

function formatDistanceApprox(poi) {
  if (!state.origin) return '近';
  const latMeters = 111000;
  const lngMeters = 85000;
  const meters = Math.hypot((poi.lat - state.origin.lat) * latMeters, (poi.lng - state.origin.lng) * lngMeters);
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

async function resolveUserLocation() {
  if (window.location.protocol === 'file:') return { ...await getUserContext() };
  if (!navigator.geolocation) return { ...await getUserContext() };
  return new Promise((resolve) => {
    let settled = false;
    const fallback = async () => {
      if (settled) return;
      settled = true;
      resolve(await getUserContext());
    };
    const timer = setTimeout(fallback, 900);
    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            name: '当前位置',
            address: '浏览器定位结果',
          });
        },
        fallback,
        { enableHighAccuracy: true, timeout: 900, maximumAge: 30_000 },
      );
    } catch (error) {
      clearTimeout(timer);
      fallback();
    }
  });
}

function createMapAdapter(canvas, onPointClick) {
  const ctx = canvas.getContext('2d');
  const size = { width: canvas.width, height: canvas.height };
  const latRange = 0.012;
  const lngRange = 0.017;
  let lastMarkers = [];

  function project(point, origin) {
    const left = size.width * 0.18;
    const top = size.height * 0.15;
    const width = size.width * 0.64;
    const height = size.height * 0.66;
    const x = left + ((point.lng - origin.lng) / lngRange + 0.5) * width;
    const y = top + (0.5 - (point.lat - origin.lat) / latRange) * height;
    return { x, y };
  }

  function hitTest(x, y) {
    return lastMarkers.find((marker) => Math.hypot(marker.x - x, marker.y - y) <= marker.radius + 4) || null;
  }

  canvas.addEventListener('click', (event) => {
    if (typeof onPointClick !== 'function') return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    const marker = hitTest(x, y);
    if (marker) onPointClick(marker.point);
  });

  function drawBackground(origin) {
    ctx.clearRect(0, 0, size.width, size.height);
    ctx.fillStyle = '#eef1ec';
    ctx.fillRect(0, 0, size.width, size.height);
    ctx.fillStyle = 'rgba(255,255,255,0.86)';
    ctx.save();
    ctx.translate(size.width * 0.1, size.height * 0.3);
    ctx.rotate(-0.12);
    ctx.fillRect(-80, -8, size.width * 1.1, 16);
    ctx.restore();
    ctx.save();
    ctx.translate(size.width * 0.28, -10);
    ctx.rotate(0.17);
    ctx.fillRect(-16, 0, 16, size.height * 1.08);
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.32)';
    ctx.fillRect(0, 0, size.width, 6);
    ctx.strokeStyle = 'rgba(0,0,0,0.03)';
    for (let i = 0; i < 7; i += 1) {
      ctx.beginPath();
      ctx.moveTo(16, 26 + i * 26);
      ctx.lineTo(size.width - 16, 26 + i * 26);
      ctx.stroke();
    }
  }

  function getMemberPoints(origin) {
    return [
      { lat: origin.lat + 0.0038, lng: origin.lng - 0.0062, name: 'X', fill: '#ff8a1f', glow: 'rgba(255, 138, 31, 0.24)' },
      { lat: origin.lat - 0.0024, lng: origin.lng - 0.0044, name: 'Y', fill: '#28b978', glow: 'rgba(40, 185, 120, 0.24)' },
      { lat: origin.lat + 0.0016, lng: origin.lng + 0.0058, name: 'L', fill: '#8a63df', glow: 'rgba(138, 99, 223, 0.24)' },
    ];
  }

  function getCenterPoint(points) {
    return {
      lat: points.reduce((sum, item) => sum + item.lat, 0) / points.length,
      lng: points.reduce((sum, item) => sum + item.lng, 0) / points.length,
      name: '中心',
    };
  }

  function drawMemberRoutes(origin) {
    const memberPoints = [
      ...getMemberPoints(origin).sort((a, b) => a.lng - b.lng),
    ];
    const hub = getCenterPoint(memberPoints);
    const memberCoords = memberPoints.map((member) => ({ ...project(member, origin), member }));
    ctx.strokeStyle = 'rgba(255, 90, 34, 0.52)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const meanX = memberCoords.reduce((sum, point) => sum + point.x, 0) / memberCoords.length;
    const meanY = memberCoords.reduce((sum, point) => sum + point.y, 0) / memberCoords.length;
    const varianceX = memberCoords.reduce((sum, point) => sum + (point.x - meanX) ** 2, 0);
    const varianceY = memberCoords.reduce((sum, point) => sum + (point.y - meanY) ** 2, 0);
    ctx.beginPath();
    if (varianceX >= varianceY) {
      const slope = memberCoords.reduce((sum, point) => sum + (point.x - meanX) * (point.y - meanY), 0) / Math.max(varianceX, 1);
      const minX = Math.max(20, Math.min(...memberCoords.map((point) => point.x)) - 24);
      const maxX = Math.min(size.width - 20, Math.max(...memberCoords.map((point) => point.x)) + 24);
      ctx.moveTo(minX, meanY + slope * (minX - meanX));
      ctx.lineTo(maxX, meanY + slope * (maxX - meanX));
    } else {
      const slope = memberCoords.reduce((sum, point) => sum + (point.x - meanX) * (point.y - meanY), 0) / Math.max(varianceY, 1);
      const minY = Math.max(20, Math.min(...memberCoords.map((point) => point.y)) - 24);
      const maxY = Math.min(size.height - 20, Math.max(...memberCoords.map((point) => point.y)) + 24);
      ctx.moveTo(meanX + slope * (minY - meanY), minY);
      ctx.lineTo(meanX + slope * (maxY - meanY), maxY);
    }
    ctx.stroke();
    memberCoords.forEach((coord) => {
      ctx.save();
      ctx.beginPath();
      ctx.fillStyle = coord.member.glow;
      ctx.arc(coord.x, coord.y, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = coord.member.fill;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.arc(coord.x, coord.y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = '900 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(coord.member.name, coord.x, coord.y + 1);
      ctx.restore();
    });
    return hub;
  }

  function drawRoute(points, origin, startPoint = null) {
    if (!points.length) return;
    const routePoints = startPoint ? [startPoint, ...points] : points;
    if (routePoints.length < 2) return;
    const coords = routePoints.map((point) => project(point, origin));
    ctx.strokeStyle = '#ff5a22';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    coords.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
  }

  function drawMarker(point, index, origin, selected = false, showLabel = true) {
    const { x, y } = project(point, origin);
    const radius = selected ? 17 : 12;
    lastMarkers.push({ id: point.id, x, y, radius, point });
    if (selected) {
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 3;
      ctx.beginPath();
      ctx.fillStyle = '#ff5a22';
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.beginPath();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.arc(x, y, radius - 1.5, 0, Math.PI * 2);
      ctx.stroke();
      if (!showLabel) return;
      ctx.fillStyle = '#fff';
      ctx.font = '900 13px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(index + 1), x, y + 1);
      return;
    }
    ctx.beginPath();
    ctx.fillStyle = 'rgba(170, 170, 170, 0.88)';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (!showLabel) return;
    ctx.fillStyle = '#fff';
    ctx.font = '900 16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(index + 1), x, y + 1);
  }

  return {
    render({ origin, points = [], selectedPoints = [], hideUnselected = false, showMemberRoutes = false, routeFromOrigin = true }) {
      const safeOrigin = origin || { lat: 39.905, lng: 116.391 };
      lastMarkers = [];
      drawBackground(safeOrigin);
      const hub = showMemberRoutes ? drawMemberRoutes(safeOrigin) : null;
      drawRoute(selectedPoints, safeOrigin, showMemberRoutes ? hub : (routeFromOrigin ? safeOrigin : null));
      const visiblePoints = hideUnselected ? selectedPoints : points;
      visiblePoints.forEach((point, index) => {
        const selected = selectedPoints.some((selectedPoi) => selectedPoi.id === point.id);
        drawMarker(point, index, safeOrigin, selected, hideUnselected || selected);
      });
    },
  };
}

bootstrap();
})();
