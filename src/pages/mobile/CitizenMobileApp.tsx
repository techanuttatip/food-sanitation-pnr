import React, { useState } from 'react';
import {
  Search,
  Store,
  QrCode,
  CreditCard,
  MessageSquare,
  Sparkles,
  Bell,
  CheckCircle2,
  Bookmark,
  Eye,
  BookOpen,
  X,
  Menu,
  RefreshCw,
} from 'lucide-react';
import { formatThaiDate } from '../../lib/utils';
import { DEMO_BUSINESSES, DEMO_APPLICATIONS } from '../../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '../../context/ToastContext';

export interface CitizenMobileAppProps {
  onSwitchToDesktop?: () => void;
  onNavigateToTab?: (tabId: string) => void;
}

export const CitizenMobileApp: React.FC<CitizenMobileAppProps> = ({
  onSwitchToDesktop,
  onNavigateToTab,
}) => {
  const { success, info, error } = useToast();
  const [activeNav, setActiveNav] = useState<'home' | 'my-requests' | 'articles' | 'services' | 'search'>('home');

  // Modals
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [selectedNews, setSelectedNews] = useState<any | null>(null);

  // Tracking state
  const [trackCode, setTrackCode] = useState('TRK-2569-SEAFOOD');
  const [trackedApp, setTrackedApp] = useState<any | null>(DEMO_APPLICATIONS[0] || null);

  // Verification state
  const [verifyToken, setVerifyToken] = useState('');
  const [verifiedBiz, setVerifiedBiz] = useState<any | null>(null);

  // New Application Form state
  const [newBizName, setNewBizName] = useState('');
  const [newBizType, setNewBizType] = useState('สถานที่สะสมอาหารสำเร็จรูป');
  const [newAreaSqm, setNewAreaSqm] = useState('80');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newMoo, setNewMoo] = useState('1');

  // Interactive News data
  const NEWS_ITEMS = [
    {
      id: 'news-1',
      title: 'ประชาสัมพันธ์: ตรวจประเมินมาตรฐานสุขาภิบาลสถานที่สะสมอาหาร ประจำปี ๒๕๖๙',
      date: '21 ส.ค. 69',
      views: 48,
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
      category: 'ข่าวประชาสัมพันธ์',
      content: 'งานสาธารณสุขและสิ่งแวดล้อม อบต.โป่งน้ำร้อน ขอเชิญชวนผู้ประกอบการสถานที่จำหน่ายอาหารและสถานที่สะสมอาหาร ยื่นคำขอต่ออายุใบอนุญาตล่วงหน้าก่อนสิ้นอายุ ๓๐ วัน ผ่านระบบออนไลน์ได้ตลอด ๒๔ ชั่วโมง',
    },
    {
      id: 'news-2',
      title: 'แนวทางปฏิบัติการควบคุมอุณหภูมิห้องเย็นแช่แข็งอาหารสด ตาม พ.ร.บ. สาธารณสุข',
      date: '18 ส.ค. 69',
      views: 35,
      image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=600&q=80',
      category: 'ระเบียบกฎหมาย',
      content: 'สถานที่สะสมอาหารสดแช่เย็นต้องควบคุมอุณหภูมิให้อยู่ระหว่าง 0°C ถึง 4°C และแช่เยือกแข็งไม่เกิน -18°C พร้อมติดตั้งเทอร์โมมิเตอร์ตรวจสอบอย่างสม่ำเสมอ',
    },
    {
      id: 'news-3',
      title: 'มาตรการสุขอนามัยสำหรับผู้สัมผัสอาหารและการล้างทำความสะอาดภาชนะ',
      date: '15 ส.ค. 69',
      views: 29,
      image: 'https://images.unsplash.com/photo-1577106263724-2c8e03bfe9cf?auto=format&fit=crop&w=600&q=80',
      category: 'สุขอนามัย',
      content: 'ผู้สัมผัสอาหารต้องผ่านการอบรมหลักสูตรสุขาภิบาลอาหาร และมีใบรับรองแพทย์ตรวจสุขภาพประจำปี ไม่เป็นโรคติดต่อตามที่กำหนด',
    },
  ];

  // Activities Data
  const ACTIVITY_ITEMS = [
    {
      id: 'act-1',
      title: 'จนท. สาธารณสุขลงพื้นที่ตรวจสุขาภิบาลโกดังและคลังอาหาร ม.1 - ม.3',
      date: '19 ส.ค. 69',
      views: 52,
      image: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=600&q=80',
      content: 'ทีมตรวจสุขาภิบาล อบต.โป่งน้ำร้อน ออกตรวจติดตามมาตรฐานความสะอาด การระบายอากาศ และระบบกำจัดแมลงและสัตว์นำโรค',
    },
    {
      id: 'act-2',
      title: 'การประชุมชี้แจงแนวทางการยื่นขอใบอนุญาตออนไลน์ อบต.โป่งน้ำร้อน',
      date: '14 ส.ค. 69',
      views: 67,
      image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80',
      content: 'ผู้บริหาร อบต.โป่งน้ำร้อน ร่วมกับชมรมผู้ประกอบการอาหาร ประชุมหารือการยกระดับสู่เมืองอาหารปลอดภัย Smart Food Sanitation',
    },
  ];

  // Knowledge Articles Data (Matching user screenshot)
  const KNOWLEDGE_ARTICLES = [
    {
      id: 'art-1',
      title: '๕ เกณฑ์สำคัญตรวจประเมินสถานที่สะสมอาหาร',
      desc: 'โครงสร้าง, การระบายอากาศ, อุณหภูมิ, การจัดการขยะ, สุขอนามัยบุคคล',
      views: 89,
      image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80',
      content: '๑. โครงสร้างอาคารมั่นคง แข็งแรง สะอาด ไม่อยู่ใกล้แหล่งมลพิษ\n๒. พื้น ผนัง เพดาน เรียบ ทำความสะอาดง่าย\n๓. จัดวางอาหารสูงจากพื้นอย่างน้อย ๑๕ ซม.\n๔. ควบคุมอุณหภูมิห้องเย็นสม่ำเสมอ\n๕. ผู้สัมผัสอาหารสวมเครื่องแต่งกายสะอาดมิดชิด',
    },
    {
      id: 'art-2',
      title: 'การเก็บรักษาวัตถุดิบอาหารแช่เย็น-แช่แข็ง',
      desc: 'เทคนิคการรักษาคุณภาพอาหารสดและป้องกันเชื้อแบคทีเรีย',
      views: 74,
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      content: 'อาหารสดเนื้อสัตว์ควรแบ่งเป็นสัดส่วนพอดีใช้งาน บรรจุในถุงมิดชิด และระบุวันที่รับเข้าเพื่อใช้ระบบ First-In First-Out (FIFO)',
    },
    {
      id: 'art-3',
      title: '๕ จุดที่ไม่ควรละเลยในสถานที่สะสมอาหาร',
      desc: 'บ่อดักไขมัน, ม่านกันแมลง, ตะแกรงท่อระบายน้ำ, ถังขยะมีฝาปิด',
      views: 63,
      image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80',
      content: 'จุดเสี่ยงสำคัญที่สุดคือท่อระบายน้ำที่ไม่มีตะแกรงดักกลิ่น และถังขยะที่เปิดทิ้งไว้ เป็นแหล่งเพาะพันธุ์ของแมลงสาบและหนู',
    },
    {
      id: 'art-4',
      title: 'สุขอนามัยส่วนบุคคลของผู้สัมผัสอาหาร',
      desc: 'ล้างมือ 7 ขั้นตอน, สวมหมวกคลุมผม, ตรวจสุขภาพประจำปี',
      views: 95,
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80',
      content: 'ผู้สัมผัสอาหารทุกคนต้องตัดเล็บสั้น ไม่สวมเครื่องประดับขณะปฏิบัติงาน และต้องล้างมือทุกครั้งก่อนสัมผัสอาหาร',
    },
  ];

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizName.trim() || !newOwnerName.trim() || !newPhone.trim()) {
      error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    const trackingNo = `TRK-2569-${Math.floor(1000 + Math.random() * 9000)}`;
    success('ยื่นคำขอสำเร็จแล้ว! 🎉', `รหัสติดตามคำขอของคุณคือ: ${trackingNo}`);
    setIsApplyModalOpen(false);
    setTrackCode(trackingNo);
    setIsTrackModalOpen(true);
  };

  const handleSearchVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const q = verifyToken.trim().toLowerCase();
    const found = DEMO_BUSINESSES.find(
      (b) =>
        b.current_license?.verification_token?.toLowerCase().includes(q) ||
        b.current_license?.license_number?.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q)
    );
    if (found) {
      setVerifiedBiz(found);
      success('พบข้อมูลใบอนุญาตถูกต้อง ✅', found.name);
    } else {
      setVerifiedBiz(null);
      error('ไม่พบข้อมูลใบอนุญาต', 'กรุณาตรวจสอบรหัสหรือชื่อร้านอีกครั้ง');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24 select-none">
      {/* Top Floating App Bar */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white shadow-md">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo & Org Name Pill */}
          <div className="flex items-center gap-2.5 bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
            <div className="w-7 h-7 rounded-full bg-white p-0.5 shadow-xs shrink-0 flex items-center justify-center">
              <img src="/logo_obt_pnr.png" alt="ตรา อบต." className="w-full h-full object-contain" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold leading-tight">องค์การบริหารส่วนตำบลโป่งน้ำร้อน</div>
              <div className="text-[9px] text-purple-200 leading-tight">งานสาธารณสุขและสิ่งแวดล้อม</div>
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => info('การแจ้งเตือน 🔔', 'ไม่มีการแจ้งเตือนใหม่ในขณะนี้')}
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition active:scale-95 relative"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full ring-2 ring-purple-800 animate-pulse" />
            </button>

            {onSwitchToDesktop && (
              <button
                type="button"
                onClick={onSwitchToDesktop}
                className="px-2.5 py-1 rounded-full bg-amber-400 hover:bg-amber-300 text-amber-950 text-[11px] font-bold shadow-xs transition active:scale-95 flex items-center gap-1"
                title="กลับสู่ระบบแอดมิน"
              >
                <span>🖥️ โต๊ะทำงาน</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto">
        {/* Hero Section with Beautiful Community Background & Curved Waves */}
        <div className="relative overflow-hidden bg-gradient-to-b from-purple-800 via-purple-700 to-indigo-800 text-white">
          {/* Background Scenic Overlay */}
          <div className="absolute inset-0 opacity-25 mix-blend-overlay pointer-events-none">
            <img
              src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"
              alt="Community Scenic"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="relative px-5 pt-4 pb-10 text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-purple-100 text-xs font-semibold border border-white/20 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
              <span>Smart Food Sanitation Services 2026</span>
            </div>

            <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-sm">
              สาธารณสุข ให้บริการ
            </h1>
            <p className="text-xs text-purple-100 max-w-xs mx-auto leading-relaxed">
              ระบบบริการประชาชนและผู้ประกอบการสถานที่สะสมอาหาร อบต.โป่งน้ำร้อน อ.ฝาง จ.เชียงใหม่
            </p>

            <div className="pt-1 text-[11px] font-bold text-pink-200 italic">
              "เรื่องสุขภาพและสุขาภิบาลอาหาร เราดูแล 💖"
            </div>
          </div>

          {/* Curved Wave SVG Divider (Matching User Screenshot) */}
          <div className="w-full overflow-hidden leading-none">
            <svg
              className="relative block w-full h-8 text-pink-50"
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
            >
              <path
                d="M0,0 C150,90 350,-40 500,60 C650,160 900,10 1200,40 L1200,120 Z"
                fill="currentColor"
              ></path>
            </svg>
          </div>
        </div>

        {/* Primary Service Grid Section (Pink/Lavender Card matching screenshot) */}
        <div className="bg-pink-50 px-4 pt-1 pb-6 space-y-4">
          {/* Marquee Ticker Announcement */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white shadow-xs border border-pink-200/80 text-xs text-purple-900 overflow-hidden">
            <span className="px-2 py-0.5 rounded-lg bg-purple-600 text-white font-bold text-[10px] shrink-0">
              📢 ประกาศ
            </span>
            <div className="truncate text-slate-700 font-medium">
              อบต.โป่งน้ำร้อน ยินดีให้บริการ... ยื่นคำขอใบอนุญาตสะสมอาหารออนไลน์ได้ตลอด 24 ชม.
            </div>
          </div>

          {/* 4 Primary Action Circular/Rounded Cards (Matching user screenshot) */}
          <div className="grid grid-cols-4 gap-2.5">
            {/* 1. New License */}
            <button
              type="button"
              onClick={() => setIsApplyModalOpen(true)}
              className="flex flex-col items-center justify-center p-2.5 bg-white rounded-2xl shadow-xs hover:shadow-md border border-pink-100 transition active:scale-95 group text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Store className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 mt-2 leading-tight">
                ยื่นขอใบอนุญาต
              </span>
              <span className="text-[9px] text-slate-400 mt-0.5">ออนไลน์</span>
            </button>

            {/* 2. Renew License */}
            <button
              type="button"
              onClick={() => {
                setIsApplyModalOpen(true);
                info('ต่ออายุใบอนุญาต 🔄', 'กรุณากรอกเลขใบอนุญาตเดิมและข้อมูลร้านค้า');
              }}
              className="flex flex-col items-center justify-center p-2.5 bg-white rounded-2xl shadow-xs hover:shadow-md border border-pink-100 transition active:scale-95 group text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <RefreshCw className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 mt-2 leading-tight">
                ต่ออายุใบอนุญาต
              </span>
              <span className="text-[9px] text-slate-400 mt-0.5">ล่วงหน้า 30 วัน</span>
            </button>

            {/* 3. Track Status */}
            <button
              type="button"
              onClick={() => setIsTrackModalOpen(true)}
              className="flex flex-col items-center justify-center p-2.5 bg-white rounded-2xl shadow-xs hover:shadow-md border border-pink-100 transition active:scale-95 group text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Search className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 mt-2 leading-tight">
                ติดตามคำขอ
              </span>
              <span className="text-[9px] text-slate-400 mt-0.5">สถานะ Real-time</span>
            </button>

            {/* 4. Verify QR */}
            <button
              type="button"
              onClick={() => setIsVerifyModalOpen(true)}
              className="flex flex-col items-center justify-center p-2.5 bg-white rounded-2xl shadow-xs hover:shadow-md border border-pink-100 transition active:scale-95 group text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <QrCode className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 mt-2 leading-tight">
                สแกนตรวจ QR
              </span>
              <span className="text-[9px] text-slate-400 mt-0.5">ร้านที่ได้เกณฑ์</span>
            </button>
          </div>

          {/* Extra Secondary Quick Actions */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsPayModalOpen(true)}
              className="flex items-center gap-2 p-2.5 bg-white/80 backdrop-blur-xs rounded-xl border border-pink-100 hover:bg-white text-left transition active:scale-95"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 leading-tight">ชำระค่าธรรมเนียม</div>
                <div className="text-[9px] text-slate-500">QR PromptPay</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onNavigateToTab) onNavigateToTab('live-chat');
                else success('เปิดระบบแชท LINE 💬', 'ติดต่อเจ้าหน้าที่งานสุขาภิบาล อบต.โป่งน้ำร้อน');
              }}
              className="flex items-center gap-2 p-2.5 bg-white/80 backdrop-blur-xs rounded-xl border border-pink-100 hover:bg-white text-left transition active:scale-95"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 leading-tight">แชทปรึกษา จนท.</div>
                <div className="text-[9px] text-slate-500">LINE Official</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedArticle(KNOWLEDGE_ARTICLES[0])}
              className="flex items-center gap-2 p-2.5 bg-white/80 backdrop-blur-xs rounded-xl border border-pink-100 hover:bg-white text-left transition active:scale-95"
            >
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 leading-tight">คู่มือสุขาภิบาล</div>
                <div className="text-[9px] text-slate-500">เกณฑ์มาตรฐาน</div>
              </div>
            </button>
          </div>
        </div>

        {/* SECTION 1: ข่าวสำคัญ (News & Announcements - Matching Screenshot 1) */}
        <section className="px-4 py-5 space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <span>ข่าวสำคัญ</span>
            </h2>
            <button
              type="button"
              onClick={() => setActiveNav('articles')}
              className="px-3 py-1 rounded-full bg-pink-500 hover:bg-pink-600 text-white text-[11px] font-bold shadow-xs transition active:scale-95"
            >
              ดูทั้งหมด
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {NEWS_ITEMS.slice(0, 2).map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedNews(item)}
                className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200/80 shadow-2xs hover:shadow-md transition active:scale-98 cursor-pointer flex flex-col"
              >
                <div className="h-28 w-full overflow-hidden relative">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-purple-900/80 text-white text-[9px] font-semibold backdrop-blur-xs">
                    {item.category}
                  </span>
                </div>
                <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2">
                  <h3 className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight">
                    {item.title}
                  </h3>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                    <span>{item.date}</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Eye className="w-3 h-3" /> {item.views}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 2: ภาพกิจกรรม (Activities & Inspections - Matching Screenshot 1 & 2) */}
        <section className="px-4 py-5 space-y-3 bg-slate-50 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <span>ภาพกิจกรรม</span>
            </h2>
            <button
              type="button"
              onClick={() => setActiveNav('articles')}
              className="px-3 py-1 rounded-full bg-pink-500 hover:bg-pink-600 text-white text-[11px] font-bold shadow-xs transition active:scale-95"
            >
              ดูทั้งหมด
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {ACTIVITY_ITEMS.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedNews(item)}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-2xs hover:shadow-md transition active:scale-98 cursor-pointer flex flex-col"
              >
                <div className="h-28 w-full overflow-hidden relative">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2">
                  <h3 className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight">
                    {item.title}
                  </h3>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                    <span>{item.date}</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Eye className="w-3 h-3" /> {item.views}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3: สุขภาพน่ารู้ / สุขาภิบาลอาหารน่ารู้ (Knowledge Infographics - Matching Screenshot 2) */}
        <section className="px-4 py-5 space-y-3 bg-white border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">สุขภาพ & สุขาภิบาลน่ารู้</h2>
              <p className="text-[11px] text-slate-500">เกณฑ์ความรู้และแนวทางปฏิบัติสุขาภิบาลอาหาร</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveNav('articles')}
              className="px-3 py-1 rounded-full bg-pink-500 hover:bg-pink-600 text-white text-[11px] font-bold shadow-xs transition active:scale-95 shrink-0"
            >
              ดูทั้งหมด
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {KNOWLEDGE_ARTICLES.map((art) => (
              <div
                key={art.id}
                onClick={() => setSelectedArticle(art)}
                className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200/80 shadow-2xs hover:shadow-md transition active:scale-98 cursor-pointer flex flex-col"
              >
                <div className="h-24 w-full overflow-hidden relative">
                  <img src={art.image} alt={art.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-2.5 flex-1 flex flex-col justify-between space-y-1">
                  <h3 className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight">
                    {art.title}
                  </h3>
                  <p className="text-[10px] text-slate-500 line-clamp-1">{art.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Footer */}
        <footer className="px-4 py-8 bg-slate-900 text-slate-300 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-white p-1 shadow-md">
            <img src="/logo_obt_pnr.png" alt="ตรา อบต." className="w-full h-full object-contain" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">งานสาธารณสุขและสิ่งแวดล้อม</h4>
            <p className="text-xs text-slate-400">องค์การบริหารส่วนตำบลโป่งน้ำร้อน อ.ฝาง จ.เชียงใหม่ 50110</p>
            <p className="text-xs text-slate-400 mt-1">โทรศัพท์: 053-885-123 • LINE OA: @634eafmr</p>
          </div>
          <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800">
            ระบบบริหารจัดการสถานที่สะสมอาหาร พ.ร.บ. สาธารณสุข ๒๕๓๕ © 2026
          </div>
        </footer>
      </main>

      {/* Floating Pill Bottom Navigation Bar (Matching User Screenshot) */}
      <nav className="fixed bottom-4 left-0 right-0 z-50 px-4 max-w-md mx-auto">
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
            <Store className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">หน้าแรก</span>
          </button>

          {/* My Requests / Favorites */}
          <button
            type="button"
            onClick={() => {
              setActiveNav('my-requests');
              setIsTrackModalOpen(true);
            }}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all text-xs ${
              activeNav === 'my-requests'
                ? 'bg-white text-purple-900 font-bold shadow-md scale-105'
                : 'text-purple-100 hover:text-white'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">คำขอของฉัน</span>
          </button>

          {/* Menu / Services */}
          <button
            type="button"
            onClick={() => {
              setActiveNav('services');
              setIsApplyModalOpen(true);
            }}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all text-xs ${
              activeNav === 'services'
                ? 'bg-white text-purple-900 font-bold shadow-md scale-105'
                : 'text-purple-100 hover:text-white'
            }`}
          >
            <Menu className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">บริการ</span>
          </button>

          {/* Circular Search / Scan Button (Matching user screenshot) */}
          <button
            type="button"
            onClick={() => setIsVerifyModalOpen(true)}
            className="w-10 h-10 rounded-full bg-white text-purple-800 flex items-center justify-center shadow-lg hover:bg-pink-50 transition active:scale-95"
            title="ค้นหา / สแกน QR"
          >
            <Search className="w-5 h-5 text-purple-700" />
          </button>
        </div>
      </nav>

      {/* MODAL 1: ยื่นคำขอใบอนุญาตออนไลน์ */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">ยื่นคำขอใบอนุญาตสะสมอาหาร</h3>
                  <p className="text-[10px] text-slate-500">กรอกข้อมูลเพื่อส่งเรื่องให้เจ้าหน้าที่ตรวจสอบ</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">ชื่อสถานประกอบกิจการ / ชื่อร้าน *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น คลังสินค้าอาหารแช่แข็ง โป่งน้ำร้อน"
                  value={newBizName}
                  onChange={(e) => setNewBizName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ประเภทสถานประกอบการ</label>
                  <select
                    value={newBizType}
                    onChange={(e) => setNewBizType(e.target.value)}
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
                    value={newAreaSqm}
                    onChange={(e) => setNewAreaSqm(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ชื่อ-นามสกุล ผู้ขอรับใบอนุญาต *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น นายสมคิด พงษ์สุข"
                  value={newOwnerName}
                  onChange={(e) => setNewOwnerName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">หมายเลขโทรศัพท์ *</label>
                  <input
                    type="tel"
                    required
                    placeholder="081-xxx-xxxx"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">หมู่ที่ (ต.โป่งน้ำร้อน)</label>
                  <select
                    value={newMoo}
                    onChange={(e) => setNewMoo(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>หมู่ที่ {i + 1}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-950 text-[11px] flex items-center justify-between">
                <div>
                  <span className="font-bold">ค่าธรรมเนียมประมาณการ:</span> {((Number(newAreaSqm) || 50) * 15).toLocaleString()} บาท/ปี
                </div>
                <span className="text-[10px] text-purple-700">คำนวณตามขนาดพื้นที่</span>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold shadow-md active:scale-95 transition"
                >
                  ส่งคำขอออนไลน์
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ติดตามสถานะคำขอ (Tracking) */}
      {isTrackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">ติดตามสถานะคำขอ</h3>
                  <p className="text-[10px] text-slate-500">ตรวจสอบความคืบหน้าของใบอนุญาต</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTrackModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2 text-xs">
              <input
                type="text"
                value={trackCode}
                onChange={(e) => setTrackCode(e.target.value)}
                placeholder="กรอกรหัสคำขอ เช่น TRK-2569-SEAFOOD"
                className="flex-1 p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => {
                  const found = DEMO_APPLICATIONS.find((a) => a.tracking_code?.toLowerCase().includes(trackCode.trim().toLowerCase()));
                  setTrackedApp(found || DEMO_APPLICATIONS[0]);
                  success('ค้นหาข้อมูลสำเร็จ ✨');
                }}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-xs"
              >
                ค้นหา
              </button>
            </div>

            {trackedApp && (
              <div className="space-y-4 pt-2">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-slate-500 block">เลขที่คำขอ / รหัสติดตาม</span>
                      <span className="font-bold text-slate-900 font-mono text-sm">{trackedApp.tracking_code}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      {trackedApp.status === 'LICENSE_ISSUED' ? '✅ ออกใบอนุญาตแล้ว' : '🟡 กำลังดำเนินการ'}
                    </span>
                  </div>
                  <div className="border-t pt-2 space-y-1">
                    <p>ชื่อร้าน: <strong>{trackedApp.business?.name || 'คลังสินค้าอาหารแช่เย็น'}</strong></p>
                    <p>ประเภท: <span>{trackedApp.business?.business_type || 'คลังสินค้าอาหารแช่เย็น'}</span></p>
                    <p>วันที่ยื่น: <span>{formatThaiDate(trackedApp.submitted_date)}</span></p>
                  </div>
                </div>

                {/* Timeline Progress */}
                <div className="space-y-3 pl-2">
                  <div className="text-xs font-bold text-slate-800">ขั้นตอนการดำเนินงาน:</div>
                  {[
                    { title: 'ยื่นคำขอออนไลน์', date: '10 ม.ค. 69', done: true },
                    { title: 'เจ้าหน้าที่ตรวจเอกสาร', date: '12 ม.ค. 69', done: true },
                    { title: 'ตรวจสุขาภิบาลสถานที่', date: '15 ม.ค. 69', done: true },
                    { title: 'ชำระค่าธรรมเนียม', date: '18 ม.ค. 69', done: true },
                    { title: 'นายก อบต. ลงนามออกใบอนุญาต', date: '20 ม.ค. 69', done: true },
                  ].map((step, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-xs">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${step.done ? 'bg-emerald-600' : 'bg-slate-300'}`}>
                        ✓
                      </div>
                      <div className="flex-1 flex justify-between">
                        <span className={step.done ? 'font-bold text-slate-900' : 'text-slate-400'}>{step.title}</span>
                        <span className="text-[10px] text-slate-400">{step.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: สแกนตรวจ QR ใบอนุญาต (Verify) */}
      {isVerifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">ตรวจสอบร้านค้าสุขาภิบาล</h3>
                  <p className="text-[10px] text-slate-500">ตรวจสอบใบอนุญาตที่ผ่านการรับรอง</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsVerifyModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSearchVerify} className="flex gap-2 text-xs">
              <input
                type="text"
                placeholder="กรอกชื่อร้าน หรือ เลขใบอนุญาต เช่น 01/2569"
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value)}
                className="flex-1 p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
              >
                ตรวจ
              </button>
            </form>

            {verifiedBiz && (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-300 space-y-3 text-xs animate-in zoom-in-95">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>ผ่านการรับรองสุขาภิบาลอาหาร</span>
                </div>
                <div className="space-y-1 text-slate-800">
                  <p className="text-base font-black text-slate-900">{verifiedBiz.name}</p>
                  <p>ประเภท: <strong>{verifiedBiz.business_type}</strong></p>
                  <p>เลขที่ใบอนุญาต: <strong className="text-emerald-800">{verifiedBiz.current_license?.license_number || 'สส. 01/2569'}</strong></p>
                  <p>วันหมดอายุ: <span>{formatThaiDate(verifiedBiz.current_license?.expiry_date || '2027-01-19')}</span></p>
                  <p>ที่ตั้ง: <span>ต.โป่งน้ำร้อน อ.ฝาง จ.เชียงใหม่</span></p>
                </div>
                <div className="pt-2 text-[10px] text-emerald-700 border-t border-emerald-200">
                  ⭐️ ผ่านเกณฑ์มาตรฐานพระราชบัญญัติการสาธารณสุข พ.ศ. ๒๕๓๕
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 4: ชำระค่าธรรมเนียม (PromptPay QR) */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl text-center">
            <div className="flex items-center justify-between border-b pb-3 text-left">
              <div>
                <h3 className="text-sm font-bold text-slate-900">ชำระค่าธรรมเนียมออนไลน์</h3>
                <p className="text-[10px] text-slate-500">QR PromptPay งานสาธารณสุข อบต.โป่งน้ำร้อน</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="text-xs text-slate-500">ยอดชำระค่าธรรมเนียมใบอนุญาต (ประจำปี ๒๕๖๙)</div>
              <div className="text-2xl font-black text-indigo-700">3,750.00 บาท</div>
              <div className="flex justify-center p-3 bg-white rounded-2xl border border-slate-200 shadow-xs inline-block">
                <QRCodeSVG value="https://promptpay.io/053885123/3750" size={160} />
              </div>
              <div className="text-[11px] text-slate-600 font-bold">
                สแกนจ่ายได้ทุกแอปธนาคาร • ไม่มีค่าธรรมเนียม
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                success('บันทึกการชำระเงินเรียบร้อย ✨', 'ระบบออกใบเสร็จรับเงินให้อัตโนมัติ');
                setIsPayModalOpen(false);
              }}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md active:scale-95 transition"
            >
              แนบสลิป / แจ้งชำระเงินแล้ว
            </button>
          </div>
        </div>
      )}

      {/* MODAL 5: อ่านบทความสาระน่ารู้ / ข่าว */}
      {(selectedArticle || selectedNews) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl max-h-[85vh] flex flex-col">
            <div className="relative h-48 w-full shrink-0">
              <img
                src={(selectedArticle || selectedNews).image}
                alt={(selectedArticle || selectedNews).title}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setSelectedArticle(null);
                  setSelectedNews(null);
                }}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 text-xs leading-relaxed">
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {(selectedArticle || selectedNews).title}
              </h3>
              <div className="flex items-center gap-3 text-[10px] text-slate-400 border-b pb-2">
                <span>อบต.โป่งน้ำร้อน</span>
                <span>•</span>
                <span>{(selectedArticle || selectedNews).date || 'สาระน่ารู้'}</span>
              </div>
              <div className="text-slate-700 whitespace-pre-line pt-1 text-sm">
                {(selectedArticle || selectedNews).content}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSelectedArticle(null);
                  setSelectedNews(null);
                }}
                className="px-4 py-2 rounded-xl bg-purple-700 text-white font-bold text-xs shadow-xs"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
