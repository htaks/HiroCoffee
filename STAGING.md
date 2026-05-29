# ステージング環境（stg.hiro-coffee.com）

本番と同じコードを、URL の先頭に `stg.` を付けた環境で動かします。

| 用途 | 本番 | ステージング |
|------|------|----------------|
| お客様サイト | https://hiro-coffee.com/ | https://stg.hiro-coffee.com/ |
| 管理画面 | https://hiro-coffee.com/admin.html | https://stg.hiro-coffee.com/admin.html |
| 注文履歴 | https://hiro-coffee.com/order-history.html | https://stg.hiro-coffee.com/order-history.html |

`config.js` がホスト名 `stg.*` を検出すると、ステージング設定（`STORAGE_PREFIX: hiro-stg` など）に切り替わります。

---

## 1. Vercel にドメインを追加

1. [Vercel Dashboard](https://vercel.com) → HiroCoffee プロジェクト
2. **Settings** → **Domains**
3. **Add** → `stg.hiro-coffee.com`
4. 表示される DNS 設定をドメイン管理（お名前.com 等）に追加  
   - 例: `stg` → CNAME → `cname.vercel-dns.com`
5. **Valid Configuration** になるまで待つ（数分〜最大48時間）

本番 `hiro-coffee.com` と同じプロジェクト・同じ `main` ブランチで OK です。

---

## 2. Supabase（ステージング専用 DB 推奨）

**現状:** `config.js` の STAGING は本番 Supabase と同じ接続先です（画面上部に警告バナー表示）。

本番データを汚さないため、次を推奨します。

1. Supabase で新プロジェクト `hiro-coffee-stg` を作成
2. `supabase/migrations/` の SQL を **001 から順に** SQL Editor で実行
3. Edge Functions を本番と同様にデプロイ（Secrets も設定）
4. `config.js` の **staging** ブロックの `SUPABASE_URL` / `SUPABASE_ANON_KEY` を差し替え
5. `USES_PRODUCTION_DATABASE: false` に変更

---

## 3. LINE Developers（ステージング URL 追加）

[LINE Developers Console](https://developers.line.biz/) → LINE Login チャネル

**Callback URL** に追加:

```
https://stg.hiro-coffee.com/line-callback.html
```

（本番の `https://hiro-coffee.com/line-callback.html` は残したまま）

---

## 3b. Supabase Auth（ステージング URL 追加）

Supabase Dashboard → **Authentication** → **URL Configuration**

**Redirect URLs** に追加:

```
https://stg.hiro-coffee.com/**
https://stg.hiro-coffee.com/admin.html
```

（Site URL は本番 `https://hiro-coffee.com` のままで OK）

---

## 4. 動作確認

1. https://stg.hiro-coffee.com/ を開く
2. 画面上部に **「ステージング環境」** バナーが出る
3. フッターに `STG · v1.2.x` と表示される
4. テイクアウト予約・管理画面が動く

---

## 5. ローカルで STG 設定を試す（任意）

`hosts` に `127.0.0.1 stg.hiro-coffee.com` を追加し、

```bash
node preview-server.js
```

で `http://stg.hiro-coffee.com:3000/` を開くと STG モードになります。
