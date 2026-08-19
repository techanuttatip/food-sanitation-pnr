import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ApplicationStatusPill, DocumentStatusPill } from '../components/ui/StatusPill';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { applicationService } from '../services/applicationService';
import { documentService } from '../services/documentService';
import { businessService } from '../services/businessService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import type { Application, ApplicationStatus, ApplicationType, DocumentStatus, Business } from '../types';
import { formatThaiDate, formatCurrency } from '../lib/utils';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Calendar,
  FileCheck,
  Building,
  CreditCard,
  Stamp,
  Award,
  Plus,
  Search,
  ArrowRight,
  Eye,
  FileText,
  XCircle,
  Trash2,
  Store,
  Sparkles,
  MessageSquare,
  HelpCircle,
  QrCode,
  ExternalLink,
  Send,
  Info,
  Printer,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { lineService } from '../services/lineService';
import { licenseService } from '../services/licenseService';
import { formatNationalId } from '../lib/utils';

const WORKFLOW_STEPS = [
  { id: 1, label: '1. ยื่นคำขอ', statusKey: 'SUBMITTED', icon: FileSpreadsheet },
  { id: 2, label: '2. ตรวจเอกสาร', statusKey: 'DOCUMENT_REVIEW', icon: FileCheck },
  { id: 3, label: '3. นัดตรวจสุขาภิบาล', statusKey: 'APPOINTMENT_SCHEDULED', icon: Calendar },
  { id: 4, label: '4. ตรวจสถานที่', statusKey: 'INSPECTION_IN_PROGRESS', icon: Building },
  { id: 5, label: '5. ชำระค่าธรรมเนียม', statusKey: 'PAYMENT_PENDING', icon: CreditCard },
  { id: 6, label: '6. พิจารณาอนุมัติ', statusKey: 'APPROVAL_PENDING', icon: Stamp },
  { id: 7, label: '7. ออกใบอนุญาต', statusKey: 'LICENSE_ISSUED', icon: Award },
];

