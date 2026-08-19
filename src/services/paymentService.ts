import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Fee, Payment, PaymentStatus } from '../types';
import { auditService } from './auditService';
import { applicationService } from './applicationService';

const STORAGE_KEY = 'food_gov_fees_v1';

function getStoredFees(): any[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredFees(list: any[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Storage save notice:', e);
  }
}

export const paymentService = {
  async getFees(): Promise<any[]> {
    const apps = await applicationService.getApplications();
    const stored = getStoredFees();

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('fees')
          .select('*, application:applications(application_no, business:businesses(name, area_sqm)), payments(*)')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped = data.map((f: any) => ({
            ...f,
            application_no: f.application?.application_no,
            business_name: f.application?.business?.name,
            receipt_number: f.payments?.[0]?.receipt_number,
            paid_at: f.payments?.[0]?.paid_at,
          }));
          return mapped;
        }
      } catch (err) {
        console.warn('Fees fetch notice:', err);
      }
    }

    // Dynamically derive fee records for all applications in the system
    const derivedFees: any[] = apps.map((app) => {
      const existing = stored.find((f: any) => f.application_id === app.id);
      const area = app.business?.area_sqm || 250;
      const amount = app.fee_amount || Math.max(500, Math.min(10000, area * 15));

      const statusMap: Record<string, PaymentStatus> = {
        PAYMENT_PENDING: 'PENDING',
        PAYMENT_VERIFIED: 'VERIFIED',
        APPROVAL_PENDING: 'VERIFIED',
        LICENSE_ISSUED: 'VERIFIED',
      };

      const defaultStatus: PaymentStatus = statusMap[app.status] || 'PENDING';

      if (existing) {
        return {
          ...existing,
          business_name: app.business?.name || existing.business_name,
          application_no: app.application_no || existing.application_no,
          calculated_area_sqm: area,
          amount,
        };
      }

      return {
        id: `fee-${app.id}`,
        organization_id: 'a0000000-0000-0000-0000-000000000001',
        application_id: app.id,
        business_id: app.business_id,
        application_no: app.application_no,
        business_name: app.business?.name || 'สถานประกอบการ',
        fee_type: 'LICENSE_FEE',
        amount,
        calculated_area_sqm: area,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: defaultStatus,
        created_at: app.created_at,
        updated_at: app.updated_at,
      };
    });

    saveStoredFees(derivedFees);
    return derivedFees;
  },

  async verifyPayment(feeId: string, receiptNumber: string, notes?: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('fees')
          .update({ status: 'VERIFIED', updated_at: new Date().toISOString() })
          .eq('id', feeId);

        await supabase.from('payments').insert({
          fee_id: feeId,
          application_id: feeId,
          receipt_number: receiptNumber,
          amount_paid: 1000,
          payment_method: 'PROMPTPAY_QR',
          status: 'VERIFIED',
          verification_notes: notes,
          paid_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Supabase verifyPayment notice:', err);
      }
    }

    const fees = getStoredFees();
    const targetFee = fees.find((f: any) => f.id === feeId);

    const updated = fees.map((f: any) => {
      if (f.id === feeId) {
        return {
          ...f,
          status: 'VERIFIED',
          receipt_number: receiptNumber,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
      return f;
    });

    saveStoredFees(updated);

    if (targetFee && targetFee.application_id) {
      await applicationService.updateApplicationStatus(targetFee.application_id, 'APPROVAL_PENDING', 'ตรวจสอบการชำระเงินเรียบร้อยแล้ว');
    }

    await auditService.logAction({
      action: 'VERIFY_PAYMENT',
      entityName: 'fees',
      entityId: feeId,
      newValues: { status: 'VERIFIED', receipt_number: receiptNumber, notes },
    });
  },

  async deleteFee(feeId: string): Promise<void> {
    const fees = getStoredFees();
    const filtered = fees.filter((f: any) => f.id !== feeId);
    saveStoredFees(filtered);
  },
};
