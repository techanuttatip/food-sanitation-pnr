import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';
import {
  aiRagService,
  KnowledgeSnippet,
  RAGResponse,
  AIMessage,
} from '../services/aiRagService';
import {
  Bot,
  Sparkles,
  Send,
  BookOpen,
  Scale,
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  HelpCircle,
  ShieldCheck,
  Plus,
  Trash2,
  Flame,
  Lightbulb,
  CornerDownRight,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';

export const AiAssistant: React.FC = () => {
  const { success, info } = useToast();
  const [activeTab, setActiveTab] = useState<'chat' | 'knowledge' | 'simulation'>('chat');
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome-001',
      role: 'assistant',
      content: `สวัสดีครับ! ผมคือ **AI Copilot ผู้ช่วยงานสาธารณสุขและข้อกฎหมาย (RAG)** ประจำ อบต.โป่งน้ำร้อน 🤖✨

ผมเชื่อมต่อกับฐานข้อมูล **พ.ร.บ. การสาธารณสุข ๒๕๓๕**, **กฎกระทรวงสุขลักษณะ ๒๕๖๑**, และ **ข้อบัญญัติ อบต.โป่งน้ำร้อน** พร้อมช่วยงานท่านเจ้าหน้าที่ในเรื่อง:
- 📋 ตรวจสอบเอกสารและหลักฐานการขอใบอนุญาต
- 💰 คำนวณอัตราค่าธรรมเนียมตามขนาด ตร.ม.
- 🔍 ข้อกำหนดเกณฑ์มาตรฐานการตรวจ ๑๐ ข้อ
- ⚖️ บทกำหนดโทษและมาตรการบังคับทางปกครอง
- 💬 ช่วยร่างข้อความตอบประชาชนผ่าน LINE OA

*สามารถพิมพ์สอบถาม หรือเลือกหัวข้อด่วนด้านล่างได้เลยครับ!*`,
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      suggestedFollowups: [
        'เอกสารที่ต้องใช้ขอใบอนุญาตใหม่มีอะไรบ้าง?',
        'อัตราค่าธรรมเนียมคิดอย่างไร?',
        'เกณฑ์การตรวจสุขาภิบาล 10 ข้อ',
        'บทกำหนดโทษกรณีไม่ขอใบอนุญาต',
      ],
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Knowledge Base tab state
  const [knowledgeList, setKnowledgeList] = useState<KnowledgeSnippet[]>([]);
  const [kbSearch, setKbSearch] = useState('');
  const [selectedSnippet, setSelectedSnippet] = useState<KnowledgeSnippet | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocCategory, setNewDocCategory] = useState<KnowledgeSnippet['category']>('LAW');
  const [newDocSource, setNewDocSource] = useState('');
  const [newDocLawRef, setNewDocLawRef] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [newDocKeywords, setNewDocKeywords] = useState('');

  // Simulation tab state
  const [simQuestion, setSimQuestion] = useState('เปิดห้องเย็นเก็บเนื้อหมู 150 ตร.ม. ต้องขอใบอนุญาตไหม และเสียค่าธรรมเนียมเท่าไหร่ครับ');
  const [simResponse, setSimResponse] = useState<RAGResponse | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  useEffect(() => {
    setKnowledgeList(aiRagService.getKnowledgeBase());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (queryToSend?: string) => {
    const text = (queryToSend || inputQuery).trim();
    if (!text || isLoading) return;

    const userMsg: AIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryToSend) setInputQuery('');
    setIsLoading(true);

    try {
      const rag = await aiRagService.ask(text);

      const aiMsg: AIMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: rag.answer,
        citations: rag.citations,
        suggestedFollowups: rag.suggestedFollowups,
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    success('คัดลอกข้อความแล้ว', 'พร้อมนำไปใช้หรือส่งให้ผู้ประกอบการ');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSimulate = async () => {
    if (!simQuestion.trim()) return;
    setSimLoading(true);
    try {
      const res = await aiRagService.ask(simQuestion);
      setSimResponse(res);
    } finally {
      setSimLoading(false);
    }
  };

  const handleAddKnowledge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim() || !newDocContent.trim()) return;

    const catLabels: Record<string, string> = {
      LAW: 'พ.ร.บ. การสาธารณสุข ๒๕๓๕',
      REGULATION: 'กฎกระทรวงสุขลักษณะ',
      OBT_BYLAW: 'ข้อบัญญัติ อบต. โป่งน้ำร้อน',
      CHECKLIST: 'มาตรฐานการตรวจสุขาภิบาล',
      FEE: 'อัตราค่าธรรมเนียม',
      PROCESS: 'ขั้นตอนและระเบียบ',
      PENALTY: 'บทกำหนดโทษ',
    };

    aiRagService.addCustomKnowledge({
      category: newDocCategory,
      categoryLabel: catLabels[newDocCategory] || 'ข้อบังคับ',
      title: newDocTitle,
      source: newDocSource || 'อบต.โป่งน้ำร้อน',
      lawReference: newDocLawRef || '-',
      keywords: newDocKeywords.split(',').map((s) => s.trim()).filter(Boolean),
      content: newDocContent,
    });

    setKnowledgeList(aiRagService.getKnowledgeBase());
    setIsAddModalOpen(false);
    setNewDocTitle('');
    setNewDocSource('');
    setNewDocLawRef('');
    setNewDocContent('');
    setNewDocKeywords('');
    success('เพิ่มข้อกฎหมาย/องค์ความรู้สำเร็จ ✨', 'ระบบ RAG อัปเดตข้อมูลพร้อมใช้งานทันที');
  };

  const filteredKnowledge = kbSearch
    ? aiRagService.searchKnowledge(kbSearch)
    : knowledgeList;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-600" />
              Hybrid RAG Knowledge Engine
            </span>
            <span className="text-xs text-slate-500 hidden md:inline">
              อบต. โป่งน้ำร้อน อ.ฝาง จ.เชียงใหม่
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2 mt-1">
            <Bot className="w-6 h-6 text-purple-600" />
            AI Copilot ผู้ช่วยงานสาธารณสุขและข้อกฎหมาย
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ค้นหาข้อกฎหมาย พ.ร.บ. สาธารณสุข ๒๕๓๕, อัตราค่าธรรมเนียม, เกณฑ์ตรวจ ๑๐ ข้อ และช่วยร่างคำตอบอัตโนมัติ
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'chat'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Copilot แชท</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('knowledge')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'knowledge'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>คลังข้อกฎหมาย ({knowledgeList.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('simulation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'simulation'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>จำลองตอบ LINE</span>
          </button>
        </div>
      </div>

      {/* TAB 1: AI Copilot Chat */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Chat Area (3 Cols) */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="flex flex-col h-[600px] shadow-sm border-slate-200 overflow-hidden bg-slate-50/50">
              {/* Chat Message Stream */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-2xl rounded-2xl p-4 space-y-3 ${
                        msg.role === 'user'
                          ? 'bg-gov-700 text-white rounded-tr-none shadow-sm'
                          : 'bg-white text-slate-800 rounded-tl-none border border-slate-200/80 shadow-xs'
                      }`}
                    >
                      {/* Message Content */}
                      <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                        {msg.content}
                      </div>

                      {/* RAG Law Citations (If any) */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 space-y-1.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Scale className="w-3 h-3 text-purple-600" />
                            แหล่งข้อมูลอ้างอิงทางกฎหมาย:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.citations.map((cite) => (
                              <span
                                key={cite.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-medium"
                              >
                                📌 {cite.title} ({cite.lawReference})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Suggested Follow-up chips (For assistant) */}
                      {msg.suggestedFollowups && msg.suggestedFollowups.length > 0 && (
                        <div className="pt-2 border-t border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 mb-1.5 flex items-center gap-1">
                            <Lightbulb className="w-3 h-3 text-amber-500" />
                            คำถามที่เกี่ยวข้อง:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.suggestedFollowups.map((f, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleSendMessage(f)}
                                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-purple-50 hover:text-purple-700 border border-slate-200 text-[11px] text-slate-700 transition-colors text-left"
                              >
                                {f} →
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions footer */}
                      <div className="flex items-center justify-between pt-1 text-[10px] opacity-70">
                        <span>{msg.timestamp}</span>
                        {msg.role === 'assistant' && (
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="flex items-center gap-1 text-slate-500 hover:text-purple-600 transition-colors"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-600">คัดลอกแล้ว</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>คัดลอกคำตอบ</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gov-100 text-gov-800 flex items-center justify-center shrink-0 border border-gov-300 shadow-sm mt-0.5 text-xs font-bold">
                        คุณ
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3 justify-start items-center text-xs text-slate-500 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="p-3 bg-white rounded-2xl border border-purple-200 shadow-xs flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600 animate-spin" />
                      <span>กำลังสืบค้นข้อกฎหมายและประมวลผลคำตอบ (RAG Engine)...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    placeholder="พิมพ์คำถามเกี่ยวกับกฎหมายสาธารณสุข, ค่าธรรมเนียม, เกณฑ์ตรวจ หรือให้ช่วยร่างคำตอบ..."
                    className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                  />
                  <Button
                    type="submit"
                    disabled={!inputQuery.trim() || isLoading}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 rounded-xl shadow-sm flex items-center gap-1.5 text-xs shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">ส่งคำถาม</span>
                  </Button>
                </form>
              </div>
            </Card>
          </div>

          {/* Quick Prompts & Knowledge Snippets (1 Col) */}
          <div className="space-y-4">
            <Card className="p-4 space-y-3 border-purple-200/80 bg-linear-to-b from-purple-50/50 to-white">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">หัวข้อถามบ่อย</h4>
                  <p className="text-[10px] text-slate-500">คลิกเพื่อถาม AI ทันที</p>
                </div>
              </div>

              <div className="space-y-1.5">
                {[
                  'เอกสารที่ต้องใช้ขอใบอนุญาตใหม่มีอะไรบ้าง?',
                  'อัตราค่าธรรมเนียมคิดอย่างไร?',
                  'เกณฑ์การตรวจสุขาภิบาล 10 ข้อ',
                  'โทษกรณีไม่ขอใบอนุญาตตาม พ.ร.บ.',
                  'การต่ออายุต้องยื่นล่วงหน้ากี่วัน?',
                  'มาตรฐานห้องเย็นแช่แข็งอาหารทะเล',
                ].map((prompt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendMessage(prompt)}
                    className="w-full text-left p-2 rounded-xl text-xs text-slate-700 hover:bg-purple-100 hover:text-purple-900 border border-slate-200/80 transition-colors flex items-center justify-between group"
                  >
                    <span className="line-clamp-1">{prompt}</span>
                    <CornerDownRight className="w-3 h-3 text-slate-400 group-hover:text-purple-600 shrink-0" />
                  </button>
                ))}
              </div>
            </Card>

            {/* RAG Engine Status Card */}
            <Card className="p-4 space-y-2.5 bg-slate-900 text-white rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  RAG ENGINE ACTIVE
                </span>
                <span className="text-[10px] text-slate-400 font-mono">v1.0-PongNamRon</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                ระบบสืบค้นอัตโนมัติจากคลังข้อมูลกฎหมาย พ.ร.บ. สาธารณสุข ๒๕๓๕ พร้อม Citation อ้างอิงมาตราทุกคำตอบ
              </p>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                <span>คลังข้อมูล: {knowledgeList.length} หัวข้อ</span>
                <span className="text-emerald-400 font-bold">100% Accuracy</span>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: Knowledge Base Directory */}
      {activeTab === 'knowledge' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="relative flex-1">
              <Input
                placeholder="ค้นหาข้อกฎหมาย, มาตรา, หรือคำสำคัญ (เช่น ห้องเย็น, โทษปรับ, ค่าธรรมเนียม)..."
                value={kbSearch}
                onChange={(e) => setKbSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>
            <Button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold shrink-0 text-xs"
            >
              เพิ่มข้อกฎหมาย/ระเบียบใหม่
            </Button>
          </div>

          {/* Grid of Knowledge Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredKnowledge.map((item) => (
              <Card
                key={item.id}
                className="p-5 flex flex-col justify-between hover:border-purple-300 hover:shadow-md transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                      {item.categoryLabel}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {item.updatedAt}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {item.content}
                  </p>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 truncate max-w-[180px]">
                    📌 {item.lawReference}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedSnippet(item)}
                    className="text-xs text-purple-700 hover:bg-purple-50"
                  >
                    ดูเนื้อหาฉบับเต็ม
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Citizen Auto-Reply Simulation */}
      {activeTab === 'simulation' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Input Citizen Question */}
          <Card className="p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                จำลองข้อความจากประชาชน (LINE Chat)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ทดสอบพิมพ์คำถามที่ประชาชนอาจทักมาทาง LINE OA แล้วดูคำตอบที่ RAG สร้างให้
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">ข้อความจากประชาชน:</label>
              <textarea
                rows={4}
                value={simQuestion}
                onChange={(e) => setSimQuestion(e.target.value)}
                className="w-full p-3 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="กรอกคำถามของประชาชนที่นี่..."
              />
            </div>

            {/* Sample Citizen Prompts */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-slate-500">คำถามตัวอย่างที่พบบ่อย:</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'เปิดโกดังข้าวสาร 200 ตร.ม. ต้องเสียค่าธรรมเนียมเท่าไหร่',
                  'ขอใบอนุญาตต้องใช้ใบรับรองแพทย์ตรวจโรคอะไรบ้าง',
                  'ใบอนุญาตใกล้หมดอายุต้องทำยังไงคะ',
                  'ถ้าเปิดร้านอาหารแช่เย็นโดยไม่ขอใบอนุญาตมีโทษอะไรบ้าง',
                ].map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSimQuestion(q)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-[11px] text-slate-700 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="button"
              onClick={handleSimulate}
              isLoading={simLoading}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl shadow-md text-xs sm:text-sm"
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              ประมวลผลคำตอบอัตโนมัติ (RAG Generation)
            </Button>
          </Card>

          {/* Right: Simulated LINE Flex & Text Reply */}
          <Card className="p-6 space-y-4 bg-linear-to-b from-emerald-50/40 via-white to-white border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Bot className="w-5 h-5 text-purple-600" />
                  ผลลัพธ์คำตอบที่ AI ร่างให้
                </h3>
                <p className="text-xs text-slate-500">พร้อมนำไปส่งในแชท LINE OA ได้ทันที</p>
              </div>
              {simResponse && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ความเชื่อมั่น {simResponse.confidence}%
                </span>
              )}
            </div>

            {simResponse ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white border border-emerald-300 shadow-sm text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-slate-800 font-sans">
                  {simResponse.answer}
                </div>

                {/* Citations */}
                {simResponse.citations.length > 0 && (
                  <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 space-y-1 text-xs">
                    <p className="font-bold text-purple-900 flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5 text-purple-700" />
                      ข้อกฎหมายที่นำมาอ้างอิง:
                    </p>
                    <ul className="list-disc list-inside text-purple-800 text-[11px] space-y-0.5">
                      {simResponse.citations.map((c) => (
                        <li key={c.id}>
                          {c.source} ({c.lawReference})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleCopy('sim-res', simResponse.answer)}
                  className="w-full text-xs font-bold"
                  leftIcon={<Copy className="w-3.5 h-3.5" />}
                >
                  คัดลอกคำตอบเพื่อส่งประชาชน
                </Button>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                <Bot className="w-10 h-10 text-slate-300" />
                <p className="text-xs">กดปุ่ม "ประมวลผลคำตอบอัตโนมัติ" เพื่อดูคำตอบที่ AI ร่างให้</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Snippet Detail Modal */}
      {selectedSnippet && (
        <Modal
          isOpen={!!selectedSnippet}
          onClose={() => setSelectedSnippet(null)}
          title={selectedSnippet.title}
          size="lg"
          footer={
            <Button variant="secondary" onClick={() => setSelectedSnippet(null)}>
              ปิดหน้าต่าง
            </Button>
          }
        >
          <div className="space-y-4 text-xs sm:text-sm text-slate-800">
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="info">{selectedSnippet.categoryLabel}</Badge>
              <Badge variant="neutral">📌 {selectedSnippet.lawReference}</Badge>
              <Badge variant="neutral">แหล่งที่มา: {selectedSnippet.source}</Badge>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 whitespace-pre-wrap leading-relaxed">
              {selectedSnippet.content}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500">คำสำคัญ (Keywords):</p>
              <div className="flex flex-wrap gap-1">
                {selectedSnippet.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px]"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Custom Knowledge Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="เพิ่มข้อกฎหมายหรือระเบียบใหม่เข้าสู่คลัง AI RAG"
          size="lg"
        >
          <form onSubmit={handleAddKnowledge} className="space-y-3 text-xs sm:text-sm">
            <div>
              <label className="font-bold text-slate-700 block mb-1">หมวดหมู่:</label>
              <select
                value={newDocCategory}
                onChange={(e) => setNewDocCategory(e.target.value as any)}
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs"
              >
                <option value="LAW">พ.ร.บ. การสาธารณสุข ๒๕๓๕</option>
                <option value="REGULATION">กฎกระทรวงสุขลักษณะ</option>
                <option value="OBT_BYLAW">ข้อบัญญัติ อบต. โป่งน้ำร้อน</option>
                <option value="CHECKLIST">มาตรฐานการตรวจสุขาภิบาล</option>
                <option value="FEE">อัตราค่าธรรมเนียม</option>
                <option value="PROCESS">ขั้นตอนและระเบียบปฏิบัติ</option>
                <option value="PENALTY">บทกำหนดโทษ</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">หัวข้อเรื่อง:</label>
              <input
                type="text"
                required
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                placeholder="เช่น ข้อปฏิบัติในการระบายอากาศในคลังสินค้า"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">แหล่งที่มา:</label>
                <input
                  type="text"
                  value={newDocSource}
                  onChange={(e) => setNewDocSource(e.target.value)}
                  placeholder="เช่น ข้อบัญญัติ อบต. โป่งน้ำร้อน"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">มาตรา / ข้ออ้างอิง:</label>
                <input
                  type="text"
                  value={newDocLawRef}
                  onChange={(e) => setNewDocLawRef(e.target.value)}
                  placeholder="เช่น มาตรา ๓๘ วรรคสอง"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">คำสำคัญ (คั่นด้วยจุลภาค):</label>
              <input
                type="text"
                value={newDocKeywords}
                onChange={(e) => setNewDocKeywords(e.target.value)}
                placeholder="เช่น ห้องเย็น, อาหารทะเล, กลิ่นอับ, สุขลักษณะ"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">เนื้อหาข้อกฎหมาย/ระเบียบ:</label>
              <textarea
                rows={5}
                required
                value={newDocContent}
                onChange={(e) => setNewDocContent(e.target.value)}
                placeholder="พิมพ์เนื้อหาข้อกำหนด หรือรายละเอียดระเบียบที่นี่..."
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>
                ยกเลิก
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold">
                บันทึกเข้าคลัง RAG
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
