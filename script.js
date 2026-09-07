'use strict';

/* =========================================================================
   DIBUJO IMPOSTOR — lógica del juego
   Todos reciben el mismo concepto para dibujar salvo el/los impostor(es),
   que reciben un concepto parecido pero distinto. Nadie sabe si tiene el
   concepto "raro": ni el propio impostor. El estado de la ronda vive solo
   en memoria (nunca en localStorage), así que un refresco lo borra.
   ========================================================================= */

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 10;
const DEFAULT_DRAW_SECONDS = 60;
const MIN_TIMER_SECONDS = 0;
const MAX_TIMER_SECONDS = 600;
const TIMER_STEP = 15;
const SETTINGS_KEY = 'dibujo-impostor-settings-v1';

let settings = {
  playerCount: 5,
  impostorCount: 1,
  categoryKey: PAIR_MEZCLA_KEY
};
let impostorManuallySet = false;
let round = null;
let isAdvancing = false;
let lastPairKey = null;

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function maxImpostorsFor(playerCount) { return Math.max(1, Math.floor((playerCount - 1) / 2)); }
function suggestedImpostorCount(playerCount) { return playerCount >= 7 ? Math.min(2, maxImpostorsFor(playerCount)) : 1; }

function shuffled(array) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickImpostorIndices(playerCount, impostorCount) {
  const indices = Array.from({ length: playerCount }, (_, i) => i);
  return new Set(shuffled(indices).slice(0, impostorCount));
}

function pickPairForCategory(categoryKey) {
  let realKey = categoryKey;
  if (categoryKey === PAIR_MEZCLA_KEY) {
    realKey = PAIR_CATEGORY_KEYS[Math.floor(Math.random() * PAIR_CATEGORY_KEYS.length)];
  }
  const list = PAIR_CATEGORIES[realKey].pairs;
  let candidates = list;
  const withKeys = list.map((p, i) => realKey + '-' + i);
  if (list.length > 1 && lastPairKey !== null) {
    const filteredIdx = withKeys.map((k, i) => k !== lastPairKey ? i : -1).filter((i) => i !== -1);
    if (filteredIdx.length > 0) candidates = filteredIdx.map((i) => list[i]);
  }
  const idx = Math.floor(Math.random() * candidates.length);
  const pair = candidates[idx];
  const pairKey = realKey + '-' + list.indexOf(pair);
  return { pair, pairKey, categoryLabel: PAIR_CATEGORIES[realKey].label };
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (typeof parsed.playerCount === 'number') {
      settings.playerCount = clamp(Math.round(parsed.playerCount), MIN_PLAYERS, MAX_PLAYERS);
    }
    if (typeof parsed.categoryKey === 'string' &&
        (parsed.categoryKey === PAIR_MEZCLA_KEY || PAIR_CATEGORY_KEYS.includes(parsed.categoryKey))) {
      settings.categoryKey = parsed.categoryKey;
    }
    const max = maxImpostorsFor(settings.playerCount);
    if (typeof parsed.impostorCount === 'number') {
      settings.impostorCount = clamp(Math.round(parsed.impostorCount), 1, max);
      impostorManuallySet = true;
    } else {
      settings.impostorCount = suggestedImpostorCount(settings.playerCount);
    }
  } catch (err) { /* localStorage inaccesible: seguimos con valores por defecto */ }
}

function saveSettings() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (err) { /* no disponible */ }
}

const el = {};

