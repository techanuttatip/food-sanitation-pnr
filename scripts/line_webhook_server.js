const http = require('http');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://drzcdlccurngodpkgyql.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyemNkbGNjdXJuZ29kcGtneXFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxMTAxNjQsImV4cCI6MjEwMjY4NjE2NH0.vUyohNhf4dlBchgssyIGNNLyDVtE4X5hnOy8T4d-KK4';
const LINE_CHANNEL_ACCESS_TOKEN = 'WbQR+aj9J3Tn0ebcMoB5IGMwDUWM4zGKTN/o8TjLmNRmVy+oeibAHV/oXSNNde7sH2Ubl5ZCfo4KdXgPWHk4op854wvshX1bnxzfWNXf4WjnZOjDTw6nf6VSL8iG+kKt6gTakfWpPvHSc9SJJtDh7QdB04t89/1O/w1cDnyilFU=';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PORT = 3001;

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-line-signature');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'OK', time: new Date().toISOString() }));
    return;
  }

  if (req.method === 'POST' && (req.url === '/webhook' || req.url === '/')) {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const events = payload.events || [];
        console.log(`[LINE Webhook] Received ${events.length} event(s) at ${new Date().toLocaleTimeString()}`);

        for (const event of events) {
          const lineUserId = event.source?.userId || 'unknown';
          let displayName = 'เดชณัฐ (LINE)';
          let pictureUrl = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80';

          if (lineUserId !== 'unknown') {
            try {
              const profRes = await fetch(`https://api.line.me/v2/bot/profile/${lineUserId}`, {
                headers: { Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}` },
              });
              if (profRes.ok) {
                const prof = await profRes.json();
                displayName = prof.displayName || displayName;
                pictureUrl = prof.pictureUrl || pictureUrl;
              }
            } catch (err) {
              console.warn('Profile fetch error:', err);
            }
          }

          let textContent = '';
          let messageType = event.type;

          if (event.type === 'message' && event.message?.type === 'text') {
            textContent = event.message.text;
          } else if (event.type === 'postback') {
            messageType = 'postback';
            if (event.postback?.params?.datetime) {
              messageType = 'datetimepicker';
              textContent = `ขอเปลี่ยนเวลานัดตรวจเป็น: ${event.postback.params.datetime.replace('T', ' เวลา ')} น.`;
            } else {
              textContent = event.postback?.data || 'Postback event';
            }
          }

          console.log(`[LINE Message] From ${displayName}: "${textContent}"`);

          // Insert into Supabase
          try {
            await supabase.from('line_inbound_events').insert({
              organization_id: 'a0000000-0000-0000-0000-000000000001',
              line_user_id: lineUserId,
              line_display_name: displayName,
              picture_url: pictureUrl,
              message_type: messageType,
              text_content: textContent,
              event_data: event,
            });
          } catch (dbErr) {
            console.warn('DB insert notice:', dbErr);
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (parseErr) {
        console.error('Webhook parse error:', parseErr);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: parseErr.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`LINE Webhook Local Server running on http://localhost:${PORT}`);
});
