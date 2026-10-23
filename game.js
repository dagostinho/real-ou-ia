"use strict";

// Embaralha a ordem das rodadas a cada partida (quem assiste não decora a sequência)
const SHUFFLE_ROUNDS = true;
const STATS_KEY = "realOuIa.stats";
const MUTE_KEY = "realOuIa.muted";

const $ = (selector) => document.querySelector(selector);

const screens = {
  start: $("#screen-start"),
  round: $("#screen-round"),
  result: $("#screen-result"),
  stats: $("#screen-stats"),
};

const TOTAL = QUESTIONS.length;

let order = [];
let current = 0;
let score = 0;
let locked = false;

// ---------- armazenamento (falha em silêncio, o jogo funciona sem ele) ----------
function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // sem armazenamento: só não guarda as estatísticas
  }
}

function readStats() {
  return readStorage(STATS_KEY, { plays: 0, totalScore: 0, best: null });
}

// ---------- som (sintetizado no código, não precisa de arquivos) ----------
let audioCtx = null;
let muted = readStorage(MUTE_KEY, false);

// No iPad o som só funciona depois de um toque do usuário
function unlockAudio() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) audioCtx = new Ctx();
  }
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
}

function tone(freq, delay, duration, type = "sine", volume = 0.2, slideTo = null) {
  if (muted || !audioCtx) return;
  const t0 = audioCtx.currentTime + delay;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

const sounds = {
  start: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.08, 0.18, "square", 0.12)),
  click: () => tone(880, 0, 0.08, "triangle", 0.15),
  correct: () => [659, 880, 1175].forEach((f, i) => tone(f, i * 0.09, 0.22, "triangle", 0.22)),
  wrong: () => {
    tone(220, 0, 0.35, "sawtooth", 0.16, 90);
    tone(165, 0, 0.35, "square", 0.09, 70);
  },
  win: () => [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.11, 0.25, "square", 0.14)),
  lose: () => [392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.18, 0.3, "sawtooth", 0.14)),
};

function updateMuteButton() {
  $("#mute").textContent = muted ? "🔇" : "🔊";
}

// ---------- confete ----------
const confettiCanvas = $("#confetti");
const confettiCtx = confettiCanvas.getContext("2d");
const CONFETTI_COLORS = ["#00e5ff", "#ff2bd6", "#39ff88", "#ffd34d", "#ffffff"];

function launchConfetti() {
  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  confettiCanvas.width = width * dpr;
  confettiCanvas.height = height * dpr;
  confettiCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const pieces = Array.from({ length: 160 }, () => ({
    x: Math.random() * width,
    y: -20 - Math.random() * height * 0.5,
    size: 6 + Math.random() * 8,
    speedY: 2.5 + Math.random() * 4,
    speedX: -2 + Math.random() * 4,
    angle: Math.random() * Math.PI * 2,
    spin: -0.2 + Math.random() * 0.4,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
  }));

  const startedAt = performance.now();

  function frame(now) {
    confettiCtx.clearRect(0, 0, width, height);
    let visible = 0;
    for (const p of pieces) {
      p.x += p.speedX;
      p.y += p.speedY;
      p.angle += p.spin;
      if (p.y < height + 20) visible++;
      confettiCtx.save();
      confettiCtx.translate(p.x, p.y);
      confettiCtx.rotate(p.angle);
      confettiCtx.fillStyle = p.color;
      confettiCtx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      confettiCtx.restore();
    }
    if (visible > 0 && now - startedAt < 6000) {
      requestAnimationFrame(frame);
    } else {
      confettiCtx.clearRect(0, 0, width, height);
    }
  }
  requestAnimationFrame(frame);
}

// ---------- telas ----------
function show(name) {
  for (const [key, el] of Object.entries(screens)) {
    el.classList.toggle("active", key === name);
  }
}

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
}

function startGame() {
  unlockAudio();
  sounds.start();
  order = QUESTIONS.map((_, i) => i);
  if (SHUFFLE_ROUNDS) shuffle(order);
  current = 0;
  score = 0;
  show("round");
  renderRound();
}

function makeCard(src, tag = "button") {
  const card = document.createElement(tag);
  card.className = "card";
  const img = document.createElement("img");
  img.src = src;
  img.alt = "";
  img.draggable = false;
  const badge = document.createElement("span");
  badge.className = "badge";
  card.append(img, badge);
  return card;
}