function cacheDom() {
  el.screens = document.querySelectorAll('.screen');
  el.siteHeader = document.querySelector('.site-header');

  el.playerCountValue = document.getElementById('player-count-value');
  el.playerMinus = document.getElementById('btn-player-minus');
  el.playerPlus = document.getElementById('btn-player-plus');
  el.impostorCountValue = document.getElementById('impostor-count-value');
  el.impostorMinus = document.getElementById('btn-impostor-minus');
  el.impostorPlus = document.getElementById('btn-impostor-plus');
  el.impostorHint = document.getElementById('impostor-hint');
  el.categoryOptions = document.getElementById('category-options');
  el.btnStart = document.getElementById('btn-start-game');

  el.revealPlayerLabel = document.getElementById('reveal-player-label');
  el.revealProgress = document.getElementById('reveal-progress');
  el.holdBtn = document.getElementById('hold-reveal-btn');
  el.holdPrompt = document.getElementById('hold-prompt');
  el.rolePanel = document.getElementById('role-panel');
  el.roleCategoryLabel = document.getElementById('role-category-label');
  el.roleContent = document.getElementById('role-content');
  el.btnNextPlayer = document.getElementById('btn-next-player');

  el.timerDisplay = document.getElementById('timer-display');
  el.timerMinus = document.getElementById('btn-timer-minus');
  el.timerPlus = document.getElementById('btn-timer-plus');
  el.timerToggle = document.getElementById('btn-timer-toggle');
  el.btnGoToVote = document.getElementById('btn-go-to-vote');

  el.voteButtons = document.getElementById('vote-buttons');
  el.btnReveal = document.getElementById('btn-reveal');

  el.resultsConceptA = document.getElementById('results-concept-a');
  el.resultsConceptB = document.getElementById('results-concept-b');
  el.resultsImpostors = document.getElementById('results-impostors');
  el.resultsVotes = document.getElementById('results-votes');
  el.btnPlayAgain = document.getElementById('btn-play-again');
  el.btnNewGame = document.getElementById('btn-new-game');
}

function showScreen(name) {
  el.screens.forEach((section) => { section.hidden = section.dataset.screen !== name; });
  if (el.siteHeader) el.siteHeader.hidden = name !== 'setup';
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

function renderCategoryOptions() {
  el.categoryOptions.innerHTML = '';
  const makePill = (key, label, count) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'category-pill';
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', String(settings.categoryKey === key));
    if (settings.categoryKey === key) btn.classList.add('is-selected');
    btn.innerHTML = `<span class="category-pill-name">${label}</span>` +
      (count ? `<span class="category-pill-count">${count} pares</span>` : '<span class="category-pill-count">Todas las categorías</span>');
    btn.addEventListener('click', () => { settings.categoryKey = key; renderCategoryOptions(); });
    return btn;
  };
  el.categoryOptions.appendChild(makePill(PAIR_MEZCLA_KEY, 'Mezcla de todas', null));
  PAIR_CATEGORY_KEYS.forEach((key) => {
    el.categoryOptions.appendChild(makePill(key, PAIR_CATEGORIES[key].label, PAIR_CATEGORIES[key].pairs.length));
  });
}

function renderSetup() {
  el.playerCountValue.textContent = String(settings.playerCount);
  el.playerMinus.disabled = settings.playerCount <= MIN_PLAYERS;
  el.playerPlus.disabled = settings.playerCount >= MAX_PLAYERS;

  const max = maxImpostorsFor(settings.playerCount);
  el.impostorCountValue.textContent = String(settings.impostorCount);
  el.impostorMinus.disabled = settings.impostorCount <= 1;
  el.impostorPlus.disabled = settings.impostorCount >= max;
  el.impostorHint.textContent = `Máximo ${max} para ${settings.playerCount} jugadores`;

  renderCategoryOptions();
}

function changePlayerCount(delta) {
  settings.playerCount = clamp(settings.playerCount + delta, MIN_PLAYERS, MAX_PLAYERS);
  const max = maxImpostorsFor(settings.playerCount);
  settings.impostorCount = impostorManuallySet ? clamp(settings.impostorCount, 1, max) : suggestedImpostorCount(settings.playerCount);
  renderSetup();
}

function changeImpostorCount(delta) {
  const max = maxImpostorsFor(settings.playerCount);
  settings.impostorCount = clamp(settings.impostorCount + delta, 1, max);
  impostorManuallySet = true;
  renderSetup();
}

/* -------------------------------- Reveal -------------------------------- */

