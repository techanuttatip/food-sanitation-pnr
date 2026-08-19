import { supabase } from '../lib/supabase';
import type { UserProfile, UserRole } from '../types';

export const authService = {
  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        return null;
      }

      // Try fetching profile from `users` table
      const { data, error: profileError } = await supabase
        .from('users')
        .select('*, user_roles(role_id)')
        .eq('id', user.id)
        .maybeSingle();

      if (data && !profileError) {
        const roles: UserRole[] = data.user_roles?.map((r: { role_id: UserRole }) => r.role_id) || ['OFFICER'];
        return {
          ...data,
          roles: roles.length > 0 ? roles : ['OFFICER'],
        };
      }

      // Fallback from Supabase Auth user metadata
      const metaRole = (user.user_metadata?.role as UserRole) || 'OFFICER';
      return {
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
    } catch (err) {
      console.error('Error fetching Supabase user:', err);
      return null;
    }
  },

  async signUp(params: {
    email: string;
    pass: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    phone_number?: string;
  }): Promise<UserProfile> {
    const { data, error } = await supabase.auth.signUp({
      email: params.email,
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

    if (error) throw error;
    if (!data.user) throw new Error('ไม่สามารถสร้างบัญชีผู้ใช้ได้');

    // Create record in `users` and `user_roles`
    try {
      await supabase.from('users').upsert({
        id: data.user.id,
        organization_id: 'a0000000-0000-0000-0000-000000000001',
        email: params.email,
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

    const profile: UserProfile = {
      id: data.user.id,
      organization_id: 'a0000000-0000-0000-0000-000000000001',
      email: params.email,
      first_name: params.first_name,
      last_name: params.last_name,
      position: params.role === 'ADMIN' ? 'ผู้ดูแลระบบ (Admin)' : 'เจ้าหน้าที่สาธารณสุข',
      department: 'งานสาธารณสุขและสิ่งแวดล้อม',
      is_active: true,
      roles: [params.role],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return profile;
  },

  async loginWithPassword(email: string, pass: string): Promise<UserProfile> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) throw error;
    if (!data.user) throw new Error('ไม่พบข้อมูลผู้ใช้ในระบบ');

    const profile = await this.getCurrentUser();
    if (profile) return profile;

    const metaRole = (data.user.user_metadata?.role as UserRole) || 'OFFICER';
    return {
      id: data.user.id,
      organization_id: 'a0000000-0000-0000-0000-000000000001',
      email: data.user.email || email,
      first_name: data.user.user_metadata?.first_name || 'เจ้าหน้าที่',
      last_name: data.user.user_metadata?.last_name || 'สาธารณสุข',
      position: metaRole === 'ADMIN' ? 'ผู้ดูแลระบบ (Admin)' : 'เจ้าหน้าที่สาธารณสุข',
      department: 'งานสาธารณสุขและสิ่งแวดล้อม',
      is_active: true,
      roles: [metaRole],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  async switchDemoRole(role: UserRole): Promise<UserProfile> {
    // For quick role testing inside session
    const current = await this.getCurrentUser();
    if (current) {
      current.roles = [role];
      return current;
    }
    return {
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
  },

  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('SignOut error', e);
    }
  },
};
