# Supabase 同期（本番 ↔ ステージング）

本番とステージングは **別 Supabase プロジェクト** でデータを完全分離します。  
スキーマ（SQL）と Edge Functions は **Git リポジトリを唯一の正** とし、変更を **両環境へ自動反映** します。

```
supabase/migrations/*.sql  ──push main──►  GitHub Actions  ──►  本番 DB
                                              │
                                              └──►  ステージング DB

supabase/functions/*       ──push main──►  GitHub Actions  ──►  両環境へ deploy
```

---

## ルール（重要）

| やること | 方法 |
|----------|------|
| テーブル変更・RLS・関数 | `supabase/migrations/` に **新しい SQL ファイル** を追加して `main` に push |
| Edge Function 修正 | `supabase/functions/` を編集して `main` に push |
| 本番 Dashboard で SQL を直接実行 | **非推奨** — STG に反映されません |

> Dashboard で本番だけ SQL を実行しても STG には届きません。  
> **必ず migrations フォルダに SQL を追加して push** してください。push 後 GitHub Actions が本番・STG 両方に `db push` します。

---

## 初回セットアップ

### 1. ステージング用 Supabase プロジェクトを作成

1. [Supabase Dashboard](https://supabase.com/dashboard) → **New project**
2. 名前例: `hiro-coffee-stg`
3. リージョンは本番と同じ（東京推奨）
4. **Database password** を控える（GitHub Secret 用）

### 2. GitHub Secrets を登録

リポジトリ → **Settings** → **Secrets and variables** → **Actions**

| Secret | 内容 |
|--------|------|
| `SUPABASE_ACCESS_TOKEN` | [Account → Access Tokens](https://supabase.com/dashboard/account/tokens) |
| `SUPABASE_DB_PASSWORD_PRODUCTION` | 本番 DB パスワード |
| `SUPABASE_DB_PASSWORD_STAGING` | STG DB パスワード |
| `SUPABASE_PROJECT_REF_STAGING` | STG の project ref（URL の `xxxx.supabase.co` の `xxxx` 部分） |
| `LINE_LOGIN_CHANNEL_SECRET` | LINE Login チャネル Secret |
| `LINE_CHANNEL_ACCESS_TOKEN` | Messaging API チャネル Access Token |

`LINE_LOGIN_CHANNEL_ID` は workflow 内で `2010226071` を使用（必要なら Secret に変更可）。

### 3. 初回同期を実行

Secrets 登録後:

1. GitHub → **Actions** → **Supabase sync (prod + staging)** → **Run workflow**

またはローカル（Supabase CLI インストール済み）:

```powershell
# .env.example を .env にコピーして値を入力
.\scripts\sync-supabase.ps1
```

### 4. config.js の STG 接続先を更新

Supabase STG プロジェクト → **Settings** → **API**

- **Project URL** → `staging.SUPABASE_URL`
- **Publishable key** → `staging.SUPABASE_ANON_KEY`

### 5. STG 専用の Auth 設定

STG プロジェクト → **Authentication** → **URL Configuration**

- **Site URL**: `https://stg.hiro-coffee.com`
- **Redirect URLs**:
  ```
  https://stg.hiro-coffee.com/**
  https://stg.hiro-coffee.com/admin.html
  ```

**Users** で管理画面用アカウントを STG 用に作成（本番 Auth とは別）。

---

## 日常の運用

### 新しい SQL を追加するとき

1. 次の番号でファイルを作成  
   例: `supabase/migrations/011_add_foo.sql`
2. `main` に push
3. Actions が本番 → STG の順で `db push`（数分）

### 手動で再同期したいとき

GitHub Actions → **Supabase sync** → **Run workflow**

---

## マイグレーション一覧

| ファイル | 内容 |
|----------|------|
| `000_initial_schema.sql` | reservations テーブル初期作成 |
| `001`〜`010` | LINE カラム、予約番号、RLS、合計金額 等 |

本番 DB は Dashboard で手動実行済みでも、`IF NOT EXISTS` / `CREATE OR REPLACE` により再適用は安全です。

---

## データについて

| | 本番 | ステージング |
|--|------|--------------|
| Supabase プロジェクト | `ytyllufahvcrmirxhlaf` | 別プロジェクト（要作成） |
| 予約データ | 本番のみ | STG のみ（混在しない） |
| 管理者 Auth | 本番 Users | STG Users（別アカウント） |
| localStorage キー | `hiro-*` | `hiro-stg-*` |

---

## トラブルシュート

**Actions が STG をスキップする**  
→ `SUPABASE_PROJECT_REF_STAGING` / `SUPABASE_DB_PASSWORD_STAGING` が未設定

**STG だけマイグレーション失敗**  
→ STG プロジェクトが新規なら Actions を再実行。Dashboard の SQL Editor でエラー内容を確認

**Dashboard で本番だけ SQL を実行してしまった**  
→ 同じ内容を `supabase/migrations/0xx_*.sql` に追加して push（STG へ反映 + 履歴を Git に残す）
