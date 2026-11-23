#!/usr/bin/env bash
# 在云服务器上后台启动；关掉 SSH/网页终端后进程仍继续跑
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

mkdir -p "$ROOT/data"
export PORT="${PORT:-3000}"
export DATA_DIR="${DATA_DIR:-$ROOT/data}"
# ACCESS_TOKEN 请在命令前自行 export，例如：
# ACCESS_TOKEN=你的口令 ./scripts/run-background.sh

if pgrep -f "node server.js" >/dev/null 2>&1; then
  echo "已有 node server.js 在跑，先执行: pkill -f 'node server.js'"
  exit 1
fi

nohup node server.js >>"$ROOT/app.log" 2>&1 </dev/null &
PID=$!
disown "$PID" 2>/dev/null || true
echo "已启动 PID=$PID  日志: $ROOT/app.log"
echo "查看: tail -f $ROOT/app.log"
echo "停止: pkill -f 'node server.js'"