// A célula limita o cartão a um retângulo 4:3, para a foto nunca ser cortada
function makeCell(card) {
  const cell = document.createElement("div");
  cell.className = "cell";
  cell.append(card);
  return cell;
}

function renderRound() {
  const q = QUESTIONS[order[current]];
  locked = false;

  $("#round-label").textContent = `RODADA ${current + 1}/${TOTAL}`;
  $("#score-label").textContent = `ACERTOS ${score}`;
  $("#progress-bar").style.width = `${(current / TOTAL) * 100}%`;
  $("#feedback").hidden = true;

  const stage = $("#stage");
  stage.replaceChildren();
  // reinicia a animação de entrada
  stage.className = "stage";
  void stage.offsetWidth;
  stage.className = `stage ${q.type}`;

  if (q.type === "pair") {
    $("#prompt").textContent = "Qual dessas imagens é REAL?";
    $("#answers").hidden = true;
    q.images.forEach((src, index) => {
      const card = makeCard(src);
      card.addEventListener("click", () => answerPair(q, index));
      stage.append(makeCell(card));
    });
  } else {
    $("#prompt").textContent = "Esta imagem é REAL ou feita por IA?";
    $("#answers").hidden = false;
    stage.append(makeCell(makeCard(q.image, "div")));
  }
}

function setBadge(card, isReal) {
  const badge = card.querySelector(".badge");
  badge.textContent = isReal ? "REAL" : "IA";
  badge.classList.add(isReal ? "is-real" : "is-ai");
}

function answerPair(q, chosen) {
  if (locked) return;
  locked = true;

  const cards = $("#stage").querySelectorAll(".card");
  const correct = chosen === q.real;

  cards.forEach((card, index) => {
    setBadge(card, index === q.real);
    card.classList.add("revealed");
    if (index === q.real) card.classList.add("correct-card");
    else if (index === chosen) card.classList.add("wrong-card");
    else card.classList.add("dim");
  });

  finishAnswer(q, correct);
}

function answerSingle(q, saidReal) {
  if (locked) return;
  locked = true;

  const card = $("#stage").querySelector(".card");
  const correct = saidReal === q.isReal;

  setBadge(card, q.isReal);
  card.classList.add("revealed", correct ? "correct-card" : "wrong-card");
  $("#answers").hidden = true;

  finishAnswer(q, correct);
}

function finishAnswer(q, correct) {
  if (correct) {
    score++;
    sounds.correct();
  } else {
    sounds.wrong();
  }

  $("#score-label").textContent = `ACERTOS ${score}`;
  $("#progress-bar").style.width = `${((current + 1) / TOTAL) * 100}%`;

  const title = $("#feedback-title");
  title.textContent = correct ? "ACERTOU!" : "ERROU!";
  title.className = correct ? "ok" : "bad";
  $("#feedback-tip").textContent = q.tip;
  $("#btn-next").textContent = current + 1 >= TOTAL ? "VER RESULTADO" : "PRÓXIMA ▶";
  $("#feedback").hidden = false;
}

function nextRound() {
  sounds.click();
  current++;
  if (current >= TOTAL) showResult();
  else renderRound();
}

// ---------- resultado ----------
const VERDICTS = [
  { min: 10, title: "DETECTOR DE IA NÍVEL MÁXIMO", text: "Nota máxima! Quase nada engana você." },
  { min: 8, title: "OLHO DE ÁGUIA", text: "Muito bom! Você percebe a maioria dos truques da IA." },
  { min: 6, title: "QUASE LÁ", text: "Mais da metade certa. Mas a IA ainda te pegou em algumas." },
  { min: 4, title: "A IA TE ENGANOU", text: "As imagens falsas são cada vez mais convincentes, não é?" },
  { min: 0, title: "A IA ESTÁ GANHANDO!", text: "Não se preocupe, até especialistas erram. Tente de novo!" },
];

