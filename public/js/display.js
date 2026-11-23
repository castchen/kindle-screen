(function () {
  var screenEl = document.getElementById("screen");
  var labelEl = document.getElementById("label");
  var hoursEl = document.getElementById("timeHours");
  var minsEl = document.getElementById("timeMins");
  var subEl = document.getElementById("sub");
  var idleEl = document.getElementById("idle");

  var state = { mode: "timer", startedAt: null, message: "" };
  var lastPaintKey = "";

  function viewport() {
    var w =
      window.innerWidth ||
      document.documentElement.clientWidth ||
      screenEl.clientWidth ||
      600;
    var h =
      window.innerHeight ||
      document.documentElement.clientHeight ||
      screenEl.clientHeight ||
      800;
    return { w: w, h: h };
  }

  function setFont(el, px) {
    el.style.fontSize = px + "px";
  }

  function measure(el, fontPx) {
    var probe = document.createElement("div");
    probe.style.cssText =
      "position:absolute;left:-99999px;top:0;visibility:hidden;white-space:nowrap;width:auto;height:auto;margin:0;padding:0;font-weight:" +
      (window.getComputedStyle(el).fontWeight || "900") +
      ";font-family:" +
      (window.getComputedStyle(el).fontFamily || "sans-serif") +
      ";line-height:0.95;font-size:" +
      fontPx +
      "px;";
    probe.textContent = el.textContent || "";
    document.body.appendChild(probe);
    var size = { w: probe.offsetWidth, h: probe.offsetHeight };
    document.body.removeChild(probe);
    return size;
  }

  function maxFont(el, lo, hi, maxW, maxH) {
    while (lo < hi) {
      var mid = Math.ceil((lo + hi) / 2);
      var size = measure(el, mid);
      if (size.w <= maxW && size.h <= maxH) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }
    setFont(el, lo);
    return lo;
  }

  function place(el, topPx, vpW) {
    el.style.top = Math.max(0, Math.floor(topPx)) + "px";
    el.style.left = "0";
    el.style.width = vpW + "px";
  }

  function fitIdle(vp) {
    var maxW = Math.floor(vp.w * 0.92);
    maxFont(idleEl, 40, Math.floor(Math.min(vp.w, vp.h) * 0.3), maxW, Math.floor(vp.h * 0.7));
    var size = measure(idleEl, parseInt(idleEl.style.fontSize, 10) || 40);
    place(idleEl, (vp.h - size.h) / 2, vp.w);
  }

  function fitTimer(vp) {
    var maxW = Math.floor(vp.w * 0.96);
    var labelBand = { el: labelEl, start: 0.02, end: 0.12 };
    var hoursBand = { el: hoursEl, start: 0.12, end: 0.48 };
    var minsBand = { el: minsEl, start: 0.48, end: 0.84 };
    var subBand = { el: subEl, start: 0.84, end: 0.98 };
    var mainBandH = Math.floor(vp.h * 0.36);

    // 先各自能到多大，再取较小值，保证「N小时」「N分」完全同字号
    var hoursSize = maxFont(hoursEl, 24, Math.floor(mainBandH * 0.95), maxW, mainBandH);
    var minsSize = maxFont(minsEl, 24, Math.floor(mainBandH * 0.95), maxW, mainBandH);
    var shared = Math.min(hoursSize, minsSize);
    setFont(hoursEl, shared);
    setFont(minsEl, shared);

    maxFont(
      labelEl,
      18,
      Math.floor(vp.h * 0.08),
      maxW,
      Math.floor(vp.h * 0.1)
    );
    maxFont(
      subEl,
      14,
      Math.floor(vp.h * 0.06),
      maxW,
      Math.floor(vp.h * 0.12)
    );

    var bands = [labelBand, hoursBand, minsBand, subBand];
    var i;
    for (i = 0; i < bands.length; i++) {
      var b = bands[i];
      var bandH = Math.max(20, Math.floor(vp.h * (b.end - b.start)));
      var measured = measure(b.el, parseInt(b.el.style.fontSize, 10) || 20);
      place(b.el, vp.h * b.start + (bandH - measured.h) / 2, vp.w);
    }
  }

  function fitText() {
    var vp = viewport();
    screenEl.style.width = vp.w + "px";
    screenEl.style.height = vp.h + "px";
    if (!idleEl.classList.contains("hidden")) {
      fitIdle(vp);
    } else {
      fitTimer(vp);
    }
  }

  function paint() {
    var elapsed = KindleScreen.formatElapsed(state.startedAt, Date.now());
    var vp = viewport();
    var key =
      state.mode +
      "|" +
      (state.startedAt || "") +
      "|" +
      (state.message || "") +
      "|" +
      (elapsed ? elapsed.totalMinutes : "none") +
      "|" +
      vp.w +
      "x" +
      vp.h;

    if (state.mode === "text" && state.message) {
      idleEl.textContent = state.message;
      idleEl.classList.remove("hidden");
      labelEl.classList.add("hidden");
      hoursEl.classList.add("hidden");
      minsEl.classList.add("hidden");
      subEl.classList.add("hidden");
    } else if (!elapsed) {
      idleEl.textContent = "尚未开始计时";
      idleEl.classList.remove("hidden");
      labelEl.classList.add("hidden");
      hoursEl.classList.add("hidden");
      minsEl.classList.add("hidden");
      subEl.classList.add("hidden");
    } else {
      idleEl.classList.add("hidden");
      labelEl.classList.remove("hidden");
      hoursEl.classList.remove("hidden");
      minsEl.classList.remove("hidden");
      subEl.classList.remove("hidden");
      labelEl.textContent = "距上次吃奶";
      hoursEl.textContent = elapsed.hours + "小时";
      minsEl.textContent = elapsed.minutes + "分";
      subEl.textContent =
        "开始于 " + KindleScreen.formatClock(state.startedAt);
    }

    if (key !== lastPaintKey) {
      lastPaintKey = key;
      fitText();
      setTimeout(fitText, 50);
      setTimeout(fitText, 250);
      setTimeout(fitText, 800);
    } else {
      fitText();
    }
  }

  function refreshState() {
    KindleScreen.fetchState()
      .then(function (next) {
        state = next;
        paint();
      })
      .catch(function () {});
  }

  paint();
  refreshState();
  setInterval(paint, 10000);
  setInterval(refreshState, 5000);
  window.addEventListener("resize", function () {
    lastPaintKey = "";
    paint();
  });
  window.addEventListener("orientationchange", function () {
    setTimeout(function () {
      lastPaintKey = "";
      paint();
    }, 300);
  });
})();
