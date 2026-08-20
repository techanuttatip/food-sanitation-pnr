import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useToast } from '../context/ToastContext';
import { formatThaiDate } from '../lib/utils';
import { businessService } from '../services/businessService';
import { lineService, InboundLineSender, LineAccount } from '../services/lineService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Business } from '../types';
import { aiRagService } from '../services/aiRagService';
import {
  MessageSquare,
  Send,
  User,
  Building2,
  Phone,
  Clock,
  CheckCircle2,
  Calendar,
  CreditCard,
  Award,
  AlertTriangle,
  Sparkles,
  Paperclip,
  CheckCheck,
  Search,
  BellRing,
  QrCode,
  Store,
  Link2,
  Check,
  Bot,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'CITIZEN' | 'OFFICER';
  sender_name: string;
  text: string;
  timestamp: string;
}

interface ChatThread {
  id: string;
  line_user_id: string;
  business_id?: string;
  business_name?: string;
  owner_name: string;
  phone_number: string;
  line_display_name: string;
  picture_url: string;
  unread_count: number;
  last_message: string;
  last_message_time: string;
  messages: ChatMessage[];
}

const CHAT_STORAGE_KEY = 'food_gov_live_chat_threads_v1';
const WEBHOOK_SITE_TOKEN = '6fa01f3b-68d9-4012-8c98-8d466513eea5';

function getStoredChatThreads(): ChatThread[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredChatThreads(threads: ChatThread[]) {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(threads));
  } catch (e) {
    console.warn(e);
  }
}

async function fetchWebhookSiteEvents(): Promise<any[]> {
  try {
    const res = await fetch(`/webhook-site/token/${WEBHOOK_SITE_TOKEN}/requests?sorting=newest`).catch(() => null);
    if (!res || !res.ok) return [];
    const json = await res.json().catch(() => ({}));
    const list: any[] = [];

    (json.data || []).forEach((req: any) => {
      try {
        const body = JSON.parse(req.content || '{}');
        (body.events || []).forEach((ev: any) => {
          let text = '';
          if (ev.type === 'message' && ev.message?.type === 'text') {
            text = ev.message.text;
          } else if (ev.type === 'postback') {
            if (ev.postback?.params?.datetime) {
              text = `ขอเปลี่ยนเวลานัดตรวจเป็น: ${ev.postback.params.datetime.replace('T', ' เวลา ')} น.`;
            } else {
              text = ev.postback?.data || 'Postback event';
            }
          }
          if (text) {
            list.push({
              id: `wh-${req.uuid}-${ev.timestamp || Date.now()}`,
              line_user_id: ev.source?.userId || 'U99dechnat784a',
              line_display_name: 'เดชณัฐ (LINE)',
              text_content: text,
              created_at: req.created_at || new Date().toISOString(),
            });
          }
        });
      } catch (e) {
        // ignore
      }
    });

    return list;
  } catch (err) {
    return [];
  }
}

