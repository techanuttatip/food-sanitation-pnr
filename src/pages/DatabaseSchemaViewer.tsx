import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Database, Shield, Lock, Table, Server, Code, FileText, CheckCircle2 } from 'lucide-react';

const TABLES_METADATA = [
  { name: 'organizations', desc: 'ข้อมูลหน่วยงาน อบต. / เทศบาล (Multi-tenancy)' },
  { name: 'users', desc: 'ข้อมูลบัญชีเจ้าหน้าที่ ขยายจาก Supabase auth.users' },
  { name: 'roles', desc: 'Master roles 6 บทบาท (SUPER_ADMIN, ADMIN, REGISTRATION, etc.)' },
  { name: 'user_roles', desc: 'ตารางเชื่อมสิทธิ์ผู้ใช้งานกับบทบาท (RBAC)' },
  { name: 'business_owners', desc: 'ข้อมูลผู้ประกอบการ/ผู้รับใบอนุญาต พร้อมเลขบัตร ปชช.' },
  { name: 'businesses', desc: 'ทะเบียนสถานที่สะสมอาหาร รหัสสถานประกอบการ ประเภท และขนาด' },
  { name: 'business_locations', desc: 'ที่ตั้งสถานที่ หมู่ที่ ชุมชน และพิกัด GIS ละติจูด-ลองจิจูด' },
  { name: 'applications', desc: 'คำขอรับใบอนุญาต / ต่ออายุ / Tracking Code' },
  { name: 'documents', desc: 'Metadata ไฟล์เอกสารใน Supabase Storage Buckets' },
  { name: 'application_documents', desc: 'รายการเอกสารประกอบคำขอ (บัตร ปชช., แผนผัง, รับรองแพทย์)' },
  { name: 'appointments', desc: 'การนัดหมายลงพื้นที่ตรวจสุขาภิบาล เชื่อม LINE OA' },
  { name: 'inspection_items', desc: 'แบบตรวจมาตรฐานสุขาภิบาล 10 ข้อ (Configurable by Admin)' },
  { name: 'inspections', desc: 'บันทึกผลการตรวจ คะแนน และผลการประเมินสุขาภิบาล' },
  { name: 'inspection_findings', desc: 'ข้อบกพร่องที่พบจากการตรวจ และกำหนดเวลาแก้ไข' },
  { name: 'inspection_photos', desc: 'ภาพถ่ายสถานที่ตรวจสุขาภิบาลพร้อม Geo-tagging' },
  { name: 'licenses', desc: 'ข้อมูลใบอนุญาต เลขที่ วันออก วันหมดอายุ และ Verification Token' },
  { name: 'fees', desc: 'ค่าธรรมเนียมตามข้อบัญญัติ อบต. คำนวณตามพื้นที่ ตร.ม.' },
  { name: 'payments', desc: 'การชำระเงิน หลักฐานสลิป และเลขที่ใบเสร็จรับเงิน' },
  { name: 'line_accounts', desc: 'Account Linking ระหว่าง LINE User ID กับสถานประกอบการ' },
  { name: 'notifications', desc: 'Notification Engine ส่วนกลางสำหรับส่ง Event ต่างๆ' },
  { name: 'notification_logs', desc: 'ประวัติการส่งแจ้งเตือนผ่าน LINE / SMS พร้อมสถานะ' },
  { name: 'audit_logs', desc: 'บันทึก Audit Trail ทุก Action สำคัญตามธรรมาภิบาล' },
  { name: 'ai_analyses', desc: 'ประวัติการวิเคราะห์เอกสาร OCR และสรุปผลตรวจโดย AI' },
  { name: 'risk_scores', desc: 'คะแนนระดับความเสี่ยงของร้านค้า (Low / Medium / High / Critical)' },
  { name: 'system_settings', desc: 'การตั้งค่าระบบ อบต. เช่น อัตราค่าธรรมเนียมต่อ ตร.ม.' },
];

