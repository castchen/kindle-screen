(function () {
  var screenEl = document.getElementById("screen");
  var labelEl = document.getElementById("label");
  var hoursNumEl = document.getElementById("hoursNum");
  var hoursUnitEl = document.getElementById("hoursUnit");
  var minsNumEl = document.getElementById("minsNum");
  var minsUnitEl = document.getElementById("minsUnit");
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

  // 用独立测量节点，避免 width:100% 时 scrollWidth 永远偏大导致字号塌缩
  function measure(el, fontPx) {
    var probe = document.createElement("div");
    probe.style.cssText =
      "position:absolute;left:-99999px;top:0;visibility:hidden;white-space:nowrap;width:auto;height:auto;margin:0;padding:0;font-weight:" +
      (el.style.fontWeight || window.getComputedStyle(el).fontWeight || "900") +
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
    var bands = [
      { el: labelEl, start: 0.015, end: 0.09, num: false },
      { el: hoursNumEl, start: 0.09, end: 0.4, num: true },
      { el: hoursUnitEl, start: 0.4, end: 0.48, num: false },
      { el: minsNumEl, start: 0.48, end: 0.79, num: true },
      { el: minsUnitEl, start: 0.79, end: 0.87, num: false },
      { el: subEl, start: 0.87, end: 0.985, num: false },
    ];

    var i;
    for (i = 0; i < bands.length; i++) {
      var b = bands[i];
      var bandH = Math.max(20, Math.floor(vp.h * (b.end - b.start)));
      var hi = Math.floor(bandH * (b.num ? 1.05 : 0.92));
      maxFont(b.el, 20, Math.max(20, hi), maxW, bandH);
      var size = measure(b.el, parseInt(b.el.style.fontSize, 10) || 20);
      var top = vp.h * b.start + (bandH - size.h) / 2;
      place(b.el, top, vp.w);
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
      hoursNumEl.classList.add("hidden");
      hoursUnitEl.classList.add("hidden");
      minsNumEl.classList.add("hidden");
      minsUnitEl.classList.add("hidden");
      subEl.classList.add("hidden");
    } else if (!elapsed) {
      idleEl.textContent = "尚未开始计时";
      idleEl.classList.remove("hidden");
      labelEl.classList.add("hidden");
      hoursNumEl.classList.add("hidden");
      hoursUnitEl.classList.add("hidden");
      minsNumEl.classList.add("hidden");
      minsUnitEl.classList.add("hidden");
      subEl.classList.add("hidden");
    } else {
      idleEl.classList.add("hidden");
      labelEl.classList.remove("hidden");
      hoursNumEl.classList.remove("hidden");
      hoursUnitEl.classList.remove("hidden");
      minsNumEl.classList.remove("hidden");
      minsUnitEl.classList.remove("hidden");
      subEl.classList.remove("hidden");
      labelEl.textContent = "距上次吃奶";
      hoursNumEl.textContent = String(elapsed.hours);
      hoursUnitEl.textContent = "小时";
      minsNumEl.textContent = String(elapsed.minutes);
      minsUnitEl.textContent = "分";
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
