-- LINE 通知用カラムを reservations テーブルに追加
-- Supabase Dashboard → SQL Editor で実行してください

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS line_user_id TEXT,
  ADD COLUMN IF NOT EXISTS line_notified_at TIMESTAMPTZ;

COMMENT ON COLUMN public.reservations.line_user_id IS 'LINE Login の userId（プッシュ通知先）';
COMMENT ON COLUMN public.reservations.line_notified_at IS '準備完了 LINE 通知を送信した日時';