export const DatabaseSchemaViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tables' | 'rls' | 'migrations'>('tables');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5 text-gov-700" />
            โครงสร้างฐานข้อมูลและการรักษาความปลอดภัย (Phase 1 — Database & Security ⭐)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            PostgreSQL Database เป็น Single Source of Truth พร้อม RLS, Foreign Keys, Indexes และ Audit Logs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            21 PostgreSQL Tables Ready
          </Badge>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('tables')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'tables'
              ? 'border-gov-700 text-gov-800'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Table className="w-4 h-4" />
          ตารางหลักทั้ง 21 ตาราง (Tables & Schema)
        </button>
        <button
          onClick={() => setActiveTab('rls')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'rls'
              ? 'border-gov-700 text-gov-800'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Shield className="w-4 h-4" />
          ระบบความปลอดภัย (Row Level Security & Storage)
        </button>
        <button
          onClick={() => setActiveTab('migrations')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'migrations'
              ? 'border-gov-700 text-gov-800'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Code className="w-4 h-4" />
          ไฟล์ SQL Migrations ใน supabase/migrations/
        </button>
      </div>

      {/* Tab 1: Tables Overview */}
      {activeTab === 'tables' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TABLES_METADATA.map((tbl, i) => (
            <Card key={tbl.name} className="p-4 hover:border-gov-300 transition-colors">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {tbl.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1">{tbl.desc}</p>
                </div>
                <span className="text-[11px] font-mono text-slate-400">#{i + 1}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tab 2: RLS & Security Policies */}
      {activeTab === 'rls' && (
        <div className="space-y-4">
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-gov-700" />
              หลักการรักษาความปลอดภัย (Security & Multi-Tenancy Architecture)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900">1. Row Level Security (RLS)</h4>
                <p className="text-slate-600 leading-relaxed">
                  เปิดใช้งาน RLS ในทุกตาราง โดยใช้เงื่อนไข{' '}
                  <code className="font-mono text-gov-800">organization_id = get_auth_user_org_id()</code>{' '}
                  เพื่อให้เจ้าหน้าที่ของ อบต. แต่ละแห่งสามารถเห็นและจัดการเฉพาะข้อมูลในเขตความรับผิดชอบของตนเอง
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900">2. การแบ่งสิทธิ์ตาม 6 บทบาท (RBAC)</h4>
                <p className="text-slate-600 leading-relaxed">
                  สิทธิ์แยกตามหน้าที่จริง: นายทะเบียนตรวจเอกสาร, เจ้าหน้าที่ตรวจสุขาภิบาลประเมินเกณฑ์,
                  ผู้บริหารดู Dashboard/GIS และนายก/ปลัดเป็นผู้อนุมัติออกใบอนุญาต
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900">3. Public License Verification Access</h4>
                <p className="text-slate-600 leading-relaxed">
                  เปิดสิทธิ์ให้อ่านเฉพาะข้อมูลความถูกต้องของใบอนุญาตผ่าน{' '}
                  <code className="font-mono text-gov-800">verification_token</code> สำหรับประชาชน
                  โดยปกป้องเลขบัตรประชาชนและข้อมูลส่วนบุคคลตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900">4. Supabase Storage Buckets Security</h4>
                <p className="text-slate-600 leading-relaxed">
                  แยก Bucket เอกสารคำขอ (Private) ภาพถ่ายตรวจสุขาภิบาล (Private) สลิปชำระเงิน (Private)
                  และ PDF ใบอนุญาตที่ออกแล้ว (Public read with token)
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Migration Files */}
      {activeTab === 'migrations' && (
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">
            รายการไฟล์ PostgreSQL Migrations ที่สร้างเสร็จสมบูรณ์
          </h3>
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gov-700" />
                <span className="font-mono font-bold text-slate-900">
                  supabase/migrations/20260819000001_initial_schema.sql
                </span>
              </div>
              <span className="text-slate-500">21 Tables, Types, Enums, Constraints & Indexes</span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gov-700" />
                <span className="font-mono font-bold text-slate-900">
                  supabase/migrations/20260819000002_functions_and_triggers.sql
                </span>
              </div>
              <span className="text-slate-500">Auto Timestamps, Audit Logging Triggers, Number Helpers</span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gov-700" />
                <span className="font-mono font-bold text-slate-900">
                  supabase/migrations/20260819000003_storage_and_rls.sql
                </span>
              </div>
              <span className="text-slate-500">RLS Policies for 6 Roles, Public QR Access, Storage Buckets</span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gov-700" />
                <span className="font-mono font-bold text-slate-900">
                  supabase/migrations/20260819000004_seed_data.sql
                </span>
              </div>
              <span className="text-slate-500">Demo Org, 10 Sanitary Checklist Items under Public Health Act</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
