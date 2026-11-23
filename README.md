# Kindle 喂奶计时屏

把 Kindle 实验性浏览器当成远程大字显示器：手机设定宝宝上次吃奶时间，Kindle 全屏显示已经过了多久。

## 功能

- **手机控制页** `/control.html`：一键「宝宝刚吃完」、指定时间、清空
- **Kindle 显示页** `/display.html`：黑白高对比、字号尽量撑满屏幕，约每分钟自动刷新
- **远程文字**（预留）：控制页可发送短文字到 Kindle，之后可切回计时
- 可选 `ACCESS_TOKEN`：限制谁能改状态（显示页只读，无需令牌）

## 部署到云服务器

```bash
git clone <你的仓库>
cd kindle-screen
npm install
PORT=3000 ACCESS_TOKEN=换成你的口令 npm start
```

或用 Docker：

```bash
docker build -t kindle-screen .
docker run -d --name kindle-screen \
  -p 3000:3000 \
  -e ACCESS_TOKEN=换成你的口令 \
  -v kindle-screen-data:/data \
  kindle-screen
```

建议前面挂 Nginx / Caddy，用 HTTPS 域名访问。

## Kindle 使用步骤

1. Kindle 打开 **实验性浏览器**，访问：`https://你的域名/display.html`
2. 尽量横屏；部分机型可把浏览器加到主屏，减少工具栏占用
3. 手机打开：`https://你的域名/control.html`
4. 若设置了 `ACCESS_TOKEN`，在控制页底部填一次即可
5. 点 **宝宝刚吃完**，Kindle 屏上会出现「距上次吃奶 X 小时 Y 分」

## 本地开发

```bash
npm install
npm run dev
```

浏览器打开 http://127.0.0.1:3000

## API

- `GET /api/state` — 当前状态
- `POST /api/state` — 更新状态（JSON）
  - `{ "action": "start_now" }`
  - `{ "action": "clear" }`
  - `{ "mode": "timer", "startedAt": "ISO时间" }`
  - `{ "mode": "text", "message": "短文字" }`

状态保存在 `DATA_DIR/state.json`（默认 `./data`）。
