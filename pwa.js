// تسجيل Service Worker + زر التثبيت + دوال تحميل التلاوات للأوفلاين
(function () {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }

  var deferred = null;

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferred = e;
    document.querySelectorAll("[data-install]").forEach(function (b) {
      b.hidden = false;
      b.style.display = "";
    });
  });

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-install]");
    if (!b || !deferred) return;
    deferred.prompt();
    deferred.userChoice.then(function () {
      deferred = null;
      b.hidden = true;
    });
  });

  window.addEventListener("appinstalled", function () {
    document.querySelectorAll("[data-install]").forEach(function (b) {
      b.hidden = true;
    });
  });

  function ask(msg) {
    return navigator.serviceWorker.ready.then(function (reg) {
      return new Promise(function (res, rej) {
        var ch = new MessageChannel();
        ch.port1.onmessage = function (ev) {
          if (ev.data && ev.data.ok) res(ev.data);
          else rej(new Error((ev.data && ev.data.error) || "فشل"));
        };
        reg.active.postMessage(msg, [ch.port2]);
      });
    });
  }

  // واجهة عامة للتحميل للأوفلاين (للملفات على نفس الموقع فقط)
  window.pwa = {
    download: function (url) {
      return ask({ type: "DL", url: url });
    },
    remove: function (url) {
      return ask({ type: "RM", url: url });
    },
    list: function () {
      return ask({ type: "LIST" }).then(function (r) {
        return r.urls || [];
      });
    }
  };
})();
