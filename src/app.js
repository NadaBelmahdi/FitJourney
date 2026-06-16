const STORE_KEY = 'fitjourney_state_v1';
const API_URL = '/fitness-api.php';

const todayKey = () => new Date().toISOString().slice(0, 10);
const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const number = (value) => Number.parseFloat(value) || 0;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const defaultState = {
  profile: null,
  progress: [],
  meals: {},
  workouts: {},
  weekPlan: {},
  aiEstimate: null,
  videos: [],
  activeTab: 'dashboard',
};

let state = loadState();
let videoUrls = new Map();

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const foodMacros = [
  { keys: ['egg', 'eggs'], calories: 78, protein: 6, carbs: 1, fat: 5, unit: 'piece' },
  { keys: ['chicken', 'chicken breast'], calories: 165, protein: 31, carbs: 0, fat: 4, unit: '100g' },
  { keys: ['rice'], calories: 130, protein: 3, carbs: 28, fat: 0, unit: '100g' },
  { keys: ['beans'], calories: 127, protein: 9, carbs: 23, fat: 1, unit: '100g' },
  { keys: ['oats', 'oatmeal'], calories: 150, protein: 5, carbs: 27, fat: 3, unit: '40g' },
  { keys: ['bread'], calories: 80, protein: 3, carbs: 15, fat: 1, unit: 'slice' },
  { keys: ['banana'], calories: 105, protein: 1, carbs: 27, fat: 0, unit: 'piece' },
  { keys: ['apple'], calories: 95, protein: 0, carbs: 25, fat: 0, unit: 'piece' },
  { keys: ['milk'], calories: 122, protein: 8, carbs: 12, fat: 5, unit: 'cup' },
  { keys: ['yogurt'], calories: 100, protein: 10, carbs: 7, fat: 3, unit: 'cup' },
  { keys: ['beef'], calories: 250, protein: 26, carbs: 0, fat: 15, unit: '100g' },
  { keys: ['fish', 'salmon', 'tuna'], calories: 180, protein: 25, carbs: 0, fat: 8, unit: '100g' },
  { keys: ['pasta'], calories: 158, protein: 6, carbs: 31, fat: 1, unit: '100g' },
  { keys: ['potato', 'yam'], calories: 118, protein: 2, carbs: 27, fat: 0, unit: '100g' },
  { keys: ['avocado'], calories: 240, protein: 3, carbs: 13, fat: 22, unit: 'piece' },
  { keys: ['peanut butter'], calories: 190, protein: 7, carbs: 7, fat: 16, unit: '2 tbsp' },
  { keys: ['oil', 'olive oil'], calories: 120, protein: 0, carbs: 0, fat: 14, unit: 'tbsp' },
];

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    const merged = { ...defaultState, ...saved };
    if (merged.activeTab === 'videos') merged.activeTab = 'workouts';
    return merged;
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
  }).catch(() => {});
}

async function hydrateFromDatabase() {
  try {
    const response = await fetch(API_URL, { headers: { Accept: 'application/json' } });
    if (!response.ok) return;
    const remoteState = await response.json();
    if (!remoteState || !remoteState.profile) return;
    state = { ...defaultState, ...remoteState };
    if (state.activeTab === 'videos') state.activeTab = 'workouts';
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    render();
  } catch {}
}

function calculateTargets(profile) {
  const height = number(profile.height);
  const weight = number(profile.weight);
  const age = number(profile.age);
  const sexOffset = profile.gender === 'female' ? -161 : 5;
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    athlete: 1.9,
  };
  const goalOffsets = {
    lose: -500,
    maintain: 0,
    gain: 350,
  };
  const bmr = 10 * weight + 6.25 * height - 5 * age + sexOffset;
  const calories = Math.round((bmr * activityMultipliers[profile.activity]) + goalOffsets[profile.goal]);
  const protein = Math.round(weight * (profile.goal === 'gain' ? 2 : 1.8));
  const fat = Math.round((calories * 0.27) / 9);
  const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
  return {
    calories: Math.max(calories, 1200),
    protein: Math.max(protein, 50),
    carbs: Math.max(carbs, 80),
    fat: Math.max(fat, 35),
  };
}

function latestProgress() {
  return [...state.progress].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
}

function formatWeek(dateValue = todayKey()) {
  const date = new Date(`${dateValue}T00:00:00`);
  const first = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date - first) / 86400000);
  return `${date.getFullYear()}-W${String(Math.ceil((days + first.getDay() + 1) / 7)).padStart(2, '0')}`;
}

