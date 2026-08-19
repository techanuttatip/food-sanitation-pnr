// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This code runs on Supabase Edge Functions to receive LINE Webhooks

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-line-signature",
      },
    });
  }

  try {
    const body = await req.json();
    const events = body.events || [];

    for (const event of events) {
      const lineUserId = event.source?.userId || "unknown";
      let displayName = "ผู้ใช้ LINE";
      let pictureUrl = "";

      // Fetch user profile from LINE API if possible
      if (LINE_CHANNEL_ACCESS_TOKEN && lineUserId !== "unknown") {
        try {
          const profileRes = await fetch(`https://api.line.me/v2/bot/profile/${lineUserId}`, {
            headers: { Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}` },
          });
          if (profileRes.ok) {
            const profile = await profileRes.json();
            displayName = profile.displayName || displayName;
            pictureUrl = profile.pictureUrl || "";
          }
        } catch (e) {
          console.warn("Profile fetch warning:", e);
        }
      }

      let textContent = "";
      let messageType = event.type;

      if (event.type === "message" && event.message?.type === "text") {
        textContent = event.message.text;
      } else if (event.type === "postback") {
        messageType = "postback";
        if (event.postback?.params?.datetime) {
          messageType = "datetimepicker";
          textContent = `ขอเปลี่ยนเวลานัดตรวจเป็น: ${event.postback.params.datetime.replace("T", " เวลา ")} น.`;
        } else {
          textContent = event.postback?.data || "Postback event";
        }
      }

      // Insert event into Supabase
      await supabase.from("line_inbound_events").insert({
        organization_id: "a0000000-0000-0000-0000-000000000001",
        line_user_id: lineUserId,
        line_display_name: displayName,
        picture_url: pictureUrl,
        message_type: messageType,
        text_content: textContent,
        event_data: event,
      });
    }

    return new Response(JSON.stringify({ success: true, count: events.length }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
