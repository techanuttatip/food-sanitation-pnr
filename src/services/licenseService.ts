import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { License, Application } from '../types';
import { auditService } from './auditService';
import { applicationService } from './applicationService';
import { businessService } from './businessService';

const STORAGE_KEY = 'food_gov_licenses_v1';

function getStoredLicenses(): License[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredLicenses(list: License[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Storage save notice:', e);
  }
}

export const licenseService = {
  async getLicenses(): Promise<License[]> {
    const stored = getStoredLicenses();
    const apps = await applicationService.getApplications();

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('licenses')
          .select('*, business:businesses(*, owner:business_owners(*), location:business_locations(*))')
          .order('issued_date', { ascending: false });

        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.warn('Licenses fetch notice:', err);
      }
    }

    if (stored.length > 0) {
      return stored;
    }

    // Derive licenses for any applications with LICENSE_ISSUED or approved
    const derived: License[] = [];
    apps.forEach((app, idx) => {
      if (app.status === 'LICENSE_ISSUED' || app.status === 'APPROVAL_PENDING') {
        const year_be = new Date().getFullYear() + 543;
        const count = idx + 1;
        const license_number = `สส. ${String(count).padStart(2, '0')}/${year_be}`;
        const token = `e${Math.random().toString(36).substring(2, 10)}-${year_be}000000${count}`;
        const issued_date = new Date().toISOString().split('T')[0];
        const expiry = new Date();
        expiry.setFullYear(expiry.getFullYear() + 1);

        derived.push({
          id: `lic-${app.id}`,
          organization_id: 'a0000000-0000-0000-0000-000000000001',
          application_id: app.id,
          business_id: app.business_id,
          license_number,
          book_number: '01',
          year_be,
          issued_date,
          expiry_date: expiry.toISOString().split('T')[0],
          approved_by_user_id: 'u005',
          approver_name: 'นายกองค์การบริหารส่วนตำบลโป่งน้ำร้อน',
          approver_position: 'นายกองค์การบริหารส่วนตำบลโป่งน้ำร้อน',
          verification_token: token,
          is_active: true,
          created_at: app.created_at,
          updated_at: app.updated_at,
          business: app.business,
        });
      }
    });

    saveStoredLicenses(derived);
    return derived;
  },

  async getLicenseByToken(token: string): Promise<License | null> {
    const list = await this.getLicenses();
    return list.find((lic) => lic.verification_token === token || lic.license_number.includes(token)) || null;
  },

  async issueLicense(params: {
    application_id: string;
    approver_name: string;
    approver_position: string;
  }): Promise<License> {
    const apps = await applicationService.getApplications();
    const app = apps.find((a) => a.id === params.application_id);

    const year_be = new Date().getFullYear() + 543;
    const stored = getStoredLicenses();
    const count = stored.length + 1;
    const license_number = `สส. ${String(count).padStart(2, '0')}/${year_be}`;
    const token = `e${Math.random().toString(36).substring(2, 10)}-${year_be}000000${count}`;

    const issued_date = new Date().toISOString().split('T')[0];
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);

    const newLicense: License = {
      id: `lic-${Date.now()}`,
      organization_id: 'a0000000-0000-0000-0000-000000000001',
      application_id: params.application_id,
      business_id: app?.business_id || '',
      license_number,
      book_number: '01',
      year_be,
      issued_date,
      expiry_date: expiry.toISOString().split('T')[0],
      approved_by_user_id: 'u005',
      approver_name: params.approver_name,
      approver_position: params.approver_position,
      verification_token: token,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      business: app?.business,
    };

    const updated = [newLicense, ...stored];
    saveStoredLicenses(updated);

    if (app) {
      await applicationService.updateApplicationStatus(app.id, 'LICENSE_ISSUED', `ออกใบอนุญาตเลขที่ ${license_number} เรียบร้อยแล้ว`);
    }

    if (isSupabaseConfigured && app) {
      try {
        await supabase.from('licenses').insert({
          organization_id: 'a0000000-0000-0000-0000-000000000001',
          application_id: app.id,
          business_id: app.business_id,
          license_number,
          book_number: '01',
          year_be,
          issued_date,
          expiry_date: expiry.toISOString().split('T')[0],
          approver_name: params.approver_name,
          approver_position: params.approver_position,
          verification_token: token,
          is_active: true,
        });
      } catch (err) {
        console.warn('Supabase issue license notice:', err);
      }
    }

    await auditService.logAction({
      action: 'ISSUE_LICENSE',
      entityName: 'licenses',
      entityId: newLicense.id,
      newValues: { license_number, verification_token: token },
    });

    return newLicense;
  },

  async deleteLicense(id: string): Promise<void> {
    const stored = getStoredLicenses();
    const filtered = stored.filter((lic) => lic.id !== id);
    saveStoredLicenses(filtered);
  },
};
