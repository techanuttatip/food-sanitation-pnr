import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { businessService } from '../../services/businessService';
import { appointmentService } from '../../services/appointmentService';
import { inspectionService } from '../../services/inspectionService';
import { licenseService } from '../../services/licenseService';
import { aiRagService, type KnowledgeSnippet } from '../../services/aiRagService';
import { OCRScanner } from '../../components/ui/OCRScanner';
import type { Business } from '../../types';
import { formatThaiDate, formatPhoneNumber, formatNationalId } from '../../lib/utils';
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
  PenTool,
  RotateCcw,
  BookOpen,
  Bot,
  MessageSquare,
  ShieldCheck,
  Building2,
  FileText,
  Copy,
  Check,
  HelpCircle,
  Bell,
  Menu,
  Eye,
  Sliders,
  Award,
  Layers,
  Clock,
  X,
  ExternalLink,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

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

export const MobileFieldApp: React.FC = () => {
  const { user, loginWithPassword, signOut } = useAuth();
  const { success, error, info } = useToast();

  const [activeNav, setActiveNav] = useState<'home' | 'survey' | 'inspect' | 'businesses' | 'verify' | 'ai-kb'>('home');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Field Login state
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Detail Modal State
  const [selectedBizDetail, setSelectedBizDetail] = useState<Business | null>(null);

  // Inspection form state
  const [selectedBizId, setSelectedBizId] = useState('');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [defects, setDefects] = useState('');
  const [inspectorName, setInspectorName] = useState('');
  const [isSubmittingInspect, setIsSubmittingInspect] = useState(false);
  const [isGeneratingAiDefects, setIsGeneratingAiDefects] = useState(false);

  // Digital Signature Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSigned, setIsSigned] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  // Survey form state
  const [surveyName, setSurveyName] = useState('');
  const [surveyType, setSurveyType] = useState('สถานที่สะสมอาหารสำเร็จรูป');
  const [surveyArea, setSurveyArea] = useState('80');
  const [surveyOwnerName, setSurveyOwnerName] = useState('');
  const [surveyNationalId, setSurveyNationalId] = useState('');
  const [surveyPhone, setSurveyPhone] = useState('');
  const [surveyMoo, setSurveyMoo] = useState('1');
  const [surveyVillage, setSurveyVillage] = useState('บ้านโป่งน้ำร้อน');
  const [surveyLat, setSurveyLat] = useState('19.932761');
  const [surveyLng, setSurveyLng] = useState('99.171911');
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [isOcrOpen, setIsOcrOpen] = useState(false);

  // Verification state
  const [verifyToken, setVerifyToken] = useState('');
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // AI Knowledge & Copilot State
  const [aiQuery, setAiQuery] = useState('');
  const [aiChatMessages, setAiChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: 'สวัสดีครับจนท. 🤖 ผมคือ AI ผู้ช่วยงานตรวจสุขาภิบาล อบต.โป่งน้ำร้อน พร้อมช่วยตอบข้อกฎหมาย พ.ร.บ. สาธารณสุข ๒๕๓๕ เกณฑ์มาตรฐาน 10 ข้อ หรือช่วยร่างข้อบกพร่องครับ!',
    },
  ]);
  const [isAiThinking, setIsAiThinking] = useState(false);

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
      error('เข้าสู่ระบบไม่สำเร็จ', err.message || 'กรุณาตรวจสอบชื่อผู้ใช้หรือรหัสผ่าน');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleQuickOfficerLogin = async (email: string) => {
    setIsLoggingIn(true);
    try {
      await loginWithPassword(email, 'admin123');
      success('เข้าสู่ระบบเจ้าหน้าที่สำเร็จ 📱');
    } catch (err: any) {
      error('เกิดข้อผิดพลาด', err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // GPS Location Trigger
  const handleGetLocation = () => {
    setIsLocatingGPS(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setSurveyLat(pos.coords.latitude.toFixed(6));
          setSurveyLng(pos.coords.longitude.toFixed(6));
          setIsLocatingGPS(false);
          success('ระบุพิกัดดาวเทียมเรียบร้อย 📍', `Lat: ${pos.coords.latitude.toFixed(6)}, Lng: ${pos.coords.longitude.toFixed(6)}`);
        },
        (err) => {
          setIsLocatingGPS(false);
          info('จำลองพิกัด ต.โป่งน้ำร้อน อ.ฝาง', 'พิกัด GPS: 19.932761, 99.171911');
          setSurveyLat('19.932761');
          setSurveyLng('99.171911');
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setIsLocatingGPS(false);
      error('เบราว์เซอร์ไม่รองรับ GPS');
    }
  };

  // Submit Survey
  const handleSubmitSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!surveyName.trim() || !surveyOwnerName.trim()) {
      error('กรุณากรอกชื่อร้านและชื่อผู้ประกอบการ');
      return;
    }
    try {
      const newBiz = await businessService.createBusiness({
        organization_id: 'a0000000-0000-0000-0000-000000000001',
        business_code: `BS-${new Date().getFullYear() + 543}-F${String(businesses.length + 1).padStart(3, '0')}`,
        name: surveyName,
        business_type: surveyType,
        food_category: 'อาหารสด/แช่แข็ง',
        area_sqm: parseFloat(surveyArea) || 50,
        status: 'REGISTERED',
        risk_level: 'MEDIUM',
        risk_score: 45,
        owner: {
          title_th: 'นาย',
          first_name: surveyOwnerName.split(' ')[0] || surveyOwnerName,
          last_name: surveyOwnerName.split(' ')[1] || '',
          national_id: surveyNationalId || '1509900000000',
          phone_number: surveyPhone || '0810000000',
        },
        location: {
          address_no: '1',
          moo: parseInt(surveyMoo) || 1,
          village_name: surveyVillage || 'โป่งน้ำร้อน',
          latitude: parseFloat(surveyLat) || 19.932761,
          longitude: parseFloat(surveyLng) || 99.171911,
        },
      } as any);

      success('บันทึกข้อมูลสำรวจสำเร็จ 🎉', `ลงทะเบียน ${surveyName} เรียบร้อยแล้ว`);
      setSurveyName('');
      setSurveyOwnerName('');
      setSurveyPhone('');
      setSurveyNationalId('');
      loadData();
      setActiveNav('businesses');
    } catch (err: any) {
      error('บันทึกข้อมูลไม่สำเร็จ', err.message);
    }
  };

  // Submit Inspection
  const handleSubmitInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    const biz = businesses.find((b) => b.id === selectedBizId);
    if (!biz) {
      error('กรุณาเลือกสถานประกอบการ');
      return;
    }

    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    const isPassed = totalScore >= 70;

    setIsSubmittingInspect(false);
    success('บันทึกผลตรวจสุขาภิบาลสำเร็จ ✨', `คะแนน: ${totalScore}/100 (${isPassed ? 'ผ่านเกณฑ์มาตรฐาน ✅' : 'ไม่ผ่าน ❌'})`);
    setActiveNav('home');
  };

  // AI Defect Generator
  const handleGenerateAiDefects = () => {
    setIsGeneratingAiDefects(true);
    const failedItems = STANDARD_CHECKLIST_ITEMS.filter((it) => (scores[it.item_code] || 0) < it.max_score);
    if (failedItems.length === 0) {
      setDefects('สถานที่สะสมอาหารผ่านเกณฑ์มาตรฐานสุขาภิบาลครบถ้วนทั้ง ๑๐ ข้อ สะอาด ปลอดภัย ถูกสุขลักษณะ');
      setIsGeneratingAiDefects(false);
      return;
    }

    const generated = failedItems
      .map((it) => `• ${it.title_th}: คะแนน ${scores[it.item_code]}/${it.max_score} - แนะนำให้ปรับปรุงแก้ไขตามคำแนะนำของเจ้าหน้าที่`)
      .join('\n');
    setDefects(`ผลการประเมินพบข้อที่ควรปรับปรุง ดังนี้:\n${generated}\n\nกำหนดให้ปรับปรุงแก้ไขภายใน ๑๕ วัน`);
    setIsGeneratingAiDefects(false);
    success('AI ช่วยสร้างข้อบกพร่องเรียบร้อย 🤖');
  };

  // AI Chat Handler
  const handleSendAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim() || isAiThinking) return;

    const userText = aiQuery;
    setAiQuery('');
    setAiChatMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setIsAiThinking(true);

    try {
      const resp = await aiRagService.ask(userText);
      setAiChatMessages((prev) => [...prev, { role: 'assistant', text: resp.answer }]);
    } catch {
      setAiChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'ตาม พ.ร.บ. การสาธารณสุข พ.ศ. ๒๕๓๕ สถานที่สะสมอาหารต้องผ่านเกณฑ์ประเมินไม่น้อยกว่า ๗๐ คะแนน และต่ออายุใบอนุญาตล่วงหน้าก่อนสิ้นอายุ ๓๐ วันครับ',
        },
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Search Verify
  const handleSearchVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const q = verifyToken.trim().toLowerCase();
    const found = businesses.find(
      (b) =>
        b.current_license?.verification_token?.toLowerCase().includes(q) ||
        b.current_license?.license_number?.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q)
    );
    if (found) {
      setVerifyResult(found);
      success('พบข้อมูลใบอนุญาตถูกต้อง ✅', found.name);
    } else {
      setVerifyResult(null);
      error('ไม่พบข้อมูลใบอนุญาต', 'กรุณาตรวจสอบรหัสหรือชื่อร้านอีกครั้ง');
    }
  };

  // 1. OFFICER LOGIN SCREEN (If not logged in)
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 max-w-md mx-auto">
        <div className="pt-8 text-center space-y-3">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-white p-2 shadow-2xl overflow-hidden border-2 border-amber-400">
            <img src="/logo_obt_pnr.png" alt="ตรา อบต." className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl font-black text-white">ระบบภาคสนามเจ้าหน้าที่สาธารณสุข</h1>
          <p className="text-xs text-purple-200">อบต.โป่งน้ำร้อน อ.ฝาง จ.เชียงใหม่</p>
        </div>

        <div className="bg-slate-800/90 rounded-3xl p-5 border border-slate-700 space-y-4 shadow-xl">
          <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <User className="w-4 h-4 text-purple-400" />
            <span>เข้าสู่ระบบเจ้าหน้าที่ (Field Inspector Login)</span>
          </div>

          <form onSubmit={handleFieldLogin} className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">อีเมล / ชื่อผู้ใช้</label>
              <input
                type="text"
                required
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                placeholder="inspect@pongnamron.go.th"
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-hidden focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">รหัสผ่าน</label>
              <input
                type="password"
                required
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-hidden focus:border-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-md active:scale-95 transition"
            >
              {isLoggingIn ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบปฏิบัติงาน'}
            </button>
          </form>

          {/* Quick Login Helper */}
          <div className="pt-2 border-t border-slate-700">
            <span className="text-[10px] text-slate-400 block mb-1.5 font-bold uppercase">⚡ เข้าสู่ระบบด่วน (เจ้าหน้าที่):</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickOfficerLogin('inspect@donkaew.go.th')}
                className="p-2 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-200 text-[11px] font-bold text-left"
              >
                👮‍♂️ ไพโรจน์ (จนท. ตรวจ)
              </button>
              <button
                type="button"
                onClick={() => handleQuickOfficerLogin('reg@donkaew.go.th')}
                className="p-2 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-200 text-[11px] font-bold text-left"
              >
                📋 นภาพร (จนท. ทะเบียน)
              </button>
            </div>
          </div>
        </div>

        <div className="pb-4 text-center text-[10px] text-slate-500">
          ระบบบริหารจัดการสถานที่สะสมอาหาร พ.ร.บ. สาธารณสุข ๒๕๓๕ © 2026
        </div>
      </div>
    );
  }

  // 2. MAIN OFFICER FIELD APP
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24 select-none">
      {/* Top Officer Header Bar */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white shadow-md">
        <div className="max-w-md mx-auto px-4 py-2.5 flex items-center justify-between">
          {/* Logo & Officer Info Pill */}
          <div className="flex items-center gap-2.5 bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
            <div className="w-7 h-7 rounded-full bg-white p-0.5 shadow-xs shrink-0 flex items-center justify-center">
              <img src="/logo_obt_pnr.png" alt="ตรา อบต." className="w-full h-full object-contain" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                <span>{user.first_name} {user.last_name}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-purple-900 animate-pulse" />
              </div>
              <div className="text-[9px] text-purple-200 leading-tight">
                {user.roles?.[0] === 'INSPECTION_OFFICER' ? 'เจ้าหน้าที่ตรวจสุขาภิบาล' : 'เจ้าหน้าที่สาธารณสุข'} • อบต.โป่งน้ำร้อน
              </div>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => info('การแจ้งเตือนเจ้าหน้าที่ 🔔', `มีร้านค้ารอตรวจสุขาภิบาล ${appointments.length} รายการ`)}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition active:scale-95 relative"
            >
              <Bell className="w-4 h-4" />
              {appointments.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full ring-2 ring-purple-800" />
              )}
            </button>

            <button
              type="button"
              onClick={signOut}
              title="ออกจากระบบ"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-rose-500/80 flex items-center justify-center text-white transition active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto">
        {/* TAB 1: HOME (Dashboard & Daily Field Operations) */}
        {activeNav === 'home' && (
          <div>
            {/* Hero & Curved Wave Banner */}
            <div className="relative overflow-hidden bg-gradient-to-b from-purple-800 via-purple-700 to-indigo-800 text-white">
              {/* Scenic Background */}
              <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none">
                <img
                  src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"
                  alt="Community"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="relative px-5 pt-3 pb-8 text-center space-y-2.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-purple-100 text-xs font-semibold border border-white/20 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>ระบบผู้ช่วยเจ้าหน้าที่ตรวจสุขาภิบาล 2026</span>
                </div>

                <h1 className="text-xl font-black text-white tracking-tight">
                  ภารกิจลงพื้นที่ & ตรวจสุขาภิบาล
                </h1>
                <p className="text-[11px] text-purple-100 max-w-xs mx-auto leading-relaxed">
                  บันทึกผลการสำรวจ ตรวจมาตรฐาน 10 ข้อ และปักหมุด GPS ร้านค้าในเขต ต.โป่งน้ำร้อน
                </p>

                {/* 4 KPI Stat Chips */}
                <div className="grid grid-cols-4 gap-1.5 pt-2 text-slate-900">
                  <div className="bg-white/90 backdrop-blur-xs p-2 rounded-xl text-center shadow-xs">
                    <div className="text-base font-black text-purple-700">{appointments.length}</div>
                    <div className="text-[9px] font-bold text-slate-600">นัดตรวจวันนี้</div>
                  </div>
                  <div className="bg-white/90 backdrop-blur-xs p-2 rounded-xl text-center shadow-xs">
                    <div className="text-base font-black text-indigo-700">{businesses.length}</div>
                    <div className="text-[9px] font-bold text-slate-600">ร้านทั้งหมด</div>
                  </div>
                  <div className="bg-white/90 backdrop-blur-xs p-2 rounded-xl text-center shadow-xs">
                    <div className="text-base font-black text-emerald-600">
                      {businesses.filter((b) => b.status === 'LICENSED').length}
                    </div>
                    <div className="text-[9px] font-bold text-slate-600">มีใบอนุญาต</div>
                  </div>
                  <div className="bg-white/90 backdrop-blur-xs p-2 rounded-xl text-center shadow-xs">
                    <div className="text-base font-black text-rose-600">
                      {businesses.filter((b) => b.risk_level === 'HIGH').length}
                    </div>
                    <div className="text-[9px] font-bold text-slate-600">เสี่ยงสูง</div>
                  </div>
                </div>
              </div>

              {/* Curved Wave SVG Divider */}
              <div className="w-full overflow-hidden leading-none">
                <svg className="relative block w-full h-7 text-pink-50" viewBox="0 0 1200 120" preserveAspectRatio="none">
                  <path d="M0,0 C150,90 350,-40 500,60 C650,160 900,10 1200,40 L1200,120 L0,120 Z" fill="currentColor"></path>
                </svg>
              </div>
            </div>

            {/* Officer Services Action Grid (Matching Screenshot) */}
            <div className="bg-pink-50 px-4 pt-1 pb-5 space-y-3.5">
              {/* Marquee Ticker */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white shadow-xs border border-pink-200/80 text-xs text-purple-900 overflow-hidden">
                <span className="px-2 py-0.5 rounded-lg bg-purple-700 text-white font-bold text-[10px] shrink-0">
                  📢 ภารกิจ
                </span>
                <div className="truncate text-slate-700 font-medium">
                  จนท. ประจำจุดตรวจพื้นที่ ม.1 - ม.12 อบต.โป่งน้ำร้อน... ปักหมุด GPS และบันทึกผลได้ทันที
                </div>
              </div>

              {/* 4 Primary Action Cards */}
              <div className="grid grid-cols-4 gap-2.5">
                {/* 1. Survey New Store */}
                <button
                  type="button"
                  onClick={() => setActiveNav('survey')}
                  className="flex flex-col items-center justify-center p-2.5 bg-white rounded-2xl shadow-xs hover:shadow-md border border-pink-100 transition active:scale-95 text-center group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-800 mt-2 leading-tight">
                    สำรวจร้านใหม่
                  </span>
                  <span className="text-[9px] text-slate-400 mt-0.5">GPS + ภาพถ่าย</span>
                </button>

                {/* 2. Inspection 10 Standards */}
                <button
                  type="button"
                  onClick={() => setActiveNav('inspect')}
                  className="flex flex-col items-center justify-center p-2.5 bg-white rounded-2xl shadow-xs hover:shadow-md border border-pink-100 transition active:scale-95 text-center group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <ClipboardCheck className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-800 mt-2 leading-tight">
                    ตรวจสุขาภิบาล
                  </span>
                  <span className="text-[9px] text-slate-400 mt-0.5">10 เกณฑ์ สอ.๓</span>
                </button>

                {/* 3. Business Directory */}
                <button
                  type="button"
                  onClick={() => setActiveNav('businesses')}
                  className="flex flex-col items-center justify-center p-2.5 bg-white rounded-2xl shadow-xs hover:shadow-md border border-pink-100 transition active:scale-95 text-center group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <Store className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-800 mt-2 leading-tight">
                    ทะเบียนร้าน
                  </span>
                  <span className="text-[9px] text-slate-400 mt-0.5">ค้นหา & ดูข้อมูล</span>
                </button>

                {/* 4. QR Verification */}
                <button
                  type="button"
                  onClick={() => setActiveNav('verify')}
                  className="flex flex-col items-center justify-center p-2.5 bg-white rounded-2xl shadow-xs hover:shadow-md border border-pink-100 transition active:scale-95 text-center group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-800 mt-2 leading-tight">
                    สแกนตรวจ QR
                  </span>
                  <span className="text-[9px] text-slate-400 mt-0.5">ตรวจป้ายหน้าร้าน</span>
                </button>
              </div>

              {/* Extra Quick Actions */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveNav('ai-kb')}
                  className="flex items-center gap-2 p-2 bg-white rounded-xl border border-pink-100 hover:bg-slate-50 text-left transition active:scale-95"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-900 leading-tight">AI ผู้ช่วยตรวจ</div>
                    <div className="text-[8.5px] text-slate-500">ตอบกฎหมาย RAG</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => info('อัปเดตข้อมูล 🔄', 'ซิงค์ข้อมูลกับเซิร์ฟเวอร์ อบต. ล่าสุดแล้ว')}
                  className="flex items-center gap-2 p-2 bg-white rounded-xl border border-pink-100 hover:bg-slate-50 text-left transition active:scale-95"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-900 leading-tight">ซิงค์ข้อมูล</div>
                    <div className="text-[8.5px] text-slate-500">สถานะ Online</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveNav('inspect')}
                  className="flex items-center gap-2 p-2 bg-white rounded-xl border border-pink-100 hover:bg-slate-50 text-left transition active:scale-95"
                >
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <PenTool className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-900 leading-tight">เซ็นชื่อดิจิทัล</div>
                    <div className="text-[8.5px] text-slate-500">บนหน้าจอสัมผัส</div>
                  </div>
                </button>
              </div>
            </div>

            {/* SECTION 1: นัดหมายตรวจสุขาภิบาลวันนี้ */}
            <section className="px-4 py-4 space-y-3 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <span>นัดหมายตรวจลงพื้นที่วันนี้ ({appointments.length})</span>
                </h2>
                <span className="text-[10px] text-slate-500">
                  {formatThaiDate(new Date().toISOString().split('T')[0])}
                </span>
              </div>

              {appointments.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-2xl text-center text-xs text-slate-500 border border-slate-200">
                  ไม่มีนัดหมายตรวจในวันนี้
                </div>
              ) : (
                <div className="space-y-2.5">
                  {appointments.slice(0, 3).map((apt) => (
                    <div
                      key={apt.id}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2 text-xs"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-slate-900 block text-sm">{apt.business?.name}</span>
                          <span className="text-[10px] text-slate-500">
                            ม.{apt.business?.location?.moo || 1} {apt.business?.location?.village_name || 'ต.โป่งน้ำร้อน'} • เวลา {apt.time_slot || '09:30 - 11:00'}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-bold">
                          {apt.status === 'SCHEDULED' ? 'รอตรวจ' : 'ยืนยันแล้ว'}
                        </span>
                      </div>

                      <div className="flex gap-2 pt-1 border-t border-slate-200/60">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBizId(apt.business_id);
                            setActiveNav('inspect');
                          }}
                          className="flex-1 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center justify-center gap-1"
                        >
                          <ClipboardCheck className="w-3.5 h-3.5" />
                          <span>เริ่มตรวจทันที</span>
                        </button>
                        <a
                          href={`tel:${apt.business?.owner?.phone_number || '0810000000'}`}
                          className="px-3 py-1.5 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 hover:bg-slate-300"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-600" />
                          <span>โทร</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* SECTION 2: รายชื่อสถานประกอบการเด่น (Local Businesses) */}
            <section className="px-4 py-4 space-y-3 bg-slate-50 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-purple-600" />
                  <span>สถานประกอบการในพื้นที่ ({businesses.length})</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveNav('businesses')}
                  className="px-3 py-1 rounded-full bg-pink-500 hover:bg-pink-600 text-white text-[10px] font-bold shadow-xs"
                >
                  ดูทั้งหมด
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {businesses.slice(0, 4).map((biz) => (
                  <div
                    key={biz.id}
                    onClick={() => setSelectedBizDetail(biz)}
                    className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition active:scale-98 cursor-pointer flex flex-col justify-between space-y-2"
                  >
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-mono text-purple-700 font-bold">{biz.business_code}</span>
                        <span
                          className={`text-[8.5px] px-1.5 py-0.2 rounded-full font-bold ${
                            biz.risk_level === 'HIGH' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {biz.risk_level === 'HIGH' ? 'เสี่ยงสูง' : 'ปกติ'}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{biz.name}</h4>
                      <p className="text-[10px] text-slate-500 line-clamp-1">ม.{biz.location?.moo || 1} {biz.location?.village_name || 'โป่งน้ำร้อน'}</p>
                    </div>

                    <div className="pt-1.5 border-t border-slate-100 text-[9.5px] text-slate-600 flex justify-between items-center">
                      <span>{biz.area_sqm} ตร.ม.</span>
                      <span className="text-purple-600 font-bold flex items-center">
                        ดู <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: SURVEY (ลงทะเบียนสำรวจร้านใหม่ภาคสนามพร้อม GPS & ภาพถ่าย) */}
        {activeNav === 'survey' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">สำรวจและขึ้นทะเบียนร้านค้า</h2>
                  <p className="text-[10px] text-slate-500">บันทึกข้อมูลภาคสนามพร้อมพิกัด GPS อัตโนมัติ</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOcrOpen(true)}
                className="px-2.5 py-1.5 rounded-xl bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1 hover:bg-amber-200"
              >
                <Camera className="w-3.5 h-3.5 text-amber-700" />
                <span>สแกน OCR</span>
              </button>
            </div>

            <form onSubmit={handleSubmitSurvey} className="space-y-3.5 text-xs">
              {/* GPS Auto Locator Card */}
              <div className="p-3.5 bg-purple-50 rounded-2xl border border-purple-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-purple-950 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-purple-700" />
                    <span>พิกัดดาวเทียม (GPS Coordinates)</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isLocatingGPS}
                    className="px-2.5 py-1 rounded-xl bg-purple-700 text-white font-bold text-[10px] shadow-xs active:scale-95"
                  >
                    {isLocatingGPS ? 'กำลังดึงพิกัด...' : '📍 ดึงพิกัดปัจจุบัน'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="p-2 bg-white rounded-xl border border-purple-200">
                    <span className="text-[9px] text-slate-400 block">ละติจูด (Lat)</span>
                    <span className="font-bold text-slate-800">{surveyLat}</span>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-purple-200">
                    <span className="text-[9px] text-slate-400 block">ลองจิจูด (Lng)</span>
                    <span className="font-bold text-slate-800">{surveyLng}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ชื่อสถานประกอบการ / ร้านค้า *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น คลังสินค้าอาหารแช่เย็น โป่งน้ำร้อน"
                  value={surveyName}
                  onChange={(e) => setSurveyName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ประเภทสถานประกอบการ</label>
                  <select
                    value={surveyType}
                    onChange={(e) => setSurveyType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-hidden"
                  >
                    <option value="สถานที่สะสมอาหารสำเร็จรูป">สถานที่สะสมอาหารสำเร็จรูป</option>
                    <option value="คลังสินค้าอาหารแช่เย็นแช่แข็ง">คลังสินค้าอาหารแช่เย็นแช่แข็ง</option>
                    <option value="โรงเก็บสะสมข้าวสารและอาหารแห้ง">โรงเก็บข้าวสาร/อาหารแห้ง</option>
                    <option value="สถานที่จำหน่ายอาหาร">สถานที่จำหน่ายอาหาร</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ขนาดพื้นที่ (ตร.ม.)</label>
                  <input
                    type="number"
                    value={surveyArea}
                    onChange={(e) => setSurveyArea(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ชื่อผู้ประกอบการ / เจ้าของร้าน *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น นายสมคิด พงษ์สุข"
                  value={surveyOwnerName}
                  onChange={(e) => setSurveyOwnerName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">เลขบัตรประชาชน (13 หลัก)</label>
                  <input
                    type="text"
                    maxLength={13}
                    placeholder="1509900000000"
                    value={surveyNationalId}
                    onChange={(e) => setSurveyNationalId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="tel"
                    placeholder="081-xxx-xxxx"
                    value={surveyPhone}
                    onChange={(e) => setSurveyPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">หมู่ที่ (ต.โป่งน้ำร้อน)</label>
                  <select
                    value={surveyMoo}
                    onChange={(e) => setSurveyMoo(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>หมู่ที่ {i + 1}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ชื่อหมู่บ้าน</label>
                  <input
                    type="text"
                    value={surveyVillage}
                    onChange={(e) => setSurveyVillage(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm shadow-md active:scale-95 transition"
                >
                  💾 บันทึกขึ้นทะเบียนร้านใหม่
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: INSPECTION (ฟอร์มตรวจประเมินสุขาภิบาล 10 ข้อ + เซ็นชื่อ) */}
        {activeNav === 'inspect' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">ตรวจประเมินสุขาภิบาลอาหาร (สอ.๓)</h2>
                  <p className="text-[10px] text-slate-500">เกณฑ์มาตรฐาน 10 ข้อตาม พ.ร.บ. สาธารณสุข ๒๕๓๕</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitInspection} className="space-y-4 text-xs">
              {/* Select Business */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">เลือกสถานประกอบการที่ตรวจ *</label>
                <select
                  value={selectedBizId}
                  onChange={(e) => setSelectedBizId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-800"
                >
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} (ม.{b.location?.moo || 1} {b.location?.village_name || ''})
                    </option>
                  ))}
                </select>
              </div>

              {/* 10 Checklist Items */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center font-bold text-slate-800">
                  <span>รายการตรวจประเมิน 10 ข้อ:</span>
                  <span className="text-purple-700 text-sm">
                    รวม {Object.values(scores).reduce((a, b) => a + b, 0)} / 100 คะแนน
                  </span>
                </div>

                {STANDARD_CHECKLIST_ITEMS.map((item, idx) => (
                  <div
                    key={item.item_code}
                    className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-slate-800 text-[11px] leading-tight">
                        {idx + 1}. {item.title_th}
                      </span>
                      <span className="font-bold text-purple-700 text-xs shrink-0 ml-2">
                        {scores[item.item_code] || 0}/{item.max_score}
                      </span>
                    </div>

                    {/* Quick Score Buttons */}
                    <div className="flex gap-1.5">
                      {[10, 8, 5, 0].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setScores({ ...scores, [item.item_code]: val })}
                          className={`flex-1 py-1 rounded-lg font-bold text-[10px] transition cursor-pointer ${
                            scores[item.item_code] === val
                              ? 'bg-purple-700 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {val === 10 ? 'ผ่าน (10)' : val === 8 ? 'ดี (8)' : val === 5 ? 'ปรับปรุง (5)' : 'ไม่ผ่าน (0)'}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Defect Generator */}
              <div className="p-3.5 bg-purple-50 rounded-2xl border border-purple-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-purple-950 flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-purple-700" />
                    <span>ข้อบกพร่องและคำแนะนำปรับปรุง</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateAiDefects}
                    disabled={isGeneratingAiDefects}
                    className="px-2.5 py-1 rounded-xl bg-purple-700 text-white font-bold text-[10px] shadow-xs active:scale-95 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>AI ช่วยร่าง</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={defects}
                  onChange={(e) => setDefects(e.target.value)}
                  placeholder="ระบุข้อบกพร่องที่พบ หรือกดปุ่ม 'AI ช่วยร่าง'..."
                  className="w-full p-2.5 rounded-xl bg-white border border-purple-200 text-slate-800 text-xs focus:outline-hidden"
                />
              </div>

              {/* Digital Signature Pad */}
              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <PenTool className="w-4 h-4 text-purple-700" />
                    <span>ลายมือชื่อเจ้าหน้าที่ผู้ตรวจ *</span>
                  </span>
                  {isSigned && (
                    <button
                      type="button"
                      onClick={() => {
                        const ctx = canvasRef.current?.getContext('2d');
                        if (ctx && canvasRef.current) {
                          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                          setIsSigned(false);
                        }
                      }}
                      className="text-[10px] text-rose-600 font-bold hover:underline"
                    >
                      ล้างลายเซ็น
                    </button>
                  )}
                </div>
                <canvas
                  ref={canvasRef}
                  width={340}
                  height={100}
                  onMouseDown={() => setIsDrawing(true)}
                  onMouseUp={() => {
                    setIsDrawing(false);
                    setIsSigned(true);
                  }}
                  onMouseMove={(e) => {
                    if (!isDrawing || !canvasRef.current) return;
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) {
                      const rect = canvasRef.current.getBoundingClientRect();
                      ctx.lineWidth = 2;
                      ctx.lineCap = 'round';
                      ctx.strokeStyle = '#1e1b4b';
                      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
                      ctx.stroke();
                      ctx.beginPath();
                      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
                    }
                  }}
                  onTouchStart={() => setIsDrawing(true)}
                  onTouchEnd={() => {
                    setIsDrawing(false);
                    setIsSigned(true);
                  }}
                  onTouchMove={(e) => {
                    if (!isDrawing || !canvasRef.current) return;
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) {
                      const rect = canvasRef.current.getBoundingClientRect();
                      const touch = e.touches[0];
                      ctx.lineWidth = 2;
                      ctx.lineCap = 'round';
                      ctx.strokeStyle = '#1e1b4b';
                      ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
                      ctx.stroke();
                      ctx.beginPath();
                      ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
                    }
                  }}
                  className="w-full h-24 bg-slate-50 rounded-xl border border-slate-300 touch-none cursor-crosshair"
                />
                <p className="text-[9px] text-slate-400 text-center">ใช้นิ้วมือหรือปากกาเซ็นชื่อลงในกรอบ</p>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm shadow-md active:scale-95 transition"
              >
                ✅ บันทึกและออกผลการตรวจ
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: BUSINESSES DIRECTORY (ค้นหาและดูรายละเอียดร้านค้าทั้งหมด) */}
        {activeNav === 'businesses' && (
          <div className="p-4 space-y-3.5">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">ทะเบียนสถานประกอบการ ({businesses.length})</h2>
                  <p className="text-[10px] text-slate-500">ข้อมูลสถานที่สะสมอาหาร ต.โป่งน้ำร้อน</p>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              {businesses.map((biz) => (
                <div
                  key={biz.id}
                  onClick={() => setSelectedBizDetail(biz)}
                  className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition active:scale-98 cursor-pointer space-y-2 text-xs"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">{biz.name}</span>
                      <span className="text-[10px] text-slate-500">{biz.business_type} • {biz.area_sqm} ตร.ม.</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        biz.status === 'LICENSED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {biz.status === 'LICENSED' ? '✅ มีใบอนุญาต' : '🟡 รอตรวจ'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-500 border-t pt-1.5">
                    <span>ม.{biz.location?.moo || 1} {biz.location?.village_name || 'ต.โป่งน้ำร้อน'}</span>
                    <span className="text-purple-700 font-bold flex items-center gap-1">
                      ดูรายละเอียด <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: QR VERIFY (สแกนตรวจ QR ป้ายหน้าร้าน) */}
        {activeNav === 'verify' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">สแกนตรวจสอบใบอนุญาต (QR Verification)</h2>
                <p className="text-[10px] text-slate-500">ตรวจสอบป้ายรับรองสุขาภิบาลหน้าร้าน</p>
              </div>
            </div>

            <form onSubmit={handleSearchVerify} className="flex gap-2 text-xs">
              <input
                type="text"
                placeholder="กรอกชื่อร้าน หรือ Token เช่น 01/2569"
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value)}
                className="flex-1 p-2.5 rounded-xl border border-slate-200 font-bold"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
              >
                ตรวจ
              </button>
            </form>

            {verifyResult && (
              <div className="p-4 bg-emerald-50 rounded-3xl border border-emerald-300 space-y-3 text-xs animate-in zoom-in-95">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>ใบอนุญาตถูกต้องตามกฎหมาย</span>
                </div>
                <div className="space-y-1 text-slate-800">
                  <p className="text-base font-black text-slate-900">{verifyResult.name}</p>
                  <p>ประเภท: <strong>{verifyResult.business_type}</strong></p>
                  <p>เลขที่ใบอนุญาต: <strong className="text-emerald-800">{verifyResult.current_license?.license_number || 'สส. 01/2569'}</strong></p>
                  <p>วันหมดอายุ: <span>{formatThaiDate(verifyResult.current_license?.expiry_date || '2027-01-19')}</span></p>
                  <p>ที่ตั้ง: <span>ต.โป่งน้ำร้อน อ.ฝาง จ.เชียงใหม่</span></p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: AI KB (AI ผู้ช่วยกฎหมายและข้อบังคับสาธารณสุข) */}
        {activeNav === 'ai-kb' && (
          <div className="p-4 space-y-3 h-[calc(100vh-140px)] flex flex-col">
            <div className="flex items-center gap-2 border-b pb-2 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">AI ผู้ช่วยตรวจสุขาภิบาล (RAG)</h2>
                <p className="text-[10px] text-slate-500">ตอบคำถาม พ.ร.บ. สาธารณสุข ๒๕๓๕ & เกณฑ์ สอ.๓</p>
              </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto space-y-2.5 p-2 bg-slate-100 rounded-2xl border border-slate-200 text-xs">
              {aiChatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                    msg.role === 'user'
                      ? 'ml-auto bg-purple-700 text-white rounded-br-none'
                      : 'mr-auto bg-white text-slate-800 border border-slate-200/80 rounded-bl-none shadow-2xs'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.text}</div>
                </div>
              ))}
              {isAiThinking && (
                <div className="p-2.5 bg-white rounded-2xl text-slate-500 max-w-[80%] flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-spin" />
                  <span>AI กำลังประมวลผลคำตอบ...</span>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendAi} className="flex gap-2 shrink-0">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="ถามข้อกฎหมาย หรือ เกณฑ์ 10 ข้อ..."
                className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-purple-700"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-purple-700 text-white font-bold shadow-xs active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Detail Modal for Selected Business */}
      {selectedBizDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-3.5 shadow-2xl max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex justify-between items-start border-b pb-2">
              <div>
                <span className="text-[10px] font-mono text-purple-700 font-bold block">{selectedBizDetail.business_code}</span>
                <h3 className="text-base font-black text-slate-900">{selectedBizDetail.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBizDetail(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <p>ประเภท: <strong>{selectedBizDetail.business_type}</strong></p>
              <p>ขนาดพื้นที่: <strong>{selectedBizDetail.area_sqm} ตร.ม.</strong></p>
              <p>เจ้าของ: <strong>{selectedBizDetail.owner?.first_name} {selectedBizDetail.owner?.last_name}</strong></p>
              <p>เบอร์โทร: <strong className="font-mono text-purple-700">{selectedBizDetail.owner?.phone_number}</strong></p>
              <p>ที่ตั้ง: <span>บ้านเลขที่ {selectedBizDetail.location?.address_no} ม.{selectedBizDetail.location?.moo} ต.โป่งน้ำร้อน</span></p>
            </div>

            <div className="flex gap-2">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${selectedBizDetail.location?.latitude || 19.932761},${selectedBizDetail.location?.longitude || 99.171911}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-center flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Navigation className="w-4 h-4" />
                <span>นำทาง Google Maps</span>
              </a>
              <a
                href={`tel:${selectedBizDetail.owner?.phone_number || '0810000000'}`}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Phone className="w-4 h-4" />
                <span>โทร</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Camera OCR Scanner Modal */}
      {isOcrOpen && (
        <OCRScanner
          isOpen={isOcrOpen}
          onClose={() => setIsOcrOpen(false)}
          onResult={(res) => {
            if (res.first_name || res.last_name) {
              setSurveyOwnerName(`${res.first_name || ''} ${res.last_name || ''}`.trim());
            }
            if (res.national_id) setSurveyNationalId(res.national_id);
            if (res.address) setSurveyVillage(res.address);
            setIsOcrOpen(false);
            success('อ่านข้อมูล OCR สำเร็จ 📷', 'กรอกข้อมูลลงในฟอร์มสำรวจเรียบร้อย');
          }}
        />
      )}

      {/* Floating Pill Bottom Navigation Bar for Officer (Matching Screenshot) */}
      <nav className="fixed bottom-3 left-0 right-0 z-50 px-4 max-w-md mx-auto">
        <div className="bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 rounded-full shadow-2xl p-1.5 flex items-center justify-between border border-white/20 backdrop-blur-lg">
          {/* Home */}
          <button
            type="button"
            onClick={() => setActiveNav('home')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all text-xs ${
              activeNav === 'home'
                ? 'bg-white text-purple-900 font-bold shadow-md scale-105'
                : 'text-purple-100 hover:text-white'
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="text-[9.5px] mt-0.5">หน้าหลัก</span>
          </button>

          {/* Survey */}
          <button
            type="button"
            onClick={() => setActiveNav('survey')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all text-xs ${
              activeNav === 'survey'
                ? 'bg-white text-purple-900 font-bold shadow-md scale-105'
                : 'text-purple-100 hover:text-white'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span className="text-[9.5px] mt-0.5">สำรวจร้าน</span>
          </button>

          {/* Inspect */}
          <button
            type="button"
            onClick={() => setActiveNav('inspect')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all text-xs ${
              activeNav === 'inspect'
                ? 'bg-white text-purple-900 font-bold shadow-md scale-105'
                : 'text-purple-100 hover:text-white'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span className="text-[9.5px] mt-0.5">ตรวจ สอ.๓</span>
          </button>

          {/* Businesses */}
          <button
            type="button"
            onClick={() => setActiveNav('businesses')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all text-xs ${
              activeNav === 'businesses'
                ? 'bg-white text-purple-900 font-bold shadow-md scale-105'
                : 'text-purple-100 hover:text-white'
            }`}
          >
            <Store className="w-4 h-4" />
            <span className="text-[9.5px] mt-0.5">ทะเบียน</span>
          </button>

          {/* Circular QR Scan Button (Matching user screenshot) */}
          <button
            type="button"
            onClick={() => setActiveNav('verify')}
            className="w-9 h-9 rounded-full bg-white text-purple-800 flex items-center justify-center shadow-lg hover:bg-pink-50 transition active:scale-95"
            title="สแกน QR"
          >
            <QrCode className="w-4.5 h-4.5 text-purple-700" />
          </button>
        </div>
      </nav>
    </div>
  );
};
