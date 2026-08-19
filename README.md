# ระบบบริหารจัดการสถานที่สะสมอาหาร (Food Storage Sanitation System)
### สำหรับองค์กรปกครองส่วนท้องถิ่น (อปท. / อบต. / เทศบาล)

ระบบเว็บแอปพลิเคชันสำหรับเจ้าหน้าที่องค์กรปกครองส่วนท้องถิ่น ในการบริหารจัดการ **"สถานที่สะสมอาหารตามพระราชบัญญัติการสาธารณสุข พ.ศ. ๒๕๓๕"** ครอบคลุมตั้งแต่การสำรวจสถานประกอบการ การลงทะเบียน การรับคำขอ การจัดการเอกสาร การนัดหมายและลงพื้นที่ตรวจสุขาภิบาล การคิดค่าธรรมเนียม การพิจารณาอนุมัติ การออกใบอนุญาตดิจิทัลพร้อม QR Code Verification การแจ้งเตือนผู้ประกอบการ และระบบภูมิสารสนเทศ (GIS Map)

---

## 🏗️ สถาปัตยกรรมระบบ (System Architecture)

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons + Recharts + QRCode
- **Backend / Database**: Supabase (PostgreSQL 15+, Supabase Auth, Supabase Storage, Row Level Security)
- **Design System**: Modern Thai Government Dashboard (ไม่มี Dark Mode, รองรับ Mobile/Tablet สำหรับเจ้าหน้าที่ภาคสนาม)
- **Database Principles**: Single Source of Truth, Multi-tenancy by `organization_id`, Comprehensive Audit Trail

---

## 🗄️ โครงสร้างฐานข้อมูล (21 ตารางหลัก)

| หมวดหมู่ | ตาราง (Table Name) | หน้าที่และความรับผิดชอบ |
| :--- | :--- | :--- |
| **หน่วยงานและผู้ใช้งาน** | `organizations` | ฐานข้อมูล อบต./เทศบาล, ข้อมูลผู้มีอำนาจลงนาม |
| | `users` | บัญชีเจ้าหน้าที่ผู้ใช้งาน (ผูกกับ `auth.users`) |
| | `roles` | มาสเตอร์บทบาท 6 Roles |
| | `user_roles` | ตารางเชื่อมโยงสิทธิ์ผู้ใช้งานกับบทบาท (RBAC) |
| **สถานประกอบการ** | `business_owners` | ข้อมูลผู้ประกอบการ/ผู้ขอรับใบอนุญาต พร้อมเลขบัตร ปชช. |
| | `businesses` | ทะเบียนสถานที่สะสมอาหาร รหัสสถานประกอบการ และขนาดพื้นที่ |
| | `business_locations` | ที่ตั้ง หมู่ที่ ชุมชน และพิกัด GIS (ละติจูด, ลองจิจูด) |
| **คำขอและเอกสาร** | `applications` | คำขอรับใบอนุญาต/ต่ออายุ และ Tracking Code |
| | `documents` | Metadata ของไฟล์ใน Supabase Storage Buckets |
| | `application_documents` | รายการเอกสารประกอบคำขอและสถานะการตรวจสอบ |
| **การนัดตรวจและสุขาภิบาล** | `appointments` | ตารางนัดหมายลงพื้นที่ตรวจสุขาภิบาล |
| | `inspection_items` | เกณฑ์แบบตรวจมาตรฐานสุขาภิบาล 10 ข้อ |
| | `inspections` | บันทึกผลการตรวจ คะแนน และผลการประเมิน |
| | `inspection_findings` | รายการข้อบกพร่องที่ตรวจพบและแนวทางแก้ไข |
| | `inspection_photos` | ภาพถ่ายสถานที่ตรวจสุขาภิบาลพร้อม Geo-tagging |
| **ใบอนุญาตและค่าธรรมเนียม** | `licenses` | ข้อมูลใบอนุญาต วันที่ออก วันหมดอายุ และ Verification Token |
| | `fees` | ค่าธรรมเนียมตามข้อบัญญัติ อบต. คำนวณตามพื้นที่ ตร.ม. |
| | `payments` | การชำระเงิน สลิปโอนเงิน และเลขที่ใบเสร็จรับเงิน |
| **การสื่อสารและแจ้งเตือน** | `line_accounts` | บัญชี LINE Official Account ที่ผูกกับสถานประกอบการ |
| | `notifications` | Notification Engine สำหรับส่งแจ้งเตือน |
| | `notification_logs` | ประวัติการส่งข้อความผ่าน LINE / SMS |
| **ธรรมาภิบาลและ AI** | `audit_logs` | บันทึกประวัติการเปลี่ยนแปลงข้อมูล (Audit Trail) |
| | `ai_analyses` | บันทึกผลการวิเคราะห์ OCR และสรุปผลตรวจโดย AI |
| | `risk_scores` | คะแนนระดับความเสี่ยงของร้านค้า (Low / Medium / High) |
| | `system_settings` | การตั้งค่าระบบ อบต. เช่น อัตราค่าธรรมเนียม |

