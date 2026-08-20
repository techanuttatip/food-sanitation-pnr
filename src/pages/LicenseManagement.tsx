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
import {
  Award,
  Search,
  Printer,
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
                  variant="primary"
                  size="sm"
                  onClick={() => window.print()}
                  leftIcon={<Printer className="w-4 h-4" />}
                  className="bg-gov-700 hover:bg-gov-800 font-bold shadow-md"
                >
                  สั่งพิมพ์หนังสือรับรองการแจ้ง (Print)
                </Button>
              </div>
            </div>
          }
        >
          {/* Official Standard Certificate Layout */}
          {(() => {
            const issuedParts = (() => {
              if (!previewLicense.issued_date) return { day: '.....', month: '........................', year: '........' };
              const d = new Date(previewLicense.issued_date);
              const m = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
              return { day: d.getDate().toString(), month: m[d.getMonth()], year: (d.getFullYear() + 543).toString() };
            })();

            const expiryParts = (() => {
              if (!previewLicense.expiry_date) return { day: '.....', month: '........................', year: '........' };
              const d = new Date(previewLicense.expiry_date);
              const m = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
              return { day: d.getDate().toString(), month: m[d.getMonth()], year: (d.getFullYear() + 543).toString() };
            })();

            const owner = previewLicense.business?.owner;
            const loc = previewLicense.business?.location;
            const feeRate = (previewLicense.business?.area_sqm || 50) * 15;

            return (
              <div
                id="official-certificate-print"
                className="font-sarabun p-6 sm:p-10 bg-white border border-slate-300 rounded-xl text-black leading-[1.65] text-[15pt] print:p-0 print:border-none print:shadow-none shadow-sm max-w-[210mm] mx-auto"
                style={{ fontFamily: "'THSarabunNew', 'TH Sarabun PSK', 'TH Sarabun IT9', 'Sarabun', sans-serif" }}
              >
                {/* Garuda Crest and Official Title */}
                <div className="text-center space-y-1 pb-3">
                  <img
                    src="/garuda.png"
                    alt="ตราครุฑ"
                    className="h-20 mx-auto object-contain mb-1"
                  />
                  <h2 className="text-[22pt] font-bold text-black tracking-tight leading-none">
                    หนังสือรับรองการแจ้ง
                  </h2>
                  <h3 className="text-[17pt] font-bold text-black leading-tight">
                    การประกอบกิจการสถานที่จำหน่ายอาหาร หรือสถานที่สะสมอาหาร
                  </h3>
                </div>

                {/* Book & Number */}
                <div className="flex justify-between items-center text-[15pt] pt-1 pb-2">
                  <div>
                    เล่มที่ <span className="font-bold border-b border-dotted border-black px-3 font-mono">{previewLicense.book_number || '๐๑'}</span>
                  </div>
                  <div>
                    เลขที่ <span className="font-bold border-b border-dotted border-black px-3 font-mono">{previewLicense.license_number || 'สส. 01/2569'}</span>
                  </div>
                </div>

                {/* Form Body Clauses strictly matching Official Template */}
                <div className="space-y-1.5 text-[15pt] text-black pt-2 leading-[1.6]">
                  <p className="indent-12">
                    อนุญาตให้{' '}
                    <span className="font-bold border-b border-dotted border-black px-3">
                      {owner?.title_th || 'นาย'}{owner?.first_name || 'ผู้ประกอบการ'} {owner?.last_name || 'ท้องถิ่น'}
                    </span>
                    สัญชาติ{' '}
                    <span className="font-bold border-b border-dotted border-black px-3">
                      ไทย
                    </span>
                  </p>

                  <p>
                    อยู่บ้านเลขที่{' '}
                    <span className="font-bold border-b border-dotted border-black px-3 font-mono">
                      {loc?.address_no || '๑๒๓'}
                    </span>
                    หมู่ที่{' '}
                    <span className="font-bold border-b border-dotted border-black px-3 font-mono">
                      {loc?.moo || '๑'}
                    </span>
                    ตรอก/ซอย <span className="border-b border-dotted border-black px-4">-</span>
                    ถนน <span className="border-b border-dotted border-black px-4">-</span>
                  </p>

                  <p>
                    ตำบล <span className="font-bold border-b border-dotted border-black px-3">โป่งน้ำร้อน</span>
                    อำเภอ <span className="font-bold border-b border-dotted border-black px-3">ฝาง</span>
                    จังหวัด <span className="font-bold border-b border-dotted border-black px-3">เชียงใหม่</span>
                    โทรศัพท์ <span className="font-bold border-b border-dotted border-black px-3 font-mono">{owner?.phone_number || '053-123456'}</span>
                  </p>

                  <p className="indent-12">
                    <strong>ข้อ ๑)</strong> ประกอบกิจการ ประเภท{' '}
                    <span className="font-bold border-b border-dotted border-black px-3">
                      {previewLicense.business?.business_type || 'สถานที่สะสมอาหารสำเร็จรูป'}
                    </span>
                    ( สถานที่จำหน่ายอาหาร/สะสมอาหาร )
                  </p>

                  <p>
                    โดยใช้ชื่อสถานที่ประกอบการว่า{' '}
                    <span className="font-bold border-b border-dotted border-black px-3 text-[16pt]">
                      {previewLicense.business?.name || 'สถานประกอบการสะสมอาหาร'}
                    </span>
                  </p>

                  <p>
                    ตั้งอยู่บ้านเลขที่{' '}
                    <span className="font-bold border-b border-dotted border-black px-3 font-mono">
                      {loc?.address_no || '๑๒๓'}
                    </span>
                    หมู่ที่{' '}
                    <span className="font-bold border-b border-dotted border-black px-3 font-mono">
                      {loc?.moo || '๑'} {loc?.village_name ? `(${loc.village_name})` : ''}
                    </span>
                    ตรอก/ซอย <span className="border-b border-dotted border-black px-4">-</span>
                    ถนน <span className="border-b border-dotted border-black px-4">-</span>
                  </p>

                  <p>
                    ตำบล <span className="font-bold border-b border-dotted border-black px-3">โป่งน้ำร้อน</span>
                    อำเภอ <span className="font-bold border-b border-dotted border-black px-3">ฝาง</span>
                    จังหวัด <span className="font-bold border-b border-dotted border-black px-3">เชียงใหม่</span>
                  </p>

                  <p>
                    โทรศัพท์ <span className="font-bold border-b border-dotted border-black px-3 font-mono">{owner?.phone_number || '053-123456'}</span>
                    โทรสาร <span className="border-b border-dotted border-black px-4">-</span>
                    มีพื้นที่ประกอบการ{' '}
                    <span className="font-bold border-b border-dotted border-black px-3 font-mono">
                      {previewLicense.business?.area_sqm || 50}
                    </span>{' '}
                    ตารางเมตร
                  </p>

                  <p className="indent-12">
                    <strong>ข้อ ๒)</strong> ผู้ประกอบการได้เสียค่าธรรมเนียม{' '}
                    <span className="font-bold border-b border-dotted border-black px-3 font-mono">
                      {feeRate.toLocaleString('th-TH')}
                    </span>{' '}
                    บาท/ปี ( <span className="font-bold border-b border-dotted border-black px-3">{feeRate.toLocaleString('th-TH')} บาทถ้วน</span> )
                  </p>

                  <p>
                    ใบเสร็จรับเงินเล่มที่{' '}
                    <span className="font-bold border-b border-dotted border-black px-3 font-mono">๐๑</span>
                    เลขที่{' '}
                    <span className="font-bold border-b border-dotted border-black px-3 font-mono">
                      REC-2569-{(previewLicense.business?.id || '001').slice(-3)}
                    </span>
                    ลงวันที่{' '}
                    <span className="font-bold border-b border-dotted border-black px-2">
                      {issuedParts.day}
                    </span>
                    เดือน{' '}
                    <span className="font-bold border-b border-dotted border-black px-2">
                      {issuedParts.month}
                    </span>
                    พ.ศ.{' '}
                    <span className="font-bold border-b border-dotted border-black px-2">
                      {issuedParts.year}
                    </span>
                  </p>

                  <p className="indent-12">
                    <strong>ข้อ ๓)</strong> ผู้ได้รับหนังสือรับรองการแจ้งต้องปฏิบัติตามข้อกำหนดด้านสุขลักษณะในข้อกำหนดของท้องถิ่น 
                    (เทศบัญญัติ/ข้อบังคับสุขาภิบาล/ข้อบังคับตำบล/ข้อบัญญัติกรุงเทพมหานครแล้วแต่กรณี)
                  </p>

                  <p className="indent-12">
                    <strong>ข้อ ๔)</strong> ผู้ได้รับหนังสือรับรองการแจ้งต้องปฏิบัติตามเงื่อนไขเฉพาะ ดังต่อไปนี้
                  </p>
                  <div className="pl-14 space-y-0.5 text-[14pt]">
                    <p>๔.๑ รักษาความสะอาดและสุขอนามัยสถานที่จัดเก็บอาหารตามเกณฑ์มาตรฐานสุขาภิบาล</p>
                    <p>๔.๒ ผู้สัมผัสอาหารต้องผ่านการตรวจสุขภาพและปฏิบัติตามสุขลักษณะส่วนบุคคลอย่างเคร่งครัด</p>
                  </div>

                  <p className="pt-1">
                    ใบอนุญาตฉบับนี้ให้ใช้ได้จนถึงวันที่{' '}
                    <span className="font-bold border-b border-dotted border-black px-2">
                      {expiryParts.day}
                    </span>
                    เดือน{' '}
                    <span className="font-bold border-b border-dotted border-black px-2">
                      {expiryParts.month}
                    </span>
                    พ.ศ.{' '}
                    <span className="font-bold border-b border-dotted border-black px-2">
                      {expiryParts.year}
                    </span>
                  </p>
                </div>

                {/* Sign-off Block & QR Verification Code */}
                <div className="pt-4 grid grid-cols-2 items-end mt-2">
                  {/* Left: Verification QR */}
                  <div className="flex flex-col items-center justify-center p-1 text-center">
                    <div className="p-1 bg-white rounded border border-slate-400">
                      <QRCodeSVG
                        value={`${window.location.origin}/verify/${previewLicense.verification_token}`}
                        size={85}
                        level="H"
                      />
                    </div>
                    <span className="text-[11pt] text-slate-700 mt-0.5 font-semibold">
                      สแกน QR ตรวจสอบความถูกต้อง
                    </span>
                  </div>

                  {/* Right: Signature Lines */}
                  <div className="text-center space-y-1">
                    <p className="text-[14pt]">
                      ออกให้ ณ วันที่{' '}
                      <span className="border-b border-dotted border-black px-2 font-bold">{issuedParts.day}</span>{' '}
                      เดือน{' '}
                      <span className="border-b border-dotted border-black px-2 font-bold">{issuedParts.month}</span>{' '}
                      พ.ศ.{' '}
                      <span className="border-b border-dotted border-black px-2 font-bold">{issuedParts.year}</span>
                    </p>
                    <div className="h-8 flex items-end justify-center">
                      <span className="text-slate-500 font-mono text-[13pt]">(ลงชื่อ) ............................................................</span>
                    </div>
                    <p className="font-bold text-[14pt] text-black">
                      ( {previewLicense.approver_name || 'นายสมเกียรติ สถิตพรเจริญ'} )
                    </p>
                    <p className="text-[14pt] font-semibold text-black leading-tight">
                      ตำแหน่งเจ้าพนักงานท้องถิ่น
                    </p>
                    <p className="text-[13pt] text-slate-800 leading-tight">
                      นายกองค์การบริหารส่วนตำบลโป่งน้ำร้อน
                    </p>
                  </div>
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
