// Vercel Serverless Function: 24/7 AI RAG Auto-Reply LINE Webhook for Pong Nam Ron OBT

const LINE_CHANNEL_ACCESS_TOKEN = process.env.VITE_LINE_CHANNEL_ACCESS_TOKEN || process.env.LINE_CHANNEL_ACCESS_TOKEN || 'WbQR+aj9J3Tn0ebcMoB5IGMwDUWM4zGKTN/o8TjLmNRmVy+oeibAHV/oXSNNde7sH2Ubl5ZCfo4KdXgPWHk4op854wvshX1bnxzfWNXf4WjnZOjDTw6nf6VSL8iG+kKt6gTakfWpPvHSc9SJJtDh7QdB04t89/1O/w1cDnyilFU=';

// RAG Law Knowledge Base
function getRagAnswer(query) {
  const q = (query || '').toLowerCase();

  if (q.includes('ค่าธรรมเนียม') || q.includes('ราคา') || q.includes('กี่บาท') || q.includes('จ่ายเท่าไหร่')) {
    return `💰 อัตราค่าธรรมเนียมสถานที่สะสมอาหาร (อบต.โป่งน้ำร้อน):

คำนวณตามขนาดพื้นที่ใช้สอยจริงต่อปีครับ:
• ไม่เกิน ๕๐ ตร.ม.: ๒๐๐ บาท/ปี
• เกิน ๕๐ แต่ไม่เกิน ๑๐๐ ตร.ม.: ๓๐๐ บาท/ปี
• เกิน ๑๐๐ แต่ไม่เกิน ๒๐๐ ตร.ม.: ๕๐๐ บาท/ปี
• เกิน ๒๐๐ ตร.ม. ขึ้นไป: ๑,๐๐๐ - ๓,๕๐๐ บาท/ปี

📌 อ้างอิง: ข้อบัญญัติ อบต.โป่งน้ำร้อน เรื่อง การควบคุมสถานที่สะสมอาหาร
(ใบอนุญาตมีอายุ ๑ ปี นับแต่วันออกใบอนุญาต)`;
  }

  if (q.includes('เอกสาร') || q.includes('หลักฐาน') || q.includes('ขอใหม่') || q.includes('ต้องใช้อะไร')) {
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

  if (q.includes('เกณฑ์') || q.includes('ตรวจ') || q.includes('10 ข้อ') || q.includes('๑๐ ข้อ') || q.includes('มาตรฐาน')) {
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

  if (q.includes('โทษ') || q.includes('ปรับ') || q.includes('จำคุก') || q.includes('ไม่ขอ') || q.includes('ผิดกฎหมาย')) {
    return `⚖️ บทกำหนดโทษตาม พ.ร.บ. การสาธารณสุข ๒๕๓๕:

๑. กรณีประกอบการโดยไม่ได้รับใบอนุญาต (มาตรา ๖๘):
   • ระวางโทษจำคุกไม่เกิน ๖ เดือน
   • หรือปรับไม่เกิน ๕๐,๐๐๐ บาท
   • หรือทั้งจำทั้งปรับ

๒. กรณีฝ่าฝืนคำสั่งระงับกิจการ (มาตรา ๗๑):
   • ปรับรายวันอีกวันละไม่เกิน ๒๕,๐๐๐ บาท จนกว่าจะปฏิบัติถูกต้อง

แนะนำให้ยื่นคำขอรับใบอนุญาตให้ถูกต้องกับ อบต.โป่งน้ำร้อน นะครับ`;
  }

  if (q.includes('ต่ออายุ') || q.includes('หมดอายุ') || q.includes('30 วัน')) {
    return `📅 การต่ออายุใบอนุญาตสถานที่สะสมอาหาร:

• ผู้รับใบอนุญาตต้องยื่นคำขอต่ออายุ "ก่อนใบอนุญาตสิ้นอายุไม่น้อยกว่า ๓๐ วัน"
• เมื่อยื่นแล้ว สามารถดำเนินกิจการต่อไปได้จนกว่าจะมีคำสั่งไม่อนุญาต
• หากปล่อยให้หมดอายุ จะต้องดำเนินการเสมือนขอใบอนุญาตใหม่ทั้งหมดครับ`;
  }

  if (q.includes('trk-') || q.includes('app-') || q.includes('สส.')) {
    return `🔍 ตรวจสอบสถานะคำขอใบอนุญาต:

ท่านสามารถแตะปุ่ม "🔍 ตรวจสถานะคำขอ" ที่แถบเมนูด้านล่างห้องแชท หรือกดลิงก์นี้:
👉 https://liff.line.me/2011177764-xRvzKUJO

แล้วพิมพ์รหัสติดตามเพื่อดูขั้นตอนการดำเนินงานได้ทันทีครับ!`;
  }

  if (q.includes('ติดต่อ') || q.includes('โทร') || q.includes('ที่ตั้ง') || q.includes('อบต.')) {
    return `🏛️ งานสาธารณสุขและสิ่งแวดล้อม องค์การบริหารส่วนตำบลโป่งน้ำร้อน
📍 ที่ตั้ง: ตำบลโป่งน้ำร้อน อำเภอฝาง จังหวัดเชียงใหม่ ๕๐๑๑๐
⏰ เวลาทำการ: จันทร์ - ศุกร์ ๐๘.๓๐ - ๑๖.๓๐ น.
📞 สามารถพิมพ์ข้อความทิ้งไว้ในแชทนี้ เจ้าหน้าที่จะติดต่อกลับโดยเร็วที่สุดครับ`;
  }

  // Default AI Greeting / Assistant answer
  return `สวัสดีครับ! งานสาธารณสุข อบต.โป่งน้ำร้อน ยินดีให้บริการครับ 🤖✨

AI ผู้ช่วยงานสาธารณสุขพร้อมตอบข้อมูลทันที:
• 📋 พิมพ์ "เอกสาร" เพื่อดูหลักฐานการขอใบอนุญาต
• 💰 พิมพ์ "ค่าธรรมเนียม" เพื่อดูอัตราตามขนาดพื้นที่
• 🔍 พิมพ์ "เกณฑ์ตรวจ" เพื่อดูมาตรฐาน ๑๐ ข้อ
• ⚖️ พิมพ์ "โทษปรับ" เพื่อดูข้อกฎหมาย
• หรือแตะเมนูบริการที่แถบด้านล่างได้เลยครับ 🙏`;
}

// Reply message back to LINE
async function sendLineReply(replyToken, text) {
  if (!replyToken || !LINE_CHANNEL_ACCESS_TOKEN) return;

  try {
    const res = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        replyToken: replyToken,
        messages: [
          {
            type: 'text',
            text: text,
          },
        ],
      }),
    });
    return await res.json();
  } catch (err) {
    console.error('Failed to send LINE reply:', err);
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'active', service: 'Pong Nam Ron LINE AI RAG Webhook' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const events = body.events || [];

    for (const ev of events) {
      if (ev.type === 'message' && ev.message && ev.message.type === 'text') {
        const userText = ev.message.text;
        const replyToken = ev.replyToken;

        // Generate RAG Response based on law/regulations
        const aiAnswer = getRagAnswer(userText);

        // Instant Auto-Reply to Citizen's LINE chat
        if (replyToken) {
          await sendLineReply(replyToken, aiAnswer);
        }
      }
    }

    return res.status(200).json({ success: true, count: events.length });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: err.message });
  }
}
