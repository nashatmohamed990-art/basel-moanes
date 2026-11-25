const SAVED_KEY = "basel-moanes-saved";
const EXTRA_KEY = "basel-moanes-extra";
const LAST_KEY = "basel-moanes-last";
const DHIKR_KEY = "basel-moanes-dhikr";
const TASBIH_KEY = "basel-moanes-tasbih";
const page = document.body.dataset.page;
const player = document.getElementById("player");
const frame = document.getElementById("player-frame");
const playerTitle = document.getElementById("player-title");
const ar = new Intl.NumberFormat("ar-EG");
let currentId = "";
let currentSrc = "";
let filter = "all";

function load(key) { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; } }
function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function savedIds() { return new Set(load(SAVED_KEY) || []); }
function extras() { return load(EXTRA_KEY) || []; }
function allItems() { return CATALOG.concat(extras()); }
function byId(id) { return allItems().find((item) => item.id === id); }
// مصدر الصوت: ملف صوتي مباشر (audio) أو نسخة mp3 لفيديو يوتيوب (mp3)
function srcOf(item) { return item ? (item.audio || item.mp3 || "") : ""; }
function thumb(id) { const item = byId(id); if (!id || id === "audio-cover" || (item && item.audio)) return "audio-cover.jpg"; return "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg"; }
function minutes(value) {
  const parts = String(value || "0").split(":").map(Number);
  if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2] / 60;
  if (parts.length === 2) return parts[0] + parts[1] / 60;
  return 0;
}
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function kindLabel(item) { return item.kind === "lesson" ? "مجلس تدبر" : "تلاوة"; }
function placeFor(item) {
  if (item.audio) return "audio";
  if (item.kind === "lesson") return "lessons";
  if ((item.lists || []).includes("tilawa") || item.kind === "tilawa") return "tilawa";
  return (item.lists || [])[0] || "tilawa";
}
function card(item) {
  const place = placeFor(item);
  return `<a class="ep-card" href="series.html?s=${place}&play=${encodeURIComponent(item.id)}">
    <span class="media">
      <img src="${thumb(item.id)}" alt="">
      <span class="play-mark" aria-hidden="true">▶</span>
      <span class="dur">${escapeHtml(item.duration || "")}</span>
    </span>
    <p class="ep-meta">${item.audio ? "تسجيل صوتي" : kindLabel(item)}</p>
    <h3>${escapeHtml(item.title)}</h3>
    <p>${escapeHtml(item.audio ? "تسجيل صوتي" : (item.note || item.source || "يوتيوب"))}</p>
  </a>`;
}
function waieRow(item) {
  return `<div class="waie-ep">
    <button class="waie-main" type="button" data-play="${item.id}">
      <span class="copy"><b>${escapeHtml(item.title)}</b><span>${item.audio ? "تسجيل صوتي" : "شاهد التلاوة"}</span><em>${escapeHtml(item.duration || "")}</em></span>
      <span class="shot"><img src="${thumb(item.id)}" alt=""><i>▶</i></span>
    </button>
    ${item.audio ? `<button class="dl-chip" type="button" data-dl="${item.id}">⬇ تنزيل للاستماع أوفلاين</button>` : ""}
  </div>`;
}
function row(item) {
  return `<article class="list-row">
    <button class="media" type="button" data-play="${item.id}"><img src="${thumb(item.id)}" alt=""></button>
    <div>
      <p class="ep-meta">${item.audio ? "تسجيل صوتي" : kindLabel(item)} · ${escapeHtml(item.duration || "")}</p>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.audio ? "تسجيل صوتي" : (item.note || item.source || "يوتيوب"))}</p>
      ${item.audio ? `<button class="dl-chip" type="button" data-dl="${item.id}">⬇ تنزيل للاستماع أوفلاين</button>` : ""}
    </div>
  </article>`;
}
const SERIES = [
  { id: "audio", title: "التسجيلات الصوتية", kicker: "صوت", count: "37 تسجيل", blurb: "ملفات صوتية على الموقع.", image: "audio-cover" },
  { id: "tilawa", title: "تلاوات يوتيوب", kicker: "يوتيوب", count: "73 تلاوة", blurb: "قائمة التلاوات على القناة.", image: "re9whwL7Oik" },
  { id: "qasas", title: "تدبر سورة القصص", kicker: "سلسلة", count: "11 مجلس", blurb: "سلسلة تدبر سورة القصص.", image: "xMwATKRljuc" },
  { id: "tadabbur", title: "تدبر", kicker: "سلسلة", count: "14 حلقة", blurb: "تدبر قصار السور.", image: "wuGaXVbdo4w" },
  { id: "lessons", title: "دروس متفرقة", kicker: "دروس", count: "44 مجلس", blurb: "دروس ووقفات من القناة.", image: "AZNnQhRHdFA" },
  { id: "sadaq", title: "وصدق الله ورسوله", kicker: "سلسلة", count: "3 حلقات", blurb: "سلسلة وصدق الله ورسوله.", image: "I8ttP8KFM48" },
  { id: "clips", title: "مقاطع", kicker: "مقاطع", count: "5 مقاطع", blurb: "مقاطع قصيرة من القناة.", image: "Lpmq1uj7tJc" },
  { id: "morning", title: "أذكار الصباح", kicker: "ذكر", count: "تُقال وحدها", blurb: "من بعد الفجر حتى الضحى.", href: "practice.html#morning" },
  { id: "evening", title: "أذكار المساء", kicker: "ذكر", count: "تُقال وحدها", blurb: "من بعد العصر إلى الليل.", href: "practice.html#evening" },
  { id: "tasbih", title: "السبحة", kicker: "عدّ", count: "٣٣ / ١٠٠", blurb: "سبحان الله، والحمد، والتكبير.", href: "practice.html#tasbih" }
];
function seriesTile(s) {
  const href = s.href || ("series.html?s=" + s.id);
  const img = s.image ? thumb(s.image) : "hero.jpg";
  return `<a class="series-tile" href="${href}"><div class="media"><img src="${img}" alt=""><span class="scrim"></span></div><div class="copy"><p class="eyebrow-pill">${s.kicker}</p><h3>${s.title}</h3><span>${s.count}</span></div></a>`;
}
function featuredSeries() {
  const s = SERIES[0];
  return `<a class="featured" href="series.html?s=audio"><div class="media"><img src="${thumb(s.image)}" alt=""><span class="scrim"></span></div><div class="copy"><p class="eyebrow-pill">${s.kicker}</p><h3>${s.title}</h3><p>${s.blurb}</p><span class="btn btn-glass">عرض الحلقات</span></div></a>`;
}
function audios() { return allItems().filter((i) => i.audio); }
function videos() { return allItems().filter((i) => !i.audio); }
function itemsFor(id) {
  if (id === "audio") return audios();
  if (id === "tilawa") return videos().filter((i) => (i.lists || []).includes("tilawa") || (i.kind === "tilawa" && !i.audio));
  if (id === "lessons") return videos().filter((i) => i.kind === "lesson");
  return videos().filter((i) => (i.lists || []).includes(id));
}

