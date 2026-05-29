// ================================================================
// Hiro Coffee - お客様向け予約履歴（localStorage）
// ================================================================

(function () {
  function storagePrefix() {
    return (window.HIRO_CONFIG || {}).STORAGE_PREFIX || "hiro";
  }

  function storageKey(lineUserId) {
    return storagePrefix() + "-reservation-history:" + String(lineUserId || "guest");
  }

  function read(lineUserId) {
    try {
      const raw = localStorage.getItem(storageKey(lineUserId));
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      console.warn("[reservation-history] read failed", e);
      return [];
    }
  }

  function write(lineUserId, items) {
    try {
      localStorage.setItem(storageKey(lineUserId), JSON.stringify(items));
    } catch (e) {
      console.warn("[reservation-history] write failed", e);
    }
    try {
      window.dispatchEvent(new CustomEvent("hiro-reservation-history", {
        detail: { lineUserId, items },
      }));
    } catch (e) {}
  }

  function mergeStatuses(lineUserId, rows) {
    const map = {};
    for (const row of rows || []) {
      if (row && row.id != null) map[String(row.id)] = row.status || "pending";
    }
    const items = read(lineUserId);
    let changed = false;
    for (const item of items) {
      const nextStatus = map[String(item.id)];
      if (nextStatus && item.status !== nextStatus) {
        item.status = nextStatus;
        changed = true;
      }
    }
    if (changed) write(lineUserId, items);
    return items;
  }

  function readActive(lineUserId) {
    return read(lineUserId).filter((row) => row.status !== "handed_over");
  }

  function addEntry(lineUserId, entry) {
    if (!lineUserId || !entry || !entry.id) return read(lineUserId);
    const items = read(lineUserId).filter((row) => String(row.id) !== String(entry.id));
    if (!entry.status) entry.status = "pending";
    items.unshift(entry);
    write(lineUserId, items);
    return items;
  }

  function keepOnlyIds(lineUserId, activeIds) {
    const set = new Set((activeIds || []).map(String));
    const items = read(lineUserId).filter((row) => set.has(String(row.id)));
    write(lineUserId, items);
    return items;
  }

  function onChange(cb) {
    const handler = (event) => {
      try { cb(event.detail); } catch (err) { console.error(err); }
    };
    window.addEventListener("hiro-reservation-history", handler);
    return function unsubscribe() {
      window.removeEventListener("hiro-reservation-history", handler);
    };
  }

  window.HIRO_RESERVATION_HISTORY = {
    read,
    readActive,
    addEntry,
    mergeStatuses,
    keepOnlyIds,
    onChange,
  };
})();
