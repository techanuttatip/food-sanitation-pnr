-- ==============================================================================
-- DATABASE SCHEMA: Food Storage Sanitation Management System (ระบบสถานที่สะสมอาหาร อบต.)
-- Migration 01: Initial Schema & Tables
-- ==============================================================================

-- Enable UUID extension and pgcrypto
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. ENUMS & DOMAINS
-- ==============================================================================

-- User Role Types
CREATE TYPE user_role_enum AS ENUM (
    'SUPER_ADMIN',
    'ADMIN',
    'REGISTRATION_OFFICER',
    'INSPECTION_OFFICER',
    'APPROVER',
    'EXECUTIVE'
);

-- Business Establishment Status
CREATE TYPE business_status_enum AS ENUM (
    'SURVEYED',           -- สำรวจพบ
    'UNREGISTERED',       -- ยังไม่ลงทะเบียน
    'REGISTERED',         -- ลงทะเบียนแล้ว
    'APPLICATION_PENDING',-- มีคำขอ
    'LICENSED',           -- ได้รับใบอนุญาต
    'EXPIRING_SOON',      -- ใกล้หมดอายุ (ภายใน 30 วัน)
    'EXPIRED',            -- หมดอายุ
    'REVOKED',            -- ยกเลิก/เพิกถอน
    'SUSPENDED'           -- พักใช้ชั่วคราว
);

-- Application Type
CREATE TYPE application_type_enum AS ENUM (
    'NEW_LICENSE',        -- ขอรับใบอนุญาตใหม่
    'RENEWAL',            -- ขอต่ออายุใบอนุญาต
    'TRANSFER',           -- ขอโอนใบอนุญาต
    'MODIFICATION',       -- ขอแก้ไขเปลี่ยนแปลงสถานที่/ประเภท
    'CANCEL'              -- ขอยกเลิกใบอนุญาต
);

-- Application Workflow Status
CREATE TYPE application_status_enum AS ENUM (
    'DRAFT',                      -- แบบร่าง
    'SUBMITTED',                  -- ยื่นคำขอแล้ว
    'DOCUMENT_REVIEW',            -- รอตรวจเอกสาร
    'DOCUMENT_INCOMPLETE',        -- เอกสารไม่ครบ/ต้องแก้ไข
    'DOCUMENT_APPROVED',          -- เอกสารครบถ้วน
    'APPOINTMENT_SCHEDULED',      -- รอนัดตรวจ/นัดตรวจแล้ว
    'INSPECTION_IN_PROGRESS',     -- อยู่ระหว่างตรวจสถานที่
    'INSPECTION_PASSED',          -- ตรวจสถานที่ผ่าน
    'INSPECTION_FAILED',          -- ตรวจสถานที่ต้องแก้ไข
    'PAYMENT_PENDING',            -- รอชำระเงินค่าธรรมเนียม
    'PAYMENT_VERIFIED',           -- ตรวจสอบการชำระเงินแล้ว
    'APPROVAL_PENDING',           -- รออนุมัติใบอนุญาต
    'LICENSE_ISSUED',             -- ออกใบอนุญาตเรียบร้อย
    'REJECTED',                   -- ปฏิเสธคำขอ
    'CANCELLED'                   -- ยกเลิกคำขอ
);

-- Document Review Status
CREATE TYPE document_status_enum AS ENUM (
    'MISSING',          -- ยังไม่ส่ง
    'UPLOADED',         -- อัปโหลดแล้ว
    'UNDER_REVIEW',     -- กำลังตรวจ
    'APPROVED',         -- ผ่านการตรวจสอบ
    'REJECTED',         -- ไม่ผ่าน/เอกสารไม่ถูกต้อง
    'EXPIRED'           -- เอกสารหมดอายุ
);

