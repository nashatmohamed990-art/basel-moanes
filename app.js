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
let filter = "all";

function load(key) { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; } }
function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function savedIds() { return new Set(load(SAVED_KEY) || []); }
function extras() { return load(EXTRA_KEY) || []; }
function allItems() { return CATALOG.concat(extras()); }
function byId(id) { return allItems().find((item) => item.id === id); }
function thumb(id) { const item = byId(id); if (!id || id === "audio-cover" || (item && item.audio)) return "audio-cover.jpg"; return "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg"; }
function minutes(value) {
  const parts = String(value || "0").split(":").map(Number);
  if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2] / 60;
  if (parts.length === 2) return parts[0] + parts[1] / 60;
  return 0;
}
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, "\"")
    .replace(/'/g, "&#39;")
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
function row(item) {
  return `<article class="list-row">
    <button class="media" type="button" data-play="${item.id}"><img src="${thumb(item.id)}" alt=""></button>
    <div>
      <p class="ep-meta">${item.audio ? "تسجيل صوتي" : kindLabel(item)} · ${escapeHtml(item.duration || "")}</p>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.audio ? "تسجيل صوتي" : (item.note || item.source || "يوتيوب"))}</p>
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
function clock(value) {
  const sec = Math.max(0, Math.floor(value || 0));
  return ar.format(Math.floor(sec / 60)) + ":" + ar.format(sec % 60).padStart(2, "٠");
}
function audioQueue() { return allItems().filter((item) => item.audio); }
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
function playSrc(src, title) {
  const audio = ensureAudio();
  showDock(title);
  audio.src = src;
  audio.playbackRate = speed;
  audio.play().catch(function () {});
  document.getElementById("dock-play").textContent = "Ⅱ";
}
function stepAudio(dir) {
  const queue = audioQueue();
  const index = queue.findIndex((item) => item.id === currentId);
  const next = queue[index + dir] || queue[dir > 0 ? 0 : queue.length - 1];
  if (next) openItem(next.id);
}
function bindDock() {
  const audio = ensureAudio();
  const play = document.getElementById("dock-play");
  const seek = document.getElementById("dock-seek");
  if (!play || play.dataset.bound) return;
  play.dataset.bound = "1";
  play.addEventListener("click", () => { if (audio.paused) audio.play(); else audio.pause(); });
  document.getElementById("dock-next")?.addEventListener("click", () => stepAudio(1));
  document.getElementById("dock-prev")?.addEventListener("click", () => stepAudio(-1));
  document.getElementById("dock-close")?.addEventListener("click", () => {
    audio.pause(); audio.removeAttribute("src");
    document.getElementById("dock").hidden = true;
    currentId = ""; renderResume();
  });
  document.getElementById("dock-repeat")?.addEventListener("click", (event) => {
    repeatMode = repeatMode === "off" ? "one" : repeatMode === "one" ? "all" : "off";
    event.currentTarget.classList.toggle("on", repeatMode !== "off");
    event.currentTarget.textContent = repeatMode === "one" ? "1" : "↻";
  });
  document.getElementById("dock-speed")?.addEventListener("click", (event) => {
    speed = speed === 1 ? 1.25 : speed === 1.25 ? 1.5 : 1;
    audio.playbackRate = speed;
    event.currentTarget.textContent = "×" + ar.format(speed);
  });
  seek?.addEventListener("input", () => { if (audio.duration) audio.currentTime = audio.duration * (seek.value / 1000); });
  audio.addEventListener("timeupdate", () => {
    if (!audio.duration || !seek) return;
    seek.value = Math.floor((audio.currentTime / audio.duration) * 1000);
    document.getElementById("dock-now").textContent = clock(audio.currentTime);
    document.getElementById("dock-end").textContent = clock(audio.duration);
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
  if (item.audio) {
    currentId = id;
    save(LAST_KEY, id);
    bindDock();
    frame.hidden = true;
    frame.removeAttribute("src");
    if (player?.open) player.close();
    playSrc(item.audio, item.title);
    renderResume();
    return;
  }
  currentId = id;
  save(LAST_KEY, id);
  playerTitle.textContent = item.title;
  const dock = document.getElementById("dock");
  if (dock) dock.hidden = true;
  const audio = document.getElementById("player-audio");
  if (audio) { audio.pause(); audio.removeAttribute("src"); }
  const watch = "https://www.youtube.com/watch?v=" + encodeURIComponent(id);
  const yt = document.getElementById("player-youtube");
  if (yt) { yt.href = watch; yt.textContent = "شاهد على يوتيوب"; }
  frame.hidden = true;
  frame.removeAttribute("src");
  let poster = document.getElementById("player-poster");
  if (!poster) {
    poster = document.createElement("a");
    poster.id = "player-poster";
    poster.className = "player-poster";
    poster.target = "_blank";
    poster.rel = "noopener";
    frame.insertAdjacentElement("afterend", poster);
  }
  poster.hidden = false;
  poster.href = watch;
  poster.innerHTML = '<img alt="" src="https://i.ytimg.com/vi/' + encodeURIComponent(id) + '/hqdefault.jpg"><span>شاهد على يوتيوب</span>';
  if (!player.open) player.showModal();
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
  document.getElementById("series-items").innerHTML = list.map(row).join("") || "<p class='muted'>لا توجد مواد في هذه السلسلة.</p>";
  const play = params.get("play");
  if (play && byId(play)) openItem(play);
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
    if (!box || !ADHKAR[group]) return;
    box.innerHTML = ADHKAR[group].map((item) => {
      const current = Math.min(state.counts[item.id] || 0, item.count);
      const done = current >= item.count;
      return `<button class="dhikr${done ? " done" : ""}" type="button" data-dhikr="${item.id}">
        <span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></span>
        <span class="counter">${ar.format(current)}/${ar.format(item.count)}</span>
      </button>`;
    }).join("");
  });
}
function initTasbih() {
  const phraseBox = document.getElementById("tasbih-phrases");
  if (!phraseBox) return;
  const PHRASES = ["سبحان الله", "الحمد لله", "الله أكبر", "لا إله إلا الله", "أستغفر الله", "سبحان الله وبحمده"];
  const savedBead = load(TASBIH_KEY) || {};
  let phrase = PHRASES.includes(savedBead.phrase) ? savedBead.phrase : PHRASES[0];
  let target = [33, 100, 0].includes(savedBead.target) ? savedBead.target : 100;
  let bead = Number(savedBead.bead) || 0;
  phraseBox.innerHTML = PHRASES.map((name) => `<button type="button" data-phrase="${name}" class="chip${name === phrase ? " on" : ""}">${name}</button>`).join("");
  document.querySelectorAll("[data-target]").forEach((el) => el.classList.toggle("on", Number(el.dataset.target) === target));
  const paint = () => {
    document.getElementById("bead-count").textContent = ar.format(bead);
    document.getElementById("bead-label").textContent = phrase;
    document.getElementById("bead-of").textContent = target ? "من " + ar.format(target) : "مفتوح";
    document.getElementById("bead").classList.toggle("done", Boolean(target) && bead >= target);
    const box = document.getElementById("misbaha-beads");
    const total = 11;
    const progress = target ? Math.min(bead, target) / target : (bead % 33) / 33;
    const filled = Math.round(progress * total);
    box.innerHTML = Array.from({length: total}, (_, i) => {
      const angle = Math.PI * (0.12 + 0.76 * (i / (total - 1)));
      const x = 50 + Math.cos(Math.PI - angle) * 42;
      const y = 58 - Math.sin(angle) * 46;
      const cls = i === 5 ? "pearl sep" : "pearl" + (i < filled ? " on" : "");
      return `<span class="${cls}" style="left:${x}%;top:${y}%"></span>`;
    }).join("");
    save(TASBIH_KEY, { phrase, target, bead });
  };
  phraseBox.addEventListener("click", (event) => {
    const button = event.target.closest("[data-phrase]");
    if (!button) return;
    phrase = button.dataset.phrase; bead = 0;
    phraseBox.querySelectorAll("button").forEach((el) => el.classList.toggle("on", el === button));
    paint();
  });
  document.querySelector(".tasbih-targets").addEventListener("click", (event) => {
    const button = event.target.closest("[data-target]");
    if (!button) return;
    target = Number(button.dataset.target);
    document.querySelectorAll("[data-target]").forEach((el) => el.classList.toggle("on", el === button));
    paint();
  });
  document.getElementById("bead").addEventListener("click", () => {
    if (target && bead >= target) bead = 0;
    bead += 1;
    if (target && bead >= target && navigator.vibrate) navigator.vibrate(30);
    paint();
  });
  document.getElementById("bead-reset").addEventListener("click", () => { bead = 0; paint(); });
  paint();
}
document.body.addEventListener("click", (event) => {
  const play = event.target.closest("[data-play]");
  const saveBtn = event.target.closest("[data-save]");
  const dhikr = event.target.closest("[data-dhikr]");
  if (play) openItem(play.dataset.play);
  if (saveBtn) return;
  if (dhikr && typeof ADHKAR !== "undefined") {
    const item = Object.values(ADHKAR).flat().find((entry) => entry.id === dhikr.dataset.dhikr);
    if (!item) return;
    const state = dhikrState();
    const current = state.counts[item.id] || 0;
    setDhikr(item.id, current >= item.count ? item.count : current + 1);
    renderAdhkar();
  }
});
document.querySelectorAll("[data-reset]").forEach((button) => {
  button.addEventListener("click", () => {
    const state = dhikrState();
    ADHKAR[button.dataset.reset].forEach((item) => { delete state.counts[item.id]; });
    save(DHIKR_KEY, state);
    renderAdhkar();
  });
});
document.querySelectorAll(".chip[data-filter]").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip[data-filter]").forEach((c) => c.classList.remove("on"));
    chip.classList.add("on");
    filter = chip.dataset.filter;
    renderSearch();
  });
});
document.getElementById("q")?.addEventListener("input", renderSearch);
bindDock();
document.getElementById("player-next")?.addEventListener("click", () => {
  const items = allItems();
  const index = items.findIndex((item) => item.id === currentId);
  const next = items[index + 1] || items[0];
  if (next) openItem(next.id);
});
document.getElementById("resume-play")?.addEventListener("click", () => openItem(load(LAST_KEY)));
document.getElementById("resume-hide")?.addEventListener("click", () => { localStorage.removeItem(LAST_KEY); renderResume(); });
player?.addEventListener("close", () => { frame.src = ""; const audio = document.getElementById("player-audio"); if (audio) { audio.pause(); audio.removeAttribute("src"); } currentId = ""; renderResume(); });
player?.addEventListener("click", (event) => { if (event.target === player) player.close(); });
document.getElementById("add-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.target);
  const url = String(data.get("url"));
  const match = url.match(/[a-zA-Z0-9_-]{11}/);
  const note = document.getElementById("add-note");
  if (!match) { note.textContent = "الرابط غير واضح."; return; }
  const item = { id: match[0], title: String(data.get("title")).trim(), kind: data.get("kind"), duration: "", source: "مضاف على هذا الجهاز" };
  save(EXTRA_KEY, extras().filter((entry) => entry.id !== item.id).concat(item));
  const ids = load(SAVED_KEY) || [];
  if (!ids.includes(item.id)) save(SAVED_KEY, ids.concat(item.id));
  event.target.reset();
  note.textContent = "أُضيف إلى مكتبتك على هذا الجهاز.";
  renderLibrary();
});

renderHome();
renderSeries();
renderSearch();
renderAdhkar();
renderResume();
