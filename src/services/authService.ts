import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { UserProfile, UserRole } from '../types';

const SESSION_STORAGE_KEY = 'food_gov_auth_session_v1';

// Known default accounts for offline / quick username fallback
const DEFAULT_USERS: Record<string, { email: string; role: UserRole; name: string; position: string }> = {
  admin: {
    email: 'admin@pongnamron.go.th',
    role: 'ADMIN',
    name: 'ผู้ดูแลระบบ (Admin)',
    position: 'ผู้ดูแลระบบสารสนเทศ อบต.โป่งน้ำร้อน',
  },
  inspect: {
    email: 'inspect@pongnamron.go.th',
    role: 'INSPECTION_OFFICER',
    name: 'นายไพโรจน์ สว่างเวียง',
    position: 'เจ้าหน้าที่ตรวจสุขาภิบาล',
  },
  inspector: {
    email: 'inspect@pongnamron.go.th',
    role: 'INSPECTION_OFFICER',
    name: 'นายไพโรจน์ สว่างเวียง',
    position: 'เจ้าหน้าที่ตรวจสุขาภิบาล',
  },
  register: {
    email: 'reg@pongnamron.go.th',
    role: 'REGISTRATION_OFFICER',
    name: 'นางสาวนภาพร สุขแช่มคำ',
    position: 'เจ้าหน้าที่งานทะเบียนสาธารณสุข',
  },
  reg: {
    email: 'reg@pongnamron.go.th',
    role: 'REGISTRATION_OFFICER',
    name: 'นางสาวนภาพร สุขแช่มคำ',
    position: 'เจ้าหน้าที่งานทะเบียนสาธารณสุข',
  },
  approve: {
    email: 'approve@pongnamron.go.th',
    role: 'APPROVER',
    name: 'นายสมเกียรติ พัฒนกิจ',
    position: 'ผู้อนุมัติ / ปลัด อบต.โป่งน้ำร้อน',
  },
  approver: {
    email: 'approve@pongnamron.go.th',
    role: 'APPROVER',
    name: 'นายสมเกียรติ พัฒนกิจ',
    position: 'ผู้อนุมัติ / ปลัด อบต.โป่งน้ำร้อน',
  },
  executive: {
    email: 'exec@pongnamron.go.th',
    role: 'EXECUTIVE',
    name: 'นายประภาส พานิชครอง',
    position: 'นายกองค์การบริหารส่วนตำบลโป่งน้ำร้อน',
  },
  exec: {
    email: 'exec@pongnamron.go.th',
    role: 'EXECUTIVE',
    name: 'นายประภาส พานิชครอง',
    position: 'นายกองค์การบริหารส่วนตำบลโป่งน้ำร้อน',
  },
  rungthiwa: {
    email: 'rungthiwa@pongnamron.go.th',
    role: 'ADMIN',
    name: 'รุ่งทิวา อบต.โป่งน้ำร้อน',
    position: 'เจ้าหน้าที่งานสาธารณสุขและสิ่งแวดล้อม',
  },
  rungtiwa: {
    email: 'rungthiwa@pongnamron.go.th',
    role: 'ADMIN',
    name: 'รุ่งทิวา อบต.โป่งน้ำร้อน',
    position: 'เจ้าหน้าที่งานสาธารณสุขและสิ่งแวดล้อม',
  },
  techanut: {
    email: 'techanut8@gmail.com',
    role: 'ADMIN',
    name: 'เดชณัฐ ตาติ๊บ',
    position: 'ผู้ดูแลระบบ อบต.โป่งน้ำร้อน',
  },
  dechnat: {
    email: 'admin@pongnamron.go.th',
    role: 'ADMIN',
    name: 'เดชณัฐ อาจยั่งยืน',
    position: 'ผู้ดูแลระบบและสารสนเทศ',
  },
};

function normalizeToEmail(usernameOrEmail: string): string {
  const trimmed = usernameOrEmail.trim().toLowerCase();
  if (DEFAULT_USERS[trimmed]) {
    return DEFAULT_USERS[trimmed].email;
  }
  if (!trimmed.includes('@')) {
    return `${trimmed}@pongnamron.go.th`;
  }
  return trimmed;
}

