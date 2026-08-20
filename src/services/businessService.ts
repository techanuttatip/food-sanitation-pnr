import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Business, BusinessStatus, RiskLevel, Application } from '../types';
import { auditService } from './auditService';

const STORAGE_KEY = 'food_gov_businesses_v1';
const APP_STORAGE_KEY = 'food_gov_applications_v1';

function getStoredBusinesses(): Business[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: Business[] = raw ? JSON.parse(raw) : [];

    // Also extract any businesses saved inside applications
    const appRaw = localStorage.getItem(APP_STORAGE_KEY);
    if (appRaw) {
      const apps: Application[] = JSON.parse(appRaw);
      apps.forEach((app) => {
        if (app.business && !list.some((b) => b.id === app.business?.id || b.name === app.business?.name)) {
          list.push(app.business);
        }
      });
    }

    return list;
  } catch {
    return [];
  }
}

function saveStoredBusinesses(list: Business[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Storage save notice:', e);
  }
}

let localBusinessStore: Business[] = getStoredBusinesses();

async function ensureOrganizationExists() {
  if (!isSupabaseConfigured) return;
  try {
    const orgId = 'a0000000-0000-0000-0000-000000000001';
    await supabase.from('organizations').upsert({
      id: orgId,
      code: 'OBT-PONGNAMRON',
      name: 'องค์การบริหารส่วนตำบลโป่งน้ำร้อน',
      province: 'เชียงใหม่',
      amphoe: 'ฝาง',
      tambon: 'โป่งน้ำร้อน',
      address: 'ที่ทำการ อบต.โป่งน้ำร้อน อำเภอฝาง จังหวัดเชียงใหม่ 50110',
      phone: '053-123456',
      authorized_signer_name: 'นายกองค์การบริหารส่วนตำบลโป่งน้ำร้อน',
      authorized_signer_position: 'นายกองค์การบริหารส่วนตำบล',
    });
  } catch (err) {
    console.warn('Organization check notice:', err);
  }
}

