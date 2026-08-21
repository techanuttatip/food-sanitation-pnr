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
import { formatThaiDate, formatNationalId } from '../lib/utils';
import { pdfExportService } from '../services/pdfExportService';
import { officialPdfService } from '../services/officialPdfService';
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
            margin: 10mm 15mm 8mm 15mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          html, body {
            font-family: 'TH Sarabun IT9', 'THSarabunIT9', 'THSarabunNew', 'TH Sarabun PSK', 'Sarabun', sans-serif;
            font-size: 16pt;
            line-height: 1.4;
            color: #000000;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .cert-body {
            width: 100%;
            max-width: 180mm;
            margin: 0 auto;
            padding: 0;
          }
          p { margin: 1.5px 0; }
          .font-bold { font-weight: bold; }
          .border-dotted { border-bottom: 1.5px dotted #000; }
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
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-slate-400 font-mono">
                Token: {previewLicense.verification_token}
              </span>
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
          {/* Official Standard Certificate Layout — แบบ สอ.๓ (TH SarabunIT9 size 16) */}
          {(() => {
            const thMonths = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
            const parseDateParts = (dateStr?: string) => {
              if (!dateStr) return { day: '..........', month: '........................', year: '..........' };
              const d = new Date(dateStr);
              return { day: d.getDate().toString(), month: thMonths[d.getMonth()], year: (d.getFullYear() + 543).toString() };
            };
            const issuedParts = parseDateParts(previewLicense.issued_date);
            const expiryParts = parseDateParts(previewLicense.expiry_date);
            const owner = previewLicense.business?.owner;
            const loc = previewLicense.business?.location;
            const feeRate = (previewLicense.business?.area_sqm || 50) * 15;
            const dot: React.CSSProperties = { borderBottom: '1.5px dotted #000', paddingLeft: 4, paddingRight: 4, fontWeight: 700, display: 'inline' };

            return (
              <div
                id="official-certificate-print"
                style={{
                  fontFamily: "'TH Sarabun IT9', 'THSarabunIT9', 'THSarabunNew', 'TH Sarabun PSK', 'Sarabun', sans-serif",
                  fontSize: '16pt',
                  lineHeight: 1.4,
                  color: '#000',
                  background: '#fff',
                  padding: '24px 36px',
                  maxWidth: '210mm',
                  margin: '0 auto',
                }}
              >
                {/* Form Code Top Right */}
                <div style={{ textAlign: 'right', fontSize: '16pt', fontWeight: 600 }}>แบบ สอ.๓</div>

                {/* Garuda Crest and Title */}
                <div style={{ textAlign: 'center', paddingBottom: 6 }}>
                  <img src="/garuda.png" alt="ตราครุฑ" style={{ height: 62, margin: '0 auto 2px', display: 'block', objectFit: 'contain' }} />
                  <div style={{ fontSize: '18pt', fontWeight: 700, lineHeight: 1.2 }}>ใบอนุญาต</div>
                  <div style={{ fontSize: '16pt', fontWeight: 700, lineHeight: 1.3 }}>ประกอบกิจการจัดตั้งสถานที่จำหน่ายอาหาร/สถานที่สะสมอาหาร</div>
                  <div style={{ fontSize: '10pt', letterSpacing: '0.25em', color: '#666', marginTop: 1 }}>…………………………………………………………………………………………</div>
                </div>

                {/* Book and Number */}
                <p style={{ paddingBottom: 2 }}>
                  เล่มที่<span style={dot}>{previewLicense.book_number || '๐๑'}</span>{'   '}
                  เลขที่<span style={dot}>{previewLicense.license_number || 'สส. ๐๑/๒๕๖๙'}</span>
                </p>

                {/* (๑) เจ้าพนักงานท้องถิ่นอนุญาตให้ */}
                <p style={{ textIndent: '2em' }}>
                  <strong>(๑)</strong> เจ้าพนักงานท้องถิ่นอนุญาตให้
                  <span style={dot}>{owner?.title_th || 'นาย'}{owner?.first_name || 'ผู้ประกอบการ'} {owner?.last_name || ''}</span>{' '}
                  สัญชาติ<span style={dot}>ไทย</span>
                </p>

                <p>
                  อยู่บ้านเลขที่<span style={dot}>{loc?.address_no || '...........'}</span>{' '}
                  หมู่ที่<span style={dot}>{loc?.moo || '....'}</span>{' '}
                  ตำบล<span style={dot}>โป่งน้ำร้อน</span>{' '}
                  อำเภอ<span style={dot}>ฝาง</span>{' '}
                  จังหวัด<span style={dot}>เชียงใหม่</span>
                </p>

                <p>
                  หมายเลขโทรศัพท์<span style={dot}>{owner?.phone_number || '.............................................'}</span>
                </p>

                <p>
                  ชื่อสถานประกอบกิจการ<span style={dot}>{previewLicense.business?.name || 'สถานประกอบการสะสมอาหาร'}</span>{' '}
                  ประเภท<span style={dot}>{previewLicense.business?.business_type || 'สถานที่สะสมอาหาร'}</span>
                </p>

                <p>
                  ตั้งอยู่เลขที่<span style={dot}>{loc?.address_no || '...........'}</span>{' '}
                  หมู่ที่<span style={dot}>{loc?.moo || '....'}</span>{' '}
                  ตำบล<span style={dot}>โป่งน้ำร้อน</span>{' '}
                  อำเภอ<span style={dot}>ฝาง</span>{' '}
                  จังหวัด<span style={dot}>เชียงใหม่</span>
                </p>

                <p>
                  หมายเลขโทรศัพท์<span style={dot}>{owner?.phone_number || '.............................................'}</span>
                </p>

                <p style={{ textIndent: '2em' }}>
                  เสียค่าธรรมเนียมปีละ<span style={dot}>{feeRate.toLocaleString('th-TH')}</span>บาท
                  {' '}(<span style={dot}>{feeRate.toLocaleString('th-TH')} บาทถ้วน</span>)
                </p>

                <p>
                  ตามใบเสร็จรับเงินเล่มที่<span style={dot}>๐๑</span>{' '}
                  เลขที่<span style={dot}>REC-2569-{(previewLicense.business?.id || '001').slice(-3)}</span>{' '}
                  วันที่<span style={dot}>{issuedParts.day} {issuedParts.month} พ.ศ. {issuedParts.year}</span>
                </p>

                <p style={{ textIndent: '2em', paddingTop: 2 }}>
                  <strong>(๒)</strong> ผู้รับใบอนุญาตต้องปฏิบัติตามหลักเกณฑ์ วิธีการและเงื่อนไขที่กำหนดในข้อบัญญัติเทศบาลตำบลโป่งน้ำร้อน เรื่อง สถานที่จำหน่ายอาหารและสถานที่สะสมอาหาร พ.ศ.๒๕๓๕
                </p>

                <p style={{ textIndent: '2em' }}>
                  <strong>(๓)</strong> หากปรากฏในภายหลังว่าการประกอบกิจการที่ได้รับอนุญาตนี้เป็นการขัดต่อกฎหมายอื่นที่เกี่ยวข้องโดยมิอาจแก้ไข เจ้าพนักงานท้องถิ่นอาจพิจารณาเพิกถอนการอนุญาตนี้ได้
                </p>

                <p style={{ textIndent: '2em' }}>
                  <strong>(๔)</strong> ใบอนุญาตฉบับนี้ออกให้เมื่อวันที่<span style={dot}>{issuedParts.day}</span>{' '}
                  เดือน<span style={dot}>{issuedParts.month}</span>{' '}
                  พ.ศ.<span style={dot}>{issuedParts.year}</span>
                </p>

                <p style={{ textIndent: '2em' }}>
                  <strong>(๕)</strong> ใบอนุญาตฉบับนี้สิ้นอายุวันที่<span style={dot}>{expiryParts.day}</span>{' '}
                  เดือน<span style={dot}>{expiryParts.month}</span>{' '}
                  พ.ศ.<span style={dot}>{expiryParts.year}</span>
                </p>

                {/* ลงชื่อ + QR Code */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'flex-end', paddingTop: 14, gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ padding: 3, background: '#fff', border: '1px solid #999', borderRadius: 4 }}>
                      <QRCodeSVG value={`${window.location.origin}/verify/${previewLicense.verification_token}`} size={70} level="H" />
                    </div>
                    <span style={{ fontSize: '11pt', color: '#555', marginTop: 2 }}>สแกน QR ตรวจสอบความถูกต้อง</span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: '2px 0' }}>(ลงชื่อ)....................................................เจ้าพนักงานท้องถิ่น</p>
                    <p style={{ fontWeight: 700, paddingTop: 1, margin: '2px 0' }}>( {previewLicense.approver_name || 'นายสมเกียกติ สถิตพรเจริญ'} )</p>
                    <p style={{ fontSize: '15pt', color: '#222', margin: '2px 0' }}>นายกองค์การบริหารส่วนตำบลโป่งน้ำร้อน</p>
                  </div>
                </div>

                {/* คำเตือน */}
                <div style={{ marginTop: 10, paddingTop: 6, borderTop: '1px solid #ccc', fontSize: '13pt', lineHeight: 1.35, color: '#333' }}>
                  <p style={{ margin: '1px 0' }}><strong>คำเตือน (๑)</strong> ผู้รับใบอนุญาตต้องแสดงใบอนุญาตนี้ไว้โดยเปิดเผยและเห็นได้ง่าย ณ สถานประกอบการกิจการ ตลอดเวลาที่ประกอบกิจการ หากฝ่าฝืนมีโทษปรับไม่เกิน ๕๐๐ บาท</p>
                  <p style={{ margin: '1px 0' }}><strong>(๒)</strong> หากประสงค์จะประกอบกิจการในปีต่อไปต้องยื่นคำขอต่อใบอนุญาตก่อนใบอนุญาตสิ้นอายุ</p>
                </div>
              </div>
            );
          })()}
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
