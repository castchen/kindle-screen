(function () {
  var labelEl = document.getElementById("label");
  var timeEl = document.getElementById("time");
  var subEl = document.getElementById("sub");
  var idleEl = document.getElementById("idle");
  var screenEl = document.getElementById("screen");

  var state = { mode: "timer", startedAt: null, message: "" };
  var lastPaintKey = "";

  function fitText() {
  var width = screenEl.clientWidth * 0.88;
  var height = screenEl.clientHeight * 0.86;
    var candidates = [];

    if (!idleEl.classList.contains("hidden")) {
      candidates.push(idleEl);
    } else {
      candidates.push(labelEl, timeEl, subEl);
    }

    var i;
    for (i = 0; i < candidates.length; i++) {
      candidates[i].style.fontSize = "16px";
    }

    function fits(el, size) {
      el.style.fontSize = size + "px";
      return el.scrollWidth <= width && el.scrollHeight <= height * 0.5;
    }

    if (!idleEl.classList.contains("hidden")) {
      var lo = 24;
      var hi = Math.floor(Math.min(width, height) * 0.28);
      while (lo < hi) {
        var mid = Math.ceil((lo + hi) / 2);
        if (fits(idleEl, mid)) {
          lo = mid;
        } else {
          hi = mid - 1;
        }
      }
      idleEl.style.fontSize = lo + "px";
      return;
    }

    var timeLo = 40;
    var timeHi = Math.floor(Math.min(width * 0.42, height * 0.42));
    while (timeLo < timeHi) {
      var timeMid = Math.ceil((timeLo + timeHi) / 2);
      timeEl.style.fontSize = timeMid + "px";
      if (timeEl.scrollWidth <= width && timeEl.scrollHeight <= height * 0.55) {
        timeLo = timeMid;
      } else {
        timeHi = timeMid - 1;
      }
    }
    timeEl.style.fontSize = timeLo + "px";

    var labelSize = Math.max(18, Math.floor(timeLo * 0.28));
    labelEl.style.fontSize = labelSize + "px";
    while (labelEl.scrollWidth > width && labelSize > 14) {
      labelSize -= 1;
      labelEl.style.fontSize = labelSize + "px";
    }

    var subSize = Math.max(16, Math.floor(timeLo * 0.22));
    subEl.style.fontSize = subSize + "px";
    while (subEl.scrollWidth > width && subSize > 12) {
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
      (elapsed ? elapsed.totalMinutes : "none");

    if (state.mode === "text" && state.message) {
      idleEl.textContent = state.message;
      idleEl.classList.remove("hidden");
      labelEl.classList.add("hidden");
      timeEl.classList.add("hidden");
      subEl.classList.add("hidden");
    } else if (!elapsed) {
      idleEl.textContent = "尚未开始计时";
      idleEl.classList.remove("hidden");
      labelEl.classList.add("hidden");
      timeEl.classList.add("hidden");
      subEl.classList.add("hidden");
    } else {
      idleEl.classList.add("hidden");
      labelEl.classList.remove("hidden");
      timeEl.classList.remove("hidden");
      subEl.classList.remove("hidden");
      labelEl.textContent = "距上次吃奶";
      timeEl.textContent = elapsed.hours + " 小时 " + elapsed.minutes + " 分";
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
  window.addEventListener("resize", fitText);
  window.addEventListener("orientationchange", function () {
    setTimeout(fitText, 300);
  });
})();
