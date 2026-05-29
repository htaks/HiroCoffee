// ===== サイト共通の設定 =====
//
// 本番: https://hiro-coffee.com/
// STG : https://stg.hiro-coffee.com/
//
// ホスト名が stg.* のとき STAGING 設定が使われます。
// ステージング専用 Supabase を用意したら STAGING の URL / KEY を差し替えてください。

(function () {
  const SITE_VERSION = "1.2.16";

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
    USES_PRODUCTION_DATABASE: false,
  };

  const staging = {
    ...shared,
    ENV: "staging",
    SITE_LABEL: "STG",
    STORAGE_PREFIX: "hiro-stg",
    // TODO: ステージング専用 Supabase プロジェクト作成後に差し替え
    SUPABASE_URL: "https://ytyllufahvcrmirxhlaf.supabase.co",
    SUPABASE_ANON_KEY: "sb_publishable__tMsPJNPtQbenPLYF2xi_g_L6JpGxYT",
    USES_PRODUCTION_DATABASE: true,
  };

  const host =
    typeof location !== "undefined" ? String(location.hostname || "").toLowerCase() : "";
  const isStaging = host === "stg.hiro-coffee.com" || host.startsWith("stg.");

  const cfg = isStaging ? staging : production;
  cfg.isStaging = isStaging;
  window.HIRO_CONFIG = cfg;
})();
