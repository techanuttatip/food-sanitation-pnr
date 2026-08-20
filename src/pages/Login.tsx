import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Lock, User, LogIn, ShieldCheck } from 'lucide-react';

export const Login: React.FC<{ onLoginSuccess?: () => void }> = ({ onLoginSuccess }) => {
  const { loginWithPassword } = useAuth();
  const { success, error } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      error('กรุณากรอกชื่อผู้ใช้งาน หรือ ชื่อ-นามสกุล');
      return;
    }

    setIsLoading(true);
    try {
      await loginWithPassword(identifier.trim(), password);
      success('เข้าสู่ระบบสำเร็จ 🎉', `ยินดีต้อนรับคุณ ${identifier.trim()} เข้าสู่ระบบ อบต.โป่งน้ำร้อน`);
      onLoginSuccess?.();
    } catch (err: any) {
      error('เข้าสู่ระบบไม่สำเร็จ', err.message || 'รหัสผ่านไม่ถูกต้อง');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background visual accents */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-gov-600/30 blur-3xl pointer-events-none" />

      {/* Header Emblem */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex w-24 h-24 rounded-full bg-white items-center justify-center shadow-2xl border-2 border-slate-200 mb-3 p-2 overflow-hidden">
          <img src="/logo_obt_pnr.png" alt="ตรา อบต.โป่งน้ำร้อน" className="w-full h-full object-contain" />
        </div>
        <h2 className="text-xl font-black tracking-tight text-white">
          งานสาธารณสุข
        </h2>
        <p className="mt-1 text-xs text-slate-300 font-medium">
          องค์การบริหารส่วนตำบลโป่งน้ำร้อน อำเภอฝาง จังหวัดเชียงใหม่
        </p>
        <p className="mt-0.5 text-[11px] text-emerald-400 font-medium">
          ระบบบริหารจัดการสถานที่สะสมอาหาร (พ.ร.บ. สาธารณสุข ๒๕๓๕)
        </p>
      </div>

      {/* Login Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        <Card className="p-6 sm:p-7 shadow-2xl border-slate-700/80 bg-slate-950/95 backdrop-blur-xl rounded-3xl space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <LogIn className="w-4 h-4 text-emerald-400" />
              เข้าสู่ระบบเจ้าหน้าที่
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              สามารถกรอกชื่อจริงภาษาไทย หรือชื่อผู้ใช้งานของท่าน
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                ชื่อ-นามสกุล ภาษาไทย หรือ ชื่อผู้ใช้งาน:
              </label>
              <Input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                leftIcon={<User className="w-4 h-4 text-slate-400" />}
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 text-xs font-medium"
                placeholder="เช่น เดชณัฐ, สมชาย, admin"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                รหัสผ่าน (Password):
              </label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                className="bg-slate-900 border-slate-700 text-white text-xs"
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full font-bold shadow-lg text-xs py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center gap-2"
              isLoading={isLoading}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>เข้าสู่ระบบ (Sign In)</span>
            </Button>
          </form>
        </Card>

        <p className="text-center text-[10px] text-slate-500 mt-4">
          งานสาธารณสุขและสิ่งแวดล้อม องค์การบริหารส่วนตำบลโป่งน้ำร้อน
        </p>
      </div>
    </div>
  );
};
