'use strict';

/* =========================================================================
   DIBUJO IMPOSTOR — lógica del juego
   Modos:
    - Concepto parecido: el impostor recibe un concepto parecido y no sabe
      que es el impostor.
    - A ciegas: el impostor sabe que lo es y solo conoce la categoría.
    - Lienzo compartido: un único dibujo en el móvil, un trazo por turno.
   El estado de la ronda vive solo en memoria (nunca en localStorage).
   ========================================================================= */

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 10;
const DRAW_TIME_OPTIONS = [30, 45, 60, 90, 120, 180]; // segundos
const MIN_STROKE_ROUNDS = 1;
const MAX_STROKE_ROUNDS = 3;
const TIMER_STEP = 15;
const SETTINGS_KEY = 'dibujo-impostor-settings-v2';
const LEGACY_SETTINGS_KEY = 'dibujo-impostor-settings-v1';
const RECENT_LIMIT = 40;

const PLAYER_COLORS = ['#e11d48', '#2563eb', '#16a34a', '#f59e0b', '#9333ea', '#0891b2', '#ea580c', '#db2777', '#4d7c0f', '#475569'];

const MODES = [
  { key: 'clasico', emoji: '🎭', label: 'Concepto parecido', sub: 'El impostor dibuja algo parecido… sin saberlo' },
  { key: 'ciego', emoji: '🙈', label: 'A ciegas', sub: 'El impostor solo sabe la categoría' },
  { key: 'lienzo', emoji: '🖌️', label: 'Lienzo compartido', sub: 'Un dibujo en el móvil, un trazo por turno' }
];

/* --------------------------------- Estado ---------------------------------- */

let settings = {
  mode: 'clasico',
  playerCount: 5,
  impostorCount: 1,
  categories: PAIR_CATEGORY_KEYS.slice(),
  drawSeconds: 60,
  strokeRounds: 2,
  showCategory: true,
  secretVote: false
};

let impostorManuallySet = false;
let round = null;
let isAdvancing = false;
const recent = [];
const scores = Kit.createScores();
let timer = null;

/* --------------------------------- Utilidades ------------------------------- */

function maxImpostorsFor(playerCount) {
  return Math.max(1, Math.floor((playerCount - 1) / 2));
}

function suggestedImpostorCount(playerCount) {
  return playerCount >= 7 ? Math.min(2, maxImpostorsFor(playerCount)) : 1;
}

function modeInfo(key) {
  return MODES.find((m) => m.key === key) || MODES[0];
}

function buildPool() {
  const pool = [];
  settings.categories.forEach((key) => {
    const cat = PAIR_CATEGORIES[key];
    if (!cat) return;
    cat.pairs.forEach((pair) => pool.push({ id: `${pair.a.nombre}/${pair.b.nombre}`, pair, key }));
  });
  return pool;
}

function pickFromPool(pool) {
  let candidates = pool.filter((item) => !recent.includes(item.id));
  if (!candidates.length) {
    recent.length = 0;
    candidates = pool;
  }
  const item = Kit.pick(candidates);
  recent.push(item.id);
  if (recent.length > RECENT_LIMIT) recent.shift();
  return item;
}

/* ------------------------------ Persistencia -------------------------------- */

function loadSettings() {
  const saved = Kit.load(SETTINGS_KEY, null);
  const legacy = saved ? null : Kit.load(LEGACY_SETTINGS_KEY, null);
  const parsed = saved || legacy || {};

  if (MODES.some((m) => m.key === parsed.mode)) settings.mode = parsed.mode;
  if (typeof parsed.playerCount === 'number') {
    settings.playerCount = Kit.clamp(Math.round(parsed.playerCount), MIN_PLAYERS, MAX_PLAYERS);
  }
  const max = maxImpostorsFor(settings.playerCount);
  if (typeof parsed.impostorCount === 'number') {
    settings.impostorCount = Kit.clamp(Math.round(parsed.impostorCount), 1, max);
    impostorManuallySet = true;
  } else {
    settings.impostorCount = suggestedImpostorCount(settings.playerCount);
  }
  if (Array.isArray(parsed.categories)) {
    const valid = parsed.categories.filter((k) => PAIR_CATEGORY_KEYS.includes(k));
    if (valid.length) settings.categories = valid;
  } else if (legacy && PAIR_CATEGORY_KEYS.includes(legacy.categoryKey)) {
    settings.categories = [legacy.categoryKey];
  }
  if (DRAW_TIME_OPTIONS.includes(parsed.drawSeconds)) settings.drawSeconds = parsed.drawSeconds;
  if (typeof parsed.strokeRounds === 'number') {
    settings.strokeRounds = Kit.clamp(Math.round(parsed.strokeRounds), MIN_STROKE_ROUNDS, MAX_STROKE_ROUNDS);
  }
  if (typeof parsed.showCategory === 'boolean') settings.showCategory = parsed.showCategory;
  if (typeof parsed.secretVote === 'boolean') settings.secretVote = parsed.secretVote;
}