export const ApplicationWorkflow: React.FC<{ onNavigateToInspections?: () => void }> = ({
  onNavigateToInspections,
}) => {
  const { hasRole } = useAuth();
  const { success, error } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trackingSearch, setTrackingSearch] = useState('');

  // Create Application Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createBusinessId, setCreateBusinessId] = useState('');
  const [createAppType, setCreateAppType] = useState<ApplicationType>('NEW_LICENSE');

  // Quick Business Form (if no business exists yet)
  const [quickBizName, setQuickBizName] = useState('');
  const [quickOwnerName, setQuickOwnerName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickMoo, setQuickMoo] = useState('1');

  // Review Document Modal inside Workflow
  const [reviewingDoc, setReviewingDoc] = useState<{ id: string; title: string; status: DocumentStatus; reason?: string } | null>(null);
  const [docRejectionReason, setDocRejectionReason] = useState('');

  // Certificate Modal State
  const [isCertOpen, setIsCertOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [apps, bizList] = await Promise.all([
        applicationService.getApplications(),
        businessService.getBusinesses(),
      ]);
      setApplications(apps);
      setBusinesses(bizList);

      if (bizList.length > 0 && !createBusinessId) {
        setCreateBusinessId(bizList[0].id);
      }
      // Do not auto-select application until user clicks
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTrackingSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingSearch.trim()) {
      loadData();
      return;
    }
    setIsLoading(true);
    try {
      const found = await applicationService.getApplicationByTrackingCode(trackingSearch);
      if (found) {
        setApplications([found]);
        setSelectedApp(found);
        success('ค้นพบคำขอในระบบ', `เลขที่คำขอ: ${found.application_no}`);
      } else {
        error('ไม่พบคำขอ', `ไม่พบรหัสติดตาม "${trackingSearch}" ในระบบ`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewApplication = async (e: React.FormEvent) => {
    e.preventDefault();

    if (businesses.length === 0 && !quickBizName.trim()) {
      error('กรุณาระบุชื่อสถานที่สะสมอาหาร', '');
      return;
    }

    try {
      const newApp = await applicationService.createApplication({
        business_id: createBusinessId,
        application_type: createAppType,
        quickBusiness:
          businesses.length === 0
            ? {
                name: quickBizName,
                business_type: 'สถานที่สะสมอาหาร',
                owner_name: quickOwnerName || 'ผู้ประกอบการ',
                phone_number: quickPhone || '081-0000000',
                moo: quickMoo,
              }
            : undefined,
      });

      setIsCreateOpen(false);
      setQuickBizName('');
      setQuickOwnerName('');
      setQuickPhone('');
      success('สร้างคำขอใหม่สำเร็จ', `ออกเลขที่คำขอ: ${newApp.application_no} (Tracking: ${newApp.tracking_code})`);
      await loadData();
      setSelectedApp(newApp);
    } catch (err: any) {
      error('สร้างคำขอไม่สำเร็จ', err.message);
    }
  };

  const handleDeleteApplication = async (id: string, appNo: string) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบคำขอ "${appNo}" ออกจากระบบ?`)) {
      return;
    }

    try {
      await applicationService.deleteApplication(id);
      success('ลบคำขอสำเร็จ', `ลบคำขอ ${appNo} ออกจากระบบแล้ว`);
      await loadData();
    } catch (err: any) {
      error('เกิดข้อผิดพลาดในการลบคำขอ', err.message);
    }
  };

  const handleAdvanceWorkflow = async (nextStatus: ApplicationStatus) => {
    if (!selectedApp) return;
    try {
      await applicationService.updateApplicationStatus(selectedApp.id, nextStatus);
      success('อัปเดตขั้นตอน Workflow สำเร็จ', `ปรับสถานะเป็น ${nextStatus}`);
      await loadData();
      const updated = await applicationService.getApplicationById(selectedApp.id);
      if (updated) setSelectedApp(updated);
    } catch (err: any) {
      error('ไม่สามารถเปลี่ยนสถานะได้', err.message);
    }
  };

  const handleVerifyDocument = async (newStatus: DocumentStatus) => {
    if (!reviewingDoc || !selectedApp) return;

    try {
      await documentService.verifyDocument(
        reviewingDoc.id,
        newStatus,
        newStatus === 'REJECTED' ? docRejectionReason : undefined
      );

      // Refresh documents
      if (selectedApp.documents) {
        const idx = selectedApp.documents.findIndex((d) => d.id === reviewingDoc.id);
        if (idx !== -1) {
          selectedApp.documents[idx].status = newStatus;
          selectedApp.documents[idx].rejection_reason =
            newStatus === 'REJECTED' ? docRejectionReason : undefined;
        }
      }

      setReviewingDoc(null);
      setDocRejectionReason('');
      success(
        newStatus === 'APPROVED' ? 'อนุมัติเอกสารแล้ว' : 'ส่งแจ้งเตือนแก้ไขเอกสารแล้ว',
        `เอกสาร: ${reviewingDoc.title}`
      );
    } catch (err: any) {
      error('ตรวจสอบเอกสารไม่สำเร็จ', err.message);
    }
  };

  // Determine active step index
  const getStepIndex = (status: ApplicationStatus): number => {
    switch (status) {
      case 'DRAFT':
      case 'SUBMITTED':
        return 1;
      case 'DOCUMENT_REVIEW':
      case 'DOCUMENT_INCOMPLETE':
      case 'DOCUMENT_APPROVED':
        return 2;
      case 'APPOINTMENT_SCHEDULED':
        return 3;
      case 'INSPECTION_IN_PROGRESS':
      case 'INSPECTION_PASSED':
      case 'INSPECTION_FAILED':
        return 4;
      case 'PAYMENT_PENDING':
      case 'PAYMENT_VERIFIED':
        return 5;
      case 'APPROVAL_PENDING':
        return 6;
      case 'LICENSE_ISSUED':
        return 7;
      default:
        return 1;
    }
  };

  const currentStep = selectedApp ? getStepIndex(selectedApp.status) : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-gov-700" />
            ระบบคำขอใบอนุญาตและ Workflow (Application Engine)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            งานสาธารณสุข อบต.โป่งน้ำร้อน • กระบวนการ 7 ขั้นตอน ตั้งแต่ยื่นคำขอ ตรวจเอกสาร นัดตรวจสุขาภิบาล ค่าธรรมเนียม จนถึงออกใบอนุญาต
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setIsCreateOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-md"
        >
          + สร้างคำขอรับใบอนุญาตใหม่
        </Button>
      </div>

      {/* Tracking Search Strip */}
      <Card className="p-3.5 bg-white shadow-2xs">
        <form onSubmit={handleTrackingSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="ค้นหาด้วย Tracking Code หรือเลขที่คำขอ (เช่น TRK-2569-XXXX, APP-2569-XXXX)..."
              value={trackingSearch}
              onChange={(e) => setTrackingSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              className="pr-10"
            />
          </div>
          <Button type="submit" variant="secondary" size="md">
            ค้นหาคำขอ
          </Button>
        </form>
      </Card>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Applications List (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700">
              รายการคำขอในระบบ ({applications.length})
            </span>
          </div>

          <div className="space-y-2.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {applications.map((app) => {
              const isSelected = selectedApp?.id === app.id;
              return (
                <div
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden bg-white shadow-2xs ${
                    isSelected
                      ? 'border-gov-600 bg-gov-50/40 ring-2 ring-gov-600/20'
                      : 'border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-gov-800">
                        {app.application_no}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight mt-0.5">
                        {app.business?.name || 'สถานประกอบการ'}
                      </h4>
                    </div>
                    <ApplicationStatusPill status={app.status} />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2.5 border-t border-slate-100">
                    <span className="font-mono text-[11px]">Tracking: {app.tracking_code}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px]">{formatThaiDate(app.created_at, { shortMonth: true })}</span>
                      <button
                        type="button"
                        title="ลบคำขอนี้"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteApplication(app.id, app.application_no);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {applications.length === 0 && !isLoading && (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
                <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-800">ยังไม่มีรายการคำขอในระบบ</p>
                <p className="text-xs text-slate-400">กดปุ่มสร้างคำขอด้านบนเพื่อเปิดคำขอแรก</p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsCreateOpen(true)}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  + สร้างคำขอแรก
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Workflow Detail & Interactive Stepper (7 Cols) */}
        <div className="lg:col-span-7">
          {selectedApp ? (
            <Card className="p-6 space-y-6 bg-white shadow-2xs border border-slate-200">
              {/* Top Summary Banner */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-black text-gov-800">
                      {selectedApp.application_no}
                    </span>
                    <ApplicationStatusPill status={selectedApp.status} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">
                    {selectedApp.business?.name || 'สถานประกอบการ'}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Tracking Code: <strong className="text-slate-800">{selectedApp.tracking_code}</strong>
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-right shrink-0">
                  <div className="flex items-center justify-end gap-1 text-[11px] text-slate-500 font-semibold">
                    <Info className="w-3 h-3 text-amber-500" />
                    <span>ค่าธรรมเนียมประเมิน</span>
                  </div>
                  <span className="text-lg font-black text-gov-800 font-mono block mt-0.5">
                    {formatCurrency(selectedApp.fee_amount || 3750)}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                    (พื้นที่ {selectedApp.business?.area_sqm || 250} ตร.ม. × 15 บาท/ตร.ม.)
                  </p>
                </div>
              </div>

              {/* LINE Connection & Tracking Card for this specific Store */}
              <div className="p-4 rounded-2xl bg-linear-to-r from-emerald-950 via-slate-900 to-slate-900 text-white border border-emerald-800/60 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="p-2 bg-white rounded-xl shadow-xs shrink-0">
                    <QRCodeSVG
                      value={`https://line.me/R/ti/p/@634eafmr?app=${selectedApp.application_no}`}
                      size={58}
                    />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                        LINE Official Account
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">@634eafmr</span>
                    </div>
                    <h4 className="text-xs font-bold text-white">
                      ให้ร้านสแกนเพื่อติดตามคำขอ & รับแจ้งเตือนผ่าน LINE
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      ร้านจะได้รับการแจ้งเตือนผลตรวจ, นัดหมาย, และ QR ชำระเงินตรงในมือถือ
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={async () => {
                      try {
                        await lineService.sendFlexMessage({
                          business_id: selectedApp.business_id || 'b-001',
                          business_name: selectedApp.business?.name || 'สถานประกอบการ',
                          recipient_name: 'ผู้ประกอบการ',
                          event_type: 'APPOINTMENT',
                          title: `อัปเดตสถานะคำขอ: ${selectedApp.application_no}`,
                          message_preview: `คำขอของร้าน ${selectedApp.business?.name} อยู่ในขั้นตอน ${selectedApp.status}`,
                        });
                        success('ส่งข้อความ LINE แจ้งเตือนสำเร็จ', `ส่งข้อความอัปเดตคำขอ ${selectedApp.application_no} ไปยัง LINE OA เรียบร้อยแล้ว`);
                      } catch (err: any) {
                        error('ส่งข้อความไม่สำเร็จ', err.message);
                      }
                    }}
                    leftIcon={<Send className="w-3.5 h-3.5" />}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex-1 sm:flex-initial"
                  >
                    ส่งแจ้งเตือนเข้า LINE
                  </Button>
                </div>
              </div>

              {/* 7-Step Interactive Stepper Strip */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  ขั้นตอนกระบวนการ (7 Workflow Stages)
                </h4>
                <div className="grid grid-cols-7 gap-1 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                  {WORKFLOW_STEPS.map((step) => {
                    const isPassed = step.id < currentStep;
                    const isCurrent = step.id === currentStep;

                    return (
                      <div
                        key={step.id}
                        className={`flex flex-col items-center text-center p-1.5 rounded-xl transition-all ${
                          isCurrent
                            ? 'bg-gov-700 text-white shadow-sm ring-2 ring-gov-600'
                            : isPassed
                            ? 'text-emerald-700'
                            : 'text-slate-400'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                            isCurrent
                              ? 'bg-amber-400 text-slate-950 font-black'
                              : isPassed
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {isPassed ? '✓' : step.id}
                        </div>
                        <span className="text-[10px] font-bold leading-tight line-clamp-1">{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Controls based on Current Status */}
              <div className="p-4 bg-gov-50/70 border border-gov-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gov-900">
                    การดำเนินการในขั้นตอนนี้:
                  </span>
                  <span className="text-xs text-gov-700 font-semibold">
                    สถานะ: {selectedApp.status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedApp.status === 'SUBMITTED' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAdvanceWorkflow('DOCUMENT_REVIEW')}
                      leftIcon={<FileCheck className="w-4 h-4" />}
                    >
                      เริ่มตรวจเอกสารประกอบคำขอ
                    </Button>
                  )}

                  {selectedApp.status === 'DOCUMENT_REVIEW' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAdvanceWorkflow('APPOINTMENT_SCHEDULED')}
                      leftIcon={<Calendar className="w-4 h-4" />}
                    >
                      เอกสารครบถ้วน ➔ ไปขั้นตอนนัดตรวจสุขาภิบาล
                    </Button>
                  )}

                  {selectedApp.status === 'APPOINTMENT_SCHEDULED' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAdvanceWorkflow('INSPECTION_IN_PROGRESS')}
                      leftIcon={<Building className="w-4 h-4" />}
                    >
                      ลงพื้นที่ตรวจสุขาภิบาล (10 ข้อมาตรฐาน)
                    </Button>
                  )}

                  {selectedApp.status === 'INSPECTION_IN_PROGRESS' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAdvanceWorkflow('PAYMENT_PENDING')}
                      leftIcon={<CreditCard className="w-4 h-4" />}
                    >
                      ตรวจผ่านเกณฑ์ ➔ ออกใบแจ้งชำระค่าธรรมเนียม
                    </Button>
                  )}

                  {selectedApp.status === 'PAYMENT_PENDING' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAdvanceWorkflow('APPROVAL_PENDING')}
                      leftIcon={<Stamp className="w-4 h-4" />}
                    >
                      ชำระเงินเรียบร้อย ➔ ส่งนายก อบต. ลงนาม
                    </Button>
                  )}

                  {selectedApp.status === 'APPROVAL_PENDING' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAdvanceWorkflow('LICENSE_ISSUED')}
                      leftIcon={<Award className="w-4 h-4" />}
                    >
                      นายก อบต. ลงนามแล้ว ➔ ออกใบอนุญาตฉบับจริง
                    </Button>
                  )}

                  {selectedApp.status === 'LICENSE_ISSUED' && (
                    <div className="flex flex-wrap items-center gap-2.5 w-full">
                      <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs bg-emerald-100/80 px-3 py-1.5 rounded-xl border border-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span>กระบวนการเสร็จสมบูรณ์: ออกใบอนุญาตเรียบร้อยแล้ว</span>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setIsCertOpen(true)}
                        leftIcon={<Printer className="w-4 h-4" />}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md text-xs"
                      >
                        🖨️ ดูและพิมพ์ใบอนุญาตฉบับจริง (ตราครุฑ อบต.โป่งน้ำร้อน)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            await lineService.sendFlexMessage({
                              business_id: selectedApp.business_id || 'b-001',
                              business_name: selectedApp.business?.name || 'สถานประกอบการ',
                              recipient_name: 'ผู้ประกอบการ',
                              event_type: 'LICENSE_ISSUED',
                              title: `ใบอนุญาตจัดตั้งสถานที่สะสมอาหาร ออกเรียบร้อยแล้ว`,
                              message_preview: `ใบอนุญาตเล่มที่ 01 เลขที่ สส. 01/2569 ของร้าน ${selectedApp.business?.name} พร้อมดาวน์โหลดแล้ว`,
                            });
                            success('ส่งใบอนุญาตเข้า LINE สำเร็จ', 'ส่งไฟล์ใบอนุญาตดิจิทัลให้ผู้ประกอบการเรียบร้อย');
                          } catch (err: any) {
                            error('ส่งข้อความไม่สำเร็จ', err.message);
                          }
                        }}
                        leftIcon={<Send className="w-3.5 h-3.5 text-emerald-600" />}
                        className="text-xs"
                      >
                        📲 ส่งใบอนุญาตเข้า LINE ร้าน
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Document Checklist Table in Application */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800">
                    รายการเอกสารประกอบคำขอ ({selectedApp.documents?.length || 4} รายการ)
                  </h4>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                  {(selectedApp.documents || [
                    { id: '1', title_th: 'สำเนาบัตรประชาชนผู้ขอรับใบอนุญาต', status: 'APPROVED' },
                    { id: '2', title_th: 'สำเนาทะเบียนบ้านสถานประกอบการ', status: 'APPROVED' },
                    { id: '3', title_th: 'แผนผังและภาพถ่ายสถานที่สะสมอาหาร', status: 'UNDER_REVIEW' },
                    { id: '4', title_th: 'ใบรับรองแพทย์ผู้สัมผัสอาหาร', status: 'MISSING' },
                  ]).map((doc: any) => (
                    <div key={doc.id} className="p-3 flex items-center justify-between bg-white hover:bg-slate-50">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="font-semibold text-slate-800">{doc.title_th}</p>
                          {doc.rejection_reason && (
                            <p className="text-[11px] text-rose-600 mt-0.5">⚠️ เหตุผล: {doc.rejection_reason}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DocumentStatusPill status={doc.status} />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReviewingDoc({ id: doc.id, title: doc.title_th, status: doc.status })}
                          className="text-xs py-1 px-2.5"
                        >
                          ตรวจ
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-500 space-y-4 shadow-2xs">
              <div className="w-16 h-16 rounded-2xl bg-gov-50 text-gov-700 mx-auto flex items-center justify-center border border-gov-100">
                <Store className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-800">
                  👈 กรุณาคลิกเลือกชื่อร้าน / คำขอจากรายการทางด้านซ้าย
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  คลิกที่การ์ดคำขอ (เช่น <strong>บ้านส้มตำ ยำ20</strong>) เพื่อเริ่มต้นตรวจสอบเอกสาร, นัดตรวจสุขาภิบาล, และดูขั้นตอน Workflow
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Application Modal */}
      {isCreateOpen && (
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="สร้างคำขอรับใบอนุญาตสถานที่สะสมอาหารใหม่"
          description="เลือกสถานที่สะสมอาหารที่มีอยู่ในระบบ หรือกรอกข้อมูลใหม่เพื่อเปิดคำขอ"
          size="md"
        >
          <form onSubmit={handleCreateNewApplication} className="space-y-4 text-xs">
            {businesses.length > 0 ? (
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  เลือกสถานประกอบการที่ลงทะเบียนไว้: *
                </label>
                <select
                  required
                  value={createBusinessId}
                  onChange={(e) => setCreateBusinessId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-semibold text-xs focus:ring-2 focus:ring-gov-500"
                >
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      🏪 {b.name} ({b.business_code}) - ม.{b.location?.moo || '1'} {b.location?.village_name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>ยังไม่มีร้านค้าในระบบ — กรอกข้อมูลเพื่อสร้างสถานที่และเปิดคำขอทันที:</span>
                </div>

                <Input
                  label="ชื่อสถานที่สะสมอาหาร / กิจการ"
                  required
                  value={quickBizName}
                  onChange={(e) => setQuickBizName(e.target.value)}
                  placeholder="เช่น คลังอาหารแช่เย็น โป่งน้ำร้อน"
                />

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="ชื่อผู้ประกอบการ"
                    required
                    value={quickOwnerName}
                    onChange={(e) => setQuickOwnerName(e.target.value)}
                    placeholder="นายสมชาย ใจดีงาม"
                  />
                  <Input
                    label="เบอร์โทรศัพท์"
                    required
                    value={quickPhone}
                    onChange={(e) => setQuickPhone(e.target.value)}
                    placeholder="08X-XXX-XXXX"
                  />
                </div>

                <Input
                  label="หมู่ที่ (ในตำบลโป่งน้ำร้อน)"
                  value={quickMoo}
                  onChange={(e) => setQuickMoo(e.target.value)}
                  placeholder="1"
                />
              </div>
            )}

            <Select
              label="ประเภทคำขอ"
              value={createAppType}
              onChange={(e) => setCreateAppType(e.target.value as ApplicationType)}
              options={[
                { value: 'NEW_LICENSE', label: 'ขอรับใบอนุญาตใหม่ (NEW_LICENSE)' },
                { value: 'RENEWAL', label: 'ขอต่ออายุใบอนุญาต (RENEWAL)' },
                { value: 'TRANSFER', label: 'ขอโอนใบอนุญาต (TRANSFER)' },
                { value: 'MODIFICATION', label: 'ขอแก้ไขเปลี่ยนแปลงสถานที่/ประเภท (MODIFICATION)' },
              ]}
            />

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="font-bold text-slate-800 block">เอกสารที่ระบบจะสร้างให้อัตโนมัติ:</span>
              <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                <li>สำเนาบัตรประชาชนผู้ขอรับใบอนุญาต</li>
                <li>สำเนาทะเบียนบ้านสถานประกอบการ</li>
                <li>แผนผังและภาพถ่ายสถานที่สะสมอาหาร</li>
                <li>ใบรับรองแพทย์และวุฒิบัตรผู้สัมผัสอาหาร</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsCreateOpen(false)}>
                ยกเลิก
              </Button>
              <Button type="submit" variant="primary" size="sm" leftIcon={<CheckCircle2 className="w-4 h-4" />}>
                ยืนยันการสร้างคำขอ
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Review Document Inside Workflow Modal */}
      {reviewingDoc && (
        <Modal
          isOpen={!!reviewingDoc}
          onClose={() => setReviewingDoc(null)}
          title={`ตรวจสอบเอกสาร: ${reviewingDoc.title}`}
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block">สถานะปัจจุบัน:</span>
              <div className="mt-1">
                <DocumentStatusPill status={reviewingDoc.status} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-800">
                ระบุเหตุผลกรณีไม่ผ่าน (จะส่งแจ้งเตือนทาง LINE):
              </label>
              <textarea
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-gov-600 focus:outline-none"
                rows={3}
                placeholder="เช่น ภาพถ่ายแผนผังไม่ชัดเจน หรือใบรับรองแพทย์หมดอายุ..."
                value={docRejectionReason}
                onChange={(e) => setDocRejectionReason(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <Button variant="secondary" size="sm" onClick={() => setReviewingDoc(null)}>
                ปิด
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleVerifyDocument('REJECTED')}
                  leftIcon={<XCircle className="w-4 h-4" />}
                >
                  ไม่ผ่าน (แจ้งแก้ไข)
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleVerifyDocument('APPROVED')}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  อนุมัติเอกสาร
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Full Certificate Modal */}
      {isCertOpen && selectedApp && (
        <Modal
          isOpen={isCertOpen}
          onClose={() => setIsCertOpen(false)}
          title="ใบอนุญาตจัดตั้งสถานที่สะสมอาหาร (ฉบับพิมพ์จริง)"
          size="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-slate-500 font-mono">
                แบบพิมพ์มาตรฐาน: พ.ร.บ. สาธารณสุข ๒๕๓๕ • อบต.โป่งน้ำร้อน
              </span>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setIsCertOpen(false)}>
                  ปิดหน้าต่าง
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => window.print()}
                  leftIcon={<Printer className="w-4 h-4" />}
                  className="bg-gov-700 hover:bg-gov-800 font-bold shadow-md"
                >
                  สั่งพิมพ์ใบอนุญาต (Print Certificate)
                </Button>
              </div>
            </div>
          }
        >
          <div className="p-2 bg-linear-to-b from-amber-100 via-amber-50 to-amber-200 rounded-2xl border-4 border-amber-300 shadow-inner">
            <div className="bg-white p-8 sm:p-12 rounded-xl border border-amber-200 text-slate-900 space-y-6 font-sans">
              <div className="text-center space-y-2 border-b-2 border-slate-900 pb-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-linear-to-br from-gov-800 to-gov-950 flex items-center justify-center text-amber-300 shadow-lg mb-2">
                  <Award className="w-12 h-12" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wide">
                  องค์การบริหารส่วนตำบลโป่งน้ำร้อน อำเภอฝาง จังหวัดเชียงใหม่
                </h3>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  ใบอนุญาตจัดตั้งสถานที่สะสมอาหาร
                </h2>
                <p className="text-xs text-slate-600">
                  ออกตามความในพระราชบัญญัติการสาธารณสุข พ.ศ. ๒๕๓๕ และข้อบัญญัติองค์การบริหารส่วนตำบลโป่งน้ำร้อน
                </p>
                <div className="flex justify-between items-center text-xs font-bold pt-2 text-slate-800">
                  <span>เล่มที่ 01</span>
                  <span>เลขที่ใบอนุญาต: สส. 01/2569</span>
                </div>
              </div>

              <div className="space-y-4 text-sm leading-relaxed text-slate-800">
                <p className="indent-8">
                  ใบอนุญาตนี้ออกให้แก่{' '}
                  <strong className="text-base text-slate-950 underline decoration-dotted">
                    {selectedApp.business?.owner?.title_th || 'นาย'}{selectedApp.business?.owner?.first_name || 'ผู้ประกอบการ'} {selectedApp.business?.owner?.last_name || 'อบต.โป่งน้ำร้อน'}
                  </strong>{' '}
                  เลขประจำตัวประชาชน{' '}
                  <span className="font-mono font-bold">
                    {formatNationalId(selectedApp.business?.owner?.national_id || '1500400000000')}
                  </span>
                </p>

                <p className="indent-8">
                  เพื่อจัดตั้งสถานที่สะสมอาหาร ชื่อ{' '}
                  <strong className="text-base text-slate-950 underline decoration-dotted">
                    {selectedApp.business?.name}
                  </strong>{' '}
                  ประเภทกิจการ{' '}
                  <strong>{selectedApp.business?.business_type || 'ร้านอาหารและสถานที่สะสมอาหาร'}</strong> ({selectedApp.business?.food_category || 'อาหารทั่วไป'})
                  ขนาดพื้นที่ใช้สอย <strong>{selectedApp.business?.area_sqm || 250}</strong> ตารางเมตร
                </p>

                <p className="indent-8">
                  ตั้งอยู่ ณ เลขที่ {selectedApp.business?.location?.address_no || '123'} หมู่ที่{' '}
                  {selectedApp.business?.location?.moo || '1'}{' '}
                  {selectedApp.business?.location?.village_name || 'โป่งน้ำร้อน'} ตำบลโป่งน้ำร้อน อำเภอฝาง จังหวัดเชียงใหม่
                </p>

                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-950 font-medium">
                  ใบอนุญาตฉบับนี้มีผลบังคับใช้ตั้งแต่วันที่{' '}
                  <strong>{formatThaiDate(selectedApp.created_at)}</strong> ถึงวันที่{' '}
                  <strong>{formatThaiDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString())}</strong>{' '}
                  (ผู้รับใบอนุญาตต้องยื่นคำขอต่ออายุล่วงหน้าก่อนใบอนุญาตสิ้นอายุไม่น้อยกว่า ๓๐ วัน)
                </div>
              </div>

              <div className="pt-8 border-t border-slate-200 grid grid-cols-2 items-center">
                <div className="flex flex-col items-center justify-center p-3 text-center">
                  <div className="p-2 bg-white rounded-lg shadow-2xs border border-slate-200">
                    <QRCodeSVG
                      value={`${window.location.origin}/verify?token=${selectedApp.tracking_code}`}
                      size={100}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 font-semibold">
                    สแกน QR เพื่อตรวจสอบความถูกต้อง
                  </span>
                </div>

                <div className="text-center space-y-1">
                  <div className="h-14 flex items-end justify-center font-serif text-lg text-slate-700 italic">
                    (ลงชื่อ) ....................................................
                  </div>
                  <p className="font-bold text-sm text-slate-900">นายกองค์การบริหารส่วนตำบลโป่งน้ำร้อน</p>
                  <p className="text-xs text-slate-500">เจ้าพนักงานสาธารณสุข / ผู้อนุมัติ</p>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