-- Appointment Status
CREATE TYPE appointment_status_enum AS ENUM (
    'SCHEDULED',              -- นัดหมายแล้ว
    'CONFIRMED',              -- ผู้ประกอบการยืนยันแล้ว
    'RESCHEDULE_REQUESTED',    -- ผู้ประกอบการขอเลื่อนนัด
    'RESCHEDULED',            -- เลื่อนนัดหมายใหม่แล้ว
    'COMPLETED',              -- ลงพื้นที่ตรวจเสร็จสิ้น
    'CANCELLED'               -- ยกเลิกนัด
);

-- Inspection Result
CREATE TYPE inspection_result_enum AS ENUM (
    'PASSED',                 -- ผ่านเกณฑ์มาตรฐาน
    'CONDITIONALLY_PASSED',   -- ผ่านแบบมีเงื่อนไข (ต้องแก้ไขข้อบกพร่องเล็กน้อย)
    'FAILED'                  -- ไม่ผ่านเกณฑ์มาตรฐาน
);

-- Payment Status
CREATE TYPE payment_status_enum AS ENUM (
    'PENDING',          -- รอชำระ
    'PAID',             -- ชำระแล้ว / รอตรวจสอบ
    'VERIFIED',         -- ยืนยันการชำระถูกต้อง
    'OVERDUE',          -- เกินกำหนด
    'CANCELLED',        -- ยกเลิก
    'REFUNDED'          -- คืนเงิน
);

-- Notification Channels & Status
CREATE TYPE notification_channel_enum AS ENUM (
    'LINE',
    'SMS',
    'IN_APP',
    'EMAIL'
);

CREATE TYPE notification_status_enum AS ENUM (
    'PENDING',
    'SENT',
    'FAILED',
    'READ'
);

-- Risk Level
CREATE TYPE risk_level_enum AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);

-- ==============================================================================
-- 2. CORE MASTER TABLES
-- ==============================================================================

-- Organizations (อปท. / อบต. / เทศบาล)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,             -- เช่น OBT-001, OBT-KANGSANAM
    name VARCHAR(255) NOT NULL,                    -- เช่น องค์การบริหารส่วนตำบลดอนแก้ว
    province VARCHAR(100) NOT NULL,                -- จังหวัด
    amphoe VARCHAR(100) NOT NULL,                  -- อำเภอ
    tambon VARCHAR(100) NOT NULL,                  -- ตำบล
    address TEXT,                                  -- ที่ตั้งสำนักงาน
    phone VARCHAR(50),                             -- เบอร์โทรศัพท์สำนักงาน
    email VARCHAR(100),
    logo_url TEXT,
    authorized_signer_name VARCHAR(255),           -- นายก อบต. / ปลัด อบต.
    authorized_signer_position VARCHAR(255),       -- นายกองค์การบริหารส่วนตำบล
    signature_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- User Profiles (Linked with Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY,                          -- References auth.users.id
    organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(50),
    position VARCHAR(100),                         -- เช่น นักวิชาการสาธารณสุขชำนาญการ
    department VARCHAR(100) DEFAULT 'กองสาธารณสุขและสิ่งแวดล้อม',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Roles Master Table
CREATE TABLE roles (
    id VARCHAR(50) PRIMARY KEY,                    -- e.g. SUPER_ADMIN, ADMIN, REGISTRATION_OFFICER...
    name_th VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- User Roles Junction
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    role_id VARCHAR(50) REFERENCES roles(id) ON DELETE CASCADE NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    PRIMARY KEY (user_id, role_id)
);

-- ==============================================================================
-- 3. BUSINESSES & ESTABLISHMENTS REGISTRY
-- ==============================================================================

-- Business Owners (ผู้ประกอบการ / ผู้ขออนุญาต)
CREATE TABLE business_owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT NOT NULL,
    national_id VARCHAR(13) NOT NULL,              -- เลขประจำตัวประชาชน 13 หลัก หรือ นิติบุคคล
    title_th VARCHAR(20) DEFAULT 'นาย',            -- นาย/นาง/นางสาว/บริษัท
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    house_number VARCHAR(50),
    moo VARCHAR(10),
    village_name VARCHAR(100),
    subdistrict VARCHAR(100) NOT NULL,             -- ตำบล
    district VARCHAR(100) NOT NULL,                -- อำเภอ
    province VARCHAR(100) NOT NULL,                -- จังหวัด
    postal_code VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_national_id_length CHECK (length(national_id) >= 10)
);

