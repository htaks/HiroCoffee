# ステージング環境（stg.hiro-coffee.com）

本番と **データベースを完全分離** した検証環境です。  
スキーマ（SQL）と Edge Functions は Git 経由で **本番と同時に自動反映** されます。

| 用途 | 本番 | ステージング |
|------|------|----------------|
| お客様サイト | https://hiro-coffee.com/ | https://stg.hiro-coffee.com/ |
| 管理画面 | https://hiro-coffee.com/admin.html | https://stg.hiro-coffee.com/admin.html |
| 注文履歴 | https://hiro-coffee.com/order-history.html | https://stg.hiro-coffee.com/order-history.html |
| Supabase | 本番プロジェクト | **別プロジェクト**（データ混在なし） |
| localStorage | `hiro-*` | `hiro-stg-*` |

`config.js` がホスト名 `stg.*` を検出するとステージング設定に切り替わります。

---

## 1. Vercel にドメインを追加

1. [Vercel Dashboard](https://vercel.com) → HiroCoffee プロジェクト
2. **Settings** → **Domains** → `stg.hiro-coffee.com`
3. DNS（CNAME 等）を設定
4. **Valid Configuration** になるまで待つ

本番と同じプロジェクト・同じ `main` ブランチで OK です。

---

## 2. Supabase ステージングプロジェクト（必須）

### 2-1. 新プロジェクト作成

1. [Supabase Dashboard](https://supabase.com/dashboard) → **New project**
2. 名前例: `hiro-coffee-stg`
3. Database password を控える

### 2-2. GitHub Actions でスキーマ同期

[supabase/SYNC.md](./supabase/SYNC.md) の手順に従い GitHub Secrets を登録し、  
**Actions → Supabase sync → Run workflow** で本番・STG 両方に migrations / Edge Functions を反映します。

### 2-3. config.js を更新

STG プロジェクトの **Settings → API** から:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`（Publishable key）

を `config.js` の **staging** ブロックに設定して push してください。

### 2-4. STG 用 Auth

STG プロジェクト → **Authentication**:

| 項目 | 値 |
|------|-----|
| Site URL | `https://stg.hiro-coffee.com` |
| Redirect URLs | `https://stg.hiro-coffee.com/**` |

**Users** で管理画面用アカウントを STG 用に新規作成（本番とは別）。

---

## 3. SQL の運用ルール

**Dashboard で本番だけ SQL を実行しないでください。** STG に反映されません。

正しい手順:

1. `supabase/migrations/011_xxx.sql` のようにファイルを追加
2. `main` に push
3. GitHub Actions が **本番 → STG** の順で自動適用

詳細: [supabase/SYNC.md](./supabase/SYNC.md)

---

## 4. LINE Developers

[LINE Developers Console](https://developers.line.biz/) → LINE Login チャネル

**Callback URL** に追加:

```
https://stg.hiro-coffee.com/line-callback.html
```

---

## 5. 動作確認

1. https://stg.hiro-coffee.com/ を開く
2. バナー: **「ステージング環境（専用DB・本番データとは分離）」**
3. フッター: `STG · v1.3.x`
4. テイクアウト予約・管理画面ログイン（STG 用 Auth アカウント）

---

## 6. ローカルで STG 設定を試す（任意）

`hosts` に `127.0.0.1 stg.hiro-coffee.com` を追加し、

```bash
node preview-server.js
```

で `http://stg.hiro-coffee.com:3000/` を開くと STG モードになります。
