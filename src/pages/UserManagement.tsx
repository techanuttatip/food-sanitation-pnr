import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { formatThaiDate } from '../lib/utils';
import { supabase } from '../lib/supabase';
import type { UserRole } from '../types';
import {
  Users,
  UserPlus,
  Shield,
  Search,
  Mail,
  Phone,
  Key,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  UserCheck,
  Trash2,
} from 'lucide-react';

interface OfficerUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  role: 'ADMIN' | 'OFFICER';
  role_label: string;
  is_active: boolean;
  last_login_at: string;
  avatar_color: string;
}

export const UserManagement: React.FC = () => {
  const { success, error } = useToast();
  const { currentRole, switchRole } = useAuth();
  const [officers, setOfficers] = useState<OfficerUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Add Officer Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    role: 'OFFICER' as 'ADMIN' | 'OFFICER',
  });

  const loadOfficers = async () => {
    setIsLoading(true);
    try {
      const { data, error: fetchErr } = await supabase
        .from('users')
        .select('*, user_roles(role_id)')
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;

      const colors = ['#1e40af', '#059669', '#0891b2', '#7c3aed', '#ea580c'];
      const mapped: OfficerUser[] = (data || []).map((u: any, idx: number) => {
        const rawRole = u.user_roles?.[0]?.role_id || 'OFFICER';
        const role: 'ADMIN' | 'OFFICER' = rawRole === 'ADMIN' || rawRole === 'SUPER_ADMIN' ? 'ADMIN' : 'OFFICER';
        return {
          id: u.id,
          first_name: u.first_name || 'เจ้าหน้าที่',
          last_name: u.last_name || 'อบต.',
          email: u.email || '',
          phone_number: u.phone_number || '-',
          role,
          role_label: role === 'ADMIN' ? 'ผู้ดูแลระบบ (Admin)' : 'เจ้าหน้าที่สาธารณสุข (Officer)',
          is_active: u.is_active ?? true,
          last_login_at: u.last_login_at || u.created_at || new Date().toISOString(),
          avatar_color: colors[idx % colors.length],
        };
      });

      setOfficers(mapped);
    } catch (err: any) {
      console.warn('Load officers error:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOfficers();
  }, []);

  const toggleStatus = async (id: string) => {
    const current = officers.find((o) => o.id === id);
    if (!current) return;
    const nextActive = !current.is_active;

    try {
      await supabase.from('users').update({ is_active: nextActive }).eq('id', id);
      setOfficers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, is_active: nextActive } : u))
      );
      success(
        nextActive ? 'เปิดใช้งานบัญชีแล้ว' : 'ระงับการใช้งานบัญชีแล้ว',
        `บัญชีของ ${current.first_name} ถูกเปลี่ยนสถานะเรียบร้อย`
      );
    } catch (err: any) {
      error('ไม่สามารถเปลี่ยนสถานะได้', err.message);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีของ "${name}" ออกจาก Supabase?`)) {
      return;
    }

    try {
      await supabase.from('user_roles').delete().eq('user_id', id);
      await supabase.from('users').delete().eq('id', id);
      setOfficers((prev) => prev.filter((u) => u.id !== id));
      success('ลบบัญชีผู้ใช้สำเร็จ', `ลบบัญชี ${name} ออกจากระบบแล้ว`);
    } catch (err: any) {
      error('ลบไม่สำเร็จ', err.message);
    }
  };

  const handleAddOfficer = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const newId = `u-${Date.now()}`;
      await supabase.from('users').insert({
        id: newId,
        organization_id: 'a0000000-0000-0000-0000-000000000001',
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone_number: formData.phone_number,
        position: formData.role === 'ADMIN' ? 'ผู้ดูแลระบบ (Admin)' : 'เจ้าหน้าที่สาธารณสุข',
        department: 'งานสาธารณสุขและสิ่งแวดล้อม',
        is_active: true,
      });

      await supabase.from('user_roles').insert({
        user_id: newId,
        role_id: formData.role,
      });

      setIsAddModalOpen(false);
      success('เพิ่มเจ้าหน้าที่ใหม่สำเร็จ', `เพิ่ม "${formData.first_name} ${formData.last_name}" ในระบบเรียบร้อยแล้ว`);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        role: 'OFFICER',
      });
      loadOfficers();
    } catch (err: any) {
      error('เพิ่มเจ้าหน้าที่ไม่สำเร็จ', err.message);
    }
  };

  const filteredOfficers = officers.filter((u) => {
    const matchSearch =
      u.first_name.toLowerCase().includes(search.toLowerCase()) ||
      u.last_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role_label.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-gov-700" />
            จัดการเจ้าหน้าที่ผู้ใช้งานและสิทธิ์
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            งานสาธารณสุข องค์การบริหารส่วนตำบลโป่งน้ำร้อน อำเภอฝาง จังหวัดเชียงใหม่
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setIsAddModalOpen(true)}
          leftIcon={<UserPlus className="w-4 h-4" />}
          className="shadow-md"
        >
          + เพิ่มเจ้าหน้าที่ใหม่
        </Button>
      </div>

      {/* สลับบทบาท (ทดสอบ RBAC) */}
      <Card className="p-4 bg-slate-50 border border-slate-200 shadow-sm">
        <div className="mb-2">
          <h3 className="text-sm font-bold text-slate-800">สลับบทบาท (ทดสอบ RBAC)</h3>
          <p className="text-xs text-slate-500">บทบาทปัจจุบัน: <span className="font-bold text-gov-700">{currentRole}</span></p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'SUPER_ADMIN', label: 'ผู้ดูแลระบบสูงสุด' },
            { id: 'ADMIN', label: 'ผู้ดูแลระบบ (Admin)' },
            { id: 'REGISTRATION_OFFICER', label: 'เจ้าหน้าที่งานทะเบียน' },
            { id: 'INSPECTION_OFFICER', label: 'เจ้าหน้าที่ตรวจสุขาภิบาล' },
            { id: 'APPROVER', label: 'ผู้อนุมัติ (ปลัด/นายก)' },
            { id: 'EXECUTIVE', label: 'ผู้บริหาร อบต.' },
            { id: 'OFFICER', label: 'เจ้าหน้าที่สาธารณสุข' },
          ].map(r => (
            <button
              key={r.id}
              onClick={() => switchRole(r.id as UserRole)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                currentRole === r.id
                  ? 'bg-gov-600 text-white border-gov-700 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Summary Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400">เจ้าหน้าที่ในระบบ</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5 font-mono">{officers.length} <span className="text-xs text-slate-400 font-normal">คน</span></p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-emerald-600">เจ้าหน้าที่สาธารณสุข</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5 font-mono">{officers.filter((u) => u.role === 'OFFICER').length} <span className="text-xs text-slate-400 font-normal">คน</span></p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <p className="text-[11px] font-semibold text-indigo-600">ผู้ดูแลระบบ (Admin)</p>
            <p className="text-2xl font-black text-indigo-600 mt-0.5 font-mono">{officers.filter((u) => u.role === 'ADMIN').length} <span className="text-xs text-slate-400 font-normal">คน</span></p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-white shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            placeholder="ค้นหาชื่อเจ้าหน้าที่, อีเมล, หรือตำแหน่ง..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[
              { value: '', label: 'ทุกบทบาทและสิทธิ์ (2 Roles)' },
              { value: 'OFFICER', label: 'เจ้าหน้าที่สาธารณสุข (Officer)' },
              { value: 'ADMIN', label: 'ผู้ดูแลระบบ (Admin)' },
            ]}
          />
        </div>
      </Card>

      {/* Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredOfficers.map((officer) => {
          const initials = `${officer.first_name[0] || ''}${officer.last_name[0] || ''}`;

          const roleTheme =
            officer.role === 'ADMIN'
              ? { bg: 'bg-indigo-100 border-indigo-300', text: 'text-indigo-900', label: 'ผู้ดูแลระบบ (Admin)' }
              : { bg: 'bg-emerald-100 border-emerald-300', text: 'text-emerald-900', label: 'เจ้าหน้าที่สาธารณสุข (Officer)' };

          return (
            <Card
              key={officer.id}
              className="border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden bg-white"
            >
              <div className="p-5 space-y-4">
                {/* Avatar & Name */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-2xs"
                      style={{ backgroundColor: officer.avatar_color }}
                    >
                      {initials}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {officer.first_name} {officer.last_name}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {officer.email}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`w-3 h-3 rounded-full shrink-0 mt-1 ${
                      officer.is_active ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-slate-300'
                    }`}
                  />
                </div>

                {/* Role Pill */}
                <div>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border ${roleTheme.bg} ${roleTheme.text}`}
                  >
                    <Shield className="w-3 h-3" />
                    {roleTheme.label}
                  </span>
                </div>

                {/* Contact & Meta */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> โทรศัพท์:
                    </span>
                    <span className="font-mono font-semibold text-slate-800">{officer.phone_number}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> บันทึกเมื่อ:
                    </span>
                    <span>{formatThaiDate(officer.last_login_at, { shortMonth: true })}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                <Button
                  variant={officer.is_active ? 'danger' : 'success'}
                  size="sm"
                  onClick={() => toggleStatus(officer.id)}
                  className="text-xs flex-1"
                >
                  {officer.is_active ? 'ระงับบัญชี' : 'เปิดใช้งาน'}
                </Button>

                <button
                  type="button"
                  title="ลบบัญชีผู้ใช้นี้ออกจาก Supabase"
                  onClick={() => handleDeleteUser(officer.id, `${officer.first_name} ${officer.last_name}`)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredOfficers.length === 0 && !isLoading && (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-4">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <div>
            <p className="text-base font-bold text-slate-800">ยังไม่มีรายชื่อเจ้าหน้าที่ในตาราง users</p>
            <p className="text-xs text-slate-400 mt-1">เริ่มต้นสร้างบัญชีผู้ใช้งานคนแรกใน Supabase</p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            + เพิ่มเจ้าหน้าที่คนแรก
          </Button>
        </div>
      )}

      {/* Add Officer Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="เพิ่มเจ้าหน้าที่ผู้ใช้งานใหม่ (งานสาธารณสุข อบต.โป่งน้ำร้อน)"
          description="บันทึกข้อมูลเจ้าหน้าที่และกำหนดสิทธิ์เข้าใช้งานระบบ"
          size="md"
        >
          <form onSubmit={handleAddOfficer} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="ชื่อจริง"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="เช่น สมชาย"
              />
              <Input
                label="นามสกุล"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="เช่น ใจดีงาม"
              />
            </div>

            <Input
              label="อีเมลราชการ (@pongnamron.go.th)"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="officer@pongnamron.go.th"
            />

            <Input
              label="เบอร์โทรศัพท์ติดต่อ"
              required
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              placeholder="053-123002"
            />

            <Select
              label="บทบาทหน้าที่ (Role):"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'OFFICER' })}
              options={[
                { value: 'OFFICER', label: 'เจ้าหน้าที่สาธารณสุข (Officer) - ปฏิบัติงานทุกขั้นตอน' },
                { value: 'ADMIN', label: 'ผู้ดูแลระบบ (Admin) - จัดการเจ้าหน้าที่และฐานข้อมูล' },
              ]}
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsAddModalOpen(false)}>
                ยกเลิก
              </Button>
              <Button type="submit" variant="primary" size="sm" leftIcon={<UserPlus className="w-4 h-4" />}>
                บันทึกข้อมูลเจ้าหน้าที่
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
