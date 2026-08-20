import { supabase, isSupabaseConfigured, DEMO_USERS } from '../lib/supabase';
import type { UserProfile, UserRole } from '../types';
import { auditService } from './auditService';

export const userService = {
  async getUsers(): Promise<UserProfile[]> {
    if (!isSupabaseConfigured) {
      return [...DEMO_USERS];
    }

    const { data: usersData, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    const { data: roleRows } = await supabase.from('user_roles').select('*');
    const rolesMap = new Map<string, string[]>();
    (roleRows || []).forEach((r: any) => {
      const existing = rolesMap.get(r.user_id) || [];
      existing.push(r.role_id);
      rolesMap.set(r.user_id, existing);
    });

    return (usersData || []).map((u: any) => ({
      ...u,
      roles: (rolesMap.get(u.id) as UserRole[]) || ['OFFICER'],
    }));
  },

  async updateUserRoles(userId: string, roles: UserRole[]): Promise<void> {
    if (!isSupabaseConfigured) {
      const user = DEMO_USERS.find((u) => u.id === userId);
      if (user) {
        user.roles = roles;
        user.updated_at = new Date().toISOString();
        await auditService.logAction({
          action: 'UPDATE_ROLES',
          entityName: 'user_roles',
          entityId: userId,
          newValues: { roles },
        });
      }
      return;
    }

    // Delete existing roles and insert new ones
    await supabase.from('user_roles').delete().eq('user_id', userId);
    const inserts = roles.map((role_id) => ({ user_id: userId, role_id }));
    const { error } = await supabase.from('user_roles').insert(inserts);
    if (error) throw error;
  },

  async toggleUserActive(userId: string, isActive: boolean): Promise<void> {
    if (!isSupabaseConfigured) {
      const user = DEMO_USERS.find((u) => u.id === userId);
      if (user) {
        user.is_active = isActive;
        user.updated_at = new Date().toISOString();
        await auditService.logAction({
          action: 'UPDATE_STATUS',
          entityName: 'users',
          entityId: userId,
          newValues: { is_active: isActive },
        });
      }
      return;
    }

    const { error } = await supabase
      .from('users')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;
  },

  async createUser(userData: {
    first_name: string;
    last_name: string;
    email: string;
    position: string;
    department: string;
    roles: UserRole[];
  }): Promise<UserProfile> {
    if (!isSupabaseConfigured) {
      const newUser: UserProfile = {
        id: `u-${Date.now()}`,
        organization_id: 'a0000000-0000-0000-0000-000000000001',
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        position: userData.position,
        department: userData.department,
        is_active: true,
        roles: userData.roles,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      DEMO_USERS.push(newUser);
      await auditService.logAction({
        action: 'INSERT',
        entityName: 'users',
        entityId: newUser.id,
        newValues: newUser as unknown as Record<string, unknown>,
      });
      return newUser;
    }

    // In live Supabase, auth user creation is done through Supabase Auth Admin or Invites
    const { data, error } = await supabase
      .from('users')
      .insert({
        organization_id: 'a0000000-0000-0000-0000-000000000001',
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        position: userData.position,
        department: userData.department,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    await this.updateUserRoles(data.id, userData.roles);
    return { ...data, roles: userData.roles };
  }
};
