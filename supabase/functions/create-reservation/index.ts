import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function getJstDayKey() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const month = parts.find((p) => p.type === "month")?.value || "01";
  const day = parts.find((p) => p.type === "day")?.value || "01";
  return month + day;
}

async function nextReservationNo(admin: ReturnType<typeof createClient>) {
  const dayKey = getJstDayKey();
  const { data, error } = await admin
    .from("reservations")
    .select("reservation_no")
    .like("reservation_no", dayKey + "-%");

  if (error) throw error;

  let max = 0;
  for (const row of data || []) {
    const seq = parseInt(String(row.reservation_no || "").split("-")[1], 10);
    if (seq > max) max = seq;
  }

  return dayKey + "-" + String(max + 1).padStart(3, "0");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const item = String(body.item || "").trim();
    const time = String(body.time || "").trim();
    const note = String(body.note || "").trim();
    const lineUserId = body.line_user_id
      ? String(body.line_user_id).trim()
      : "";

    if (!name || !item || !time) {
      return new Response(
        JSON.stringify({ error: "名前・メニュー・受取時間は必須です" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let reservationNo = "";
    let lastError: unknown = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      reservationNo = await nextReservationNo(admin);
      const { data, error } = await admin
        .from("reservations")
        .insert({
          name,
          item,
          time,
          note,
          status: "pending",
          line_user_id: lineUserId || null,
          reservation_no: reservationNo,
        })
        .select("id, reservation_no")
        .single();

      if (!error) {
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      lastError = error;
      if (error.code !== "23505") break;
    }

    return new Response(
      JSON.stringify({
        error: "予約の保存に失敗しました",
        detail: lastError,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
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
