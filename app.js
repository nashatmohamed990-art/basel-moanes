const SAVED_KEY = "basel-moanes-saved";
const EXTRA_KEY = "basel-moanes-extra";
const LAST_KEY = "basel-moanes-last";

const grid = document.getElementById("grid");
const empty = document.getElementById("empty");
const q = document.getElementById("q");
const sort = document.getElementById("sort");
const player = document.getElementById("player");
const frame = document.getElementById("player-frame");
const playerTitle = document.getElementById("player-title");
const menuBtn = document.getElementById("menu-btn");

let filter = "all";
let currentId = "";

function load(key) {
  try { return JSON.parse(localStorage.getItem(key) || "null"); }
  catch { return null; }
}
function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function savedIds() { return new Set(load(SAVED_KEY) || []); }
function extras() { return load(EXTRA_KEY) || []; }
function allItems() { return CATALOG.concat(extras()); }
function byId(id) { return allItems().find((item) => item.id === id); }
function thumb(id) { return "https://i.ytimg.com/vi/" + id + "/mqdefault.jpg"; }
function minutes(value) {
  const parts = String(value || "0").split(":").map(Number);
  if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2] / 60;
  if (parts.length === 2) return parts[0] + parts[1] / 60;
  return 0;
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));
}

function visibleItems() {
  const query = (q.value || "").trim();
  const saved = savedIds();
  const items = allItems().filter((item) => {
    if (filter === "saved" && !saved.has(item.id)) return false;
    if (filter === "tilawa" && item.kind !== "tilawa") return false;
    if (filter === "lesson" && item.kind !== "lesson") return false;
    if (filter === "short" && minutes(item.duration) >= 10) return false;
    if (query) {
      const blob = item.title + " " + (item.surah || "") + " " + (item.source || "");
      if (!blob.includes(query)) return false;
    }
    return true;
  });
  const mode = sort.value;
  items.sort((a, b) => {
    if (mode === "short") return minutes(a.duration) - minutes(b.duration);
    if (mode === "long") return minutes(b.duration) - minutes(a.duration);
    if (mode === "name") return a.title.localeCompare(b.title, "ar");
    if (a.id === FEATURED_ID) return -1;
    if (b.id === FEATURED_ID) return 1;
    return minutes(b.duration) - minutes(a.duration);
  });
  return items;
}

function render() {
  const saved = savedIds();
  const items = visibleItems();
  grid.innerHTML = items.map((item) => {
    const on = saved.has(item.id) ? " on" : "";
    const kind = item.kind === "lesson" ? "درس" : "تلاوة";
    const source = item.source ? " · " + item.source : "";
    const note = item.note ? " · " + item.note : "";
    return `
      <article class="card">
        <button class="thumb" type="button" data-play="${item.id}">
          <img src="${thumb(item.id)}" alt="" />
          <span class="play">استمع</span>
          <span class="time">${escapeHtml(item.duration || "")}</span>
        </button>
        <div class="card-body">
          <p class="kind">${kind}${escapeHtml(source)}${escapeHtml(note)}</p>
          <h3>${escapeHtml(item.title)}</h3>
          <div class="card-actions">
            <button type="button" data-play="${item.id}">تشغيل</button>
            <button type="button" class="heart${on}" data-save="${item.id}" aria-label="حفظ">${on ? "♥" : "♡"}</button>
          </div>
        </div>
      </article>`;
  }).join("");

  empty.hidden = items.length !== 0;
  document.querySelector("[data-count=shown]").textContent = String(allItems().length);
  document.querySelector("[data-count=tilawa]").textContent = String(CHANNEL_TILAWA_COUNT);
  document.querySelector("[data-count=lessons]").textContent = String(
    allItems().filter((item) => item.kind === "lesson").length
  );
  renderFeatured();
  renderResume();
  renderAdhkar();
}

function renderFeatured() {
  const item = byId(FEATURED_ID);
  const box = document.getElementById("featured");
  if (!item) return;
  box.hidden = false;
  box.querySelector("img").src = thumb(item.id);
  box.querySelector("h2").textContent = item.title;
  box.querySelector(".muted").textContent = item.duration + " · " + (item.note || "");
}

function renderResume() {
  const last = load(LAST_KEY);
  const bar = document.getElementById("resume");
  if (!last || !byId(last) || currentId === last) {
    bar.hidden = true;
    return;
  }
  document.getElementById("resume-title").textContent = byId(last).title;
  bar.hidden = false;
}

function openItem(id) {
  const item = byId(id);
  if (!item) return;
  currentId = id;
  save(LAST_KEY, id);
  playerTitle.textContent = item.title;
  frame.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) + "?autoplay=1&rel=0";
  if (!player.open) player.showModal();
  renderResume();
}

function nextItem() {
  const items = visibleItems();
  const index = items.findIndex((item) => item.id === currentId);
  const next = items[index + 1] || items[0];
  if (next) openItem(next.id);
}

document.body.addEventListener("click", (event) => {
  const play = event.target.closest("[data-play]");
  const saveBtn = event.target.closest("[data-save]");
  if (play) openItem(play.dataset.play);
  if (saveBtn) {
    const id = saveBtn.dataset.save;
    const ids = load(SAVED_KEY) || [];
    save(SAVED_KEY, ids.includes(id) ? ids.filter((x) => x !== id) : ids.concat(id));
    render();
  }
});

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach((c) => c.classList.remove("on"));
    chip.classList.add("on");
    filter = chip.dataset.filter;
    render();
    document.getElementById("listen").scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