let repeatMode = "off";
let speed = 1;
let sleepMin = 0;
let sleepTimer = null;
function clock(value) {
  const sec = Math.max(0, Math.floor(value || 0));
  return ar.format(Math.floor(sec / 60)) + ":" + ar.format(sec % 60).padStart(2, "٠");
}
function audioQueue() { return allItems().filter((item) => srcOf(item)); }
function ensureAudio() {
  let audio = document.getElementById("player-audio");
  if (!audio) {
    audio = document.createElement("audio");
    audio.id = "player-audio";
    document.body.appendChild(audio);
  }
  audio.controls = false;
  return audio;
}
function showDock(title) {
  const dock = document.getElementById("dock");
  if (!dock) return;
  dock.hidden = false;
  document.getElementById("dock-title").textContent = title;
  if (player?.open) player.close();
}
function setMediaSession(title, audio) {
  if (!("mediaSession" in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: title,
    artist: "باسل مؤنس",
    artwork: [{ src: "icon-512 (1).png", sizes: "512x512", type: "image/png" }]
  });
  navigator.mediaSession.setActionHandler("play", () => audio.play());
  navigator.mediaSession.setActionHandler("pause", () => audio.pause());
  navigator.mediaSession.setActionHandler("previoustrack", () => stepAudio(-1));
  navigator.mediaSession.setActionHandler("nexttrack", () => stepAudio(1));
  navigator.mediaSession.setActionHandler("seekbackward", () => { audio.currentTime = Math.max(0, audio.currentTime - 10); });
  navigator.mediaSession.setActionHandler("seekforward", () => { audio.currentTime = Math.min(audio.duration || Infinity, audio.currentTime + 10); });
}
function playSrc(src, title) {
  const audio = ensureAudio();
  currentSrc = src;
  showDock(title);
  const art = document.getElementById("dock-art");
  if (art) art.src = thumb(currentId);
  audio.src = src;
  audio.playbackRate = speed;
  audio.play().catch(function () {});
  setMediaSession(title, audio);
  document.getElementById("dock-play").textContent = "Ⅱ";
  refreshDownloadBtn();
}
function stepAudio(dir) {
  const queue = audioQueue();
  const index = queue.findIndex((item) => item.id === currentId);
  const next = queue[index + dir] || queue[dir > 0 ? 0 : queue.length - 1];
  if (next) openItem(next.id);
}

