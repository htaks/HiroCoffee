import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "ログインが必要です" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUserClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: authData, error: authError } = await supabaseUserClient.auth
      .getUser();
    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({ error: "管理者認証に失敗しました" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { reservation_id } = await req.json();
    if (!reservation_id) {
      return new Response(
        JSON.stringify({ error: "reservation_id が必要です" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: reservation, error: fetchError } = await adminClient
      .from("reservations")
      .select("*")
      .eq("id", reservation_id)
      .single();

    if (fetchError || !reservation) {
      return new Response(
        JSON.stringify({ error: "予約が見つかりません" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!reservation.line_user_id) {
      return new Response(
        JSON.stringify({ error: "この予約は LINE 未連携です" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const channelToken = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN");
    if (!channelToken) {
      return new Response(
        JSON.stringify({ error: "LINE Messaging API が未設定です" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const message =
      `${reservation.name} 様\n\n` +
      `Hiro Coffee です。\n` +
      (reservation.reservation_no
        ? `ご予約番号: ${reservation.reservation_no}\n\n`
        : "") +
      `ご予約の「${reservation.item}」のご用意ができました。\n` +
      `受け取り時間: ${reservation.time}\n\n` +
      `お待たせいたしました。ご来店をお待ちしております。`;

    const lineRes = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + channelToken,
      },
      body: JSON.stringify({
        to: reservation.line_user_id,
        messages: [{ type: "text", text: message }],
      }),
    });

    if (!lineRes.ok) {
      const detail = await lineRes.text();
      return new Response(
        JSON.stringify({
          error: "LINE 送信に失敗しました",
          detail,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { error: updateError } = await adminClient
      .from("reservations")
      .update({
        status: "done",
        line_notified_at: new Date().toISOString(),
      })
      .eq("id", reservation_id);

    if (updateError) {
      return new Response(
        JSON.stringify({
          error: "LINE は送信しましたが、予約の更新に失敗しました",
          detail: updateError.message,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
