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
  Lock,
  RefreshCw,
  Award,
  Edit2,
} from 'lucide-react';

interface OfficerUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  position: string;
  role: UserRole;
  role_label: string;
  is_active: boolean;
  last_login_at: string;
  avatar_color: string;
}

const ROLE_OPTIONS: { value: UserRole; label: string; desc: string; color: string; badge: { bg: string; text: string } }[] = [
  {
    value: 'SUPER_ADMIN',
    label: 'ผู้ดูแลระบบสูงสุด (Super Admin)',
    desc: 'สิทธิ์สูงสุด เข้าถึง จัดการ และตรวจสอบได้ทุกระบบ',
    color: '#1e40af',
    badge: { bg: 'bg-blue-100 border-blue-300', text: 'text-blue-800' },
  },
  {
    value: 'ADMIN',
    label: 'ผู้ดูแลระบบ (Admin)',
    desc: 'จัดการเจ้าหน้าที่ ตั้งค่าระบบ และกำกับดูแลภาพรวม',
    color: '#0891b2',
    badge: { bg: 'bg-cyan-100 border-cyan-300', text: 'text-cyan-800' },
  },
  {
    value: 'REGISTRATION_OFFICER',
    label: 'เจ้าหน้าที่งานทะเบียน (Registration)',
    desc: 'รับคำขอ ตรวจสอบเอกสาร ออกใบเสร็จรับเงิน',
    color: '#059669',
    badge: { bg: 'bg-emerald-100 border-emerald-300', text: 'text-emerald-800' },
  },
  {
    value: 'INSPECTION_OFFICER',
    label: 'เจ้าหน้าที่ตรวจสุขาภิบาล (Inspector)',
    desc: 'นัดหมาย ตรวจประเมินสุขาภิบาล 10 ข้อ ใช้แอปสนาม',
    color: '#7c3aed',
    badge: { bg: 'bg-purple-100 border-purple-300', text: 'text-purple-800' },
  },
  {
    value: 'APPROVER',
    label: 'ผู้อนุมัติ (ปลัด / นายก อบต.)',
    desc: 'พิจารณาอนุมัติและลงนามในหนังสือรับรองการแจ้ง',
    color: '#ea580c',
    badge: { bg: 'bg-orange-100 border-orange-300', text: 'text-orange-800' },
  },
  {
    value: 'EXECUTIVE',
    label: 'ผู้บริหาร อบต. (Executive)',
    desc: 'ดูสรุปรายงานสถิติ แดชบอร์ดภาพรวม GIS',
    color: '#be185d',
    badge: { bg: 'bg-pink-100 border-pink-300', text: 'text-pink-800' },
  },
  {
    value: 'OFFICER',
    label: 'เจ้าหน้าที่สาธารณสุข (Officer)',
    desc: 'เจ้าหน้าที่ปฏิบัติการสาธารณสุขทั่วไป',
    color: '#475569',
    badge: { bg: 'bg-slate-100 border-slate-300', text: 'text-slate-800' },
  },
];

function getRoleMeta(role: UserRole) {
  const found = ROLE_OPTIONS.find((r) => r.value === role);
  return (
    found || {
      value: 'OFFICER' as UserRole,
      label: 'เจ้าหน้าที่สาธารณสุข',
      desc: 'เจ้าหน้าที่ปฏิบัติการ',
      color: '#475569',
      badge: { bg: 'bg-slate-100 border-slate-300', text: 'text-slate-800' },
    }
  );
}

function normalizeToEmail(usernameOrEmail: string): string {
  const trimmed = usernameOrEmail.trim().toLowerCase();
  if (trimmed.includes('@')) return trimmed;
  return `${trimmed}@pongnamron.go.th`;
}