function saveSettings() {
  // en una sala no se guarda su número de jugadores como el de «mismo móvil»
  Kit.save(SETTINGS_KEY, salaBackup ? Object.assign({}, settings, salaBackup) : settings);
}

/* ---------------------------------- DOM -------------------------------------- */

const el = {};

function cacheDom() {
  [
    'mode-options', 'player-count-value', 'btn-player-minus', 'btn-player-plus',
    'impostor-count-value', 'btn-impostor-minus', 'btn-impostor-plus', 'impostor-hint',
    'names-grid', 'btn-shuffle-names', 'category-options', 'category-summary', 'category-warning',
    'btn-cat-all', 'btn-cat-none', 'draw-time-row', 'time-value', 'btn-time-minus', 'btn-time-plus',
    'stroke-rounds-row', 'strokes-value', 'btn-strokes-minus', 'btn-strokes-plus',
    'show-category-row', 'opt-show-category', 'opt-secret-vote', 'opt-sound', 'opt-vibrate',
    'setup-scoreline', 'setup-score-text', 'btn-reset-scores', 'btn-start-game',
    'game-bar-title', 'btn-exit',
    'reveal-dots', 'reveal-player', 'hold-reveal-btn', 'role-panel', 'role-category-label', 'role-emoji',
    'role-content', 'role-extra', 'btn-next-player',
    'draw-help', 'timer-display', 'timer-ring', 'btn-timer-minus', 'btn-timer-toggle', 'btn-timer-plus',
    'starter-name', 'btn-go-to-vote',
    'canvas-progress', 'canvas-color', 'canvas-player', 'canvas-help', 'canvas', 'canvas-category',
    'btn-canvas-undo', 'btn-canvas-next',
    'vote-drawing', 'vote-area',
    'verdict', 'verdict-emoji', 'verdict-title', 'verdict-text', 'guess-box', 'guess-text',
    'btn-guess-yes', 'btn-guess-no', 'reveal-box', 'results-concept-a', 'results-category',
    'results-alt-wrap', 'results-concept-b', 'results-impostors-label', 'results-impostors', 'vote-summary',
    'results-drawing-wrap', 'results-drawing', 'btn-save-drawing',
    'scoreboard-card', 'scoreboard', 'results-actions', 'btn-play-again', 'btn-new-game'
  ].forEach((id) => {
    el[id.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = document.getElementById(id);
  });
}

/* -------------------------------- Pantalla: Setup ----------------------------- */

// En la sala no hay «Lienzo compartido» (es un dibujo en un solo móvil)
function setupModes() {
  if (!Sala.isHosting()) return MODES;
  const list = MODES.filter((m) => m.key !== 'lienzo');
  if (!list.some((m) => m.key === settings.mode)) settings.mode = list[0].key;
  return list;
}

function renderSetup() {
  Kit.renderOptions(el.modeOptions, setupModes(), {
    className: 'mode-card',
    isSelected: (key) => settings.mode === key,
    onSelect: (key) => {
      settings.mode = key;
      saveSettings();
      renderSetup();
    }
  });

  el.playerCountValue.textContent = String(settings.playerCount);
  el.btnPlayerMinus.disabled = settings.playerCount <= MIN_PLAYERS;
  el.btnPlayerPlus.disabled = settings.playerCount >= MAX_PLAYERS;

  const max = maxImpostorsFor(settings.playerCount);
  el.impostorCountValue.textContent = String(settings.impostorCount);
  el.btnImpostorMinus.disabled = settings.impostorCount <= 1;
  el.btnImpostorPlus.disabled = settings.impostorCount >= max;
  el.impostorHint.textContent = `Máximo ${max} para ${settings.playerCount} jugadores`;

  Kit.renderNameInputs(el.namesGrid, settings.playerCount);

  Kit.renderOptions(el.categoryOptions, PAIR_CATEGORY_KEYS.map((key) => ({
    key,
    emoji: PAIR_CATEGORIES[key].emoji,
    label: PAIR_CATEGORIES[key].label,
    sub: String(PAIR_CATEGORIES[key].pairs.length)
  })), {
    multi: true,
    isSelected: (key) => settings.categories.includes(key),
    onSelect: (key) => {
      settings.categories = settings.categories.includes(key)
        ? settings.categories.filter((k) => k !== key)
        : settings.categories.concat(key);
      saveSettings();
      renderSetup();
    }
  });
  const pool = buildPool();
  el.categorySummary.textContent = `${pool.length} conceptos`;
  el.categoryWarning.hidden = pool.length > 0;
  el.btnStartGame.disabled = pool.length === 0;

  const isCanvas = settings.mode === 'lienzo';
  el.drawTimeRow.hidden = isCanvas;
  el.strokeRoundsRow.hidden = !isCanvas;
  el.showCategoryRow.hidden = settings.mode === 'clasico';

  const idx = DRAW_TIME_OPTIONS.indexOf(settings.drawSeconds);
  el.timeValue.textContent = settings.drawSeconds >= 60 && settings.drawSeconds % 60 === 0
    ? `${settings.drawSeconds / 60}′`
    : `${settings.drawSeconds}″`;
  el.btnTimeMinus.disabled = idx <= 0;
  el.btnTimePlus.disabled = idx >= DRAW_TIME_OPTIONS.length - 1;

  el.strokesValue.textContent = String(settings.strokeRounds);
  el.btnStrokesMinus.disabled = settings.strokeRounds <= MIN_STROKE_ROUNDS;
  el.btnStrokesPlus.disabled = settings.strokeRounds >= MAX_STROKE_ROUNDS;

  el.optShowCategory.checked = settings.showCategory;
  el.optSecretVote.checked = settings.secretVote;

  el.setupScoreline.hidden = scores.rounds === 0;
  el.setupScoreText.textContent = `🏆 Marcador: ${scores.rounds} ${scores.rounds === 1 ? 'ronda' : 'rondas'}`;
}

function changePlayerCount(delta) {
  settings.playerCount = Kit.clamp(settings.playerCount + delta, MIN_PLAYERS, MAX_PLAYERS);
  const max = maxImpostorsFor(settings.playerCount);
  settings.impostorCount = impostorManuallySet
    ? Kit.clamp(settings.impostorCount, 1, max)
    : suggestedImpostorCount(settings.playerCount);
  saveSettings();
  renderSetup();
}

function changeImpostorCount(delta) {
  const max = maxImpostorsFor(settings.playerCount);
  settings.impostorCount = Kit.clamp(settings.impostorCount + delta, 1, max);
  impostorManuallySet = true;
  saveSettings();
  renderSetup();
}

function changeDrawTime(delta) {
  const idx = Kit.clamp(DRAW_TIME_OPTIONS.indexOf(settings.drawSeconds) + delta, 0, DRAW_TIME_OPTIONS.length - 1);
  settings.drawSeconds = DRAW_TIME_OPTIONS[idx];
  saveSettings();
  renderSetup();
}

function changeStrokeRounds(delta) {
  settings.strokeRounds = Kit.clamp(settings.strokeRounds + delta, MIN_STROKE_ROUNDS, MAX_STROKE_ROUNDS);
  saveSettings();
  renderSetup();
}

/* -------------------------------- Pantalla: Reparto ----------------------------- */

function renderRevealForCurrentPlayer() {
  const i = round.current;
  el.revealPlayer.textContent = round.names[i];
  el.revealDots.innerHTML = round.names
    .map((_, idx) => `<li class="${idx < i ? 'is-done' : idx === i ? 'is-current' : ''}"></li>`)
    .join('');
  clearRole();
  el.btnNextPlayer.disabled = true;
  el.btnNextPlayer.textContent = i === round.names.length - 1 ? 'Ya lo vi, ¡a dibujar!' : 'Ya lo vi, pasar al siguiente';
}

function clearRole() {
  el.holdRevealBtn.classList.remove('is-held');
  el.rolePanel.classList.remove('is-alert');
  el.roleCategoryLabel.textContent = '';
  el.roleEmoji.textContent = '';
  el.roleContent.textContent = '';
  el.roleContent.className = 'role-content';
  el.roleExtra.textContent = '';
}

/** Lo que ve el jugador i en su carta (también lo usa la sala). */
function roleCard(r, i) {
  const isImpostor = r.impostors.has(i);
  const catText = `Categoría: ${r.catLabel}`;
  if (r.mode === 'clasico' || !isImpostor) {
    // En «Concepto parecido» el impostor ve un concepto normal, sin pistas.
    const concept = isImpostor ? r.pair.b : r.pair.a;
    return {
      label: catText, emoji: concept.emoji, content: concept.nombre,
      extra: r.mode === 'lienzo' ? 'Un trazo por turno, ¡sin ponérselo fácil!' : 'Dibújalo sin letras ni números'
    };
  }
  return {
    label: settings.showCategory ? catText : 'Categoría secreta', emoji: '🕵️', content: 'Eres el impostor',
    extra: r.mode === 'lienzo' ? 'Mira los trazos de los demás y síguele la corriente' : 'Dibuja algo que no te delate',
    alert: true, impostor: true
  };
}

function populateRole() {
  const c = roleCard(round, round.current);
  el.rolePanel.classList.toggle('is-alert', Boolean(c.alert));
  el.roleCategoryLabel.textContent = c.label;
  el.roleEmoji.textContent = c.emoji;
  el.roleContent.textContent = c.content;
  el.roleContent.classList.toggle('is-impostor', Boolean(c.impostor));
  el.roleExtra.textContent = c.extra;
}

function startRevealHold() {
  if (!round) return;
  populateRole();
  el.holdRevealBtn.classList.add('is-held');
  el.btnNextPlayer.disabled = false;
  Kit.buzz(20);
}

function endRevealHold() {
  el.holdRevealBtn.classList.remove('is-held');
  setTimeout(() => {
    if (!el.holdRevealBtn.classList.contains('is-held')) clearRole();
  }, 300);
}

function goToNextPlayer() {
  if (isAdvancing || !round || el.btnNextPlayer.disabled) return;
  isAdvancing = true;
  clearRole();
  round.current += 1;
  if (round.current >= round.names.length) {
    if (round.mode === 'lienzo') startCanvasPhase();
    else startDrawPhase();
  } else {
    renderRevealForCurrentPlayer();
    Kit.sfx.tap();
  }
  isAdvancing = false;
}

/* ---------------------------- Fase dibujo en papel ---------------------------- */

function startDrawPhase() {
  el.drawHelp.innerHTML = round.mode === 'ciego'
    ? 'Cada uno dibuja su concepto en un papel, <strong>sin enseñarlo</strong>. El impostor solo conoce la categoría: ¡que no se note!'
    : 'Cada uno dibuja su concepto en un papel, <strong>sin enseñarlo</strong> todavía. Nada de letras ni números.';
  el.starterName.textContent = Kit.pick(round.names);
  timer.start(settings.drawSeconds);
  Kit.sfx.reveal();
  Kit.showScreen('draw');
}

/* ----------------------------- Lienzo compartido ------------------------------ */

const canvasState = {
  ctx: null,
  strokes: [],   // { color, points: [[x, y], ...] } en coordenadas 0..1
  pending: null, // trazo del turno actual, aún sin confirmar
  drawing: false,
  turn: 0,
  totalTurns: 0,
  order: []
};

function sizeCanvas() {
  const c = el.canvas;
  const rect = c.getBoundingClientRect();
  if (!rect.width) return;
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  c.width = Math.round(rect.width * dpr);
  c.height = Math.round(rect.height * dpr);
  canvasState.ctx = c.getContext('2d');
  redrawCanvas();
}

function drawStroke(ctx, stroke, w, h) {
  const pts = stroke.points;
  if (!pts.length) return;
  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.color;
  ctx.lineWidth = Math.max(3, w * 0.012);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (pts.length === 1) {
    ctx.beginPath();
    ctx.arc(pts[0][0] * w, pts[0][1] * h, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(pts[0][0] * w, pts[0][1] * h);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = ((pts[i][0] + pts[i + 1][0]) / 2) * w;
    const my = ((pts[i][1] + pts[i + 1][1]) / 2) * h;
    ctx.quadraticCurveTo(pts[i][0] * w, pts[i][1] * h, mx, my);
  }
  const last = pts[pts.length - 1];
  ctx.lineTo(last[0] * w, last[1] * h);
  ctx.stroke();
}

function paintAll(ctx, w, h) {
  ctx.fillStyle = '#fbf7ef';
  ctx.fillRect(0, 0, w, h);
  canvasState.strokes.forEach((s) => drawStroke(ctx, s, w, h));
  if (canvasState.pending) drawStroke(ctx, canvasState.pending, w, h);
}

function redrawCanvas() {
  const { ctx } = canvasState;
  if (!ctx) return;
  paintAll(ctx, el.canvas.width, el.canvas.height);
}

function canvasPoint(e) {
  const rect = el.canvas.getBoundingClientRect();
  return [
    Kit.clamp((e.clientX - rect.left) / rect.width, 0, 1),
    Kit.clamp((e.clientY - rect.top) / rect.height, 0, 1)
  ];
}

function currentCanvasPlayer() {
  return canvasState.order[canvasState.turn % canvasState.order.length];
}

function renderCanvasTurn() {
  const p = currentCanvasPlayer();
  const lap = Math.floor(canvasState.turn / canvasState.order.length) + 1;
  el.canvasProgress.textContent = `Trazo ${canvasState.turn + 1} de ${canvasState.totalTurns} · Vuelta ${lap} de ${settings.strokeRounds}`;
  el.canvasPlayer.textContent = round.names[p];
  el.canvasColor.style.setProperty('--dot', PLAYER_COLORS[p % PLAYER_COLORS.length]);
  el.canvasCategory.textContent = settings.showCategory ? round.catLabel : '';
  el.btnCanvasUndo.disabled = !canvasState.pending;
  el.btnCanvasNext.disabled = !canvasState.pending;
  el.btnCanvasNext.textContent = canvasState.turn + 1 >= canvasState.totalTurns ? 'Terminar y votar ▶' : 'Listo, siguiente ▶';
}

function startCanvasPhase() {
  const n = round.names.length;
  const first = Math.floor(Math.random() * n);
  canvasState.order = Array.from({ length: n }, (_, i) => (first + i) % n);
  canvasState.strokes = [];
  canvasState.pending = null;
  canvasState.turn = 0;
  canvasState.totalTurns = n * settings.strokeRounds;
  Kit.sfx.reveal();
  Kit.showScreen('canvas');
  sizeCanvas();
  renderCanvasTurn();
}

function onCanvasDown(e) {
  if (!round || round.mode !== 'lienzo' || canvasState.pending) return;
  e.preventDefault();
  try { el.canvas.setPointerCapture(e.pointerId); } catch (err) { /* sin captura */ }
  const p = currentCanvasPlayer();
  canvasState.pending = { color: PLAYER_COLORS[p % PLAYER_COLORS.length], points: [canvasPoint(e)] };
  canvasState.drawing = true;
  redrawCanvas();
}

function onCanvasMove(e) {
  if (!canvasState.drawing || !canvasState.pending) return;
  e.preventDefault();
  const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
  events.forEach((ev) => canvasState.pending.points.push(canvasPoint(ev)));
  redrawCanvas();
}

function onCanvasUp() {
  if (!canvasState.drawing) return;
  canvasState.drawing = false;
  Kit.buzz(15);
  renderCanvasTurn();
}

function undoCanvasStroke() {
  canvasState.pending = null;
  canvasState.drawing = false;
  redrawCanvas();
  renderCanvasTurn();
}

function nextCanvasTurn() {
  if (!canvasState.pending) return;
  canvasState.strokes.push(canvasState.pending);
  canvasState.pending = null;
  canvasState.turn += 1;
  Kit.sfx.tap();
  if (canvasState.turn >= canvasState.totalTurns) {
    round.drawingUrl = exportDrawing();
    startVote();
  } else {
    renderCanvasTurn();
  }
}

/** Exporta el dibujo a PNG a tamaño fijo (independiente de la pantalla). */
function exportDrawing() {
  const size = 900;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  paintAll(c.getContext('2d'), size, size);
  return c.toDataURL('image/png');
}

/* -------------------------------- Votación -------------------------------- */

function startVote() {
  timer.stop();
  el.voteDrawing.hidden = !round.drawingUrl;
  if (round.drawingUrl) el.voteDrawing.src = round.drawingUrl;
  Kit.runVote(el.voteArea, {
    names: round.names,
    secret: settings.secretVote,
    onDone: finishVote
  });
  Kit.showScreen('vote');
}

function finishVote(result) {
  const k = round.impostors.size;
  round.vote = result;
  round.tally = Kit.tally(result, k);
  const caught = round.tally.accused.filter((i) => round.impostors.has(i));
  round.allCaught = caught.length === k;

  el.guessBox.hidden = true;
  el.revealBox.hidden = true;
  el.scoreboardCard.hidden = true;
  el.resultsActions.hidden = true;
  Kit.showScreen('results');

  // Si el impostor sabía que lo era, aún puede ganar adivinando el concepto.
  if (round.allCaught && round.mode !== 'clasico') {
    askForGuess();
  } else {
    finalizeRound(false);
  }
}

/* -------------------------------- Resultados -------------------------------- */

function setVerdict(type, emoji, title, text) {
  el.verdict.className = 'verdict' + (type ? ` is-${type}` : '');
  el.verdictEmoji.textContent = emoji;
  el.verdictTitle.textContent = title;
  el.verdictText.innerHTML = text;
  el.verdictEmoji.style.animation = 'none';
  void el.verdictEmoji.offsetWidth;
  el.verdictEmoji.style.animation = '';
}

function namesOf(indices) {
  return indices.map((i) => `<strong>${Kit.esc(round.names[i])}</strong>`).join(' y ');
}

function impostorList() {
  return Array.from(round.impostors).sort((a, b) => a - b);
}

function askForGuess() {
  const imps = impostorList();
  const plural = imps.length > 1;
  setVerdict('', '🎯', plural ? '¡Pillados!' : '¡Pillado!',
    `Habéis descubierto a ${namesOf(imps)}. Pero aún ${plural ? 'pueden' : 'puede'} ganar…`);
  el.guessText.innerHTML = `Última oportunidad: ${namesOf(imps)}, decid en voz alta qué creéis que estaba dibujando el grupo.`;
  el.guessBox.hidden = false;
  Kit.sfx.reveal();
}

function finalizeRound(guessed) {
  const imps = impostorList();
  const k = imps.length;
  const t = round.tally;
  const crew = round.names.map((_, i) => i).filter((i) => !round.impostors.has(i));
  const crewWins = round.allCaught && !guessed;

  scores.startRound();
  if (crewWins) {
    setVerdict('win', '🎉', k > 1 ? '¡Impostores descubiertos!' : '¡Impostor descubierto!',
      `Ojo de halcón: ${namesOf(imps)} no ${k > 1 ? 'pudieron' : 'pudo'} engañaros. El grupo gana 1 punto cada uno.`);
    crew.forEach((i) => scores.add(round.names[i], 1));
  } else {
    if (round.allCaught && guessed) {
      setVerdict('lose', '😈', '¡Os la ha colado!', `Pillasteis a ${namesOf(imps)}, pero ${k > 1 ? 'adivinaron' : 'adivinó'} el concepto. 2 puntos por impostor.`);
    } else if (t.tie) {
      setVerdict('lose', '🤝', 'Empate en la votación', `No se expulsa a nadie y ${k > 1 ? 'los impostores se escapan' : 'el impostor se escapa'}. 2 puntos por impostor.`);
    } else {
      const innocents = t.accused.filter((i) => !round.impostors.has(i));
      setVerdict('lose', '😬', innocents.length ? '¡Acusasteis a un inocente!' : 'El impostor se ha librado',
        (innocents.length ? `${namesOf(innocents)} dibujaba lo mismo que el resto. ` : '') +
        `${namesOf(imps)} gana${k > 1 ? 'n' : ''} 2 puntos.`);
    }
    imps.forEach((i) => scores.add(round.names[i], 2));
  }
  scores.endRound();

  if (crewWins) {
    Kit.sfx.win();
    Kit.confetti(['#f97316', '#f43f5e', '#facc15', '#fbf7ef', '#22c55e']);
  } else {
    Kit.sfx.lose();
  }
  Kit.buzz(crewWins ? [60, 40, 60] : 200);

  renderRevealBox();
  scores.render(el.scoreboard, round.names);
  el.guessBox.hidden = true;
  el.scoreboardCard.hidden = false;
  el.resultsActions.hidden = false;
}

function renderRevealBox() {
  const imps = impostorList();
  el.resultsConceptA.textContent = `${round.pair.a.emoji} ${round.pair.a.nombre}`;
  el.resultsCategory.textContent = `${round.catEmoji} ${round.catLabel}`;
  el.resultsAltWrap.hidden = round.mode !== 'clasico';
  el.resultsConceptB.textContent = `${round.pair.b.emoji} ${round.pair.b.nombre}`;
  el.resultsImpostorsLabel.textContent = imps.length > 1 ? 'Los impostores eran' : 'El impostor era';
  el.resultsImpostors.innerHTML = imps.map((i) => `<li>${Kit.esc(round.names[i])}</li>`).join('');

  const ranked = round.vote.votes
    .map((v, i) => ({ v, name: round.names[i] }))
    .filter((x) => x.v > 0)
    .sort((a, b) => b.v - a.v);
  el.voteSummary.textContent = ranked.length ? 'Votos: ' + ranked.map((x) => `${x.name} ${x.v}`).join(' · ') : '';

  el.resultsDrawingWrap.hidden = !round.drawingUrl;
  if (round.drawingUrl) {
    el.resultsDrawing.src = round.drawingUrl;
    el.btnSaveDrawing.href = round.drawingUrl;
    el.btnSaveDrawing.download = `dibujo-impostor-${round.pair.a.nombre.toLowerCase().replace(/\s+/g, '-')}.png`;
  }
  el.revealBox.hidden = false;
}

/* ---------------------------------- Ronda ----------------------------------- */

function startNewRound() {
  const pool = buildPool();
  if (!pool.length) {
    backToSetup();
    return;
  }
  const n = settings.playerCount;
  const item = pickFromPool(pool);
  const cat = PAIR_CATEGORIES[item.key];

  round = {
    mode: settings.mode,
    names: Kit.playerNames(n),
    impostors: Kit.pickIndices(n, Kit.clamp(settings.impostorCount, 1, maxImpostorsFor(n))),
    pair: item.pair,
    catLabel: cat.label,
    catEmoji: cat.emoji,
    current: 0,
    vote: null,
    tally: null,
    allCaught: false,
    drawingUrl: null
  };

  el.gameBarTitle.textContent = `Ronda ${scores.rounds + 1} · ${modeInfo(round.mode).label}`;
  Kit.keepAwake(true);
  Kit.showScreen('reveal');
  renderRevealForCurrentPlayer();
}

function backToSetup() {
  if (timer) timer.stop();
  round = null;
  Kit.keepAwake(false);
  renderSetup();
  Kit.showScreen('setup');
}

function confirmExit() {
  if (!round) return true;
  return window.confirm('¿Salir de la partida? Se perderá la ronda actual (el marcador se mantiene).');
}

/* --------------------------- Con código de sala ------------------------------ */

// Mientras se configura una sala, los jugadores son los que han entrado:
// aquí se guarda el número de «mismo móvil» para devolverlo al salir.
let salaBackup = null;

function salaHosting(on, players) {
  if (on) {
    if (!salaBackup) salaBackup = { playerCount: settings.playerCount };
    settings.playerCount = Kit.clamp(players, MIN_PLAYERS, MAX_PLAYERS);
    settings.impostorCount = Kit.clamp(settings.impostorCount, 1, maxImpostorsFor(settings.playerCount));
  } else if (salaBackup) {
    settings.playerCount = salaBackup.playerCount;
    salaBackup = null;
  }
  renderSetup();
}

/** Reparto de una ronda de sala para n jugadores, con los ajustes actuales. */
function salaDeal(n) {
  const pool = buildPool();
  if (!pool.length) return { error: 'Elige al menos una categoría' };
  const item = pickFromPool(pool);
  const cat = PAIR_CATEGORIES[item.key];
  const r = {
    mode: settings.mode, impostors: Kit.pickIndices(n, Kit.clamp(settings.impostorCount, 1, maxImpostorsFor(n))),
    pair: item.pair, catLabel: cat.label, catEmoji: cat.emoji
  };
  return {
    cards: Array.from({ length: n }, (_, i) => roleCard(r, i)),
    special: Array.from(r.impostors),
    info: { mode: r.mode, a: r.pair.a, b: r.pair.b, catLabel: r.catLabel, catEmoji: r.catEmoji },
    title: modeInfo(r.mode).label,
    help: r.mode === 'ciego'
      ? 'Cada uno dibuja su concepto en un papel, <strong>sin enseñarlo</strong>. El impostor solo conoce la categoría: ¡que no se note! Al acabar el tiempo, enseñad los dibujos a la vez.'
      : 'Cada uno dibuja su concepto en un papel, <strong>sin enseñarlo</strong> todavía. Nada de letras ni números. Al acabar el tiempo, enseñad los dibujos a la vez.',
    seconds: settings.drawSeconds,
    voteTitle: '¿Quién dibujó algo raro?'
  };
}

Sala.configure({
  id: 'dibujo',
  maxPlayers: MAX_PLAYERS,
  timerStep: TIMER_STEP,
  holdPrompt: 'Mantén pulsado para ver qué dibujar',
  who: { one: 'impostor', many: 'impostores', One: 'Impostor', Many: 'Impostores', the: 'el impostor', The: 'El impostor' },
  hosting: salaHosting,
  deal: salaDeal,
  resultsHtml(info, { names, special, esc }) {
    const k = special.length;
    return '<p class="results-label">El concepto era</p>' +
      `<p class="results-word">${esc(`${info.a.emoji} ${info.a.nombre}`)}</p>` +
      `<p class="results-meta">${esc(`${info.catEmoji} ${info.catLabel}`)}</p>` +
      (info.mode === 'clasico' ? `<p class="results-label">${k > 1 ? 'Los impostores dibujaban' : 'El impostor dibujaba'}</p><p class="results-word is-alt">${esc(`${info.b.emoji} ${info.b.nombre}`)}</p>` : '') +
      `<p class="results-label">${k > 1 ? 'Los impostores eran' : 'El impostor era'}</p>` +
      `<ul class="chips">${special.slice().sort((a, b) => a - b).map((i) => `<li>${esc(names[i])}</li>`).join('')}</ul>`;
  }
});

/* --------------------------------- Eventos ----------------------------------- */

function bindEvents() {
  el.btnPlayerMinus.addEventListener('click', () => changePlayerCount(-1));
  el.btnPlayerPlus.addEventListener('click', () => changePlayerCount(1));
  el.btnImpostorMinus.addEventListener('click', () => changeImpostorCount(-1));
  el.btnImpostorPlus.addEventListener('click', () => changeImpostorCount(1));
  el.btnTimeMinus.addEventListener('click', () => changeDrawTime(-1));
  el.btnTimePlus.addEventListener('click', () => changeDrawTime(1));
  el.btnStrokesMinus.addEventListener('click', () => changeStrokeRounds(-1));
  el.btnStrokesPlus.addEventListener('click', () => changeStrokeRounds(1));
  el.btnShuffleNames.addEventListener('click', () => {
    Kit.shuffleNames(el.namesGrid, settings.playerCount);
    Kit.toast('Orden mezclado 🔀');
  });
  el.btnCatAll.addEventListener('click', () => {
    settings.categories = PAIR_CATEGORY_KEYS.slice();
    saveSettings();
    renderSetup();
  });
  el.btnCatNone.addEventListener('click', () => {
    settings.categories = [];
    saveSettings();
    renderSetup();
  });

  el.optShowCategory.addEventListener('change', () => {
    settings.showCategory = el.optShowCategory.checked;
    saveSettings();
  });
  el.optSecretVote.addEventListener('change', () => {
    settings.secretVote = el.optSecretVote.checked;
    saveSettings();
  });
  Kit.bindPrefToggle(el.optSound, 'sound');
  Kit.bindPrefToggle(el.optVibrate, 'vibrate');

  el.btnResetScores.addEventListener('click', () => {
    scores.reset();
    renderSetup();
    Kit.toast('Marcador a cero');
  });

  el.btnStartGame.addEventListener('click', () => {
    saveSettings();
    try { history.pushState({ inGame: true }, ''); } catch (err) { /* sin historial */ }
    startNewRound();
  });

  Kit.bindHold(el.holdRevealBtn, startRevealHold, endRevealHold);
  el.btnNextPlayer.addEventListener('click', goToNextPlayer);

  timer = Kit.createTimer({
    display: el.timerDisplay,
    ring: el.timerRing,
    toggleBtn: el.btnTimerToggle,
    onEnd: () => Kit.toast('⏰ ¡Lápices arriba!')
  });
  el.btnTimerMinus.addEventListener('click', () => timer.adjust(-TIMER_STEP));
  el.btnTimerPlus.addEventListener('click', () => timer.adjust(TIMER_STEP));
  el.btnTimerToggle.addEventListener('click', () => timer.toggle());
  el.btnGoToVote.addEventListener('click', startVote);

  el.canvas.addEventListener('pointerdown', onCanvasDown);
  el.canvas.addEventListener('pointermove', onCanvasMove);
  el.canvas.addEventListener('pointerup', onCanvasUp);
  el.canvas.addEventListener('pointercancel', onCanvasUp);
  el.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  el.btnCanvasUndo.addEventListener('click', undoCanvasStroke);
  el.btnCanvasNext.addEventListener('click', nextCanvasTurn);
  window.addEventListener('resize', () => {
    if (round && round.mode === 'lienzo' && document.body.dataset.screen === 'canvas') sizeCanvas();
  });

  el.btnGuessYes.addEventListener('click', () => finalizeRound(true));
  el.btnGuessNo.addEventListener('click', () => finalizeRound(false));

  el.btnPlayAgain.addEventListener('click', startNewRound);
  el.btnNewGame.addEventListener('click', backToSetup);
  el.btnExit.addEventListener('click', () => {
    if (confirmExit()) backToSetup();
  });

  window.addEventListener('popstate', () => {
    if (!round) return;
    if (confirmExit()) {
      backToSetup();
    } else {
      try { history.pushState({ inGame: true }, ''); } catch (err) { /* sin historial */ }
    }
  });
}

function init() {
  cacheDom();
  loadSettings();
  bindEvents();
  renderSetup();
  Kit.showScreen('setup');
}

document.addEventListener('DOMContentLoaded', init);
