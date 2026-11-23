(function (global) {
  function getToken() {
    try {
      return localStorage.getItem("kindle_screen_token") || "";
    } catch (e) {
      return "";
    }
  }

  function setToken(token) {
    try {
      localStorage.setItem("kindle_screen_token", token || "");
    } catch (e) {
      /* ignore */
    }
  }

  function fetchState() {
    return fetch("/api/state", { cache: "no-store" }).then(function (res) {
      if (!res.ok) {
        throw new Error("load_failed");
      }
      return res.json();
    });
  }

  function updateState(payload) {
    var headers = { "Content-Type": "application/json" };
    var token = getToken();
    if (token) {
      headers["x-access-token"] = token;
    }
    var body = Object.assign({}, payload);
    if (token) {
      body.token = token;
    }
    return fetch("/api/state", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
      cache: "no-store",
    }).then(function (res) {
      if (res.status === 401) {
        throw new Error("unauthorized");
      }
      if (!res.ok) {
        throw new Error("save_failed");
      }
      return res.json();
    });
  }

  function formatElapsed(startedAt, now) {
    if (!startedAt) {
      return null;
    }
    var start = new Date(startedAt).getTime();
    if (isNaN(start)) {
      return null;
    }
    var ms = Math.max(0, (now || Date.now()) - start);
    var totalMinutes = Math.floor(ms / 60000);
    var hours = Math.floor(totalMinutes / 60);
    var minutes = totalMinutes % 60;
    return {
      hours: hours,
      minutes: minutes,
      totalMinutes: totalMinutes,
      text: hours + " 小时 " + minutes + " 分",
      compact: hours + "时" + minutes + "分",
    };
  }

  // Kindle 浏览器时区常是 UTC，统一按东八区显示，避免「开始于」差 8 小时
  var DISPLAY_TZ_OFFSET_MINUTES = 8 * 60;

  function partsInOffset(date, offsetMinutes) {
    var shifted = new Date(date.getTime() + offsetMinutes * 60000);
    return {
      year: shifted.getUTCFullYear(),
      month: shifted.getUTCMonth() + 1,
      day: shifted.getUTCDate(),
      hours: shifted.getUTCHours(),
      minutes: shifted.getUTCMinutes(),
    };
  }

  function formatClock(iso) {
    if (!iso) {
      return "—";
    }
    var d = new Date(iso);
    if (isNaN(d.getTime())) {
      return "—";
    }
    var p = partsInOffset(d, DISPLAY_TZ_OFFSET_MINUTES);
    var pad = function (n) {
      return n < 10 ? "0" + n : String(n);
    };
    return (
      p.year +
      "-" +
      pad(p.month) +
      "-" +
      pad(p.day) +
      " " +
      pad(p.hours) +
      ":" +
      pad(p.minutes)
    );
  }

  function toLocalInputValue(date) {
    var d = date instanceof Date ? date : new Date();
    var pad = function (n) {
      return n < 10 ? "0" + n : String(n);
    };
    return (
      d.getFullYear() +
      "-" +
      pad(d.getMonth() + 1) +
      "-" +
      pad(d.getDate()) +
      "T" +
      pad(d.getHours()) +
      ":" +
      pad(d.getMinutes())
    );
  }

  global.KindleScreen = {
    getToken: getToken,
    setToken: setToken,
    fetchState: fetchState,
    updateState: updateState,
    formatElapsed: formatElapsed,
    formatClock: formatClock,
    toLocalInputValue: toLocalInputValue,
  };
})(window);