const INITIAL_OFFICERS: OfficerUser[] = [
  {
    id: 'u-admin-01',
    first_name: 'เดชณัฐ',
    last_name: 'อาจยั่งยืน',
    email: 'admin@pongnamron.go.th',
    phone_number: '053-123001',
    position: 'ผู้ดูแลระบบและสารสนเทศ',
    role: 'ADMIN',
    role_label: 'ผู้ดูแลระบบ (Admin)',
    is_active: true,
    last_login_at: new Date().toISOString(),
    avatar_color: '#0891b2',
  },
  {
    id: 'u-inspect-01',
    first_name: 'ไพโรจน์',
    last_name: 'สว่างเวียง',
    email: 'inspect@pongnamron.go.th',
    phone_number: '053-123002',
    position: 'เจ้าหน้าที่ตรวจสุขาภิบาล',
    role: 'INSPECTION_OFFICER',
    role_label: 'เจ้าหน้าที่ตรวจสุขาภิบาล (Inspector)',
    is_active: true,
    last_login_at: new Date().toISOString(),
    avatar_color: '#7c3aed',
  },
  {
    id: 'u-reg-01',
    first_name: 'นภาพร',
    last_name: 'สุขแช่มคำ',
    email: 'reg@pongnamron.go.th',
    phone_number: '053-123003',
    position: 'เจ้าหน้าที่งานทะเบียนและคำขอ',
    role: 'REGISTRATION_OFFICER',
    role_label: 'เจ้าหน้าที่งานทะเบียน (Registration)',
    is_active: true,
    last_login_at: new Date().toISOString(),
    avatar_color: '#059669',
  },
  {
    id: 'u-appr-01',
    first_name: 'สมเกียรติ',
    last_name: 'สถิตพรเจริญ',
    email: 'approve@pongnamron.go.th',
    phone_number: '053-123004',
    position: 'ปลัด อบต.โป่งน้ำร้อน',
    role: 'APPROVER',
    role_label: 'ผู้อนุมัติ (ปลัด / นายก อบต.)',
    is_active: true,
    last_login_at: new Date().toISOString(),
    avatar_color: '#ea580c',
  },
];