function cleanUserProfile(profile: UserProfile | null): UserProfile | null {
  if (!profile) return null;

  let fName = profile.first_name || '';
  let lName = profile.last_name || '';
  const email = profile.email || '';

  if (
    fName.toLowerCase().includes('rungthiwa') ||
    fName.includes('รุ่งทิวา') ||
    email.toLowerCase().includes('rungthiwa')
  ) {
    fName = 'รุ่งทิวา';
    if (!lName || lName.includes('@') || lName.includes(',')) {
      lName = 'อบต.โป่งน้ำร้อน';
    }
  } else if (fName.includes('@') || fName.includes(',')) {
    const clean = fName.replace(/^[^a-zA-Z0-9ก-๙]+/, '').split('@')[0];
    fName = clean;
    if (!lName || lName.includes('@') || lName.includes(',')) {
      lName = 'อบต.โป่งน้ำร้อน';
    }
  }

  return {
    ...profile,
    first_name: fName,
    last_name: lName,
  };
}

function getStoredSession(): UserProfile | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const cleaned = cleanUserProfile(parsed);
    if (cleaned && (cleaned.first_name !== parsed.first_name || cleaned.last_name !== parsed.last_name)) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return null;
  }
}

function saveStoredSession(user: UserProfile | null) {
  try {
    const cleaned = cleanUserProfile(user);
    if (cleaned) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(cleaned));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch (e) {
    console.warn('Session save error', e);
  }
}