-- Business Establishments (สถานที่สะสมอาหาร)
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT NOT NULL,
    business_code VARCHAR(50) UNIQUE NOT NULL,      -- รหัสสถานประกอบการ เช่น EST-2569-0001
    name VARCHAR(255) NOT NULL,                     -- ชื่อสถานที่สะสมอาหาร/ชื่อร้าน
    owner_id UUID REFERENCES business_owners(id) ON DELETE RESTRICT NOT NULL,
    business_type VARCHAR(100) NOT NULL,            -- เช่น ร้านอาหาร, คลังสินค้าอาหารแห้ง, โรงเก็บอาหารแช่แข็ง, ตลาดสดสะสมอาหาร
    food_category VARCHAR(100) NOT NULL,            -- ประเภทอาหารที่สะสม (สด/แห้ง/แช่แข็ง/ปรุงสำเร็จ)
    area_sqm NUMERIC(10, 2) NOT NULL DEFAULT 0.00,  -- พื้นที่ประกอบการ (ตารางเมตร)
    capacity_description TEXT,                     -- ปริมาณ/ความจุการสะสมอาหาร
    status business_status_enum DEFAULT 'UNREGISTERED' NOT NULL,
    cover_image_url TEXT,
    survey_date DATE,                              -- วันที่ลงสำรวจครั้งแรก
    surveyor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    risk_level risk_level_enum DEFAULT 'LOW' NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Business Location & GIS Geolocation
CREATE TABLE business_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID UNIQUE REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    address_no VARCHAR(100) NOT NULL,
    building_name VARCHAR(150),
    room_no VARCHAR(50),
    floor VARCHAR(20),
    moo VARCHAR(10) NOT NULL,                      -- หมู่ที่ (สำคัญมากสำหรับ อบต.)
    village_name VARCHAR(150),                     -- ชื่อหมู่บ้าน/ชุมชน
    soi VARCHAR(100),
    road VARCHAR(100),
    subdistrict VARCHAR(100) NOT NULL,             -- ตำบล
    district VARCHAR(100) NOT NULL,                -- อำเภอ
    province VARCHAR(100) NOT NULL,                -- จังหวัด
    postal_code VARCHAR(10),
    latitude NUMERIC(10, 7) NOT NULL,              -- พิกัด ละติจูด
    longitude NUMERIC(10, 7) NOT NULL,             -- พิกัด ลองจิจูด
    gps_accuracy_meters NUMERIC(6, 2),
    landmark TEXT,                                 -- จุดสังเกต
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ==============================================================================
-- 4. APPLICATIONS & WORKFLOW
-- ==============================================================================

-- Applications (คำขอใบอนุญาต)
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT NOT NULL,
    application_no VARCHAR(50) UNIQUE NOT NULL,    -- เลขที่คำขอ เช่น APP-2569-0012
    tracking_code VARCHAR(20) UNIQUE NOT NULL,     -- รหัสติดตามสำหรับผู้ประกอบการ
    business_id UUID REFERENCES businesses(id) ON DELETE RESTRICT NOT NULL,
    application_type application_type_enum DEFAULT 'NEW_LICENSE' NOT NULL,
    status application_status_enum DEFAULT 'SUBMITTED' NOT NULL,
    submitted_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    review_date TIMESTAMPTZ,
    review_notes TEXT,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approval_date TIMESTAMPTZ,
    approval_notes TEXT,
    rejection_reason TEXT,
    fee_amount NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Storage Files & Document Metadata
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,                       -- Supabase Storage bucket path
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    storage_bucket VARCHAR(100) NOT NULL DEFAULT 'documents',
    file_hash VARCHAR(64),                         -- SHA256 checksum
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Application Documents Junction
CREATE TABLE application_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
    document_type VARCHAR(100) NOT NULL,           -- e.g. ID_CARD, HOUSE_REG, LEASE_CONTRACT, FLOOR_PLAN, MEDICAL_CERT
    title_th VARCHAR(255) NOT NULL,                -- สำเนาบัตรประชาชน, แผนผังสถานที่สะสมอาหาร ฯลฯ
    is_required BOOLEAN DEFAULT TRUE NOT NULL,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    status document_status_enum DEFAULT 'MISSING' NOT NULL,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    ocr_extracted_data JSONB,                     -- AI OCR result data
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ==============================================================================
-- 5. APPOINTMENTS & INSPECTIONS
-- ==============================================================================

