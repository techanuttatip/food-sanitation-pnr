-- ==============================================================================
-- FIX ROW LEVEL SECURITY (RLS) POLICIES FOR PUBLIC & AUTHENTICATED ACCESS
-- Run this in Supabase SQL Editor to allow reading and writing data
-- ==============================================================================

-- 1. Organizations: Allow SELECT, INSERT, UPDATE for all users
DROP POLICY IF EXISTS org_select_policy ON organizations;
DROP POLICY IF EXISTS org_super_admin_all ON organizations;
CREATE POLICY "Allow public read organizations" ON organizations FOR SELECT USING (true);
CREATE POLICY "Allow public insert organizations" ON organizations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update organizations" ON organizations FOR UPDATE USING (true);

-- 2. Business Owners: Allow SELECT, INSERT, UPDATE, DELETE
DROP POLICY IF EXISTS owners_org_policy ON business_owners;
DROP POLICY IF EXISTS owners_manage_policy ON business_owners;
CREATE POLICY "Allow all select business_owners" ON business_owners FOR SELECT USING (true);
CREATE POLICY "Allow all insert business_owners" ON business_owners FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update business_owners" ON business_owners FOR UPDATE USING (true);
CREATE POLICY "Allow all delete business_owners" ON business_owners FOR DELETE USING (true);

-- 3. Businesses: Allow SELECT, INSERT, UPDATE, DELETE
DROP POLICY IF EXISTS businesses_org_policy ON businesses;
DROP POLICY IF EXISTS businesses_manage_policy ON businesses;
CREATE POLICY "Allow all select businesses" ON businesses FOR SELECT USING (true);
CREATE POLICY "Allow all insert businesses" ON businesses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update businesses" ON businesses FOR UPDATE USING (true);
CREATE POLICY "Allow all delete businesses" ON businesses FOR DELETE USING (true);

-- 4. Business Locations: Allow SELECT, INSERT, UPDATE, DELETE
DROP POLICY IF EXISTS locations_org_policy ON business_locations;
DROP POLICY IF EXISTS locations_manage_policy ON business_locations;
CREATE POLICY "Allow all select business_locations" ON business_locations FOR SELECT USING (true);
CREATE POLICY "Allow all insert business_locations" ON business_locations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update business_locations" ON business_locations FOR UPDATE USING (true);
CREATE POLICY "Allow all delete business_locations" ON business_locations FOR DELETE USING (true);

-- 5. Applications: Allow SELECT, INSERT, UPDATE, DELETE
DROP POLICY IF EXISTS app_org_policy ON applications;
DROP POLICY IF EXISTS app_officer_policy ON applications;
DROP POLICY IF EXISTS app_citizen_select ON applications;
CREATE POLICY "Allow all select applications" ON applications FOR SELECT USING (true);
CREATE POLICY "Allow all insert applications" ON applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update applications" ON applications FOR UPDATE USING (true);
CREATE POLICY "Allow all delete applications" ON applications FOR DELETE USING (true);

-- 6. Application Documents: Allow SELECT, INSERT, UPDATE, DELETE
DROP POLICY IF EXISTS app_docs_org_policy ON application_documents;
DROP POLICY IF EXISTS app_docs_manage_policy ON application_documents;
CREATE POLICY "Allow all select application_documents" ON application_documents FOR SELECT USING (true);
CREATE POLICY "Allow all insert application_documents" ON application_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update application_documents" ON application_documents FOR UPDATE USING (true);
CREATE POLICY "Allow all delete application_documents" ON application_documents FOR DELETE USING (true);

-- 7. Appointments: Allow SELECT, INSERT, UPDATE, DELETE
DROP POLICY IF EXISTS appt_org_policy ON appointments;
DROP POLICY IF EXISTS appt_manage_policy ON appointments;
CREATE POLICY "Allow all select appointments" ON appointments FOR SELECT USING (true);
CREATE POLICY "Allow all insert appointments" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update appointments" ON appointments FOR UPDATE USING (true);
CREATE POLICY "Allow all delete appointments" ON appointments FOR DELETE USING (true);

-- 8. Inspection Items: Allow SELECT
DROP POLICY IF EXISTS insp_items_select ON inspection_items;
CREATE POLICY "Allow all select inspection_items" ON inspection_items FOR SELECT USING (true);

