-- 手さげ袋希望フラグ
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS wants_bag boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.reservations.wants_bag IS '手さげ袋の希望（true=希望あり）';