// ===== تحميل للأوفلاين (يعمل للملفات الموجودة على نفس الموقع) =====
function sameOrigin(src) { try { return new URL(src, location.href).origin === location.origin; } catch { return false; } }
async function isDownloaded(src) {
  if (!window.pwa || !sameOrigin(src)) return false;
  try { const list = await window.pwa.list(); return list.includes(new URL(src, location.href).href); } catch { return false; }
}
async function refreshDownloadBtn() {
  const btn = document.getElementById("dock-dl");
  if (!btn) return;
  if (!currentSrc || !window.pwa || !sameOrigin(currentSrc)) { btn.hidden = true; return; }
  btn.hidden = false;
  const done = await isDownloaded(currentSrc);
  btn.classList.toggle("on", done);
  btn.textContent = done ? "محمّل ✓" : "تحميل";
}
async function toggleDownload() {
  const btn = document.getElementById("dock-dl");
  if (!btn || !currentSrc) return;
  const src = currentSrc;
  btn.disabled = true;
  try {
    if (await isDownloaded(src)) { await window.pwa.remove(src); }
    else { btn.textContent = "جارٍ التحميل…"; await window.pwa.download(src); }
  } catch { btn.textContent = "تعذّر التحميل"; await new Promise((r) => setTimeout(r, 1500)); }
  btn.disabled = false;
  refreshDownloadBtn();
  refreshDlButtons();
}

// ===== أزرار تنزيل كل تلاوة من القائمة نفسها =====
async function refreshDlButtons() {
  const btns = document.querySelectorAll("[data-dl]");
  if (!btns.length || !window.pwa) return;
  let list = [];
  try { list = await window.pwa.list(); } catch { return; }
  btns.forEach((b) => {
    const item = byId(b.dataset.dl);
    if (!item) return;
    const done = list.includes(new URL(srcOf(item), location.href).href);
    b.classList.toggle("on", done);
    b.textContent = done ? "✓ محفوظة — تعمل أوفلاين" : "⬇ تنزيل للاستماع أوفلاين";
  });
}
async function toggleItemDownload(btn) {
  const item = byId(btn.dataset.dl);
  if (!item || !window.pwa) return;
  const src = srcOf(item);
  btn.disabled = true;
  try {
    if (btn.classList.contains("on")) { await window.pwa.remove(src); }
    else { btn.textContent = "جارٍ التحميل…"; await window.pwa.download(src); }
  } catch { btn.textContent = "تعذّر التحميل"; await new Promise((r) => setTimeout(r, 1500)); }
  btn.disabled = false;
  refreshDlButtons();
  refreshDownloadBtn();
}

