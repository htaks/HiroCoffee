-- 予約時点の合計金額（円）
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS total_amount integer;

COMMENT ON COLUMN public.reservations.total_amount IS '予約時点の合計金額（円・税込）';
