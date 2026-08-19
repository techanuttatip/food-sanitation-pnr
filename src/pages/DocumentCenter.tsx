import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';
import { formatThaiDate } from '../lib/utils';
import { documentService } from '../services/documentService';
import type { ApplicationDocument, DocumentStatus } from '../types';
import {
  FolderOpen,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Download,
  Eye,
  Clock,
  Building2,
  ExternalLink,
  Sparkles,
  FileCheck,
  Trash2,
} from 'lucide-react';

interface DocItem extends ApplicationDocument {
  application_no?: string;
  business_name?: string;
  file_name?: string;
  file_size_kb?: number;
}

export const DocumentCenter: React.FC = () => {
  const { success, error } = useToast();
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Review Modal State
  const [selectedDoc, setSelectedDoc] = useState<DocItem | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [rejectionNotes, setRejectionNotes] = useState('');

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const docs = await documentService.getAllApplicationDocuments();
      setDocuments(docs);
    } catch (err: any) {
      console.warn('Load docs notice:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc) return;

    try {
      await documentService.verifyDocument(
        selectedDoc.id,
        reviewAction,
        reviewAction === 'REJECTED' ? rejectionNotes : undefined
      );

      setDocuments((prev) =>
        prev.map((d) =>
          d.id === selectedDoc.id
            ? { ...d, status: reviewAction, rejection_reason: reviewAction === 'REJECTED' ? rejectionNotes : undefined }
            : d
        )
      );

      setSelectedDoc(null);
      setRejectionNotes('');
      success(
        reviewAction === 'APPROVED' ? 'อนุมัติเอกสารแล้ว' : 'ส่งข้อความแจ้งแก้ไขเอกสารแล้ว',
        `เอกสาร: ${selectedDoc.title_th}`
      );
    } catch (err: any) {
      error('เกิดข้อผิดพลาดในการตรวจสอบเอกสาร', err.message);
    }
  };

  const handleDeleteDoc = (id: string, name: string) => {
    if (window.confirm(`ต้องการลบเอกสาร "${name}" หรือไม่?`)) {
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      success('ลบเอกสารแล้ว', name);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchSearch =
      (doc.business_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (doc.application_no || '').toLowerCase().includes(search.toLowerCase()) ||
      (doc.title_th || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || doc.status === statusFilter;
    const matchType = !typeFilter || doc.document_type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const stats = {
    total: documents.length,
    approved: documents.filter((d) => d.status === 'APPROVED').length,
    underReview: documents.filter((d) => d.status === 'UNDER_REVIEW').length,
    rejected: documents.filter((d) => d.status === 'REJECTED').length,
    missing: documents.filter((d) => d.status === 'MISSING').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-gov-700" />
            ศูนย์จัดการเอกสารสาธารณสุข (Document Repository)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            งานสาธารณสุข อบต.โป่งน้ำร้อน • รวมเอกสารประกอบคำขอรับใบอนุญาตทั้งหมดที่เชื่อมต่อกับระบบ
          </p>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-emerald-600">อนุมัติแล้ว</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5 font-mono">{stats.approved} <span className="text-xs text-slate-400 font-normal">ฉบับ</span></p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-sky-600">รอตรวจสอบ</p>
            <p className="text-2xl font-black text-sky-600 mt-0.5 font-mono">{stats.underReview} <span className="text-xs text-slate-400 font-normal">ฉบับ</span></p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-rose-600">ส่งกลับแก้ไข</p>
            <p className="text-2xl font-black text-rose-600 mt-0.5 font-mono">{stats.rejected} <span className="text-xs text-slate-400 font-normal">ฉบับ</span></p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500">เอกสารทั้งหมด</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5 font-mono">{stats.total} <span className="text-xs text-slate-400 font-normal">ฉบับ</span></p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-white shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="ค้นหาชื่อร้าน, เลขที่คำขอ, หรือชื่อเอกสาร..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'ทุกสถานะเอกสาร' },
              { value: 'APPROVED', label: 'อนุมัติแล้ว (Approved)' },
              { value: 'UNDER_REVIEW', label: 'รอตรวจสอบ (Under Review)' },
              { value: 'REJECTED', label: 'ส่งกลับแก้ไข (Rejected)' },
              { value: 'MISSING', label: 'ยังไม่ส่ง (Missing)' },
            ]}
          />
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { value: '', label: 'ทุกประเภทเอกสาร' },
              { value: 'ID_CARD', label: 'สำเนาบัตรประชาชน' },
              { value: 'HOUSE_REG', label: 'สำเนาทะเบียนบ้าน' },
              { value: 'FLOOR_PLAN', label: 'แผนผังสถานที่' },
              { value: 'MEDICAL_CERT', label: 'ใบรับรองแพทย์ผู้สัมผัสอาหาร' },
            ]}
          />
        </div>
      </Card>

      {/* Document Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => {
          const statusThemeMap: Record<string, { bg: string; label: string; icon: any }> = {
            APPROVED: { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', label: 'อนุมัติแล้ว', icon: CheckCircle2 },
            UNDER_REVIEW: { bg: 'bg-sky-50 text-sky-800 border-sky-200', label: 'รอตรวจสอบ', icon: Clock },
            REJECTED: { bg: 'bg-rose-50 text-rose-800 border-rose-200', label: 'ส่งกลับแก้ไข', icon: XCircle },
            MISSING: { bg: 'bg-slate-100 text-slate-600 border-slate-200', label: 'ยังไม่ส่งเอกสาร', icon: AlertCircle },
            UPLOADED: { bg: 'bg-blue-50 text-blue-800 border-blue-200', label: 'อัปโหลดแล้ว', icon: FileCheck },
            EXPIRED: { bg: 'bg-slate-100 text-slate-600 border-slate-200', label: 'หมดอายุ', icon: AlertCircle },
          };

          const statusTheme = statusThemeMap[doc.status] || { bg: 'bg-slate-100 text-slate-600 border-slate-200', label: doc.status, icon: AlertCircle };
          const StatusIcon = statusTheme.icon;

          return (
            <Card
              key={doc.id}
              className="border border-slate-200 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden bg-white"
            >
              <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gov-50 text-gov-700 flex items-center justify-center shrink-0 border border-gov-100">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border ${statusTheme.bg}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {statusTheme.label}
                  </span>
                </div>

                {/* Doc Name & Business */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{doc.title_th}</h3>
                  <p className="text-xs font-semibold text-emerald-800 mt-1 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {doc.business_name}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                    คำขอ: {doc.application_no}
                  </p>
                </div>

                {/* File info */}
                {doc.file_name ? (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-700 font-medium">
                      <span className="truncate max-w-[180px] font-mono text-[11px]">{doc.file_name}</span>
                      <span className="text-[10px] text-slate-400">{doc.file_size_kb || 250} KB</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-[11px] text-amber-800">
                    ⚠️ ผู้ประกอบการยังไม่ได้แนบไฟล์เอกสารนี้
                  </div>
                )}

                {/* Rejection notice */}
                {doc.rejection_reason && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-800">
                    <strong>ข้อบกพร่อง:</strong> {doc.rejection_reason}
                  </div>
                )}
              </div>

              {/* Bottom Action Footer */}
              <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSelectedDoc(doc);
                    setReviewAction(doc.status === 'APPROVED' ? 'APPROVED' : 'APPROVED');
                  }}
                  leftIcon={<Eye className="w-3.5 h-3.5" />}
                  className="text-xs flex-1 shadow-2xs"
                >
                  ตรวจสอบเอกสาร
                </Button>

                <button
                  type="button"
                  title="ลบรายการเอกสาร"
                  onClick={() => handleDeleteDoc(doc.id, doc.title_th)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredDocs.length === 0 && !isLoading && (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-base font-bold text-slate-800">ยังไม่มีเอกสารในระบบ</p>
          <p className="text-xs text-slate-400">เมื่อมีการเปิดคำขอรับใบอนุญาต เอกสารจะปรากฏในหน้านี้โดยอัตโนมัติ</p>
        </div>
      )}

      {/* Review Document Modal */}
      {selectedDoc && (
        <Modal
          isOpen={!!selectedDoc}
          onClose={() => setSelectedDoc(null)}
          title={`ตรวจสอบเอกสาร: ${selectedDoc.title_th}`}
          description={`คำขอ ${selectedDoc.application_no} • ร้าน ${selectedDoc.business_name}`}
          size="md"
        >
          <form onSubmit={handleVerifySubmit} className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">สถานประกอบการ:</span>
                <span className="font-bold text-slate-900">{selectedDoc.business_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ประเภทเอกสาร:</span>
                <span className="font-semibold text-gov-800">{selectedDoc.title_th}</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                ผลการพิจารณาตรวจสอบเอกสาร:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReviewAction('APPROVED')}
                  className={`p-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all ${
                    reviewAction === 'APPROVED'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  อนุมัติเอกสาร (ผ่าน)
                </button>
                <button
                  type="button"
                  onClick={() => setReviewAction('REJECTED')}
                  className={`p-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all ${
                    reviewAction === 'REJECTED'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  ส่งกลับแก้ไข (ไม่ผ่าน)
                </button>
              </div>
            </div>

            {reviewAction === 'REJECTED' && (
              <div className="space-y-1 animate-in fade-in">
                <label className="block font-bold text-rose-900">
                  ระบุข้อบกพร่องที่ต้องแก้ไข (ส่งแจ้งเตือนผ่าน LINE อัตโนมัติ):
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs text-slate-900 focus:ring-2 focus:ring-rose-500"
                  placeholder="เช่น ภาพถ่ายแผนผังไม่ชัดเจน หรือใบรับรองแพทย์หมดอายุ กรุณาส่งฉบับปัจจุบัน..."
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="secondary" size="sm" onClick={() => setSelectedDoc(null)}>
                ยกเลิก
              </Button>
              <Button type="submit" variant="primary" size="sm" leftIcon={<CheckCircle2 className="w-4 h-4" />}>
                บันทึกผลการตรวจเอกสาร
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
