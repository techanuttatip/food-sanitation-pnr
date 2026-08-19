import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Appointment, AppointmentStatus } from '../types';
import { auditService } from './auditService';
import { lineService } from './lineService';
import { applicationService } from './applicationService';

const STORAGE_KEY = 'food_gov_appointments_v1';

function getStoredAppointments(): any[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredAppointments(list: any[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Storage save notice:', e);
  }
}

export const appointmentService = {
  async getAppointments(): Promise<any[]> {
    const apps = await applicationService.getApplications();
    const stored = getStoredAppointments();

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*, application:applications(application_no, business:businesses(*, owner:business_owners(*), location:business_locations(*)))')
          .order('scheduled_date', { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped = data.map((a: any) => ({
            ...a,
            business_name: a.application?.business?.name || 'สถานประกอบการ',
            application_no: a.application?.application_no || '-',
            owner_name: a.application?.business?.owner
              ? `${a.application.business.owner.first_name} ${a.application.business.owner.last_name}`
              : 'ผู้ประกอบการ',
            phone_number: a.application?.business?.owner?.phone_number || '081-0000000',
            location_desc: `ม.${a.application?.business?.location?.moo || '1'} ${a.application?.business?.location?.village_name || 'โป่งน้ำร้อน'}`,
          }));
          return mapped;
        }
      } catch (err) {
        console.warn('Appointments fetch notice:', err);
      }
    }

    // If appointments exist in storage, return them
    if (stored.length > 0) {
      return stored;
    }

    // Auto-create initial appointment for any submitted application
    const derived = apps.map((app) => {
      const scheduled_date = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return {
        id: `apt-${app.id}`,
        organization_id: 'a0000000-0000-0000-0000-000000000001',
        application_id: app.id,
        business_id: app.business_id,
        application_no: app.application_no,
        business_name: app.business?.name || 'สถานประกอบการ',
        owner_name: app.business?.owner ? `${app.business.owner.first_name} ${app.business.owner.last_name}` : 'ผู้ประกอบการ',
        phone_number: app.business?.owner?.phone_number || '081-0000000',
        location_desc: `ม.${app.business?.location?.moo || '1'} ${app.business?.location?.village_name || 'โป่งน้ำร้อน'}`,
        scheduled_date,
        scheduled_time_slot: '10:00 - 11:30 น.',
        inspector_user_id: 'u004',
        inspector_name: 'นายไพโรจน์ สว่างเวียง (จนท. สาธารณสุข)',
        status: 'SCHEDULED' as AppointmentStatus,
        citizen_confirmed: true,
        notification_sent_line: true,
        notes: 'นัดตรวจสุขาภิบาลสถานที่สะสมอาหาร 10 ข้อมาตรฐาน',
        created_at: app.created_at,
        updated_at: app.updated_at,
      };
    });

    saveStoredAppointments(derived);
    return derived;
  },

  async createAppointment(params: {
    application_id: string;
    scheduled_date: string;
    scheduled_time_slot: string;
    inspector_name: string;
    notes?: string;
  }): Promise<any> {
    const apps = await applicationService.getApplications();
    const app = apps.find((a) => a.id === params.application_id);

    const newApt = {
      id: `apt-${Date.now()}`,
      organization_id: 'a0000000-0000-0000-0000-000000000001',
      application_id: params.application_id,
      business_id: app?.business_id || '',
      application_no: app?.application_no || '-',
      business_name: app?.business?.name || 'สถานประกอบการ',
      owner_name: app?.business?.owner ? `${app.business.owner.first_name} ${app.business.owner.last_name}` : 'ผู้ประกอบการ',
      phone_number: app?.business?.owner?.phone_number || '081-0000000',
      location_desc: `ม.${app?.business?.location?.moo || '1'} ${app?.business?.location?.village_name || 'โป่งน้ำร้อน'}`,
      scheduled_date: params.scheduled_date,
      scheduled_time_slot: params.scheduled_time_slot,
      inspector_user_id: 'u004',
      inspector_name: params.inspector_name,
      status: 'SCHEDULED' as AppointmentStatus,
      citizen_confirmed: false,
      notification_sent_line: true,
      notes: params.notes || 'นัดตรวจมาตรฐานสุขาภิบาล',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const stored = getStoredAppointments();
    const updated = [newApt, ...stored];
    saveStoredAppointments(updated);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('appointments').insert({
          organization_id: 'a0000000-0000-0000-0000-000000000001',
          application_id: params.application_id,
          scheduled_date: params.scheduled_date,
          scheduled_time_slot: params.scheduled_time_slot,
          inspector_user_id: 'u001',
          status: 'SCHEDULED',
          notes: params.notes,
        });
      } catch (err) {
        console.warn('Supabase create appointment notice:', err);
      }
    }

    if (app) {
      await applicationService.updateApplicationStatus(app.id, 'APPOINTMENT_SCHEDULED', `นัดตรวจวันที่ ${params.scheduled_date} (${params.scheduled_time_slot})`);
    }

    await lineService.sendFlexMessage({
      business_id: app?.business_id || 'b-001',
      business_name: app?.business?.name || 'สถานประกอบการ',
      recipient_name: newApt.owner_name,
      event_type: 'APPOINTMENT',
      title: `นัดตรวจสุขาภิบาล: ${params.scheduled_date} (${params.scheduled_time_slot})`,
      message_preview: `เจ้าหน้าที่ ${params.inspector_name} มีกำหนดลงตรวจวันที่ ${params.scheduled_date} เวลา ${params.scheduled_time_slot}`,
    });

    await auditService.logAction({
      action: 'SCHEDULE_APPOINTMENT',
      entityName: 'appointments',
      entityId: newApt.id,
      newValues: { scheduled_date: params.scheduled_date, scheduled_time_slot: params.scheduled_time_slot },
    });

    return newApt;
  },

  async confirmAppointmentByCitizen(id: string): Promise<void> {
    const stored = getStoredAppointments();
    const updated = stored.map((a: any) =>
      a.id === id ? { ...a, status: 'CONFIRMED', citizen_confirmed: true, updated_at: new Date().toISOString() } : a
    );
    saveStoredAppointments(updated);
  },

  async rescheduleAppointment(id: string, newDate: string, newSlot: string, reason: string): Promise<void> {
    const stored = getStoredAppointments();
    const updated = stored.map((a: any) =>
      a.id === id
        ? {
            ...a,
            scheduled_date: newDate,
            scheduled_time_slot: newSlot,
            status: 'SCHEDULED',
            citizen_confirmed: false,
            notes: `ขอเลื่อนนัด: ${reason}`,
            updated_at: new Date().toISOString(),
          }
        : a
    );
    saveStoredAppointments(updated);
  },

  async deleteAppointment(id: string): Promise<void> {
    const stored = getStoredAppointments();
    const filtered = stored.filter((a: any) => a.id !== id);
    saveStoredAppointments(filtered);
  },
};