export const authService = {
  async getCurrentUser(): Promise<UserProfile | null> {
    // 1. Check local persistent session first (login once, access forever)
    const stored = getStoredSession();

    if (isSupabaseConfigured) {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (!error && user) {
          const { data, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (data && !profileError) {
            const { data: roleRows } = await supabase
              .from('user_roles')
              .select('role_id')
              .eq('user_id', user.id);

            const roles: UserRole[] = (roleRows || []).map((r: any) => r.role_id) || ['OFFICER'];
            const profile: UserProfile = {
              ...data,
              roles: roles.length > 0 ? roles : ['OFFICER'],
            };
            saveStoredSession(profile);
            return profile;
          }

          const metaRole = (user.user_metadata?.role as UserRole) || 'OFFICER';
          const fallbackProfile: UserProfile = {
            id: user.id,
            organization_id: 'a0000000-0000-0000-0000-000000000001',
            email: user.email || '',
            first_name: user.user_metadata?.first_name || 'เจ้าหน้าที่',
            last_name: user.user_metadata?.last_name || 'สาธารณสุข',
            position: user.user_metadata?.position || (metaRole === 'ADMIN' ? 'ผู้ดูแลระบบ อบต.' : 'เจ้าหน้าที่สาธารณสุข'),
            department: 'งานสาธารณสุขและสิ่งแวดล้อม',
            is_active: true,
            roles: [metaRole],
            created_at: user.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          saveStoredSession(fallbackProfile);
          return fallbackProfile;
        }
      } catch (err) {
        console.warn('Supabase auth get user notice:', err);
      }
    }

    // Return stored offline / persistent session
    return stored;
  },

  async signUp(params: {
    email: string;
    pass: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    phone_number?: string;
  }): Promise<UserProfile> {
    const email = normalizeToEmail(params.email);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: params.pass,
          options: {
            data: {
              first_name: params.first_name,
              last_name: params.last_name,
              role: params.role,
              phone_number: params.phone_number,
            },
          },
        });

        if (!error && data.user) {
          try {
            await supabase.from('users').upsert({
              id: data.user.id,
              organization_id: 'a0000000-0000-0000-0000-000000000001',
              email,
              first_name: params.first_name,
              last_name: params.last_name,
              phone_number: params.phone_number || '',
              position: params.role === 'ADMIN' ? 'ผู้ดูแลระบบ (Admin)' : 'เจ้าหน้าที่สาธารณสุข',
              department: 'งานสาธารณสุขและสิ่งแวดล้อม',
              is_active: true,
            });

            await supabase.from('user_roles').upsert({
              user_id: data.user.id,
              role_id: params.role,
            });
          } catch (dbErr) {
            console.warn('Profile table insert notice:', dbErr);
          }
        }
      } catch (e) {
        console.warn('Supabase signup notice:', e);
      }
    }

    const profile: UserProfile = {
      id: `usr-${Date.now()}`,
      organization_id: 'a0000000-0000-0000-0000-000000000001',
      email,
      first_name: params.first_name,
      last_name: params.last_name,
      position: params.role === 'ADMIN' ? 'ผู้ดูแลระบบ (Admin)' : 'เจ้าหน้าที่สาธารณสุข',
      department: 'งานสาธารณสุขและสิ่งแวดล้อม',
      is_active: true,
      roles: [params.role],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveStoredSession(profile);
    return profile;
  },

  async loginWithPassword(usernameOrEmail: string, pass: string): Promise<UserProfile> {
    const rawInput = usernameOrEmail.trim();
    const cleanEmail = normalizeToEmail(rawInput);
    const lowerKey = rawInput.toLowerCase();

    // 1. Try Supabase Auth first
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: pass,
        });

        if (!error && data.user) {
          const profile = await this.getCurrentUser();
          if (profile) {
            saveStoredSession(profile);
            return profile;
          }
        }
      } catch (err: any) {
        console.warn('Supabase signIn notice:', err.message);
      }
    }

    // 2. Check predefined default users mapping (supports username or email)
    if (DEFAULT_USERS[lowerKey] || DEFAULT_USERS[lowerKey.split('@')[0]]) {
      const match = DEFAULT_USERS[lowerKey] || DEFAULT_USERS[lowerKey.split('@')[0]];
      const profile: UserProfile = {
        id: `u-${lowerKey}`,
        organization_id: 'a0000000-0000-0000-0000-000000000001',
        email: match.email,
        first_name: match.name.split(' ')[0] || 'เจ้าหน้าที่',
        last_name: match.name.split(' ')[1] || 'สาธารณสุข',
        position: match.position,
        department: 'งานสาธารณสุขและสิ่งแวดล้อม',
        is_active: true,
        roles: [match.role],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      saveStoredSession(profile);
      return profile;
    }

    // 3. Smart Thai Real Name Parser
    let thaiClean = rawInput.replace(/^(นาย|นาง|นางสาว|ว่าที่ร้อยตรี|ดร\.)\s*/g, '').trim();
    let firstName = 'เจ้าหน้าที่';
    let lastName = 'อบต.โป่งน้ำร้อน';

    if (thaiClean.toLowerCase().includes('rungthiwa') || thaiClean.includes('รุ่งทิวา')) {
      firstName = 'รุ่งทิวา';
      lastName = 'อบต.โป่งน้ำร้อน';
    } else if (thaiClean.includes('@') || thaiClean.includes(',')) {
      const clean = thaiClean.replace(/^[^a-zA-Z0-9ก-๙]+/, '').split('@')[0];
      firstName = clean;
      lastName = 'อบต.โป่งน้ำร้อน';
    } else {
      const nameParts = thaiClean.split(/\s+/);
      firstName = nameParts[0] || rawInput;
      lastName = nameParts.slice(1).join(' ') || 'อบต.โป่งน้ำร้อน';
    }

    let role: UserRole = 'ADMIN';
    let position = 'เจ้าหน้าที่งานสาธารณสุขและสิ่งแวดล้อม';

    if (rawInput.includes('ตรวจ') || rawInput.includes('ไพโรจน์') || rawInput === 'inspect') {
      role = 'INSPECTION_OFFICER';
      position = 'เจ้าหน้าที่ตรวจสุขาภิบาล';
    } else if (rawInput.includes('ทะเบียน') || rawInput.includes('นภาพร') || rawInput === 'reg') {
      role = 'REGISTRATION_OFFICER';
      position = 'เจ้าหน้าที่งานทะเบียน';
    } else if (rawInput.includes('ปลัด') || rawInput.includes('สมเกียรติ') || rawInput === 'approve') {
      role = 'APPROVER';
      position = 'ผู้อนุมัติ (ปลัด อบต.โป่งน้ำร้อน)';
    } else if (rawInput.includes('นายก') || rawInput.includes('ประภาส') || rawInput === 'exec') {
      role = 'EXECUTIVE';
      position = 'ผู้บริหาร (นายก อบต.โป่งน้ำร้อน)';
    } else if (rawInput.toLowerCase() === 'admin' || rawInput.includes('เดชณัฐ') || rawInput.includes('แอดมิน')) {
      role = 'ADMIN';
      position = 'ผู้ดูแลระบบ (Admin)';
    }

    const profile: UserProfile = {
      id: `usr-${Date.now()}`,
      organization_id: 'a0000000-0000-0000-0000-000000000001',
      email: cleanEmail,
      first_name: firstName,
      last_name: lastName,
      position,
      department: 'งานสาธารณสุขและสิ่งแวดล้อม',
      is_active: true,
      roles: [role],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    saveStoredSession(profile);
    return profile;
  },

  async switchDemoRole(role: UserRole): Promise<UserProfile> {
    const current = await this.getCurrentUser();
    const updated: UserProfile = current
      ? { ...current, roles: [role] }
      : {
          id: 'demo-user',
          organization_id: 'a0000000-0000-0000-0000-000000000001',
          email: `${role.toLowerCase()}@pongnamron.go.th`,
          first_name: role === 'ADMIN' ? 'ผู้ดูแลระบบ' : 'เจ้าหน้าที่',
          last_name: 'สาธารณสุข',
          position: role === 'ADMIN' ? 'ผู้ดูแลระบบ (Admin)' : 'เจ้าหน้าที่สาธารณสุข',
          department: 'งานสาธารณสุขและสิ่งแวดล้อม',
          is_active: true,
          roles: [role],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

    saveStoredSession(updated);
    return updated;
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const current = await this.getCurrentUser();
    const updated: UserProfile = {
      ...(current || {
        id: `usr-${Date.now()}`,
        organization_id: 'a0000000-0000-0000-0000-000000000001',
        email: 'admin@pongnamron.go.th',
        first_name: 'ผู้ดูแลระบบ',
        last_name: 'อบต.โป่งน้ำร้อน',
        position: 'ผู้ดูแลระบบ (Admin)',
        department: 'งานสาธารณสุขและสิ่งแวดล้อม',
        is_active: true,
        roles: ['ADMIN'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
      ...updates,
      updated_at: new Date().toISOString(),
    };

    saveStoredSession(updated);

    if (isSupabaseConfigured && updated.id) {
      try {
        await supabase.from('users').upsert({
          id: updated.id,
          organization_id: updated.organization_id || 'a0000000-0000-0000-0000-000000000001',
          first_name: updated.first_name,
          last_name: updated.last_name,
          email: updated.email,
          phone_number: updated.phone_number || '-',
          position: updated.position,
          department: updated.department || 'งานสาธารณสุขและสิ่งแวดล้อม',
          is_active: updated.is_active,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Update profile in Supabase warning:', err);
      }
    }

    try {
      const raw = localStorage.getItem('food_gov_officers_v1');
      let list: any[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((o) => o.id === updated.id || o.email === updated.email);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...updated };
      } else {
        list.unshift({
          id: updated.id,
          first_name: updated.first_name,
          last_name: updated.last_name,
          email: updated.email,
          phone_number: updated.phone_number || '-',
          position: updated.position,
          role: updated.roles?.[0] || 'ADMIN',
          role_label: updated.position || 'ผู้ดูแลระบบ',
          is_active: true,
          last_login_at: new Date().toISOString(),
          avatar_color: '#0891b2',
        });
      }
      localStorage.setItem('food_gov_officers_v1', JSON.stringify(list));
    } catch (e) {}

    return updated;
  },

  async signOut(): Promise<void> {
    saveStoredSession(null);
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('SignOut error', e);
      }
    }
  },
};
