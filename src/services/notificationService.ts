import { licenseService } from './licenseService';
import { lineService } from './lineService';
import type { License, Business } from '../types';

export interface ExpiryNotificationSchedule {
  license: License;
  business: Business;
  daysRemaining: number;
  isNotified: boolean;
  linkedLineAccountId: string | null;
}

const NOTIFIED_STORAGE_KEY = 'food_gov_notified_expiry_v1';

function getNotifiedLicenses(): string[] {
  try {
    const raw = localStorage.getItem(NOTIFIED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addNotifiedLicense(licenseId: string) {
  try {
    const current = getNotifiedLicenses();
    if (!current.includes(licenseId)) {
      localStorage.setItem(NOTIFIED_STORAGE_KEY, JSON.stringify([...current, licenseId]));
    }
  } catch (e) {
    console.warn(e);
  }
}

export const notificationService = {
  async checkExpiringLicenses(): Promise<ExpiryNotificationSchedule[]> {
    const licenses = await licenseService.getLicenses();
    const linkedAccounts = await lineService.getLinkedAccounts();
    const notified = getNotifiedLicenses();
    const today = new Date();

    const schedule: ExpiryNotificationSchedule[] = [];

    for (const license of licenses) {
      if (!license.expiry_date || !license.is_active || !license.business) continue;

      const expiryDate = new Date(license.expiry_date);
      const diffTime = Math.abs(expiryDate.getTime() - today.getTime());
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Check if it expires in the future and within 30 days
      if (expiryDate >= today && daysRemaining > 0 && daysRemaining <= 30) {
        const linkedAcc = linkedAccounts.find(a => a.business_id === license.business_id);
        
        schedule.push({
          license,
          business: license.business,
          daysRemaining,
          isNotified: notified.includes(license.id),
          linkedLineAccountId: linkedAcc ? linkedAcc.line_user_id : null,
        });
      }
    }

    return schedule.sort((a, b) => a.daysRemaining - b.daysRemaining);
  },

  async sendExpiryReminderLine(license: License, business: Business, daysRemaining: number): Promise<void> {
    const linkedAccounts = await lineService.getLinkedAccounts();
    const linkedAcc = linkedAccounts.find(a => a.business_id === business.id);

    if (!linkedAcc || !linkedAcc.line_user_id) {
      throw new Error('No linked LINE account found for this business.');
    }

    const channelToken = import.meta.env.VITE_LINE_CHANNEL_ACCESS_TOKEN || '';
    if (!channelToken) {
      console.warn('VITE_LINE_CHANNEL_ACCESS_TOKEN is not defined');
      return;
    }

    const cleanToken = channelToken.replace(/^"|"$/g, '').trim();

    const flexMsg = {
      type: "flex",
      altText: "แจ้งเตือน: ใบอนุญาตของท่านใกล้หมดอายุ",
      contents: {
        type: "bubble",
        header: { 
          type: "box", 
          layout: "vertical", 
          backgroundColor: "#f59e0b", 
          contents: [
            { type: "text", text: "⚠️ แจ้งเตือนใบอนุญาตใกล้หมดอายุ", color: "#ffffff", size: "md", weight: "bold" }
          ] 
        },
        body: { 
          type: "box", 
          layout: "vertical", 
          spacing: "md", 
          contents: [
            { type: "text", text: `เรียน ${business.owner?.first_name || 'ผู้ประกอบการ'} ${business.owner?.last_name || ''}`.trim(), weight: "bold" },
            { type: "text", text: `ใบอนุญาตสถานที่สะสมอาหาร ${business.name} เลขที่ ${license.license_number} จะหมดอายุในอีก ${daysRemaining} วัน (วันที่ ${new Date(license.expiry_date).toLocaleDateString('th-TH')})`, wrap: true, size: "sm", color: "#374151" },
            { type: "text", text: "กรุณายื่นคำขอต่ออายุล่วงหน้าก่อนใบอนุญาตสิ้นอายุไม่น้อยกว่า 30 วัน", wrap: true, size: "xs", color: "#6b7280" }
          ]
        },
        footer: {
          type: "box", 
          layout: "vertical", 
          contents: [
            { type: "button", style: "primary", color: "#065f46", label: "ยื่นคำขอต่ออายุออนไลน์", action: { type: "uri", uri: "https://lin.ee/abcdef" } }
          ]
        }
      }
    };

    const lineApiBase = typeof window !== 'undefined' && window.location.hostname === 'localhost' ? '/line-api' : 'https://api.line.me';

    try {
      const res = await fetch(`${lineApiBase}/v2/bot/message/push`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: linkedAcc.line_user_id,
          messages: [flexMsg]
        })
      });

      if (res.ok) {
        addNotifiedLicense(license.id);
        
        // Log the notification
        const logs = localStorage.getItem('food_gov_notif_logs_v1');
        const parsedLogs = logs ? JSON.parse(logs) : [];
        const newLog = {
          id: `nl-${Date.now()}`,
          recipient_name: linkedAcc.line_display_name || 'ผู้ประกอบการ',
          business_name: business.name,
          channel: 'LINE_OA',
          event_type: 'LICENSE_EXPIRED',
          title: 'แจ้งเตือนใบอนุญาตใกล้หมดอายุ',
          message_preview: `ใบอนุญาต ${license.license_number} ของร้าน ${business.name} ใกล้หมดอายุ`,
          status: 'SENT',
          sent_at: new Date().toISOString(),
        };
        localStorage.setItem('food_gov_notif_logs_v1', JSON.stringify([newLog, ...parsedLogs]));
      } else {
        console.error('Failed to send LINE notification:', await res.text());
        throw new Error('Failed to send LINE notification');
      }
    } catch (err) {
      console.error('Error sending LINE message:', err);
      throw err;
    }
  },

  async getNotificationSchedule(): Promise<ExpiryNotificationSchedule[]> {
    return this.checkExpiringLicenses();
  },

  async runDailyCheck(): Promise<{ totalChecked: number; sentCount: number }> {
    const schedule = await this.checkExpiringLicenses();
    let sentCount = 0;

    for (const item of schedule) {
      if (!item.isNotified && item.linkedLineAccountId) {
        try {
          await this.sendExpiryReminderLine(item.license, item.business, item.daysRemaining);
          sentCount++;
        } catch (e) {
          console.warn(`Failed to send reminder for license ${item.license.id}`, e);
        }
      }
    }

    return { totalChecked: schedule.length, sentCount };
  }
};
