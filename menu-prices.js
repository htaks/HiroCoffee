// ================================================================
// Hiro Coffee - メニュー価格（予約合計の計算用）
// ================================================================

(function () {
  const PRICES = {
    "カフェラテ": 520,
    "カプチーノ": 560,
    "エチオピア（浅煎り）": 480,
    "アイス・コーヒー（浅煎り）": 500,
    "アールグレイ": 490,
    "チャイ": 540,
    "チャイティーラテ": 620,
    "バスクチーズケーキ": 680,
    "シナモンロール": 620,
    "季節のパウンド": 580,
  };

  const BAG_FEE = 10;

  function calcTotalFromItemString(itemStr, wantsBag) {
    const items = String(itemStr || "")
      .split("、")
      .map((s) => s.trim())
      .filter(Boolean);
    let total = 0;
    for (const name of items) {
      total += PRICES[name] || 0;
    }
    if (wantsBag) total += BAG_FEE;
    return total;
  }

  function calcTotalFromItems(items, wantsBag) {
    const list = Array.isArray(items) ? items : [];
    return calcTotalFromItemString(list.join("、"), wantsBag);
  }

  function formatYen(amount) {
    return "¥" + Number(amount || 0).toLocaleString("ja-JP");
  }

  window.HIRO_MENU_PRICES = {
    PRICES,
    BAG_FEE,
    calcTotalFromItemString,
    calcTotalFromItems,
    formatYen,
  };
})();