function bindDock() {
  const audio = ensureAudio();
  const play = document.getElementById("dock-play");
  const seek = document.getElementById("dock-seek");
  if (!play || play.dataset.bound) return;
  play.dataset.bound = "1";

  // غلاف ووقت للمشغّل (شكل أخضر/أبيض مرتب)
  const dockEl = document.getElementById("dock");
  if (dockEl && !document.getElementById("dock-art")) {
    const art = document.createElement("img");
    art.id = "dock-art"; art.alt = ""; art.src = "audio-cover.jpg";
    dockEl.insertBefore(art, dockEl.firstChild);
    const times = document.createElement("div");
    times.className = "dock-times";
    times.innerHTML = '<span id="dock-now">٠:٠٠</span><span id="dock-end">٠:٠٠</span>';
    if (seek && seek.nextSibling) dockEl.insertBefore(times, seek.nextSibling);
    else dockEl.appendChild(times);
  }

  // أزرار إضافية تُضاف تلقائيًا: تحميل + مؤقت نوم
  const controls = document.querySelector("#dock .dock-controls");
  const closeBtn = document.getElementById("dock-close");
  if (controls && !document.getElementById("dock-sleep")) {
    const dl = document.createElement("button");
    dl.type = "button"; dl.id = "dock-dl"; dl.hidden = true; dl.textContent = "تحميل";
    dl.setAttribute("aria-label", "تحميل للأوفلاين");
    dl.addEventListener("click", toggleDownload);
    const sl = document.createElement("button");
    sl.type = "button"; sl.id = "dock-sleep"; sl.textContent = "نوم";
    sl.setAttribute("aria-label", "مؤقت النوم");
    sl.addEventListener("click", () => {
      sleepMin = ({ 0: 15, 15: 30, 30: 60, 60: 0 })[sleepMin];
      clearTimeout(sleepTimer);
      if (sleepMin) sleepTimer = setTimeout(() => { audio.pause(); sleepMin = 0; sl.textContent = "نوم"; sl.classList.remove("on"); }, sleepMin * 60000);
      sl.textContent = sleepMin ? ar.format(sleepMin) + " د" : "نوم";
      sl.classList.toggle("on", Boolean(sleepMin));
    });
    controls.insertBefore(dl, closeBtn);
    controls.insertBefore(sl, closeBtn);
  }
  const speedBtn = document.getElementById("dock-speed");
  if (speedBtn) speedBtn.textContent = "×" + ar.format(speed);

  play.addEventListener("click", () => { if (audio.paused) audio.play(); else audio.pause(); });
  document.getElementById("dock-next")?.addEventListener("click", () => stepAudio(1));
  document.getElementById("dock-prev")?.addEventListener("click", () => stepAudio(-1));
  document.getElementById("dock-close")?.addEventListener("click", () => {
    audio.pause(); audio.removeAttribute("src");
    document.getElementById("dock").hidden = true;
    currentId = ""; currentSrc = ""; renderResume();
  });
  document.getElementById("dock-repeat")?.addEventListener("click", (event) => {
    repeatMode = repeatMode === "off" ? "one" : repeatMode === "one" ? "all" : "off";
    event.currentTarget.classList.toggle("on", repeatMode !== "off");
    event.currentTarget.textContent = repeatMode === "one" ? "1" : "↻";
  });
  document.getElementById("dock-speed")?.addEventListener("click", (event) => {
    speed = speed === 1 ? 1.25 : speed === 1.25 ? 1.5 : speed === 1.5 ? 2 : 1;
    audio.playbackRate = speed;
    event.currentTarget.textContent = "×" + ar.format(speed);
  });
  seek?.addEventListener("input", () => { if (audio.duration) audio.currentTime = audio.duration * (seek.value / 1000); });
  audio.addEventListener("timeupdate", () => {
    if (!audio.duration || !seek) return;
    seek.value = Math.floor((audio.currentTime / audio.duration) * 1000);
    seek.style.setProperty("--p", ((audio.currentTime / audio.duration) * 100).toFixed(1) + "%");
    const now = document.getElementById("dock-now"); if (now) now.textContent = clock(audio.currentTime);
    const end = document.getElementById("dock-end"); if (end) end.textContent = clock(audio.duration);
  });
  audio.addEventListener("play", () => { play.textContent = "Ⅱ"; });
  audio.addEventListener("pause", () => { play.textContent = "▶"; });
  audio.addEventListener("ended", () => {
    if (repeatMode === "one") { audio.currentTime = 0; audio.play(); return; }
    if (repeatMode === "off") {
      const queue = audioQueue();
      if (queue.findIndex((item) => item.id === currentId) === queue.length - 1) return;
    }
    stepAudio(1);
  });
}

