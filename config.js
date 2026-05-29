// ===== サイト共通の設定 =====
//
// 本番: https://hiro-coffee.com/     → Supabase 本番プロジェクト
// STG : https://stg.hiro-coffee.com/ → Supabase ステージング専用プロジェクト（データ完全分離）
//
// スキーマ同期: supabase/migrations/ を main に push → GitHub Actions が両環境へ反映
// 詳細: supabase/SYNC.md

(function () {
  const SITE_VERSION = "1.3.4";

  const shared = {
    LINE_ADD_URL: "https://line.me/R/ti/p/@409azrvy",
    LINE_LOGIN_CHANNEL_ID: "2010226071",
    LINE_OAUTH_REDIRECT_URI: "",
    SITE_VERSION,
  };

  const production = {
    ...shared,
    ENV: "production",
    SITE_LABEL: "",
    STORAGE_PREFIX: "hiro",
    SUPABASE_URL: "https://ytyllufahvcrmirxhlaf.supabase.co",
    SUPABASE_ANON_KEY: "sb_publishable__tMsPJNPtQbenPLYF2xi_g_L6JpGxYT",
  };

  const staging = {
    ...shared,
    ENV: "staging",
    SITE_LABEL: "STG",
    STORAGE_PREFIX: "hiro-stg",
    SUPABASE_URL: "https://zvatauolaadkvyspenfm.supabase.co",
    SUPABASE_ANON_KEY: "sb_publishable__thtPw2SVerzaieXms33aw_hPG194Lf",
  };

  const host =
    typeof location !== "undefined" ? String(location.hostname || "").toLowerCase() : "";
  const isStaging = host === "stg.hiro-coffee.com" || host.startsWith("stg.");

  const cfg = isStaging ? staging : production;
  cfg.isStaging = isStaging;
  window.HIRO_CONFIG = cfg;
})();