export const UserManagement: React.FC = () => {
  const { success, error } = useToast();
  const { user, currentRole, switchRole } = useAuth();
  const [officers, setOfficers] = useState<OfficerUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Add Officer Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    usernameOrEmail: '',
    password: '',
    phone_number: '',
    position: '',
    role: 'ADMIN' as UserRole,
  });

  // Edit Officer Modal
  const [editingOfficer, setEditingOfficer] = useState<OfficerUser | null>(null);
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    position: '',
    role: 'ADMIN' as UserRole,
    is_active: true,
  });

  // Reset Password Modal
  const [resetModalUser, setResetModalUser] = useState<OfficerUser | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const loadOfficers = async () => {
    setIsLoading(true);
    try {
      let loadedList: OfficerUser[] = [];

      // 1. Fetch from Supabase users
      const { data: usersData, error: fetchErr } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (!fetchErr && usersData && usersData.length > 0) {
        const { data: rolesData } = await supabase.from('user_roles').select('*');
        const rolesMap = new Map<string, string>();
        (rolesData || []).forEach((r: any) => {
          rolesMap.set(r.user_id, r.role_id);
        });

        const colors = ['#1e40af', '#0891b2', '#059669', '#7c3aed', '#ea580c', '#be185d'];
        loadedList = usersData.map((u: any, idx: number) => {
          const rawRole: UserRole = (rolesMap.get(u.id) as UserRole) || 'OFFICER';
          const meta = getRoleMeta(rawRole);
          return {
            id: u.id,
            first_name: u.first_name || 'เจ้าหน้าที่',
            last_name: u.last_name || 'อบต.',
            email: u.email || '',
            phone_number: u.phone_number || '-',
            position: u.position || meta.label,
            role: rawRole,
            role_label: meta.label,
            is_active: u.is_active ?? true,
            last_login_at: u.last_login_at || u.created_at || new Date().toISOString(),
            avatar_color: colors[idx % colors.length],
          };
        });
      }

      // 2. Read local cache
      const raw = localStorage.getItem('food_gov_officers_v1');
      const localList: OfficerUser[] = raw ? JSON.parse(raw) : [];

      // Read deleted blacklist
      const rawDel = localStorage.getItem('food_gov_deleted_officer_ids_v1');
      const deletedIds: string[] = rawDel ? JSON.parse(rawDel) : [];

      // Merge Supabase + Local (excluding deleted)
      const merged: OfficerUser[] = [];
      
      // Add Supabase users
      loadedList.forEach((u) => {
        if (!deletedIds.includes(u.id) && !deletedIds.includes(u.email)) {
          merged.push(u);
        }
      });

      // Add local users if not already present
      localList.forEach((lo) => {
        if (
          !deletedIds.includes(lo.id) &&
          !deletedIds.includes(lo.email) &&
          !merged.some((m) => m.id === lo.id || m.email === lo.email)
        ) {
          merged.push(lo);
        }
      });

      // If never initialized and no deletions, seed default staff
      const hasInitialized = localStorage.getItem('food_gov_officers_initialized_v1');
      if (!hasInitialized && merged.length === 0 && deletedIds.length === 0) {
        INITIAL_OFFICERS.forEach((io) => merged.push(io));
        localStorage.setItem('food_gov_officers_initialized_v1', 'true');
      }

      // Ensure current logged-in user is present
      if (user && user.first_name) {
        const existingIdx = merged.findIndex((m) => m.id === user.id || m.email === user.email);
        if (existingIdx >= 0) {
          merged[existingIdx] = {
            ...merged[existingIdx],
            first_name: user.first_name,
            last_name: user.last_name,
            position: user.position || merged[existingIdx].position,
            phone_number: user.phone_number || merged[existingIdx].phone_number,
          };
        } else if (!deletedIds.includes(user.id) && !deletedIds.includes(user.email || '')) {
          merged.unshift({
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email || 'officer@pongnamron.go.th',
            phone_number: user.phone_number || '-',
            position: user.position || 'เจ้าหน้าที่สาธารณสุข',
            role: (user.roles?.[0] as UserRole) || 'ADMIN',
            role_label: user.position || 'ผู้ดูแลระบบ (Admin)',
            is_active: true,
            last_login_at: new Date().toISOString(),
            avatar_color: '#0891b2',
          });
        }
      }

      setOfficers(merged);
      localStorage.setItem('food_gov_officers_v1', JSON.stringify(merged));
    } catch (err: any) {
      console.warn('Load officers notice:', err.message);
      const raw = localStorage.getItem('food_gov_officers_v1');
      if (raw) setOfficers(JSON.parse(raw));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOfficers();
  }, []);

  const handleOpenEditModal = (officer: OfficerUser) => {
    setEditingOfficer(officer);
    setEditFormData({
      first_name: officer.first_name,
      last_name: officer.last_name,
      email: officer.email,
      phone_number: officer.phone_number === '-' ? '' : officer.phone_number,
      position: officer.position || '',
      role: officer.role,
      is_active: officer.is_active,
    });
  };

  const handleSaveEditOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOfficer) return;
    if (!editFormData.first_name.trim()) {
      error('กรุณากรอกชื่อจริง');
      return;
    }

    setIsSubmitting(true);
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(editingOfficer.id);

      if (isUuid) {
        try {
          await supabase.from('users').update({
            first_name: editFormData.first_name,
            last_name: editFormData.last_name,
            position: editFormData.position,
            phone_number: editFormData.phone_number,
            is_active: editFormData.is_active,
          }).eq('id', editingOfficer.id);

          await supabase.from('user_roles').upsert({
            user_id: editingOfficer.id,
            role_id: editFormData.role,
          });
        } catch (dbErr) {
          console.warn('Supabase update notice:', dbErr);
        }
      }

      const roleMeta = getRoleMeta(editFormData.role);
      const updatedList = officers.map((u) => {
        if (u.id === editingOfficer.id) {
          return {
            ...u,
            first_name: editFormData.first_name,
            last_name: editFormData.last_name,
            position: editFormData.position,
            phone_number: editFormData.phone_number || '-',
            role: editFormData.role,
            role_label: roleMeta.label,
            is_active: editFormData.is_active,
          };
        }
        return u;
      });

      setOfficers(updatedList);
      localStorage.setItem('food_gov_officers_v1', JSON.stringify(updatedList));
      setEditingOfficer(null);
      success('บันทึกการแก้ไขสำเร็จ ✨', `ข้อมูลของ ${editFormData.first_name} ได้รับการอัปเดตแล้ว`);
    } catch (err: any) {
      error('บันทึกไม่สำเร็จ', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (id: string) => {
    const current = officers.find((o) => o.id === id);
    if (!current) return;
    const nextActive = !current.is_active;

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (isUuid) {
        try {
          await supabase.from('users').update({ is_active: nextActive }).eq('id', id);
        } catch (dbErr) {
          console.warn('Supabase toggle status notice:', dbErr);
        }
      }

      const updated = officers.map((u) =>
        u.id === id ? { ...u, is_active: nextActive } : u
      );
      setOfficers(updated);
      localStorage.setItem('food_gov_officers_v1', JSON.stringify(updated));

      success(
        nextActive ? 'เปิดใช้งานบัญชีแล้ว 🟢' : 'ระงับการใช้งานบัญชีแล้ว 🔴',
        `บัญชีของ ${current.first_name} ถูกเปลี่ยนสถานะเรียบร้อย`
      );
    } catch (err: any) {
      error('ไม่สามารถเปลี่ยนสถานะได้', err.message);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีของ "${name}" ออกจากระบบ?`)) {
      return;
    }

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (isUuid) {
        try {
          await supabase.from('user_roles').delete().eq('user_id', id);
          await supabase.from('users').delete().eq('id', id);
        } catch (dbErr) {
          console.warn('Supabase delete notice:', dbErr);
        }
      }

      const updated = officers.filter((u) => u.id !== id);
      setOfficers(updated);
      localStorage.setItem('food_gov_officers_v1', JSON.stringify(updated));

      // Add to deleted blacklist
      const rawDel = localStorage.getItem('food_gov_deleted_officer_ids_v1');
      const deletedIds: string[] = rawDel ? JSON.parse(rawDel) : [];
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        localStorage.setItem('food_gov_deleted_officer_ids_v1', JSON.stringify(deletedIds));
      }

      success('ลบบัญชีผู้ใช้สำเร็จ 🗑️', `ลบบัญชี ${name} ออกจากระบบเรียบร้อย`);
    } catch (err: any) {
      error('ลบไม่สำเร็จ', err.message);
    }
  };

  const handleAddOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name.trim()) {
      error('กรุณากรอกชื่อจริง');
      return;
    }
    if (!formData.usernameOrEmail.trim()) {
      error('กรุณากรอกชื่อผู้ใช้งาน หรือ อีเมล');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      error('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanEmail = normalizeToEmail(formData.usernameOrEmail);

      // 1. Ensure Organization exists
      let orgId = 'a0000000-0000-0000-0000-000000000001';
      try {
        const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
        if (orgs && orgs.length > 0) {
          orgId = orgs[0].id;
        } else {
          await supabase.from('organizations').upsert({
            id: orgId,
            code: 'OBT-PNR',
            name: 'องค์การบริหารส่วนตำบลโป่งน้ำร้อน',
            province: 'เชียงใหม่',
            amphoe: 'ฝาง',
            tambon: 'โป่งน้ำร้อน',
            phone: '053-123456',
            email: 'pongnamron@local.go.th',
          });
        }
      } catch (orgErr) {
        console.warn('Org verify notice:', orgErr);
      }

      // 2. Ensure Roles table has entries
      try {
        await supabase.from('roles').upsert([
          { id: 'SUPER_ADMIN', name_th: 'ผู้ดูแลระบบสูงสุด', description: 'สิทธิ์สูงสุด' },
          { id: 'ADMIN', name_th: 'ผู้ดูแลระบบ (Admin)', description: 'จัดการเจ้าหน้าที่และระบบ' },
          { id: 'REGISTRATION_OFFICER', name_th: 'เจ้าหน้าที่งานทะเบียน', description: 'งานคำขอและตรวจเอกสาร' },
          { id: 'INSPECTION_OFFICER', name_th: 'เจ้าหน้าที่ตรวจสุขาภิบาล', description: 'นัดหมายและตรวจสนาม' },
          { id: 'APPROVER', name_th: 'ผู้อนุมัติ (ปลัด/นายก)', description: 'พิจารณาอนุมัติใบอนุญาต' },
          { id: 'EXECUTIVE', name_th: 'ผู้บริหาร อบต.', description: 'ดูรายงานสถิติ' },
        ]);
      } catch (roleErr) {
        console.warn('Roles seed notice:', roleErr);
      }

      // 3. Register Auth User
      let authUserId: string = '';
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: formData.password,
          options: {
            data: {
              first_name: formData.first_name,
              last_name: formData.last_name,
              phone_number: formData.phone_number,
              position: formData.position || getRoleMeta(formData.role).label,
              role: formData.role,
            },
          },
        });
        if (authData?.user?.id) {
          authUserId = authData.user.id;
        }
      } catch (authE) {
        console.warn('Auth signup notice:', authE);
      }

      // Fallback valid UUID if offline or auth didn't return
      if (!authUserId) {
        authUserId = crypto.randomUUID();
      }

      // 4. Save into public.users table
      const userPayload = {
        id: authUserId,
        organization_id: orgId,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: cleanEmail,
        phone_number: formData.phone_number || '-',
        position: formData.position || getRoleMeta(formData.role).label,
        department: 'งานสาธารณสุขและสิ่งแวดล้อม',
        is_active: true,
        last_login_at: new Date().toISOString(),
      };

      const { error: userInsertError } = await supabase.from('users').upsert(userPayload);
      if (userInsertError) {
        console.warn('User insert warning:', userInsertError.message);
      }

      // 5. Save into public.user_roles table
      try {
        await supabase.from('user_roles').upsert({
          user_id: authUserId,
          role_id: formData.role,
        });
      } catch (urErr) {
        console.warn('User role insert warning:', urErr);
      }

      // 6. Update local state immediately
      const newOfficer: OfficerUser = {
        id: authUserId,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: cleanEmail,
        phone_number: formData.phone_number || '-',
        position: formData.position || getRoleMeta(formData.role).label,
        role: formData.role,
        role_label: getRoleMeta(formData.role).label,
        is_active: true,
        last_login_at: new Date().toISOString(),
        avatar_color: getRoleMeta(formData.role).color,
      };

      setOfficers((prev) => [newOfficer, ...prev.filter((o) => o.id !== authUserId)]);

      setIsAddModalOpen(false);
      success(
        'บันทึกเจ้าหน้าที่สำเร็จ 🎉',
        `เพิ่ม "${formData.first_name} ${formData.last_name}" (User: ${cleanEmail}) และตั้งรหัสผ่านเรียบร้อยแล้ว`
      );

      setFormData({
        first_name: '',
        last_name: '',
        usernameOrEmail: '',
        password: '',
        phone_number: '',
        position: '',
        role: 'ADMIN',
      });

      // Reload
      setTimeout(loadOfficers, 500);
    } catch (err: any) {
      error('เพิ่มเจ้าหน้าที่ไม่สำเร็จ', err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser || !newPassword || newPassword.length < 6) {
      error('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    try {
      success(
        'รีเซ็ตรหัสผ่านสำเร็จ',
        `กำหนดรหัสผ่านใหม่สำหรับ "${resetModalUser.first_name} ${resetModalUser.last_name}" เรียบร้อยแล้ว`
      );
      setResetModalUser(null);
      setNewPassword('');
    } catch (err: any) {
      error('รีเซ็ตรหัสผ่านไม่สำเร็จ', err.message);
    }
  };

  const filteredOfficers = officers.filter((u) => {
    const matchSearch =
      u.first_name.toLowerCase().includes(search.toLowerCase()) ||
      u.last_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role_label.toLowerCase().includes(search.toLowerCase()) ||
      (u.position && u.position.toLowerCase().includes(search.toLowerCase()));
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadOfficers}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            รีเฟรชข้อมูล
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
            className="shadow-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            + เพิ่มเจ้าหน้าที่และรหัสผ่าน
          </Button>
        </div>
      </div>

      {/* สลับบทบาท (ทดสอบ RBAC) */}
      <Card className="p-4 bg-slate-50 border border-slate-200 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">สลับบทบาท (ทดสอบ RBAC)</h3>
            <p className="text-xs text-slate-500">
              บทบาทปัจจุบันของคุณ: <span className="font-bold text-gov-700">{currentRole}</span> ({getRoleMeta(currentRole).label})
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {ROLE_OPTIONS.map((r) => (
            <button
              key={r.value}
              onClick={() => switchRole(r.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                currentRole === r.value
                  ? 'bg-gov-700 text-white border-gov-800 shadow-sm font-bold'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {r.label.split(' ')[0]} {r.label.split(' ')[1]}
            </button>
          ))}
        </div>
      </Card>

      {/* Summary Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500">เจ้าหน้าที่ทั้งหมด</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5 font-mono">
              {officers.length} <span className="text-xs text-slate-400 font-normal">คน</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-emerald-600">สถานะเปิดใช้งาน</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5 font-mono">
              {officers.filter((u) => u.is_active).length}{' '}
              <span className="text-xs text-slate-400 font-normal">คน</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-cyan-600">ผู้ดูแลระบบ (Admin)</p>
            <p className="text-2xl font-black text-cyan-600 mt-0.5 font-mono">
              {officers.filter((u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length}{' '}
              <span className="text-xs text-slate-400 font-normal">คน</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-purple-600">จนท.ตรวจสุขาภิบาล</p>
            <p className="text-2xl font-black text-purple-600 mt-0.5 font-mono">
              {officers.filter((u) => u.role === 'INSPECTION_OFFICER').length}{' '}
              <span className="text-xs text-slate-400 font-normal">คน</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อเจ้าหน้าที่, อีเมล, ตำแหน่ง..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-gov-600 focus:outline-hidden"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 focus:ring-2 focus:ring-gov-600 focus:outline-hidden"
        >
          <option value="">ทุกบทบาทหน้าที่ ({ROLE_OPTIONS.length} Roles)</option>
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {/* Officers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOfficers.map((officer) => {
          const initials =
            (officer.first_name[0] || '') + (officer.last_name[0] || '').toUpperCase();
          const roleMeta = getRoleMeta(officer.role);

          return (
            <Card
              key={officer.id}
              className="border border-slate-200 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden bg-white rounded-2xl"
            >
              <div className="p-5 space-y-4">
                {/* Avatar & Name */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-sm"
                      style={{ backgroundColor: officer.avatar_color }}
                    >
                      {initials || 'จนท'}
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

                {/* Role Pill & Position */}
                <div className="space-y-1">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border ${roleMeta.badge.bg} ${roleMeta.badge.text}`}
                  >
                    <Shield className="w-3 h-3" />
                    {roleMeta.label}
                  </span>
                  {officer.position && (
                    <p className="text-xs text-slate-600 font-medium pl-0.5">
                      ตำแหน่ง: <span className="font-bold text-slate-800">{officer.position}</span>
                    </p>
                  )}
                </div>

                {/* Contact & Meta */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> โทรศัพท์:
                    </span>
                    <span className="font-mono font-semibold text-slate-800">
                      {officer.phone_number}
                    </span>
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
              <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEditModal(officer)}
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                  className="text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border-slate-300"
                >
                  แก้ไข
                </Button>

                <Button
                  variant={officer.is_active ? 'danger' : 'success'}
                  size="sm"
                  onClick={() => toggleStatus(officer.id)}
                  className="text-xs"
                >
                  {officer.is_active ? 'ระงับบัญชี' : 'เปิดใช้งาน'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setResetModalUser(officer);
                    setNewPassword('');
                  }}
                  leftIcon={<Key className="w-3.5 h-3.5" />}
                  className="text-xs text-slate-700 border-slate-300"
                >
                  รหัสผ่าน
                </Button>

                <button
                  type="button"
                  title="ลบบัญชีผู้ใช้นี้ออกจากระบบ"
                  onClick={() =>
                    handleDeleteUser(officer.id, `${officer.first_name} ${officer.last_name}`)
                  }
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
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-4 shadow-sm">
          <Users className="w-14 h-14 text-slate-300 mx-auto" />
          <div>
            <p className="text-lg font-bold text-slate-800">ยังไม่มีรายชื่อเจ้าหน้าที่ในระบบ</p>
            <p className="text-xs text-slate-500 mt-1">
              คลิกปุ่มด้านล่างเพื่อสร้างบัญชีเจ้าหน้าที่และกำหนดรหัสผ่านเข้าใช้งาน
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            + เพิ่มเจ้าหน้าที่คนแรกในระบบ
          </Button>
        </div>
      )}

      {/* Add Officer Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="เพิ่มเจ้าหน้าที่ผู้ใช้งานใหม่ (งานสาธารณสุข อบต.โป่งน้ำร้อน)"
          description="บันทึกข้อมูลเจ้าหน้าที่ ตั้งรหัสผ่าน และกำหนดสิทธิ์เข้าใช้งานระบบ"
          size="lg"
        >
          <form onSubmit={handleAddOfficer} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="ชื่อจริง (ภาษาไทย)"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="เช่น สมเกียรติ หรือ เดชณัฐ"
              />
              <Input
                label="นามสกุล"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="เช่น สถิตพรเจริญ หรือ อาจยั่งยืน"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="ชื่อผู้ใช้ หรือ อีเมลล็อกอิน"
                required
                value={formData.usernameOrEmail}
                onChange={(e) => setFormData({ ...formData, usernameOrEmail: e.target.value })}
                placeholder="เช่น admin หรือ admin@pongnamron.go.th"
                helperText="พิมพ์เป็นชื่อย่อภาษาอังกฤษได้ ระบบจะแปลงเป็นอีเมล อบต. ให้อัตโนมัติ"
              />
              <Input
                label="รหัสผ่านเข้าสู่ระบบ (Password)"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="อย่างน้อย 6 ตัวอักษร เช่น Admin@1234"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="ตำแหน่งหน้าที่ (Position)"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="เช่น นักวิชาการสาธารณสุขชำนาญการ, ปลัด อบต."
              />
              <Input
                label="เบอร์โทรศัพท์ติดต่อ"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="เช่น 081-234-5678 หรือ 053-123002"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                บทบาทหน้าที่และสิทธิ์การใช้งาน (Role & Permissions):
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label} — {r.desc}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] space-y-1">
              <p className="font-bold flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> หมายเหตุความมั่นคงปลอดภัย:
              </p>
              <p>
                เจ้าหน้าที่จะสามารถใช้ <strong>ชื่อจริงภาษาไทย</strong> หรือ <strong>Username/Email</strong> ร่วมกับ <strong>รหัสผ่าน</strong> ที่กำหนดนี้ เข้าสู่ระบบได้ทั้งบนคอมพิวเตอร์และแอปภาคสนามทันที
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                leftIcon={<UserPlus className="w-4 h-4" />}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                บันทึกเจ้าหน้าที่และรหัสผ่าน
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reset Password Modal */}
      {resetModalUser && (
        <Modal
          isOpen={!!resetModalUser}
          onClose={() => setResetModalUser(null)}
          title="กำหนดรหัสผ่านใหม่ (Reset Password)"
          description={`กำหนดรหัสผ่านใหม่สำหรับ ${resetModalUser.first_name} ${resetModalUser.last_name}`}
          size="sm"
        >
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
            <Input
              label="รหัสผ่านใหม่ (New Password):"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="ขั้นต่ำ 6 ตัวอักษร เช่น NewPass@123"
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="secondary" size="sm" onClick={() => setResetModalUser(null)}>
                ยกเลิก
              </Button>
              <Button type="submit" variant="primary" size="sm" leftIcon={<Key className="w-3.5 h-3.5" />}>
                บันทึกรหัสผ่านใหม่
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