function openItem(id) {
  const item = byId(id);
  if (!item) return;
  const src = srcOf(item);
  if (src) {
    currentId = id;
    save(LAST_KEY, id);
    bindDock();
    frame.hidden = true;
    frame.removeAttribute("src");
    if (player?.open) player.close();
    const stage = document.getElementById("stage");
    if (stage) { stage.hidden = true; stage.querySelector("iframe").removeAttribute("src"); }
    playSrc(src, item.title);
    renderResume();
    return;
  }
  currentId = id;
  currentSrc = "";
  save(LAST_KEY, id);
  playerTitle.textContent = item.title;
  const dock = document.getElementById("dock");
  if (dock) dock.hidden = true;
  const audio = document.getElementById("player-audio");
  if (audio) { audio.pause(); audio.removeAttribute("src"); }
  showStage(item);
  renderResume();
}
function renderResume() {
  const last = load(LAST_KEY);
  const bar = document.getElementById("resume");
  if (!bar) return;
  if (!last || !byId(last) || currentId === last) { bar.hidden = true; return; }
  document.getElementById("resume-title").textContent = byId(last).title;
  bar.hidden = false;
}
function visible() {
  const q = (document.getElementById("q")?.value || "").trim();
  return allItems().filter((item) => {
    if (filter === "tilawa" && item.kind !== "tilawa") return false;
    if (filter === "lesson" && item.kind !== "lesson") return false;
    if (filter === "short" && minutes(item.duration) >= 10) return false;
    if (q && !(item.title + " " + (item.source || "")).includes(q)) return false;
    return true;
  });
}
function renderSearch() {
  const box = document.getElementById("grid");
  if (!box) return;
  const items = visible();
  const a = items.filter((i) => i.audio);
  const v = items.filter((i) => !i.audio);
  box.innerHTML = `<h2 class="split-title">التسجيلات الصوتية</h2>${a.map(row).join("") || "<p class='muted'>لا توجد تسجيلات.</p>"}<h2 class="split-title">فيديوهات يوتيوب</h2>${v.map(row).join("") || "<p class='muted'>لا توجد فيديوهات.</p>"}`;
  const empty = document.getElementById("empty");
  if (empty) empty.hidden = items.length !== 0;
}
function renderLibrary() {
  const box = document.getElementById("saved");
  if (!box) return;
  const items = allItems().filter((item) => savedIds().has(item.id));
  box.innerHTML = items.map(row).join("");
  const empty = document.getElementById("saved-empty");
  if (empty) empty.hidden = items.length !== 0;
}
function renderHome() {
  const series = document.getElementById("home-series");
  if (series) series.innerHTML = featuredSeries() + `<div class="series-rail">${SERIES.slice(1).map(seriesTile).join("")}</div>`;
  const audioBox = document.getElementById("audio-list");
  if (audioBox) audioBox.innerHTML = audios().map(card).join("");
  const videoBox = document.getElementById("video-list");
  if (videoBox) videoBox.innerHTML = videos().filter((i) => i.kind === "tilawa").slice(0, 8).map(card).join("");
  const lessonBox = document.getElementById("lesson-list");
  if (lessonBox) lessonBox.innerHTML = videos().filter((i) => i.kind === "lesson").map(card).join("");
}
function renderSeries() {
  const grid = document.getElementById("series-grid");
  if (!grid) return;
  const params = new URLSearchParams(location.search);
  const id = params.get("s");
  const chosen = SERIES.find((s) => s.id === id);
  if (!chosen || chosen.href) {
    grid.className = "series-rail";
    grid.innerHTML = SERIES.map(seriesTile).join("");
    return;
  }
  const title = document.getElementById("series-title");
  const lede = document.getElementById("series-lede");
  if (title) title.textContent = chosen.title;
  if (lede) lede.textContent = chosen.blurb;
  grid.innerHTML = "";
  const list = itemsFor(id);
  document.getElementById("series-items").innerHTML = `<div class="waie-start"><i></i><span>بداية السلسلة · ${ar.format(list.length)}</span></div><div class="waie-list">${list.map(waieRow).join("") || "<p class='muted'>لا توجد مواد في هذه السلسلة.</p>"}</div>`;
  const play = params.get("play");
  if (play && byId(play) && play !== currentId) openItem(play);
}
function todayKey() { return new Date().toISOString().slice(0, 10); }
function dhikrState() {
  const saved = load(DHIKR_KEY) || {};
  if (saved.day !== todayKey()) return { day: todayKey(), counts: {} };
  return saved;
}
function setDhikr(id, value) {
  const state = dhikrState();
  state.counts[id] = value;
  save(DHIKR_KEY, state);
}
function renderAdhkar() {
  if (typeof ADHKAR === "undefined") return;
  const state = dhikrState();
  ["morning", "evening", "other"].forEach((group) => {
    const box = document.getElementById(group + "-list");
    if (!box) return;
    const items = ADHKAR[group] || [];
    box.innerHTML = items.map((item) => {
      const count = state.counts[item.id] || 0;
      const target = item.count || 1;
      const done = count >= target;
      return `<button class="dhikr-card${done ? " done" : ""}" type="button" data-dhikr="${item.id}" data-target="${target}">
        <span class="dhikr-text">${escapeHtml(item.text)}</span>
        <span class="dhikr-count">${ar.format(count)} / ${ar.format(target)}</span>
      </button>`;
    }).join("");
  });
}

