// ================================================================
// Hiro Coffee - 環境表示（ステージングバナー等）
// ================================================================

(function () {
  const cfg = window.HIRO_CONFIG || {};
  if (!cfg.isStaging) return;

  document.documentElement.classList.add("env-staging");

  const robots = document.createElement("meta");
  robots.name = "robots";
  robots.content = "noindex, nofollow";
  document.head.appendChild(robots);

  function bannerText() {
    return "ステージング環境（専用DB・本番データとは分離）";
  }

  function injectBanner() {
    if (document.getElementById("stagingEnvBanner")) return;
    const bar = document.createElement("div");
    bar.id = "stagingEnvBanner";
    bar.className = "staging-env-banner";
    bar.setAttribute("role", "status");
    bar.textContent = bannerText();
    document.body.prepend(bar);
  }

  function updateTitle() {
    const title = document.title;
    if (title && title.indexOf("[STG]") !== 0) {
      document.title = "[STG] " + title;
    }
  }

  function updateVersionLabel() {
    const versionEl = document.getElementById("siteVersion");
    if (!versionEl || !cfg.SITE_VERSION) return;
    const label = cfg.SITE_LABEL ? cfg.SITE_LABEL + " · " : "";
    versionEl.textContent = label + "v" + cfg.SITE_VERSION;
  }

  function init() {
    injectBanner();
    updateTitle();
    updateVersionLabel();
  }

  if (document.body) init();
  else document.addEventListener("DOMContentLoaded", init);
})();