export const CitizenLiveChat: React.FC<{ onNavigateToWorkflow?: () => void }> = () => {
  const { success, error } = useToast();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string>('');
  const [replyText, setReplyText] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [search, setSearch] = useState('');
  const [quickLinkBizId, setQuickLinkBizId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    const [stored, bizList, inbounds, linkedAccs, webhookEvents] = await Promise.all([
      getStoredChatThreads(),
      businessService.getBusinesses(),
      lineService.getInboundSenders(),
      lineService.getLinkedAccounts(),
      fetchWebhookSiteEvents(),
    ]);

    setBusinesses(bizList);
    if (bizList.length > 0 && !quickLinkBizId) {
      setQuickLinkBizId(bizList[0].id);
    }

    // Check Supabase inbound events if available
    let remoteInbounds: any[] = [];
    if (isSupabaseConfigured) {
      try {
        const { data } = await supabase
          .from('line_inbound_events')
          .select('*')
          .order('created_at', { ascending: true });
        if (data && data.length > 0) {
          remoteInbounds = data;
        }
      } catch (err) {
        console.warn('Supabase inbound events check:', err);
      }
    }

    // Merge inbounds into threads
    const threadMap = new Map<string, ChatThread>();
    stored.forEach((t) => threadMap.set(t.line_user_id || t.id, t));

    inbounds.forEach((ib) => {
      const linkedAcc = linkedAccs.find((a) => a.line_user_id === ib.line_user_id);
      const linkedBiz = bizList.find((b) => b.id === (linkedAcc?.business_id || ib.linked_business_id));

      if (threadMap.has(ib.line_user_id)) {
        const existing = threadMap.get(ib.line_user_id)!;
        existing.business_id = linkedBiz?.id || existing.business_id;
        existing.business_name = linkedBiz?.name || existing.business_name;
        existing.line_display_name = ib.line_display_name;
        existing.picture_url = ib.picture_url || existing.picture_url;
      } else {
        threadMap.set(ib.line_user_id, {
          id: `thread-${ib.line_user_id}`,
          line_user_id: ib.line_user_id,
          business_id: linkedBiz?.id,
          business_name: linkedBiz?.name,
          owner_name: linkedBiz?.owner ? `${linkedBiz.owner.first_name} ${linkedBiz.owner.last_name}` : ib.line_display_name,
          phone_number: linkedBiz?.owner?.phone_number || '-',
          line_display_name: ib.line_display_name,
          picture_url: ib.picture_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
          unread_count: 1,
          last_message: ib.last_message,
          last_message_time: ib.timestamp,
          messages: [
            {
              id: `msg-${Date.now()}`,
              sender: 'CITIZEN',
              sender_name: ib.line_display_name,
              text: ib.last_message,
              timestamp: ib.timestamp,
            },
          ],
        });
      }
    });

    // Merge remote database events & webhook.site events
    const allIncoming = [...remoteInbounds, ...webhookEvents];
    allIncoming.forEach((ev) => {
      const uId = ev.line_user_id || 'U99dechnat784a';
      const th = threadMap.get(uId) || threadMap.values().next().value;
      if (th) {
        if (!th.messages.some((m) => m.id === ev.id || m.text === ev.text_content)) {
          th.messages.push({
            id: ev.id,
            sender: 'CITIZEN',
            sender_name: ev.line_display_name || th.line_display_name,
            text: ev.text_content,
            timestamp: ev.created_at,
          });
          th.last_message = ev.text_content;
          th.last_message_time = ev.created_at;
        }
      }
    });

    const mergedThreads = Array.from(threadMap.values());
    setThreads(mergedThreads);
    saveStoredChatThreads(mergedThreads);

    if (mergedThreads.length > 0 && !selectedThreadId) {
      setSelectedThreadId(mergedThreads[0].id);
    }
  };

  useEffect(() => {
    loadData();

    // Fast Polling every 1.5s for instant Webhook sync
    const intervalTimer = setInterval(() => {
      fetchWebhookSiteEvents().then((newEvents) => {
        if (newEvents && newEvents.length > 0) {
          setThreads((prev) => {
            let changed = false;
            const updated = prev.map((th) => {
              const copy = { ...th, messages: [...th.messages] };
              newEvents.forEach((ev) => {
                if (!copy.messages.some((m) => m.id === ev.id || m.text === ev.text_content)) {
                  copy.messages.push({
                    id: ev.id,
                    sender: 'CITIZEN',
                    sender_name: ev.line_display_name || copy.line_display_name,
                    text: ev.text_content,
                    timestamp: ev.created_at,
                  });
                  copy.last_message = ev.text_content;
                  copy.last_message_time = ev.created_at;
                  changed = true;
                }
              });
              return copy;
            });
            if (changed) {
              saveStoredChatThreads(updated);
              return updated;
            }
            return prev;
          });
        }
      });
    }, 1500);

    // Supabase Realtime Subscription
    let channel: any;
    if (isSupabaseConfigured) {
      channel = supabase
        .channel('realtime_line_inbound')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'line_inbound_events' }, (payload: any) => {
          const newEv: any = payload.new;
          if (newEv) {
            setThreads((prev: ChatThread[]) => {
              const updated: ChatThread[] = prev.map((t: ChatThread) => {
                if (t.line_user_id === newEv.line_user_id || !t.line_user_id) {
                  const newMsg: ChatMessage = {
                    id: newEv.id || `msg-${Date.now()}`,
                    sender: 'CITIZEN',
                    sender_name: newEv.line_display_name || t.line_display_name,
                    text: newEv.text_content,
                    timestamp: newEv.created_at || new Date().toISOString(),
                  };
                  return {
                    ...t,
                    last_message: newEv.text_content,
                    last_message_time: newEv.created_at || new Date().toISOString(),
                    unread_count: t.unread_count + 1,
                    messages: [...t.messages, newMsg],
                  };
                }
                return t;
              });
              saveStoredChatThreads(updated);
              return updated;
            });
          }
        })
        .subscribe();
    }

    return () => {
      clearInterval(intervalTimer);
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const currentThread = threads.find((t) => t.id === selectedThreadId);

  // Instant scroll to bottom on message updates
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [currentThread?.messages]);

  const handleSelectThread = (threadId: string) => {
    setSelectedThreadId(threadId);
    setThreads((prev) => {
      const updated = prev.map((t) => (t.id === threadId ? { ...t, unread_count: 0 } : t));
      saveStoredChatThreads(updated);
      return updated;
    });
  };

  const handleQuickLinkStore = async () => {
    if (!currentThread || !quickLinkBizId) return;
    const targetBiz = businesses.find((b) => b.id === quickLinkBizId);
    if (!targetBiz) return;

    const newAcc: LineAccount = {
      id: `la-${Date.now()}`,
      business_id: targetBiz.id,
      business_name: targetBiz.name,
      line_user_id: currentThread.line_user_id,
      line_display_name: currentThread.line_display_name,
      picture_url: currentThread.picture_url,
      is_linked: true,
      linked_at: new Date().toISOString(),
      phone_number: targetBiz.owner?.phone_number || '-',
    };

    await lineService.linkAccount(newAcc);

    const updatedThreads = threads.map((t) =>
      t.id === currentThread.id
        ? {
            ...t,
            business_id: targetBiz.id,
            business_name: targetBiz.name,
            owner_name: targetBiz.owner ? `${targetBiz.owner.first_name} ${targetBiz.owner.last_name}` : t.owner_name,
            phone_number: targetBiz.owner?.phone_number || t.phone_number,
          }
        : t
    );

    setThreads(updatedThreads);
    saveStoredChatThreads(updatedThreads);
    success('ผูกบัญชีแชทสำเร็จ ⚡', `เชื่อมโยง ${currentThread.line_display_name} เข้ากับร้าน "${targetBiz.name}" เรียบร้อย`);
  };

  const handleAiDraftReply = async () => {
    if (!currentThread) return;
    const lastCitizenMsg =
      [...currentThread.messages].reverse().find((m) => m.sender === 'CITIZEN')?.text ||
      currentThread.last_message;
    if (!lastCitizenMsg) {
      error('ยังไม่มีข้อความจากประชาชน', 'กรุณารอข้อความสอบถามจากประชาชนก่อน');
      return;
    }
    setIsAiGenerating(true);
    try {
      const draft = await aiRagService.suggestDraftReply(lastCitizenMsg);
      setReplyText(draft);
      success('AI ร่างคำตอบเสร็จแล้ว ✨', 'สามารถตรวจทานและกด "ส่งเข้า LINE" ได้ทันที');
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !currentThread) return;

    const textToSend = replyText.trim();
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'OFFICER',
      sender_name: 'จนท. งานสาธารณสุข อบต.',
      text: textToSend,
      timestamp: new Date().toISOString(),
    };

    // Instant optimistic UI update in 0.01s
    const updatedThreads = threads.map((t) => {
      if (t.id === currentThread.id) {
        return {
          ...t,
          last_message: newMsg.text,
          last_message_time: newMsg.timestamp,
          messages: [...t.messages, newMsg],
        };
      }
      return t;
    });

    setThreads(updatedThreads);
    saveStoredChatThreads(updatedThreads);
    setReplyText('');

    // Background asynchronous send to LINE
    if (currentThread.business_id) {
      lineService
        .sendFlexMessage({
          business_id: currentThread.business_id,
          business_name: currentThread.business_name || 'สถานประกอบการ',
          recipient_name: currentThread.owner_name,
          event_type: 'APPOINTMENT',
          title: 'ข้อความตอบกลับจาก อบต.โป่งน้ำร้อน',
          message_preview: textToSend,
        })
        .catch((err: any) => console.warn('LINE reply notice:', err.message));
    }
  };

  const filteredThreads = threads.filter(
    (t) =>
      (t.business_name || '').toLowerCase().includes(search.toLowerCase()) ||
      t.owner_name.toLowerCase().includes(search.toLowerCase()) ||
      t.line_display_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 overflow-hidden max-w-7xl mx-auto w-full">
      {/* Header (Fixed, Never Scrolls) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-emerald-600" />
              ศูนย์รับเรื่อง & แชทสดประชาชน (LINE 2-Way Live Chat)
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              LINE Webhook: ONLINE (1.5s Sync)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            งานสาธารณสุข อบต.โป่งน้ำร้อน • ดึงแชทจริงของคนที่ทัก LINE OA (@634eafmr) พร้อมปุ่มเลือกผูกร้านค้าใน 1 คลิก
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            leftIcon={<Sparkles className="w-4 h-4 text-emerald-600" />}
          >
            🔄 รีเฟรชดึงข้อความ
          </Button>
        </div>
      </div>

      {/* Main Chat Interface with Fixed Viewport Height and ONLY Internal Message Scrolling */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0 overflow-hidden mt-3">
        {/* Left: Inbound Chatters List */}
        <Card className="p-0 overflow-hidden flex flex-col bg-white border border-slate-200 h-full shadow-xs">
          <div className="p-3 border-b border-slate-200 bg-slate-50 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อคนทัก, ร้านค้า, หรือ LINE..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 min-h-0">
            {filteredThreads.length > 0 ? (
              filteredThreads.map((t) => {
                const isSelected = t.id === selectedThreadId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectThread(t.id)}
                    className={`w-full p-3 text-left transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-emerald-50 border-l-4 border-emerald-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={t.picture_url}
                        alt={t.line_display_name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                      {t.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center shadow-xs">
                          {t.unread_count}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          👤 {t.line_display_name}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {formatThaiDate(t.last_message_time)}
                        </span>
                      </div>
                      {t.business_name ? (
                        <p className="text-[11px] font-semibold text-emerald-700 truncate mt-0.5 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600 inline" /> 🏪 {t.business_name}
                        </p>
                      ) : (
                        <p className="text-[10px] text-amber-600 font-bold truncate mt-0.5">
                          ⚠️ ยังไม่ได้ผูกกับร้านค้า (แตะเพื่อผูก)
                        </p>
                      )}
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{t.last_message}</p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-10 text-center text-slate-400 space-y-2">
                <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">ยังไม่มีผู้ทัก LINE เข้ามา</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  เมื่อประชาชนแอด LINE OA (@634eafmr) หรือพิมพ์ข้อความ รายการแชทจะขึ้นที่นี่อัตโนมัติ
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Right: Active Chat Conversation (Only the messages list scrolls) */}
        <div className="lg:col-span-2 h-full min-h-0 overflow-hidden">
          {currentThread ? (
            <Card className="p-0 flex flex-col h-full bg-white border border-slate-200 overflow-hidden shadow-xs">
              {/* Chat Thread Header (Fixed) */}
              <div className="p-3 bg-slate-900 text-white space-y-2 shrink-0">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={currentThread.picture_url}
                      alt={currentThread.line_display_name}
                      className="w-9 h-9 rounded-full border-2 border-emerald-400 object-cover"
                    />
                    <div>
                      <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                        👤 {currentThread.line_display_name}
                      </h3>
                      <p className="text-[11px] text-emerald-300">
                        {currentThread.business_name ? (
                          <span>🏪 ผูกกับร้าน: <strong>{currentThread.business_name}</strong></span>
                        ) : (
                          <span className="text-amber-300">⚠️ ยังไม่ได้ผูกบัญชีร้านค้า</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    LINE OA: @634eafmr
                  </span>
                </div>

                {/* 1-Click Quick Store Link Banner if unlinked */}
                {!currentThread.business_id && (
                  <div className="p-2 bg-slate-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-2 text-xs border border-slate-700">
                    <div className="flex items-center gap-1.5 text-amber-300 text-[11px] font-bold">
                      <Link2 className="w-3.5 h-3.5" />
                      <span>เลือกผูกแชทนี้เข้ากับร้านค้า:</span>
                    </div>
                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                      <select
                        value={quickLinkBizId}
                        onChange={(e) => setQuickLinkBizId(e.target.value)}
                        className="p-1.5 bg-slate-900 border border-slate-600 rounded-lg text-white text-xs font-semibold"
                      >
                        {businesses.map((b) => (
                          <option key={b.id} value={b.id}>
                            🏪 {b.name} ({b.business_code})
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={handleQuickLinkStore}
                        className="bg-emerald-600 hover:bg-emerald-700 text-[11px] py-1 px-2.5 font-bold shrink-0"
                      >
                        ⚡ ผูกทันที
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Scrollable Message List - ONLY THIS AREA SCROLLS */}
              <div
                ref={chatContainerRef}
                className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-100 min-h-0 scroll-smooth"
              >
                <div className="text-center my-1">
                  <span className="text-[10px] font-mono text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
                    การสนทนา Realtime ผ่าน LINE Official Account (@634eafmr)
                  </span>
                </div>

                {currentThread.messages.map((m) => {
                  const isOfficer = m.sender === 'OFFICER';
                  const isAppointmentConfirm = m.text.includes('ยืนยันวันนัดตรวจสุขาภิบาล') || m.text.includes('ยืนยันตามกำหนด');
                  const isReschedule = m.text.includes('ขอเลื่อนวันนัดตรวจ') || m.text.includes('ขอเปลี่ยนเวลานัด');

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isOfficer ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[10px] text-slate-500 mb-1 px-1 flex items-center gap-1.5">
                        {m.sender_name}
                        {isAppointmentConfirm && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 rounded font-bold">
                            ✅ ยืนยันนัดตรวจแล้ว
                          </span>
                        )}
                        {isReschedule && (
                          <span className="text-[9px] bg-sky-100 text-sky-800 border border-sky-300 px-1.5 py-0.2 rounded font-bold">
                            📅 คำขอเลื่อนวันนัด
                          </span>
                        )}
                      </span>
                      <div
                        className={`max-w-[78%] p-3 rounded-2xl text-xs leading-relaxed ${
                          isOfficer
                            ? 'bg-emerald-600 text-white rounded-tr-xs shadow-xs'
                            : isAppointmentConfirm
                            ? 'bg-emerald-50 text-emerald-950 border border-emerald-300 rounded-tl-xs shadow-xs'
                            : isReschedule
                            ? 'bg-sky-50 text-sky-950 border border-sky-300 rounded-tl-xs shadow-xs'
                            : 'bg-white text-slate-800 rounded-tl-xs border border-slate-200 shadow-xs'
                        }`}
                      >
                        <p>{m.text}</p>
                        <div
                          className={`text-[9px] mt-1 text-right font-mono ${
                            isOfficer ? 'text-emerald-100' : 'text-slate-400'
                          }`}
                        >
                          {new Date(m.timestamp).toLocaleTimeString('th-TH', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Box (Fixed at Bottom, Never Scrolls) */}
              <form onSubmit={handleSendReply} className="p-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`พิมพ์ข้อความตอบกลับ ${currentThread.line_display_name} ผ่าน LINE...`}
                    className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    title="ให้ AI ช่วยร่างคำตอบตามข้อกฎหมายสาธารณสุข (RAG)"
                    onClick={handleAiDraftReply}
                    disabled={isAiGenerating}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm transition-all"
                  >
                    <Bot className={`w-3.5 h-3.5 ${isAiGenerating ? 'animate-spin' : ''}`} />
                    <span className="hidden md:inline">
                      {isAiGenerating ? 'AI กำลังค้นกฎหมาย...' : '✨ AI ช่วยตอบ (RAG)'}
                    </span>
                  </button>
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!replyText.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shrink-0"
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  ส่งเข้า LINE
                </Button>
              </form>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center p-12 bg-white rounded-3xl border border-slate-200 text-center text-slate-400">
              <div className="space-y-2">
                <Store className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-600">กรุณาเลือกผู้ทัก LINE จากรายการทางซ้าย</p>
                <p className="text-xs text-slate-400">เพื่อเริ่มแชทและเลือกผูกร้านค้าใน 1 คลิก</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
