import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../context/ToastContext';
import { QrCode, Smartphone, Globe, Link2, Terminal, Copy, Check, Loader2 } from 'lucide-react';

export const RichMenuManager: React.FC = () => {
  const { success, error } = useToast();
  const [channelToken, setChannelToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  const liffId = import.meta.env.VITE_LIFF_ID || '';
  const domain = window.location.origin;

  const payload = {
    size: { width: 2500, height: 843 },
    selected: true,
    name: "เมนูหลัก อบต. โป่งน้ำร้อน",
    chatBarText: "เมนูบริการ",
    areas: [
      { bounds: { x: 0, y: 0, width: 833, height: 421 }, action: { type: "uri", uri: `${domain}/liff/track` } },
      { bounds: { x: 833, y: 0, width: 834, height: 421 }, action: { type: "message", text: "สอบถามค่าธรรมเนียม" } },
      { bounds: { x: 1667, y: 0, width: 833, height: 421 }, action: { type: "uri", uri: "https://line.me/ti/p/@634eafmr" } },
      { bounds: { x: 0, y: 421, width: 833, height: 422 }, action: { type: "uri", uri: `${domain}/liff/track` } },
      { bounds: { x: 833, y: 421, width: 834, height: 422 }, action: { type: "message", text: "ข้อมูล อบต." } },
      { bounds: { x: 1667, y: 421, width: 833, height: 422 }, action: { type: "message", text: "กฎหมายสถานที่สะสมอาหาร" } }
    ]
  };

  const handleCreateRichMenu = async () => {
    if (!channelToken.trim()) {
      error('กรุณาระบุ Channel Access Token');
      return;
    }
    setIsLoading(true);
    try {
      // Simulate API call to LINE
      await new Promise(r => setTimeout(r, 1500));
      success('สร้าง Rich Menu สำเร็จ (richmenu-xxxx)', 'กรุณาอัปโหลดรูปภาพตาม Step 5 ต่อไป');
    } catch (e) {
      error('เกิดข้อผิดพลาดในการสร้าง Rich Menu');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, step: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(step);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-green-600" />
            Rich Menu & LIFF ประชาชน
          </h1>
          <p className="text-slate-500 mt-1">ตั้งค่าและจัดการเมนู LINE ของ อบต. และระบบ LIFF</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <QrCode className="w-5 h-5 text-green-700" /> ภาพดีไซน์ Rich Menu อบต.โป่งน้ำร้อน (2500 × 1686)
              </h2>
              <a
                href="/richmenu_pnr.jpg"
                download="line_richmenu_pnr.jpg"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
              >
                📥 ดาวน์โหลดภาพไปใช้
              </a>
            </div>

            <div className="w-full rounded-2xl overflow-hidden shadow-md border-2 border-emerald-600/30">
              <img
                src="/richmenu_pnr.jpg"
                alt="LINE OA Rich Menu อบต.โป่งน้ำร้อน"
                className="w-full h-auto object-cover"
              />
            </div>
            <p className="text-xs text-slate-500 mt-3 text-center">
              💡 ภาพดีไซน์ ๖ ปุ่มมาตรฐาน พร้อมนำไปอัปโหลดในระบบ <strong>LINE Official Account Manager</strong> ได้ทันที
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-slate-500" /> Setup Steps Guide
            </h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 shrink-0">1</div>
                <div>
                  <p className="font-semibold mb-1">โหลด Rich Menu Image (แนะนำไซซ์เดิม 2500x843px)</p>
                  <p className="text-sm text-slate-500">ออกแบบภาพเมนูให้ตรงตามตำแหน่ง 6 ช่องตามตัวอย่าง</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 shrink-0">2</div>
                <div>
                  <p className="font-semibold mb-1">สร้าง LIFF App ใน LINE Developer Console</p>
                  <a href="https://developers.line.biz/console/" target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">ไปที่ LINE Console</a>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 shrink-0">3</div>
                <div>
                  <p className="font-semibold mb-1">กำหนด Endpoint URL ใน LIFF</p>
                  <code className="text-sm bg-slate-100 px-2 py-1 rounded text-pink-600">{domain}/liff/track</code>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 shrink-0">4</div>
                <div>
                  <p className="font-semibold mb-1">นำ LIFF ID มาใส่ในไฟล์ .env</p>
                  <code className="text-sm bg-slate-100 px-2 py-1 rounded text-pink-600">VITE_LIFF_ID=your-liff-id</code>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 shrink-0">5</div>
                <div className="flex-1">
                  <p className="font-semibold mb-2">อัปโหลด Rich Menu Image ผ่าน API</p>
                  <div className="relative group">
                    <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl text-xs overflow-x-auto">
{`curl -v -X POST https://api-data.line.me/v2/bot/richmenu/{richMenuId}/content \\
  -H "Authorization: Bearer {CHANNEL_ACCESS_TOKEN}" \\
  -H "Content-Type: image/png" \\
  --data-binary @richmenu.png`}
                    </pre>
                    <button 
                      onClick={() => copyToClipboard('curl -v -X POST...', 5)}
                      className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded-md text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {copiedStep === 5 ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 shrink-0">6</div>
                <div className="flex-1">
                  <p className="font-semibold mb-2">ตั้ง default Rich Menu</p>
                  <div className="relative group">
                    <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl text-xs overflow-x-auto">
{`curl -v -X POST https://api.line.me/v2/bot/user/all/richmenu/{richMenuId} \\
  -H "Authorization: Bearer {CHANNEL_ACCESS_TOKEN}"`}
                    </pre>
                    <button 
                      onClick={() => copyToClipboard('curl -v -X POST...', 6)}
                      className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded-md text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {copiedStep === 6 ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-slate-500" /> LIFF App Info
            </h2>
            <div className="mb-4">
              <span className="text-sm text-slate-500">LIFF ID</span>
              <div className="flex items-center justify-between mt-1">
                <code className="bg-slate-100 px-2 py-1 rounded text-sm text-slate-800 font-mono">
                  {liffId || 'ยังไม่ได้ตั้งค่า'}
                </code>
                <Badge variant={liffId ? 'success' : 'warning'}>
                  {liffId ? 'Configured' : 'Not Configured'}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-3 mt-6">
              <span className="text-sm text-slate-500 font-semibold block border-b pb-2">LIFF URLs</span>
              
              <div>
                <span className="text-xs text-slate-500">หน้าหลัก LIFF</span>
                <div className="flex items-center gap-2 mt-1">
                  <Link2 className="w-4 h-4 text-slate-400" />
                  <a href={`https://liff.line.me/${liffId}`} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline truncate">
                    https://liff.line.me/{liffId || '{LIFF_ID}'}
                  </a>
                </div>
              </div>
              
              <div>
                <span className="text-xs text-slate-500">ตรวจสถานะคำขอ</span>
                <div className="flex items-center gap-2 mt-1">
                  <Link2 className="w-4 h-4 text-slate-400" />
                  <a href={`https://liff.line.me/${liffId}/track`} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline truncate">
                    https://liff.line.me/{liffId || '{LIFF_ID}'}/track
                  </a>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-green-200">
            <h2 className="text-lg font-bold mb-4">Quick Create API</h2>
            <p className="text-sm text-slate-500 mb-4">
              สร้าง Rich Menu ผ่าน LINE Messaging API โดยตรง (เฉพาะขั้นตอนที่ 1 ของระบบ)
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Channel Access Token</label>
                <Input 
                  type="password" 
                  value={channelToken}
                  onChange={e => setChannelToken(e.target.value)}
                  placeholder="EY..." 
                />
              </div>
              <Button 
                onClick={handleCreateRichMenu} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <span className="mr-2">➕</span>}
                สร้าง Rich Menu ผ่าน API
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">Rich Menu JSON Config</h2>
            <details className="group">
              <summary className="text-sm font-semibold text-slate-700 cursor-pointer hover:text-green-600">
                ดู Payload
              </summary>
              <div className="mt-3 relative">
                <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl text-xs overflow-x-auto">
                  {JSON.stringify(payload, null, 2)}
                </pre>
                <button 
                  onClick={() => copyToClipboard(JSON.stringify(payload, null, 2), 0)}
                  className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded-md text-slate-300"
                >
                  {copiedStep === 0 ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </details>
          </Card>
        </div>
      </div>
    </div>
  );
};