-- Appointments (การนัดหมายลงพื้นที่ตรวจ)
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT NOT NULL,
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
    business_id UUID REFERENCES businesses(id) ON DELETE RESTRICT NOT NULL,
    inspector_id UUID REFERENCES users(id) ON DELETE RESTRICT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time_slot VARCHAR(50) NOT NULL,    -- เช่น 09:30 - 11:00 น.
    status appointment_status_enum DEFAULT 'SCHEDULED' NOT NULL,
    reschedule_count INT DEFAULT 0 NOT NULL,
    reschedule_reason TEXT,
    reschedule_requested_date DATE,
    reschedule_requested_time VARCHAR(50),
    officer_notes TEXT,
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Master Inspection Checklist Items (เกณฑ์ตรวจมาตรฐานสุขาภิบาล)
CREATE TABLE inspection_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT NOT NULL,
    category_name VARCHAR(150) NOT NULL,           -- หมวดที่ 1: สถานที่และสุขาภิบาลทั่วไป, หมวดที่ 2: การเก็บรักษาอาหาร ฯลฯ
    item_code VARCHAR(20) NOT NULL,                -- เช่น SAN-01, SAN-02
    title_th VARCHAR(255) NOT NULL,                -- บริเวณสถานที่สะสมอาหารสะอาด เป็นระเบียบ ไม่ชำรุด
    description_th TEXT,
    is_critical BOOLEAN DEFAULT FALSE NOT NULL,    -- ข้อกำหนดวิกฤติ (ถ้าตกข้อนี้ = ไม่ผ่านทันที)
    max_score INT DEFAULT 5 NOT NULL,
    display_order INT DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Inspections (บันทึกผลการตรวจสถานที่)
CREATE TABLE inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT NOT NULL,
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
    business_id UUID REFERENCES businesses(id) ON DELETE RESTRICT NOT NULL,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    inspector_user_id UUID REFERENCES users(id) ON DELETE RESTRICT NOT NULL,
    inspection_date DATE NOT NULL,
    inspection_time TIME NOT NULL,
    inspection_sequence INT DEFAULT 1 NOT NULL,    -- ตรวจครั้งที่ 1, 2 (กรณีตรวจซ้ำ)
    total_score NUMERIC(5, 2) DEFAULT 0.00 NOT NULL,
    max_possible_score NUMERIC(5, 2) DEFAULT 100.00 NOT NULL,
    result inspection_result_enum NOT NULL,
    summary_remarks TEXT,
    gps_latitude NUMERIC(10, 7),
    gps_longitude NUMERIC(10, 7),
    business_owner_representative VARCHAR(150),    -- ผู้ร่วมตรวจ/ผู้รับทราบผลตรวจ
    correction_deadline DATE,                      -- วันที่กำหนดให้แก้ไข (กรณีไม่ผ่าน/มีเงื่อนไข)
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Inspection Findings (ข้อบกพร่องที่ตรวจพบ)
CREATE TABLE inspection_findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE NOT NULL,
    inspection_item_id UUID REFERENCES inspection_items(id) ON DELETE RESTRICT NOT NULL,
    is_compliant BOOLEAN NOT NULL,                 -- ผ่าน / ไม่ผ่านข้อนี้
    score_obtained NUMERIC(4, 2) NOT NULL DEFAULT 0.00,
    defect_details TEXT,                           -- รายละเอียดข้อบกพร่อง
    corrective_action_required TEXT,               -- แนวทางแก้ไขที่เจ้าหน้าที่แนะนำ
    is_resolved BOOLEAN DEFAULT FALSE NOT NULL,
    resolved_at TIMESTAMPTZ,
    resolved_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Inspection Photos (ภาพถ่ายสถานที่ตรวจสุขาภิบาล)
