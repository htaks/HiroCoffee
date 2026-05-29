// ================================================================
// Hiro Coffee - デモストア (Supabase 未設定時の擬似データストア)
//
// config.js の SUPABASE_URL / SUPABASE_ANON_KEY がプレースホルダー
// (YOUR-PROJECT-ID 等) のままだと実通信ができないため、
// localStorage を保存先とした擬似的な API を提供します。
//
// 公開 API:
//   window.HIRO_DEMO_STORE.isSupabaseConfigured(cfg?) -> boolean
//   window.HIRO_DEMO_STORE.listAll() -> Promise<Reservation[]>
//   window.HIRO_DEMO_STORE.insert(record) -> Promise<Reservation>
//   window.HIRO_DEMO_STORE.updateStatus(id, status) -> Promise<Reservation|null>
//   window.HIRO_DEMO_STORE.remove(id) -> Promise<Reservation|null>
//   window.HIRO_DEMO_STORE.onChange(cb) -> ()=>void  // 解除関数
//
// イベントの種類: "INSERT" | "UPDATE" | "DELETE" | "REFRESH"
// ================================================================

(function () {
  function storagePrefix() {
    return (window.HIRO_CONFIG || {}).STORAGE_PREFIX || "hiro";
  }

  function getStorageKey() {
    return storagePrefix() + "_demo_reservations";
  }

  function getChannelName() {
    return storagePrefix() + "-demo-store";
  }

  function read() {
    try {
      const raw = localStorage.getItem(getStorageKey());
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      console.warn("[demo-store] read failed", e);
      return [];
    }
  }

  function write(arr) {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(arr));
    } catch (e) {
      console.warn("[demo-store] write failed", e);
    }
  }

  function isPlaceholder(s) {
    if (!s || typeof s !== "string") return true;
    const t = s.trim();
    if (!t) return true;
    if (t.indexOf("YOUR-") !== -1) return true;
    if (t.indexOf("YOUR_") !== -1) return true;
    if (t.indexOf("REPLACE_") !== -1) return true;
    if (t.indexOf("REPLACE-") !== -1) return true;
    return false;
  }

  function isSupabaseConfigured(cfg) {
    cfg = cfg || window.HIRO_CONFIG || {};
    return !isPlaceholder(cfg.SUPABASE_URL) && !isPlaceholder(cfg.SUPABASE_ANON_KEY);
  }

  let broadcastChannel = null;
  try {
    if ("BroadcastChannel" in window) {
      broadcastChannel = new BroadcastChannel(getChannelName());
    }
  } catch (e) {
    broadcastChannel = null;
  }

  function notify(event, payload) {
    const detail = { event, payload };
    try {
      window.dispatchEvent(new CustomEvent("hiro-demo-store", { detail }));
    } catch (e) {}
    if (broadcastChannel) {
      try { broadcastChannel.postMessage(detail); } catch (e) {}
    }
  }

  async function listAll() {
    const items = read();
    items.sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
    return items;
  }

  function getJstDayKey(date) {
    date = date || new Date();
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Tokyo",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const month = parts.find((p) => p.type === "month").value;
    const day = parts.find((p) => p.type === "day").value;
    return month + day;
  }

  function nextReservationNo(items) {
    const dayKey = getJstDayKey();
    let max = 0;
    for (const row of items) {
      const no = String(row.reservation_no || "");
      if (!no.startsWith(dayKey + "-")) continue;
      const seq = parseInt(no.split("-")[1], 10);
      if (seq > max) max = seq;
    }
    return dayKey + "-" + String(max + 1).padStart(3, "0");
  }

  async function insert(record) {
    record = record || {};
    const items = read();
    const row = {
      id: "demo-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7),
      reservation_no: record.reservation_no || nextReservationNo(items),
      created_at: new Date().toISOString(),
      status: record.status || "pending",
      name: String(record.name || ""),
      item: String(record.item || ""),
      time: String(record.time || ""),
      note: String(record.note || ""),
      wants_bag: !!record.wants_bag,
      total_amount: record.total_amount != null
        ? Number(record.total_amount)
        : (window.HIRO_MENU_PRICES
          ? window.HIRO_MENU_PRICES.calcTotalFromItemString(record.item, !!record.wants_bag)
          : 0),
      line_user_id: record.line_user_id ? String(record.line_user_id) : "",
      line_is_friend: record.line_is_friend === true
        ? true
        : (record.line_is_friend === false ? false : null),
      line_notified_at: record.line_notified_at || null,
    };
    items.push(row);
    write(items);
    notify("INSERT", row);
    return row;
  }

  async function updateStatus(id, status) {
    const items = read();
    const i = items.findIndex((r) => String(r.id) === String(id));
    if (i < 0) return null;
    items[i].status = status;
    write(items);
    notify("UPDATE", items[i]);
    return items[i];
  }

  async function remove(id) {
    const items = read();
    const i = items.findIndex((r) => String(r.id) === String(id));
    if (i < 0) return null;
    const removed = items.splice(i, 1)[0];
    write(items);
    notify("DELETE", removed);
    return removed;
  }

  function onChange(cb) {
    const localHandler = (e) => {
      if (!e || !e.detail) return;
      try { cb(e.detail.event, e.detail.payload); } catch (err) { console.error(err); }
    };
    window.addEventListener("hiro-demo-store", localHandler);

    let bc = null;
    try {
      if ("BroadcastChannel" in window) {
        bc = new BroadcastChannel(getChannelName());
        bc.onmessage = (ev) => {
          if (!ev || !ev.data) return;
          try { cb(ev.data.event, ev.data.payload); } catch (err) { console.error(err); }
        };
      }
    } catch (e) { bc = null; }

    const storageHandler = (ev) => {
      if (ev.key === getStorageKey()) {
        try { cb("REFRESH", null); } catch (err) { console.error(err); }
      }
    };
    window.addEventListener("storage", storageHandler);

    return function unsubscribe() {
      window.removeEventListener("hiro-demo-store", localHandler);
      window.removeEventListener("storage", storageHandler);
      if (bc) { try { bc.close(); } catch (e) {} }
    };
  }

  window.HIRO_DEMO_STORE = {
    get STORAGE_KEY() { return getStorageKey(); },
    isSupabaseConfigured,
    listAll,
    insert,
    updateStatus,
    remove,
    onChange,
  };
})();
