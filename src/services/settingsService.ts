export interface LicenseFormTemplate {
  form_code: string;
  title_main: string;
  title_sub: string;
  ordinance_text: string;
  subdistrict: string;
  district: string;
  province: string;
  signer_name: string;
  signer_position: string;
  officer_title: string;
  google_doc_url: string;
  display_mode: 'filled' | 'blank_dotted';
}

export interface SystemSettings {
  organization_name: string;
  organization_short: string;
  district: string;
  province: string;
  authorized_signer_name: string;
  authorized_signer_position: string;
  phone: string;
  email: string;
  
  fee_rate_under_50sqm: number;
  fee_rate_50_to_100sqm: number;
  fee_rate_100_to_200sqm: number;
  fee_rate_over_200sqm: number;
  fee_rate_description: string;
  
  line_oa_id: string;
  line_channel_id: string;
  line_channel_secret: string;
  line_channel_access_token: string;
  expiry_reminder_days: number;
  auto_send_notifications: boolean;
  
  system_version: string;
  go_live_date: string;

  // Form template configuration
  form_template: LicenseFormTemplate;
}

const STORAGE_KEY = 'food_gov_settings_v1';

export const DEFAULT_FORM_TEMPLATE: LicenseFormTemplate = {
  form_code: 'แบบ สอ.3',
  title_main: 'ใบอนุญาต',
  title_sub: 'ประกอบกิจการจัดตั้งสถานที่จำหน่ายอาหาร/สถานที่สะสมอาหาร',
  ordinance_text: 'ข้อบัญญัติองค์การบริหารส่วนตำบลโป่งน้ำร้อน เรื่อง สถานที่จำหน่ายอาหารและสถานที่สะสมอาหาร พ.ศ.2535',
  subdistrict: 'ตำบลโป่งน้ำร้อน',
  district: 'อำเภอฝาง',
  province: 'จังหวัดเชียงใหม่',
  signer_name: 'นายสมคิด พงษ์สุข',
  signer_position: 'นายกองค์การบริหารส่วนตำบลโป่งน้ำร้อน',
  officer_title: 'เจ้าพนักงานท้องถิ่น',
  google_doc_url: 'https://docs.new',
  display_mode: 'filled',
};

const DEFAULT_SETTINGS: SystemSettings = {
  organization_name: 'องค์การบริหารส่วนตำบลโป่งน้ำร้อน',
  organization_short: 'อบต. โป่งน้ำร้อน',
  district: 'อำเภอฝาง',
  province: 'จังหวัดเชียงใหม่',
  authorized_signer_name: 'นายสมเกียรติ สถิตพรเจริญ',
  authorized_signer_position: 'นายกองค์การบริหารส่วนตำบลโป่งน้ำร้อน',
  phone: '053-xxx-xxx',
  email: 'pongnamron@local.go.th',
  
  fee_rate_under_50sqm: 200,
  fee_rate_50_to_100sqm: 300,
  fee_rate_100_to_200sqm: 500,
  fee_rate_over_200sqm: 1000,
  fee_rate_description: 'ตามข้อบัญญัติ อบต. โป่งน้ำร้อน',
  
  line_oa_id: '@634eafmr',
  line_channel_id: '2011166540',
  line_channel_secret: 'f82a01455dbcfeae8e1f04b6b9778256',
  line_channel_access_token: '',
  expiry_reminder_days: 30,
  auto_send_notifications: true,
  
  system_version: '1.0.0',
  go_live_date: '2026-01-01',

  form_template: DEFAULT_FORM_TEMPLATE,
};

export const settingsService = {
  getSettings(): SystemSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          form_template: {
            ...DEFAULT_FORM_TEMPLATE,
            ...(parsed.form_template || {}),
            display_mode: parsed.form_template?.display_mode || 'filled',
          },
        };
      }
    } catch (e) {
      console.error('Failed to parse settings from localStorage', e);
    }
    return DEFAULT_SETTINGS;
  },

  saveSettings(settings: SystemSettings): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  },

  calculateFee(area_sqm: number): number {
    const settings = this.getSettings();
    if (area_sqm < 50) return settings.fee_rate_under_50sqm;
    if (area_sqm <= 100) return settings.fee_rate_50_to_100sqm;
    if (area_sqm <= 200) return settings.fee_rate_100_to_200sqm;
    return settings.fee_rate_over_200sqm;
  }
};
