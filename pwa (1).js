// تسجيل الـ service worker + زر التثبيت + دوال تحميل التلاوات
(function () {
  if ("serviceWorker" in navigator) {
    addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }

  let deferred = null;
  addEventListener("beforeinstallprompt", e => {
    e.preventDefault(); deferred = e;
    document.querySelectorAll("[data-install]").forEach(b => ((b.hidden = false, b.style.display = "")));
  });
  document.addEventListener("click", async e => {
    const b = e.target.closest("[data-install]");
    if (!b || !deferred) return;
    deferred.prompt(); await deferred.userChoice; deferred = null; (b.hidden = true);
  });
  addEventListener("appinstalled", () =>
    document.querySelectorAll("[data-install]").forEach(b => ((b.hidden = true))));

  function ask(msg) {
    return navigator.serviceWorker.ready.then(reg => new Promise((res, rej) => {
      const ch = new MessageChannel();
      ch.port1.onmessage = ev => (ev.data.ok ? res(ev.data) : rej(new Error(ev.data.error)));
      reg.active.postMessage(msg, [ch.port2]);
    }));
  }

  // window.pwa.download("audio/file.mp3") … للملفات الصوتية على نفس الموقع فقط
  window.pwa = {
    download: url => ask({ type: "DL", url }),
    remove: url => ask({ type: "RM", url }),
    list: () => ask({ type: "LIST" }).then(r => r.urls)
  };
})();
