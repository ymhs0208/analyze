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