// ===== تبويبات صفحة الأذكار: الصباح / المساء / أخرى / السبحة =====
function setAdhkarTab(name) {
  document.querySelectorAll("[data-adhkar-tab]").forEach((b) => b.classList.toggle("on", b.dataset.adhkarTab === name));
  document.querySelectorAll("[data-adhkar-section]").forEach((sec) => { sec.hidden = sec.dataset.adhkarSection !== name; });
}
function initPractice() {
  renderAdhkar();
  renderTasbih();
  const hash = (location.hash || "").replace("#", "");
  setAdhkarTab(["morning", "evening", "other", "tasbih"].includes(hash) ? hash : "morning");
}

// ===== السبحة الإلكترونية =====
const TASBIH_PHRASES = ["سبحان الله", "الحمد لله", "الله أكبر", "لا إله إلا الله", "سبحان الله وبحمده", "سبحان الله العظيم", "أستغفر الله", "لا حول ولا قوة إلا بالله", "اللهم صلِّ وسلم على نبينا محمد"];
function tasbihState() {
  return Object.assign({ phrase: 0, count: 0, target: 33, rounds: 0 }, load(TASBIH_KEY) || {});
}
function renderTasbih() {
  const bead = document.getElementById("bead");
  if (!bead) return;
  const s = tasbihState();
  const phrases = document.getElementById("tasbih-phrases");
  if (phrases) phrases.innerHTML = TASBIH_PHRASES.map((p, i) => `<button class="chip${i === s.phrase ? " on" : ""}" type="button" data-phrase="${i}">${p}</button>`).join("");
  document.querySelectorAll(".tasbih-targets [data-target]").forEach((b) => b.classList.toggle("on", +b.dataset.target === s.target));
  const ring = document.getElementById("misbaha-beads");
  if (ring) {
    const total = 33;
    const frac = s.target > 0 ? s.count / s.target : (s.count % total) / total;
    const lit = Math.round(frac * total);
    let dots = "";
    for (let i = 0; i < total; i++) {
      const a = (i / total) * Math.PI * 2 - Math.PI / 2;
      const x = 50 + 42 * Math.cos(a);
      const y = 50 + 40 * Math.sin(a);
      dots += `<span class="pearl${i < lit ? " lit" : ""}" style="left:${x}%;top:${y}%"></span>`;
    }
    ring.innerHTML = dots;
  }
  const countEl = document.getElementById("bead-count");
  if (countEl) countEl.textContent = ar.format(s.count);
  const ofEl = document.getElementById("bead-of");
  if (ofEl) ofEl.textContent = s.target > 0 ? `من ${ar.format(s.target)}${s.rounds ? ` · أتممت ${ar.format(s.rounds)}` : ""}` : "عدّاد مفتوح";
  const label = document.getElementById("bead-label");
  if (label) label.textContent = TASBIH_PHRASES[s.phrase] || TASBIH_PHRASES[0];
}
function tapBead() {
  const s = tasbihState();
  s.count += 1;
  if (s.target > 0 && s.count >= s.target) {
    s.rounds += 1;
    s.count = 0;
    if (navigator.vibrate) navigator.vibrate([50, 40, 50]);
    const bead = document.getElementById("bead");
    if (bead) { bead.classList.add("done"); setTimeout(() => bead.classList.remove("done"), 450); }
  }
  save(TASBIH_KEY, s);
  renderTasbih();
}