function renderRevealForCurrentPlayer() {
  const playerNumber = round.currentIndex + 1;
  el.revealPlayerLabel.textContent = `Jugador ${playerNumber}`;
  el.revealProgress.textContent = `Jugador ${playerNumber} de ${settings.playerCount}`;

  el.rolePanel.hidden = true;
  el.roleContent.textContent = '';
  el.roleCategoryLabel.textContent = '';
  round.hasRevealedCurrent = false;
  el.btnNextPlayer.disabled = true;
  el.holdBtn.classList.remove('is-held');
  el.holdPrompt.hidden = false;
}

function populateRoleContent() {
  const isImpostor = round.impostorIndices.has(round.currentIndex);
  const concept = isImpostor ? round.pair.b : round.pair.a;
  el.roleCategoryLabel.textContent = `Categoría: ${round.categoryLabel}`;
  el.roleContent.innerHTML = `<span class="concept-emoji">${concept.emoji}</span><span class="concept-name">${concept.nombre}</span>`;
}

function startRevealHold(evt) {
  if (evt) evt.preventDefault();
  if (!round) return;
  populateRoleContent();
  el.rolePanel.hidden = false;
  el.holdPrompt.hidden = true;
  el.holdBtn.classList.add('is-held');
  round.hasRevealedCurrent = true;
  el.btnNextPlayer.disabled = false;
}

function endRevealHold() {
  el.rolePanel.hidden = true;
  el.roleContent.innerHTML = '';
  el.roleCategoryLabel.textContent = '';
  el.holdBtn.classList.remove('is-held');
  if (round) el.holdPrompt.hidden = false;
}

function goToNextPlayer() {
  if (isAdvancing) return;
  if (!round || el.btnNextPlayer.disabled) return;
  isAdvancing = true;
  el.btnNextPlayer.disabled = true;

  round.currentIndex += 1;
  if (round.currentIndex >= settings.playerCount) {
    startDrawPhase();
  } else {
    renderRevealForCurrentPlayer();
  }
  isAdvancing = false;
}

/* ------------------------------ Fase dibujo ------------------------------ */

function clearRoundTimer() {
  if (round && round.timerIntervalId !== null) {
    clearInterval(round.timerIntervalId);
    round.timerIntervalId = null;
  }
}

function updateTimerDisplay() {
  el.timerDisplay.textContent = formatTime(round.timerSeconds);
  el.timerDisplay.classList.toggle('is-finished', round.timerSeconds === 0);
}

function updateTimerToggleLabel() {
  el.timerToggle.textContent = round.timerRunning ? 'Pausar' : 'Reanudar';
}

function tickTimer() {
  if (!round || !round.timerRunning) return;
  if (round.timerSeconds > 0) {
    round.timerSeconds -= 1;
    updateTimerDisplay();
    if (round.timerSeconds === 0) {
      round.timerRunning = false;
      updateTimerToggleLabel();
    }
  }
}

function startDrawPhase() {
  clearRoundTimer();
  round.timerSeconds = DEFAULT_DRAW_SECONDS;
  round.timerRunning = true;
  round.timerIntervalId = setInterval(tickTimer, 1000);
  updateTimerDisplay();
  updateTimerToggleLabel();
  showScreen('draw');
}

function adjustTimer(deltaSeconds) {
  if (!round) return;
  round.timerSeconds = clamp(round.timerSeconds + deltaSeconds, MIN_TIMER_SECONDS, MAX_TIMER_SECONDS);
  updateTimerDisplay();
}

function toggleTimer() {
  if (!round || round.timerSeconds === 0) return;
  round.timerRunning = !round.timerRunning;
  updateTimerToggleLabel();
}

/* -------------------------------- Votación -------------------------------- */

function goToVote() {
  clearRoundTimer();
  round.votes = new Array(settings.playerCount).fill(0);
  renderVoteButtons();
  showScreen('vote');
}

function renderVoteButtons() {
  el.voteButtons.innerHTML = '';
  for (let i = 0; i < settings.playerCount; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'vote-btn';
    btn.innerHTML = `<span>Jugador ${i + 1}</span><span class="vote-count">${round.votes[i]}</span>`;
    btn.addEventListener('click', () => {
      round.votes[i] += 1;
      renderVoteButtons();
    });
    el.voteButtons.appendChild(btn);
  }
}

