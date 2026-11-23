(function () {
  var statusEl = document.getElementById("status");
  var toastEl = document.getElementById("toast");
  var timeInput = document.getElementById("startedAt");
  var messageInput = document.getElementById("message");
  var tokenInput = document.getElementById("token");
  var form = document.getElementById("setForm");

  function toast(text) {
    toastEl.textContent = text || "";
  }

  function render(state) {
    if (state.startedAt) {
      timeInput.value = KindleScreen.toLocalInputValue(new Date(state.startedAt));
    }
    if (typeof state.message === "string") {
      messageInput.value = state.message;
    }

    var elapsed = KindleScreen.formatElapsed(state.startedAt, Date.now());
    if (state.mode === "text" && state.message) {
      statusEl.innerHTML =
        "当前 Kindle 显示文字：<strong>" +
        escapeHtml(state.message) +
        "</strong>";
      return;
    }
    if (!elapsed) {
      statusEl.innerHTML = "当前：<strong>尚未开始计时</strong>";
      return;
    }
    statusEl.innerHTML =
      "已过 <strong>" +
      elapsed.hours +
      " 小时 " +
      elapsed.minutes +
      " 分</strong><br>开始于 " +
      KindleScreen.formatClock(state.startedAt);
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function load() {
    KindleScreen.fetchState()
      .then(function (state) {
        render(state);
        if (!state.startedAt && !timeInput.value) {
          timeInput.value = KindleScreen.toLocalInputValue(new Date());
        }
      })
      .catch(function () {
        toast("读取状态失败，请检查网络");
      });
  }

  function save(payload, okText) {
    toast("保存中…");
    return KindleScreen.updateState(payload)
      .then(function (state) {
        render(state);
        toast(okText || "已更新");
        return state;
      })
      .catch(function (err) {
        if (err && err.message === "unauthorized") {
          toast("访问令牌不正确，请在下方填写 ACCESS_TOKEN");
        } else {
          toast("保存失败，请重试");
        }
      });
  }

  document.getElementById("startNow").addEventListener("click", function () {
    save({ action: "start_now" }, "已从现在开始计时");
  });

  document.getElementById("clearBtn").addEventListener("click", function () {
    save({ action: "clear" }, "已清空");
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!timeInput.value) {
      toast("请选择时间");
      return;
    }
    var local = new Date(timeInput.value);
    if (isNaN(local.getTime())) {
      toast("时间格式无效");
      return;
    }
    save(
      { mode: "timer", startedAt: local.toISOString() },
      "已设置开始时间"
    );
  });

  document.getElementById("sendText").addEventListener("click", function () {
    var message = (messageInput.value || "").trim();
    if (!message) {
      toast("请输入要显示的文字");
      return;
    }
    save({ mode: "text", message: message }, "已发送到 Kindle");
  });

  document.getElementById("backToTimer").addEventListener("click", function () {
    save({ mode: "timer" }, "已切回计时显示");
  });

  tokenInput.value = KindleScreen.getToken();
  tokenInput.addEventListener("change", function () {
    KindleScreen.setToken(tokenInput.value.trim());
    toast("令牌已保存到本机");
  });

  load();
  setInterval(load, 30000);
})();
