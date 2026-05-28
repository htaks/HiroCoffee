-- お渡し済みステータス（お客様の予約履歴から非表示）
COMMENT ON COLUMN public.reservations.status IS 'pending=未対応, done=対応済み, handed_over=お渡し済み（お客様の注文履歴に表示）';
