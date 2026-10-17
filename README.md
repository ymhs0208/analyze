# 全國會考落點分析

React + Vite 前端，資料與付款、LINE 會員驗證 API 使用 Supabase Edge Functions。

## Cloudflare Pages 部署

在 Cloudflare Dashboard 建立 **Pages** 專案並連接此 GitHub repository，使用下列設定：

| 設定 | 值 |
| --- | --- |
| Production branch | `main` |
| Build command | `npm ci && npm run build` |
| Build output directory | `dist` |
| Node.js version | `24` |

在 Pages 的 **Environment variables** 設定：

```text
VITE_BASE_PATH=/
VITE_SUPABASE_URL=https://<你的專案>.supabase.co
VITE_SUPABASE_ANON_KEY=<Supabase publishable／anon key>
```

`public/_headers` 會在 Pages 與 Workers 靜態資產回應中加入 CSP、反嵌入與其他安全標頭。根目錄建置會移除 GitHub Pages 專用的 `404.html`，讓 Pages 自動使用 SPA fallback；Workers Builds 由 `wrangler.jsonc` 處理單頁路由，不需要 `_redirects`。

預設建置路徑為 `/`；GitHub Pages 工作流程另設 `VITE_BASE_PATH=/spare/`。請將上述 Supabase 變數設在 Cloudflare 的建置環境，前端才能使用會員、付款與資料 API。只有 `VITE_SUPABASE_ANON_KEY`（公開金鑰）可提供給前端，不可填入 service role key。

## 上線前同步更新

以實際 Pages 網址（例如 `https://analyze.pages.dev` 或自訂網域）更新 Supabase Secrets：

```text
ALLOWED_ORIGINS=https://<你的 Pages 網址>
SITE_URL=https://<你的 Pages 網址>
```

並到 LINE Developers Console：

1. 將 LINE Login callback URL 設為 `https://<你的 Supabase 專案>.supabase.co/functions/v1/line-login`。
2. 將隱私權與服務條款網址改為新的 Pages 網址。

ECPay callback 仍維持 Supabase `ecpay-callback` Function；不需放入 Cloudflare Pages。

## Cloudflare Workers Builds 部署

若 Cloudflare 顯示的是 **Workers Builds**（不是 Pages），本專案已包含 `wrangler.jsonc`。設定如下：

| 設定 | 值 |
| --- | --- |
| Worker name | `analyze` |
| Build command | `npm ci && npm run build` |
| Deploy command | `npx wrangler deploy` |

`wrangler.jsonc` 已設定 `build.command: npm run build`，執行 `npx wrangler deploy` 時會先產生 `dist`，因此 Workers Builds 的 Build command 可以留空，避免重複建置。依賴仍由 Cloudflare 自動安裝。

本專案已鎖定 Wrangler 版本，可直接用 `npx wrangler deploy --dry-run` 驗證建置與部署設定。Cloudflare 必須先連接本儲存庫的 `main` 分支，推送才會觸發自動部署。

Worker 會提供 `dist` 靜態資產、處理單頁路由回退，並在 HTTP 回應實際加入 CSP 與反嵌入安全標頭。

## Cloudflare Worker 同網域 API 轉接

Worker 提供以下三個 API，其他 `/functions/*` 路徑回應 404：

- `/functions/v1/backend`
- `/functions/v1/line-login`
- `/functions/v1/ecpay-callback`

以正式網站 `https://analyze.twexam.cc.cd` 為例，設定方式如下：

1. Cloudflare **Settings → Builds → Variables and secrets**（建置變數）：
   - `VITE_SUPABASE_URL=https://analyze.twexam.cc.cd`
   - `VITE_SUPABASE_ANON_KEY=<原本的公開 anon key>`
2. `wrangler.jsonc` 已設定執行變數 `SUPABASE_URL=https://ujltpbzlspbustqjqnar.supabase.co`。
   - 上游網址必須是原本 Supabase 網址，不能填網站本身，避免轉接迴圈。
   - `.env.production` 預設前端 API 為 `https://analyze.twexam.cc.cd`；Cloudflare 已有的同名建置變數會覆蓋此預設，請同步更新。
   - 更換上游專案時修改 `wrangler.jsonc`，`keep_vars` 會保留其他 Dashboard 執行變數。
3. Supabase **Edge Functions → Secrets**：
   - `ALLOWED_ORIGINS=https://analyze.twexam.cc.cd`（如需保留其他網站，用逗號分隔）
   - `SITE_URL=https://analyze.twexam.cc.cd`
4. 儲存後重新建置部署，並確認登入、登出與付款狀態查詢正常。

若要讓 LINE callback 也使用自己的網域，請將 Supabase 的
`LINE_LOGIN_CALLBACK_URL` 與 LINE Developers 的 callback URL **一起改為**
`https://analyze.twexam.cc.cd/functions/v1/line-login`。只改其中一處會導致登入失敗。
ECPay 原有 Supabase callback 網址可繼續使用。

前端金鑰仍只使用公開 anon key。service role、LINE channel secret 與綠界金鑰留在
Supabase。轉接會保留瀏覽器 Origin、API 狀態、LINE 重新導向與 HttpOnly Cookie，
停用 API 快取，並僅轉送會員與付款查詢 Cookie。未設定上游時，API 回應 503，網站
靜態頁面仍可正常開啟。