function todayMeals() {
  return state.meals[todayKey()] || [];
}

function totalsForMeals(meals) {
  return meals.reduce((acc, meal) => {
    acc.calories += number(meal.calories);
    acc.protein += number(meal.protein);
    acc.carbs += number(meal.carbs);
    acc.fat += number(meal.fat);
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

function estimateFood(description) {
  const text = description.toLowerCase();
  const hits = [];
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

  foodMacros.forEach((food) => {
    const matched = food.keys.find((key) => text.includes(key));
    if (!matched) return;
    const beforeMatch = text.slice(0, text.indexOf(matched));
    const amountMatch = beforeMatch.match(/(\d+(?:\.\d+)?)\s*$/);
    const multiplier = amountMatch ? number(amountMatch[1]) : 1;
    totals.calories += food.calories * multiplier;
    totals.protein += food.protein * multiplier;
    totals.carbs += food.carbs * multiplier;
    totals.fat += food.fat * multiplier;
    hits.push(`${multiplier} ${food.unit} ${matched}`);
  });

  if (!hits.length) {
    const words = text.split(/\s+/).filter(Boolean).length;
    totals.calories = Math.max(220, words * 45);
    totals.protein = Math.round(totals.calories * 0.18 / 4);
    totals.carbs = Math.round(totals.calories * 0.48 / 4);
    totals.fat = Math.round(totals.calories * 0.28 / 9);
    hits.push('general mixed meal estimate');
  }

  return {
    name: description.trim(),
    calories: Math.round(totals.calories),
    protein: Math.round(totals.protein),
    carbs: Math.round(totals.carbs),
    fat: Math.round(totals.fat),
    note: `Estimated from ${hits.join(', ')}. You can edit the numbers before saving.`,
  };
}

function progressDelta(field) {
  const sorted = [...state.progress].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length < 2) return 0;
  return number(sorted.at(-1)[field]) - number(sorted.at(-2)[field]);
}

function setTab(tab) {
  state.activeTab = tab;
  saveState();
  render();
}

function html(strings, ...values) {
  return strings.map((part, index) => `${part}${values[index] ?? ''}`).join('');
}

function render() {
  const root = document.getElementById('root');
  root.innerHTML = state.profile ? renderApp() : renderOnboarding();
  bindEvents();
  requestAnimationFrame(drawCharts);
}

function renderOnboarding() {
  return html`
    <main class="onboarding">
      <section class="intro-panel">
        <div class="brand-mark">FJ</div>
        <h1>FitJourney</h1>
        <p>Set your starting point, nutrition targets, training rhythm, and weekly progress tracking in one calm workspace.</p>
        <div class="intro-stats">
          <span>Weekly measurements</span>
          <span>Macro targets</span>
          <span>Workout library</span>
        </div>
      </section>
      <form class="setup-card" id="profileForm">
        <div class="form-head">
          <p class="eyebrow">Start profile</p>
          <h2>Your daily target begins here</h2>
        </div>
        <div class="form-grid">
          ${input('age', 'Age', 'number', '28')}
          ${select('gender', 'Gender', [['male', 'Male'], ['female', 'Female']], 'male')}
          ${input('height', 'Height (cm)', 'number', '170')}
          ${input('weight', 'Current weight (kg)', 'number', '82')}
          ${select('activity', 'Activity level', [
            ['sedentary', 'Sedentary'],
            ['light', 'Light activity'],
            ['moderate', 'Moderate training'],
            ['active', 'Very active'],
            ['athlete', 'Athlete'],
          ], 'moderate')}
          ${select('goal', 'Goal', [['lose', 'Lose weight'], ['maintain', 'Maintain'], ['gain', 'Gain muscle']], 'lose')}
        </div>
        <button class="primary-action" type="submit">Create my plan</button>
      </form>
    </main>
  `;
}

function renderApp() {
  const targets = calculateTargets(state.profile);
  const totals = totalsForMeals(todayMeals());
  const latest = latestProgress();
  const tab = state.activeTab;
  return html`
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand-row"><span class="brand-mark small">FJ</span><strong>FitJourney</strong></div>
        <nav>
          ${navItem('dashboard', 'Dashboard')}
          ${navItem('progress', 'Progress')}
          ${navItem('nutrition', 'Nutrition')}
          ${navItem('workouts', 'Workouts')}
          ${navItem('settings', 'Settings')}
        </nav>
      </aside>
      <main class="content">
        <header class="topbar">
          <div>
            <p class="eyebrow">${new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
            <h1>${titleForTab(tab)}</h1>
          </div>
          <div class="target-pill">${targets.calories} kcal target</div>
        </header>
        ${tab === 'dashboard' ? renderDashboard(targets, totals, latest) : ''}
        ${tab === 'progress' ? renderProgress(latest) : ''}
        ${tab === 'nutrition' ? renderNutrition(targets, totals) : ''}
        ${tab === 'workouts' ? renderWorkouts() : ''}
        ${tab === 'settings' ? renderSettings() : ''}
      </main>
    </div>
  `;
}

function navItem(id, label) {
  return `<button class="nav-item ${state.activeTab === id ? 'active' : ''}" data-tab="${id}">${label}</button>`;
}

function titleForTab(tab) {
  return {
    dashboard: 'Today',
    progress: 'Weekly progress',
    nutrition: 'Nutrition log',
    workouts: 'Weekly workouts',
    settings: 'Profile settings',
  }[tab];
}

function renderDashboard(targets, totals, latest) {
  const workoutDone = Boolean(state.workouts[todayKey()]?.completed);
  return html`
    <section class="metric-grid">
      ${metric('Weight', latest ? `${latest.weight} kg` : `${state.profile.weight} kg`, `${signed(progressDelta('weight'))} kg since last check`)}
      ${metric('Calories', `${Math.round(totals.calories)}`, `${Math.max(targets.calories - totals.calories, 0)} kcal left`)}
      ${metric('Protein', `${Math.round(totals.protein)} g`, `Goal ${targets.protein} g`)}
      ${metric('Workout', workoutDone ? 'Done' : 'Open', workoutDone ? 'Logged for today' : 'Waiting for check-in')}
    </section>
    <section class="dashboard-grid">
      <article class="panel chart-panel">
        <div class="panel-head"><h2>Weight trend</h2><span>${state.progress.length} entries</span></div>
        <canvas id="weightChart" height="260"></canvas>
      </article>
      <article class="panel">
        <div class="panel-head"><h2>Macro progress</h2><span>Today</span></div>
        ${macroBar('Calories', totals.calories, targets.calories, 'kcal')}
        ${macroBar('Protein', totals.protein, targets.protein, 'g')}
        ${macroBar('Carbs', totals.carbs, targets.carbs, 'g')}
        ${macroBar('Fat', totals.fat, targets.fat, 'g')}
      </article>
    </section>
  `;
}

function renderProgress(latest) {
  const currentWeek = formatWeek();
  const hasThisWeek = state.progress.some((entry) => formatWeek(entry.date) === currentWeek);
  const base = latest || { weight: state.profile.weight, waist: '', hips: '', arms: '', thighs: '', chest: '' };
  return html`
    <section class="split-grid">
      <form class="panel" id="progressForm">
        <div class="panel-head">
          <h2>Weekly check-in</h2>
          <span>${hasThisWeek ? 'Logged this week' : 'Ready'}</span>
        </div>
        <input type="hidden" name="date" value="${todayKey()}">
        <div class="form-grid compact">
          ${input('weight', 'Weight (kg)', 'number', base.weight)}
          ${input('waist', 'Waist (cm)', 'number', base.waist)}
          ${input('hips', 'Hips (cm)', 'number', base.hips)}
          ${input('arms', 'Arms (cm)', 'number', base.arms)}
          ${input('thighs', 'Thighs (cm)', 'number', base.thighs)}
          ${input('chest', 'Chest (cm)', 'number', base.chest)}
        </div>
        <button class="primary-action" ${hasThisWeek ? 'disabled' : ''} type="submit">${hasThisWeek ? 'Come back next week' : 'Save weekly update'}</button>
      </form>
      <article class="panel chart-panel">
        <div class="panel-head"><h2>Measurements</h2><span>Waist and hips</span></div>
        <canvas id="measureChart" height="300"></canvas>
      </article>
    </section>
    <section class="panel history-panel">
      <div class="panel-head"><h2>History</h2><span>${state.progress.length} total</span></div>
      <div class="history-list">
        ${state.progress.length ? [...state.progress].reverse().map(renderProgressRow).join('') : empty('No weekly measurements yet.')}
      </div>
    </section>
  `;
}

function renderNutrition(targets, totals) {
  return html`
    <section class="split-grid">
      <div class="stack">
        <form class="panel ai-panel" id="aiFoodForm">
          <div class="panel-head"><h2>AI food helper</h2><span>Estimate macros</span></div>
          <label>
            <span class="field-label">Describe your food</span>
            <textarea name="foodText" placeholder="Example: 2 eggs, 1 cup rice, chicken breast and avocado" required></textarea>
          </label>
          <button class="primary-action" type="submit">Estimate calories and macros</button>
          <div id="aiFoodResult" class="ai-result">${state.aiEstimate ? renderAiEstimate(state.aiEstimate) : 'Tell me what you ate and I will estimate calories, protein, carbs, and fat.'}</div>
        </form>
        <form class="panel" id="mealForm">
          <div class="panel-head"><h2>Add food</h2><span>${todayKey()}</span></div>
          ${input('name', 'Food or meal', 'text', state.aiEstimate?.name || '', 'Greek yogurt, rice bowl, smoothie')}
          <div class="form-grid compact">
            ${input('calories', 'Calories', 'number', state.aiEstimate?.calories || '')}
            ${input('protein', 'Protein (g)', 'number', state.aiEstimate?.protein || '')}
            ${input('carbs', 'Carbs (g)', 'number', state.aiEstimate?.carbs || '')}
            ${input('fat', 'Fat (g)', 'number', state.aiEstimate?.fat || '')}
          </div>
          <button class="primary-action" type="submit">Log food</button>
        </form>
      </div>
      <article class="panel">
        <div class="panel-head"><h2>Daily intake</h2><span>${Math.round(totals.calories)} / ${targets.calories} kcal</span></div>
        ${macroBar('Calories', totals.calories, targets.calories, 'kcal')}
        ${macroBar('Protein', totals.protein, targets.protein, 'g')}
        ${macroBar('Carbs', totals.carbs, targets.carbs, 'g')}
        ${macroBar('Fat', totals.fat, targets.fat, 'g')}
      </article>
    </section>
    <section class="panel history-panel">
      <div class="panel-head"><h2>Today's food</h2><span>${todayMeals().length} items</span></div>
      <div class="food-list">
        ${todayMeals().length ? todayMeals().map(renderMealRow).join('') : empty('Start logging meals to see calories and macros.')}
      </div>
    </section>
  `;
}

function renderAiEstimate(estimate) {
  return `<div>
    <strong>${estimate.calories} kcal</strong>
    <span>P ${estimate.protein}g | C ${estimate.carbs}g | F ${estimate.fat}g</span>
    <small>${estimate.note}</small>
  </div>`;
}

function renderWorkouts() {
  const currentDay = new Date().toLocaleDateString(undefined, { weekday: 'long' });
  const completed = weekDays.filter((day) => state.workouts[day]?.completed).length;
  return html`
    <section class="split-grid">
      <form class="panel weekly-plan" id="weekPlanForm">
        <div class="panel-head"><h2>Workout plan for the week</h2><span>${completed}/7 completed</span></div>
        <div class="week-plan-grid">
          ${weekDays.map((day) => `
            <label>
              <span class="field-label">${day}</span>
              <textarea name="${day}" placeholder="Workout for ${day}">${state.weekPlan[day] || ''}</textarea>
            </label>
          `).join('')}
        </div>
        <button class="primary-action" type="submit">Save weekly plan</button>
      </form>
      <article class="panel">
        <div class="panel-head"><h2>Daily check-in</h2><span>Today is ${currentDay}</span></div>
        <div class="daily-checklist">
          ${weekDays.map((day) => renderWorkoutCheck(day)).join('')}
        </div>
      </article>
    </section>
    ${renderVideos()}
  `;
}

function renderWorkoutCheck(day) {
  const log = state.workouts[day] || { completed: false };
  return `<label class="workout-check ${log.completed ? 'done' : ''}">
    <input type="checkbox" data-workout-day="${day}" ${log.completed ? 'checked' : ''}>
    <span>
      <strong>${day}</strong>
      <small>${state.weekPlan[day] || 'No workout entered yet'}</small>
    </span>
  </label>`;
}

function renderVideos() {
  return html`
    <section class="panel">
      <div class="panel-head"><h2>Upload video</h2><span>MP4, WebM, MOV</span></div>
      <form id="videoForm" class="video-form">
        ${input('title', 'Video title', 'text', '', 'Upper body day')}
        ${select('category', 'Workout type', [['Strength', 'Strength'], ['Cardio', 'Cardio'], ['Mobility', 'Mobility'], ['HIIT', 'HIIT'], ['Core', 'Core']], 'Strength')}
        ${select('day', 'Day', [['Any day', 'Any day'], ...weekDays.map((day) => [day, day])], 'Any day')}
        <input class="file-input" type="file" name="video" accept="video/*" required>
        <button class="primary-action" type="submit">Add video</button>
      </form>
    </section>
    <section class="video-grid">
      ${state.videos.length ? state.videos.map(renderVideoCard).join('') : empty('Upload workout videos to build your personal training library.')}
    </section>
  `;
}

function renderSettings() {
  const profile = state.profile;
  return html`
    <form class="panel settings-card" id="settingsForm">
      <div class="panel-head"><h2>Profile and goal</h2><span>Targets update automatically</span></div>
      <div class="form-grid">
        ${input('age', 'Age', 'number', profile.age)}
        ${select('gender', 'Gender', [['male', 'Male'], ['female', 'Female']], profile.gender)}
        ${input('height', 'Height (cm)', 'number', profile.height)}
        ${input('weight', 'Current weight (kg)', 'number', profile.weight)}
        ${select('activity', 'Activity level', [['sedentary', 'Sedentary'], ['light', 'Light activity'], ['moderate', 'Moderate training'], ['active', 'Very active'], ['athlete', 'Athlete']], profile.activity)}
        ${select('goal', 'Goal', [['lose', 'Lose weight'], ['maintain', 'Maintain'], ['gain', 'Gain muscle']], profile.goal)}
      </div>
      <button class="primary-action" type="submit">Update profile</button>
    </form>
  `;
}

function input(name, label, type, value, placeholder = '') {
  return `<label><span class="field-label">${label}</span><input name="${name}" type="${type}" value="${value ?? ''}" placeholder="${placeholder}" ${type === 'number' ? 'step="0.1" min="0"' : ''} required></label>`;
}

function select(name, label, options, selected) {
  return `<label><span class="field-label">${label}</span><select name="${name}">${options.map(([value, text]) => `<option value="${value}" ${value === selected ? 'selected' : ''}>${text}</option>`).join('')}</select></label>`;
}

function metric(label, value, detail) {
  return `<article class="metric-card"><span>${label}</span><strong>${value}</strong><small>${detail}</small></article>`;
}

function macroBar(label, value, target, unit) {
  const pct = clamp((value / target) * 100, 0, 100);
  return `<div class="macro-row">
    <div><strong>${label}</strong><span>${Math.round(value)} / ${target} ${unit}</span></div>
    <div class="bar"><i style="width:${pct}%"></i></div>
  </div>`;
}

function renderProgressRow(entry) {
  return `<div class="history-row">
    <strong>${entry.date}</strong>
    <span>${entry.weight} kg</span>
    <span>Waist ${entry.waist || '-'} cm</span>
    <span>Hips ${entry.hips || '-'} cm</span>
  </div>`;
}

function renderMealRow(meal) {
  return `<div class="food-row">
    <div><strong>${meal.name}</strong><span>${meal.calories} kcal</span></div>
    <small>P ${meal.protein}g | C ${meal.carbs}g | F ${meal.fat}g</small>
    <button class="ghost-button" data-delete-meal="${meal.id}">Remove</button>
  </div>`;
}

function renderVideoCard(video) {
  const src = video.url || videoUrls.get(video.id) || '';
  return `<article class="video-card">
    ${src ? `<video controls src="${src}"></video>` : `<div class="video-missing">Video file available in this browser session only</div>`}
    <div>
      <strong>${video.title}</strong>
      <span>${video.day} | ${video.category}</span>
      <button class="ghost-button" data-delete-video="${video.id}">Remove</button>
    </div>
  </article>`;
}

function empty(text) {
  return `<div class="empty-state">${text}</div>`;
}

function signed(value) {
  if (!value) return '0';
  return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
}

function bindEvents() {
  document.querySelectorAll('[data-tab]').forEach((button) => {
    button.addEventListener('click', () => setTab(button.dataset.tab));
  });

  document.getElementById('profileForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    state.profile = Object.fromEntries(new FormData(event.currentTarget));
    state.progress = [{
      id: uid(),
      date: todayKey(),
      weight: state.profile.weight,
      waist: '',
      hips: '',
      arms: '',
      thighs: '',
      chest: '',
    }];
    state.activeTab = 'dashboard';
    saveState();
    render();
  });

  document.getElementById('progressForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    state.progress.push({ id: uid(), ...data });
    state.profile.weight = data.weight;
    saveState();
    render();
  });

  document.getElementById('mealForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const meal = { id: uid(), ...Object.fromEntries(new FormData(event.currentTarget)) };
    state.meals[todayKey()] = [meal, ...todayMeals()];
    state.aiEstimate = null;
    saveState();
    render();
  });

  document.getElementById('aiFoodForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    state.aiEstimate = estimateFood(data.foodText);
    render();
  });

  document.querySelectorAll('[data-delete-meal]').forEach((button) => {
    button.addEventListener('click', () => {
      state.meals[todayKey()] = todayMeals().filter((meal) => meal.id !== button.dataset.deleteMeal);
      saveState();
      render();
    });
  });

  document.getElementById('weekPlanForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    state.weekPlan = weekDays.reduce((plan, day) => {
      plan[day] = data[day] || '';
      return plan;
    }, {});
    saveState();
    render();
  });

  document.querySelectorAll('[data-workout-day]').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      const day = checkbox.dataset.workoutDay;
      state.workouts[day] = {
        completed: checkbox.checked,
        checkedAt: checkbox.checked ? new Date().toISOString() : '',
      };
      saveState();
      render();
    });
  });

  document.getElementById('videoForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get('video');
    const id = uid();
    const localUrl = URL.createObjectURL(file);
    videoUrls.set(id, localUrl);
    let serverUrl = '';
    try {
      const upload = new FormData();
      upload.append('video', file);
      const response = await fetch('/upload-video.php', { method: 'POST', body: upload });
      const json = await response.json();
      serverUrl = json.url || '';
    } catch {}
    state.videos.unshift({
      id,
      title: data.get('title'),
      category: data.get('category'),
      day: data.get('day'),
      fileName: file.name,
      url: serverUrl,
    });
    saveState();
    render();
  });

  document.querySelectorAll('[data-delete-video]').forEach((button) => {
    button.addEventListener('click', () => {
      state.videos = state.videos.filter((video) => video.id !== button.dataset.deleteVideo);
      saveState();
      render();
    });
  });

  document.getElementById('settingsForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    state.profile = Object.fromEntries(new FormData(event.currentTarget));
    saveState();
    render();
  });
}