/* -------------------------------- Resultados -------------------------------- */

function endRound() {
  if (!round) return;

  el.resultsConceptA.innerHTML = `${round.pair.a.emoji} ${round.pair.a.nombre}`;
  el.resultsConceptB.innerHTML = `${round.pair.b.emoji} ${round.pair.b.nombre}`;

  const impostorNumbers = Array.from(round.impostorIndices).map((i) => i + 1).sort((a, b) => a - b);
  el.resultsImpostors.innerHTML = '';
  impostorNumbers.forEach((num) => {
    const li = document.createElement('li');
    li.textContent = `Jugador ${num}`;
    el.resultsImpostors.appendChild(li);
  });

  const maxVotes = Math.max(...round.votes);
  const mostVoted = round.votes
    .map((v, i) => ({ v, i }))
    .filter((x) => x.v === maxVotes && maxVotes > 0)
    .map((x) => x.i + 1);
  const correctGuess = maxVotes > 0 && mostVoted.some((num) => impostorNumbers.includes(num));
  el.resultsVotes.textContent = maxVotes === 0
    ? 'Nadie votó.'
    : `Más votado: Jugador ${mostVoted.join(', Jugador ')} (${maxVotes} voto${maxVotes === 1 ? '' : 's'}). ${correctGuess ? '¡Acertasteis!' : 'No acertasteis.'}`;

  lastPairKey = round.pairKey;
  showScreen('results');
}

/* ---------------------------------- Ronda ----------------------------------- */

function startNewRound() {
  const picked = pickPairForCategory(settings.categoryKey);
  round = {
    pair: picked.pair,
    pairKey: picked.pairKey,
    categoryLabel: picked.categoryLabel,
    impostorIndices: pickImpostorIndices(settings.playerCount, settings.impostorCount),
    currentIndex: 0,
    hasRevealedCurrent: false,
    timerSeconds: DEFAULT_DRAW_SECONDS,
    timerRunning: false,
    timerIntervalId: null,
    votes: []
  };
  showScreen('reveal');
  renderRevealForCurrentPlayer();
}

function backToSetup() {
  clearRoundTimer();
  round = null;
  renderSetup();
  showScreen('setup');
}

function bindEvents() {
  el.playerMinus.addEventListener('click', () => changePlayerCount(-1));
  el.playerPlus.addEventListener('click', () => changePlayerCount(1));
  el.impostorMinus.addEventListener('click', () => changeImpostorCount(-1));
  el.impostorPlus.addEventListener('click', () => changeImpostorCount(1));

  el.btnStart.addEventListener('click', () => { saveSettings(); startNewRound(); });

  const press = (e) => startRevealHold(e);
  const release = (e) => { if (e) e.preventDefault(); endRevealHold(); };
  el.holdBtn.addEventListener('pointerdown', press);
  el.holdBtn.addEventListener('pointerup', release);
  el.holdBtn.addEventListener('pointerleave', release);
  el.holdBtn.addEventListener('pointercancel', release);
  el.holdBtn.addEventListener('touchstart', press, { passive: false });
  el.holdBtn.addEventListener('touchend', release);
  el.holdBtn.addEventListener('touchcancel', release);
  el.holdBtn.addEventListener('contextmenu', (e) => e.preventDefault());
  el.holdBtn.addEventListener('dragstart', (e) => e.preventDefault());

  el.btnNextPlayer.addEventListener('click', goToNextPlayer);

  el.timerMinus.addEventListener('click', () => adjustTimer(-TIMER_STEP));
  el.timerPlus.addEventListener('click', () => adjustTimer(TIMER_STEP));
  el.timerToggle.addEventListener('click', toggleTimer);
  el.btnGoToVote.addEventListener('click', goToVote);

  el.btnReveal.addEventListener('click', endRound);

  el.btnPlayAgain.addEventListener('click', startNewRound);
  el.btnNewGame.addEventListener('click', backToSetup);
}

function init() {
  cacheDom();
  loadSettings();
  renderSetup();
  bindEvents();
  showScreen('setup');
}

document.addEventListener('DOMContentLoaded', init);
