# Z_Free 部署说明（阿里云 ECS）

服务器示例：`39.106.138.81`，系统 Alibaba Cloud Linux 3。

## 一、本地打包

在项目根目录 `c:\zg\code\react` 执行：

```bash
node scripts/pack-release.mjs
```

生成目录 `release/`：

| 目录/文件 | 说明 |
|-----------|------|
| `dist/` | 前端静态资源 |
| `reactBack/` | 后端（无 node_modules） |
| `nginx-zfree.conf` | Nginx 配置示例 |
| `DEPLOY.md` | 本说明 |

也可用 WinSCP / `scp` 把整个 `release` 上传到服务器，例如 `/opt/zfree/`。

## 二、服务器目录建议

```text
/opt/zfree/
  dist/          ← release/dist
  reactBack/     ← release/reactBack
```

## 三、后端

```bash
cd /opt/zfree/reactBack
cp .env.example .env
# 编辑 .env：数据库在 ECS 本机时用 DB_HOST=127.0.0.1
nano .env
```

`.env` 示例：

```env
PORT=3009
JWT_SECRET=请改成随机长字符串
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=learner
DB_PASSWORD=你的密码
DB_NAME=learning_db
```

安装依赖并启动（需已安装 Node 18+）：

```bash
npm ci --omit=dev
npm install -g pm2
pm2 start server.js --name zfree-api
pm2 save
pm2 startup
```

## 四、前端 + Nginx

```bash
yum install -y nginx
cp /opt/zfree/nginx-zfree.conf /etc/nginx/conf.d/zfree.conf
# 确认 conf 里 root 为 /opt/zfree/dist
nginx -t && systemctl enable nginx && systemctl restart nginx
```

## 五、安全组

在阿里云控制台 → 安全组，放行：

- **80**（HTTP，访问网站）
- **443**（若上 HTTPS）
- **22**（SSH）
- **3306** 仅内网或不要对公网开放（数据库建议只本机访问）

后端 **3009** 可不对外开放，由 Nginx 反代 `/api` 即可。

## 六、验证

1. 浏览器打开 `http://39.106.138.81`
2. 使用 `monster / monster` 登录（管理员）；测试可用 `admin / admin123`
3. `pm2 logs zfree-api` 查看接口日志

## 七、更新发布

本地重新 `node scripts/pack-release.mjs`，上传覆盖 `dist` 与 `reactBack`（保留服务器 `.env`），然后：

```bash
cd /opt/zfree/reactBack && npm ci --omit=dev
pm2 restart zfree-api
# 仅前端变更时无需重启后端
```