function drawCharts() {
  drawLineChart('weightChart', state.progress.map((entry) => ({ x: entry.date.slice(5), y: number(entry.weight) })), '#ff37df');
  drawMultiChart('measureChart', [
    { label: 'Waist', color: '#ff37df', points: state.progress.map((entry) => ({ x: entry.date.slice(5), y: number(entry.waist) })) },
    { label: 'Hips', color: '#8b5cff', points: state.progress.map((entry) => ({ x: entry.date.slice(5), y: number(entry.hips) })) },
  ]);
}

function drawLineChart(id, points, color) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const ctx = setupCanvas(canvas);
  const valid = points.filter((point) => point.y);
  paintChart(ctx, canvas, [{ points: valid, color }]);
}

function drawMultiChart(id, series) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const ctx = setupCanvas(canvas);
  paintChart(ctx, canvas, series.map((item) => ({ ...item, points: item.points.filter((point) => point.y) })));
}

function setupCanvas(canvas) {
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * ratio;
  canvas.height = canvas.height * ratio;
  const ctx = canvas.getContext('2d');
  ctx.scale(ratio, ratio);
  return ctx;
}

function paintChart(ctx, canvas, series) {
  const width = canvas.getBoundingClientRect().width;
  const height = canvas.height / (window.devicePixelRatio || 1);
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i += 1) {
    const y = 26 + i * ((height - 54) / 4);
    ctx.beginPath();
    ctx.moveTo(18, y);
    ctx.lineTo(width - 18, y);
    ctx.stroke();
  }
  const all = series.flatMap((item) => item.points);
  if (all.length < 2) {
    ctx.fillStyle = '#91869f';
    ctx.font = '14px Inter';
    ctx.fillText('Add weekly entries to build your chart.', 24, 48);
    return;
  }
  const min = Math.min(...all.map((point) => point.y));
  const max = Math.max(...all.map((point) => point.y));
  const range = max - min || 1;
  const longest = Math.max(...series.map((item) => item.points.length));
  series.forEach((item) => {
    ctx.strokeStyle = item.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    item.points.forEach((point, index) => {
      const x = 24 + (index / Math.max(longest - 1, 1)) * (width - 54);
      const y = height - 28 - ((point.y - min) / range) * (height - 68);
      index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    item.points.forEach((point, index) => {
      const x = 24 + (index / Math.max(longest - 1, 1)) * (width - 54);
      const y = height - 28 - ((point.y - min) / range) * (height - 68);
      ctx.fillStyle = '#f7ecff';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  });
}

render();
hydrateFromDatabase();
