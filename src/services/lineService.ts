import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { auditService } from './auditService';

export interface LineAccount {
  id: string;
  business_id: string;
  business_name: string;
  line_user_id: string;
  line_display_name: string;
  picture_url?: string;
  is_linked: boolean;
  linked_at: string;
  phone_number: string;
}

export interface InboundLineSender {
  line_user_id: string;
  line_display_name: string;
  picture_url?: string;
  last_message: string;
  timestamp: string;
  linked_business_id?: string;
  linked_business_name?: string;
}

export interface NotificationLogItem {
  id: string;
  recipient_name: string;
  business_name: string;
  channel: 'LINE_OA' | 'SMS';
  event_type: 'APPOINTMENT' | 'DOC_REJECTED' | 'PAYMENT_DUE' | 'LICENSE_ISSUED';
  title: string;
  message_preview: string;
  status: 'SENT' | 'DELIVERED' | 'FAILED';
  sent_at: string;
}

const LINE_ACC_STORAGE_KEY = 'food_gov_line_accounts_v1';
const NOTIF_LOG_STORAGE_KEY = 'food_gov_notif_logs_v1';
const INBOUND_STORAGE_KEY = 'food_gov_inbound_senders_v1';

const DEFAULT_INBOUND_SENDERS: InboundLineSender[] = [
  {
    line_user_id: 'U99dechnat784a',
    line_display_name: 'เดชณัฐ',
    picture_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    last_message: 'ทักครับ',
    timestamp: new Date().toISOString(),
  },
];

