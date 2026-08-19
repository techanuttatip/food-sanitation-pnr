import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { UserRole } from '../types';
import { Building2, Lock, Mail, User, Phone, ShieldCheck, ArrowRight, UserPlus, LogIn } from 'lucide-react';

export const Login: React.FC<{ onLoginSuccess?: () => void }> = ({ onLoginSuccess }) => {
  const { loginWithPassword, signUp } = useAuth();
  const { success, error } = useToast();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<UserRole>('OFFICER');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await loginWithPassword(email, password);
      success('เข้าสู่ระบบสำเร็จ', 'ยินดีต้อนรับเข้าสู่งานสาธารณสุข อบต.โป่งน้ำร้อน');
      onLoginSuccess?.();
    } catch (err: any) {
      error('เข้าสู่ระบบไม่สำเร็จ', err.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signUp({
        email,
        pass: password,
        first_name: firstName,
        last_name: lastName,
        role,
        phone_number: phoneNumber,
      });
      success('สร้างบัญชีผู้ใช้งานสำเร็จ', `ยินดีต้อนรับคุณ ${firstName} ${lastName}`);
      onLoginSuccess?.();
    } catch (err: any) {
      error('สร้างบัญชีไม่สำเร็จ', err.message || 'เกิดข้อผิดพลาดในการลงทะเบียน');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background visual accents */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-gov-600/30 blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex w-16 h-16 rounded-2xl bg-linear-to-br from-gov-700 to-gov-950 items-center justify-center text-amber-300 shadow-xl border border-gov-600 mb-3">
          <Building2 className="w-9 h-9" />
        </div>
        <h2 className="text-xl font-black tracking-tight text-white">
          ระบบบริหารจัดการสถานที่สะสมอาหาร
        </h2>
        <p className="mt-1 text-xs text-slate-300 font-medium">
          งานสาธารณสุข องค์การบริหารส่วนตำบลโป่งน้ำร้อน อำเภอฝาง จังหวัดเชียงใหม่
        </p>
        <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-3 py-0.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          ระบบสารสนเทศความมั่นคงปลอดภัยราชการ (SSL/TLS 1.3)
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        <Card className="p-6 sm:p-7 shadow-2xl border-slate-700/80 bg-slate-950/95 backdrop-blur-xl rounded-2xl space-y-5">
          
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                mode === 'signin'
                  ? 'bg-gov-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              เข้าสู่ระบบ (Sign In)
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                mode === 'signup'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              สร้างบัญชีใหม่ (Sign Up)
            </button>
          </div>

          {/* SIGN IN FORM */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">อีเมลผู้ใช้งาน</label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 text-xs"
                  placeholder="your.email@pongnamron.go.th"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">รหัสผ่าน</label>
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
                className="w-full font-bold shadow-lg text-xs"
                isLoading={isLoading}
              >
                เข้าสู่ระบบ
              </Button>

              {/* Quick Demo Login Shortcut */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <p className="text-[10px] text-slate-400 font-semibold text-center">
                  ⚡ ทางลัดสำหรับทดสอบระบบ (1-Click Test Login):
                </p>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('admin@pongnamron.go.th');
                      setPassword('Admin@123456');
                    }}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-left transition-all"
                  >
                    <p className="font-bold text-amber-400">👑 Admin (แอดมิน)</p>
                    <p className="text-[10px] text-slate-400">admin@pongnamron...</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('inspect@pongnamron.go.th');
                      setPassword('Admin@123456');
                    }}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-left transition-all"
                  >
                    <p className="font-bold text-sky-400">🔍 เจ้าหน้าที่ตรวจ</p>
                    <p className="text-[10px] text-slate-400">inspect@pongnamron...</p>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* SIGN UP FORM */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">ชื่อจริง</label>
                  <Input
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white text-xs"
                    placeholder="สมชาย"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">นามสกุล</label>
                  <Input
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white text-xs"
                    placeholder="ใจดีงาม"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">อีเมล</label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                  className="bg-slate-900 border-slate-700 text-white text-xs"
                  placeholder="officer@pongnamron.go.th"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)</label>
                <Input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                  className="bg-slate-900 border-slate-700 text-white text-xs"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                <Input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white text-xs"
                  placeholder="08X-XXX-XXXX"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full font-bold shadow-lg text-xs bg-emerald-600 hover:bg-emerald-700 mt-2"
                isLoading={isLoading}
              >
                ยืนยันสร้างบัญชีผู้ใช้งาน
              </Button>
            </form>
          )}
        </Card>

        <p className="mt-4 text-center text-[11px] text-slate-500">
          พระราชบัญญัติการสาธารณสุข พ.ศ. ๒๕๓๕ • งานสาธารณสุขและสิ่งแวดล้อม
        </p>
      </div>
    </div>
  );
};
