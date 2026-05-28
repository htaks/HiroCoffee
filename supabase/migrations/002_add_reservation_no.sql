-- 予約番号（MMDD-連番 例: 0529-001）を自動発行

ALTER TABLE public.reservations
ADD COLUMN IF NOT EXISTS reservation_no text UNIQUE;

COMMENT ON COLUMN public.reservations.reservation_no IS 'お客様向け予約番号（JST の MMDD-連番）';

CREATE TABLE IF NOT EXISTS public.reservation_no_counters (
  day_key text PRIMARY KEY,
  last_no integer NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION public.assign_reservation_no()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  dk text;
  num integer;
BEGIN
  IF NEW.reservation_no IS NOT NULL AND btrim(NEW.reservation_no) <> '' THEN
    RETURN NEW;
  END IF;

  dk := to_char(timezone('Asia/Tokyo', now()), 'MMDD');

  INSERT INTO public.reservation_no_counters AS c (day_key, last_no)
  VALUES (dk, 1)
  ON CONFLICT (day_key) DO UPDATE
  SET last_no = c.last_no + 1
  RETURNING last_no INTO num;

  NEW.reservation_no := dk || '-' || lpad(num::text, 3, '0');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_reservation_no ON public.reservations;
CREATE TRIGGER trg_assign_reservation_no
  BEFORE INSERT ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_reservation_no();
