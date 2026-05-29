// ================================================================
// Hiro Coffee - 注文履歴ページ
// ================================================================

(function () {
  const cfg = window.HIRO_CONFIG || {};
  const storagePrefix = cfg.STORAGE_PREFIX || "hiro";
  const LINE_USER_KEY = storagePrefix + "-line-user";
  const historyStore = window.HIRO_RESERVATION_HISTORY;
  const menuPrices = window.HIRO_MENU_PRICES;
  const view = window.HIRO_ORDER_HISTORY_VIEW;
  const demoStore = window.HIRO_DEMO_STORE;

  function loadLinkedLineUser() {
    try {
      const raw = sessionStorage.getItem(LINE_USER_KEY) || localStorage.getItem(LINE_USER_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.line_user_id) return null;
      return parsed;
    } catch (err) {
      return null;
    }
  }

  function renderFullHistory() {
    const listEl = document.getElementById("orderHistoryList");
    const noteEl = document.getElementById("orderHistoryNote");
    const emptyEl = document.getElementById("orderHistoryEmpty");
    const user = loadLinkedLineUser();
    const lineUserId = user && user.line_user_id;

    if (!listEl || !historyStore || !view || !menuPrices) return;

    if (!lineUserId) {
      if (noteEl) {
        noteEl.textContent = "LINE連携後、ご注文の履歴を確認できます。";
        noteEl.hidden = false;
      }
      listEl.innerHTML = "";
      if (emptyEl) emptyEl.hidden = true;
      return;
    }

    const items = historyStore.read(lineUserId);
    if (noteEl) {
      noteEl.textContent = items.length
        ? "これまでのご注文一覧です。"
        : "まだ注文履歴はありません。";
      noteEl.hidden = false;
    }

    if (!items.length) {
      listEl.innerHTML = "";
      if (emptyEl) emptyEl.hidden = false;
      return;
    }

    if (emptyEl) emptyEl.hidden = true;
    listEl.innerHTML = items.map((entry) => view.renderOrderCard(entry, menuPrices)).join("");
  }

  async function syncReservationHistory() {
    const user = loadLinkedLineUser();
    const lineUserId = user && user.line_user_id;
    if (!historyStore || !lineUserId) {
      renderFullHistory();
      return;
    }

    const items = historyStore.read(lineUserId);
    const ids = items.map((row) => row.id).filter(Boolean);
    if (!ids.length) {
      renderFullHistory();
      return;
    }

    const supabaseConfigured = demoStore && demoStore.isSupabaseConfigured(cfg);
    let supabase = null;
    if (supabaseConfigured && window.supabase) {
      supabase = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });
    }

    try {
      if (!supabase && demoStore) {
        const all = await demoStore.listAll();
        const statusRows = all
          .filter((row) => ids.includes(String(row.id)))
          .map((row) => ({ id: row.id, status: row.status || "pending" }));
        historyStore.mergeStatuses(lineUserId, statusRows);
      } else if (supabase) {
        const res = await fetch(cfg.SUPABASE_URL + "/functions/v1/sync-reservation-history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + cfg.SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ line_user_id: lineUserId, ids }),
        });
        if (res.ok) {
          const data = await res.json();
          historyStore.mergeStatuses(lineUserId, Array.isArray(data) ? data : []);
        }
      }
    } catch (err) {
      console.warn("[Hiro Coffee] reservation history sync failed", err);
    }
    renderFullHistory();
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (window.HIRO_SITE_NAV) window.HIRO_SITE_NAV.initSiteNav();
    renderFullHistory();
    syncReservationHistory();
    setInterval(syncReservationHistory, 20000);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") syncReservationHistory();
    });
    if (demoStore && demoStore.onChange) {
      demoStore.onChange(() => syncReservationHistory());
    }
    if (historyStore && historyStore.onChange) {
      historyStore.onChange(() => renderFullHistory());
    }
  });
})();