q.addEventListener("input", render);
sort.addEventListener("change", render);
document.getElementById("player-next").addEventListener("click", nextItem);
document.getElementById("resume-play").addEventListener("click", () => openItem(load(LAST_KEY)));
document.getElementById("resume-hide").addEventListener("click", () => {
  localStorage.removeItem(LAST_KEY);
  renderResume();
});

player.addEventListener("close", () => { frame.src = ""; currentId = ""; renderResume(); });
player.addEventListener("click", (event) => { if (event.target === player) player.close(); });

menuBtn.addEventListener("click", () => {
  const open = document.querySelector(".nav").classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
});
document.getElementById("site-nav").addEventListener("click", () => {
  document.querySelector(".nav").classList.remove("open");
});

function youtubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1, 12);
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    const parts = u.pathname.split("/");
    const idx = parts.indexOf("embed");
    if (idx >= 0) return parts[idx + 1];
  } catch (_) {}
  const match = String(url).match(/[a-zA-Z0-9_-]{11}/);
  return match ? match[0] : "";
}

document.getElementById("add-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.target);
  const id = youtubeId(data.get("url"));
  const note = document.getElementById("add-note");
  if (!id) {
    note.textContent = "الرابط غير واضح. الصق رابط يوتيوب كامل.";
    return;
  }
  const item = {
    id,
    title: String(data.get("title")).trim(),
    kind: data.get("kind"),
    duration: "",
    source: "مضاف على هذا الجهاز"
  };
  save(EXTRA_KEY, extras().filter((entry) => entry.id !== id).concat(item));
  event.target.reset();
  note.textContent = "أُضيف إلى مكتبتك على هذا الجهاز.";
  filter = "all";
  document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", c.dataset.filter === "all"));
  render();
});

document.getElementById("copy-dua").addEventListener("click", async () => {
  const text = document.getElementById("dua-text").textContent;
  const button = document.getElementById("copy-dua");
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = "نُسخ الدعاء";
  } catch (_) {
    button.textContent = "انسخ النص يدويًا";
  }
});

document.getElementById("year").textContent = String(new Date().getFullYear());

const DHIKR_KEY = "basel-moanes-dhikr";
const ar = new Intl.NumberFormat("ar-EG");
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
  const state = dhikrState();
  ["morning", "evening", "other"].forEach((group) => {
    const box = document.getElementById(group + "-list");
    if (!box) return;
    box.innerHTML = ADHKAR[group].map((item) => {
      const current = Math.min(state.counts[item.id] || 0, item.count);
      const done = current >= item.count;
      return `<button class="dhikr${done ? " done" : ""}" type="button" data-dhikr="${item.id}" data-group="${group}">
        <span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></span>
        <span class="counter">${ar.format(current)}/${ar.format(item.count)}</span>
      </button>`;
    }).join("");
  });
}
document.body.addEventListener("click", (event) => {
  const card = event.target.closest("[data-dhikr]");
  if (!card) return;
  const item = Object.values(ADHKAR).flat().find((entry) => entry.id === card.dataset.dhikr);
  if (!item) return;
  const state = dhikrState();
  const current = state.counts[item.id] || 0;
  setDhikr(item.id, current >= item.count ? item.count : current + 1);
  renderAdhkar();
});
document.querySelectorAll("[data-reset]").forEach((button) => {
  button.addEventListener("click", () => {
    const state = dhikrState();
    ADHKAR[button.dataset.reset].forEach((item) => { delete state.counts[item.id]; });
    save(DHIKR_KEY, state);
    renderAdhkar();
  });
});

const PHRASES = ["سبحان الله", "الحمد لله", "الله أكبر", "لا إله إلا الله", "أستغفر الله", "سبحان الله وبحمده"];
const TASBIH_KEY = "basel-moanes-tasbih";
const savedBead = load(TASBIH_KEY) || {};
let phrase = PHRASES.includes(savedBead.phrase) ? savedBead.phrase : PHRASES[0];
let target = [33, 100, 0].includes(savedBead.target) ? savedBead.target : 100;
let bead = Number(savedBead.bead) || 0;
const phraseBox = document.getElementById("tasbih-phrases");
phraseBox.innerHTML = PHRASES.map((name) => `<button type="button" data-phrase="${name}" class="${name === phrase ? "on" : ""}">${name}</button>`).join("");
document.querySelectorAll("[data-target]").forEach((el) => el.classList.toggle("on", Number(el.dataset.target) === target));
function persistBead() {
  save(TASBIH_KEY, { phrase, target, bead });
}
function paintBead() {
  const el = document.getElementById("bead");
  document.getElementById("bead-count").textContent = ar.format(bead);
  document.getElementById("bead-label").textContent = phrase;
  el.classList.toggle("done", Boolean(target) && bead >= target);
  persistBead();
}
phraseBox.addEventListener("click", (event) => {
  const button = event.target.closest("[data-phrase]");
  if (!button) return;
  phrase = button.dataset.phrase;
  bead = 0;
  phraseBox.querySelectorAll("button").forEach((el) => el.classList.toggle("on", el === button));
  paintBead();
});
document.querySelector(".tasbih-targets").addEventListener("click", (event) => {
  const button = event.target.closest("[data-target]");
  if (!button) return;
  target = Number(button.dataset.target);
  document.querySelectorAll("[data-target]").forEach((el) => el.classList.toggle("on", el === button));
  paintBead();
});
document.getElementById("bead").addEventListener("click", () => {
  if (target && bead >= target) bead = 0;
  bead += 1;
  if (target && bead >= target && navigator.vibrate) navigator.vibrate(30);
  paintBead();
});
document.getElementById("bead-reset").addEventListener("click", () => { bead = 0; paintBead(); });
paintBead();
render();
