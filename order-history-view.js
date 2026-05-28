// ================================================================
// Hiro Coffee - 注文履歴の表示（共通）
// ================================================================

(function () {
  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatCustomerStatus(status) {
    if (status === "handed_over") {
      return { label: "お渡し済み", className: "order-status--handed-over" };
    }
    if (status === "done") {
      return { label: "準備完了", className: "order-status--done" };
    }
    return { label: "準備中", className: "order-status--pending" };
  }

  function renderBreakdownHtml(breakdown, menuPrices) {
    if (!breakdown || !breakdown.lines.length || !menuPrices) return "";
    return breakdown.lines.map((line) => (
      '<li class="order-breakdown__item">' +
        '<span class="order-breakdown__name">' + escapeHtml(line.name) + '</span>' +
        '<span class="order-breakdown__price">' + menuPrices.formatYen(line.price) + '</span>' +
      '</li>'
    )).join("");
  }

  function renderOrderCard(entry, menuPrices) {
    const breakdown = menuPrices
      ? menuPrices.buildBreakdownFromItemString(entry.item, entry.wants_bag)
      : { lines: [], total: entry.total_amount || 0 };
    if (entry.total_amount != null) breakdown.total = entry.total_amount;
    const status = formatCustomerStatus(entry.status || "pending");
    const itemClass = entry.status === "handed_over"
      ? " reservation-history__item--handed-over"
      : "";
    return (
      '<article class="reservation-history__item' + itemClass + '">' +
        '<div class="reservation-history__head">' +
          '<p class="reservation-history__label">ご予約番号</p>' +
          '<span class="order-status ' + status.className + '">' + escapeHtml(status.label) + '</span>' +
        '</div>' +
        '<p class="reservation-history__no">' + escapeHtml(entry.reservation_no || "") + '</p>' +
        '<ul class="order-breakdown">' + renderBreakdownHtml(breakdown, menuPrices) + '</ul>' +
        '<p class="reservation-history__total">合計金額 ' + menuPrices.formatYen(breakdown.total) + '</p>' +
        '<p class="reservation-history__meta">受取 ' + escapeHtml(entry.time || "") + '</p>' +
      '</article>'
    );
  }

  window.HIRO_ORDER_HISTORY_VIEW = {
    escapeHtml,
    formatCustomerStatus,
    renderBreakdownHtml,
    renderOrderCard,
  };
})();