CREATE TABLE inspection_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE NOT NULL,
    finding_id UUID REFERENCES inspection_findings(id) ON DELETE SET NULL,
    photo_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    caption VARCHAR(255),
    photo_type VARCHAR(50) DEFAULT 'INSPECTION_DEFECT', -- ENTRANCE, STORAGE_ROOM, DEFECT, SANITATION
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    captured_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ==============================================================================
-- 6. LICENSES & PUBLIC VERIFICATION
-- ==============================================================================

-- Licenses (ใบอนุญาตจัดตั้งสถานที่สะสมอาหาร)
CREATE TABLE licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT NOT NULL,
    application_id UUID UNIQUE REFERENCES applications(id) ON DELETE RESTRICT NOT NULL,
    business_id UUID REFERENCES businesses(id) ON DELETE RESTRICT NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,   -- เลขที่ใบอนุญาต เช่น สส. 01/2569
    book_number VARCHAR(50),                       -- เล่มที่
    year_be INT NOT NULL,                          -- ปี พ.ศ. เช่น 2569
    issued_date DATE NOT NULL,                     -- วันที่ออกใบอนุญาต
    expiry_date DATE NOT NULL,                     -- วันหมดอายุ (ปกติ 1 ปีนับจากวันออก)
    approved_by_user_id UUID REFERENCES users(id) ON DELETE RESTRICT NOT NULL,
    approver_name VARCHAR(255) NOT NULL,
    approver_position VARCHAR(255) NOT NULL,
    pdf_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    pdf_file_path TEXT,
    verification_token UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL, -- QR Code Token for Public URL
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    revoked_at TIMESTAMPTZ,
    revocation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ==============================================================================
-- 7. FEES & PAYMENTS
-- ==============================================================================

-- Fees (ค่าธรรมเนียมตามข้อบัญญัติ อบต.)
CREATE TABLE fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT NOT NULL,
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
    business_id UUID REFERENCES businesses(id) ON DELETE RESTRICT NOT NULL,
    fee_type VARCHAR(100) NOT NULL DEFAULT 'LICENSE_FEE', -- ค่าธรรมเนียมใบอนุญาต, ค่าปรับ, ค่าตรวจ
    amount NUMERIC(10, 2) NOT NULL,
    calculated_area_sqm NUMERIC(10, 2),
    due_date DATE NOT NULL,
    status payment_status_enum DEFAULT 'PENDING' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Payments (การชำระเงินและหลักฐานสลิป)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fee_id UUID REFERENCES fees(id) ON DELETE RESTRICT NOT NULL,
    application_id UUID REFERENCES applications(id) ON DELETE RESTRICT NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'PROMPTPAY_QR' NOT NULL, -- PROMPTPAY_QR, CASH, BANK_TRANSFER
    receipt_number VARCHAR(100) UNIQUE,            -- เลขที่ใบเสร็จรับเงิน อบต. เช่น REC-2569/0045
    amount_paid NUMERIC(10, 2) NOT NULL,
    paid_at TIMESTAMPTZ,
    proof_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    proof_image_url TEXT,
    status payment_status_enum DEFAULT 'PENDING' NOT NULL,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    verification_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ==============================================================================
-- 8. LINE OA & NOTIFICATION ENGINE
-- ==============================================================================

-- LINE Accounts (ผูก LINE User ID กับ สถานประกอบการ)
CREATE TABLE line_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT NOT NULL,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    line_user_id VARCHAR(100) NOT NULL,            -- LINE UID
    display_name VARCHAR(150),
    picture_url TEXT,
    linked_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    UNIQUE (business_id, line_user_id)
);