export const businessService = {
  async getBusinesses(filters?: {
    search?: string;
    moo?: string;
    status?: BusinessStatus;
    riskLevel?: RiskLevel;
  }): Promise<Business[]> {
    localBusinessStore = getStoredBusinesses();

    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('businesses')
          .select('*, owner:business_owners(*), location:business_locations(*), current_license:licenses(*)')
          .order('created_at', { ascending: false });

        if (filters?.status) query = query.eq('status', filters.status);
        if (filters?.riskLevel) query = query.eq('risk_level', filters.riskLevel);
        if (filters?.search) query = query.ilike('name', `%${filters.search}%`);

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const dbIds = new Set(data.map((d: any) => d.id));
          const uniqueLocal = localBusinessStore.filter((b) => !dbIds.has(b.id));
          const merged = [...data, ...uniqueLocal];
          saveStoredBusinesses(merged);
          return merged;
        }
      } catch (err) {
        console.warn('Supabase getBusinesses notice:', err);
      }
    }

    let results = [...localBusinessStore];
    if (filters?.status) results = results.filter((b) => b.status === filters.status);
    if (filters?.riskLevel) results = results.filter((b) => b.risk_level === filters.riskLevel);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      results = results.filter((b) => b.name?.toLowerCase().includes(q) || b.business_code?.toLowerCase().includes(q));
    }
    return results;
  },

  async createBusiness(params: {
    name: string;
    business_type: string;
    food_category: string;
    area_sqm: number;
    owner: {
      title_th: string;
      first_name: string;
      last_name: string;
      national_id: string;
      phone_number: string;
      email?: string;
      subdistrict?: string;
      district?: string;
      province?: string;
    };
    location: {
      address_no: string;
      moo: string;
      village_name: string;
      subdistrict?: string;
      district?: string;
      province?: string;
      latitude?: number;
      longitude?: number;
    };
  }): Promise<Business> {
    await ensureOrganizationExists();

    const rand = Math.floor(Math.random() * 9000) + 1000;
    const businessCode = `FS-500408-${rand}`;
    const riskLevel: RiskLevel = params.area_sqm > 300 ? 'HIGH' : params.area_sqm > 150 ? 'MEDIUM' : 'LOW';
    const cleanNationalId = params.owner.national_id.replace(/\D/g, '') || `${Date.now()}`.slice(0, 13).padEnd(13, '0');

    let createdBiz: Business | null = null;

    if (isSupabaseConfigured) {
      try {
        const { data: ownerData } = await supabase
          .from('business_owners')
          .insert({
            organization_id: 'a0000000-0000-0000-0000-000000000001',
            national_id: cleanNationalId,
            title_th: params.owner.title_th || 'นาย',
            first_name: params.owner.first_name,
            last_name: params.owner.last_name,
            phone_number: params.owner.phone_number || '-',
            email: params.owner.email || null,
            subdistrict: params.owner.subdistrict || 'โป่งน้ำร้อน',
            district: params.owner.district || 'ฝาง',
            province: params.owner.province || 'เชียงใหม่',
          })
          .select()
          .single();

        const ownerId = ownerData?.id || `owner-${Date.now()}`;

        const { data: bizData } = await supabase
          .from('businesses')
          .insert({
            organization_id: 'a0000000-0000-0000-0000-000000000001',
            owner_id: ownerId,
            business_code: businessCode,
            name: params.name,
            business_type: params.business_type,
            food_category: params.food_category,
            area_sqm: params.area_sqm,
            status: 'SURVEYED',
            risk_level: riskLevel,
          })
          .select()
          .single();

        const bizId = bizData?.id || `biz-${Date.now()}`;

        const { data: locData } = await supabase
          .from('business_locations')
          .insert({
            business_id: bizId,
            address_no: params.location.address_no || '-',
            moo: params.location.moo || '1',
            village_name: params.location.village_name || '',
            subdistrict: params.location.subdistrict || 'โป่งน้ำร้อน',
            district: params.location.district || 'ฝาง',
            province: params.location.province || 'เชียงใหม่',
            latitude: params.location.latitude || 19.932761,
            longitude: params.location.longitude || 99.171911,
          })
          .select()
          .single();

        createdBiz = {
          id: bizId,
          organization_id: 'a0000000-0000-0000-0000-000000000001',
          business_code: businessCode,
          name: params.name,
          business_type: params.business_type,
          food_category: params.food_category,
          area_sqm: params.area_sqm,
          status: 'SURVEYED',
          risk_level: riskLevel,
          owner_id: ownerId,
          owner: ownerData || {
            id: ownerId,
            organization_id: 'a0000000-0000-0000-0000-000000000001',
            title_th: params.owner.title_th,
            first_name: params.owner.first_name,
            last_name: params.owner.last_name,
            national_id: cleanNationalId,
            phone_number: params.owner.phone_number,
            email: params.owner.email,
            subdistrict: 'โป่งน้ำร้อน',
            district: 'ฝาง',
            province: 'เชียงใหม่',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          location: locData || {
            id: `loc-${Date.now()}`,
            business_id: bizId,
            address_no: params.location.address_no,
            moo: params.location.moo,
            village_name: params.location.village_name,
            subdistrict: 'โป่งน้ำร้อน',
            district: 'ฝาง',
            province: 'เชียงใหม่',
            latitude: params.location.latitude || 19.932761,
            longitude: params.location.longitude || 99.171911,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      } catch (err: any) {
        console.warn('Supabase insert notice:', err.message);
      }
    }

    if (!createdBiz) {
      createdBiz = {
        id: `biz-${Date.now()}`,
        organization_id: 'a0000000-0000-0000-0000-000000000001',
        business_code: businessCode,
        name: params.name,
        business_type: params.business_type,
        food_category: params.food_category,
        area_sqm: params.area_sqm,
        status: 'SURVEYED',
        risk_level: riskLevel,
        owner_id: `owner-${Date.now()}`,
        owner: {
          id: `owner-${Date.now()}`,
          organization_id: 'a0000000-0000-0000-0000-000000000001',
          title_th: params.owner.title_th,
          first_name: params.owner.first_name,
          last_name: params.owner.last_name,
          national_id: cleanNationalId,
          phone_number: params.owner.phone_number,
          email: params.owner.email,
          subdistrict: 'โป่งน้ำร้อน',
          district: 'ฝาง',
          province: 'เชียงใหม่',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        location: {
          id: `loc-${Date.now()}`,
          business_id: `biz-${Date.now()}`,
          address_no: params.location.address_no,
          moo: params.location.moo,
          village_name: params.location.village_name,
          subdistrict: 'โป่งน้ำร้อน',
          district: 'ฝาง',
          province: 'เชียงใหม่',
          latitude: params.location.latitude || 19.932761,
          longitude: params.location.longitude || 99.171911,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    localBusinessStore = [createdBiz, ...localBusinessStore.filter((b) => b.id !== createdBiz!.id)];
    saveStoredBusinesses(localBusinessStore);

    await auditService.logAction({
      action: 'CREATE',
      entityName: 'businesses',
      entityId: createdBiz.id,
      newValues: { name: params.name, business_code: businessCode },
    });

    return createdBiz;
  },

  async updateBusiness(id: string, params: Partial<Business>): Promise<Business | null> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('businesses').update({
          name: params.name,
          business_type: params.business_type,
          food_category: params.food_category,
          area_sqm: params.area_sqm,
          status: params.status,
          risk_level: params.risk_level,
        }).eq('id', id);

        if (params.owner && params.owner_id) {
          await supabase.from('business_owners').update({
            first_name: params.owner.first_name,
            last_name: params.owner.last_name,
            national_id: params.owner.national_id,
            phone_number: params.owner.phone_number,
            email: params.owner.email,
          }).eq('id', params.owner_id);
        }

        if (params.location) {
          await supabase.from('business_locations').update({
            address_no: params.location.address_no,
            moo: params.location.moo,
            village_name: params.location.village_name,
            latitude: params.location.latitude,
            longitude: params.location.longitude,
          }).eq('business_id', id);
        }
      } catch (err) {
        console.warn('Supabase updateBusiness notice:', err);
      }
    }

    localBusinessStore = localBusinessStore.map((b) => (b.id === id ? { ...b, ...params, updated_at: new Date().toISOString() } : b));
    saveStoredBusinesses(localBusinessStore);

    await auditService.logAction({
      action: 'UPDATE',
      entityName: 'businesses',
      entityId: id,
      newValues: params,
    });

    return localBusinessStore.find((b) => b.id === id) || null;
  },

  async deleteBusiness(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('business_locations').delete().eq('business_id', id);
        await supabase.from('applications').delete().eq('business_id', id);
        await supabase.from('licenses').delete().eq('business_id', id);
        await supabase.from('businesses').delete().eq('id', id);
      } catch (err) {
        console.error('Failed to delete from Supabase:', err);
      }
    }

    localBusinessStore = localBusinessStore.filter((b) => b.id !== id);
    saveStoredBusinesses(localBusinessStore);

    await auditService.logAction({
      action: 'DELETE',
      entityName: 'businesses',
      entityId: id,
    });
  },
};
