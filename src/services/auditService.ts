import { supabase, isSupabaseConfigured, DEMO_AUDIT_LOGS } from '../lib/supabase';
import type { AuditLog } from '../types';

export const auditService = {
  async getAuditLogs(limit: number = 50): Promise<AuditLog[]> {
    if (!isSupabaseConfigured) {
      return [...DEMO_AUDIT_LOGS].slice(0, limit);
    }

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async logAction(params: {
    action: string;
    entityName: string;
    entityId: string;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    actorName?: string;
    actorEmail?: string;
  }): Promise<void> {
    if (!isSupabaseConfigured) {
      const newLog: AuditLog = {
        id: `aud-${Date.now()}`,
        action: params.action,
        entity_name: params.entityName,
        entity_id: params.entityId,
        old_values: params.oldValues,
        new_values: params.newValues,
        actor_name: params.actorName || 'เจ้าหน้าที่ทดสอบ',
        actor_email: params.actorEmail || 'officer@gov.th',
        created_at: new Date().toISOString(),
      };
      DEMO_AUDIT_LOGS.unshift(newLog);
      return;
    }

    await supabase.from('audit_logs').insert({
      action: params.action,
      entity_name: params.entityName,
      entity_id: params.entityId,
      old_values: params.oldValues,
      new_values: params.newValues,
    });
  }
};