function getStoredLineAccounts(): LineAccount[] {
  try {
    const raw = localStorage.getItem(LINE_ACC_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredLineAccounts(list: LineAccount[]) {
  try {
    localStorage.setItem(LINE_ACC_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn(e);
  }
}

function getStoredInboundSenders(): InboundLineSender[] {
  try {
    const raw = localStorage.getItem(INBOUND_STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_INBOUND_SENDERS;
  } catch {
    return DEFAULT_INBOUND_SENDERS;
  }
}

function saveStoredInboundSenders(list: InboundLineSender[]) {
  try {
    localStorage.setItem(INBOUND_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn(e);
  }
}

function getStoredNotifLogs(): NotificationLogItem[] {
  try {
    const raw = localStorage.getItem(NOTIF_LOG_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredNotifLogs(list: NotificationLogItem[]) {
  try {
    localStorage.setItem(NOTIF_LOG_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn(e);
  }
}

function buildLineFlexMessage(params: {
  business_name: string;
  event_type: 'APPOINTMENT' | 'DOC_REJECTED' | 'PAYMENT_DUE' | 'LICENSE_ISSUED';
  title: string;
  message_preview: string;
}) {
  let headerColor = '#0284c7';
  let headerTitle = 'นัดหมายลงตรวจสุขาภิบาล';
  let buttons: any[] = [];

  let quickReplyObj: any = undefined;

  if (params.event_type === 'APPOINTMENT') {
    headerColor = '#0284c7';
    headerTitle = 'นัดหมายลงตรวจสุขาภิบาล';
    buttons = [
      {
        type: 'button',
        style: 'primary',
        color: '#059669',
        height: 'sm',
        action: {
          type: 'message',
          label: '✅ ยืนยันตามกำหนด',
          text: `ยืนยันวันนัดตรวจสุขาภิบาล ร้าน "${params.business_name}" ตามกำหนดครับ`,
        },
      },
      {
        type: 'button',
        style: 'secondary',
        height: 'sm',
        action: {
          type: 'datetimepicker',
          label: '📅 เลือกวันเวลาใหม่',
          data: `action=reschedule&biz=${encodeURIComponent(params.business_name)}`,
          mode: 'datetime',
          initial: '2026-03-10t10:00',
          min: '2026-03-01t08:30',
          max: '2026-04-30t16:30',
        },
      },
    ];

    quickReplyObj = {
      items: [
        {
          type: 'action',
          action: {
            type: 'message',
            label: '10 มี.ค. 10:00 น.',
            text: `ขอเลื่อนวันนัดตรวจ ร้าน "${params.business_name}" เป็น วันที่ 10 มีนาคม 2569 เวลา 10:00 น. ครับ`,
          },
        },
        {
          type: 'action',
          action: {
            type: 'message',
            label: '12 มี.ค. 14:00 น.',
            text: `ขอเลื่อนวันนัดตรวจ ร้าน "${params.business_name}" เป็น วันที่ 12 มีนาคม 2569 เวลา 14:00 น. ครับ`,
          },
        },
        {
          type: 'action',
          action: {
            type: 'message',
            label: '15 มี.ค. 09:30 น.',
            text: `ขอเลื่อนวันนัดตรวจ ร้าน "${params.business_name}" เป็น วันที่ 15 มีนาคม 2569 เวลา 09:30 น. ครับ`,
          },
        },
      ],
    };
  } else if (params.event_type === 'DOC_REJECTED') {
    headerColor = '#e11d48';
    headerTitle = 'แจ้งแก้ไขเอกสารประกอบคำขอ';
    buttons = [
      {
        type: 'button',
        style: 'primary',
        color: '#e11d48',
        height: 'sm',
        action: {
          type: 'message',
          label: '📤 ส่งเอกสารใหม่',
          text: `ขอส่งเอกสารเพิ่มเติมสำหรับร้าน "${params.business_name}" เรียบร้อยแล้วครับ`,
        },
      },
    ];
  } else if (params.event_type === 'PAYMENT_DUE') {
    headerColor = '#d97706';
    headerTitle = 'ใบแจ้งชำระค่าธรรมเนียม อบต.';
    buttons = [
      {
        type: 'button',
        style: 'primary',
        color: '#d97706',
        height: 'sm',
        action: {
          type: 'message',
          label: '🧾 ส่งสลิปการโอนเงิน',
          text: `ส่งสลิปโอนเงินค่าธรรมเนียม ร้าน "${params.business_name}" เรียบร้อยแล้วครับ`,
        },
      },
    ];
  } else if (params.event_type === 'LICENSE_ISSUED') {
    headerColor = '#059669';
    headerTitle = 'ใบอนุญาตออกเรียบร้อยแล้ว';
    buttons = [
      {
        type: 'button',
        style: 'primary',
        color: '#059669',
        height: 'sm',
        action: {
          type: 'message',
          label: '🏅 ดาวน์โหลดใบอนุญาต',
          text: `ขอรับไฟล์ใบอนุญาตสะสมอาหาร ร้าน "${params.business_name}" ครับ`,
        },
      },
    ];
  }

  const res: any = {
    type: 'flex',
    altText: `🏛️ [อบต.โป่งน้ำร้อน] ${params.title}`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: headerColor,
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: 'องค์การบริหารส่วนตำบลโป่งน้ำร้อน',
            color: '#ffffffcc',
            size: 'xs',
            weight: 'bold',
          },
          {
            type: 'text',
            text: headerTitle,
            color: '#ffffff',
            size: 'lg',
            weight: 'bold',
            margin: 'xs',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: `🏪 ${params.business_name}`,
            weight: 'bold',
            size: 'md',
            color: '#0f172a',
          },
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            backgroundColor: '#f8fafc',
            paddingAll: '12px',
            cornerRadius: '8px',
            contents: [
              {
                type: 'text',
                text: params.message_preview,
                size: 'xs',
                color: '#334155',
                wrap: true,
                lineSpacing: '4px',
              },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        paddingAll: '12px',
        contents: buttons,
      },
    },
  };

  if (quickReplyObj) {
    res.quickReply = quickReplyObj;
  }

  return res;
}

export const lineService = {
  async getInboundSenders(): Promise<InboundLineSender[]> {
    return getStoredInboundSenders();
  },

  async addInboundMessage(sender: {
    line_user_id: string;
    line_display_name: string;
    text: string;
    picture_url?: string;
  }): Promise<void> {
    const current = getStoredInboundSenders();
    const existing = current.find((s) => s.line_user_id === sender.line_user_id);

    let updated: InboundLineSender[];
    if (existing) {
      updated = current.map((s) =>
        s.line_user_id === sender.line_user_id
          ? { ...s, last_message: sender.text, timestamp: new Date().toISOString() }
          : s
      );
    } else {
      const newSender: InboundLineSender = {
        line_user_id: sender.line_user_id,
        line_display_name: sender.line_display_name,
        picture_url: sender.picture_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        last_message: sender.text,
        timestamp: new Date().toISOString(),
      };
      updated = [newSender, ...current];
    }
    saveStoredInboundSenders(updated);
  },

  async getLinkedAccounts(): Promise<LineAccount[]> {
    const local = getStoredLineAccounts();

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('line_accounts')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const list: LineAccount[] = data.map((la: any) => ({
            id: la.id,
            business_id: la.business_id,
            business_name: la.business_name || 'สถานประกอบการ',
            line_user_id: la.line_user_id,
            line_display_name: la.line_display_name || 'LINE User',
            picture_url: la.picture_url,
            is_linked: la.is_linked,
            linked_at: la.linked_at || la.created_at,
            phone_number: '-',
          }));

          const dbIds = new Set(list.map((l) => l.id));
          const uniqueLocal = local.filter((l) => !dbIds.has(l.id));
          const merged = [...list, ...uniqueLocal];
          saveStoredLineAccounts(merged);
          return merged;
        }
      } catch (err) {
        console.warn('Supabase line accounts notice:', err);
      }
    }

    return local;
  },

  async linkAccount(account: LineAccount): Promise<void> {
    const current = getStoredLineAccounts();
    const updated = [account, ...current.filter((a) => a.id !== account.id && a.business_id !== account.business_id)];
    saveStoredLineAccounts(updated);

    const inbounds = getStoredInboundSenders();
    const updatedInbounds = inbounds.map((s) =>
      s.line_user_id === account.line_user_id
        ? { ...s, linked_business_id: account.business_id, linked_business_name: account.business_name }
        : s
    );
    saveStoredInboundSenders(updatedInbounds);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('line_accounts').upsert({
          id: account.id,
          business_id: account.business_id,
          line_user_id: account.line_user_id,
          line_display_name: account.line_display_name,
          picture_url: account.picture_url,
          is_linked: true,
          linked_at: account.linked_at,
        });
      } catch (err) {
        console.warn('Supabase link account notice:', err);
      }
    }

    await auditService.logAction({
      action: 'LINK_LINE_ACCOUNT',
      entityName: 'line_accounts',
      entityId: account.id,
      newValues: { business_name: account.business_name, line_display_name: account.line_display_name },
    });
  },

  async unlinkAccount(id: string): Promise<void> {
    const current = getStoredLineAccounts();
    const target = current.find((a) => a.id === id);
    const updated = current.filter((a) => a.id !== id);
    saveStoredLineAccounts(updated);

    if (target) {
      const inbounds = getStoredInboundSenders();
      const updatedInbounds = inbounds.map((s) =>
        s.line_user_id === target.line_user_id
          ? { ...s, linked_business_id: undefined, linked_business_name: undefined }
          : s
      );
      saveStoredInboundSenders(updatedInbounds);
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.from('line_accounts').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase unlink account notice:', err);
      }
    }
  },

  async getNotificationLogs(): Promise<NotificationLogItem[]> {
    return getStoredNotifLogs();
  },

  async sendFlexMessage(params: {
    business_id: string;
    business_name: string;
    recipient_name: string;
    event_type: 'APPOINTMENT' | 'DOC_REJECTED' | 'PAYMENT_DUE' | 'LICENSE_ISSUED';
    title: string;
    message_preview: string;
    channel?: 'LINE_OA' | 'SMS';
  }): Promise<void> {
    const token = import.meta.env.VITE_LINE_CHANNEL_ACCESS_TOKEN;
    const accounts = getStoredLineAccounts();
    const targetAcc = accounts.find((a) => a.business_id === params.business_id);

    let deliveryStatus: 'SENT' | 'DELIVERED' | 'FAILED' = 'DELIVERED';

    // If real Channel Access Token exists, execute real HTTP Flex Push/Broadcast to LINE API via Proxy
    const cleanToken = (token || '').replace(/^"|"$/g, '').trim();
    if (cleanToken) {
      try {
        const lineApiBase = typeof window !== 'undefined' && window.location.hostname === 'localhost' ? '/line-api' : 'https://api.line.me';
        const flexObject = buildLineFlexMessage(params);
        let pushDone = false;

        // If target has a real 33-char LINE user ID, try direct push
        if (targetAcc?.line_user_id?.startsWith('U') && targetAcc.line_user_id.length === 33 && !targetAcc.line_user_id.includes('...')) {
          try {
            const res = await fetch(`${lineApiBase}/v2/bot/message/push`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${cleanToken}`,
              },
              body: JSON.stringify({
                to: targetAcc.line_user_id,
                messages: [flexObject],
              }),
            });
            if (res.ok) pushDone = true;
          } catch (e) {
            console.warn('Push error:', e);
          }
        }

        // Broadcast to followers if push was not done
        if (!pushDone) {
          const res = await fetch(`${lineApiBase}/v2/bot/message/broadcast`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${cleanToken}`,
            },
            body: JSON.stringify({
              messages: [flexObject],
            }),
          });
          if (!res.ok) console.warn('LINE Flex Broadcast Response:', await res.text());
        }
      } catch (pushErr) {
        console.warn('LINE Flex Push/Broadcast Error:', pushErr);
      }
    }

    const newLog: NotificationLogItem = {
      id: `nl-${Date.now()}`,
      recipient_name: params.recipient_name,
      business_name: params.business_name,
      channel: params.channel || 'LINE_OA',
      event_type: params.event_type,
      title: params.title,
      message_preview: params.message_preview,
      status: deliveryStatus,
      sent_at: new Date().toISOString(),
    };

    const current = getStoredNotifLogs();
    saveStoredNotifLogs([newLog, ...current]);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('notification_logs').insert({
          organization_id: 'a0000000-0000-0000-0000-000000000001',
          recipient_name: params.recipient_name,
          business_name: params.business_name,
          channel: params.channel || 'LINE_OA',
          event_type: params.event_type,
          title: params.title,
          message_preview: params.message_preview,
          status: deliveryStatus,
        });
      } catch (err) {
        console.warn('Supabase send notification log notice:', err);
      }
    }

    await auditService.logAction({
      action: 'SEND_NOTIFICATION',
      entityName: 'notification_logs',
      entityId: newLog.id,
      newValues: newLog as unknown as Record<string, unknown>,
    });
  },
};
