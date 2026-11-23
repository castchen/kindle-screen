(function () {
  var labelEl = document.getElementById("label");
  var hoursEl = document.getElementById("timeHours");
  var minsEl = document.getElementById("timeMins");
  var subEl = document.getElementById("sub");
  var idleEl = document.getElementById("idle");
  var screenEl = document.getElementById("screen");

  var state = { mode: "timer", startedAt: null, message: "" };
  var lastPaintKey = "";

  function maxFont(el, lo, hi, maxWidth, maxHeight) {
    while (lo < hi) {
      var mid = Math.ceil((lo + hi) / 2);
      el.style.fontSize = mid + "px";
      if (el.scrollWidth <= maxWidth && el.scrollHeight <= maxHeight) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }
    el.style.fontSize = lo + "px";
    return lo;
  }

  function fitText() {
    var width = screenEl.clientWidth * 0.9;
    var height = screenEl.clientHeight * 0.9;

    if (!idleEl.classList.contains("hidden")) {
      idleEl.style.fontSize = "16px";
      maxFont(
        idleEl,
        28,
        Math.floor(Math.min(width, height) * 0.22),
        width,
        height * 0.7
      );
      return;
    }

    labelEl.style.fontSize = "16px";
    hoursEl.style.fontSize = "16px";
    minsEl.style.fontSize = "16px";
    subEl.style.fontSize = "16px";

    // 竖屏：小时 / 分钟分两行，尽量撑满
    var labelBudget = height * 0.12;
    var subBudget = height * 0.1;
    var mainBudget = height - labelBudget - subBudget;
    var lineBudget = mainBudget * 0.48;

    var hourSize = maxFont(
      hoursEl,
      40,
      Math.floor(Math.min(width * 0.5, lineBudget)),
      width,
      lineBudget
    );
    maxFont(minsEl, 40, hourSize, width, lineBudget);

    var labelSize = Math.max(20, Math.floor(hourSize * 0.28));
    labelEl.style.fontSize = labelSize + "px";
    while (
      (labelEl.scrollWidth > width || labelEl.scrollHeight > labelBudget) &&
      labelSize > 14
    ) {
      labelSize -= 1;
      labelEl.style.fontSize = labelSize + "px";
    }

    var subSize = Math.max(14, Math.floor(hourSize * 0.18));
    subEl.style.fontSize = subSize + "px";
    while (
      (subEl.scrollWidth > width || subEl.scrollHeight > subBudget) &&
      subSize > 12
    ) {
      subSize -= 1;
      subEl.style.fontSize = subSize + "px";
    }
  }

  function paint() {
    var elapsed = KindleScreen.formatElapsed(state.startedAt, Date.now());
    var key =
      state.mode +
      "|" +
      (state.startedAt || "") +
      "|" +
      (state.message || "") +
      "|" +
      (elapsed ? elapsed.totalMinutes : "none") +
      "|" +
      screenEl.clientWidth +
      "x" +
      screenEl.clientHeight;

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
      hoursEl.textContent = elapsed.hours + " 小时";
      minsEl.textContent = elapsed.minutes + " 分";
      subEl.textContent =
        "开始于 " + KindleScreen.formatClock(state.startedAt);
    }

    if (key !== lastPaintKey) {
      lastPaintKey = key;
      fitText();
    }
  }

  function refreshState() {
    KindleScreen.fetchState()
      .then(function (next) {
        state = next;
        paint();
      })
      .catch(function () {
        /* keep last known state */
      });
  }

  paint();
  refreshState();
  setInterval(paint, 10000);
  setInterval(refreshState, 5000);
  window.addEventListener("resize", function () {
    lastPaintKey = "";
    fitText();
  });
  window.addEventListener("orientationchange", function () {
    setTimeout(function () {
      lastPaintKey = "";
      fitText();
    }, 300);
  });
})();
