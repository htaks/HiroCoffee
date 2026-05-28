import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function decodeJwtPayload(token: string) {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  const json = new TextDecoder("utf-8").decode(bytes);
  return JSON.parse(json);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { code, redirect_uri } = await req.json();
    if (!code || !redirect_uri) {
      return new Response(
        JSON.stringify({ error: "code と redirect_uri が必要です" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const clientId = Deno.env.get("LINE_LOGIN_CHANNEL_ID");
    const clientSecret = Deno.env.get("LINE_LOGIN_CHANNEL_SECRET");
    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: "LINE Login が未設定です" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      return new Response(
        JSON.stringify({
          error: "LINE トークン取得に失敗しました",
          detail: tokenData,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let lineUserId = "";
    let displayName = "";

    if (tokenData.id_token) {
      const payload = decodeJwtPayload(tokenData.id_token);
      lineUserId = payload?.sub || "";
      displayName = payload?.name || "";
    }

    if (tokenData.access_token) {
      const profileRes = await fetch("https://api.line.me/v2/profile", {
        headers: { Authorization: "Bearer " + tokenData.access_token },
      });
      const profile = await profileRes.json();
      if (profileRes.ok) {
        lineUserId = profile.userId || lineUserId;
        displayName = profile.displayName || displayName;
      }
    }

    let isFriend = false;
    if (tokenData.access_token) {
      const friendshipRes = await fetch("https://api.line.me/friendship/v1/status", {
        headers: { Authorization: "Bearer " + tokenData.access_token },
      });
      const friendship = await friendshipRes.json();
      if (friendshipRes.ok) {
        isFriend = !!friendship.friendFlag;
      }
    }

    if (!lineUserId) {
      return new Response(
        JSON.stringify({ error: "LINE ユーザー ID を取得できませんでした" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        line_user_id: lineUserId,
        display_name: displayName,
        is_friend: isFriend,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