---

## 👥 ระบบสิทธิ์การใช้งาน (6 RBAC Roles)

1. **`SUPER_ADMIN` (ผู้ดูแลระบบสูงสุด)**: สิทธิ์สูงสุดในการจัดการระบบระดับโครงสร้างและผู้ใช้งานทั้งหมด
2. **`ADMIN` (ผู้ดูแลระบบ อบต.)**: จัดการข้อมูลผู้ใช้งาน กำหนด Checklist และตั้งค่าระบบ อบต.
3. **`REGISTRATION_OFFICER` (เจ้าหน้าที่งานทะเบียน/รับคำขอ)**: สำรวจสถานประกอบการ รับคำขอ ตรวจสอบเอกสาร และออกใบรับ
4. **`INSPECTION_OFFICER` (เจ้าหน้าที่ตรวจสุขาภิบาล)**: ลงพื้นที่ตรวจสถานที่ ประเมิน Checklist 10 ข้อ บันทึกรูปและข้อบกพร่อง
5. **`APPROVER` (ผู้อนุมัติ - ปลัด/นายก อบต.)**: พิจารณาอนุมัติคำขอและลงนามอิเล็กทรอนิกส์
6. **`EXECUTIVE` (ผู้บริหาร อบต.)**: ดูรายงาน Executive Dashboard, KPI, ภาพรวม GIS และสถิติคำขอ

---

## 🚀 การติดตั้งและเริ่มพัฒนา (Installation & Setup)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. ตั้งค่า Environment Variables
คัดลอกไฟล์ `.env.example` เป็น `.env`:
```bash
cp .env.example .env
```
กำหนดค่า Supabase URL และ Anon Key:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_DEMO_MODE=false
```

### 3. รัน Database Migrations บน Supabase
รันไฟล์ Migration ตามลำดับในโฟลเดอร์ `supabase/migrations/`:
1. `20260819000001_initial_schema.sql` (สร้าง 21 ตาราง, Enums, Constraints, Indexes)
2. `20260819000002_functions_and_triggers.sql` (สร้าง Triggers, Auto-timestamps, Audit Trail)
3. `20260819000003_storage_and_rls.sql` (สร้าง RLS Policies สำหรับ 6 Roles และ Storage Buckets)
4. `20260819000004_seed_data.sql` (ใส่ข้อมูล Master Checklist สุขาภิบาล 10 ข้อ และข้อมูลตัวอย่าง)

### 4. รัน Development Server
```bash
npm run dev
```

---

## 🛡️ มาตรฐานความปลอดภัย (Security & Compliance)
- ใช้งาน **Row Level Security (RLS)** ทุกตาราง โดยผูกกับ Tenant `organization_id`
- **ไม่มีการ expose Service Role Key** ฝั่ง Frontend
- หน้าตรวจสอบใบอนุญาตสาธารณะ (Public QR Code) แสดงผลผ่าน Token โดย **Mask เลขบัตรประชาชน** เพื่อปกป้องข้อมูลส่วนบุคคล (PDPA)
- มี **Audit Trail** บันทึกการเพิ่ม แก้ไข ลบ และเปลี่ยนสถานะทุกครั้ง
