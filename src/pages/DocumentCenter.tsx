import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';
import { formatThaiDate } from '../lib/utils';
import { documentService } from '../services/documentService';
import { businessService } from '../services/businessService';
import { applicationService } from '../services/applicationService';
import type { ApplicationDocument, DocumentStatus, Business, Application } from '../types';
import {
  FolderOpen,
  Folder,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Download,
  Eye,
  Clock,
  Building2,
  ArrowLeft,
  Upload,
  Plus,
  FileCheck,
  Trash2,
  Phone,
  MapPin,
  User,
  ShieldCheck,
  Filter,
} from 'lucide-react';

interface DocItem extends Partial<ApplicationDocument> {
  id: string;
  document_type: any;
  title_th: string;
  status: DocumentStatus;
  application_id?: string;
  application_no?: string;
  business_id?: string;
  business_name?: string;
  file_name?: string;
  file_size_kb?: number;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

interface BusinessFolder {
  id: string;
  name: string;
  business_code?: string;
  application_no?: string;
  owner_name?: string;
  phone?: string;
  location?: string;
  documents: DocItem[];
  approved_count: number;
  under_review_count: number;
  rejected_count: number;
  missing_count: number;
  total_count: number;
  completion_pct: number;
}

export const DocumentCenter: React.FC = () => {
  const { success, error } = useToast();
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [businessFolders, setBusinessFolders] = useState<BusinessFolder[]>([]);
  const [activeFolder, setActiveFolder] = useState<BusinessFolder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<'folders' | 'all-docs'>('folders');

  // Document Preview / Review Modal State
  const [previewDoc, setPreviewDoc] = useState<DocItem | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [rejectionNotes, setRejectionNotes] = useState('');

  // Upload New Document Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    doc_type: 'FLOOR_PLAN',
    title_th: 'แผนผังสถานที่สะสมอาหาร',
    file_name: '',
  });

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [docs, businesses, apps] = await Promise.all([
        documentService.getAllApplicationDocuments(),
        businessService.getBusinesses(),
        applicationService.getApplications(),
      ]);

      setDocuments(docs);

      // Group documents into Business Folders
      const folderMap = new Map<string, BusinessFolder>();

      // 1. Initialize folders for all registered businesses
      businesses.forEach((biz) => {
        const app = apps.find((a) => a.business_id === biz.id || a.business?.name === biz.name);
        const folderId = biz.id || `biz-${biz.name}`;
        folderMap.set(biz.name, {
          id: folderId,
          name: biz.name,
          business_code: biz.business_code,
          application_no: app?.application_no || 'APP-2569-001',
          owner_name: biz.owner ? `${biz.owner.title_th || ''}${biz.owner.first_name} ${biz.owner.last_name}` : 'ผู้ประกอบการ',
          phone: biz.owner?.phone_number || '-',
          location: biz.location ? `ม.${biz.location.moo} ${biz.location.village_name || ''} ต.โป่งน้ำร้อน` : 'ต.โป่งน้ำร้อน อ.ฝาง',
          documents: [],
          approved_count: 0,
          under_review_count: 0,
          rejected_count: 0,
          missing_count: 0,
          total_count: 0,
          completion_pct: 0,
        });
      });

      // 2. Put docs into corresponding folders
      docs.forEach((doc) => {
        const bName = doc.business_name || 'สถานประกอบการทั่วไป';
        let folder = folderMap.get(bName);

        if (!folder) {
          folder = {
            id: `folder-${bName}`,
            name: bName,
            business_code: 'BS-2569-001',
            application_no: doc.application_no || 'APP-2569-001',
            owner_name: 'ผู้ประกอบการ',
            phone: '-',
            location: 'ต.โป่งน้ำร้อน อ.ฝาง จ.เชียงใหม่',
            documents: [],
            approved_count: 0,
            under_review_count: 0,
            rejected_count: 0,
            missing_count: 0,
            total_count: 0,
            completion_pct: 0,
          };
          folderMap.set(bName, folder);
        }

        folder.documents.push(doc);
      });

      // 3. Calculate statistics for each folder
      const foldersList = Array.from(folderMap.values()).map((folder) => {
        // If folder has no docs yet, populate default standard checklist
        if (folder.documents.length === 0) {
          folder.documents = [
            {
              id: `doc-${folder.id}-1`,
              document_type: 'ID_CARD',
              title_th: 'สำเนาบัตรประชาชนผู้ขอรับใบอนุญาต',
              is_required: true,
              status: 'APPROVED',
              business_name: folder.name,
              application_no: folder.application_no,
              file_name: 'id_card_scan.pdf',
              file_size_kb: 245,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: `doc-${folder.id}-2`,
              document_type: 'HOUSE_REG',
              title_th: 'สำเนาทะเบียนบ้านสถานประกอบการ',
              is_required: true,
              status: 'APPROVED',
              business_name: folder.name,
              application_no: folder.application_no,
              file_name: 'house_reg.pdf',
              file_size_kb: 312,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: `doc-${folder.id}-3`,
              document_type: 'FLOOR_PLAN',
              title_th: 'แผนผังและภาพถ่ายสถานที่สะสมอาหาร',
              is_required: true,
              status: 'UNDER_REVIEW',
              business_name: folder.name,
              application_no: folder.application_no,
              file_name: 'floor_plan.pdf',
              file_size_kb: 1024,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: `doc-${folder.id}-4`,
              document_type: 'MEDICAL_CERT',
              title_th: 'ใบรับรองแพทย์และวุฒิบัตรผู้สัมผัสอาหาร',
              is_required: true,
              status: 'MISSING',
              business_name: folder.name,
              application_no: folder.application_no,
              file_name: '',
              file_size_kb: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ];
        }

        const approved = folder.documents.filter((d) => d.status === 'APPROVED').length;
        const underReview = folder.documents.filter((d) => d.status === 'UNDER_REVIEW').length;
        const rejected = folder.documents.filter((d) => d.status === 'REJECTED').length;
        const missing = folder.documents.filter((d) => d.status === 'MISSING').length;
        const total = folder.documents.length;
        const completion = total > 0 ? Math.round((approved / total) * 100) : 0;

        return {
          ...folder,
          approved_count: approved,
          under_review_count: underReview,
          rejected_count: rejected,
          missing_count: missing,
          total_count: total,
          completion_pct: completion,
        };
      });

      setBusinessFolders(foldersList);

      // If viewing active folder, keep it synced
      if (activeFolder) {
        const updatedActive = foldersList.find((f) => f.name === activeFolder.name);
        if (updatedActive) setActiveFolder(updatedActive);
      }
    } catch (err: any) {
      console.warn('Load document center notice:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewDoc) return;

    try {
      await documentService.verifyDocument(
        previewDoc.id,
        reviewAction,
        reviewAction === 'REJECTED' ? rejectionNotes : undefined
      );

      // Update local state
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === previewDoc.id
            ? { ...d, status: reviewAction, rejection_reason: reviewAction === 'REJECTED' ? rejectionNotes : undefined }
            : d
        )
      );

      // Update folder state
      if (activeFolder) {
        setActiveFolder((prev) => {
          if (!prev) return null;
          const updatedDocs = prev.documents.map((d) =>
            d.id === previewDoc.id
              ? { ...d, status: reviewAction, rejection_reason: reviewAction === 'REJECTED' ? rejectionNotes : undefined }
              : d
          );
          const approved = updatedDocs.filter((d) => d.status === 'APPROVED').length;
          return {
            ...prev,
            documents: updatedDocs,
            approved_count: approved,
            completion_pct: Math.round((approved / updatedDocs.length) * 100),
          };
        });
      }

      setPreviewDoc(null);
      setRejectionNotes('');
      success(
        reviewAction === 'APPROVED' ? 'อนุมัติเอกสารแล้ว ✅' : 'ส่งข้อความแจ้งแก้ไขเอกสารแล้ว ⚠️',
        `เอกสาร: ${previewDoc.title_th}`
      );
    } catch (err: any) {
      error('เกิดข้อผิดพลาดในการตรวจสอบเอกสาร', err.message);
    }
  };

  const handleUploadNewDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFolder) return;

    const newDoc: DocItem = {
      id: `doc-${Date.now()}`,
      document_type: uploadData.doc_type as any,
      title_th: uploadData.title_th,
      is_required: true,
      status: 'UNDER_REVIEW',
      business_name: activeFolder.name,
      application_no: activeFolder.application_no,
      file_name: uploadData.file_name || `${uploadData.doc_type.toLowerCase()}_upload.pdf`,
      file_size_kb: 450,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setActiveFolder((prev) => {
      if (!prev) return null;
      const updatedDocs = [newDoc, ...prev.documents];
      return {
        ...prev,
        documents: updatedDocs,
        total_count: updatedDocs.length,
        under_review_count: prev.under_review_count + 1,
      };
    });

    setIsUploadModalOpen(false);
    success('อัปโหลดเอกสารเข้าแฟ้มสำเร็จ 📁', `เพิ่ม "${newDoc.title_th}" ในแฟ้ม ${activeFolder.name} เรียบร้อยแล้ว`);
  };

  const filteredFolders = businessFolders.filter((f) => {
    const matchSearch =
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      (f.owner_name && f.owner_name.toLowerCase().includes(search.toLowerCase())) ||
      (f.application_no && f.application_no.toLowerCase().includes(search.toLowerCase())) ||
      (f.location && f.location.toLowerCase().includes(search.toLowerCase()));

    if (!statusFilter) return matchSearch;
    if (statusFilter === 'COMPLETE') return matchSearch && f.completion_pct === 100;
    if (statusFilter === 'INCOMPLETE') return matchSearch && f.completion_pct < 100;
    if (statusFilter === 'REVIEW') return matchSearch && f.under_review_count > 0;
    return matchSearch;
  });

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ตรวจสอบผ่านแล้ว
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300">
            <Clock className="w-3 h-3 text-sky-600 animate-spin" /> รอเจ้าหน้าที่ตรวจสอบ
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3 h-3 text-rose-600" /> เอกสารต้องแก้ไข
          </span>
        );
      case 'MISSING':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-300">
            <AlertCircle className="w-3 h-3 text-slate-400" /> ยังไม่ได้ส่งเอกสาร
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FolderOpen className="w-6 h-6 text-amber-500" />
              ศูนย์จัดการเอกสารสาธารณสุข (Document Repository)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            คลังจัดเก็บและตรวจสอบเอกสารหลักฐานสถานที่สะสมอาหาร แยกตามรายสถานประกอบการ
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2">
          {activeFolder && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveFolder(null)}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              className="text-xs font-bold"
            >
              ย้อนกลับดูทุกร้าน
            </Button>
          )}
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => {
                setViewMode('folders');
                setActiveFolder(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'folders' && !activeFolder
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Folder className="w-3.5 h-3.5 text-amber-500" />
              แฟ้มรายร้าน ({businessFolders.length})
            </button>
            <button
              onClick={() => {
                setViewMode('all-docs');
                setActiveFolder(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'all-docs'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-gov-700" />
              เอกสารทั้งหมด ({documents.length})
            </button>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODE 1: ACTIVE BUSINESS FOLDER VIEW (Inside a specific business)          */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeFolder ? (
        <div className="space-y-6">
          {/* Breadcrumb & Business Info Card */}
          <Card className="p-5 bg-linear-to-r from-amber-500/10 via-amber-50 to-white border-2 border-amber-300/80 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/60 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shrink-0">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide bg-amber-200/80 px-2 py-0.5 rounded-md">
                      แฟ้มเอกสารประจำร้าน
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      เลขคำขอ: {activeFolder.application_no}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
                    {activeFolder.name}
                  </h3>
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsUploadModalOpen(true)}
                leftIcon={<Upload className="w-4 h-4" />}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
              >
                + อัปโหลดเอกสารเพิ่มเข้าแฟ้มนี้
              </Button>
            </div>

            {/* Quick Metadata Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700">
              <div className="flex items-center gap-2 bg-white/80 p-2.5 rounded-xl border border-amber-200/60">
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">เจ้าของกิจการ:</p>
                  <p className="font-bold text-slate-900">{activeFolder.owner_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white/80 p-2.5 rounded-xl border border-amber-200/60">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">เบอร์โทรศัพท์ติดต่อ:</p>
                  <p className="font-bold text-slate-900 font-mono">{activeFolder.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white/80 p-2.5 rounded-xl border border-amber-200/60">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">ที่ตั้งสถานที่สะสมอาหาร:</p>
                  <p className="font-bold text-slate-900 line-clamp-1">{activeFolder.location}</p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-700">
                  ความสมบูรณ์ของเอกสารในแฟ้ม ({activeFolder.approved_count}/{activeFolder.total_count} ผ่านแล้ว)
                </span>
                <span
                  className={
                    activeFolder.completion_pct === 100
                      ? 'text-emerald-600'
                      : activeFolder.completion_pct >= 50
                      ? 'text-amber-600'
                      : 'text-rose-600'
                  }
                >
                  {activeFolder.completion_pct}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    activeFolder.completion_pct === 100
                      ? 'bg-emerald-500'
                      : activeFolder.completion_pct >= 50
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${activeFolder.completion_pct}%` }}
                />
              </div>
            </div>
          </Card>

          {/* List of Documents in this Business Folder */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-gov-700" />
              รายการเอกสารหลักฐานทั้งหมดในแฟ้ม ({activeFolder.documents.length} รายการ):
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeFolder.documents.map((doc, idx) => (
                <Card
                  key={doc.id || idx}
                  className="p-5 border border-slate-200 bg-white rounded-2xl shadow-2xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-gov-700 flex items-center justify-center font-bold text-sm shadow-2xs">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="font-bold text-sm text-slate-900 leading-snug">
                            {doc.title_th}
                          </h5>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {doc.document_type}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>{getStatusBadge(doc.status)}</div>

                    {/* File Attachment Details */}
                    {doc.file_name ? (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-700">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="font-mono text-[11px] truncate">{doc.file_name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                          {doc.file_size_kb} KB
                        </span>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>ผู้ประกอบการยังไม่ได้แนบไฟล์เอกสารนี้</span>
                      </div>
                    )}

                    {doc.rejection_reason && (
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-0.5">
                        <p className="font-bold">เหตุผลที่ต้องแก้ไข:</p>
                        <p>{doc.rejection_reason}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewDoc(doc)}
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                      className="text-xs flex-1"
                    >
                      ดูตัวอย่าง / ตรวจเอกสาร
                    </Button>

                    {doc.file_name && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => success('กำลังดาวน์โหลดไฟล์', doc.file_name)}
                        leftIcon={<Download className="w-3.5 h-3.5" />}
                        className="text-xs"
                      >
                        โหลด
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ────────────────────────────────────────────────────────────────────────── */
        /* MODE 2: BUSINESS FOLDERS LIST (Default View)                               */
        /* ────────────────────────────────────────────────────────────────────────── */
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อร้านค้า, เจ้าของกิจการ, เลขคำขอ, หรือหมู่บ้าน..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            >
              <option value="">สถานะความสมบูรณ์ทั้งหมด</option>
              <option value="REVIEW">⏳ มีเอกสารรอตรวจสอบ</option>
              <option value="COMPLETE">✅ เอกสารครบถ้วน 100%</option>
              <option value="INCOMPLETE">⚠️ เอกสารยังไม่ครบ</option>
            </select>
          </div>

          {/* Grid of Business Folders */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFolders.map((folder) => (
              <Card
                key={folder.id}
                className="p-5 border border-slate-200 bg-white rounded-2xl shadow-2xs hover:shadow-lg hover:border-amber-400 transition-all duration-200 flex flex-col justify-between space-y-4 group cursor-pointer"
                onClick={() => setActiveFolder(folder)}
              >
                <div className="space-y-3.5">
                  {/* Top Folder Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:bg-amber-500 group-hover:text-white transition-all">
                        <Folder className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-slate-900 group-hover:text-amber-700 transition-colors leading-snug line-clamp-1">
                          {folder.name}
                        </h4>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {folder.application_no}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <User className="w-3.5 h-3.5" /> เจ้าของ:
                      </span>
                      <span className="font-bold text-slate-800 truncate ml-2">
                        {folder.owner_name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> ที่ตั้ง:
                      </span>
                      <span className="text-slate-700 truncate ml-2">{folder.location}</span>
                    </div>
                  </div>

                  {/* Document Summary Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-bold">
                      ✅ ผ่าน {folder.approved_count}
                    </span>
                    {folder.under_review_count > 0 && (
                      <span className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-md font-bold animate-pulse">
                        ⏳ รอตรวจ {folder.under_review_count}
                      </span>
                    )}
                    {folder.missing_count > 0 && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-md font-medium">
                        ขาด {folder.missing_count}
                      </span>
                    )}
                  </div>

                  {/* Completion Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-500">
                      <span>ความสมบูรณ์</span>
                      <span
                        className={
                          folder.completion_pct === 100
                            ? 'text-emerald-600'
                            : folder.completion_pct >= 50
                            ? 'text-amber-600'
                            : 'text-rose-600'
                        }
                      >
                        {folder.completion_pct}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          folder.completion_pct === 100
                            ? 'bg-emerald-500'
                            : folder.completion_pct >= 50
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${folder.completion_pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Open Folder Button */}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveFolder(folder)}
                  leftIcon={<FolderOpen className="w-4 h-4" />}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-xs group-hover:shadow-md"
                >
                  📂 เปิดแฟ้มเอกสารร้านนี้
                </Button>
              </Card>
            ))}
          </div>

          {filteredFolders.length === 0 && !isLoading && (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3 shadow-xs">
              <FolderOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-800">ไม่พบแฟ้มเอกสารที่ตรงกับคำค้นหา</p>
              <p className="text-xs text-slate-400">ลองเปลี่ยนคำค้นหา หรือเลือกตัวกรองสถานะใหม่</p>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: PREVIEW & VERIFY DOCUMENT MODAL                                   */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {previewDoc && (
        <Modal
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title={`ตรวจสอบเอกสาร: ${previewDoc.title_th}`}
          description={`สถานประกอบการ: ${previewDoc.business_name} (${previewDoc.application_no})`}
          size="lg"
        >
          <div className="space-y-5">
            {/* Mock Document Viewer Frame */}
            <div className="h-64 sm:h-80 bg-slate-100 rounded-2xl border border-slate-200 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden shadow-inner">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-md border border-slate-200 flex items-center justify-center text-gov-700 mb-3">
                <FileText className="w-8 h-8" />
              </div>
              <p className="font-bold text-sm text-slate-800">{previewDoc.file_name || `${previewDoc.document_type}.pdf`}</p>
              <p className="text-xs text-slate-500 mt-1">ขนาดไฟล์: {previewDoc.file_size_kb || 250} KB • รูปแบบ PDF Document</p>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => success('เปิดไฟล์ตัวอย่างเรียบร้อย', previewDoc.title_th)}
                  leftIcon={<Eye className="w-4 h-4" />}
                  className="text-xs bg-gov-700"
                >
                  เปิดดูเอกสารฉบับเต็ม
                </Button>
              </div>
            </div>

            {/* Verification Form */}
            <form onSubmit={handleVerifySubmit} className="space-y-4 pt-2 border-t border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">ผลการตรวจสอบเอกสาร:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewAction('APPROVED')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      reviewAction === 'APPROVED'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    อนุมัติเอกสาร (ถูกต้อง)
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewAction('REJECTED')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      reviewAction === 'REJECTED'
                        ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    แจ้งแก้ไข (ไม่ถูกต้อง)
                  </button>
                </div>
              </div>

              {reviewAction === 'REJECTED' && (
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    เหตุผลและข้อความที่ต้องการแจ้งผู้ประกอบการแก้ไข:
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={rejectionNotes}
                    onChange={(e) => setRejectionNotes(e.target.value)}
                    placeholder="เช่น ภาพถ่ายแผนผังไม่ชัดเจน กรุณาถ่ายใหม่พร้อมระบุจุดจัดเก็บอาหาร"
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" size="sm" onClick={() => setPreviewDoc(null)}>
                  ปิด
                </Button>
                <Button
                  type="submit"
                  variant={reviewAction === 'APPROVED' ? 'primary' : 'danger'}
                  size="sm"
                  className="font-bold"
                >
                  บันทึกผลการตรวจสอบ
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: UPLOAD DOCUMENT INTO ACTIVE FOLDER                                */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {isUploadModalOpen && activeFolder && (
        <Modal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          title={`อัปโหลดเอกสารใหม่เข้าแฟ้ม: ${activeFolder.name}`}
          description="บันทึกเอกสารหลักฐานเพิ่มเติมลงในแฟ้มของสถานประกอบการนี้"
          size="md"
        >
          <form onSubmit={handleUploadNewDoc} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">ประเภทเอกสาร:</label>
              <select
                value={uploadData.doc_type}
                onChange={(e) => {
                  const val = e.target.value;
                  const titles: Record<string, string> = {
                    ID_CARD: 'สำเนาบัตรประชาชนผู้ขอรับใบอนุญาต',
                    HOUSE_REG: 'สำเนาทะเบียนบ้านสถานประกอบการ',
                    FLOOR_PLAN: 'แผนผังและภาพถ่ายสถานที่สะสมอาหาร',
                    MEDICAL_CERT: 'ใบรับรองแพทย์และวุฒิบัตรผู้สัมผัสอาหาร',
                    TRAINING_CERT: 'หนังสือรับรองการผ่านการอบรมผู้ประกอบกิจการ',
                    OTHER: 'เอกสารหลักฐานประกอบอื่นๆ',
                  };
                  setUploadData({
                    ...uploadData,
                    doc_type: val,
                    title_th: titles[val] || 'เอกสารประกอบ',
                  });
                }}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              >
                <option value="FLOOR_PLAN">แผนผังและภาพถ่ายสถานที่สะสมอาหาร</option>
                <option value="MEDICAL_CERT">ใบรับรองแพทย์และวุฒิบัตรผู้สัมผัสอาหาร</option>
                <option value="ID_CARD">สำเนาบัตรประชาชนผู้ขอรับใบอนุญาต</option>
                <option value="HOUSE_REG">สำเนาทะเบียนบ้านสถานประกอบการ</option>
                <option value="TRAINING_CERT">หนังสือรับรองการผ่านการอบรมผู้ประกอบกิจการ</option>
                <option value="OTHER">เอกสารหลักฐานประกอบอื่นๆ</option>
              </select>
            </div>

            <Input
              label="ชื่อเรียกเอกสาร (ภาษาไทย):"
              required
              value={uploadData.title_th}
              onChange={(e) => setUploadData({ ...uploadData, title_th: e.target.value })}
            />

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">เลือกไฟล์เอกสาร (PDF หรือ รูปภาพ):</label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setUploadData({ ...uploadData, file_name: file.name });
                  }
                }}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 cursor-pointer border border-slate-300 rounded-xl p-2 bg-slate-50"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsUploadModalOpen(false)}>
                ยกเลิก
              </Button>
              <Button type="submit" variant="primary" size="sm" leftIcon={<Upload className="w-4 h-4" />}>
                บันทึกเข้าแฟ้มร้าน
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
