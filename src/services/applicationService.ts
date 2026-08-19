import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Application, ApplicationStatus, ApplicationType, ApplicationDocument, Business } from '../types';
import { auditService } from './auditService';
import { businessService } from './businessService';

const STORAGE_KEY = 'food_gov_applications_v1';

function getStoredApplications(): Application[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredApplications(list: Application[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Storage save notice:', e);
  }
}

let localApplications: Application[] = getStoredApplications();

export const applicationService = {
  async getApplications(filters?: {
    status?: ApplicationStatus;
    search?: string;
  }): Promise<Application[]> {
    localApplications = getStoredApplications();

    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('applications')
          .select('*, business:businesses(*, owner:business_owners(*), location:business_locations(*)), documents:application_documents(*), appointment:appointments(*), license:licenses(*)')
          .order('created_at', { ascending: false });

        if (filters?.status) query = query.eq('status', filters.status);

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const dbIds = new Set(data.map((d: any) => d.id));
          const uniqueLocal = localApplications.filter((a) => !dbIds.has(a.id));
          const merged = [...uniqueLocal, ...data];
          saveStoredApplications(merged);
          return merged;
        }
      } catch (err) {
        console.warn('Applications fetch notice:', err);
      }
    }

    let results = [...localApplications];
    if (filters?.status) results = results.filter((a) => a.status === filters.status);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (a) =>
          a.application_no?.toLowerCase().includes(q) ||
          a.tracking_code?.toLowerCase().includes(q) ||
          a.business?.name?.toLowerCase().includes(q)
      );
    }
    return results;
  },

  async getApplicationById(id: string): Promise<Application | null> {
    const list = await this.getApplications();
    return list.find((a) => a.id === id) || null;
  },

  async getApplicationByTrackingCode(trackingCode: string): Promise<Application | null> {
    const code = trackingCode.trim().toUpperCase();
    const list = await this.getApplications();
    return list.find((a) => a.tracking_code?.toUpperCase() === code) || null;
  },

  async createApplication(params: {
    business_id: string;
    application_type: ApplicationType;
    quickBusiness?: {
      name: string;
      business_type: string;
      owner_name: string;
      phone_number: string;
      moo: string;
    };
  }): Promise<Application> {
    const yearBE = new Date().getFullYear() + 543;
    const randTrack = Math.random().toString(36).substring(2, 6).toUpperCase();
    const tracking_code = `TRK-${yearBE}-${randTrack}`;
    const randNo = Math.floor(Math.random() * 9000) + 1000;
    const application_no = `APP-${yearBE}-${randNo}`;

    let bizId = params.business_id;
    let business: Business | undefined;

    // Quick business creation if no business ID was passed
    if (!bizId && params.quickBusiness) {
      const parts = params.quickBusiness.owner_name.trim().split(' ');
      const newBiz = await businessService.createBusiness({
        name: params.quickBusiness.name,
        business_type: params.quickBusiness.business_type || 'ร้านอาหารและสถานที่สะสมอาหาร',
        food_category: 'อาหารทั่วไปและวัตถุดิบ',
        area_sqm: 250,
        owner: {
          title_th: 'นาย',
          first_name: parts[0] || 'ผู้ประกอบการ',
          last_name: parts[1] || 'อบต.โป่งน้ำร้อน',
          national_id: `${Date.now()}`.slice(0, 13).padEnd(13, '0'),
          phone_number: params.quickBusiness.phone_number || '081-0000000',
        },
        location: {
          address_no: '123',
          moo: params.quickBusiness.moo || '1',
          village_name: 'โป่งน้ำร้อน',
        },
      });
      bizId = newBiz.id;
      business = newBiz;
    } else {
      const allBiz = await businessService.getBusinesses();
      business = allBiz.find((b) => b.id === bizId);
    }

    const area = business?.area_sqm || 250;
    const rawFee = area * 15;
    const fee_amount = Math.max(500, Math.min(10000, rawFee));

    const initialDocuments: ApplicationDocument[] = [
      {
        id: `doc-${Date.now()}-1`,
        application_id: '',
        document_type: 'ID_CARD',
        title_th: 'สำเนาบัตรประชาชนผู้ขอรับใบอนุญาต',
        is_required: true,
        status: 'MISSING',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: `doc-${Date.now()}-2`,
        application_id: '',
        document_type: 'HOUSE_REG',
        title_th: 'สำเนาทะเบียนบ้านสถานประกอบการ',
        is_required: true,
        status: 'MISSING',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: `doc-${Date.now()}-3`,
        application_id: '',
        document_type: 'FLOOR_PLAN',
        title_th: 'แผนผังและภาพถ่ายสถานที่สะสมอาหาร',
        is_required: true,
        status: 'MISSING',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: `doc-${Date.now()}-4`,
        application_id: '',
        document_type: 'MEDICAL_CERT',
        title_th: 'ใบรับรองแพทย์และวุฒิบัตรผู้สัมผัสอาหาร',
        is_required: true,
        status: 'MISSING',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    let createdApp: Application | null = null;

    if (isSupabaseConfigured && bizId) {
      try {
        const { data: appData } = await supabase
          .from('applications')
          .insert({
            organization_id: 'a0000000-0000-0000-0000-000000000001',
            application_no,
            tracking_code,
            business_id: bizId,
            application_type: params.application_type,
            status: 'SUBMITTED',
            fee_amount,
          })
          .select('*, business:businesses(*)')
          .single();

        if (appData) {
          createdApp = {
            ...appData,
            business: business || appData.business,
            documents: initialDocuments,
          };

          const docInserts = initialDocuments.map((d) => ({
            application_id: appData.id,
            document_type: d.document_type,
            title_th: d.title_th,
            is_required: d.is_required,
            status: 'MISSING',
          }));

          await supabase.from('application_documents').insert(docInserts);
        }
      } catch (err) {
        console.warn('Supabase app insert notice:', err);
      }
    }

    if (!createdApp) {
      createdApp = {
        id: `app-${Date.now()}`,
        organization_id: 'a0000000-0000-0000-0000-000000000001',
        application_no,
        tracking_code,
        business_id: bizId || `b-${Date.now()}`,
        application_type: params.application_type,
        status: 'SUBMITTED',
        submitted_date: new Date().toISOString(),
        fee_amount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        business,
        documents: initialDocuments,
      };
    }

    localApplications = [createdApp, ...localApplications.filter((a) => a.id !== createdApp!.id)];
    saveStoredApplications(localApplications);

    await auditService.logAction({
      action: 'INSERT',
      entityName: 'applications',
      entityId: createdApp.id,
      newValues: { application_no, tracking_code },
    });

    return createdApp;
  },

  async updateApplicationStatus(
    id: string,
    newStatus: ApplicationStatus,
    notes?: string
  ): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('applications')
          .update({ status: newStatus, review_notes: notes, updated_at: new Date().toISOString() })
          .eq('id', id);
      } catch (e) {
        console.warn('Supabase app status notice:', e);
      }
    }

    localApplications = localApplications.map((a) => {
      if (a.id === id) {
        const updated = { ...a, status: newStatus, review_notes: notes || a.review_notes, updated_at: new Date().toISOString() };
        if (newStatus === 'LICENSE_ISSUED' && updated.business) {
          updated.business.status = 'LICENSED';
        }
        return updated;
      }
      return a;
    });
    saveStoredApplications(localApplications);

    await auditService.logAction({
      action: 'STATUS_CHANGE',
      entityName: 'applications',
      entityId: id,
      newValues: { status: newStatus, notes },
    });
  },

  async deleteApplication(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('application_documents').delete().eq('application_id', id);
        await supabase.from('appointments').delete().eq('application_id', id);
        await supabase.from('applications').delete().eq('id', id);
      } catch (err) {
        console.error('Failed to delete application from Supabase:', err);
      }
    }

    localApplications = localApplications.filter((a) => a.id !== id);
    saveStoredApplications(localApplications);

    await auditService.logAction({
      action: 'DELETE',
      entityName: 'applications',
      entityId: id,
    });
  },
};
