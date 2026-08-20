import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { lineService, LineAccount, NotificationLogItem } from '../services/lineService';
import { businessService } from '../services/businessService';
import { useToast } from '../context/ToastContext';
import { formatThaiDate } from '../lib/utils';
import { QRCodeSVG } from 'qrcode.react';
import type { Business } from '../types';
import {
  MessageSquare,
  Smartphone,
  Send,
  QrCode,
  CheckCircle2,
  Calendar,
  CreditCard,
  Award,
  AlertTriangle,
  Users,
  Bell,
  Sparkles,
  Search,
  ExternalLink,
  Clock,
  Shield,
  FileCheck,
  Check,
  Copy,
  Trash2,
  Edit3,
  UserPlus,
  HelpCircle,
  Link2,
} from 'lucide-react';

import { applicationService } from '../services/applicationService';

import { InboundLineSender } from '../services/lineService';

export const LineIntegration: React.FC = () => {
  const { success, error } = useToast();
  const [accounts, setAccounts] = useState<LineAccount[]>([]);
  const [logs, setLogs] = useState<NotificationLogItem[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [inboundSenders, setInboundSenders] = useState<InboundLineSender[]>([]);
  const [activeTab, setActiveTab] = useState<'simulator' | 'accounts' | 'logs' | 'guide' | 'channel' | 'batch'>('simulator');

  const lineOaId = import.meta.env.VITE_LINE_OA_ID || '@634eafmr';
  const lineChannelId = import.meta.env.VITE_LINE_CHANNEL_ID || '2011166540';
  const lineOaUrl = `https://line.me/R/ti/p/${lineOaId.replace('@', '%40')}`;

  // Simulator Dynamic Controls State
  const [selectedTemplate, setSelectedTemplate] = useState<'APPOINTMENT' | 'DOC_REJECTED' | 'PAYMENT_DUE' | 'LICENSE_ISSUED'>('APPOINTMENT');
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
  
  // Custom Flex Inputs
  const [customDate, setCustomDate] = useState('2026-03-05');
  const [customTimeSlot, setCustomTimeSlot] = useState('10:00 - 11:30 น.');
  const [customInspector, setCustomInspector] = useState('นายไพโรจน์ สว่างเวียง (จนท. สาธารณสุข)');
  const [customDefect, setCustomDefect] = useState('ใบรับรองแพทย์ผู้สัมผัสอาหารหมดอายุ กรุณาอัปโหลดเอกสารใหม่');
  const [customAmount, setCustomAmount] = useState('2,700.00');
  const [customLicenseNo, setCustomLicenseNo] = useState('สส. 01/2569');

  const [isSending, setIsSending] = useState(false);
  const [linkingAccount, setLinkingAccount] = useState<LineAccount | null>(null);

  // Batch Tab State
  const [batchGroup, setBatchGroup] = useState<'all' | 'expiring' | 'pending' | 'custom'>('all');
  const [batchSelectedAccounts, setBatchSelectedAccounts] = useState<string[]>([]);
  const [batchTemplate, setBatchTemplate] = useState<'announcement' | 'holiday' | 'inspection' | 'custom'>('announcement');
  const [batchHolidayStart, setBatchHolidayStart] = useState('2026-04-12');
  const [batchHolidayEnd, setBatchHolidayEnd] = useState('2026-04-16');
  const [batchInspectionDate, setBatchInspectionDate] = useState('2026-05-01 ถึง 2026-05-31');
  const [batchCustomMsg, setBatchCustomMsg] = useState('สวัสดีผู้ประกอบการทุกท่าน...');
  const [isSendingBatch, setIsSendingBatch] = useState(false);

  const getBatchRecipients = () => {
    switch (batchGroup) {
      case 'all': return accounts.map(a => a.line_user_id);
      case 'expiring': return accounts.slice(0, Math.max(1, Math.floor(accounts.length / 3))).map(a => a.line_user_id); // Mock
      case 'pending': return accounts.slice(0, Math.max(1, Math.floor(accounts.length / 4))).map(a => a.line_user_id); // Mock
      case 'custom': return batchSelectedAccounts;
      default: return [];
    }
  };

  const handleSendBatch = async () => {
    const recipients = getBatchRecipients();
    if (recipients.length === 0) {
      error('ไม่มีผู้รับ', 'กรุณาเลือกผู้รับอย่างน้อย 1 ราย');
      return;
    }
    if (!window.confirm(`ยืนยันการส่งข้อความหมู่ถึงผู้รับ ${recipients.length} ราย?`)) return;

    setIsSendingBatch(true);
    try {
      let msgObj: any = { type: 'text', text: batchCustomMsg };
      
      if (batchTemplate === 'announcement') {
        msgObj = {
          type: 'flex',
          altText: '📢 ประกาศจาก อบต. โป่งน้ำร้อน',
          contents: {
            type: 'bubble',
            header: {
              type: 'box',
              layout: 'vertical',
              backgroundColor: '#0284c7',
              paddingAll: '16px',
              contents: [
                { type: 'text', text: 'ประกาศจาก อบต. โป่งน้ำร้อน', color: '#ffffff', weight: 'bold', size: 'md' }
              ]
            },
            body: {
              type: 'box',
              layout: 'vertical',
              paddingAll: '16px',
              contents: [
                { type: 'text', text: 'เรื่อง: กฎเกณฑ์สุขาภิบาลใหม่ ปี 2569', weight: 'bold', size: 'sm', wrap: true },
                { type: 'text', text: 'ขอความร่วมมือผู้ประกอบการทุกท่านตรวจสอบมาตรฐานร้านค้าให้เป็นไปตามกฎหมายใหม่', margin: 'md', size: 'xs', color: '#64748b', wrap: true }
              ]
            }
          }
        };
      } else if (batchTemplate === 'holiday') {
         msgObj = {
          type: 'flex',
          altText: 'แจ้งช่วงหยุดยาว',
          contents: {
            type: 'bubble',
            body: {
              type: 'box',
              layout: 'vertical',
              paddingAll: '16px',
              contents: [
                { type: 'text', text: '🌴 แจ้งวันหยุดราชการ', weight: 'bold', size: 'md', color: '#10b981' },
                { type: 'text', text: `ตั้งแต่วันที่ ${formatThaiDate(batchHolidayStart)} ถึง ${formatThaiDate(batchHolidayEnd)}`, margin: 'md', size: 'sm', wrap: true },
                { type: 'text', text: 'งดให้บริการออกใบอนุญาตและตรวจสถานที่ชั่วคราว', margin: 'sm', size: 'xs', color: '#64748b', wrap: true }
              ]
            }
          }
        };
      } else if (batchTemplate === 'inspection') {
        msgObj = {
          type: 'flex',
          altText: 'แจ้งตรวจประจำปี',
          contents: {
            type: 'bubble',
            body: {
              type: 'box',
              layout: 'vertical',
              paddingAll: '16px',
              contents: [
                { type: 'text', text: '🩺 แจ้งกำหนดการตรวจประจำปี', weight: 'bold', size: 'md', color: '#f59e0b' },
                { type: 'text', text: `ช่วงเวลา: ${batchInspectionDate}`, margin: 'md', size: 'sm', wrap: true },
                { type: 'text', text: 'เจ้าหน้าที่จะลงพื้นที่เพื่อตรวจประเมินตามมาตรฐานสาธารณสุข', margin: 'sm', size: 'xs', color: '#64748b', wrap: true }
              ]
            }
          }
        };
      }

      const { sent, failed } = await lineService.sendBatchMessages(recipients, msgObj);
      success('ส่งข้อความหมู่สำเร็จ', `ส่งสำเร็จ ${sent} ราย, ไม่สำเร็จ ${failed} ราย`);
    } catch (e) {
      error('เกิดข้อผิดพลาด', 'ไม่สามารถส่งข้อความได้');
    } finally {
      setIsSendingBatch(false);
    }
  };

  const renderBatchPreview = () => {
    if (batchTemplate === 'custom') {
      return (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden text-slate-800 text-xs animate-in fade-in p-3">
          <p className="whitespace-pre-wrap">{batchCustomMsg || 'พิมพ์ข้อความ...'}</p>
        </div>
      );
    }
    
    if (batchTemplate === 'announcement') {
      return (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden text-slate-800 text-xs animate-in fade-in">
          <div className="bg-sky-600 text-white p-3.5">
            <h4 className="text-sm font-black mt-0.5">ประกาศจาก อบต. โป่งน้ำร้อน</h4>
          </div>
          <div className="p-3.5 space-y-2">
            <p className="font-bold text-slate-900 text-xs">เรื่อง: กฎเกณฑ์สุขาภิบาลใหม่ ปี 2569</p>
            <p className="text-[11px] text-slate-500">ขอความร่วมมือผู้ประกอบการทุกท่านตรวจสอบมาตรฐานร้านค้าให้เป็นไปตามกฎหมายใหม่</p>
          </div>
        </div>
      );
    }

    if (batchTemplate === 'holiday') {
      return (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden text-slate-800 text-xs animate-in fade-in p-3.5 space-y-2">
           <h4 className="text-sm font-black text-emerald-500">🌴 แจ้งวันหยุดราชการ</h4>
           <p className="font-bold text-slate-800 text-xs">ตั้งแต่วันที่ {formatThaiDate(batchHolidayStart)} ถึง {formatThaiDate(batchHolidayEnd)}</p>
           <p className="text-[11px] text-slate-500">งดให้บริการออกใบอนุญาตและตรวจสถานที่ชั่วคราว</p>
        </div>
      );
    }

    if (batchTemplate === 'inspection') {
      return (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden text-slate-800 text-xs animate-in fade-in p-3.5 space-y-2">
           <h4 className="text-sm font-black text-amber-500">🩺 แจ้งกำหนดการตรวจประจำปี</h4>
           <p className="font-bold text-slate-800 text-xs">ช่วงเวลา: {batchInspectionDate}</p>
           <p className="text-[11px] text-slate-500">เจ้าหน้าที่จะลงพื้นที่เพื่อตรวจประเมินตามมาตรฐานสาธารณสุข</p>
        </div>
      );
    }
    
    return null;
  };

  // Manual Bind Modal State (Dropdown based)
  const [isBindModalOpen, setIsBindModalOpen] = useState(false);
  const [bindBizId, setBindBizId] = useState('');
  const [bindSenderId, setBindSenderId] = useState('');

  const loadData = async () => {
    const [accList, logList, bizList, apps, inbounds] = await Promise.all([
      lineService.getLinkedAccounts(),
      lineService.getNotificationLogs(),
      businessService.getBusinesses(),
      applicationService.getApplications(),
      lineService.getInboundSenders(),
    ]);

    const mergedBiz = [...bizList];
    apps.forEach((app) => {
      if (app.business && !mergedBiz.some((b) => b.id === app.business?.id)) {
        mergedBiz.push(app.business);
      }
    });

    setAccounts(accList);
    setLogs(logList);
    setBusinesses(mergedBiz);
    setInboundSenders(inbounds);

    if (mergedBiz.length > 0) {
      if (!selectedBusinessId) setSelectedBusinessId(mergedBiz[0].id);
      if (!bindBizId) setBindBizId(mergedBiz[0].id);
    }
    if (inbounds.length > 0 && !bindSenderId) {
      setBindSenderId(inbounds[0].line_user_id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const targetBusiness = businesses.find((b) => b.id === selectedBusinessId) || businesses[0] || {
    name: 'คลังสินค้าอาหารแช่เย็น โป่งน้ำร้อนฟู้ดส์',
    business_code: 'FS-500408-0001',
    area_sqm: 180,
  };

  const handleSendTestFlex = async () => {
    setIsSending(true);
    try {
      const titles = {
        APPOINTMENT: `นัดหมายลงตรวจสุขาภิบาล: ${formatThaiDate(customDate)} (${customTimeSlot})`,
        DOC_REJECTED: 'แจ้งเอกสารไม่ครบถ้วน / ให้แก้ไข',
        PAYMENT_DUE: `ใบแจ้งชำระค่าธรรมเนียม (${customAmount} บาท)`,
        LICENSE_ISSUED: `ออกใบอนุญาตจัดตั้งสะสมอาหาร (${customLicenseNo}) เรียบร้อยแล้ว`,
      };

      const messages = {
        APPOINTMENT: `จนท. ${customInspector} มีกำหนดลงตรวจวันที่ ${formatThaiDate(customDate)} เวลา ${customTimeSlot}`,
        DOC_REJECTED: customDefect,
        PAYMENT_DUE: `ยอดชำระ ${customAmount} บาท กำหนดชำระภายใน 7 วัน สแกน QR พร้อมเพย์ได้ทันที`,
        LICENSE_ISSUED: `ใบอนุญาตเลขที่ ${customLicenseNo} อบต.โป่งน้ำร้อน พร้อมดาวน์โหลดแล้ว`,
      };

      await lineService.sendFlexMessage({
        business_id: targetBusiness.id || 'b-001',
        business_name: targetBusiness.name,
        recipient_name: 'ผู้ประกอบการ',
        event_type: selectedTemplate,
        title: titles[selectedTemplate],
        message_preview: messages[selectedTemplate],
      });

      const updatedLogs = await lineService.getNotificationLogs();
      setLogs(updatedLogs);
      success('ส่ง LINE Flex Message สำเร็จ', `ส่งข้อความแจ้งเตือนไปยัง LINE OA (${lineOaId}) ของ "${targetBusiness.name}" เรียบร้อยแล้ว`);
    } finally {
      setIsSending(false);
    }
  };

  const handleBindAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const biz = businesses.find((b) => b.id === bindBizId);
    const sender = inboundSenders.find((s) => s.line_user_id === bindSenderId) || inboundSenders[0];

    if (!biz) {
      error('กรุณาเลือกสถานประกอบการ', '');
      return;
    }
    if (!sender) {
      error('กรุณาเลือกบัญชีผู้ทัก LINE', '');
      return;
    }

    const newAcc: LineAccount = {
      id: `la-${Date.now()}`,
      business_id: biz.id,
      business_name: biz.name,
      line_user_id: sender.line_user_id,
      line_display_name: sender.line_display_name,
      picture_url: sender.picture_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      is_linked: true,
      linked_at: new Date().toISOString(),
      phone_number: biz.owner?.phone_number || '-',
    };

    await lineService.linkAccount(newAcc);
    await loadData();
    setIsBindModalOpen(false);
    success('ผูกบัญชี LINE สำเร็จ ⚡', `เชื่อมโยง LINE "${sender.line_display_name}" เข้ากับร้าน "${biz.name}" เรียบร้อยแล้ว`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    success('คัดลอกสำเร็จ', text);
  };

  const handleDeleteLog = (id: string) => {
    setLogs((prev) => prev.filter((l) => l.id !== id));
    success('ลบประวัติการแจ้งเตือนแล้ว', `ลบรายการ ${id}`);
  };

  const handleDeleteAccount = async (id: string, name: string) => {
    if (window.confirm(`ต้องการยกเลิกการผูกบัญชี LINE ของ "${name}" หรือไม่?`)) {
      await lineService.unlinkAccount(id);
      await loadData();
      success('ยกเลิกการผูกบัญชีแล้ว', `ลบการเชื่อมต่อ LINE ของ ${name}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-emerald-600" />
              ระบบ LINE Official Account & Flex Message Hub
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {lineOaId} • Channel ID: {lineChannelId}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            งานสาธารณสุข อบต.โป่งน้ำร้อน • บริหารการเชื่อมต่อ LINE บัญชีร้านค้า และส่งการแจ้งเตือน Realtime
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={activeTab === 'simulator' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('simulator')}
            leftIcon={<Smartphone className="w-4 h-4" />}
          >
            ส่งข้อความหาร้าน (Flex)
          </Button>
          <Button
            variant={activeTab === 'accounts' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('accounts')}
            leftIcon={<Users className="w-4 h-4" />}
          >
            บัญชีร้านที่ผูก ({accounts.length})
          </Button>
          <Button
            variant={activeTab === 'guide' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('guide')}
            leftIcon={<HelpCircle className="w-4 h-4" />}
          >
            วิธีเชื่อมต่อ LINE
          </Button>
          <Button
            variant={activeTab === 'channel' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('channel')}
            leftIcon={<QrCode className="w-4 h-4" />}
          >
            QR แอดไลน์ อบต.
          </Button>
          <Button
            variant={activeTab === 'batch' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('batch')}
            leftIcon={<Users className="w-4 h-4" />}
          >
            📢 ส่งหมู่
          </Button>
        </div>
      </div>

      {/* Summary Stat Chips: Track LINE Followers & Linked Accounts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400">ผู้ติดตาม LINE OA ทั้งหมด</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5 font-mono">
              {accounts.length} <span className="text-xs text-slate-400 font-normal">คน</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-emerald-600">ผูกบัญชีร้านค้าแล้ว</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5 font-mono">
              {accounts.length} <span className="text-xs text-emerald-400 font-normal">แห่ง</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Link2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-sky-600">ข้อความ Flex ที่ส่งแล้ว</p>
            <p className="text-2xl font-black text-sky-600 mt-0.5 font-mono">
              {logs.length} <span className="text-xs text-sky-400 font-normal">ครั้ง</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Send className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-indigo-600">สถานะ LINE API</p>
            <p className="text-sm font-black text-emerald-600 mt-1 flex items-center gap-1 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              ONLINE (Active)
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 1. Simulator & Direct Message Tab */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Left Panel */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="p-5 bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-600" />
                  ส่งข้อความตรงถึงร้านค้า (Direct Store Dispatcher)
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                {/* Store Selector */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    1. เลือกร้านค้าที่จะส่งข้อความหา:
                  </label>
                  <select
                    value={selectedBusinessId}
                    onChange={(e) => setSelectedBusinessId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 font-semibold text-slate-900 text-xs"
                  >
                    {businesses.length > 0 ? (
                      businesses.map((b) => (
                        <option key={b.id} value={b.id}>
                          🏪 {b.name} ({b.business_code}) - {b.owner?.first_name || 'เจ้าของ'}
                        </option>
                      ))
                    ) : (
                      <option value="">-- ยังไม่มีร้านค้าในระบบ (ใช้ชื่อร้านตัวอย่าง) --</option>
                    )}
                  </select>
                </div>

                {/* Template Selector */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    2. เลือกประเภทข้อความแจ้งเตือน (Flex Template):
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'APPOINTMENT', label: '📅 นัดตรวจสุขาภิบาล', color: 'border-sky-500 bg-sky-50/50' },
                      { key: 'DOC_REJECTED', label: '⚠️ แจ้งเอกสารไม่ผ่าน', color: 'border-rose-500 bg-rose-50/50' },
                      { key: 'PAYMENT_DUE', label: '💳 ใบแจ้งชำระเงิน', color: 'border-amber-500 bg-amber-50/50' },
                      { key: 'LICENSE_ISSUED', label: '🏅 ใบอนุญาตออกแล้ว', color: 'border-emerald-500 bg-emerald-50/50' },
                    ].map((tpl) => (
                      <button
                        key={tpl.key}
                        type="button"
                        onClick={() => setSelectedTemplate(tpl.key as any)}
                        className={`p-2.5 rounded-xl border text-left font-bold transition-all text-xs ${
                          selectedTemplate === tpl.key
                            ? `${tpl.color} border-2 text-slate-900 shadow-xs`
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        {tpl.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* DYNAMIC FIELDS PER TEMPLATE */}
                {selectedTemplate === 'APPOINTMENT' && (
                  <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 space-y-2.5">
                    <p className="font-bold text-sky-900 flex items-center gap-1">
                      <Edit3 className="w-3.5 h-3.5" /> กำหนดวันเวลานัดหมาย (Interactive):
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">เลือกวันที่นัด:</label>
                        <input
                          type="date"
                          value={customDate}
                          onChange={(e) => setCustomDate(e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-300 rounded-lg bg-white font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">ช่วงเวลา:</label>
                        <select
                          value={customTimeSlot}
                          onChange={(e) => setCustomTimeSlot(e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-300 rounded-lg bg-white font-medium"
                        >
                          <option value="09:00 - 10:30 น.">09:00 - 10:30 น.</option>
                          <option value="10:00 - 11:30 น.">10:00 - 11:30 น.</option>
                          <option value="13:30 - 15:00 น.">13:30 - 15:00 น.</option>
                          <option value="15:00 - 16:30 น.">15:00 - 16:30 น.</option>
                        </select>
                      </div>
                    </div>
                    <Input
                      label="เจ้าหน้าที่ผู้ตรวจ:"
                      value={customInspector}
                      onChange={(e) => setCustomInspector(e.target.value)}
                    />
                  </div>
                )}

                {selectedTemplate === 'DOC_REJECTED' && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                    <label className="block font-bold text-rose-900">ระบุข้อบกพร่องที่ต้องแก้ไข:</label>
                    <textarea
                      rows={2}
                      value={customDefect}
                      onChange={(e) => setCustomDefect(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                )}

                {selectedTemplate === 'PAYMENT_DUE' && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                    <Input
                      label="ยอดค่าธรรมเนียมที่ต้องชำระ (บาท):"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                    />
                  </div>
                )}

                {selectedTemplate === 'LICENSE_ISSUED' && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                    <Input
                      label="เลขที่ใบอนุญาตที่ออก:"
                      value={customLicenseNo}
                      onChange={(e) => setCustomLicenseNo(e.target.value)}
                    />
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleSendTestFlex}
                    isLoading={isSending}
                    leftIcon={<Send className="w-4 h-4" />}
                    className="w-full font-bold bg-emerald-600 hover:bg-emerald-700 shadow-md"
                  >
                    ส่งข้อความ Flex ไปยัง LINE ของร้านนี้ทันที
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Interactive Mobile Phone Mockup Right */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="w-full max-w-[360px] bg-slate-950 rounded-[44px] p-3.5 shadow-2xl border-4 border-slate-800 relative">
              {/* Phone Speaker Notch */}
              <div className="w-28 h-4 bg-slate-800 rounded-full mx-auto mb-2" />

              {/* Screen Area */}
              <div className="bg-[#788896] rounded-[32px] overflow-hidden flex flex-col h-[580px]">
                {/* LINE Chat Header */}
                <div className="bg-[#243444] text-white px-4 py-2.5 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-xs">
                      อบต
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-tight">งานสาธารณสุข ({lineOaId})</p>
                      <p className="text-[9px] text-emerald-400">อบต.โป่งน้ำร้อน อ.ฝาง</p>
                    </div>
                  </div>
                </div>

                {/* Chat Stream with Dynamic Flex Message Render */}
                <div className="flex-1 p-3 overflow-y-auto space-y-3">
                  <div className="text-center text-[10px] text-slate-300 font-mono">วันนี้ 10:00 น.</div>

                  {/* 1. APPOINTMENT FLEX */}
                  {selectedTemplate === 'APPOINTMENT' && (
                    <div className="bg-white rounded-2xl shadow-md overflow-hidden text-slate-800 text-xs animate-in fade-in">
                      <div className="bg-sky-600 text-white p-3.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">การนัดหมาย</span>
                        <h4 className="text-sm font-black mt-0.5">นัดตรวจสุขาภิบาลสถานที่</h4>
                      </div>
                      <div className="p-3.5 space-y-2">
                        <p className="font-bold text-slate-900 text-xs">{targetBusiness.name}</p>
                        <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-100 space-y-1 text-[11px]">
                          <p>📅 <strong>วันที่:</strong> {formatThaiDate(customDate)}</p>
                          <p>⏰ <strong>เวลา:</strong> {customTimeSlot}</p>
                          <p>👨‍💼 <strong>ผู้ตรวจ:</strong> {customInspector}</p>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          กรุณากดยืนยันวันนัดหมายหรือขอเลื่อนนัดหมายล่วงหน้าอย่างน้อย 1 วัน
                        </p>
                      </div>
                      <div className="p-2 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => success('ยืนยันนัดหมาย', `ผู้ประกอบการยืนยันวันนัด ${formatThaiDate(customDate)} ผ่าน LINE เรียบร้อย`)}
                          className="py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-[11px] hover:bg-emerald-700"
                        >
                          ✓ ยืนยันวันนัด
                        </button>
                        <button
                          type="button"
                          onClick={() => success('ขอเลื่อนนัด', 'เปิดฟอร์มขอเปลี่ยนวันนัดตรวจ')}
                          className="py-1.5 bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] hover:bg-slate-300"
                        >
                          ขอเลื่อนวันนัด
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 2. DOC REJECTED FLEX */}
                  {selectedTemplate === 'DOC_REJECTED' && (
                    <div className="bg-white rounded-2xl shadow-md overflow-hidden text-slate-800 text-xs animate-in fade-in">
                      <div className="bg-rose-600 text-white p-3.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">แจ้งเตือนเอกสาร</span>
                        <h4 className="text-sm font-black mt-0.5">เอกสารไม่ผ่าน / ให้ส่งเพิ่ม</h4>
                      </div>
                      <div className="p-3.5 space-y-2">
                        <p className="font-bold text-slate-900 text-xs">{targetBusiness.name}</p>
                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-[11px] text-rose-900 space-y-1">
                          <p className="font-bold">ข้อบกพร่องที่พบ:</p>
                          <p>{customDefect}</p>
                        </div>
                      </div>
                      <div className="p-2 bg-slate-50 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => success('เปิดระบบอัปโหลด', 'พาผู้ประกอบการไปหน้าอัปโหลดเอกสารใหม่')}
                          className="w-full py-1.5 bg-rose-600 text-white rounded-lg font-bold text-[11px] hover:bg-rose-700"
                        >
                          อัปโหลดเอกสารใหม่ในระบบ
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 3. PAYMENT DUE FLEX */}
                  {selectedTemplate === 'PAYMENT_DUE' && (
                    <div className="bg-white rounded-2xl shadow-md overflow-hidden text-slate-800 text-xs animate-in fade-in">
                      <div className="bg-amber-600 text-white p-3.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">ชำระค่าธรรมเนียม</span>
                        <h4 className="text-sm font-black mt-0.5">ใบแจ้งชำระค่าธรรมเนียม อบต.</h4>
                      </div>
                      <div className="p-3.5 space-y-2 text-center">
                        <p className="font-bold text-slate-900 text-xs">{targetBusiness.name}</p>
                        <p className="text-2xl font-black text-gov-800 font-mono">{customAmount} บาท</p>
                        <div className="p-2 bg-white border border-slate-200 rounded-xl inline-block mx-auto">
                          <QRCodeSVG value={`https://promptpay.io/053123456/${customAmount.replace(/,/g, '')}`} size={100} />
                        </div>
                        <p className="text-[10px] text-slate-500">สแกน QR PromptPay อบต.โป่งน้ำร้อน</p>
                      </div>
                      <div className="p-2 bg-slate-50 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => success('แนบสลิป', 'เปิดระบบแนบหลักฐานการโอนเงิน')}
                          className="w-full py-1.5 bg-gov-700 text-white rounded-lg font-bold text-[11px] hover:bg-gov-800"
                        >
                          แนบสลิปการโอนเงิน
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 4. LICENSE ISSUED FLEX */}
                  {selectedTemplate === 'LICENSE_ISSUED' && (
                    <div className="bg-white rounded-2xl shadow-md overflow-hidden text-slate-800 text-xs animate-in fade-in">
                      <div className="bg-emerald-600 text-white p-3.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">ใบอนุญาตออกแล้ว</span>
                        <h4 className="text-sm font-black mt-0.5">ใบอนุญาตจัดตั้งสถานที่สะสมอาหาร</h4>
                      </div>
                      <div className="p-3.5 space-y-2">
                        <p className="font-bold text-slate-900 text-xs">{targetBusiness.name}</p>
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-[11px] space-y-1">
                          <p>🏅 <strong>เลขที่:</strong> {customLicenseNo}</p>
                          <p>📅 <strong>มีผลถึง:</strong> 19 ม.ค. 2570</p>
                        </div>
                      </div>
                      <div className="p-2 bg-slate-50 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => success('ดูใบอนุญาต', 'เปิดหน้าตรวจสอบใบอนุญาตดิจิทัล')}
                          className="w-full py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-[11px] hover:bg-emerald-700"
                        >
                          ดูใบอนุญาตดิจิทัล (QR Verification)
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* LINE Rich Menu 6 Buttons Footer */}
                <div className="bg-[#1b2733] p-1.5 grid grid-cols-3 gap-1 shrink-0 border-t border-slate-700">
                  {[
                    { label: 'ยื่นคำขอ', icon: '📝' },
                    { label: 'ติดตามคำขอ', icon: '🔍' },
                    { label: 'ใบอนุญาต', icon: '🏅' },
                    { label: 'ชำระเงิน', icon: '💳' },
                    { label: 'นัดตรวจ', icon: '📅' },
                    { label: 'ติดต่อ อบต.', icon: '☎️' },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      type="button"
                      onClick={() => success('Rich Menu Clicked', `กดเมนู: ${btn.label}`)}
                      className="p-1.5 rounded-lg bg-[#273849] hover:bg-emerald-600 text-white text-[9px] font-bold flex flex-col items-center justify-center transition-colors"
                    >
                      <span className="text-xs">{btn.icon}</span>
                      <span className="truncate mt-0.5">{btn.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Connected Accounts Tab */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500">
              รายชื่อสถานประกอบการที่ผูกกับบัญชี LINE ส่วนบุคคลเพื่อรับการแจ้งเตือน Realtime
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (businesses.length > 0) setBindBizId(businesses[0].id);
                setIsBindModalOpen(true);
              }}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              + ผูกบัญชี LINE กับร้านค้า
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {accounts.map((acc) => (
              <Card key={acc.id} className="p-5 border border-slate-200 bg-white shadow-xs space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={acc.picture_url}
                      alt={acc.line_display_name}
                      className="w-12 h-12 rounded-full border-2 border-emerald-500 object-cover"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{acc.line_display_name}</h4>
                      <p className="text-xs text-slate-600 font-semibold">{acc.business_name}</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">{acc.line_user_id}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    title="ยกเลิกการผูกบัญชี"
                    onClick={() => handleDeleteAccount(acc.id, acc.business_name)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 flex justify-between items-center">
                  <span>เบอร์โทร: <strong>{acc.phone_number}</strong></span>
                  <span className="text-[10px] text-slate-400">{formatThaiDate(acc.linked_at, { shortMonth: true })}</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLinkingAccount(acc)}
                    leftIcon={<QrCode className="w-3.5 h-3.5" />}
                    className="text-xs flex-1"
                  >
                    QR ผูกบัญชี
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setSelectedTemplate('APPOINTMENT');
                      setSelectedBusinessId(acc.business_id);
                      setActiveTab('simulator');
                    }}
                    leftIcon={<Send className="w-3.5 h-3.5" />}
                    className="text-xs flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    ส่งข้อความหาร้านนี้
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {accounts.length === 0 && (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-800">ยังไม่มีร้านค้าที่ผูกบัญชี LINE</p>
              <p className="text-xs text-slate-400">กดปุ่มด้านบนเพื่อผูกบัญชี LINE ของผู้ประกอบการเข้ากับร้านค้า</p>
            </div>
          )}
        </div>
      )}

      {/* 3. Connection Guide Tab */}
      {activeTab === 'guide' && (
        <Card className="p-6 bg-white border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-gov-700" />
              วิธีเชื่อมต่อ LINE ส่วนบุคคลของผู้ประกอบการเข้ากับระบบ
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              เข้าใจกลไกการผูกบัญชีระหว่าง LINE User ID กับสถานประกอบการในฐานข้อมูล Supabase
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-bold text-[10px]">
                วิธีที่ 1: ประชาชนผูกบัญชีด้วยตัวเองผ่าน LINE
              </span>
              <ol className="space-y-2 list-decimal list-inside text-slate-700">
                <li>ผู้ประกอบการสแกน QR เพิ่มเพื่อน LINE OA <strong>{lineOaId}</strong></li>
                <li>กดเมนู <strong>"ผูกบัญชีร้านค้า"</strong> บน Rich Menu</li>
                <li>กรอกเลขประจำตัวประชาชน 13 หลัก หรือ รหัสร้าน (`FS-500408-XXXX`)</li>
                <li>ระบบจะจับคู่ <code>LINE User ID</code> เข้ากับ <code>business_id</code> ในตาราง <code>line_accounts</code> ทันที</li>
              </ol>
            </div>

            <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-3 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-sky-600 text-white font-bold text-[10px]">
                วิธีที่ 2: เจ้าหน้าที่ อบต. ผูกให้ที่สำนักงาน
              </span>
              <ol className="space-y-2 list-decimal list-inside text-slate-700">
                <li>ไปที่แท็บ <strong>"บัญชีร้านที่ผูก"</strong></li>
                <li>กดปุ่ม <strong>"+ ผูกบัญชี LINE กับร้านค้า"</strong></li>
                <li>เลือกร้านค้าในระบบ และกรอกชื่อ LINE หรือเบอร์โทรของผู้ประกอบการ</li>
                <li>ระบบจะพร้อมส่งข้อความ Flex แจ้งเตือนหาร้านค้านั้นได้ทันที!</li>
              </ol>
            </div>
          </div>
        </Card>
      )}

      {/* 5. Batch (Mass) LINE Notification Tab */}
      {activeTab === 'batch' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 space-y-4">
            <Card className="p-5 bg-white border border-slate-200 shadow-xs space-y-6">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                ระบบส่งข้อความหมู่ (Batch Broadcast)
              </h3>
              
              {/* Section 1 */}
              <div className="space-y-3">
                <label className="block font-bold text-slate-800 text-sm">1. เลือกกลุ่มผู้รับ (Recipient Group)</label>
                <div className="space-y-2 text-xs">
                  {[
                    { id: 'all', label: 'ผู้ประกอบการทั้งหมด (ที่เชื่อมต่อ LINE แล้ว)' },
                    { id: 'expiring', label: 'เฉพาะใบอนุญาตหมดอายุภายใน 30 วัน' },
                    { id: 'pending', label: 'เฉพาะคำขอที่รอตรวจสุขาภิบาล' },
                    { id: 'custom', label: 'เลือกรายบุคคล (ระบุเอง)' }
                  ].map(opt => (
                    <label key={opt.id} className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg hover:bg-slate-50">
                      <input type="radio" name="batch_group" value={opt.id} checked={batchGroup === opt.id} onChange={() => setBatchGroup(opt.id as any)} className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold text-slate-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
                {batchGroup === 'custom' && (
                  <div className="p-3 bg-slate-50 border rounded-lg max-h-48 overflow-y-auto space-y-2">
                    {accounts.map(acc => (
                      <label key={acc.id} className="flex items-center gap-2 cursor-pointer text-xs">
                        <input type="checkbox" checked={batchSelectedAccounts.includes(acc.line_user_id)} onChange={(e) => {
                          if (e.target.checked) setBatchSelectedAccounts([...batchSelectedAccounts, acc.line_user_id]);
                          else setBatchSelectedAccounts(batchSelectedAccounts.filter(id => id !== acc.line_user_id));
                        }} className="w-4 h-4 text-emerald-600 rounded" />
                        <span>{acc.business_name} ({acc.line_display_name})</span>
                      </label>
                    ))}
                    {accounts.length === 0 && <p className="text-slate-500">ไม่มีบัญชีที่เชื่อมต่อ</p>}
                  </div>
                )}
              </div>

              {/* Section 2 */}
              <div className="space-y-3">
                <label className="block font-bold text-slate-800 text-sm">2. เลือกรูปแบบข้อความ</label>
                <select value={batchTemplate} onChange={(e) => setBatchTemplate(e.target.value as any)} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 font-semibold text-slate-900 text-xs">
                  <option value="announcement">📢 ประกาศแจ้งกฎใหม่</option>
                  <option value="holiday">🌴 แจ้งช่วงหยุดยาว</option>
                  <option value="inspection">🩺 แจ้งตรวจประจำปี</option>
                  <option value="custom">✏️ ข้อความกำหนดเอง (Text)</option>
                </select>

                <div className="p-3 bg-slate-50 rounded-lg border space-y-3">
                  {batchTemplate === 'holiday' && (
                    <div className="flex gap-2 text-xs">
                      <div className="flex-1">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">วันเริ่มหยุด</label>
                        <input type="date" className="w-full p-2 border rounded bg-white" value={batchHolidayStart} onChange={e => setBatchHolidayStart(e.target.value)} />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">วันสิ้นสุด</label>
                        <input type="date" className="w-full p-2 border rounded bg-white" value={batchHolidayEnd} onChange={e => setBatchHolidayEnd(e.target.value)} />
                      </div>
                    </div>
                  )}
                  {batchTemplate === 'inspection' && (
                    <div className="text-xs">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">ช่วงเวลาตรวจประจำปี</label>
                      <input type="text" className="w-full p-2 border rounded bg-white" value={batchInspectionDate} onChange={e => setBatchInspectionDate(e.target.value)} />
                    </div>
                  )}
                  {batchTemplate === 'custom' && (
                    <div className="text-xs">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">ข้อความ</label>
                      <textarea rows={4} className="w-full p-2 border rounded bg-white" placeholder="พิมพ์ข้อความที่ต้องการส่ง..." value={batchCustomMsg} onChange={e => setBatchCustomMsg(e.target.value)} />
                    </div>
                  )}
                  {batchTemplate === 'announcement' && (
                     <div className="text-xs text-slate-500 italic">ใช้ข้อความ Flex ดั้งเดิม (แก้ไขไม่ได้)</div>
                  )}
                </div>
              </div>

              {/* Section 4 */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-slate-700">จะส่งถึง: <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-mono">{getBatchRecipients().length} ราย</span></span>
                </div>
                <Button 
                  variant="primary" 
                  size="md" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold shadow-md" 
                  isLoading={isSendingBatch}
                  onClick={handleSendBatch}
                  leftIcon={<Send className="w-4 h-4"/>}
                >
                  ยืนยันการส่งข้อความ
                </Button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-6 flex justify-center">
            {/* Section 3 Preview */}
            <div className="w-full max-w-[360px] bg-slate-950 rounded-[44px] p-3.5 shadow-2xl border-4 border-slate-800 relative">
               <div className="w-28 h-4 bg-slate-800 rounded-full mx-auto mb-2" />
               <div className="bg-[#788896] rounded-[32px] overflow-hidden flex flex-col h-[580px]">
                 <div className="bg-[#243444] text-white px-4 py-2.5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-xs">อบต</div>
                      <div>
                        <p className="text-xs font-bold leading-tight">ตัวอย่างข้อความ</p>
                        <p className="text-[9px] text-emerald-400">งานสาธารณสุข ({lineOaId})</p>
                      </div>
                    </div>
                 </div>
                 <div className="flex-1 p-3 overflow-y-auto space-y-3">
                   <div className="text-center text-[10px] text-slate-300 font-mono">วันนี้ 10:00 น.</div>
                   {renderBatchPreview()}
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. QR Code & Channel Connection Tab */}
      {activeTab === 'channel' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <Card className="p-6 bg-white border border-slate-200 shadow-xs text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-md">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                LINE Official Account
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1">งานสาธารณสุข อบต.โป่งน้ำร้อน</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">LINE ID: <strong className="text-emerald-700 text-sm">{lineOaId}</strong></p>
            </div>

            {/* Official LINE QR Code */}
            <div className="p-4 bg-white border-2 border-emerald-500 rounded-2xl inline-block shadow-md">
              <QRCodeSVG value={lineOaUrl} size={180} level="H" />
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-600">
                สแกน QR Code นี้ผ่านกล้องโทรศัพท์หรือแอป LINE เพื่อเพิ่มเพื่อนและรับแจ้งเตือนอัตโนมัติ
              </p>
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(lineOaUrl)}
                  leftIcon={<Copy className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  คัดลอกลิงก์แอดไลน์
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => window.open(lineOaUrl, '_blank')}
                  leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 font-bold"
                >
                  เปิด LINE เพื่อเพิ่มเพื่อน
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-slate-950 text-white rounded-2xl shadow-xl space-y-4 border border-slate-800">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Shield className="w-4 h-4" />
              ข้อมูลการเชื่อมต่อ LINE Messaging API (Active)
            </h3>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 block">Channel ID:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{lineChannelId}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 block">Channel Secret:</span>
                <span className="font-mono text-slate-300 text-xs">f82a01455dbcfeae8e1f04b6b9778256</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 block">LINE Basic ID:</span>
                <span className="font-mono font-bold text-white text-sm">{lineOaId}</span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-[11px]">ระบบเชื่อมต่อ LINE Official Account สมบูรณ์พร้อมส่ง Flex Message Realtime</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 1-Click Dropdown Bind Modal */}
      {isBindModalOpen && (
        <Modal
          isOpen={isBindModalOpen}
          onClose={() => setIsBindModalOpen(false)}
          title="⚡ ผูกบัญชี LINE กับสถานประกอบการ (1-Click Link)"
          description="เลือกจากรายชื่อคนที่ทัก LINE เข้ามา และเลือกร้านค้าเพื่อผูกบัญชีทันทีโดยไม่ต้องพิมพ์"
          size="md"
        >
          <form onSubmit={handleBindAccount} className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-xs">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                ระบบตรวจจับผู้ทัก LINE OA อัตโนมัติ:
              </p>
              <p className="text-[11px] text-emerald-700">
                เลือกคนที่ทักเข้ามา แล้วเลือกร้านค้า จากนั้นกดบันทึกได้ทันที
              </p>
            </div>

            {/* Dropdown 1: Select Inbound LINE Sender */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-800">
                1. เลือกบัญชี LINE ของคนที่ทักเข้ามา: *
              </label>
              <select
                required
                value={bindSenderId}
                onChange={(e) => setBindSenderId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-semibold text-xs focus:ring-2 focus:ring-emerald-500"
              >
                {inboundSenders.length > 0 ? (
                  inboundSenders.map((s) => (
                    <option key={s.line_user_id} value={s.line_user_id}>
                      👤 {s.line_display_name} — "{s.last_message.slice(0, 30)}..."
                    </option>
                  ))
                ) : (
                  <option value="">ยังไม่มีผู้ทัก LINE เข้ามา</option>
                )}
              </select>
            </div>

            {/* Dropdown 2: Select Target Business */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-800">
                2. เลือกร้านค้า / สถานประกอบการที่จะผูก: *
              </label>
              <select
                required
                value={bindBizId}
                onChange={(e) => setBindBizId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-semibold text-xs focus:ring-2 focus:ring-emerald-500"
              >
                {businesses.length > 0 ? (
                  businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      🏪 {b.name} ({b.business_code}) - ม.{b.location?.moo || '1'} {b.location?.village_name || ''}
                    </option>
                  ))
                ) : (
                  <option value="">กรุณาลงทะเบียนสถานประกอบการก่อน</option>
                )}
              </select>
            </div>

            {/* Visual Link Preview Badge */}
            {bindSenderId && bindBizId && (
              <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="font-bold text-emerald-400">
                    👤 {inboundSenders.find((s) => s.line_user_id === bindSenderId)?.line_display_name || 'ผู้ใช้ LINE'}
                  </span>
                  <span className="text-slate-400">➔ เชื่อมโยงกับ ➔</span>
                  <span className="font-bold text-amber-300 truncate">
                    🏪 {businesses.find((b) => b.id === bindBizId)?.name || 'ร้านค้า'}
                  </span>
                </div>
                <span className="text-[10px] bg-emerald-800 text-emerald-100 px-2 py-0.5 rounded font-mono shrink-0">
                  พร้อมเชื่อมต่อ
                </span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsBindModalOpen(false)}>
                ยกเลิก
              </Button>
              <Button type="submit" variant="primary" size="sm" leftIcon={<Link2 className="w-4 h-4" />}>
                ⚡ บันทึกการผูกบัญชีทันที
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Link QR Modal */}
      {linkingAccount && (
        <Modal
          isOpen={!!linkingAccount}
          onClose={() => setLinkingAccount(null)}
          title={`QR Code ผูกบัญชี LINE OA (${lineOaId})`}
          size="sm"
          footer={
            <Button variant="secondary" size="sm" onClick={() => setLinkingAccount(null)}>
              ปิดหน้าต่าง
            </Button>
          }
        >
          <div className="p-4 text-center space-y-3 text-xs">
            <div className="p-3 bg-white border-2 border-emerald-500 rounded-2xl inline-block mx-auto shadow-sm">
              <QRCodeSVG
                value={`https://line.me/R/ti/p/${lineOaId.replace('@', '%40')}?link=${linkingAccount.business_id}`}
                size={160}
              />
            </div>
            <p className="font-bold text-slate-900 text-sm">{linkingAccount.business_name}</p>
            <p className="text-slate-500 text-[11px]">
              สแกน QR Code นี้ผ่านแอป LINE เพื่อผูกสถานประกอบการเข้ากับ LINE OA <strong>{lineOaId}</strong>
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};
