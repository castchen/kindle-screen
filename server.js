"use strict";

const express = require("express");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const STATE_FILE = path.join(DATA_DIR, "state.json");
const ACCESS_TOKEN = process.env.ACCESS_TOKEN || "";

const DEFAULT_STATE = {
  mode: "timer",
  startedAt: null,
  message: "",
  updatedAt: null,
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readState() {
  try {
    const raw = fs.readFileSync(STATE_FILE, "utf8");
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function writeState(next) {
  ensureDataDir();
  const state = {
    ...DEFAULT_STATE,
    ...next,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
  return state;
}

function requireToken(req, res, next) {
  if (!ACCESS_TOKEN) {
    return next();
  }
  const provided =
    req.get("x-access-token") ||
    req.query.token ||
    (req.body && req.body.token) ||
    "";
  if (provided !== ACCESS_TOKEN) {
    return res.status(401).json({ error: "unauthorized" });
  }
  return next();
}

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));
app.use(express.urlencoded({ extended: false }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/state", (_req, res) => {
  res.json(readState());
});

app.post("/api/state", requireToken, (req, res) => {
  const body = req.body || {};
  const current = readState();
  const next = { ...current };

  if (body.mode === "timer" || body.mode === "text") {
    next.mode = body.mode;
  }

  if (Object.prototype.hasOwnProperty.call(body, "startedAt")) {
    if (body.startedAt === null || body.startedAt === "") {
      next.startedAt = null;
    } else {
      const t = new Date(body.startedAt);
      if (Number.isNaN(t.getTime())) {
        return res.status(400).json({ error: "invalid_startedAt" });
      }
      next.startedAt = t.toISOString();
    }
  }

  if (typeof body.message === "string") {
    next.message = body.message.slice(0, 200);
  }

  if (body.action === "start_now") {
    next.mode = "timer";
    next.startedAt = new Date().toISOString();
  }

  if (body.action === "clear") {
    next.startedAt = null;
    next.message = "";
    next.mode = "timer";
  }

  res.json(writeState(next));
});

app.use(express.static(path.join(__dirname, "public"), {
  etag: true,
  maxAge: process.env.NODE_ENV === "production" ? "5m" : 0,
}));

ensureDataDir();
if (!fs.existsSync(STATE_FILE)) {
  writeState(DEFAULT_STATE);
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`kindle-screen listening on http://0.0.0.0:${PORT}`);
  if (ACCESS_TOKEN) {
    console.log("ACCESS_TOKEN is set — write APIs require the token");
  }
});
