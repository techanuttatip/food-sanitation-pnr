import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { businessService } from '../../services/businessService';
import { appointmentService } from '../../services/appointmentService';
import { inspectionService } from '../../services/inspectionService';
import { licenseService } from '../../services/licenseService';
import { OCRScanner } from '../../components/ui/OCRScanner';
import type { Business } from '../../types';
import { formatThaiDate } from '../../lib/utils';
import {
  Store,
  ClipboardCheck,
  Calendar,
  MapPin,
  QrCode,
  Phone,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
  Search,
  Sparkles,
  User,
  LogOut,
  RefreshCw,
  ChevronRight,
  Plus,
  Send,
  Home,
  Monitor,
  PenTool,
  RotateCcw,
  Building2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

const STANDARD_CHECKLIST_ITEMS = [
  { item_code: 'SEC-01', title_th: 'โครงสร้างอาคารมั่นคง แข็งแรง สะอาด ไม่อยู่ใกล้แหล่งมลพิษ', max_score: 10 },
  { item_code: 'SEC-02', title_th: 'พื้น ผนัง เพดาน ผิวเรียบ ไม่ดูดซับน้ำ ทำความสะอาดง่าย', max_score: 10 },
  { item_code: 'SEC-03', title_th: 'การระบายอากาศและแสงสว่างเพียงพอ ไม่มีกลิ่นอับ', max_score: 10 },
  { item_code: 'SEC-04', title_th: 'มีระบบป้องกันหนู แมลงสาบ และสัตว์นำโรคอย่างมิดชิด', max_score: 10 },
  { item_code: 'SEC-05', title_th: 'การจัดเก็บอาหาร วางบนชั้น/พาเลท สูงจากพื้นอย่างน้อย ๑๕ ซม.', max_score: 10 },
  { item_code: 'SEC-06', title_th: 'ควบคุมอุณหภูมิห้องเย็น (แช่เย็น 0-4°C / แช่แข็งต่ำกว่า -18°C)', max_score: 10 },
  { item_code: 'SEC-07', title_th: 'น้ำใช้สะอาด ได้เกณฑ์มาตรฐานสุขาภิบาลน้ำ', max_score: 10 },
  { item_code: 'SEC-08', title_th: 'การจัดการขยะ ถังขยะปิดมิดชิด และมีบ่อดักไขมัน/ระบบบำบัดน้ำเสีย', max_score: 10 },
  { item_code: 'SEC-09', title_th: 'สุขอนามัยผู้สัมผัสอาหาร (สวมหมวกคลุมผม ผ้ากันเปื้อน ล้างมือ)', max_score: 10 },
  { item_code: 'SEC-10', title_th: 'การแยกประเภทอาหารสด อาหารแห้ง และสารเคมีอย่างชัดเจน', max_score: 10 },
];

export const MobileFieldApp: React.FC<{ onSwitchToDesktop?: () => void }> = ({ onSwitchToDesktop }) => {
  const { user, loginWithPassword, signOut } = useAuth();
  const { success, error, info } = useToast();

  const [activeTab, setActiveTab] = useState<'home' | 'schedule' | 'inspect' | 'survey' | 'verify'>('home');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Field Login state if accessed directly on mobile
  const [loginUser, setLoginUser] = useState('inspect');
  const [loginPass, setLoginPass] = useState('Admin@123456');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Inspection form state
  const [selectedBizId, setSelectedBizId] = useState('');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [defects, setDefects] = useState('');
  const [inspectorName, setInspectorName] = useState('');
  const [isSubmittingInspect, setIsSubmittingInspect] = useState(false);

  // Digital Signature Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSigned, setIsSigned] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  // Survey form state
  const [surveyName, setSurveyName] = useState('');
  const [surveyType, setSurveyType] = useState('คลังสินค้าอาหารแช่แข็ง');
  const [surveyArea, setSurveyArea] = useState('120');
  const [surveyOwnerName, setSurveyOwnerName] = useState('');
  const [surveyNationalId, setSurveyNationalId] = useState('');
  const [surveyPhone, setSurveyPhone] = useState('');
  const [surveyMoo, setSurveyMoo] = useState('3');
  const [surveyVillage, setSurveyVillage] = useState('บ้านโป่งน้ำร้อน');
  const [surveyLat, setSurveyLat] = useState('19.932761');
  const [surveyLng, setSurveyLng] = useState('99.171911');
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [isOcrOpen, setIsOcrOpen] = useState(false);

  // Verification state
  const [verifyToken, setVerifyToken] = useState('');
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [apts, bizs] = await Promise.all([
        appointmentService.getAppointments(),
        businessService.getBusinesses(),
      ]);
      setAppointments(apts);
      setBusinesses(bizs);
      if (bizs.length > 0 && !selectedBizId) {
        setSelectedBizId(bizs[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
      setInspectorName(`${user.first_name} ${user.last_name}`);
    }
    const initialScores: Record<string, number> = {};
    STANDARD_CHECKLIST_ITEMS.forEach((it) => {
      initialScores[it.item_code] = it.max_score;
    });
    setScores(initialScores);
  }, [user]);

  const handleFieldLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      await loginWithPassword(loginUser, loginPass);
      success('เข้าสู่ระบบภาคสนามสำเร็จ 📱', 'ยินดีต้อนรับเจ้าหน้าที่ตรวจสุขาภิบาล');
    } catch (err: any) {
      error('เข้าสู่ระบบไม่สำเร็จ', err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // GPS Location Handler
  const handleGetGPS = () => {
    if (!navigator.geolocation) {
      error('อุปกรณ์ไม่รองรับ GPS', 'กรุณากรอกพิกัดด้วยตนเอง');
      return;
    }
    setIsLocatingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSurveyLat(pos.coords.latitude.toFixed(6));
        setSurveyLng(pos.coords.longitude.toFixed(6));
        setIsLocatingGPS(false);
        success('ดึงพิกัด GPS สำเร็จ 📍', `ละติจูด: ${pos.coords.latitude.toFixed(4)}, ลองจิจูด: ${pos.coords.longitude.toFixed(4)}`);
      },
      () => {
        setIsLocatingGPS(false);
        info('ใช้พิกัดจำลองโป่งน้ำร้อน', 'ไม่สามารถเข้าถึง GPS จริงได้');
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  // Signature Canvas Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setIsSigned(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#059669';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsSigned(false);
  };

  // Submit Mobile Inspection
  const handleSubmitInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBizId) {
      error('กรุณาเลือกสถานประกอบการ');
      return;
    }

    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    const result = totalScore >= 80 ? 'PASSED' : totalScore >= 60 ? 'CONDITIONAL' : 'FAILED';
    const targetBiz = businesses.find((b) => b.id === selectedBizId);

    setIsSubmittingInspect(true);
    try {
      await inspectionService.submitInspection({
        application_id: `app-${selectedBizId}`,
        business_id: selectedBizId,
        business_name: targetBiz?.name || 'สถานประกอบการ',
        application_no: `APP-2569-${selectedBizId.slice(-4)}`,
        total_score: totalScore,
        max_possible_score: 100,
        result: result as any,
        summary_remarks: defects || 'ตรวจสุขาภิบาลผ่าน Mobile Field Inspector เรียบร้อย',
        representative_name: inspectorName,
        gps_latitude: Number(surveyLat) || 19.9327,
        gps_longitude: Number(surveyLng) || 99.1719,
        findings: STANDARD_CHECKLIST_ITEMS.map((item) => ({
          item_id: item.item_code,
          compliant: (scores[item.item_code] || 0) >= item.max_score,
          defect_details: (scores[item.item_code] || 0) < item.max_score ? 'มีข้อบกพร่องต้องปรับปรุง' : '',
        })),
      });

      success('บันทึกผลตรวจสุขาภิบาลสำเร็จ! 🎉', `คะแนนรวม: ${totalScore}/100 ผล: ${result === 'PASSED' ? 'ผ่านเกณฑ์ ✅' : 'ต้องปรับปรุง ⚠️'}`);
      setActiveTab('home');
    } catch (err: any) {
      error('บันทึกไม่สำเร็จ', err.message);
    } finally {
      setIsSubmittingInspect(false);
    }
  };

  // Submit Mobile Survey
  const handleSubmitSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!surveyName.trim()) {
      error('กรุณากรอกชื่อสถานประกอบการ');
      return;
    }

    try {
      const newBiz = await businessService.createBusiness({
        name: surveyName,
        business_type: surveyType,
        food_category: 'อาหารแช่แข็งและเนื้อสัตว์',
        area_sqm: Number(surveyArea) || 50,
        owner: {
          title_th: 'นาย',
          first_name: surveyOwnerName.split(' ')[0] || 'ผู้ประกอบการ',
          last_name: surveyOwnerName.split(' ')[1] || 'ท้องถิ่น',
          national_id: surveyNationalId || '1509900000000',
          phone_number: surveyPhone || '081-000-0000',
          subdistrict: 'โป่งน้ำร้อน',
          district: 'ฝาง',
          province: 'เชียงใหม่',
        },
        location: {
          address_no: '123',
          moo: surveyMoo,
          village_name: surveyVillage,
          subdistrict: 'โป่งน้ำร้อน',
          district: 'ฝาง',
          province: 'เชียงใหม่',
          latitude: Number(surveyLat),
          longitude: Number(surveyLng),
        },
      });

      success('ลงทะเบียนร้านค้าภาคสนามสำเร็จ! 🏪', `บันทึก "${newBiz.name}" พร้อมพิกัด GPS เรียบร้อย`);
      setSurveyName('');
      setSurveyOwnerName('');
      setSurveyPhone('');
      await loadData();
      setActiveTab('home');
    } catch (err: any) {
      error('ลงทะเบียนไม่สำเร็จ', err.message);
    }
  };

  // Verify QR
  const handleVerifyQR = async () => {
    if (!verifyToken.trim()) return;
    setIsVerifying(true);
    try {
      const res = await licenseService.getLicenseByToken(verifyToken.trim());
      setVerifyResult(res || 'NOT_FOUND');
    } finally {
      setIsVerifying(false);
    }
  };

  const totalScoreCalc = Object.values(scores).reduce((a, b) => a + b, 0);

  // If user not authenticated on field app, show clean bright Field Login
  if (!user) {
    return (
      <div className="min-h-screen bg-linear-to-b from-emerald-50 via-white to-slate-50 text-slate-900 flex flex-col justify-center p-4 max-w-md mx-auto">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30">
              <Store className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              แอปเจ้าหน้าที่ตรวจภาคสนาม
            </h1>
            <p className="text-xs text-slate-500">
              งานสาธารณสุข องค์การบริหารส่วนตำบลโป่งน้ำร้อน
            </p>
          </div>

          <form onSubmit={handleFieldLogin} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">ชื่อผู้ใช้งาน (Username):</label>
              <input
                type="text"
                required
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                placeholder="เช่น inspect"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">รหัสผ่าน (Password):</label>
              <input
                type="password"
                required
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              <span>{isLoggingIn ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบตรวจภาคสนาม'}</span>
            </button>
          </form>

          <div className="pt-2 text-center">
            <a
              href="/"
              className="text-xs text-emerald-700 hover:underline font-bold flex items-center justify-center gap-1"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>เปิดระบบเต็มบนคอมพิวเตอร์ (Desktop Dashboard)</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans max-w-md mx-auto relative pb-24 shadow-xl border-x border-slate-200">
      {/* Top Clean Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-slate-200/80 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-xs">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span>อบต.โป่งน้ำร้อน</span>
              <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-300 px-1.5 py-0.2 rounded-full font-bold">
                ภาคสนาม
              </span>
            </h1>
            <p className="text-[10px] text-slate-500">
              👤 {user?.first_name} ({user?.roles?.[0] || 'INSPECTOR'})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onSwitchToDesktop && (
            <button
              type="button"
              onClick={onSwitchToDesktop}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1 transition-all"
            >
              <Monitor className="w-3 h-3 text-slate-500" />
              <span>Desktop</span>
            </button>
          )}

          <button
            type="button"
            onClick={signOut}
            title="ออกจากระบบ"
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            {/* Status Card */}
            <div className="p-4 rounded-2xl bg-linear-to-br from-emerald-600 to-teal-700 text-white shadow-md space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="bg-white/20 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                  ระบบพร้อมลงพื้นที่
                </span>
                <span className="text-emerald-100 font-mono text-[10px]">📡 GPS พร้อม</span>
              </div>
              <h2 className="text-base font-bold text-white">
                งานตรวจสุขาภิบาลสถานที่สะสมอาหาร
              </h2>
              <p className="text-xs text-emerald-100">
                ตำบลโป่งน้ำร้อน อำเภอฝาง จังหวัดเชียงใหม่
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[11px] font-medium text-slate-500">คิวนัดตรวจรอตรวจ:</span>
                <p className="text-2xl font-bold text-amber-600">{appointments.length} <span className="text-xs font-normal text-slate-500">รายการ</span></p>
              </div>
              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[11px] font-medium text-slate-500">สถานที่ในทะเบียน:</span>
                <p className="text-2xl font-bold text-emerald-600">{businesses.length} <span className="text-xs font-normal text-slate-500">แห่ง</span></p>
              </div>
            </div>

            {/* 4 Action Buttons */}
            <div className="space-y-2.5 pt-1">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                ⚡ เมนูปฏิบัติการภาคสนาม:
              </p>

              <button
                type="button"
                onClick={() => setActiveTab('inspect')}
                className="w-full p-4 rounded-2xl bg-white hover:bg-emerald-50/50 text-slate-900 font-bold flex items-center justify-between border-2 border-emerald-600 shadow-xs transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <ClipboardCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">บันทึกตรวจสุขาภิบาล ๑๐ ข้อ</h3>
                    <p className="text-[11px] text-slate-500 font-normal">Checklist ดิจิทัล + ลายเซ็นนิ้วบนจอ</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-600 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('survey')}
                className="w-full p-4 rounded-2xl bg-white hover:bg-sky-50/50 text-slate-900 font-bold flex items-center justify-between border border-slate-200 shadow-xs transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">สำรวจร้านใหม่ + พิกัด GPS</h3>
                    <p className="text-[11px] text-slate-500 font-normal">ปักหมุดดาวเทียม + สแกนบัตร OCR</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('verify')}
                className="w-full p-4 rounded-2xl bg-white hover:bg-purple-50/50 text-slate-900 font-bold flex items-center justify-between border border-slate-200 shadow-xs transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">สแกน QR ตรวจใบอนุญาต</h3>
                    <p className="text-[11px] text-slate-500 font-normal">เช็คความถูกต้องจากสติ๊กเกอร์หน้าร้าน</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('schedule')}
                className="w-full p-4 rounded-2xl bg-white hover:bg-amber-50/50 text-slate-900 font-bold flex items-center justify-between border border-slate-200 shadow-xs transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">ตารางคิวนัดตรวจวันนี้</h3>
                    <p className="text-[11px] text-slate-500 font-normal">มีระบบโทรออก + นำทาง Google Maps</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: SCHEDULE */}
        {activeTab === 'schedule' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-600" />
                คิวนัดตรวจสุขาภิบาล ({appointments.length})
              </h2>
              <button
                type="button"
                onClick={loadData}
                className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 text-xs flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>รีเฟรช</span>
              </button>
            </div>

            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 uppercase">
                      ⏰ {apt.time_slot || '10:00 - 11:30 น.'}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1.5">
                      🏪 {apt.business_name || 'สถานประกอบการสะสมอาหาร'}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {apt.status === 'CONFIRMED' ? 'ยืนยันแล้ว' : 'นัดหมายแล้ว'}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-0.5">
                  <p>👤 เจ้าของ: {apt.owner_name || 'ผู้ประกอบการ'}</p>
                  <p>📍 {apt.location_desc || 'ต.โป่งน้ำร้อน อ.ฝาง'}</p>
                </div>

                {/* 1-Tap Action buttons */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs font-bold">
                  <a
                    href={`tel:${apt.phone_number || '0812345678'}`}
                    className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>โทร</span>
                  </a>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${apt.latitude || '19.9327'},${apt.longitude || '99.1719'}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 flex items-center justify-center gap-1"
                  >
                    <Navigation className="w-3.5 h-3.5 text-sky-600" />
                    <span>นำทาง</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      if (apt.business_id) setSelectedBizId(apt.business_id);
                      setActiveTab('inspect');
                    }}
                    className="py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1 shadow-xs"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    <span>เริ่มตรวจ</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: INSPECTION CHECKLIST (10 ITEMS) */}
        {activeTab === 'inspect' && (
          <form onSubmit={handleSubmitInspection} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold text-emerald-900">แบบตรวจสุขาภิบาล ๑๐ ข้อ</h2>
                <p className="text-[10px] text-slate-500">เกณฑ์ผ่าน: ๘๐ คะแนนขึ้นไป</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500">คะแนนประเมิน:</span>
                <p className={`text-xl font-black ${totalScoreCalc >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {totalScoreCalc} / 100
                </p>
              </div>
            </div>

            {/* Select Business */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">เลือกร้านที่กำลังตรวจ:</label>
              <select
                value={selectedBizId}
                onChange={(e) => setSelectedBizId(e.target.value)}
                className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 shadow-2xs"
              >
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    🏪 {b.name} ({b.business_code})
                  </option>
                ))}
              </select>
            </div>

            {/* 10 Checklist Items */}
            <div className="space-y-2.5">
              {STANDARD_CHECKLIST_ITEMS.map((item, idx) => {
                const currentScore = scores[item.item_code] ?? item.max_score;
                return (
                  <div
                    key={item.item_code}
                    className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2.5 text-xs shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-slate-900 leading-snug">
                        {idx + 1}. {item.title_th}
                      </span>
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0 font-mono">
                        {currentScore} / {item.max_score}
                      </span>
                    </div>

                    {/* Touch Rating Buttons */}
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setScores((prev) => ({ ...prev, [item.item_code]: 10 }))}
                        className={`py-2 rounded-xl font-bold text-xs transition-all ${
                          currentScore === 10
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        ✅ ผ่าน (10)
                      </button>
                      <button
                        type="button"
                        onClick={() => setScores((prev) => ({ ...prev, [item.item_code]: 5 }))}
                        className={`py-2 rounded-xl font-bold text-xs transition-all ${
                          currentScore === 5
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        ⚠️ ปรับปรุง (5)
                      </button>
                      <button
                        type="button"
                        onClick={() => setScores((prev) => ({ ...prev, [item.item_code]: 0 }))}
                        className={`py-2 rounded-xl font-bold text-xs transition-all ${
                          currentScore === 0
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        ❌ ไม่ผ่าน (0)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Defects Notes */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                ข้อบกพร่องที่ต้องแก้ไข / ข้อเสนอแนะ:
              </label>
              <textarea
                rows={2}
                value={defects}
                onChange={(e) => setDefects(e.target.value)}
                placeholder="ระบุสิ่งที่ต้องปรับปรุงแก้ไข (ถ้ามี)..."
                className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Digital Signature Canvas */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-emerald-600" />
                  ลายมือชื่อผู้ตรวจบนหน้าจอ (Digital Signature)
                </span>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-[10px] font-bold text-rose-600 hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>ล้างลายเซ็น</span>
                </button>
              </div>

              <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-300 touch-none">
                <canvas
                  ref={canvasRef}
                  width={340}
                  height={100}
                  className="w-full h-24 bg-slate-50 cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              <p className="text-[10px] text-slate-400 text-center">
                ใช้นิ้วเซ็นชื่อลงในกรอบด้านบน
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmittingInspect}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmittingInspect ? 'กำลังบันทึก...' : 'บันทึกผลตรวจสุขาภิบาลส่ง Dashboard'}</span>
            </button>
          </form>
        )}

        {/* TAB 4: SURVEY NEW STORE WITH GPS */}
        {activeTab === 'survey' && (
          <form onSubmit={handleSubmitSurvey} className="space-y-3.5 text-xs">
            <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold text-sky-900">สำรวจและปักหมุดร้านค้าใหม่</h2>
                <p className="text-[10px] text-slate-500">ดึงพิกัด GPS อัตโนมัติจากมือถือ</p>
              </div>
              <MapPin className="w-6 h-6 text-sky-600" />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">ชื่อสถานประกอบการ:</label>
              <input
                type="text"
                required
                value={surveyName}
                onChange={(e) => setSurveyName(e.target.value)}
                placeholder="เช่น คลังผลไม้แช่เย็น โป่งน้ำร้อน"
                className="w-full p-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">ประเภท:</label>
                <select
                  value={surveyType}
                  onChange={(e) => setSurveyType(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs"
                >
                  <option value="คลังสินค้าอาหารแช่แข็ง">อาหารแช่เย็น/แช่แข็ง</option>
                  <option value="โกดังสะสมข้าวสาร">โกดังข้าวสาร/ธัญพืช</option>
                  <option value="ศูนย์กระจายสินค้าอาหาร">ศูนย์กระจายสินค้า</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">พื้นที่ (ตร.ม.):</label>
                <input
                  type="number"
                  value={surveyArea}
                  onChange={(e) => setSurveyArea(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs"
                />
              </div>
            </div>

            {/* GPS Location Button */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">📍 พิกัดดาวเทียม (GPS):</span>
                <button
                  type="button"
                  onClick={handleGetGPS}
                  disabled={isLocatingGPS}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                >
                  <Navigation className={`w-3.5 h-3.5 ${isLocatingGPS ? 'animate-spin' : ''}`} />
                  <span>{isLocatingGPS ? 'กำลังหาพิกัด...' : 'ดึงพิกัดปัจจุบัน'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                <input
                  type="text"
                  value={surveyLat}
                  onChange={(e) => setSurveyLat(e.target.value)}
                  placeholder="ละติจูด (Lat)"
                  className="p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                />
                <input
                  type="text"
                  value={surveyLng}
                  onChange={(e) => setSurveyLng(e.target.value)}
                  placeholder="ลองจิจูด (Lng)"
                  className="p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>
            </div>

            {/* Owner Section with OCR scan */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">👤 ข้อมูลเจ้าของร้าน:</span>
                <button
                  type="button"
                  onClick={() => setIsOcrOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold flex items-center gap-1"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>สแกนบัตร OCR</span>
                </button>
              </div>

              <input
                type="text"
                value={surveyOwnerName}
                onChange={(e) => setSurveyOwnerName(e.target.value)}
                placeholder="ชื่อ-นามสกุล เจ้าของร้าน"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs"
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={surveyNationalId}
                  onChange={(e) => setSurveyNationalId(e.target.value)}
                  placeholder="เลขบัตรประชาชน 13 หลัก"
                  className="p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs font-mono"
                />
                <input
                  type="text"
                  value={surveyPhone}
                  onChange={(e) => setSurveyPhone(e.target.value)}
                  placeholder="เบอร์โทรศัพท์"
                  className="p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>บันทึกสถานประกอบการใหม่ลงระบบ</span>
            </button>
          </form>
        )}

        {/* TAB 5: VERIFY QR */}
        {activeTab === 'verify' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold text-purple-900">ตรวจสอบใบอนุญาตหน้าร้าน</h2>
                <p className="text-[10px] text-slate-500">เช็คความถูกต้องจากรหัส QR สติ๊กเกอร์</p>
              </div>
              <QrCode className="w-6 h-6 text-purple-600" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">กรอก Token หรือเลขที่ใบอนุญาต:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value)}
                  placeholder="เช่น สส. 01/2569"
                  className="flex-1 p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                />
                <button
                  type="button"
                  onClick={handleVerifyQR}
                  disabled={isVerifying || !verifyToken.trim()}
                  className="px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs"
                >
                  <Search className="w-4 h-4" />
                  <span>ตรวจ</span>
                </button>
              </div>
            </div>

            {/* Quick Demo Tokens */}
            <div className="space-y-1 text-xs">
              <span className="text-[10px] text-slate-400">ตัวอย่างรหัสทดสอบ:</span>
              <div className="flex flex-wrap gap-1.5">
                {['สส. 01/2569', 'สส. 02/2569', 'สส. 03/2569'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setVerifyToken(t);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-purple-700 text-xs font-medium"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Result Display */}
            {verifyResult && verifyResult !== 'NOT_FOUND' && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>ใบอนุญาตถูกต้องตามกฎหมาย ✅</span>
                </div>
                <div className="text-slate-700 space-y-1 pt-1 border-t border-emerald-200">
                  <p>🏪 ร้าน: <strong>{verifyResult.business?.name || 'คลังแช่เย็น ดอนแก้วซีฟู้ดส์'}</strong></p>
                  <p>📜 เลขที่: <span className="font-mono font-bold text-emerald-800">{verifyResult.license_number}</span></p>
                  <p>📅 หมดอายุ: {formatThaiDate(verifyResult.expiry_date)}</p>
                  <p>✍️ ผู้อนุมัติ: {verifyResult.approver_name}</p>
                </div>
              </div>
            )}

            {verifyResult === 'NOT_FOUND' && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-1 text-xs">
                <XCircle className="w-6 h-6 text-rose-500 mx-auto" />
                <p className="font-bold text-rose-800">ไม่พบข้อมูลใบอนุญาตในระบบ</p>
                <p className="text-[10px] text-slate-500">กรุณาตรวจสอบเลขที่ใบอนุญาตอีกครั้ง</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Clean White Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200 grid grid-cols-5 py-2 px-1 shadow-lg">
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
            activeTab === 'home' ? 'text-emerald-700 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">หน้าหลัก</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('schedule')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
            activeTab === 'schedule' ? 'text-amber-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">คิวตรวจ</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('inspect')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
            activeTab === 'inspect' ? 'text-emerald-700 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <ClipboardCheck className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">ตรวจ ๑๐ ข้อ</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('survey')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
            activeTab === 'survey' ? 'text-sky-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <MapPin className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">สำรวจร้าน</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('verify')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
            activeTab === 'verify' ? 'text-purple-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <QrCode className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">สแกน QR</span>
        </button>
      </nav>

      {/* OCR Scanner Modal */}
      {isOcrOpen && (
        <OCRScanner
          isOpen={isOcrOpen}
          onClose={() => setIsOcrOpen(false)}
          onResult={(res) => {
            if (res.first_name || res.last_name) {
              setSurveyOwnerName(`${res.first_name || ''} ${res.last_name || ''}`.trim());
            }
            if (res.national_id) {
              setSurveyNationalId(res.national_id);
            }
            setIsOcrOpen(false);
            success('OCR สแกนสำเร็จ', 'กรอกข้อมูลเจ้าของร้านอัตโนมัติแล้ว');
          }}
        />
      )}
    </div>
  );
};
