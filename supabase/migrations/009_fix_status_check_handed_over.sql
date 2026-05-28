-- status に handed_over を許可（reservations_status_check エラー対策）

ALTER TABLE public.reservations
  DROP CONSTRAINT IF EXISTS reservations_status_check;

ALTER TABLE public.reservations
  ADD CONSTRAINT reservations_status_check
  CHECK (status IN ('pending', 'done', 'handed_over'));

COMMENT ON COLUMN public.reservations.status IS 'pending=未対応, done=対応済み, handed_over=お渡し済み';
