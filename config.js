// ===== サイト共通の設定（このファイルだけ書き換えればOK） =====
//
// Supabase の URL と publishable / anon key を入れてください。
// 取得方法: https://supabase.com → プロジェクト → Project Settings →
//   API Keys → "Publishable key"（または旧: anon public）をコピー
//
// LINE 公式アカウントの友だち追加URLを入れてください。
// 取得方法: LINE Official Account Manager → 友だち追加 → URL/QRコード
//   例: https://lin.ee/xxxxx もしくは https://line.me/R/ti/p/@xxxxx
//
window.HIRO_CONFIG = {
  // 必須: Supabase 接続情報
  SUPABASE_URL: "https://ytyllufahvcrmirxhlaf.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0eWxsdWZhaHZjcm1pcnhobGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NzIwNDIsImV4cCI6MjA5NTU0ODA0Mn0.1LdvRLxI8bfdIh3uu86D7yvb6NlLdVepQLCnlo1rHB8",

  // 必須: LINE 公式アカウント友だち追加URL
  LINE_ADD_URL: "https://line.me/R/ti/p/@409azrvy",

  // LINE Login チャネルの Channel ID（Basic settings）
  // ※ Messaging API チャネル（公式アカウント）と LINE Developers で「リンク」必須
  LINE_LOGIN_CHANNEL_ID: "2010226071",

  // OAuth コールバック URL
  // 本番: 空のまま（アクセス中のURLから自動判定）
  // ローカルで固定したい場合のみ例: "http://127.0.0.1:3000/line-callback.html"
  LINE_OAUTH_REDIRECT_URI: "",

  // サイトのバージョン（フッターに表示）
  SITE_VERSION: "1.2.12",
};
