// ================================================================
// Hiro Coffee - サイト共通ナビ（ハンバーガーメニュー）
// ================================================================

(function () {
  const NAV_ICONS = {
    menu: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M6 4h12a1 1 0 0 1 0 2H6a1 1 0 1 1 0-2zm0 5h12a1 1 0 0 1 0 2H6a1 1 0 1 1 0-2zm0 5h12a1 1 0 0 1 0 2H6a1 1 0 1 1 0-2z"/></svg>',
    reserve: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M8 4h8l1 3h4v2h-1.05c.55 1.2.88 2.53.95 3.95H20v2h-1.1A8 8 0 0 1 4 11H3V9h1.05A8 8 0 0 1 12 4.05V4h1V3H8V4zm-1 7a6 6 0 1 0 12 0H7z"/></svg>',
    history: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M7 3h10a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2-3-2V5a2 2 0 0 1 2-2zm1 4v2h8V7H8zm0 4v2h6v-2H8z"/></svg>',
    location: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"/></svg>',
    hours: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 5v5.17l3.59 2.12-.98 1.62L11 13V7h2z"/></svg>',
    about: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 2c1.8 0 3.45.62 4.76 1.66l-1.42 1.42A5.98 5.98 0 0 0 12 4a8 8 0 1 0 8 8c0-.68-.09-1.34-.25-1.97l1.93-.64A10 10 0 1 1 12 2zm6.3 3.7 1.4 1.4-8 8-3.5-3.5 1.4-1.4 2.1 2.1 6.7-6.6z"/></svg>',
  };

  function navLink(iconKey, label, attrs) {
    attrs = attrs || {};
    const icon = NAV_ICONS[iconKey] || "";
    const attrStr = Object.keys(attrs).map((key) => key + '="' + attrs[key] + '"').join(" ");
    return (
      '<li><button type="button" class="site-nav__link" ' + attrStr + '>' +
        '<span class="site-nav__icon">' + icon + '</span>' +
        '<span class="site-nav__label">' + label + '</span>' +
      '</button></li>'
    );
  }

  function renderSiteNav() {
    const pageName = (location.pathname.split("/").pop() || "").toLowerCase();
    const onHistoryPage = pageName === "order-history.html";
    function pageHref(hash) {
      return onHistoryPage ? ("index.html" + hash) : hash;
    }

    return (
      '<nav id="siteNavDrawer" class="site-nav" hidden aria-hidden="true">' +
        '<div class="site-nav__backdrop" id="siteNavBackdrop"></div>' +
        '<div class="site-nav__panel" role="dialog" aria-modal="true" aria-labelledby="siteNavTitle">' +
          '<div class="site-nav__head">' +
            '<h2 id="siteNavTitle" class="site-nav__title">メニュー</h2>' +
            '<button type="button" class="site-nav__close" id="siteNavClose" aria-label="メニューを閉じる">×</button>' +
          '</div>' +
          '<ul class="site-nav__list">' +
            navLink("menu", "メニュー", { "data-nav-href": pageHref("#menu") }) +
            navLink("reserve", "テイクアウト予約", { "data-nav-href": pageHref("#reserve") }) +
            navLink("history", "注文履歴", { "data-nav-href": "order-history.html" }) +
            navLink("location", "アクセス", { "data-nav-href": pageHref("#location") }) +
            navLink("hours", "営業時間", { "data-nav-href": pageHref("#hours") }) +
            navLink("about", "焙煎のこだわり", { "data-nav-href": pageHref("#about") }) +
          '</ul>' +
        '</div>' +
      '</nav>'
    );
  }

  function openSiteNav() {
    const drawer = document.getElementById("siteNavDrawer");
    const btn = document.getElementById("siteMenuBtn");
    if (!drawer) return;
    drawer.hidden = false;
    drawer.setAttribute("aria-hidden", "false");
    if (btn) btn.setAttribute("aria-expanded", "true");
    document.body.classList.add("site-nav-open");
  }

  function closeSiteNav() {
    const drawer = document.getElementById("siteNavDrawer");
    const btn = document.getElementById("siteMenuBtn");
    if (!drawer) return;
    drawer.hidden = true;
    drawer.setAttribute("aria-hidden", "true");
    if (btn) btn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("site-nav-open");
  }

  function initSiteNav() {
    const btn = document.getElementById("siteMenuBtn");
    const closeBtn = document.getElementById("siteNavClose");
    const backdrop = document.getElementById("siteNavBackdrop");
    if (btn) btn.addEventListener("click", openSiteNav);
    if (closeBtn) closeBtn.addEventListener("click", closeSiteNav);
    if (backdrop) backdrop.addEventListener("click", closeSiteNav);
    document.querySelectorAll("[data-nav-href]").forEach((link) => {
      link.addEventListener("click", () => {
        const href = link.getAttribute("data-nav-href");
        if (!href) return;
        closeSiteNav();
        window.location.href = href;
      });
    });
    document.addEventListener("keydown", (event) => {
      const drawer = document.getElementById("siteNavDrawer");
      if (event.key === "Escape" && drawer && !drawer.hidden) {
        closeSiteNav();
      }
    });
  }

  window.HIRO_SITE_NAV = {
    renderSiteNav,
    initSiteNav,
    openSiteNav,
    closeSiteNav,
  };
})();
