-- reservation_no_counters を使わず、reservations から連番を採番（RLS 問題を回避）

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

-- 内部用カウンター表は不要（残っていても使わない）
DROP TABLE IF EXISTS public.reservation_no_counters;
