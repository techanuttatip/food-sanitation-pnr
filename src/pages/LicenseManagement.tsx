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
      lic.license_number.toLowerCase().includes(search.toLowerCase()) ||
      lic.business?.name.toLowerCase().includes(search.toLowerCase()) ||
      lic.business?.owner?.first_name.toLowerCase().includes(search.toLowerCase())
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
          title="แบบพิมพ์ใบอนุญาตจัดตั้งสถานที่สะสมอาหาร (เพื่อเสนอนายก อบต.โป่งน้ำร้อน ลงนาม)"
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
                  สั่งพิมพ์ใบอนุญาต (Print Certificate)
                </Button>
              </div>
            </div>
          }
        >
          {/* Certificate Print Layout */}
          <div className="p-2 bg-linear-to-b from-amber-100 via-amber-50 to-amber-200 rounded-2xl border-4 border-amber-300 shadow-inner print:p-0 print:border-none">
            <div className="bg-white p-8 sm:p-12 rounded-xl border border-amber-200 text-slate-900 space-y-6 font-sans">
              {/* Header Crest */}
              <div className="text-center space-y-2 border-b-2 border-slate-900 pb-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-linear-to-br from-gov-800 to-gov-950 flex items-center justify-center text-amber-300 shadow-lg mb-2">
                  <Building2 className="w-12 h-12" />
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
                  <span>เล่มที่ {previewLicense.book_number || '01'}</span>
                  <span>เลขที่ใบอนุญาต: {previewLicense.license_number}</span>
                </div>
              </div>

              {/* Body */}
              <div className="space-y-4 text-sm leading-relaxed text-slate-800">
                <p className="indent-8">
                  ใบอนุญาตนี้ออกให้แก่{' '}
                  <strong className="text-base text-slate-950 underline decoration-dotted">
                    {previewLicense.business?.owner?.title_th}
                    {previewLicense.business?.owner?.first_name}{' '}
                    {previewLicense.business?.owner?.last_name}
                  </strong>{' '}
                  เลขประจำตัวประชาชน{' '}
                  <span className="font-mono font-bold">
                    {formatNationalId(previewLicense.business?.owner?.national_id)}
                  </span>
                </p>

                <p className="indent-8">
                  เพื่อจัดตั้งสถานที่สะสมอาหาร ชื่อ{' '}
                  <strong className="text-base text-slate-950 underline decoration-dotted">
                    {previewLicense.business?.name}
                  </strong>{' '}
                  ประเภทกิจการ{' '}
                  <strong>{previewLicense.business?.business_type}</strong> ({previewLicense.business?.food_category})
                  ขนาดพื้นที่ใช้สอย <strong>{previewLicense.business?.area_sqm}</strong> ตารางเมตร
                </p>

                <p className="indent-8">
                  ตั้งอยู่ ณ เลขที่ {previewLicense.business?.location?.address_no} หมู่ที่{' '}
                  {previewLicense.business?.location?.moo}{' '}
                  {previewLicense.business?.location?.village_name} ตำบลโป่งน้ำร้อน อำเภอฝาง
                  จังหวัดเชียงใหม่
                </p>

                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-950 font-medium">
                  ใบอนุญาตฉบับนี้มีผลบังคับใช้ตั้งแต่วันที่{' '}
                  <strong>{formatThaiDate(previewLicense.issued_date)}</strong> ถึงวันที่{' '}
                  <strong>{formatThaiDate(previewLicense.expiry_date)}</strong>{' '}
                  (ผู้รับใบอนุญาตต้องยื่นคำขอต่ออายุล่วงหน้าก่อนใบอนุญาตสิ้นอายุไม่น้อยกว่า ๓๐ วัน)
                </div>
              </div>

              {/* Mayor Signature Line */}
              <div className="pt-8 border-t border-slate-200 grid grid-cols-2 items-center">
                <div className="flex flex-col items-center justify-center p-3 text-center">
                  <div className="p-2 bg-white rounded-lg shadow-2xs border border-slate-200">
                    <QRCodeSVG
                      value={`${window.location.origin}/verify/${previewLicense.verification_token}`}
                      size={110}
                      level="H"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 font-semibold">
                    สแกน QR เพื่อตรวจสอบความถูกต้อง
                  </span>
                </div>

                <div className="text-center space-y-2">
                  <div className="h-12 flex items-end justify-center">
                    <span className="text-slate-400 font-mono">
                      (ลงชื่อ) ............................................................
                    </span>
                  </div>
                  <p className="font-bold text-xs text-slate-900">
                    ( ............................................................ )
                  </p>
                  <p className="text-xs font-semibold text-slate-800">
                    นายกองค์การบริหารส่วนตำบลโป่งน้ำร้อน
                  </p>
                  <p className="text-[11px] text-slate-500">เจ้าพนักงานท้องถิ่น</p>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
