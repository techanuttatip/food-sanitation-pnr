import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { licenseService } from '../services/licenseService';
import { DEMO_APPLICATIONS } from '../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import type { License } from '../types';
import { formatThaiDate, formatNationalId, formatPhoneNumber, numberToThaiBahtWords } from '../lib/utils';
import { pdfExportService } from '../services/pdfExportService';
import { officialPdfService } from '../services/officialPdfService';
import { settingsService, DEFAULT_FORM_TEMPLATE, type LicenseFormTemplate } from '../services/settingsService';
import {
  Award,
  Search,
  Printer,
  Download,
  QrCode,
  Building2,
  Calendar,
  User,
  Stamp,
  CheckCircle2,
  FileCheck,
  MapPin,
  Trash2,
  Settings,
  FileText,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Sliders,
  Check,
} from 'lucide-react';

export const LicenseManagement: React.FC = () => {
  const { user } = useAuth();
  const { success } = useToast();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Printable Certificate Modal
  const [previewLicense, setPreviewLicense] = useState<License | null>(null);
  const [previewQr, setPreviewQr] = useState<License | null>(null);

  // Form Template Configuration State
  const [formTemplate, setFormTemplate] = useState<LicenseFormTemplate>(() => {
    const s = settingsService.getSettings();
    return s.form_template || DEFAULT_FORM_TEMPLATE;
  });
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [tempTemplate, setTempTemplate] = useState<LicenseFormTemplate>(formTemplate);

  const handleSaveTemplate = () => {
    const currentSettings = settingsService.getSettings();
    const updatedSettings = {
      ...currentSettings,
      form_template: tempTemplate,
    };
    settingsService.saveSettings(updatedSettings);
    setFormTemplate(tempTemplate);
    setIsTemplateModalOpen(false);
    success('บันทึกการตั้งค่าแม่แบบสำเร็จ ✨', 'ข้อความและรูปแบบของแบบฟอร์ม สอ.3 ได้รับการอัปเดตเรียบร้อย');
  };

  const handleResetTemplate = () => {
    setTempTemplate(DEFAULT_FORM_TEMPLATE);
  };

  const handleToggleDisplayMode = () => {
    const newMode = formTemplate.display_mode === 'filled' ? 'blank_dotted' : 'filled';
    const updated = { ...formTemplate, display_mode: newMode as 'filled' | 'blank_dotted' };
    const currentSettings = settingsService.getSettings();
    settingsService.saveSettings({ ...currentSettings, form_template: updated });
    setFormTemplate(updated);
    setTempTemplate(updated);
    success(
      newMode === 'filled' ? 'โหมดหยอดข้อมูลจริง ✨' : 'โหมดแม่แบบเปล่าเส้นประจุด 📄',
      newMode === 'filled' ? 'แสดงข้อมูลผู้ประกอบการลงในฟอร์ม' : 'แสดงเป็นเส้นประจุดล้วนตามต้นฉบับ'
    );
  };

  const handlePrintCertificate = () => {
    const el = document.getElementById('official-certificate-print');
    if (!el) {
      window.print();
      return;
    }

    const printWin = window.open('', '_blank', 'width=850,height=1100');
    if (!printWin) {
      window.print();
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="utf-8">
        <title>ใบอนุญาต สอ.๓ - ${previewLicense?.business?.name || 'อบต.โป่งน้ำร้อน'}</title>
        <style>
          @font-face {
            font-family: 'TH Sarabun IT9';
            src: local('TH Sarabun IT9'), local('THSarabunIT9'), local('THSarabunNew'), url('/fonts/THSarabunNew.ttf') format('truetype');
            font-weight: 400;
            font-style: normal;
          }
          @font-face {
            font-family: 'TH Sarabun IT9';
            src: local('TH Sarabun IT9 Bold'), local('THSarabunIT9 Bold'), local('THSarabunNew-Bold'), url('/fonts/THSarabunNew-Bold.ttf') format('truetype');
            font-weight: 700;
            font-style: normal;
          }
          @font-face {
            font-family: 'THSarabunIT9';
            src: local('TH Sarabun IT9'), local('THSarabunIT9'), local('THSarabunNew'), url('/fonts/THSarabunNew.ttf') format('truetype');
            font-weight: 400;
            font-style: normal;
          }
          @font-face {
            font-family: 'THSarabunIT9';
            src: local('TH Sarabun IT9 Bold'), local('THSarabunIT9 Bold'), local('THSarabunNew-Bold'), url('/fonts/THSarabunNew-Bold.ttf') format('truetype');
            font-weight: 700;
            font-style: normal;
          }
          @font-face {
            font-family: 'THSarabunNew';
            src: local('THSarabunNew'), local('TH Sarabun New'), url('/fonts/THSarabunNew.ttf') format('truetype');
            font-weight: 400;
            font-style: normal;
          }
          @font-face {
            font-family: 'THSarabunNew';
            src: local('THSarabunNew-Bold'), local('TH Sarabun New Bold'), url('/fonts/THSarabunNew-Bold.ttf') format('truetype');
            font-weight: 700;
            font-style: normal;
          }
          @page {
            size: A4 portrait;
            margin: 8mm 14mm 6mm 14mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          html, body {
            font-family: 'TH Sarabun IT9', 'THSarabunIT9', 'THSarabunNew', 'TH Sarabun PSK', 'Sarabun', sans-serif;
            font-size: 16pt;
            line-height: 1.35;
            color: #000000;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .cert-body {
            width: 100%;
            max-width: 182mm;
            margin: 0 auto;
            padding: 0;
          }
          p { margin: 1px 0; line-height: 1.35; }
          .font-bold { font-weight: bold; }
          img { display: block; margin: 0 auto; }
        </style>
      </head>
      <body>
        <div class="cert-body">
          ${el.innerHTML}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 350);
          };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await licenseService.getLicenses();
      setLicenses(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredLicenses = licenses.filter(
    (lic) =>
      (lic.license_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (lic.business?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (lic.business?.owner?.first_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-gov-700" />
            ระบบทะเบียนและพิมพ์ใบอนุญาต (Print-Ready License for Mayor's Signature)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            งานสาธารณสุข อบต.โป่งน้ำร้อน อ.ฝาง • พิมพ์ใบอนุญาตตามระเบียบ พ.ร.บ. สาธารณสุข ๒๕๓๕ เพื่อเสนอนายก อบต. ลงนาม
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {formTemplate.google_doc_url && (
            <a
              href={formTemplate.google_doc_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition shadow-2xs"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              📄 แม่แบบ Google Docs
              <ExternalLink className="w-3 h-3 text-blue-500" />
            </a>
          )}
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Settings className="w-4 h-4 text-slate-600" />}
            onClick={() => {
              setTempTemplate(formTemplate);
              setIsTemplateModalOpen(true);
            }}
            className="font-bold border-slate-300 shadow-2xs hover:bg-slate-50"
          >
            ⚙️ ตั้งค่าแม่แบบฟอร์ม สอ.3
          </Button>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400">ใบอนุญาตทั้งหมด</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5 font-mono">{licenses.length} <span className="text-xs text-slate-400 font-normal">ฉบับ</span></p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-emerald-600">พร้อมพิมพ์เสนอลงนาม</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5 font-mono">{licenses.filter(l => l.is_active).length} <span className="text-xs text-slate-400 font-normal">ฉบับ</span></p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <p className="text-[11px] font-semibold text-gov-700">QR Code ตรวจสอบจริง</p>
            <p className="text-xs text-slate-500 mt-1">ฝังในใบอนุญาตทุกฉบับ</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gov-50 text-gov-700 flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-white shadow-2xs">
        <Input
          placeholder="ค้นหาเลขที่ใบอนุญาต, ชื่อสถานประกอบการ, หรือชื่อผู้ประกอบการ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="w-4 h-4 text-slate-400" />}
        />
      </Card>

      {/* Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredLicenses.map((lic) => (
          <Card
            key={lic.id}
            className="border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 border-t-4 border-t-emerald-600 flex flex-col justify-between overflow-hidden bg-white"
          >
            <div className="p-5 space-y-4">
              {/* Header Box */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-gov-800 font-semibold">
                    <Award className="w-4 h-4 text-gov-700" />
                    <span>ใบอนุญาตจัดตั้งสถานที่สะสมอาหาร</span>
                  </div>
                  <h3 className="text-lg font-black text-gov-900 mt-1 font-mono tracking-tight">
                    {lic.license_number}
                  </h3>
                  <p className="text-[11px] text-slate-400">เล่มที่ {lic.book_number || '01'} • ประจำปี พ.ศ. {lic.year_be}</p>
                </div>

                <div className="p-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs shrink-0">
                  <QRCodeSVG
                    value={`${window.location.origin}/verify/${lic.verification_token}`}
                    size={56}
                    level="L"
                  />
                </div>
              </div>

              {/* Establishment Info */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                <p>
                  <span className="text-slate-400">สถานที่:</span>{' '}
                  <strong className="text-slate-900">{lic.business?.name}</strong>
                </p>
                <p>
                  <span className="text-slate-400">ผู้รับใบอนุญาต:</span>{' '}
                  <span className="font-semibold text-slate-800">
                    {lic.business?.owner?.title_th}{lic.business?.owner?.first_name} {lic.business?.owner?.last_name}
                  </span>
                </p>
                <p>
                  <span className="text-slate-400">เลขบัตร ปชช.:</span>{' '}
                  <span className="font-mono text-slate-600">{formatNationalId(lic.business?.owner?.national_id, true)}</span>
                </p>
              </div>

              {/* Validity Dates */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> วันที่ออกใบอนุญาต:
                  </span>
                  <span className="font-semibold">{formatThaiDate(lic.issued_date, { shortMonth: true })}</span>
                </div>
                <div className="flex items-center justify-between text-emerald-800 font-semibold">
                  <span className="flex items-center gap-1 text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" /> วันหมดอายุ:
                  </span>
                  <span>{formatThaiDate(lic.expiry_date, { shortMonth: true })}</span>
                </div>
              </div>
            </div>

            {/* Bottom Action Footer */}
            <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500 truncate">
                ผู้ลงนาม: นายก อบต.โป่งน้ำร้อน
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setPreviewLicense(lic)}
                  leftIcon={<Printer className="w-3.5 h-3.5" />}
                  className="text-xs font-bold bg-gov-700 hover:bg-gov-800"
                >
                  พิมพ์ใบอนุญาตให้นายกเซ็น
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewQr(lic)}
                  leftIcon={<QrCode className="w-3.5 h-3.5" />}
                  className="text-xs font-bold"
                >
                  พิมพ์ QR Sticker
                </Button>
                <button
                  type="button"
                  title="ลบใบอนุญาตนี้"
                  onClick={() => {
                    if (window.confirm(`ต้องการลบใบอนุญาต "${lic.license_number}" หรือไม่?`)) {
                      setLicenses((prev) => prev.filter((l) => l.id !== lic.id));
                      success('ลบใบอนุญาตสำเร็จ', `ลบ ${lic.license_number}`);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Official Printable Certificate Modal for Mayor to Sign */}
      {previewLicense && (
        <Modal
          isOpen={!!previewLicense}
          onClose={() => setPreviewLicense(null)}
          title="หนังสือรับรองการแจ้งการประกอบกิจการสถานที่สะสมอาหาร (พ.ร.บ. สาธารณสุข ๒๕๓๕)"
          size="xl"
          footer={
            <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleDisplayMode}
                  className="text-xs font-bold text-gov-800 bg-gov-50 border-gov-200 hover:bg-gov-100 shadow-2xs"
                >
                  {formTemplate.display_mode === 'filled' ? '📄 สลับเป็น: แม่แบบเปล่าจุดประ' : '✨ สลับเป็น: หยอดข้อมูลจริง'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Settings className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setTempTemplate(formTemplate);
                    setIsTemplateModalOpen(true);
                  }}
                  className="text-xs text-slate-600 hover:text-slate-900"
                >
                  ⚙️ ตั้งค่าข้อความ
                </Button>
              </div>

              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setPreviewLicense(null)}>
                  ปิด
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    success('กำลังสร้างเอกสาร PDF...', 'แปลงเป็นไฟล์ PDF ความละเอียดสูง 300 DPI');
                    await pdfExportService.exportElementToPDF(
                      'official-certificate-print',
                      `ใบอนุญาต_สอ3_${previewLicense.license_number?.replace(/[\/\s]/g, '_') || '2569'}.pdf`
                    );
                    success('ดาวน์โหลดสำเร็จ ✨', 'บันทึกใบอนุญาต สอ.๓ ลงเครื่องเรียบร้อย');
                  }}
                  leftIcon={<Download className="w-4 h-4" />}
                  className="font-bold border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  📥 บันทึกเป็น PDF (แบบ สอ.๓)
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handlePrintCertificate}
                  leftIcon={<Printer className="w-4 h-4" />}
                  className="bg-gov-700 hover:bg-gov-800 font-bold shadow-md"
                >
                  🖨️ สั่งพิมพ์ใบอนุญาต (Print A4)
                </Button>
              </div>
            </div>
          }
        >
          {/* Top Mode Switcher Bar */}
          <div className="mb-4 p-2.5 bg-slate-100 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-2 border border-slate-200/80">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">รูปแบบการพิมพ์:</span>
              <button
                type="button"
                onClick={() => {
                  const updated = { ...formTemplate, display_mode: 'filled' as const };
                  settingsService.saveSettings({ ...settingsService.getSettings(), form_template: updated });
                  setFormTemplate(updated);
                  setTempTemplate(updated);
                  success('หยอดข้อมูลจริง ✨', 'กรอกชื่อผู้ประกอบการและรายละเอียดลงในแบบฟอร์ม');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  formTemplate.display_mode !== 'blank_dotted'
                    ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400/30'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                ✨ หยอดข้อมูลจริงในฟอร์ม (แนะนำ)
              </button>
              <button
                type="button"
                onClick={() => {
                  const updated = { ...formTemplate, display_mode: 'blank_dotted' as const };
                  settingsService.saveSettings({ ...settingsService.getSettings(), form_template: updated });
                  setFormTemplate(updated);
                  setTempTemplate(updated);
                  success('แม่แบบเปล่าจุดประ 📄', 'แสดงเป็นจุดประล้วนตามแม่แบบต้นฉบับ');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  formTemplate.display_mode === 'blank_dotted'
                    ? 'bg-gov-700 text-white shadow-xs ring-2 ring-gov-400/30'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                📄 แสดงแบบฟอร์มเปล่าจุดล้วน
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setTempTemplate(formTemplate);
                setIsTemplateModalOpen(true);
              }}
              className="text-xs font-bold text-gov-700 hover:text-gov-900 flex items-center gap-1 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" /> ⚙️ ตั้งค่าข้อความแม่แบบ
            </button>
          </div>

          {/* Official Standard Certificate Layout — แบบ สอ.3 (TH SarabunIT9 size 16) */}
          {(() => {
            const isFilled = formTemplate.display_mode !== 'blank_dotted';
            const thMonths = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
            const parseDateParts = (dateStr?: string) => {
              if (!dateStr) return { day: '', month: '', year: '' };
              const d = new Date(dateStr);
              return { day: d.getDate().toString(), month: thMonths[d.getMonth()], year: (d.getFullYear() + 543).toString() };
            };
            const issuedParts = parseDateParts(previewLicense.issued_date);
            const expiryParts = parseDateParts(previewLicense.expiry_date);
            const owner = previewLicense.business?.owner;
            const loc = previewLicense.business?.location;
            const feeRate = (previewLicense.business?.area_sqm || 50) * 15;

            const ownerFullName = owner ? `${owner.title_th || ''}${owner.first_name || ''} ${owner.last_name || ''}`.trim() : '';
            const licParts = (previewLicense.license_number || '').split('/');
            const licNo = licParts[0] || previewLicense.license_number || '';
            const licYear = licParts[1] || (previewLicense.issued_date ? (new Date(previewLicense.issued_date).getFullYear() + 543).toString() : '2569');

            const fillVal = (value: string | number | undefined | null, defaultDots: string) => {
              const text = value !== undefined && value !== null ? String(value).trim() : '';

              return (
                <span
                  style={{
                    display: 'inline-block',
                    position: 'relative',
                    textAlign: 'center',
                    verticalAlign: 'baseline',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {/* Continuous unbroken dotted line */}
                  <span
                    style={{
                      display: 'inline-block',
                      color: '#000',
                      letterSpacing: '0.4px',
                      userSelect: 'none',
                    }}
                  >
                    {defaultDots}
                  </span>

                  {/* Text sitting centered directly on top of the dots */}
                  {isFilled && Boolean(text) && (
                    <span
                      style={{
                        position: 'absolute',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        bottom: '1px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        color: '#000',
                        whiteSpace: 'nowrap',
                        lineHeight: 1,
                        padding: '0 2px',
                      }}
                    >
                      {text}
                    </span>
                  )}
                </span>
              );
            };

            return (
              <div
                id="official-certificate-print"
                style={{
                  fontFamily: "'TH Sarabun IT9', 'THSarabunIT9', 'THSarabunNew', 'TH Sarabun PSK', 'Sarabun', sans-serif",
                  fontSize: '16pt',
                  lineHeight: 1.35,
                  color: '#000',
                  background: '#fff',
                  padding: '16px 28px',
                  maxWidth: '210mm',
                  margin: '0 auto',
                  wordBreak: 'keep-all',
                }}
              >
                {/* Form Code Top Right */}
                <div style={{ textAlign: 'right', fontSize: '16pt', fontWeight: 600, marginBottom: '2px' }}>
                  {formTemplate.form_code || 'แบบ สอ.3'}
                </div>

                {/* Garuda Crest and Title */}
                <div style={{ textAlign: 'center', paddingBottom: '6px' }}>
                  <img
                    src="/garuda.png"
                    alt="ตราครุฑ"
                    style={{ height: 60, margin: '0 auto 2px', display: 'block', objectFit: 'contain' }}
                  />
                  <div style={{ fontSize: '18pt', fontWeight: 'bold', lineHeight: 1.2 }}>
                    {formTemplate.title_main || 'ใบอนุญาต'}
                  </div>
                  <div style={{ fontSize: '16pt', fontWeight: 'bold', lineHeight: 1.3 }}>
                    {formTemplate.title_sub || 'ประกอบกิจการจัดตั้งสถานที่จำหน่ายอาหาร/สถานที่สะสมอาหาร'}
                  </div>
                  <div style={{ fontSize: '11pt', letterSpacing: '0.12em', color: '#000', marginTop: '1px' }}>
                    ------------------------------------------------------------------------
                  </div>
                </div>

                {/* Book and Number */}
                <p style={{ margin: '2px 0 4px 0' }}>
                  เล่มที่ {fillVal(previewLicense.book_number || '01', '.........')} เลขที่ {fillVal(licNo, '.......')} / {fillVal(licYear, '.........')}
                </p>

                {/* (1) */}
                <p style={{ textIndent: '2.5em', margin: '2px 0' }}>
                  <strong>(1)</strong> เจ้าพนักงานท้องถิ่นอนุญาตให้ {fillVal(ownerFullName, '......................................')} สัญชาติ {fillVal('ไทย', '.............')}
                </p>

                <p style={{ margin: '2px 0' }}>
                  อยู่บ้านเลขที่ {fillVal(loc?.address_no, '..................')} หมู่ที่ {fillVal(loc?.moo, '............')} {formTemplate.subdistrict || 'ตำบลโป่งน้ำร้อน'} {formTemplate.district || 'อำเภอฝาง'} {formTemplate.province || 'จังหวัดเชียงใหม่'}
                </p>

                <p style={{ margin: '2px 0' }}>
                  หมายเลขโทรศัพท์ {fillVal(formatPhoneNumber(owner?.phone_number), '...................................................')}
                </p>

                <p style={{ textIndent: '3.5em', margin: '2px 0' }}>
                  ชื่อสถานประกอบกิจการ {fillVal(previewLicense.business?.name, '......................................')} ประเภท {fillVal(previewLicense.business?.business_type, '............................')}
                </p>

                <p style={{ margin: '2px 0' }}>
                  ตั้งอยู่เลขที่ {fillVal(loc?.address_no, '..................')} หมู่ที่ {fillVal(loc?.moo, '............')} {formTemplate.subdistrict || 'ตำบลโป่งน้ำร้อน'} {formTemplate.district || 'อำเภอฝาง'} {formTemplate.province || 'จังหวัดเชียงใหม่'}
                </p>

                <p style={{ margin: '2px 0' }}>
                  หมายเลขโทรศัพท์ {fillVal(formatPhoneNumber(owner?.phone_number), '...................................................')}
                </p>

                <p style={{ textIndent: '3.5em', margin: '2px 0' }}>
                  เสียค่าธรรมเนียมปีละ {fillVal(feeRate.toLocaleString('th-TH'), '..................')} บาท ( {fillVal(numberToThaiBahtWords(feeRate), '....................................................')} )
                </p>

                <p style={{ margin: '2px 0' }}>
                  ตามใบเสร็จรับเงินเล่มที่ {fillVal(previewLicense.book_number || '01', '............')} เลขที่ {fillVal(`REC-2569-${(previewLicense.business?.id || '001').slice(-3)}`, '................')} วันที่ {fillVal(`${issuedParts.day} ${issuedParts.month} พ.ศ. ${issuedParts.year}`, '..........................................')}
                </p>

                {/* (2) */}
                <p style={{ textIndent: '2.5em', margin: '3px 0' }}>
                  <strong>(2)</strong> ผู้รับใบอนุญาตต้องปฏิบัติตามหลักเกณฑ์ วิธีการและเงื่อนไขที่กำหนดใน{formTemplate.ordinance_text || 'ข้อบัญญัติองค์การบริหารส่วนตำบลโป่งน้ำร้อน เรื่อง สถานที่จำหน่ายอาหารและสถานที่สะสมอาหาร พ.ศ.2535'}
                </p>

                {/* (3) */}
                <p style={{ textIndent: '2.5em', margin: '3px 0' }}>
                  <strong>(3)</strong> หากปรากฏในภายหลังว่าการประกอบกิจการที่ได้รับอนุญาตนี้เป็นการขัดต่อกฎหมายอื่น ที่เกี่ยวข้องโดยมิอาจแก้ไข เจ้าพนักงานท้องถิ่นอาจพิจารณาเพิกถอนการอนุญาตนี้ได้
                </p>

                {/* (4) */}
                <p style={{ textIndent: '2.5em', margin: '3px 0' }}>
                  <strong>(4)</strong> ใบอนุญาตฉบับนี้ออกให้เมื่อวันที่ {fillVal(issuedParts.day, '......')} เดือน {fillVal(issuedParts.month, '..................')} พ.ศ. {fillVal(issuedParts.year, '........')}
                </p>

                {/* (5) */}
                <p style={{ textIndent: '2.5em', margin: '3px 0' }}>
                  <strong>(5)</strong> ใบอนุญาตฉบับนี้สิ้นอายุวันที่ {fillVal(expiryParts.day, '......')} เดือน {fillVal(expiryParts.month, '..................')} พ.ศ. {fillVal(expiryParts.year, '........')}
                </p>

                {/* Signature Section matching Google Doc template */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '14px', paddingBottom: '4px' }}>
                  <div style={{ textAlign: 'center', width: '58%' }}>
                    <p style={{ margin: '1px 0' }}>
                      (ลงชื่อ)....................................................{formTemplate.officer_title || 'เจ้าพนักงานท้องถิ่น'}
                    </p>
                    <p style={{ margin: '4px 0 1px 0' }}>
                      ( {isFilled ? (previewLicense.approver_name || formTemplate.signer_name) : '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0'} )
                    </p>
                    <p style={{ margin: '1px 0', fontSize: '15pt' }}>
                      {formTemplate.signer_position || 'นายกองค์การบริหารส่วนตำบลโป่งน้ำร้อน'}
                    </p>
                  </div>
                </div>

                {/* Bottom Warning (คำเตือน) */}
                <div style={{ marginTop: '6px', paddingTop: '4px', borderTop: '1px solid #cbd5e1', fontSize: '12.5pt', lineHeight: 1.25, color: '#222' }}>
                  <p style={{ margin: '1px 0' }}>
                    <strong>คำเตือน (1)</strong> ผู้รับใบอนุญาตต้องแสดงใบอนุญาตนี้ไว้โดยเปิดเผยและเห็นได้ง่าย ณ สถานประกอบการ
                  </p>
                  <p style={{ margin: '1px 0', textIndent: '4.5em' }}>
                    กิจการ ตลอดเวลาที่ประกอบกิจการ หากฝ่าฝืนมีโทษปรับไม่เกิน 500 บาท
                  </p>
                  <p style={{ margin: '1px 0', textIndent: '2.8em' }}>
                    <strong>(2)</strong> หากประสงค์จะประกอบกิจการในปีต่อไปต้องยื่นคำขอต่อใบอนุญาตก่อนใบอนุญาตสิ้นอายุ
                  </p>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* Form Template Settings & Google Docs Modal */}
      {isTemplateModalOpen && (
        <Modal
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          title="⚙️ ตั้งค่าแม่แบบฟอร์ม สอ.3 & เชื่อมโยง Google Docs"
          size="lg"
          footer={
            <div className="flex justify-between items-center w-full">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetTemplate}
                leftIcon={<RotateCcw className="w-3.5 h-3.5 text-slate-500" />}
                className="text-slate-500 hover:text-rose-600 text-xs font-semibold"
              >
                รีเซ็ตค่ามาตรฐาน
              </Button>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setIsTemplateModalOpen(false)}>
                  ยกเลิก
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveTemplate}
                  leftIcon={<Check className="w-4 h-4" />}
                  className="bg-gov-700 hover:bg-gov-800 font-bold shadow-md"
                >
                  บันทึกการตั้งค่า
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-5 text-sm">
            {/* Google Docs Integration Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-950 text-sm">เชื่อมต่อแม่แบบ Google Docs ของคุณ</h4>
                    <p className="text-xs text-blue-700">วางลิงก์ Google Docs ของหน่วยงาน เพื่อให้เจ้าหน้าที่กดเปิดแก้ไขหรือพิมพ์ได้ตลอดเวลา</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <a
                    href="https://docs.new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 text-xs font-bold text-indigo-700 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition flex items-center gap-1 shadow-2xs"
                  >
                    ➕ สร้างไฟล์ใหม่ (docs.new) <ExternalLink className="w-3 h-3" />
                  </a>
                  {tempTemplate.google_doc_url && tempTemplate.google_doc_url !== 'https://docs.new' && (
                    <a
                      href={tempTemplate.google_doc_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 text-xs font-bold text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition flex items-center gap-1 shadow-2xs"
                    >
                      เปิดไฟล์ <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Input
                  label="ลิงก์ Google Docs (แชร์แบบทุกคนที่มีลิงก์ดูได้/แก้ไขได้)"
                  placeholder="https://docs.google.com/document/d/..."
                  value={tempTemplate.google_doc_url}
                  onChange={(e) => setTempTemplate({ ...tempTemplate, google_doc_url: e.target.value })}
                  className="bg-white text-xs"
                />
              </div>

              <div className="flex justify-between items-center pt-1 border-t border-blue-100">
                <span className="text-[11px] text-blue-600">
                  💡 คำแนะนำ: กดสร้างไฟล์ใหม่ แล้วคัดลอกข้อความด้านล่างไปวางใน Google Docs
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const text = `แบบ สอ.3\n\nใบอนุญาต\nประกอบกิจการจัดตั้งสถานที่จำหน่ายอาหาร/สถานที่สะสมอาหาร\n……………………………………………………..\n\nเล่มที่...............เลขที่............./................\n\n(1) เจ้าพนักงานท้องถิ่นอนุญาตให้.....................................................................สัญชาติ................\nอยู่บ้านเลขที่............................หมู่ที่.....................ตำบลโป่งน้ำร้อน อำเภอฝาง จังหวัดเชียงใหม่\nหมายเลขโทรศัพท์.........................................................\n             ชื่อสถานประกอบกิจการ.....................................................................ประเภท..............................\nตั้งอยู่เลขที่.................................หมู่ที่.............................ตำบลโป่งน้ำร้อน อำเภอฝาง จังหวัดเชียงใหม่\nหมายเลขโทรศัพท์........................................................\n             เสียค่าธรรมเนียมปีละ...............................บาท (.......................................................................)\nตามใบเสร็จรับเงินเล่มที่............................เลขที่....................วันที่..........................................................................\n\n(2) ผู้รับใบอนุญาตต้องปฏิบัติตามหลักเกณฑ์ วิธีการและเงื่อนไขที่กำหนดในข้อบัญญัติองค์การบริหารส่วนตำบลโป่งน้ำร้อน เรื่อง สถานที่จำหน่ายอาหารและสถานที่สะสมอาหาร พ.ศ.2535\n(3) หากปรากฏในภายหลังว่าการประกอบกิจการที่ได้รับอนุญาตนี้เป็นการขัดต่อกฎหมายอื่น ที่เกี่ยวข้องโดยมิอาจแก้ไข เจ้าพนักงานท้องถิ่นอาจพิจารณาเพิกถอนการอนุญาตนี้ได้\n(4) ใบอนุญาตฉบับนี้ออกให้เมื่อวันที่............เดือน..............................พ.ศ...............\n(5) ใบอนุญาตฉบับนี้สิ้นอายุวันที่..............เดือน..............................พ.ศ....................\n\n                                               (ลงชื่อ)....................................................เจ้าพนักงานท้องถิ่น\n                                                            (                                 )\n                                                     นายกองค์การบริหารส่วนตำบลโป่งน้ำร้อน\n\nคำเตือน (1) ผู้รับใบอนุญาตต้องแสดงใบอนุญาตนี้ไว้โดยเปิดเผยและเห็นได้ง่าย ณ สถานประกอบการ\n            กิจการ ตลอดเวลาที่ประกอบกิจการ หากฝ่าฝืนมีโทษปรับไม่เกิน 500 บาท\n       (2) หากประสงค์จะประกอบกิจการในปีต่อไปต้องยื่นคำขอต่อใบอนุญาตก่อนใบอนุญาตสิ้นอายุ`;
                    navigator.clipboard.writeText(text);
                    success('คัดลอกข้อความแม่แบบแล้ว 📋', 'นำไปกด Ctrl+V วางใน Google Docs ได้ทันที');
                  }}
                  className="text-xs bg-white border-blue-300 text-blue-700 hover:bg-blue-50 font-bold"
                >
                  📋 คัดลอกข้อความไปวาง
                </Button>
              </div>
            </div>

            {/* Display Mode Selection */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-gov-700" />
                โหมดการแสดงผลเริ่มต้น (Default Print Mode)
              </label>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <label
                  onClick={() => setTempTemplate({ ...tempTemplate, display_mode: 'filled' })}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition flex items-start gap-2.5 ${
                    tempTemplate.display_mode === 'filled'
                      ? 'border-gov-600 bg-gov-50/50 shadow-2xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="display_mode"
                    checked={tempTemplate.display_mode === 'filled'}
                    onChange={() => setTempTemplate({ ...tempTemplate, display_mode: 'filled' })}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="font-bold text-xs text-slate-900">✨ หยอดข้อมูลจริง (Filled Data)</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">ดึงข้อมูลผู้ประกอบการและค่าธรรมเนียมมาวางในเอกสาร</p>
                  </div>
                </label>

                <label
                  onClick={() => setTempTemplate({ ...tempTemplate, display_mode: 'blank_dotted' })}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition flex items-start gap-2.5 ${
                    tempTemplate.display_mode === 'blank_dotted'
                      ? 'border-gov-600 bg-gov-50/50 shadow-2xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="display_mode"
                    checked={tempTemplate.display_mode === 'blank_dotted'}
                    onChange={() => setTempTemplate({ ...tempTemplate, display_mode: 'blank_dotted' })}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="font-bold text-xs text-slate-900">📄 แม่แบบเปล่าจุดประ (Blank Form)</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">แสดงเป็นเส้นประจุด `......` ล้วนตามแม่แบบต้นฉบับ</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Template Headings & Wording */}
            <div className="space-y-3.5">
              <h4 className="font-bold text-slate-800 text-xs border-b pb-1.5">ข้อความและหัวเอกสาร (Header & Title)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="รหัสแบบฟอร์ม (มุมบนขวา)"
                  value={tempTemplate.form_code}
                  onChange={(e) => setTempTemplate({ ...tempTemplate, form_code: e.target.value })}
                  placeholder="แบบ สอ.3"
                />
                <Input
                  label="หัวเรื่องหลัก"
                  value={tempTemplate.title_main}
                  onChange={(e) => setTempTemplate({ ...tempTemplate, title_main: e.target.value })}
                  placeholder="ใบอนุญาต"
                />
              </div>
              <Input
                label="ประเภทย่อยของใบอนุญาต"
                value={tempTemplate.title_sub}
                onChange={(e) => setTempTemplate({ ...tempTemplate, title_sub: e.target.value })}
                placeholder="ประกอบกิจการจัดตั้งสถานที่จำหน่ายอาหาร/สถานที่สะสมอาหาร"
              />
              <Input
                label="ข้อบัญญัติท้องถิ่น (ข้อ ๒)"
                value={tempTemplate.ordinance_text}
                onChange={(e) => setTempTemplate({ ...tempTemplate, ordinance_text: e.target.value })}
                placeholder="ข้อบัญญัติองค์การบริหารส่วนตำบลโป่งน้ำร้อน เรื่อง สถานที่จำหน่ายอาหารและสถานที่สะสมอาหาร พ.ศ.2535"
              />
            </div>

            {/* Location & Signer info */}
            <div className="space-y-3.5">
              <h4 className="font-bold text-slate-800 text-xs border-b pb-1.5">ข้อมูลท้องที่และผู้มีอำนาจลงนาม (Signer & Location)</h4>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="ตำบล"
                  value={tempTemplate.subdistrict}
                  onChange={(e) => setTempTemplate({ ...tempTemplate, subdistrict: e.target.value })}
                  placeholder="ตำบลโป่งน้ำร้อน"
                />
                <Input
                  label="อำเภอ"
                  value={tempTemplate.district}
                  onChange={(e) => setTempTemplate({ ...tempTemplate, district: e.target.value })}
                  placeholder="อำเภอฝาง"
                />
                <Input
                  label="จังหวัด"
                  value={tempTemplate.province}
                  onChange={(e) => setTempTemplate({ ...tempTemplate, province: e.target.value })}
                  placeholder="จังหวัดเชียงใหม่"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="ชื่อ-สกุล ผู้ลงนาม"
                  value={tempTemplate.signer_name}
                  onChange={(e) => setTempTemplate({ ...tempTemplate, signer_name: e.target.value })}
                  placeholder="นายสมเกียรติ สถิตพรเจริญ"
                />
                <Input
                  label="ตำแหน่งผู้ลงนาม"
                  value={tempTemplate.signer_position}
                  onChange={(e) => setTempTemplate({ ...tempTemplate, signer_position: e.target.value })}
                  placeholder="นายกองค์การบริหารส่วนตำบลโป่งน้ำร้อน"
                />
              </div>
            </div>
          </div>
        </Modal>
      )}
      {/* QR Sticker Modal */}
      {previewQr && (
        <Modal
          isOpen={!!previewQr}
          onClose={() => setPreviewQr(null)}
          title="พิมพ์ QR Sticker"
          size="sm"
          footer={
            <div className="flex gap-2 justify-end w-full">
              <Button variant="secondary" size="sm" onClick={() => setPreviewQr(null)}>
                ปิด
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.print()}
                leftIcon={<Printer className="w-4 h-4" />}
                className="bg-gov-700 hover:bg-gov-800 font-bold shadow-md"
              >
                พิมพ์ Sticker
              </Button>
            </div>
          }
        >
          <div className="flex justify-center bg-gray-100 p-4 rounded print:bg-white print:p-0">
            <div
              id="printable-qr-sticker"
              className="bg-white border-2 border-gray-200 overflow-hidden print:border-none print:shadow-none shadow-md flex flex-col items-center"
              style={{ width: '5cm', height: '7cm', padding: '10px', boxSizing: 'border-box' }}
            >
              <div className="bg-emerald-600 text-white w-full text-center text-[10px] py-1 font-bold rounded-t">
                ✅ สถานที่สะสมอาหารที่ผ่านการรับรอง
              </div>
              <div className="text-center w-full mt-2 flex-1 flex flex-col items-center">
                <h3 className="text-sm font-bold text-gray-900 leading-tight line-clamp-2 w-full text-center h-10 flex items-center justify-center">
                  {previewQr.business?.name}
                </h3>
                <div className="text-[9px] text-gray-600 mt-1">
                  เลขที่: {previewQr.license_number}
                </div>
                <div className="text-[9px] text-gray-600 mb-2">
                  หมดอายุ: {formatThaiDate(previewQr.expiry_date, { shortMonth: true })}
                </div>
                <div className="flex justify-center p-1 bg-white mb-2">
                  <QRCodeSVG
                    value={`${window.location.origin}/verify/${previewQr.verification_token}`}
                    size={120}
                    level="M"
                  />
                </div>
                <div className="mt-auto text-[9px] text-gray-500 pb-1">
                  อบต. โป่งน้ำร้อน
                </div>
              </div>
            </div>
          </div>
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #printable-qr-sticker, #printable-qr-sticker * {
                visibility: visible;
              }
              #printable-qr-sticker {
                position: absolute;
                left: 0;
                top: 0;
                width: 5cm !important;
                height: 7cm !important;
                border: none !important;
                margin: 0 !important;
                padding: 10px !important;
                page-break-after: always;
              }
              @page {
                size: 5cm 7cm;
                margin: 0;
              }
            }
          `}</style>
        </Modal>
      )}
    </div>
  );
};
