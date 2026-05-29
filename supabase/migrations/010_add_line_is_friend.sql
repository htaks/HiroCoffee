-- 予約時点の LINE 友だち状態（通知可否の目安）
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS line_is_friend boolean;

COMMENT ON COLUMN reservations.line_is_friend IS
  '予約時点で Hiro Coffee 公式アカウントを友だち追加済みか';