// === Full remaining logic from original (event listeners, showStage, soft navigation, tasbih) ===
function showStage(item) {
  const stage = document.getElementById("stage");
  if (!stage) {
    if (player) {
      player.showModal();
      frame.hidden = false;
      frame.src = "https://www.youtube-nocookie.com/embed/" + item.id + "?autoplay=1&rel=0&playsinline=1";
      const yt = document.getElementById("player-youtube");
      if (yt) yt.href = "https://www.youtube.com/watch?v=" + item.id;
    }
    return;
  }
  stage.hidden = false;
  const iframe = stage.querySelector("iframe");
  if (iframe) iframe.src = "https://www.youtube-nocookie.com/embed/" + item.id + "?autoplay=1&rel=0&playsinline=1";
}

function toggleSaved(id) {
  const set = savedIds();
  if (set.has(id)) set.delete(id); else set.add(id);
  save(SAVED_KEY, [...set]);
  renderLibrary();
}

// Event delegation and init
document.addEventListener("click", (e) => {
  const dlBtn = e.target.closest("[data-dl]");
  if (dlBtn) { toggleItemDownload(dlBtn); return; }
  const tabBtn = e.target.closest("[data-adhkar-tab]");
  if (tabBtn) { setAdhkarTab(tabBtn.dataset.adhkarTab); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
  const phraseBtn = e.target.closest("[data-phrase]");
  if (phraseBtn) { const s = tasbihState(); s.phrase = +phraseBtn.dataset.phrase; s.count = 0; save(TASBIH_KEY, s); renderTasbih(); return; }
  const targetBtn = e.target.closest(".tasbih-targets [data-target]");
  if (targetBtn) { const s = tasbihState(); s.target = +targetBtn.dataset.target; s.count = 0; save(TASBIH_KEY, s); renderTasbih(); return; }
  if (e.target.closest("#bead")) { tapBead(); return; }
  if (e.target.closest("#bead-reset")) { const s = tasbihState(); s.count = 0; s.rounds = 0; save(TASBIH_KEY, s); renderTasbih(); return; }
  const playBtn = e.target.closest("[data-play]");
  if (playBtn) { openItem(playBtn.dataset.play); return; }
  const dhikrBtn = e.target.closest("[data-dhikr]");
  if (dhikrBtn) {
    const id = dhikrBtn.dataset.dhikr;
    const target = +dhikrBtn.dataset.target || 1;
    const state = dhikrState();
    const cur = (state.counts[id] || 0) + 1;
    setDhikr(id, cur);
    renderAdhkar();
    return;
  }
  const resetBtn = e.target.closest("[data-reset]");
  if (resetBtn) {
    const group = resetBtn.dataset.reset;
    if (typeof ADHKAR !== "undefined" && ADHKAR[group]) {
      ADHKAR[group].forEach((item) => setDhikr(item.id, 0));
      renderAdhkar();
    }
    return;
  }
});

document.getElementById("resume-play")?.addEventListener("click", () => {
  const last = load(LAST_KEY);
  if (last) openItem(last);
});
document.getElementById("resume-hide")?.addEventListener("click", () => {
  document.getElementById("resume").hidden = true;
});

// Soft navigation for SPA-like feel
async function softGo(url, push) {
  try {
    const res = await fetch(url);
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    document.title = doc.title;
    const main = document.querySelector("main");
    const newMain = doc.querySelector("main");
    if (main && newMain) main.innerHTML = newMain.innerHTML;
    document.body.dataset.page = doc.body.dataset.page || "";
    if (push) history.pushState(null, "", url);
    // re-init page specific
    if (document.body.dataset.page === "home") renderHome();
    if (document.body.dataset.page === "series") renderSeries();
    if (document.body.dataset.page === "search") renderSearch();
    if (document.body.dataset.page === "practice") initPractice();
    renderResume();
    refreshDlButtons();
  } catch (err) {
    location.href = url;
  }
}

document.addEventListener("click", (event) => {
  const a = event.target.closest("a[href]");
  if (!a || a.target || a.hasAttribute("download") || a.href.startsWith("mailto:")) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return;
  if (!url.pathname.endsWith(".html") && url.pathname !== "/") return;
  event.preventDefault();
  softGo(url.href, true);
});
window.addEventListener("popstate", () => softGo(location.href, false));

// Init
if (page === "home") renderHome();
if (page === "series") renderSeries();
if (page === "search") renderSearch();
if (page === "library") renderLibrary();
if (page === "practice") initPractice(); else renderAdhkar();
renderResume();
refreshDlButtons();
