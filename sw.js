// Service worker: يحفظ هيكل الموقع للأوفلاين، ويحمّل الصوتيات عند الطلب فقط.
const VER = "v1";
const SHELL = "shell-" + VER;
const AUDIO = "audio-v1"; // لا يُحذف عند تحديث النسخة
const CORE = [
  "./", "index.html", "library.html", "series.html", "topics.html", "search.html",
  "about.html", "dua.html", "sources.html", "practice.html",
  "styles.css", "app.js", "catalog.js", "adhkar.js", "pwa.js",
  "audio-cover.jpg", "basel-portrait.jpg", "basel.jpg", "hero.jpg",
  "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png"
];

self.addEventListener("install", e => {
  // نضيف كل ملف على حدة حتى لا يفشل التثبيت لو ملف غير موجود
  e.waitUntil(caches.open(SHELL).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("shell-") && k !== SHELL).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function rangeFrom(resp, rangeHeader) {
  const buf = await resp.arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
  const start = m[1] ? parseInt(m[1], 10) : 0;
  const end = m[2] ? Math.min(parseInt(m[2], 10), buf.byteLength - 1) : buf.byteLength - 1;
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: {
      "Content-Type": resp.headers.get("Content-Type") || "audio/mpeg",
      "Content-Range": `bytes ${start}-${end}/${buf.byteLength}`,
      "Content-Length": String(end - start + 1),
      "Accept-Ranges": "bytes"
    }
  });
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // يوتيوب وغيره يمر كما هو

  // الصوتيات: من المحمّل أولًا ثم الشبكة
  if (/\.(mp3|m4a|ogg|wav|aac)$/i.test(url.pathname)) {
    e.respondWith((async () => {
      const hit = await (await caches.open(AUDIO)).match(url.href);
      if (hit) {
        const r = req.headers.get("range");
        return r ? rangeFrom(hit, r) : hit;
      }
      return fetch(req);
    })());
    return;
  }

  // باقي الملفات: من الكاش مع تحديثه في الخلفية
  e.respondWith((async () => {
    const cache = await caches.open(SHELL);
    const hit = await cache.match(req, { ignoreSearch: true });
    const net = fetch(req).then(r => { if (r.ok) cache.put(req, r.clone()); return r; }).catch(() => null);
    return hit || (await net) || (req.mode === "navigate" ? cache.match("index.html") : Response.error());
  })());
});

// تحميل تلاوة للأوفلاين أو حذفها
self.addEventListener("message", async e => {
  const { type, url } = e.data || {};
  const port = e.ports && e.ports[0];
  try {
    const cache = await caches.open(AUDIO);
    if (type === "DL") {
      const abs = new URL(url, location.href).href;
      const r = await fetch(abs);
      if (!r.ok) throw new Error("HTTP " + r.status);
      await cache.put(abs, r);
      port && port.postMessage({ ok: true });
    } else if (type === "RM") {
      await cache.delete(new URL(url, location.href).href);
      port && port.postMessage({ ok: true });
    } else if (type === "LIST") {
      const ks = await cache.keys();
      port && port.postMessage({ ok: true, urls: ks.map(k => k.url) });
    }
  } catch (err) {
    port && port.postMessage({ ok: false, error: String(err) });
  }
});
