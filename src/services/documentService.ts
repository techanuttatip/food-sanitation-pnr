import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { ApplicationDocument, DocumentRecord, DocumentStatus } from '../types';
import { auditService } from './auditService';
import { applicationService } from './applicationService';

export const documentService = {
  async getDocumentsByApplicationId(applicationId: string): Promise<ApplicationDocument[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('application_documents')
          .select('*, document:documents(*)')
          .eq('application_id', applicationId)
          .order('created_at', { ascending: true });

        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.warn('Documents fetch notice:', err);
      }
    }

    const app = await applicationService.getApplicationById(applicationId);
    return app?.documents || [];
  },

  async getAllApplicationDocuments(): Promise<(ApplicationDocument & { application_no?: string; business_name?: string; file_name?: string; file_size_kb?: number })[]> {
    const apps = await applicationService.getApplications();
    const allDocs: (ApplicationDocument & { application_no?: string; business_name?: string; file_name?: string; file_size_kb?: number })[] = [];

    apps.forEach((app) => {
      if (app.documents && app.documents.length > 0) {
        app.documents.forEach((doc) => {
          allDocs.push({
            ...doc,
            application_no: app.application_no,
            business_name: app.business?.name || 'สถานประกอบการ',
            file_name: doc.document?.file_name || `${doc.document_type.toLowerCase()}_scan.pdf`,
            file_size_kb: doc.document?.file_size_bytes ? Math.round(doc.document.file_size_bytes / 1024) : 250,
          });
        });
      } else {
        const defaults: (ApplicationDocument & { application_no?: string; business_name?: string; file_name?: string; file_size_kb?: number })[] = [
          {
            id: `doc-${app.id}-1`,
            application_id: app.id,
            document_type: 'ID_CARD',
            title_th: 'สำเนาบัตรประชาชนผู้ขอรับใบอนุญาต',
            is_required: true,
            status: 'APPROVED',
            created_at: app.created_at,
            updated_at: app.updated_at,
            application_no: app.application_no,
            business_name: app.business?.name || 'สถานประกอบการ',
            file_name: 'national_id_card.pdf',
            file_size_kb: 245,
          },
          {
            id: `doc-${app.id}-2`,
            application_id: app.id,
            document_type: 'HOUSE_REG',
            title_th: 'สำเนาทะเบียนบ้านสถานประกอบการ',
            is_required: true,
            status: 'APPROVED',
            created_at: app.created_at,
            updated_at: app.updated_at,
            application_no: app.application_no,
            business_name: app.business?.name || 'สถานประกอบการ',
            file_name: 'house_registration.pdf',
            file_size_kb: 310,
          },
          {
            id: `doc-${app.id}-3`,
            application_id: app.id,
            document_type: 'FLOOR_PLAN',
            title_th: 'แผนผังและภาพถ่ายสถานที่สะสมอาหาร',
            is_required: true,
            status: 'UNDER_REVIEW',
            created_at: app.created_at,
            updated_at: app.updated_at,
            application_no: app.application_no,
            business_name: app.business?.name || 'สถานประกอบการ',
            file_name: 'floor_plan_v1.pdf',
            file_size_kb: 1024,
          },
          {
            id: `doc-${app.id}-4`,
            application_id: app.id,
            document_type: 'MEDICAL_CERT',
            title_th: 'ใบรับรองแพทย์และวุฒิบัตรผู้สัมผัสอาหาร',
            is_required: true,
            status: 'MISSING',
            created_at: app.created_at,
            updated_at: app.updated_at,
            application_no: app.application_no,
            business_name: app.business?.name || 'สถานประกอบการ',
            file_name: '',
            file_size_kb: 0,
          },
        ];

        defaults.forEach((doc) => allDocs.push(doc));
      }
    });

    return allDocs;
  },

  async verifyDocument(
    appDocId: string,
    status: DocumentStatus,
    rejectionReason?: string
  ): Promise<void> {
    return this.updateDocumentStatus(appDocId, status, rejectionReason);
  },

  async updateDocumentStatus(
    appDocId: string,
    status: DocumentStatus,
    rejectionReason?: string
  ): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('application_documents')
          .update({
            status,
            rejection_reason: rejectionReason,
            verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', appDocId);
      } catch (err) {
        console.warn('Supabase document update notice:', err);
      }
    }

    const apps = await applicationService.getApplications();
    for (const app of apps) {
      const doc = app.documents?.find((d) => d.id === appDocId);
      if (doc) {
        doc.status = status;
        doc.rejection_reason = rejectionReason || undefined;
        doc.verified_at = new Date().toISOString();
        doc.updated_at = new Date().toISOString();
        break;
      }
    }

    await auditService.logAction({
      action: 'VERIFY_DOCUMENT',
      entityName: 'application_documents',
      entityId: appDocId,
      newValues: { status, rejection_reason: rejectionReason },
    });
  },

  async uploadFileMetadata(
    applicationId: string,
    file: File,
    documentType: string
  ): Promise<DocumentRecord> {
    const newDoc: DocumentRecord = {
      id: `doc-file-${Date.now()}`,
      organization_id: 'a0000000-0000-0000-0000-000000000001',
      file_name: file.name,
      file_path: `applications/${applicationId}/${file.name}`,
      file_size_bytes: file.size,
      mime_type: file.type,
      storage_bucket: 'application-documents',
      created_at: new Date().toISOString(),
    };

    return newDoc;
  },
};
