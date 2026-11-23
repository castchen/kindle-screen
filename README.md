# Kindle 喂奶计时屏

把 Kindle 实验性浏览器当成远程大字显示器：手机设定宝宝上次吃奶时间，Kindle 全屏显示已经过了多久。

## 功能

- **手机控制页** `/control.html`：一键「宝宝刚吃完」、指定时间、清空
- **Kindle 显示页** `/display.html`：黑白高对比、字号尽量撑满屏幕，约每分钟自动刷新
- **远程文字**（预留）：控制页可发送短文字到 Kindle，之后可切回计时
- 可选 `ACCESS_TOKEN`：限制谁能改状态（显示页只读，无需令牌）

## 部署到云服务器

```bash
git clone https://github.com/castchen/kindle-screen.git
cd kindle-screen
npm install
```

**不要**直接前台跑 `npm start` 再关终端——进程会一起退出。任选下面一种后台方式。

### 方式 A：后台脚本（最快）

```bash
chmod +x scripts/run-background.sh
PORT=3000 ACCESS_TOKEN=换成你的口令 ./scripts/run-background.sh
```

关掉网页终端 / SSH 后服务仍继续。日志在 `app.log`。

### 方式 B：systemd（推荐，开机自启）

```bash
sudo mkdir -p /opt/kindle-screen
sudo rsync -a --exclude node_modules ./ /opt/kindle-screen/
cd /opt/kindle-screen && sudo npm install --omit=dev
sudo cp deploy/kindle-screen.service /etc/systemd/system/
# 编辑服务文件，改 ACCESS_TOKEN，确认 node 路径：which node
sudo nano /etc/systemd/system/kindle-screen.service
sudo systemctl daemon-reload
sudo systemctl enable --now kindle-screen
sudo systemctl status kindle-screen
```

### 方式 C：Docker

```bash
docker build -t kindle-screen .
docker run -d --name kindle-screen --restart unless-stopped \
  -p 3000:3000 \
  -e ACCESS_TOKEN=换成你的口令 \
  -v kindle-screen-data:/data \
  kindle-screen
```

云安全组放行对应端口。可用 `http://公网IP:端口` 访问；有域名时再挂 Nginx / Caddy 上 HTTPS。

## Kindle 使用步骤

1. Kindle 打开 **实验性浏览器**，访问：`http://你的公网IP:端口/display.html`
2. 尽量横屏；部分机型可把浏览器加到主屏，减少工具栏占用
3. 手机打开：`http://你的公网IP:端口/control.html`
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
