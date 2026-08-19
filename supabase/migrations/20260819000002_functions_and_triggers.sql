-- ==============================================================================
-- DATABASE SCHEMA: Food Storage Sanitation Management System (ระบบสถานที่สะสมอาหาร อบต.)
-- Migration 02: Functions & Triggers
-- ==============================================================================

-- ==============================================================================
-- 1. Auto-update updated_at timestamp function
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_business_owners_updated_at BEFORE UPDATE ON business_owners FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_businesses_updated_at BEFORE UPDATE ON businesses FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_business_locations_updated_at BEFORE UPDATE ON business_locations FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_application_documents_updated_at BEFORE UPDATE ON application_documents FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_inspection_items_updated_at BEFORE UPDATE ON inspection_items FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_inspections_updated_at BEFORE UPDATE ON inspections FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_licenses_updated_at BEFORE UPDATE ON licenses FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_fees_updated_at BEFORE UPDATE ON fees FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ==============================================================================
-- 2. Audit Trail Logging Trigger Function
-- ==============================================================================
CREATE OR REPLACE FUNCTION log_audit_trail_func()
RETURNS TRIGGER AS $$
DECLARE
    v_actor_id UUID;
    v_actor_email VARCHAR(255);
    v_actor_name VARCHAR(255);
    v_org_id UUID;
    v_entity_id VARCHAR(100);
BEGIN
    -- Extract current auth user if available
    v_actor_id := auth.uid();
    
    IF v_actor_id IS NOT NULL THEN
        SELECT email, (first_name || ' ' || last_name), organization_id 
        INTO v_actor_email, v_actor_name, v_org_id
        FROM users WHERE id = v_actor_id;
    END IF;

    IF TG_OP = 'DELETE' THEN
        v_entity_id := OLD.id::TEXT;
        IF v_org_id IS NULL AND OLD ? 'organization_id' THEN
            v_org_id := OLD.organization_id;
        END IF;
        
        INSERT INTO audit_logs (
            organization_id, actor_id, actor_email, actor_name,
            action, entity_name, entity_id, old_values, new_values
        ) VALUES (
            v_org_id, v_actor_id, v_actor_email, v_actor_name,
            TG_OP, TG_TABLE_NAME, v_entity_id, to_jsonb(OLD), NULL
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        v_entity_id := NEW.id::TEXT;
        IF v_org_id IS NULL AND NEW ? 'organization_id' THEN
            v_org_id := NEW.organization_id;
        END IF;

        INSERT INTO audit_logs (
            organization_id, actor_id, actor_email, actor_name,
            action, entity_name, entity_id, old_values, new_values
        ) VALUES (
            v_org_id, v_actor_id, v_actor_email, v_actor_name,
            TG_OP, TG_TABLE_NAME, v_entity_id, to_jsonb(OLD), to_jsonb(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        v_entity_id := NEW.id::TEXT;
        IF v_org_id IS NULL AND NEW ? 'organization_id' THEN
            v_org_id := NEW.organization_id;
        END IF;

        INSERT INTO audit_logs (
            organization_id, actor_id, actor_email, actor_name,
            action, entity_name, entity_id, old_values, new_values
        ) VALUES (
            v_org_id, v_actor_id, v_actor_email, v_actor_name,
            TG_OP, TG_TABLE_NAME, v_entity_id, NULL, to_jsonb(NEW)
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach audit logging triggers to core stateful tables
CREATE TRIGGER trg_audit_businesses AFTER INSERT OR UPDATE OR DELETE ON businesses FOR EACH ROW EXECUTE FUNCTION log_audit_trail_func();
CREATE TRIGGER trg_audit_applications AFTER INSERT OR UPDATE OR DELETE ON applications FOR EACH ROW EXECUTE FUNCTION log_audit_trail_func();
CREATE TRIGGER trg_audit_inspections AFTER INSERT OR UPDATE OR DELETE ON inspections FOR EACH ROW EXECUTE FUNCTION log_audit_trail_func();
CREATE TRIGGER trg_audit_licenses AFTER INSERT OR UPDATE OR DELETE ON licenses FOR EACH ROW EXECUTE FUNCTION log_audit_trail_func();
CREATE TRIGGER trg_audit_payments AFTER INSERT OR UPDATE OR DELETE ON payments FOR EACH ROW EXECUTE FUNCTION log_audit_trail_func();

-- ==============================================================================
-- 3. Number Generation Helpers
-- ==============================================================================

-- Generate Application Tracking Code (e.g. TRK-2569-AB12)
CREATE OR REPLACE FUNCTION generate_tracking_code()
RETURNS VARCHAR(20) AS $$
DECLARE
    v_year VARCHAR(4);
    v_rand VARCHAR(4);
    v_result VARCHAR(20);
    v_exists BOOLEAN;
BEGIN
    v_year := (EXTRACT(YEAR FROM CURRENT_DATE) + 543)::TEXT;
    LOOP
        v_rand := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
        v_result := 'TRK-' || v_year || '-' || v_rand;
        
        SELECT EXISTS(SELECT 1 FROM applications WHERE tracking_code = v_result) INTO v_exists;
        IF NOT v_exists THEN
            EXIT;
        END IF;
    END LOOP;
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Generate License Number (e.g. สส. 01/2569)
CREATE OR REPLACE FUNCTION generate_next_license_number(p_org_id UUID)
RETURNS VARCHAR(100) AS $$
DECLARE
    v_year_be INT;
    v_count INT;
    v_license_no VARCHAR(100);
BEGIN
    v_year_be := EXTRACT(YEAR FROM CURRENT_DATE) + 543;
    
    SELECT COUNT(*) + 1 INTO v_count
    FROM licenses
    WHERE organization_id = p_org_id AND year_be = v_year_be;
    
    v_license_no := 'สส. ' || LPAD(v_count::TEXT, 2, '0') || '/' || v_year_be::TEXT;
    RETURN v_license_no;
END;
$$ LANGUAGE plpgsql;
