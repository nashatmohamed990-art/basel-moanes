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
function thumb(id) { const item = byId(id); if (item && item.audio) return "hero.jpg"; return "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg"; }
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
function card(item) {
  const on = savedIds().has(item.id);
  return `<article class="ep-card">
    <button class="media" type="button" data-play="${item.id}">
      <img src="${thumb(item.id)}" alt="">
      <span class="play-mark" aria-hidden="true">▶</span>
      <span class="dur">${escapeHtml(item.duration || "")}</span>
    </button>
    <p class="ep-meta">${kindLabel(item)}</p>
    <h3>${escapeHtml(item.title)}</h3>
    <p>${escapeHtml(item.note || item.source || "قناة باسل مؤنس")}</p>
    <button class="save${on ? " on" : ""}" type="button" data-save="${item.id}">${on ? "محفوظ" : "احفظ"}</button>
  </article>`;
}
function row(item) {
  const on = savedIds().has(item.id);
  return `<article class="list-row">
    <button class="media" type="button" data-play="${item.id}"><img src="${thumb(item.id)}" alt=""></button>
    <div>
      <p class="ep-meta">${kindLabel(item)} · ${escapeHtml(item.duration || "")}</p>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.note || item.source || "قناة باسل مؤنس")}</p>
    </div>
    <button class="save${on ? " on" : ""}" type="button" data-save="${item.id}">${on ? "محفوظ" : "احفظ"}</button>
  </article>`;
}
const SERIES = [
  { id: "tilawa", title: "التلاوات", kicker: "السلسلة الأبرز", count: "13 تلاوة", blurb: "سور بصوته، كما نُشرت على القناة.", image: "re9whwL7Oik" },
  { id: "lessons", title: "مجالس التدبر", kicker: "سلسلة", count: "7 مجالس", blurb: "مجالس القصص، وكيف نتدبر القرآن، وسمعنا وأطعنا.", image: "XZU50DA4_1I" },
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
  return `<a class="featured" href="series.html?s=tilawa"><div class="media"><img src="${thumb(s.image)}" alt=""><span class="scrim"></span></div><div class="copy"><p class="eyebrow-pill">${s.kicker}</p><h3>${s.title}</h3><p>${s.blurb}</p><span class="btn btn-glass">عرض الحلقات</span></div></a>`;
}
function itemsFor(id) {
  if (id === "tilawa") return allItems().filter((i) => i.kind === "tilawa");
  if (id === "lessons") return allItems().filter((i) => i.kind === "lesson");
  return [];
}
function openItem(id) {
  const item = byId(id);
  if (!item) return;
  currentId = id;
  save(LAST_KEY, id);
  playerTitle.textContent = item.title;
  let audio = document.getElementById("player-audio");
  if (item.audio) {
    frame.hidden = true;
    frame.removeAttribute("src");
    if (!audio) {
      audio = document.createElement("audio");
      audio.id = "player-audio";
      audio.controls = true;
      audio.autoplay = true;
      frame.insertAdjacentElement("afterend", audio);
    }
    audio.hidden = false;
    audio.src = item.audio;
    audio.play().catch(function () {});
  } else {
    if (audio) { audio.pause(); audio.hidden = true; audio.removeAttribute("src"); }
    frame.hidden = false;
    frame.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) + "?autoplay=1&rel=0";
  }
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
  box.innerHTML = items.map(row).join("");
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
  const latest = document.getElementById("latest");
  if (latest) latest.innerHTML = allItems().slice(0, 6).map(card).join("");
  const popular = document.getElementById("popular");
  if (popular) popular.innerHTML = allItems().filter((i) => i.kind === "tilawa").slice(0, 6).map(card).join("");
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
  document.getElementById("series-items").innerHTML = itemsFor(id).map(row).join("");
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
    document.getElementById("bead").classList.toggle("done", Boolean(target) && bead >= target);
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
  if (saveBtn) {
    const id = saveBtn.dataset.save;
    const ids = load(SAVED_KEY) || [];
    save(SAVED_KEY, ids.includes(id) ? ids.filter((x) => x !== id) : ids.concat(id));
    renderHome(); renderSearch(); renderLibrary(); renderSeries();
  }
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
document.getElementById("copy-dua")?.addEventListener("click", async () => {
  const text = document.getElementById("dua").textContent;
  try { await navigator.clipboard.writeText(text); document.getElementById("copy-dua").textContent = "نُسخ الدعاء"; }
  catch { document.getElementById("copy-dua").textContent = "انسخ النص يدويًا"; }
});
document.querySelectorAll("[data-nav]").forEach((link) => {
  if (link.dataset.nav === page) link.classList.add("on");
});
renderHome();
renderSeries();
renderSearch();
renderLibrary();
renderAdhkar();
initTasbih();
renderResume();
