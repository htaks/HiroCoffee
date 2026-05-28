-- 予約番号トリガーを完全に作り直す（reservation_no_counters は使わない）

DROP TRIGGER IF EXISTS trg_assign_reservation_no ON public.reservations;
DROP FUNCTION IF EXISTS public.assign_reservation_no() CASCADE;
DROP TABLE IF EXISTS public.reservation_no_counters CASCADE;

CREATE OR REPLACE FUNCTION public.assign_reservation_no()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dk text;
  num integer;
BEGIN
  IF NEW.reservation_no IS NOT NULL AND btrim(NEW.reservation_no) <> '' THEN
    RETURN NEW;
  END IF;

  dk := to_char(timezone('Asia/Tokyo', now()), 'MMDD');
  PERFORM pg_advisory_xact_lock(hashtext('reservation_no_' || dk));

  SELECT COALESCE(MAX(
    NULLIF(split_part(reservation_no, '-', 2), '')::integer
  ), 0) + 1
  INTO num
  FROM public.reservations
  WHERE reservation_no LIKE dk || '-%';

  NEW.reservation_no := dk || '-' || lpad(num::text, 3, '0');
  RETURN NEW;
END;
$$;

ALTER FUNCTION public.assign_reservation_no() OWNER TO postgres;

CREATE TRIGGER trg_assign_reservation_no
  BEFORE INSERT ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_reservation_no();