-- Notifications (การแจ้งเตือนส่วนกลาง)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT NOT NULL,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,              -- APPLICATION_CREATED, APPOINTMENT_CREATED, LICENSE_ISSUED etc.
    title VARCHAR(255) NOT NULL,
    message_text TEXT NOT NULL,
    payload JSONB,                                 -- Flex Message or custom metadata
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Notification Logs (ประวัติการส่งข้อความ)
CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    channel notification_channel_enum NOT NULL,
    recipient_identifier VARCHAR(150) NOT NULL,    -- LINE User ID หรือ เบอร์โทรศัพท์
    event_type VARCHAR(100) NOT NULL,
    message_body TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status notification_status_enum DEFAULT 'PENDING' NOT NULL,
    provider_response JSONB,
    error_message TEXT
);

-- ==============================================================================
-- 9. AUDIT LOGGING & AI ASSISTANT
-- ==============================================================================

-- Audit Logs (บันทึกร่องรอยการเปลี่ยนแปลง)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_email VARCHAR(255),
    actor_name VARCHAR(255),
    action VARCHAR(100) NOT NULL,                  -- INSERT, UPDATE, DELETE, STATUS_CHANGE, LOGIN, EXPORT
    entity_name VARCHAR(100) NOT NULL,             -- businesses, applications, licenses, etc.
    entity_id VARCHAR(100) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- AI Analyses (บันทึกผลการวิเคราะห์เอกสารและผลตรวจจาก AI)
CREATE TABLE ai_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT NOT NULL,
    entity_type VARCHAR(50) NOT NULL,              -- DOCUMENT, INSPECTION, BUSINESS_RISK
    entity_id UUID NOT NULL,
    model_version VARCHAR(50) DEFAULT 'gpt-4o',
    analysis_type VARCHAR(100) NOT NULL,           -- OCR_EXTRACTION, SANITARY_DEFECT_SUMMARY, RISK_ASSESSMENT
    raw_response JSONB NOT NULL,
    extracted_summary TEXT,
    confidence_score NUMERIC(5, 4),
    is_reviewed_by_officer BOOLEAN DEFAULT FALSE NOT NULL,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    officer_corrected_data JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Risk Scores (คะแนนความเสี่ยงของสถานประกอบการ)
CREATE TABLE risk_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID UNIQUE REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    score NUMERIC(5, 2) NOT NULL,                  -- 0 - 100
    level risk_level_enum NOT NULL,
    factors JSONB NOT NULL,                        -- เหตุผลและปัจจัยความเสี่ยง
    last_evaluated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- System Settings (การตั้งค่า อบต.)
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID UNIQUE REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    fee_rate_per_sqm NUMERIC(8, 2) DEFAULT 10.00 NOT NULL,
    min_fee_amount NUMERIC(8, 2) DEFAULT 500.00 NOT NULL,
    max_fee_amount NUMERIC(8, 2) DEFAULT 10000.00 NOT NULL,
    license_validity_years INT DEFAULT 1 NOT NULL,
    days_before_expiry_notify INT DEFAULT 30 NOT NULL,
    auto_sms_backup_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    line_oa_channel_id VARCHAR(100),
    line_oa_channel_secret VARCHAR(100),
    line_oa_access_token TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ==============================================================================
-- 10. INDEXES FOR PERFORMANCE
-- ==============================================================================

CREATE INDEX idx_businesses_org_status ON businesses(organization_id, status);
CREATE INDEX idx_businesses_risk ON businesses(risk_level);
CREATE INDEX idx_business_locations_moo ON business_locations(moo);
CREATE INDEX idx_business_locations_coords ON business_locations(latitude, longitude);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_tracking ON applications(tracking_code);
CREATE INDEX idx_licenses_number ON licenses(license_number);
CREATE INDEX idx_licenses_expiry ON licenses(expiry_date, is_active);
CREATE INDEX idx_licenses_token ON licenses(verification_token);
CREATE INDEX idx_appointments_date_status ON appointments(appointment_date, status);
CREATE INDEX idx_fees_status ON fees(status);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_name, entity_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
