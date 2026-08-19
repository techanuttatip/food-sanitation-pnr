-- ==============================================================================
-- DATABASE SCHEMA: Food Storage Sanitation Management System (ระบบสถานที่สะสมอาหาร อบต.)
-- Migration 03: Row Level Security (RLS) & Storage Buckets
-- ==============================================================================

-- ==============================================================================
-- 1. Helper Functions for RBAC & Multi-tenancy
-- ==============================================================================

-- Get authenticated user's organization ID
CREATE OR REPLACE FUNCTION get_auth_user_org_id()
RETURNS UUID AS $$
    SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if authenticated user has any of the specified roles
CREATE OR REPLACE FUNCTION auth_user_has_role(VARIADIC allowed_roles user_role_enum[])
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role_id::user_role_enum = ANY(allowed_roles)
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if authenticated user is Super Admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
    SELECT auth_user_has_role('SUPER_ADMIN'::user_role_enum);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ==============================================================================
-- 2. Enable RLS on All Tables
-- ==============================================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 3. RLS Policies
-- ==============================================================================

-- Organizations: Read by authenticated users of that org, Manageable by Super Admin
CREATE POLICY org_select_policy ON organizations
    FOR SELECT TO authenticated
    USING (id = get_auth_user_org_id() OR is_super_admin());

CREATE POLICY org_all_super_admin ON organizations
    FOR ALL TO authenticated
    USING (is_super_admin());

-- Roles Master: Read-only to authenticated users
CREATE POLICY roles_select_policy ON roles
    FOR SELECT TO authenticated
    USING (TRUE);

-- Users: Read within same organization, Manage by Super Admin & Admin
CREATE POLICY users_select_org ON users
    FOR SELECT TO authenticated
    USING (organization_id = get_auth_user_org_id() OR is_super_admin());

CREATE POLICY users_modify_admin ON users
    FOR ALL TO authenticated
    USING (
        (organization_id = get_auth_user_org_id() AND auth_user_has_role('ADMIN'::user_role_enum, 'SUPER_ADMIN'::user_role_enum))
        OR is_super_admin()
    );

-- User Roles
CREATE POLICY user_roles_select ON user_roles
    FOR SELECT TO authenticated
    USING (TRUE);

CREATE POLICY user_roles_admin ON user_roles
    FOR ALL TO authenticated
    USING (auth_user_has_role('ADMIN'::user_role_enum, 'SUPER_ADMIN'::user_role_enum));

-- Businesses & Owners & Locations (Org scoped)
CREATE POLICY businesses_org_all ON businesses
    FOR ALL TO authenticated
    USING (organization_id = get_auth_user_org_id() OR is_super_admin())
    WITH CHECK (organization_id = get_auth_user_org_id() OR is_super_admin());

CREATE POLICY business_owners_org_all ON business_owners
    FOR ALL TO authenticated
    USING (organization_id = get_auth_user_org_id() OR is_super_admin())
    WITH CHECK (organization_id = get_auth_user_org_id() OR is_super_admin());

CREATE POLICY business_locations_org_all ON business_locations
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM businesses b 
            WHERE b.id = business_locations.business_id 
              AND (b.organization_id = get_auth_user_org_id() OR is_super_admin())
        )
    );

-- Applications & Documents (Org scoped)
CREATE POLICY applications_org_all ON applications
    FOR ALL TO authenticated
    USING (organization_id = get_auth_user_org_id() OR is_super_admin())
    WITH CHECK (organization_id = get_auth_user_org_id() OR is_super_admin());

CREATE POLICY documents_org_all ON documents
    FOR ALL TO authenticated
    USING (organization_id = get_auth_user_org_id() OR is_super_admin());

CREATE POLICY app_docs_org_all ON application_documents
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM applications a 
            WHERE a.id = application_documents.application_id 
              AND (a.organization_id = get_auth_user_org_id() OR is_super_admin())
        )
    );

