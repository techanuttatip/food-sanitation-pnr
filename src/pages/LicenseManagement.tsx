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
  const [stickerTheme, setStickerTheme] = useState<'emerald_gold' | 'royal_blue' | 'luxury_gold'>('emerald_gold');
  const [stickerSize, setStickerSize] = useState<'sticker' | 'standee' | 'poster'>('sticker');

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

            const DottedSlot: React.FC<{ flex?: number; value?: string | number | null; minWidth?: string }> = ({
              flex = 1,
              value,
              minWidth = '20px',
            }) => {
              const text = value !== undefined && value !== null ? String(value).trim() : '';

              return (
                <span
                  style={{
                    flex: flex > 0 ? flex : undefined,
                    minWidth: minWidth,
                    display: 'inline-block',
                    textAlign: 'center',
                    borderBottom: '1.5px dotted #000000',
                    padding: '0 4px',
                    margin: '0 2px',
                    lineHeight: '1.25',
                    verticalAlign: 'bottom',
                    boxSizing: 'border-box',
                  }}
                >
                  {isFilled && Boolean(text) ? (
                    <span style={{ fontWeight: 'bold', color: '#000000', display: 'inline-block' }}>
                      {text}
                    </span>
                  ) : (
                    '\u00A0'
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
                <div style={{ display: 'flex', alignItems: 'baseline', margin: '2px 0', width: 'fit-content' }}>
                  <span style={{ whiteSpace: 'nowrap' }}>เล่มที่</span>
                  <DottedSlot flex={0} value={previewLicense.book_number || '01'} minWidth="65px" />
                  <span style={{ whiteSpace: 'nowrap', marginLeft: '6px' }}>เลขที่</span>
                  <DottedSlot flex={0} value={licNo} minWidth="60px" />
                  <span style={{ whiteSpace: 'nowrap', margin: '0 2px' }}>/</span>
                  <DottedSlot flex={0} value={licYear} minWidth="70px" />
                </div>

                {/* (1) */}
                <div style={{ display: 'flex', alignItems: 'baseline', margin: '2px 0', paddingLeft: '2.5em' }}>
                  <span style={{ whiteSpace: 'nowrap' }}><strong>(1)</strong> เจ้าพนักงานท้องถิ่นอนุญาตให้</span>
                  <DottedSlot flex={5} value={ownerFullName} minWidth="120px" />
                  <span style={{ whiteSpace: 'nowrap', marginLeft: '6px' }}>สัญชาติ</span>
                  <DottedSlot flex={1} value="ไทย" minWidth="40px" />
                </div>

                {/* Address + Phone on the same line */}
                <div style={{ display: 'flex', alignItems: 'baseline', margin: '2px 0' }}>
                  <span style={{ whiteSpace: 'nowrap' }}>อยู่บ้านเลขที่</span>
                  <DottedSlot flex={0} value={loc?.address_no} minWidth="32px" />
                  <span style={{ whiteSpace: 'nowrap', marginLeft: '4px' }}>หมู่ที่</span>
                  <DottedSlot flex={0} value={loc?.moo} minWidth="24px" />
                  <span style={{ whiteSpace: 'nowrap', marginLeft: '4px' }}>
                    {formTemplate.subdistrict || 'ตำบลโป่งน้ำร้อน'} {formTemplate.district || 'อำเภอฝาง'} {formTemplate.province || 'จังหวัดเชียงใหม่'}
                  </span>
                  <span style={{ whiteSpace: 'nowrap', marginLeft: '8px' }}>หมายเลขโทรศัพท์</span>
                  <DottedSlot flex={0} value={formatPhoneNumber(owner?.phone_number)} minWidth="130px" />
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', margin: '2px 0', paddingLeft: '3.5em' }}>
                  <span style={{ whiteSpace: 'nowrap' }}>ชื่อสถานประกอบกิจการ</span>
                  <DottedSlot flex={2} value={previewLicense.business?.name} minWidth="110px" />
                  <span style={{ whiteSpace: 'nowrap', marginLeft: '6px' }}>ประเภท</span>
                  <DottedSlot flex={3} value={previewLicense.business?.business_type} minWidth="170px" />
                </div>

                {/* Business Address + Business Phone on the same line */}
                <div style={{ display: 'flex', alignItems: 'baseline', margin: '2px 0' }}>
                  <span style={{ whiteSpace: 'nowrap' }}>ตั้งอยู่เลขที่</span>
                  <DottedSlot flex={0} value={loc?.address_no} minWidth="32px" />
                  <span style={{ whiteSpace: 'nowrap', marginLeft: '4px' }}>หมู่ที่</span>
                  <DottedSlot flex={0} value={loc?.moo} minWidth="24px" />
                  <span style={{ whiteSpace: 'nowrap', marginLeft: '4px' }}>
                    {formTemplate.subdistrict || 'ตำบลโป่งน้ำร้อน'} {formTemplate.district || 'อำเภอฝาง'} {formTemplate.province || 'จังหวัดเชียงใหม่'}
                  </span>
                  <span style={{ whiteSpace: 'nowrap', marginLeft: '8px' }}>หมายเลขโทรศัพท์</span>
                  <DottedSlot flex={0} value={formatPhoneNumber(owner?.phone_number)} minWidth="130px" />
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', margin: '2px 0', paddingLeft: '3.5em' }}>
                  <span style={{ whiteSpace: 'nowrap' }}>เสียค่าธรรมเนียมปีละ</span>
                  <DottedSlot flex={2} value={feeRate.toLocaleString('th-TH')} minWidth="50px" />
                  <span style={{ whiteSpace: 'nowrap' }}>บาท (</span>
                  <DottedSlot flex={4} value={numberToThaiBahtWords(feeRate)} minWidth="120px" />
                  <span style={{ whiteSpace: 'nowrap' }}>)</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', margin: '2px 0' }}>
                  <span style={{ whiteSpace: 'nowrap' }}>ตามใบเสร็จรับเงินเล่มที่</span>
                  <DottedSlot flex={1} value={previewLicense.book_number || '01'} minWidth="30px" />
                  <span style={{ whiteSpace: 'nowrap' }}>เลขที่</span>
                  <DottedSlot flex={2} value={`REC-2569-${(previewLicense.business?.id || '001').slice(-3)}`} minWidth="60px" />
                  <span style={{ whiteSpace: 'nowrap' }}>วันที่</span>
                  <DottedSlot flex={3} value={`${issuedParts.day} ${issuedParts.month} พ.ศ. ${issuedParts.year}`} minWidth="90px" />
                </div>

                {/* (2) */}
                <p style={{ textIndent: '2.5em', margin: '3px 0' }}>
                  <strong>(2)</strong> ผู้รับใบอนุญาตต้องปฏิบัติตามหลักเกณฑ์ วิธีการและเงื่อนไขที่กำหนดใน{formTemplate.ordinance_text || 'ข้อบัญญัติองค์การบริหารส่วนตำบลโป่งน้ำร้อน เรื่อง สถานที่จำหน่ายอาหารและสถานที่สะสมอาหาร พ.ศ.2535'}
                </p>

                {/* (3) */}
                <p style={{ textIndent: '2.5em', margin: '3px 0' }}>
                  <strong>(3)</strong> หากปรากฏในภายหลังว่าการประกอบกิจการที่ได้รับอนุญาตนี้เป็นการขัดต่อกฎหมายอื่น ที่เกี่ยวข้องโดยมิอาจแก้ไข เจ้าพนักงานท้องถิ่นอาจพิจารณาเพิกถอนการอนุญาตนี้ได้
                </p>

                {/* (4) */}
                <div style={{ display: 'flex', alignItems: 'baseline', margin: '2px 0', paddingLeft: '2.5em', width: 'fit-content' }}>
                  <span style={{ whiteSpace: 'nowrap' }}><strong>(4)</strong> ใบอนุญาตฉบับนี้ออกให้เมื่อวันที่</span>
                  <DottedSlot flex={0} value={issuedParts.day} minWidth="55px" />
                  <span style={{ whiteSpace: 'nowrap', marginLeft: '6px' }}>เดือน</span>
                  <DottedSlot flex={0} value={issuedParts.month} minWidth="120px" />
                  <span style={{ whiteSpace: 'nowrap', marginLeft: '6px' }}>พ.ศ.</span>
                  <DottedSlot flex={0} value={issuedParts.year} minWidth="65px" />
                </div>

                {/* (5) */}
                <div style={{ display: 'flex', alignItems: 'baseline', margin: '2px 0', paddingLeft: '2.5em', width: 'fit-content' }}>
                  <span style={{ whiteSpace: 'nowrap' }}><strong>(5)</strong> ใบอนุญาตฉบับนี้สิ้นอายุวันที่</span>
                  <DottedSlot flex={0} value={expiryParts.day} minWidth="55px" />
                  <span style={{ whiteSpace: 'nowrap', marginLeft: '6px' }}>เดือน</span>
                  <DottedSlot flex={0} value={expiryParts.month} minWidth="120px" />
                  <span style={{ whiteSpace: 'nowrap', marginLeft: '6px' }}>พ.ศ.</span>
                  <DottedSlot flex={0} value={expiryParts.year} minWidth="65px" />
                </div>

                {/* Signature Section matching Google Doc template */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '28px', paddingBottom: '6px' }}>
                  <div style={{ textAlign: 'center', width: '58%' }}>
                    <p style={{ margin: '1px 0' }}>
                      (ลงชื่อ)....................................................{formTemplate.officer_title || 'เจ้าพนักงานท้องถิ่น'}
                    </p>
                    <p style={{ margin: '8px 0 2px 0' }}>
                      ( {isFilled ? (formTemplate.signer_name || previewLicense.approver_name || 'นายสมคิด พงษ์สุข') : '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0'} )
                    </p>
                    <p style={{ margin: '2px 0', fontSize: '16pt' }}>
                      {formTemplate.signer_position || 'นายกองค์การบริหารส่วนตำบลโป่งน้ำร้อน'}
                    </p>
                  </div>
                </div>

                {/* Bottom Warning (คำเตือน) */}
                <div style={{ marginTop: '6px', paddingTop: '4px', borderTop: '1px solid #cbd5e1', fontSize: '14pt', lineHeight: 1.3, color: '#222' }}>
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
                  placeholder="นายสมคิด พงษ์สุข"
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
      {/* High-Prestige Smart Food Sanitation QR Recognition Sticker Modal */}
      {previewQr && (
        <Modal
          isOpen={!!previewQr}
          onClose={() => setPreviewQr(null)}
          title="🏷️ ป้ายสัญลักษณ์ & QR Sticker รับรองมาตรฐานสุขาภิบาลอาหาร"
          size="lg"
          footer={
            <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-3">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>สำหรับพิมพ์ติดกระจกหน้าร้าน, เคาน์เตอร์แคชเชียร์ หรือป้ายตั้งโต๊ะ</span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <Button variant="secondary" size="sm" onClick={() => setPreviewQr(null)}>
                  ปิด
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    success('กำลังสร้างเอกสาร PDF...', 'แปลงป้ายรับรอง QR Sticker เป็น PDF ความละเอียดสูง');
                    await pdfExportService.exportElementToPDF(
                      'printable-qr-sticker',
                      `ป้ายรับรองสุขาภิบาล_${previewQr.business?.name?.replace(/\s+/g, '_') || 'QR'}.pdf`
                    );
                    success('ดาวน์โหลดสำเร็จ ✨', 'บันทึกป้าย QR Sticker ลงเครื่องเรียบร้อย');
                  }}
                  leftIcon={<Download className="w-4 h-4" />}
                  className="font-bold border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  📥 บันทึกเป็น PDF
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const printContents = document.getElementById('printable-qr-sticker')?.outerHTML;
                    const printWindow = window.open('', '_blank', 'width=800,height=900');
                    if (printWindow && printContents) {
                      printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <title>พิมพ์ป้ายรับรองมาตรฐานสุขาภิบาลอาหาร - ${previewQr.business?.name}</title>
                            <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap" rel="stylesheet">
                            <style>
                              @page { size: auto; margin: 0mm; }
                              body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f8fafc; font-family: 'Sarabun', sans-serif; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                              @media print {
                                body { background: #fff; padding: 0; }
                              }
                            </style>
                          </head>
                          <body>
                            ${printContents}
                            <script>
                              window.onload = () => {
                                setTimeout(() => {
                                  window.print();
                                  window.close();
                                }, 350);
                              };
                            </script>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                    }
                  }}
                  leftIcon={<Printer className="w-4 h-4" />}
                  className="bg-gov-700 hover:bg-gov-800 font-bold shadow-md"
                >
                  🖨️ สั่งพิมพ์ป้าย Sticker
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Customizer Control Bar */}
            <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Theme selector */}
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">🎨 โทนสีป้าย:</span>
                <div className="flex gap-1.5">
                  {[
                    { id: 'emerald_gold', label: '🌿 เขียวมรกตทอง (สุขาภิบาล)', bg: 'bg-emerald-700 text-white' },
                    { id: 'royal_blue', label: '🏛️ น้ำเงินหลวงทอง (อบต.)', bg: 'bg-blue-800 text-white' },
                    { id: 'luxury_gold', label: '👑 ทองอร่าม (พรีเมียม)', bg: 'bg-amber-600 text-white' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setStickerTheme(t.id as any)}
                      className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer text-xs ${
                        stickerTheme === t.id
                          ? `${t.bg} shadow-xs ring-2 ring-slate-400/40`
                          : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size selector */}
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">📐 ขนาดป้าย:</span>
                <div className="flex gap-1.5">
                  {[
                    { id: 'sticker', label: '🏷️ สติกเกอร์หน้าร้าน (10×14 cm)' },
                    { id: 'standee', label: '📋 การ์ดตั้งโต๊ะ (9×12 cm)' },
                    { id: 'poster', label: '📄 โปสเตอร์ผนัง A5' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStickerSize(s.id as any)}
                      className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer text-xs ${
                        stickerSize === s.id
                          ? 'bg-gov-800 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticker Preview Container */}
            <div className="flex justify-center p-6 bg-slate-900/10 rounded-2xl border border-slate-200/80 overflow-x-auto">
              {(() => {
                const isEmerald = stickerTheme === 'emerald_gold';
                const isBlue = stickerTheme === 'royal_blue';
                const isGold = stickerTheme === 'luxury_gold';

                const headerBg = isEmerald
                  ? 'linear-gradient(135deg, #065f46 0%, #047857 50%, #059669 100%)'
                  : isBlue
                  ? 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)'
                  : 'linear-gradient(135deg, #78350f 0%, #b45309 50%, #d97706 100%)';

                const ribbonBg = isEmerald
                  ? 'linear-gradient(90deg, #d97706 0%, #fbbf24 50%, #d97706 100%)'
                  : isBlue
                  ? 'linear-gradient(90deg, #f59e0b 0%, #fde68a 50%, #f59e0b 100%)'
                  : 'linear-gradient(90deg, #f59e0b 0%, #fef3c7 50%, #f59e0b 100%)';

                const borderGradient = isEmerald
                  ? 'linear-gradient(135deg, #059669 0%, #fbbf24 50%, #059669 100%)'
                  : isBlue
                  ? 'linear-gradient(135deg, #2563eb 0%, #fbbf24 50%, #2563eb 100%)'
                  : 'linear-gradient(135deg, #d97706 0%, #fef08a 50%, #d97706 100%)';

                const scaleWidth = stickerSize === 'standee' ? '340px' : stickerSize === 'poster' ? '460px' : '390px';

                return (
                  <div
                    id="printable-qr-sticker"
                    style={{
                      width: scaleWidth,
                      maxWidth: '100%',
                      background: '#ffffff',
                      borderRadius: '24px',
                      padding: '8px',
                      boxShadow: '0 20px 40px -15px rgba(0,0,0,0.25)',
                      backgroundImage: borderGradient,
                      boxSizing: 'border-box',
                      fontFamily: "'Sarabun', 'TH Sarabun IT9', sans-serif",
                    }}
                  >
                    <div
                      style={{
                        background: '#ffffff',
                        borderRadius: '18px',
                        padding: '18px 18px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Top Decorative Header */}
                      <div
                        style={{
                          background: headerBg,
                          color: '#ffffff',
                          width: 'calc(100% + 36px)',
                          margin: '-18px -18px 14px -18px',
                          padding: '14px 16px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          position: 'relative',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        }}
                      >
                        {/* Emblem + Org Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <img
                            src="/logo_obt_pnr.png"
                            alt="ตรา อบต."
                            style={{ width: '28px', height: '28px', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                          />
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#fef08a' }}>
                              องค์การบริหารส่วนตำบลโป่งน้ำร้อน
                            </div>
                            <div style={{ fontSize: '9px', opacity: 0.9, color: '#ffffff' }}>
                              งานสาธารณสุขและสิ่งแวดล้อม อ.ฝาง จ.เชียงใหม่
                            </div>
                          </div>
                        </div>

                        {/* Gold Recognition Ribbon */}
                        <div
                          style={{
                            background: ribbonBg,
                            color: '#78350f',
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '4px 14px',
                            borderRadius: '999px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                            letterSpacing: '0.02em',
                            marginTop: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>✅ ผ่านการรับรองสุขาภิบาลอาหาร</span>
                        </div>
                      </div>

                      {/* Store Name & Star Rating */}
                      <div style={{ width: '100%', marginBottom: '10px' }}>
                        <div style={{ color: '#f59e0b', fontSize: '13px', letterSpacing: '2px', marginBottom: '2px' }}>
                          ★★★★★
                        </div>
                        <h2
                          style={{
                            fontSize: '20px',
                            fontWeight: 800,
                            color: '#0f172a',
                            lineHeight: 1.25,
                            margin: '2px 0',
                            letterSpacing: '-0.02em',
                          }}
                        >
                          {previewQr.business?.name}
                        </h2>
                        <div
                          style={{
                            display: 'inline-block',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#475569',
                            background: '#f1f5f9',
                            padding: '2px 10px',
                            borderRadius: '6px',
                            marginTop: '2px',
                          }}
                        >
                          {previewQr.business?.business_type || 'สถานที่สะสมอาหาร'}
                        </div>
                      </div>

                      {/* Centerpiece High-Contrast QR Code */}
                      <div
                        style={{
                          background: '#ffffff',
                          padding: '12px',
                          borderRadius: '16px',
                          border: '2px solid #e2e8f0',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                          marginBottom: '10px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          position: 'relative',
                        }}
                      >
                        <QRCodeSVG
                          value={`${window.location.origin}/verify/${previewQr.verification_token}`}
                          size={150}
                          level="H"
                          includeMargin={false}
                        />
                        <div
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            color: '#0f172a',
                            marginTop: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>📱 สแกนตรวจสอบใบอนุญาตออนไลน์</span>
                        </div>
                      </div>

                      {/* License Info Pill */}
                      <div
                        style={{
                          width: '100%',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '8px 12px',
                          marginBottom: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '11px',
                        }}
                      >
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 600 }}>เลขที่ใบอนุญาต</div>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>{previewQr.license_number}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 600 }}>ใช้ได้ถึงวันที่</div>
                          <div style={{ fontWeight: 800, color: '#059669' }}>
                            {formatThaiDate(previewQr.expiry_date, { shortMonth: true })}
                          </div>
                        </div>
                      </div>

                      {/* Official Verification Footnote */}
                      <div
                        style={{
                          fontSize: '8.5px',
                          color: '#64748b',
                          lineHeight: 1.3,
                          borderTop: '1px solid #f1f5f9',
                          paddingTop: '6px',
                          width: '100%',
                        }}
                      >
                        <div>ตามพระราชบัญญัติการสาธารณสุข พ.ศ. ๒๕๓๕ และข้อบัญญัติ อบต.โป่งน้ำร้อน</div>
                        <div style={{ color: '#94a3b8', fontSize: '8px', marginTop: '1px', fontFamily: 'monospace' }}>
                          Token: {previewQr.verification_token}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
