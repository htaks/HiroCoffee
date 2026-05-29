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
    const body = await req.json();
    const lineUserId = String(body.line_user_id || "").trim();

    if (!lineUserId) {
      return new Response(
        JSON.stringify({ error: "line_user_id が必要です" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const channelAccessToken = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN");
    if (!channelAccessToken) {
      return new Response(
        JSON.stringify({ error: "LINE Messaging API が未設定です" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const profileRes = await fetch(
      "https://api.line.me/v2/bot/profile/" + encodeURIComponent(lineUserId),
      {
        headers: { Authorization: "Bearer " + channelAccessToken },
      },
    );

    // 200 = 友だち追加済み（Bot からプロフィール取得可）
    // 404 = 未追加
    const isFriend = profileRes.ok;

    return new Response(JSON.stringify({ is_friend: isFriend }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
