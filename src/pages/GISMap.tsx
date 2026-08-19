import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Select, Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { BusinessStatusPill, RiskLevelPill } from '../components/ui/StatusPill';
import { Modal } from '../components/ui/Modal';
import { DEMO_BUSINESSES } from '../lib/supabase';
import type { Business } from '../types';
import { formatPhoneNumber, formatThaiDate } from '../lib/utils';
import {
  MapPin,
  Layers,
  Navigation,
  Store,
  Search,
  Eye,
  Shield,
  Phone,
  Compass,
} from 'lucide-react';

export const GISMap: React.FC = () => {
  const [selectedMoo, setSelectedMoo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedPin, setSelectedPin] = useState<Business | null>(null);

  const filteredEstablishments = DEMO_BUSINESSES.filter((b) => {
    const matchMoo = !selectedMoo || b.location?.moo === selectedMoo;
    const matchStatus = !statusFilter || b.status === statusFilter;
    const matchSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.business_code.toLowerCase().includes(search.toLowerCase()) ||
      b.owner?.first_name.toLowerCase().includes(search.toLowerCase());
    return matchMoo && matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gov-700" />
            ระบบแผนที่ภูมิสารสนเทศ (GIS / PostGIS Map Engine)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            แสดงพิกัดที่ตั้งสถานประกอบการสะสมอาหารแยกตามสีสถานะใบอนุญาตและเขตหมู่บ้านใน อบต. ดอนแก้วพัฒนา
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="ค้นหาชื่อร้าน, รหัสสถานประกอบการ, หรือชื่อเจ้าของ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
          <Select
            value={selectedMoo}
            onChange={(e) => setSelectedMoo(e.target.value)}
            options={[
              { value: '', label: 'ทุกหมู่บ้าน (ม.1 - ม.8)' },
              { value: '1', label: 'หมู่ที่ 1 บ้านหัวฝาย' },
              { value: '2', label: 'หมู่ที่ 2 บ้านดอนแก้วเหนือ' },
              { value: '3', label: 'หมู่ที่ 3 บ้านกลางดอน' },
              { value: '4', label: 'หมู่ที่ 4 บ้านศาลา' },
              { value: '5', label: 'หมู่ที่ 5 บ้านดอนแก้วใต้' },
              { value: '6', label: 'หมู่ที่ 6 บ้านท่าหลุก' },
              { value: '7', label: 'หมู่ที่ 7 บ้านใหม่พัฒนา' },
              { value: '8', label: 'หมู่ที่ 8 บ้านสันเหมือง' },
            ]}
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'ทุกสีสถานะใบอนุญาต (5 Color Pins)' },
              { value: 'LICENSED', label: '🟢 สีเขียว: ใบอนุญาตปกติ (มีผลบังคับใช้)' },
              { value: 'EXPIRING_SOON', label: '🟡 สีเหลือง: ใบอนุญาตใกล้หมดอายุ (30 วัน)' },
              { value: 'APPLICATION_PENDING', label: '🟠 สีส้ม: รอตรวจสุขาภิบาล / มีคำขอ' },
              { value: 'EXPIRED', label: '🔴 สีแดง: ใบอนุญาตหมดอายุ / มีปัญหา' },
              { value: 'UNREGISTERED', label: '⚪ สีเทา: สำรวจพบ / ยังไม่ลงทะเบียน' },
            ]}
          />
        </div>
      </Card>

      {/* Main Interactive Map Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="overflow-hidden border border-slate-200 shadow-md">
            <div className="relative h-[520px] bg-slate-900 overflow-hidden flex items-center justify-center">
              {/* Radial Grid Map Background */}
              <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" />
              
              {/* Simulated Municipal Boundary Polygonal Lines */}
              <div className="absolute w-[680px] h-[400px] border-2 border-dashed border-sky-400/40 rounded-[60px] rotate-6 pointer-events-none" />
              <div className="absolute w-[900px] h-[2px] bg-sky-500/30 rotate-30 pointer-events-none" />
              <div className="absolute w-[900px] h-[2px] bg-emerald-500/20 -rotate-25 pointer-events-none" />

              {/* Village Labels */}
              <span className="absolute top-12 left-16 text-[10px] font-mono font-bold text-sky-400/60 tracking-wider">
                [เขต ม.1 บ้านหัวฝาย]
              </span>
              <span className="absolute top-16 right-20 text-[10px] font-mono font-bold text-sky-400/60 tracking-wider">
                [เขต ม.2 บ้านดอนแก้วเหนือ]
              </span>
              <span className="absolute bottom-20 left-24 text-[10px] font-mono font-bold text-sky-400/60 tracking-wider">
                [เขต ม.3 บ้านกลางดอน]
              </span>
              <span className="absolute bottom-16 right-24 text-[10px] font-mono font-bold text-sky-400/60 tracking-wider">
                [เขต ม.5 บ้านดอนแก้วใต้]
              </span>

              {/* Pins on the Map */}
              {filteredEstablishments.map((b, idx) => {
                const positions = [
                  { top: '32%', left: '46%' },
                  { top: '68%', left: '60%' },
                  { top: '24%', left: '26%' },
                  { top: '50%', left: '32%' },
                ];
                const pos = positions[idx % positions.length];

                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedPin(b)}
                    className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                    style={{ top: pos.top, left: pos.left }}
                  >
                    <div className="flex flex-col items-center">
                      {/* Tooltip Popup on Hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 absolute bottom-full mb-2 px-3 py-2 rounded-xl bg-slate-950/95 text-white text-xs whitespace-nowrap shadow-2xl border border-slate-700 pointer-events-none z-30">
                        <p className="font-bold text-amber-300">{b.name}</p>
                        <p className="text-slate-300 text-[11px]">
                          {b.business_type} • ม.{b.location?.moo} {b.location?.village_name}
                        </p>
                        <p className="text-slate-400 text-[10px] font-mono mt-0.5">
                          GPS: {b.location?.latitude}, {b.location?.longitude}
                        </p>
                      </div>

                      {/* Pin Glow & Icon */}
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-white shadow-xl border-2 border-white transition-all transform group-hover:scale-125 ${
                          b.status === 'LICENSED'
                            ? 'bg-emerald-500 ring-4 ring-emerald-500/30'
                            : b.status === 'EXPIRING_SOON'
                            ? 'bg-amber-500 ring-4 ring-amber-500/30 animate-pulse'
                            : b.status === 'APPLICATION_PENDING' || b.status === 'REGISTERED'
                            ? 'bg-sky-500 ring-4 ring-sky-500/30'
                            : b.status === 'EXPIRED' || b.status === 'REVOKED'
                            ? 'bg-rose-500 ring-4 ring-rose-500/30'
                            : 'bg-slate-400 ring-4 ring-slate-400/30'
                        }`}
                      >
                        <Store className="w-4 h-4" />
                      </div>
                      <span className="mt-1 px-2 py-0.5 rounded-full bg-slate-950/90 text-[10px] text-white font-medium border border-slate-700 shadow-md">
                        {b.name.slice(0, 16)}...
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Map Floating HUD */}
              <div className="absolute top-4 left-4 p-3.5 rounded-xl bg-slate-950/90 border border-slate-700 text-white text-xs backdrop-blur-md space-y-1 shadow-lg">
                <p className="font-bold flex items-center gap-1.5 text-sky-400">
                  <Navigation className="w-4 h-4" />
                  พิกัดศูนย์กลาง อบต. ดอนแก้วพัฒนา (18.8682° N, 98.9654° E)
                </p>
                <p className="text-[11px] text-slate-300">
                  แสดงหมุดพิกัด: <strong>{filteredEstablishments.length}</strong> แห่ง (จากทั้งหมด {DEMO_BUSINESSES.length} แห่ง)
                </p>
              </div>

              <div className="absolute bottom-4 right-4 p-2 rounded-lg bg-slate-950/80 border border-slate-700 text-slate-400 text-[10px] font-mono">
                PostGIS • WGS 84 • SRID 4326
              </div>
            </div>
          </Card>
        </div>

        {/* Right Legend & Summary Card */}
        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-gov-700" />
              คำอธิบายสีหมุด GIS (Status Pin Legend)
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-emerald-950 font-medium">🟢 ใบอนุญาตปกติ (LICENSED)</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-amber-50 border border-amber-200">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500 shrink-0" />
                <span className="text-amber-950 font-medium">🟡 ใบอนุญาตใกล้หมดอายุ (30 วัน)</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-sky-50 border border-sky-200">
                <span className="w-3.5 h-3.5 rounded-full bg-sky-500 shrink-0" />
                <span className="text-sky-950 font-medium">🟠 มีคำขอ / รอตรวจสุขาภิบาล</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-rose-50 border border-rose-200">
                <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shrink-0" />
                <span className="text-rose-950 font-medium">🔴 ใบอนุญาตหมดอายุ / มีปัญหา</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="w-3.5 h-3.5 rounded-full bg-slate-400 shrink-0" />
                <span className="text-slate-800 font-medium">⚪ สำรวจพบ / ยังไม่ลงทะเบียน</span>
              </div>
            </div>
          </Card>

          <Card className="p-4 space-y-2">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-gov-700" />
              การกระจายตัวตามหมู่บ้าน
            </h4>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-1.5 flex justify-between">
                <span>ม.1 บ้านหัวฝาย</span>
                <span className="font-bold text-slate-800">1 แห่ง</span>
              </div>
              <div className="py-1.5 flex justify-between">
                <span>ม.2 บ้านดอนแก้วเหนือ</span>
                <span className="font-bold text-slate-800">1 แห่ง</span>
              </div>
              <div className="py-1.5 flex justify-between">
                <span>ม.3 บ้านกลางดอน</span>
                <span className="font-bold text-slate-800">1 แห่ง</span>
              </div>
              <div className="py-1.5 flex justify-between">
                <span>ม.5 บ้านดอนแก้วใต้</span>
                <span className="font-bold text-slate-800">1 แห่ง</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Pin Click Inspection Modal */}
      {selectedPin && (
        <Modal
          isOpen={!!selectedPin}
          onClose={() => setSelectedPin(null)}
          title={`ข้อมูลสถานประกอบการ: ${selectedPin.name}`}
          description={`รหัสสถานประกอบการ: ${selectedPin.business_code}`}
          size="md"
          footer={
            <Button variant="secondary" size="sm" onClick={() => setSelectedPin(null)}>
              ปิดหน้าต่าง
            </Button>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-slate-400 block">สถานะ:</span>
                <div className="mt-0.5">
                  <BusinessStatusPill status={selectedPin.status} />
                </div>
              </div>
              <div>
                <span className="text-slate-400 block">ระดับความเสี่ยง:</span>
                <div className="mt-0.5">
                  <RiskLevelPill level={selectedPin.risk_level} />
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 space-y-1.5">
              <p>
                <span className="text-slate-400">ผู้ประกอบการ:</span>{' '}
                <strong className="text-slate-900">
                  {selectedPin.owner?.title_th}
                  {selectedPin.owner?.first_name} {selectedPin.owner?.last_name}
                </strong>
              </p>
              <p>
                <span className="text-slate-400">เบอร์ติดต่อ:</span>{' '}
                <strong className="text-gov-700 font-mono">
                  {formatPhoneNumber(selectedPin.owner?.phone_number)}
                </strong>
              </p>
              <p>
                <span className="text-slate-400">ประเภท:</span> {selectedPin.business_type} (
                {selectedPin.area_sqm} ตร.ม.)
              </p>
              <p>
                <span className="text-slate-400">ที่ตั้ง:</span> เลขที่{' '}
                {selectedPin.location?.address_no} หมู่ที่ {selectedPin.location?.moo}{' '}
                {selectedPin.location?.village_name}
              </p>
              <p className="font-mono text-emerald-700 font-bold">
                📍 พิกัด GPS: {selectedPin.location?.latitude}, {selectedPin.location?.longitude}
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
