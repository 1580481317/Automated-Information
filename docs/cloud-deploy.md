# 云端全自动部署说明

目标：用 GitHub Actions 每天北京时间 09:00 自动读取 Gmail 的 TLDR AI 邮件，用 DeepSeek 翻译和生成速读，创建飞书文档，并给你发送飞书私聊提醒。

## 需要的 GitHub Secrets

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`
- `DEEPSEEK_API_KEY`
- `DEEPSEEK_MODEL`：可选，默认 `deepseek-v4-flash`
- `FEISHU_APP_ID`
- `FEISHU_APP_SECRET`
- `FEISHU_USER_OPEN_ID`：当前为 `ou_afab4dffae772a4ee11f6a558be410c5`

## Google/Gmail 授权

1. 在 Google Cloud Console 创建 OAuth Client，类型选 Web application。
2. 添加 redirect URI：`http://localhost:3000/oauth2callback`
3. 启用 Gmail API。
4. 如果你有下载好的 `client_secret_*.json`，可以直接本地运行：
   ```powershell
   $env:GOOGLE_CLIENT_SECRET_FILE="C:\Users\Flipped\Downloads\client_secret_1068922234644-sbh1icp4njjp8kpnt4h0rgh24mdr8ucs.apps.googleusercontent.com.json"
   npm run auth:gmail:url
   ```
   或者手动设置 `GOOGLE_CLIENT_ID` 后运行：
   ```powershell
   $env:GOOGLE_CLIENT_ID="..."
   npm run auth:gmail:url
   ```
5. 打开输出的授权链接，授权 Gmail 只读权限。
6. 授权后浏览器会跳到 localhost 失败页，复制地址栏里的 `code` 参数。
7. 本地运行：
   ```powershell
   $env:GOOGLE_AUTH_CODE="复制的 code"
   npm run auth:gmail:token
   ```
8. 把输出的 `refresh_token` 存入 GitHub Secret：`GOOGLE_REFRESH_TOKEN`。

## 飞书应用权限

飞书应用需要开启机器人能力，并确保应用可见范围包含你自己。

建议权限：

- `im:message` 或 `im:message:send_as_bot`：用于 bot 私聊提醒。
- `docx:document:create`：用于创建文档。
- `docs:permission.member:create`：用于把 bot 创建的文档授权给你的 open_id。

如果 `docs:permission.member:create` 暂时没开，文档仍可能创建成功，但你可能只能从消息链接打开，不能在“我的空间”自然看到。

## GitHub Actions

`.github/workflows/tldr-ai.yml` 已配置：

- 定时：`0 1 * * *` UTC，即北京时间 09:00。
- 支持手动触发：Actions 页面点 `Run workflow`。
- 失败时会上传 `tmp/` 调试产物。

## 安全提醒

不要把任何 key 写入代码或提交到仓库。你刚在聊天里贴过 DeepSeek key，迁入 GitHub Secrets 后建议在 DeepSeek 后台轮换一次。