-- Appointments & Inspections (Org scoped)
CREATE POLICY appointments_org_all ON appointments
    FOR ALL TO authenticated
    USING (organization_id = get_auth_user_org_id() OR is_super_admin());

CREATE POLICY inspection_items_org_all ON inspection_items
    FOR ALL TO authenticated
    USING (organization_id = get_auth_user_org_id() OR is_super_admin());

CREATE POLICY inspections_org_all ON inspections
    FOR ALL TO authenticated
    USING (organization_id = get_auth_user_org_id() OR is_super_admin());

CREATE POLICY inspection_findings_all ON inspection_findings
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM inspections i 
            WHERE i.id = inspection_findings.inspection_id 
              AND (i.organization_id = get_auth_user_org_id() OR is_super_admin())
        )
    );

CREATE POLICY inspection_photos_all ON inspection_photos
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM inspections i 
            WHERE i.id = inspection_photos.inspection_id 
              AND (i.organization_id = get_auth_user_org_id() OR is_super_admin())
        )
    );

-- Licenses: Authenticated Org members + PUBLIC ACCESS FOR CITIZEN QR VERIFICATION
CREATE POLICY licenses_org_all ON licenses
    FOR ALL TO authenticated
    USING (organization_id = get_auth_user_org_id() OR is_super_admin());

-- Public verification policy: Anyone (anon) can read license validity using verification_token
CREATE POLICY licenses_public_verification ON licenses
    FOR SELECT TO anon
    USING (is_active = TRUE);

-- Fees & Payments
CREATE POLICY fees_org_all ON fees
    FOR ALL TO authenticated
    USING (organization_id = get_auth_user_org_id() OR is_super_admin());

CREATE POLICY payments_org_all ON payments
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM fees f 
            WHERE f.id = payments.fee_id 
              AND (f.organization_id = get_auth_user_org_id() OR is_super_admin())
        )
    );

-- LINE accounts & Notifications
CREATE POLICY line_accounts_org_all ON line_accounts
    FOR ALL TO authenticated
    USING (organization_id = get_auth_user_org_id() OR is_super_admin());

CREATE POLICY notifications_org_all ON notifications
    FOR ALL TO authenticated
    USING (organization_id = get_auth_user_org_id() OR is_super_admin());

CREATE POLICY notif_logs_org_all ON notification_logs
    FOR ALL TO authenticated
    USING (TRUE);

-- Audit logs (Read-only for Executives, Admins)
CREATE POLICY audit_logs_select ON audit_logs
    FOR SELECT TO authenticated
    USING (
        (organization_id = get_auth_user_org_id() AND auth_user_has_role('ADMIN'::user_role_enum, 'EXECUTIVE'::user_role_enum, 'SUPER_ADMIN'::user_role_enum))
        OR is_super_admin()
    );

CREATE POLICY audit_logs_insert ON audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (TRUE);

-- AI & Risk
CREATE POLICY ai_analyses_org_all ON ai_analyses
    FOR ALL TO authenticated
    USING (organization_id = get_auth_user_org_id() OR is_super_admin());

CREATE POLICY risk_scores_org_all ON risk_scores
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM businesses b 
            WHERE b.id = risk_scores.business_id 
              AND (b.organization_id = get_auth_user_org_id() OR is_super_admin())
        )
    );

-- System settings
CREATE POLICY system_settings_org_all ON system_settings
    FOR ALL TO authenticated
    USING (organization_id = get_auth_user_org_id() OR is_super_admin());

-- ==============================================================================
-- 4. Supabase Storage Buckets Setup
-- ==============================================================================

-- Storage buckets creation
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('documents', 'documents', false),
    ('inspections', 'inspections', false),
    ('payments', 'payments', false),
    ('licenses', 'licenses', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "Authenticated users can read documents in org"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id IN ('documents', 'inspections', 'payments', 'licenses'));

CREATE POLICY "Authenticated officers can upload documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id IN ('documents', 'inspections', 'payments', 'licenses'));

CREATE POLICY "Public can read published license PDFs"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'licenses');
