// Supabase Edge Function: 24/7 AI RAG Auto-Reply LINE Webhook for Pong Nam Ron OBT

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN") || "WbQR+aj9J3Tn0ebcMoB5IGMwDUWM4zGKTN/o8TjLmNRmVy+oeibAHV/oXSNNde7sH2Ubl5ZCfo4KdXgPWHk4op854wvshX1bnxzfWNXf4WjnZOjDTw6nf6VSL8iG+kKt6gTakfWpPvHSc9SJJtDh7QdB04t89/1O/w1cDnyilFU=";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function getRagAnswer(query: string): string {
  const q = (query || "").toLowerCase();

  if (q.includes("ค่าธรรมเนียม") || q.includes("ราคา") || q.includes("กี่บาท") || q.includes("จ่ายเท่าไหร่")) {
    return `💰 อัตราค่าธรรมเนียมสถานที่สะสมอาหาร (อบต.โป่งน้ำร้อน):

คำนวณตามขนาดพื้นที่ใช้สอยจริงต่อปีครับ:
• ไม่เกิน ๕๐ ตร.ม.: ๒๐๐ บาท/ปี
• เกิน ๕๐ แต่ไม่เกิน ๑๐๐ ตร.ม.: ๓๐๐ บาท/ปี
• เกิน ๑๐๐ แต่ไม่เกิน ๒๐๐ ตร.ม.: ๕๐๐ บาท/ปี
• เกิน ๒๐๐ ตร.ม. ขึ้นไป: ๑,๐๐๐ - ๓,๕๐๐ บาท/ปี

📌 อ้างอิง: ข้อบัญญัติ อบต.โป่งน้ำร้อน เรื่อง การควบคุมสถานที่สะสมอาหาร`;
  }

  if (q.includes("เอกสาร") || q.includes("หลักฐาน") || q.includes("ขอใหม่") || q.includes("ต้องใช้อะไร")) {
    return `📋 เอกสารที่ต้องใช้ขอรับใบอนุญาตสถานที่สะสมอาหาร:

๑. สำเนาบัตรประชาชนของผู้ขอ (หรือหนังสือรับรองนิติบุคคล)
๒. สำเนาทะเบียนบ้านของสถานที่ประกอบการ
๓. หนังสือยินยอมให้ใช้สถานที่ หรือสัญญาเช่า
๔. แผนผังบริเวณและแผนผังภายในอาคาร (Floor Plan)
๕. ใบรับรองแพทย์ของผู้สัมผัสอาหาร (ตรวจ ๕ โรค)
๖. ใบผ่านการอบรมหลักสูตรสุขาภิบาลอาหาร
๗. หนังสือมอบอำนาจ (กรณีมอบให้ผู้อื่นดำเนินการแทน)

💡 ยื่นคำขอได้ที่: งานสาธารณสุข อบต.โป่งน้ำร้อน หรือตรวจสถานะผ่านเมนู LINE ด้านล่างได้เลยครับ`;
  }

  if (q.includes("เกณฑ์") || q.includes("ตรวจ") || q.includes("10 ข้อ") || q.includes("๑๐ ข้อ") || q.includes("มาตรฐาน")) {
    return `🔍 เกณฑ์มาตรฐานการตรวจสุขาภิบาล ๑๐ ข้อ:

๑. โครงสร้างอาคารแข็งแรง สะอาด ไม่อยู่ใกล้แหล่งมลพิษ
๒. พื้น ผนัง เพดาน เรียบ ทำความสะอาดง่าย ไม่มีเชื้อรา
๓. การระบายอากาศและแสงสว่างเพียงพอ
๔. มีระบบป้องกันหนู แมลงสาบ และสัตว์นำโรค
๕. วางอาหารบนชั้น/พาเลท สูงจากพื้นอย่างน้อย ๑๕ ซม.
๖. ควบคุมอุณหภูมิ: แช่เย็น 0-4°C / แช่แข็งต่ำกว่า -18°C
๗. น้ำใช้สะอาดได้มาตรฐานกรมอนามัย
๘. มีถังขยะปิดมิดชิด และบ่อดักไขมัน/บำบัดน้ำเสีย
๙. สุขอนามัยผู้สัมผัสอาหาร (สวมหมวกคลุมผม/ผ้ากันเปื้อน)
๑๐. แยกอาหารสด อาหารแห้ง และสารเคมีชัดเจน

📌 อ้างอิง: กฎกระทรวงสุขลักษณะฯ พ.ศ. ๒๕๖๑`;
  }

  if (q.includes("โทษ") || q.includes("ปรับ") || q.includes("จำคุก") || q.includes("ไม่ขอ") || q.includes("ผิดกฎหมาย")) {
    return `⚖️ บทกำหนดโทษตาม พ.ร.บ. การสาธารณสุข ๒๕๓๕:

๑. กรณีประกอบการโดยไม่ได้รับใบอนุญาต (มาตรา ๖๘):
   • ระวางโทษจำคุกไม่เกิน ๖ เดือน
   • หรือปรับไม่เกิน ๕๐,๐๐๐ บาท
   • หรือทั้งจำทั้งปรับ

๒. กรณีฝ่าฝืนคำสั่งระงับกิจการ (มาตรา ๗๑):
   • ปรับรายวันอีกวันละไม่เกิน ๒๕,๐๐๐ บาท จนกว่าจะปฏิบัติถูกต้อง`;
  }

  if (q.includes("ต่ออายุ") || q.includes("หมดอายุ") || q.includes("30 วัน")) {
    return `📅 การต่ออายุใบอนุญาตสถานที่สะสมอาหาร:

• ผู้รับใบอนุญาตต้องยื่นคำขอต่ออายุ "ก่อนใบอนุญาตสิ้นอายุไม่น้อยกว่า ๓๐ วัน"
• เมื่อยื่นแล้ว สามารถดำเนินกิจการต่อไปได้จนกว่าจะมีคำสั่งไม่อนุญาต
• หากปล่อยให้หมดอายุ จะต้องดำเนินการเสมือนขอใบอนุญาตใหม่ทั้งหมดครับ`;
  }

  if (q.includes("trk-") || q.includes("app-") || q.includes("สส.")) {
    return `🔍 ตรวจสอบสถานะคำขอใบอนุญาต:

ท่านสามารถแตะปุ่ม "🔍 ตรวจสถานะคำขอ" ที่แถบเมนูด้านล่างห้องแชท หรือกดลิงก์นี้:
👉 https://liff.line.me/2011177764-xRvzKUJO

แล้วพิมพ์รหัสติดตามเพื่อดูขั้นตอนการดำเนินงานได้ทันทีครับ!`;
  }

  return `สวัสดีครับ! งานสาธารณสุข อบต.โป่งน้ำร้อน ยินดีให้บริการครับ 🤖✨

AI ผู้ช่วยงานสาธารณสุขพร้อมตอบข้อมูลทันที:
• 📋 พิมพ์ "เอกสาร" เพื่อดูหลักฐานการขอใบอนุญาต
• 💰 พิมพ์ "ค่าธรรมเนียม" เพื่อดูอัตราตามขนาดพื้นที่
• 🔍 พิมพ์ "เกณฑ์ตรวจ" เพื่อดูมาตรฐาน ๑๐ ข้อ
• ⚖️ พิมพ์ "โทษปรับ" เพื่อดูข้อกฎหมาย
• หรือแตะเมนูบริการที่แถบด้านล่างได้เลยครับ 🙏`;
}

async function sendLineReply(replyToken: string, text: string) {
  if (!replyToken || !LINE_CHANNEL_ACCESS_TOKEN) return;
  try {
    await fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        replyToken: replyToken,
        messages: [{ type: "text", text: text }],
      }),
    });
  } catch (err) {
    console.error("Failed to send LINE reply:", err);
  }
}

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

        // Trigger Instant AI Auto-Reply
        const aiAnswer = getRagAnswer(textContent);
        if (event.replyToken) {
          await sendLineReply(event.replyToken, aiAnswer);
        }
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
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
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
