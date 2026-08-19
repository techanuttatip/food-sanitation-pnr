import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { licenseService } from '../services/licenseService';
import { businessService } from '../services/businessService';
import { formatThaiDate, formatNationalId } from '../lib/utils';
import { QRCodeSVG } from 'qrcode.react';
import type { License } from '../types';
import {
  QrCode,
  Search,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Building2,
  Calendar,
  User,
  Award,
  Clock,
  Shield,
  MapPin,
} from 'lucide-react';

export const PublicVerification: React.FC = () => {
  const [tokenInput, setTokenInput] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [matchedLicense, setMatchedLicense] = useState<License | null>(null);
  const [licenses, setLicenses] = useState<License[]>([]);

  useEffect(() => {
    licenseService.getLicenses().then((list) => {
      setLicenses(list);
      if (list.length > 0) {
        setTokenInput(list[0].verification_token || list[0].license_number);
        setMatchedLicense(list[0]);
        setHasSearched(true);
      }
    });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);

    const q = tokenInput.trim().toLowerCase();
    const found = licenses.find(
      (lic) =>
        (lic.verification_token && lic.verification_token.toLowerCase() === q) ||
        (lic.license_number && lic.license_number.toLowerCase().includes(q)) ||
        (lic.business?.name && lic.business.name.toLowerCase().includes(q))
    );

    setMatchedLicense(found || null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-linear-to-br from-gov-700 to-gov-900 flex items-center justify-center text-white shadow-md">
          <ShieldCheck className="w-9 h-9 text-amber-300" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          ระบบตรวจสอบใบอนุญาตจัดตั้งสถานที่สะสมอาหาร
        </h2>
        <p className="text-xs text-slate-500 max-w-lg mx-auto">
          งานสาธารณสุข องค์การบริหารส่วนตำบลโป่งน้ำร้อน อำเภอฝาง จังหวัดเชียงใหม่ • ตามพระราชบัญญัติการสาธารณสุข พ.ศ. ๒๕๓๕
        </p>
      </div>

      {/* Search Input Box */}
      <Card className="p-6 bg-white shadow-xs border border-slate-200">
        <form onSubmit={handleSearch} className="space-y-3">
          <label className="block text-xs font-bold text-slate-800">
            กรอกรหัสตรวจสอบดิจิทัล (Verification Token) หรือ เลขที่ใบอนุญาต:
          </label>
          <div className="flex gap-2">
            <Input
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="เช่น สส. 01/2569 หรือ e7k9m2p4-..."
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              className="flex-1"
              required
            />
            <Button type="submit" variant="primary" size="md" leftIcon={<QrCode className="w-4 h-4" />}>
              ตรวจสอบใบอนุญาต
            </Button>
          </div>
        </form>
      </Card>

      {/* Results */}
      {hasSearched && matchedLicense && (
        <Card className="border-2 border-emerald-500 bg-white shadow-lg overflow-hidden animate-in fade-in">
          <div className="bg-emerald-600 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-7 h-7 text-white" />
              <div>
                <h3 className="text-base font-bold">ใบอนุญาตถูกต้องตามกฎหมาย (VALID)</h3>
                <p className="text-xs text-emerald-100 font-mono">
                  เลขที่ใบอนุญาต: {matchedLicense.license_number}
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-white/20 text-white rounded-full font-bold text-xs font-mono">
              สถานะ: ปกติ
            </span>
          </div>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block border-b border-slate-200 pb-1">
                  ข้อมูลสถานประกอบการ
                </span>
                <p>ชื่อกิจการ: <strong>{matchedLicense.business?.name || 'สถานประกอบการ'}</strong></p>
                <p>ประเภท: <span>{matchedLicense.business?.business_type || 'สถานที่สะสมอาหาร'}</span></p>
                <p>ขนาดพื้นที่: <span>{matchedLicense.business?.area_sqm || 250} ตร.ม.</span></p>
                <p>ที่ตั้ง: <span>ต.โป่งน้ำร้อน อ.ฝาง จ.เชียงใหม่</span></p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block border-b border-slate-200 pb-1">
                  ข้อมูลการอนุญาต
                </span>
                <p>วันที่ออกใบอนุญาต: <strong>{formatThaiDate(matchedLicense.issued_date)}</strong></p>
                <p>วันหมดอายุ: <strong className="text-emerald-700">{formatThaiDate(matchedLicense.expiry_date)}</strong></p>
                <p>ผู้อนุมัติ: <span>{matchedLicense.approver_name || 'นายก อบต.โป่งน้ำร้อน'}</span></p>
                <p>ตำแหน่ง: <span>{matchedLicense.approver_position || 'นายกองค์การบริหารส่วนตำบลโป่งน้ำร้อน'}</span></p>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <p className="font-bold text-emerald-900">รับรองโดย งานสาธารณสุขและสิ่งแวดล้อม</p>
                <p className="text-emerald-700">องค์การบริหารส่วนตำบลโป่งน้ำร้อน อำเภอฝาง จังหวัดเชียงใหม่</p>
              </div>
              <div className="p-1.5 bg-white rounded-lg border border-emerald-300">
                <QRCodeSVG
                  value={`https://food.pongnamron.go.th/verify?token=${matchedLicense.verification_token}`}
                  size={50}
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {hasSearched && !matchedLicense && (
        <Card className="p-8 text-center bg-white border-2 border-rose-400 shadow-md space-y-3">
          <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">ไม่พบข้อมูลใบอนุญาตในระบบ</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            ไม่พบรหัส "{tokenInput}" ในฐานข้อมูล กรุณาตรวจสอบความถูกต้องของเลขที่ใบอนุญาต หรือติดต่อเจ้าหน้าที่ อบต.โป่งน้ำร้อน
          </p>
        </Card>
      )}
    </div>
  );
};
