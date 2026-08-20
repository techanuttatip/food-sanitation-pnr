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
              <div className="p-4 sm:p-8 bg-white border border-slate-300 rounded-xl text-slate-900 font-serif leading-relaxed text-sm print:p-0 print:border-none print:shadow-none shadow-sm">
                {/* Garuda Crest and Official Title */}
                <div className="text-center space-y-1 pb-4">
                  <img
                    src="/garuda.png"
                    alt="ตราครุฑ"
                    className="h-24 mx-auto object-contain mb-2"
                  />
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-950">
                    หนังสือรับรองการแจ้ง
                  </h2>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    การประกอบกิจการสถานที่จำหน่ายอาหาร หรือสถานที่สะสมอาหาร
                  </h3>
                </div>

                {/* Book & Number */}
                <div className="flex justify-between items-center text-xs font-semibold pt-2 pb-3 border-b border-slate-300">
                  <div>
                    เล่มที่ <span className="font-bold underline decoration-dotted px-2 font-mono">{previewLicense.book_number || '๐๑'}</span>
                  </div>
                  <div>
                    เลขที่ <span className="font-bold underline decoration-dotted px-2 font-mono">{previewLicense.license_number || 'สส. 01/2569'}</span>
                  </div>
                </div>

                {/* Form Body Clauses strictly matching Official Template */}
                <div className="space-y-2.5 text-xs sm:text-sm text-slate-900 pt-4 leading-loose">
                  <p className="indent-10">
                    อนุญาตให้{' '}
                    <strong className="underline decoration-dotted px-2 text-slate-950 font-bold">
                      {owner?.title_th || 'นาย'}{owner?.first_name || 'ผู้ประกอบการ'} {owner?.last_name || 'ท้องถิ่น'}
                    </strong>
                    สัญชาติ{' '}
                    <strong className="underline decoration-dotted px-2 text-slate-950 font-bold">
                      ไทย
                    </strong>
                  </p>

                  <p>
                    อยู่บ้านเลขที่{' '}
                    <strong className="underline decoration-dotted px-2 font-bold font-mono">
                      {loc?.address_no || '๑๒๓'}
                    </strong>
                    หมู่ที่{' '}
                    <strong className="underline decoration-dotted px-2 font-bold font-mono">
                      {loc?.moo || '๑'}
                    </strong>
                    ตรอก/ซอย <span className="underline decoration-dotted px-2 text-slate-600">-</span>
                    ถนน <span className="underline decoration-dotted px-2 text-slate-600">-</span>
                  </p>

                  <p>
                    ตำบล <strong className="underline decoration-dotted px-2 font-bold">โป่งน้ำร้อน</strong>
                    อำเภอ <strong className="underline decoration-dotted px-2 font-bold">ฝาง</strong>
                    จังหวัด <strong className="underline decoration-dotted px-2 font-bold">เชียงใหม่</strong>
                    โทรศัพท์ <strong className="underline decoration-dotted px-2 font-bold font-mono">{owner?.phone_number || '053-123456'}</strong>
                  </p>

                  <p className="indent-10">
                    <strong>ข้อ ๑)</strong> ประกอบกิจการ ประเภท{' '}
                    <strong className="underline decoration-dotted px-2 font-bold">
                      {previewLicense.business?.business_type || 'สถานที่สะสมอาหารสำเร็จรูป'}
                    </strong>
                    ( สถานที่จำหน่ายอาหาร/สะสมอาหาร )
                  </p>

                  <p>
                    โดยใช้ชื่อสถานที่ประกอบการว่า{' '}
                    <strong className="underline decoration-dotted px-2 text-slate-950 font-bold text-base">
                      {previewLicense.business?.name || 'สถานประกอบการสะสมอาหาร'}
                    </strong>
                  </p>

                  <p>
                    ตั้งอยู่บ้านเลขที่{' '}
                    <strong className="underline decoration-dotted px-2 font-bold font-mono">
                      {loc?.address_no || '๑๒๓'}
                    </strong>
                    หมู่ที่{' '}
                    <strong className="underline decoration-dotted px-2 font-bold font-mono">
                      {loc?.moo || '๑'} {loc?.village_name ? `(${loc.village_name})` : ''}
                    </strong>
                    ตรอก/ซอย <span className="underline decoration-dotted px-2 text-slate-600">-</span>
                    ถนน <span className="underline decoration-dotted px-2 text-slate-600">-</span>
                  </p>

                  <p>
                    ตำบล <strong className="underline decoration-dotted px-2 font-bold">โป่งน้ำร้อน</strong>
                    อำเภอ <strong className="underline decoration-dotted px-2 font-bold">ฝาง</strong>
                    จังหวัด <strong className="underline decoration-dotted px-2 font-bold">เชียงใหม่</strong>
                  </p>

                  <p>
                    โทรศัพท์ <strong className="underline decoration-dotted px-2 font-bold font-mono">{owner?.phone_number || '053-123456'}</strong>
                    โทรสาร <span className="underline decoration-dotted px-2 text-slate-600">-</span>
                    มีพื้นที่ประกอบการ{' '}
                    <strong className="underline decoration-dotted px-2 font-bold font-mono">
                      {previewLicense.business?.area_sqm || 50}
                    </strong>{' '}
                    ตารางเมตร
                  </p>

                  <p className="indent-10">
                    <strong>ข้อ ๒)</strong> ผู้ประกอบการได้เสียค่าธรรมเนียม{' '}
                    <strong className="underline decoration-dotted px-2 font-bold font-mono">
                      {feeRate.toLocaleString('th-TH')}
                    </strong>{' '}
                    บาท/ปี ( <strong className="underline decoration-dotted px-2 font-bold">{feeRate.toLocaleString('th-TH')} บาทถ้วน</strong> )
                  </p>

                  <p>
                    ใบเสร็จรับเงินเล่มที่{' '}
                    <strong className="underline decoration-dotted px-2 font-bold font-mono">๐๑</strong>
                    เลขที่{' '}
                    <strong className="underline decoration-dotted px-2 font-bold font-mono">
                      REC-2569-{(previewLicense.business?.id || '001').slice(-3)}
                    </strong>
                    ลงวันที่{' '}
                    <strong className="underline decoration-dotted px-2 font-bold">
                      {issuedParts.day}
                    </strong>
                    เดือน{' '}
                    <strong className="underline decoration-dotted px-2 font-bold">
                      {issuedParts.month}
                    </strong>
                    พ.ศ.{' '}
                    <strong className="underline decoration-dotted px-2 font-bold">
                      {issuedParts.year}
                    </strong>
                  </p>

                  <p className="indent-10 leading-normal">
                    <strong>ข้อ ๓)</strong> ผู้ได้รับหนังสือรับรองการแจ้งต้องปฏิบัติตามข้อกำหนดด้านสุขลักษณะในข้อกำหนดของท้องถิ่น 
                    (เทศบัญญัติ/ข้อบังคับสุขาภิบาล/ข้อบังคับตำบล/ข้อบัญญัติกรุงเทพมหานครแล้วแต่กรณี)
                  </p>

                  <p className="indent-10 leading-normal">
                    <strong>ข้อ ๔)</strong> ผู้ได้รับหนังสือรับรองการแจ้งต้องปฏิบัติตามเงื่อนไขเฉพาะ ดังต่อไปนี้
                  </p>
                  <div className="pl-12 space-y-1 text-xs text-slate-800">
                    <p>๔.๑ รักษาความสะอาดและสุขอนามัยสถานที่จัดเก็บอาหารตามเกณฑ์มาตรฐานสุขาภิบาล</p>
                    <p>๔.๒ ผู้สัมผัสอาหารต้องผ่านการตรวจสุขภาพและปฏิบัติตามสุขลักษณะส่วนบุคคลอย่างเคร่งครัด</p>
                  </div>

                  <p className="pt-2">
                    ใบอนุญาตฉบับนี้ให้ใช้ได้จนถึงวันที่{' '}
                    <strong className="underline decoration-dotted px-2 font-bold">
                      {expiryParts.day}
                    </strong>
                    เดือน{' '}
                    <strong className="underline decoration-dotted px-2 font-bold">
                      {expiryParts.month}
                    </strong>
                    พ.ศ.{' '}
                    <strong className="underline decoration-dotted px-2 font-bold">
                      {expiryParts.year}
                    </strong>
                  </p>
                </div>

                {/* Sign-off Block & QR Verification Code */}
                <div className="pt-6 grid grid-cols-2 items-end border-t border-slate-200 mt-4">
                  {/* Left: Verification QR */}
                  <div className="flex flex-col items-center justify-center p-2 text-center">
                    <div className="p-1.5 bg-white rounded-lg border border-slate-300 shadow-2xs">
                      <QRCodeSVG
                        value={`${window.location.origin}/verify/${previewLicense.verification_token}`}
                        size={100}
                        level="H"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 font-semibold">
                      สแกน QR เพื่อตรวจสอบความถูกต้อง
                    </span>
                  </div>

                  {/* Right: Signature Lines */}
                  <div className="text-center space-y-1.5">
                    <p className="text-xs">
                      ออกให้ ณ วันที่{' '}
                      <strong className="underline decoration-dotted px-1">{issuedParts.day}</strong>{' '}
                      เดือน{' '}
                      <strong className="underline decoration-dotted px-1">{issuedParts.month}</strong>{' '}
                      พ.ศ.{' '}
                      <strong className="underline decoration-dotted px-1">{issuedParts.year}</strong>
                    </p>
                    <div className="h-10 flex items-end justify-center">
                      <span className="text-slate-400 font-mono text-xs">(ลงชื่อ) ............................................................</span>
                    </div>
                    <p className="font-bold text-xs text-slate-900">
                      ( {previewLicense.approver_name || 'นายสมเกียรติ สถิตพรเจริญ'} )
                    </p>
                    <p className="text-xs font-semibold text-slate-800">
                      ตำแหน่งเจ้าพนักงานท้องถิ่น
                    </p>
                    <p className="text-[11px] text-slate-600">
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
