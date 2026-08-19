import { createClient } from '@supabase/supabase-js';
import type {
  Business,
  Application,
  Inspection,
  InspectionItem,
  License,
  UserProfile,
  AuditLog,
} from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://drzcdlccurngodpkgyql.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = true;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Empty arrays - All data is stored in and retrieved directly from Supabase
export const DEMO_USERS: UserProfile[] = [];
export const DEMO_BUSINESSES: Business[] = [];
export const DEMO_APPLICATIONS: Application[] = [];
export const DEMO_INSPECTION_ITEMS: InspectionItem[] = [];
export const DEMO_LICENSES: License[] = [];
export const DEMO_AUDIT_LOGS: AuditLog[] = [];
