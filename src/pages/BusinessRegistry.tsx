import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { BusinessStatusPill, RiskLevelPill } from '../components/ui/StatusPill';
import { businessService } from '../services/businessService';
import { formatThaiDate, formatPhoneNumber, formatNationalId, validateThaiNationalId } from '../lib/utils';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import type { Business, BusinessStatus } from '../types';
import { OCRScanner } from '../components/ui/OCRScanner';
import { OCRResult } from '../services/ocrService';
import {
  Store,
  Plus,
  Search,
  MapPin,
  User,
  Phone,
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  LocateFixed,
  ArrowRight,
  ShieldAlert,
  Building,
  ExternalLink,
  Trash2,
} from 'lucide-react';

export const BusinessRegistry: React.FC<{ onNavigateToWorkflow: () => void }> = ({ onNavigateToWorkflow }) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modal States
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<string[][]>([]);

  // New Survey Form State
  const [formData, setFormData] = useState({
    name: '',
    business_type: 'คลังสินค้าอาหารแช่เย็นแช่แข็ง',
    food_category: 'เนื้อสัตว์และอาหารแช่เยือกแข็ง',
    area_sqm: 250,
    owner_title: 'นาย',
    owner_first_name: '',
    owner_last_name: '',
    owner_national_id: '',
    owner_phone: '',
    owner_email: '',
    address_no: '',
    moo: '1',
    village_name: 'บ้านหัวฝาย',
    latitude: 19.932761,
    longitude: 99.171911,
  });

  const [idValidationMessage, setIdValidationMessage] = useState<string | null>(null);
  const [ocrScannerOpen, setOcrScannerOpen] = useState(false);

  const handleOcrResult = (result: OCRResult) => {
    setFormData((prev) => ({
      ...prev,
      owner_national_id: result.national_id || prev.owner_national_id,
      owner_first_name: result.first_name || prev.owner_first_name,
      owner_last_name: result.last_name || prev.owner_last_name,
    }));
    if (result.national_id) {
      handleNationalIdChange(result.national_id);
    }
    success('OCR สแกนสำเร็จ!', 'กรอกข้อมูลอัตโนมัติแล้ว');
  };

  const CSV_HEADERS = ['ชื่อสถานประกอบการ', 'ประเภทกิจการ', 'ประเภทอาหาร', 'พื้นที่(ตรม.)', 'คำนำหน้า', 'ชื่อ', 'นามสกุล', 'เลขบัตรประชาชน', 'โทรศัพท์', 'อีเมล', 'บ้านเลขที่', 'หมู่ที่', 'ชื่อหมู่บ้าน', 'ละติจูด', 'ลองจิจูด'];

  const handleDownloadTemplate = () => {
    const csvContent = "\uFEFF" + CSV_HEADERS.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'business_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    return lines.map(line => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current);
      return result.map(s => s.trim().replace(/^"|"$/g, ''));
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const parsed = parseCSV(text);
      setCsvData(parsed);
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (csvData.length <= 1) return;
    
    const raw = localStorage.getItem('food_gov_businesses_v1');
    const existing = raw ? JSON.parse(raw) : [];
    
    const rows = csvData.slice(1);
    const newBusinesses = rows.map((row, index) => {
      return {
        id: `biz-import-${Date.now()}-${index}`,
        organization_id: 'a0000000-0000-0000-0000-000000000001',
        business_code: `BS-${new Date().getFullYear()+543}-IMP${String(index+1).padStart(3,'0')}`,
        status: 'REGISTERED',
        risk_level: 'MEDIUM',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        name: row[0],
        business_type: row[1],
        food_category: row[2],
        area_sqm: Number(row[3]) || 0,
        owner: {
          title_th: row[4],
          first_name: row[5],
          last_name: row[6],
          national_id: row[7],
          phone_number: row[8],
          email: row[9],
        },
        location: {
          address_no: row[10],
          moo: row[11],
          village_name: row[12],
          latitude: Number(row[13]) || 0,
          longitude: Number(row[14]) || 0,
        }
      };
    });
    
    localStorage.setItem('food_gov_businesses_v1', JSON.stringify([...newBusinesses, ...existing]));
    success('นำเข้าข้อมูลสำเร็จ', `นำเข้าข้อมูลทั้งหมด ${newBusinesses.length} รายการ`);
    setIsImportModalOpen(false);
    setCsvData([]);
    loadData();
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await businessService.getBusinesses();
      setBusinesses(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleNationalIdChange = (val: string) => {
    const cleanVal = val.replace(/\D/g, '').slice(0, 13);
    setFormData((prev) => ({ ...prev, owner_national_id: cleanVal }));

    if (cleanVal.length === 13) {
      if (validateThaiNationalId(cleanVal)) {
        setIdValidationMessage(null);
      } else {
        setIdValidationMessage('❌ เลขประจำตัวประชาชน 13 หลักไม่ถูกต้องตามหลักการคำนวณ Checksum');
      }
    } else {
      setIdValidationMessage(null);
    }
  };

  const handleGetGPS = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData((prev) => ({
            ...prev,
            latitude: Number(pos.coords.latitude.toFixed(6)),
            longitude: Number(pos.coords.longitude.toFixed(6)),
          }));
          success('ดึงพิกัด GPS ปัจจุบันสำเร็จ', `${pos.coords.latitude}, ${pos.coords.longitude}`);
        },
        () => {
          error('ไม่สามารถเข้าถึง GPS ได้', 'ระบบจะใช้พิกัดตำบลโป่งน้ำร้อนเริ่มต้น');
        }
      );
    }
  };

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.owner_national_id.length === 13 && !validateThaiNationalId(formData.owner_national_id)) {
      error('ข้อมูลไม่ถูกต้อง', 'กรุณาตรวจสอบเลขประจำตัวประชาชน 13 หลัก');
      return;
    }

    try {
      const created = await businessService.createBusiness({
        name: formData.name,
        business_type: formData.business_type,
        food_category: formData.food_category,
        area_sqm: Number(formData.area_sqm),
        owner: {
          title_th: formData.owner_title,
          first_name: formData.owner_first_name,
          last_name: formData.owner_last_name,
          national_id: formData.owner_national_id,
          phone_number: formData.owner_phone,
          email: formData.owner_email,
        },
        location: {
          address_no: formData.address_no,
          moo: formData.moo,
          village_name: formData.village_name,
          latitude: formData.latitude,
          longitude: formData.longitude,
        },
      });

      setIsSurveyModalOpen(false);
      success('บันทึกข้อมูลสำเร็จ', `ลงทะเบียน "${created.name}" ในระบบเรียบร้อยแล้ว`);
      loadData();
    } catch (err: any) {
      error('เกิดข้อผิดพลาดในการบันทึก', err.message);
    }
  };

  const handleDeleteBusiness = async (id: string, name: string) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูล "${name}" ออกจากระบบ?`)) {
      return;
    }

    try {
      await businessService.deleteBusiness(id);
      success('ลบข้อมูลสำเร็จ', `ลบ "${name}" ออกจากระบบเรียบร้อยแล้ว`);
      loadData();
    } catch (err: any) {
      error('เกิดข้อผิดพลาดในการลบ', err.message);
    }
  };

  const filteredBusinesses = businesses.filter((b) => {
    const matchSearch =
      b.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.business_code?.toLowerCase().includes(search.toLowerCase()) ||
      b.owner?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.owner?.last_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || b.status === statusFilter;
    const matchType = !typeFilter || b.business_type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const totalCount = businesses.length;
  const licensedCount = businesses.filter((b) => b.status === 'LICENSED').length;
  const expiringCount = businesses.filter((b) => b.status === 'EXPIRING_SOON').length;
  const pendingCount = businesses.filter((b) => b.status === 'APPLICATION_PENDING' || b.status === 'REGISTERED').length;

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Store className="w-6 h-6 text-gov-700" />
            ทะเบียนสถานที่สะสมอาหาร (Food Storage Establishment Registry)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            งานสาธารณสุข อบต.โป่งน้ำร้อน อ.ฝาง • เชื่อมต่อฐานข้อมูล Supabase Database แบบ Realtime
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsImportModalOpen(true)}
            leftIcon={<FileSpreadsheet className="w-4 h-4" />}
            className="shadow-md bg-white"
          >
            นำเข้า CSV
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsSurveyModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-md"
          >
            + ลงทะเบียนสำรวจภาคสนาม
          </Button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400">สถานประกอบการในระบบ</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5 font-mono">{totalCount} <span className="text-xs text-slate-400 font-normal">แห่ง</span></p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Store className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-emerald-600">มีใบอนุญาตถูกต้อง</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5 font-mono">{licensedCount} <span className="text-xs text-emerald-400 font-normal">แห่ง</span></p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5 m-2.5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-amber-600">ใกล้หมดอายุ (30 วัน)</p>
            <p className="text-2xl font-black text-amber-600 mt-0.5 font-mono">{expiringCount} <span className="text-xs text-amber-400 font-normal">แห่ง</span></p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600">
            <AlertTriangle className="w-5 h-5 m-2.5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-sky-600">มีคำขอ / รอตรวจ</p>
            <p className="text-2xl font-black text-sky-600 mt-0.5 font-mono">{pendingCount} <span className="text-xs text-sky-400 font-normal">แห่ง</span></p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600">
            <FileSpreadsheet className="w-5 h-5 m-2.5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-white shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="ค้นหาชื่อสถานประกอบการ, รหัส FS, หรือชื่อเจ้าของ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'ทุกสถานะใบอนุญาต' },
              { value: 'LICENSED', label: '🟢 มีใบอนุญาตปกติ (LICENSED)' },
              { value: 'EXPIRING_SOON', label: '🟡 ใบอนุญาตใกล้หมดอายุ (EXPIRING_SOON)' },
              { value: 'APPLICATION_PENDING', label: '🟠 อยู่ระหว่างยื่นคำขอ (APPLICATION_PENDING)' },
              { value: 'REGISTERED', label: '🔵 ลงทะเบียนแล้ว (REGISTERED)' },
              { value: 'SURVEYED', label: '⚪ สำรวจพบภาคสนาม (SURVEYED)' },
              { value: 'EXPIRED', label: '🔴 ใบอนุญาตหมดอายุ (EXPIRED)' },
            ]}
          />
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { value: '', label: 'ทุกประเภทกิจการ' },
              { value: 'คลังสินค้าอาหารแช่เย็นแช่แข็ง', label: 'คลังสินค้าอาหารแช่เย็นแช่แข็ง' },
              { value: 'โรงสะสมข้าวสารและเมล็ดพืช', label: 'โรงสะสมข้าวสารและเมล็ดพืช' },
              { value: 'ศูนย์กระจายสินค้าเนื้อสัตว์แปรรูป', label: 'ศูนย์กระจายสินค้าเนื้อสัตว์แปรรูป' },
              { value: 'สถานที่สะสมอาหารสำเร็จรูป', label: 'สถานที่สะสมอาหารสำเร็จรูป' },
            ]}
          />
        </div>
      </Card>

      {/* Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredBusinesses.map((b) => {
          const statusColor =
            b.status === 'LICENSED'
              ? 'border-t-emerald-500'
              : b.status === 'EXPIRING_SOON'
              ? 'border-t-amber-500'
              : b.status === 'APPLICATION_PENDING'
              ? 'border-t-sky-500'
              : b.status === 'EXPIRED'
              ? 'border-t-rose-500'
              : 'border-t-slate-400';

          return (
            <Card
              key={b.id}
              className={`border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 border-t-4 ${statusColor} flex flex-col justify-between overflow-hidden bg-white group`}
            >
              <div className="p-5 space-y-4">
                {/* Top Badge Row */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {b.business_code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1.5 leading-snug group-hover:text-gov-700 transition-colors">
                      {b.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{b.business_type}</p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    <BusinessStatusPill status={b.status} />
                    <RiskLevelPill level={b.risk_level} />
                  </div>
                </div>

                {/* Info Block */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-500">ผู้ประกอบการ:</span>
                    <strong className="font-semibold text-slate-900 truncate">
                      {b.owner?.title_th}{b.owner?.first_name} {b.owner?.last_name}
                    </strong>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-500">โทรศัพท์:</span>
                    <span className="font-mono text-gov-800 font-semibold">{formatPhoneNumber(b.owner?.phone_number)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-500">ที่ตั้ง:</span>
                    <span className="truncate">ม.{b.location?.moo || '1'} {b.location?.village_name || 'โป่งน้ำร้อน'} ({b.area_sqm} ตร.ม.)</span>
                  </div>

                  {b.current_license && (
                    <div className="pt-2 mt-2 border-t border-slate-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-medium text-[11px]">
                        <Award className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{b.current_license.license_number}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        หมดอายุ {formatThaiDate(b.current_license.expiry_date, { shortMonth: true })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedBusiness(b)}
                  className="text-xs"
                >
                  ดูข้อมูลเต็ม
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onNavigateToWorkflow()}
                  leftIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  ยื่นคำขอ
                </Button>
                <button
                  type="button"
                  title="ลบสถานประกอบการออกจาก Supabase"
                  onClick={() => handleDeleteBusiness(b.id, b.name)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredBusinesses.length === 0 && (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-4">
          <Store className="w-12 h-12 text-slate-300 mx-auto" />
          <div>
            <p className="text-base font-bold text-slate-800">ยังไม่มีข้อมูลสถานประกอบการในฐานข้อมูล</p>
            <p className="text-xs text-slate-400 mt-1">เริ่มต้นบันทึกข้อมูลสำรวจภาคสนามลงในระบบ Supabase</p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsSurveyModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            + ลงทะเบียนสถานประกอบการแรก
          </Button>
        </div>
      )}

      {/* Dossier Modal */}
      {selectedBusiness && (
        <Modal
          isOpen={!!selectedBusiness}
          onClose={() => setSelectedBusiness(null)}
          title={`รายละเอียดสถานประกอบการ: ${selectedBusiness.name}`}
          description={`รหัสทะเบียน: ${selectedBusiness.business_code}`}
          size="lg"
          footer={
            <div className="flex justify-between items-center w-full">
              <span className="text-xs text-slate-400">
                ลงทะเบียนเมื่อ {formatThaiDate(selectedBusiness.created_at)}
              </span>
              <Button variant="secondary" size="sm" onClick={() => setSelectedBusiness(null)}>
                ปิดหน้าต่าง
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-slate-400 block">สถานะปัจจุบัน:</span>
                <div className="mt-1">
                  <BusinessStatusPill status={selectedBusiness.status} />
                </div>
              </div>
              <div>
                <span className="text-slate-400 block">ระดับความเสี่ยงสาธารณสุข:</span>
                <div className="mt-1">
                  <RiskLevelPill level={selectedBusiness.risk_level} />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <User className="w-4 h-4 text-gov-700" />
                ข้อมูลผู้ประกอบการ / เจ้าของ
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                <p>
                  <span className="text-slate-400">ชื่อ-สกุล:</span>{' '}
                  <strong>{selectedBusiness.owner?.title_th}{selectedBusiness.owner?.first_name} {selectedBusiness.owner?.last_name}</strong>
                </p>
                <p>
                  <span className="text-slate-400">เลขบัตร ปชช.:</span>{' '}
                  <strong className="font-mono">{formatNationalId(selectedBusiness.owner?.national_id, true)}</strong>
                </p>
                <p>
                  <span className="text-slate-400">เบอร์โทรศัพท์:</span>{' '}
                  <strong className="font-mono text-gov-700">{formatPhoneNumber(selectedBusiness.owner?.phone_number)}</strong>
                </p>
                <p>
                  <span className="text-slate-400">อีเมล:</span>{' '}
                  <span>{selectedBusiness.owner?.email || '-'}</span>
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gov-700" />
                สถานที่ตั้งและพิกัดภูมิศาสตร์
              </h4>
              <p className="text-slate-700">
                เลขที่ {selectedBusiness.location?.address_no} หมู่ที่ {selectedBusiness.location?.moo || '1'}{' '}
                {selectedBusiness.location?.village_name || 'โป่งน้ำร้อน'} ตำบลโป่งน้ำร้อน อำเภอฝาง จังหวัดเชียงใหม่
              </p>
              <div className="flex items-center gap-4 text-emerald-700 font-mono font-semibold pt-1">
                <span>ละติจูด: {selectedBusiness.location?.latitude || 19.932761}</span>
                <span>ลองจิจูด: {selectedBusiness.location?.longitude || 99.171911}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Field Survey Modal */}
      {isSurveyModalOpen && (
        <Modal
          isOpen={isSurveyModalOpen}
          onClose={() => setIsSurveyModalOpen(false)}
          title="ลงทะเบียนสำรวจสถานที่สะสมอาหารภาคสนาม"
          description="แบบสำรวจจัดเก็บข้อมูลผู้ประกอบการและพิกัดสถานที่จริง ต.โป่งน้ำร้อน อ.ฝาง"
          size="lg"
        >
          <form onSubmit={handleCreateBusiness} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="ชื่อสถานที่สะสมอาหาร / กิจการ"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="เช่น คลังสินค้าอาหารสด โป่งน้ำร้อน"
              />
              <Input
                label="ขนาดพื้นที่ใช้สอย (ตารางเมตร)"
                type="number"
                required
                value={formData.area_sqm}
                onChange={(e) => setFormData({ ...formData, area_sqm: Number(e.target.value) })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="ประเภทกิจการสะสมอาหาร"
                value={formData.business_type}
                onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                options={[
                  { value: 'คลังสินค้าอาหารแช่เย็นแช่แข็ง', label: 'คลังสินค้าอาหารแช่เย็นแช่แข็ง' },
                  { value: 'โรงสะสมข้าวสารและเมล็ดพืช', label: 'โรงสะสมข้าวสารและเมล็ดพืช' },
                  { value: 'ศูนย์กระจายสินค้าเนื้อสัตว์แปรรูป', label: 'ศูนย์กระจายสินค้าเนื้อสัตว์แปรรูป' },
                  { value: 'สถานที่สะสมอาหารสำเร็จรูป', label: 'สถานที่สะสมอาหารสำเร็จรูป' },
                ]}
              />
              <Input
                label="หมวดหมู่อาหารหลัก"
                value={formData.food_category}
                onChange={(e) => setFormData({ ...formData, food_category: e.target.value })}
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-gov-700" />
                  ข้อมูลผู้ประกอบการ / เจ้าของ
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOcrScannerOpen(true)}
                  className="bg-white"
                >
                  📷 สแกน OCR บัตรประชาชน
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  label="คำนำหน้า"
                  value={formData.owner_title}
                  onChange={(e) => setFormData({ ...formData, owner_title: e.target.value })}
                />
                <Input
                  label="ชื่อจริง"
                  required
                  value={formData.owner_first_name}
                  onChange={(e) => setFormData({ ...formData, owner_first_name: e.target.value })}
                />
                <Input
                  label="นามสกุล"
                  required
                  value={formData.owner_last_name}
                  onChange={(e) => setFormData({ ...formData, owner_last_name: e.target.value })}
                />
              </div>

              <div>
                <Input
                  label="เลขประจำตัวประชาชน 13 หลัก"
                  required
                  value={formData.owner_national_id}
                  onChange={(e) => handleNationalIdChange(e.target.value)}
                  placeholder="X-XXXX-XXXXX-XX-X"
                />
                {idValidationMessage && (
                  <p className="text-[11px] font-semibold text-rose-600 mt-1">{idValidationMessage}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="เบอร์โทรศัพท์มือถือ"
                  required
                  value={formData.owner_phone}
                  onChange={(e) => setFormData({ ...formData, owner_phone: e.target.value })}
                  placeholder="08X-XXX-XXXX"
                />
                <Input
                  label="อีเมล (ถ้ามี)"
                  value={formData.owner_email}
                  onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gov-700" />
                ที่ตั้งและพิกัด GPS ต.โป่งน้ำร้อน อ.ฝาง
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  label="เลขที่ตั้ง"
                  required
                  value={formData.address_no}
                  onChange={(e) => setFormData({ ...formData, address_no: e.target.value })}
                  placeholder="เช่น 123/4"
                />
                <Input
                  label="หมู่ที่"
                  required
                  value={formData.moo}
                  onChange={(e) => setFormData({ ...formData, moo: e.target.value })}
                />
                <Input
                  label="ชื่อหมู่บ้าน"
                  required
                  value={formData.village_name}
                  onChange={(e) => setFormData({ ...formData, village_name: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2">
                <Input
                  label="ละติจูด (Lat)"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) })}
                />
                <Input
                  label="ลองจิจูด (Lng)"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) })}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGetGPS}
                  leftIcon={<LocateFixed className="w-4 h-4" />}
                  className="mt-5 shrink-0"
                >
                  ดึง GPS ปัจจุบัน
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsSurveyModalOpen(false)}>
                ยกเลิก
              </Button>
              <Button type="submit" variant="primary" size="sm" leftIcon={<CheckCircle2 className="w-4 h-4" />}>
                บันทึกลงทะเบียนสถานที่
              </Button>
            </div>
          </form>
        </Modal>
      )}

      <OCRScanner
        isOpen={ocrScannerOpen}
        onClose={() => setOcrScannerOpen(false)}
        onResult={handleOcrResult}
      />

      {/* Import Modal */}
      {isImportModalOpen && (
        <Modal
          isOpen={isImportModalOpen}
          onClose={() => { setIsImportModalOpen(false); setCsvData([]); }}
          title="นำเข้าข้อมูลจาก CSV"
          description="อัปโหลดไฟล์ .csv เพื่อนำเข้าข้อมูลสถานประกอบการหลายรายการพร้อมกัน"
          size="xl"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-sm">
                <p className="font-bold text-slate-800">1. ดาวน์โหลดไฟล์ต้นแบบ</p>
                <p className="text-xs text-slate-500">กรอกข้อมูลตามรูปแบบในไฟล์ (ห้ามลบ/แก้หัวคอลัมน์)</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate} leftIcon={<FileSpreadsheet className="w-4 h-4" />}>
                ดาวน์โหลด Template .csv
              </Button>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-800 text-sm mb-2">2. อัปโหลดไฟล์ที่กรอกข้อมูลแล้ว</p>
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gov-50 file:text-gov-700 hover:file:bg-gov-100"
              />
            </div>

            {csvData.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 p-2 text-xs font-bold text-slate-700 border-b border-slate-200">
                  ตัวอย่างข้อมูล (พบ {csvData.length - 1} รายการ) - แสดง 5 รายการแรก
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        {csvData[0].slice(0, 5).map((h, i) => (
                          <th key={i} className="px-3 py-2 border-b">{h}</th>
                        ))}
                        {csvData[0].length > 5 && <th className="px-3 py-2 border-b">...</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.slice(1, 6).map((row, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-slate-50">
                          {row.slice(0, 5).map((cell, j) => (
                            <td key={j} className="px-3 py-2 truncate max-w-[150px]">{cell}</td>
                          ))}
                          {row.length > 5 && <td className="px-3 py-2 text-slate-400">...</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="secondary" size="sm" onClick={() => { setIsImportModalOpen(false); setCsvData([]); }}>
                ยกเลิก
              </Button>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleImport} 
                disabled={csvData.length <= 1}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                ยืนยันการนำเข้าข้อมูล
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