function formatNumber(value) {
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

function saveResult() {
  const stats = readStats();
  stats.plays++;
  stats.totalScore += score;
  stats.best = stats.best === null ? score : Math.max(stats.best, score);
  writeStorage(STATS_KEY, stats);
  return stats;
}

function showResult() {
  const stats = saveResult();
  const verdict = VERDICTS.find((v) => score >= v.min);

  $("#result-total").textContent = TOTAL;
  $("#result-title").textContent = verdict.title;
  $("#result-text").textContent = verdict.text;
  $("#result-avg").textContent =
    `MÉDIA DOS VISITANTES: ${formatNumber(stats.totalScore / stats.plays)}/${TOTAL} · ${stats.plays} ${stats.plays === 1 ? "JOGADOR" : "JOGADORES"}`;

  const pips = $("#pips");
  pips.replaceChildren();
  for (let i = 0; i < TOTAL; i++) {
    const pip = document.createElement("span");
    pip.className = "pip";
    pip.style.transitionDelay = `${i * 0.12}s`;
    pips.append(pip);
  }

  $("#result-score").textContent = "0";
  show("result");

  // acende os quadradinhos e conta a nota subindo
  requestAnimationFrame(() => {
    pips.querySelectorAll(".pip").forEach((pip, i) => pip.classList.toggle("on", i < score));
  });
  let shown = 0;
  const counter = setInterval(() => {
    if (shown >= score) return clearInterval(counter);
    shown++;
    $("#result-score").textContent = shown;
    tone(440 + shown * 60, 0, 0.1, "triangle", 0.12);
  }, 120);

  if (score >= 7) {
    setTimeout(() => {
      sounds.win();
      launchConfetti();
    }, 300 + score * 120);
  } else {
    setTimeout(sounds.lose, 300 + score * 120);
  }
}

// ---------- estatísticas ----------
function showStats() {
  const stats = readStats();
  $("#stat-plays").textContent = stats.plays;
  $("#stat-avg").textContent = stats.plays ? formatNumber(stats.totalScore / stats.plays) : "–";
  $("#stat-best").textContent = stats.best === null ? "–" : stats.best;
  show("stats");
}

function resetStats() {
  if (window.confirm("Zerar as estatísticas de todos os jogadores deste iPad?")) {
    writeStorage(STATS_KEY, { plays: 0, totalScore: 0, best: null });
    showStats();
  }
}

// ---------- eventos ----------
$("#btn-start").addEventListener("click", startGame);
$("#btn-again").addEventListener("click", startGame);
$("#btn-next").addEventListener("click", nextRound);
$("#btn-home").addEventListener("click", () => {
  unlockAudio();
  sounds.click();
  show("start");
});
$("#btn-stats").addEventListener("click", () => {
  unlockAudio();
  sounds.click();
  showStats();
});
$("#btn-stats-back").addEventListener("click", () => {
  sounds.click();
  show("start");
});
$("#btn-stats-reset").addEventListener("click", resetStats);

document.querySelectorAll("[data-answer]").forEach((button) => {
  button.addEventListener("click", () => {
    const q = QUESTIONS[order[current]];
    answerSingle(q, button.dataset.answer === "real");
  });
});

$("#mute").addEventListener("click", () => {
  muted = !muted;
  writeStorage(MUTE_KEY, muted);
  updateMuteButton();
  unlockAudio();
  sounds.click();
});
updateMuteButton();

// Sair no meio da partida: pede confirmação e não registra nada nas estatísticas
const quitModal = $("#modal-quit");

function closeQuitModal() {
  quitModal.hidden = true;
}

$("#btn-quit").addEventListener("click", () => {
  sounds.click();
  quitModal.hidden = false;
});
$("#btn-quit-stay").addEventListener("click", () => {
  sounds.click();
  closeQuitModal();
});
$("#btn-quit-confirm").addEventListener("click", () => {
  sounds.click();
  closeQuitModal();
  show("start");
});
// tocar fora da caixa equivale a continuar jogando
quitModal.addEventListener("click", (event) => {
  if (event.target === quitModal) closeQuitModal();
});

// Evita o zoom por gesto de pinça no iPad
document.addEventListener("gesturestart", (event) => event.preventDefault());

// Pré-carrega as imagens para a primeira rodada não piscar
QUESTIONS.forEach((q) => {
  (q.type === "pair" ? q.images : [q.image]).forEach((src) => {
    new Image().src = src;
  });
});

// ---------- modo offline ----------
function setOfflineBadge(state, text) {
  const badge = $("#offline-badge");
  badge.className = `offline-badge ${state}`;
  badge.textContent = text;
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {
    setOfflineBadge("error", "⚠ modo offline indisponível");
  });
  // "ready" só resolve depois que o service worker terminou de guardar todos os arquivos
  navigator.serviceWorker.ready.then(() => {
    setOfflineBadge("ready", "● pronto para usar sem internet");
  });
} else {
  setOfflineBadge("error", "⚠ modo offline indisponível");
}