-- 9. Inspections: Allow SELECT, INSERT, UPDATE, DELETE
DROP POLICY IF EXISTS insp_org_policy ON inspections;
DROP POLICY IF EXISTS insp_manage_policy ON inspections;
CREATE POLICY "Allow all select inspections" ON inspections FOR SELECT USING (true);
CREATE POLICY "Allow all insert inspections" ON inspections FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update inspections" ON inspections FOR UPDATE USING (true);
CREATE POLICY "Allow all delete inspections" ON inspections FOR DELETE USING (true);

-- 10. Inspection Findings: Allow SELECT, INSERT, UPDATE, DELETE
DROP POLICY IF EXISTS insp_findings_policy ON inspection_findings;
CREATE POLICY "Allow all select inspection_findings" ON inspection_findings FOR SELECT USING (true);
CREATE POLICY "Allow all insert inspection_findings" ON inspection_findings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update inspection_findings" ON inspection_findings FOR UPDATE USING (true);
CREATE POLICY "Allow all delete inspection_findings" ON inspection_findings FOR DELETE USING (true);

-- 11. Licenses: Allow SELECT, INSERT, UPDATE, DELETE
DROP POLICY IF EXISTS licenses_org_policy ON licenses;
DROP POLICY IF EXISTS licenses_manage_policy ON licenses;
DROP POLICY IF EXISTS licenses_public_token_select ON licenses;
CREATE POLICY "Allow all select licenses" ON licenses FOR SELECT USING (true);
CREATE POLICY "Allow all insert licenses" ON licenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update licenses" ON licenses FOR UPDATE USING (true);
CREATE POLICY "Allow all delete licenses" ON licenses FOR DELETE USING (true);

-- 12. Fees: Allow SELECT, INSERT, UPDATE, DELETE
DROP POLICY IF EXISTS fees_org_policy ON fees;
DROP POLICY IF EXISTS fees_manage_policy ON fees;
CREATE POLICY "Allow all select fees" ON fees FOR SELECT USING (true);
CREATE POLICY "Allow all insert fees" ON fees FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update fees" ON fees FOR UPDATE USING (true);
CREATE POLICY "Allow all delete fees" ON fees FOR DELETE USING (true);

-- 13. Payments: Allow SELECT, INSERT, UPDATE, DELETE
DROP POLICY IF EXISTS payments_org_policy ON payments;
DROP POLICY IF EXISTS payments_manage_policy ON payments;
CREATE POLICY "Allow all select payments" ON payments FOR SELECT USING (true);
CREATE POLICY "Allow all insert payments" ON payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update payments" ON payments FOR UPDATE USING (true);
CREATE POLICY "Allow all delete payments" ON payments FOR DELETE USING (true);

-- 14. LINE Accounts: Allow SELECT, INSERT, UPDATE, DELETE
DROP POLICY IF EXISTS line_accounts_policy ON line_accounts;
CREATE POLICY "Allow all select line_accounts" ON line_accounts FOR SELECT USING (true);
CREATE POLICY "Allow all insert line_accounts" ON line_accounts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update line_accounts" ON line_accounts FOR UPDATE USING (true);
CREATE POLICY "Allow all delete line_accounts" ON line_accounts FOR DELETE USING (true);

-- 15. Notification Logs: Allow SELECT, INSERT, UPDATE, DELETE
DROP POLICY IF EXISTS notif_logs_policy ON notification_logs;
CREATE POLICY "Allow all select notification_logs" ON notification_logs FOR SELECT USING (true);
CREATE POLICY "Allow all insert notification_logs" ON notification_logs FOR INSERT WITH CHECK (true);

-- 16. Audit Logs: Allow SELECT, INSERT
DROP POLICY IF EXISTS audit_logs_policy ON audit_logs;
CREATE POLICY "Allow all select audit_logs" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow all insert audit_logs" ON audit_logs FOR INSERT WITH CHECK (true);

-- 17. Insert Default Organization (อบต.โป่งน้ำร้อน)
INSERT INTO organizations (
    id, code, name, province, amphoe, tambon, address, phone, authorized_signer_name, authorized_signer_position
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'OBT-PONGNAMRON',
    'องค์การบริหารส่วนตำบลโป่งน้ำร้อน',
    'เชียงใหม่',
    'ฝาง',
    'โป่งน้ำร้อน',
    'ที่ทำการ อบต.โป่งน้ำร้อน อำเภอฝาง จังหวัดเชียงใหม่ 50110',
    '053-123456',
    'นายกองค์การบริหารส่วนตำบลโป่งน้ำร้อน',
    'นายกองค์การบริหารส่วนตำบล'
) ON CONFLICT (id) DO NOTHING;
