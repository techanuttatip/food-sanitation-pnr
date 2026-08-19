export * from './database';

import {
  UserRole,
  BusinessStatus,
  ApplicationStatus,
  DocumentStatus,
  AppointmentStatus,
  InspectionResult,
  PaymentStatus,
  RiskLevel
} from './database';

// Role configurations with Thai labels and allowed features
export interface RoleMeta {
  id: UserRole;
  label: string;
  badgeColor: string;
  description: string;
  accessibleRoutes: string[];
}

export const ROLE_CONFIGS: Record<UserRole, RoleMeta> = {
  ADMIN: {
    id: 'ADMIN',
    label: 'ผู้ดูแลระบบ (Admin)',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    description: 'ควบคุมระบบ จัดการเจ้าหน้าที่ และตั้งค่าฐานข้อมูล',
    accessibleRoutes: ['*'],
  },
  OFFICER: {
    id: 'OFFICER',
    label: 'เจ้าหน้าที่สาธารณสุข (Officer)',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'บันทึกสำรวจ ตรวจเอกสาร ตรวจสุขาภิบาลภาคสนาม และพิมพ์ใบอนุญาต',
    accessibleRoutes: ['*'],
  },
  SUPER_ADMIN: {
    id: 'SUPER_ADMIN',
    label: 'ผู้ดูแลระบบ (Admin)',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    description: 'ควบคุมระบบ จัดการเจ้าหน้าที่ และตั้งค่าฐานข้อมูล',
    accessibleRoutes: ['*'],
  },
  REGISTRATION_OFFICER: {
    id: 'REGISTRATION_OFFICER',
    label: 'เจ้าหน้าที่สาธารณสุข',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'ปฏิบัติงานสารสนเทศสาธารณสุข',
    accessibleRoutes: ['*'],
  },
  INSPECTION_OFFICER: {
    id: 'INSPECTION_OFFICER',
    label: 'เจ้าหน้าที่สาธารณสุข',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'ปฏิบัติงานสารสนเทศสาธารณสุข',
    accessibleRoutes: ['*'],
  },
  APPROVER: {
    id: 'APPROVER',
    label: 'เจ้าหน้าที่สาธารณสุข',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'ปฏิบัติงานสารสนเทศสาธารณสุข',
    accessibleRoutes: ['*'],
  },
  EXECUTIVE: {
    id: 'EXECUTIVE',
    label: 'เจ้าหน้าที่สาธารณสุข',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'ปฏิบัติงานสารสนเทศสาธารณสุข',
    accessibleRoutes: ['*'],
  },
};

// Thai labels and colors for Business Status
export const BUSINESS_STATUS_MAP: Record<BusinessStatus, { label: string; color: string; dotColor: string }> = {
  SURVEYED: { label: 'สำรวจพบ', color: 'bg-slate-100 text-slate-700 border-slate-300', dotColor: 'bg-slate-400' },
  UNREGISTERED: { label: 'ยังไม่ลงทะเบียน', color: 'bg-gray-100 text-gray-800 border-gray-300', dotColor: 'bg-gray-400' },
  REGISTERED: { label: 'ลงทะเบียนแล้ว', color: 'bg-blue-100 text-blue-800 border-blue-300', dotColor: 'bg-blue-500' },
  APPLICATION_PENDING: { label: 'มีคำขอรอดำเนินการ', color: 'bg-amber-100 text-amber-800 border-amber-300', dotColor: 'bg-amber-500' },
  LICENSED: { label: 'ได้รับใบอนุญาตปกติ', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', dotColor: 'bg-emerald-500' },
  EXPIRING_SOON: { label: 'ใบอนุญาตใกล้หมดอายุ', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', dotColor: 'bg-yellow-500' },
  EXPIRED: { label: 'ใบอนุญาตหมดอายุ', color: 'bg-rose-100 text-rose-800 border-rose-300', dotColor: 'bg-rose-500' },
  REVOKED: { label: 'เพิกถอนใบอนุญาต', color: 'bg-red-100 text-red-900 border-red-300', dotColor: 'bg-red-600' },
  SUSPENDED: { label: 'พักใช้ชั่วคราว', color: 'bg-orange-100 text-orange-800 border-orange-300', dotColor: 'bg-orange-500' },
};

// Thai labels for Application Workflow Status (8-step process)
export const APPLICATION_STATUS_MAP: Record<ApplicationStatus, { label: string; step: number; color: string }> = {
  DRAFT: { label: 'แบบร่าง', step: 1, color: 'bg-slate-100 text-slate-700' },
  SUBMITTED: { label: 'ยื่นคำขอแล้ว', step: 1, color: 'bg-sky-100 text-sky-800' },
  DOCUMENT_REVIEW: { label: 'รอตรวจเอกสาร', step: 2, color: 'bg-blue-100 text-blue-800' },
  DOCUMENT_INCOMPLETE: { label: 'เอกสารไม่ครบ (แจ้งแก้ไข)', step: 2, color: 'bg-rose-100 text-rose-800' },
  DOCUMENT_APPROVED: { label: 'เอกสารครบถ้วน', step: 3, color: 'bg-teal-100 text-teal-800' },
  APPOINTMENT_SCHEDULED: { label: 'รอนัดตรวจ / นัดตรวจแล้ว', step: 4, color: 'bg-amber-100 text-amber-800' },
  INSPECTION_IN_PROGRESS: { label: 'รอตรวจสถานที่', step: 4, color: 'bg-amber-100 text-amber-800' },
  INSPECTION_PASSED: { label: 'ตรวจสถานที่ผ่าน', step: 5, color: 'bg-emerald-100 text-emerald-800' },
  INSPECTION_FAILED: { label: 'ตรวจสถานที่ต้องแก้ไข', step: 5, color: 'bg-orange-100 text-orange-800' },
  PAYMENT_PENDING: { label: 'รอชำระค่าธรรมเนียม', step: 6, color: 'bg-indigo-100 text-indigo-800' },
  PAYMENT_VERIFIED: { label: 'ชำระค่าธรรมเนียมแล้ว', step: 6, color: 'bg-teal-100 text-teal-800' },
  APPROVAL_PENDING: { label: 'รออนุมัติใบอนุญาต', step: 7, color: 'bg-purple-100 text-purple-800' },
  LICENSE_ISSUED: { label: 'ออกใบอนุญาตแล้ว', step: 8, color: 'bg-emerald-100 text-emerald-800' },
  REJECTED: { label: 'ปฏิเสธคำขอ', step: 0, color: 'bg-red-100 text-red-800' },
  CANCELLED: { label: 'ยกเลิกคำขอ', step: 0, color: 'bg-slate-100 text-slate-600' },
};

export const DOCUMENT_STATUS_MAP: Record<DocumentStatus, { label: string; color: string }> = {
  MISSING: { label: 'ยังไม่ส่ง', color: 'bg-slate-100 text-slate-600' },
  UPLOADED: { label: 'อัปโหลดแล้ว', color: 'bg-blue-100 text-blue-700' },
  UNDER_REVIEW: { label: 'กำลังตรวจสอบ', color: 'bg-amber-100 text-amber-700' },
  APPROVED: { label: 'ผ่านการตรวจสอบ', color: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { label: 'ไม่ถูกต้อง / ต้องส่งใหม่', color: 'bg-rose-100 text-rose-700' },
  EXPIRED: { label: 'เอกสารหมดอายุ', color: 'bg-gray-100 text-gray-700' },
};

export const INSPECTION_RESULT_MAP: Record<InspectionResult, { label: string; color: string }> = {
  PASSED: { label: 'ผ่านเกณฑ์มาตรฐาน', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  CONDITIONALLY_PASSED: { label: 'ผ่านแบบมีเงื่อนไข (ต้องแก้ไข)', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  FAILED: { label: 'ไม่ผ่านเกณฑ์', color: 'bg-rose-100 text-rose-800 border-rose-300' },
};

export const RISK_LEVEL_MAP: Record<RiskLevel, { label: string; color: string; badge: string }> = {
  LOW: { label: 'ความเสี่ยงต่ำ', color: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  MEDIUM: { label: 'ความเสี่ยงปานกลาง', color: 'text-amber-600', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  HIGH: { label: 'ความเสี่ยงสูง', color: 'text-rose-600', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  CRITICAL: { label: 'วิกฤติต้องตรวจด่วน', color: 'text-red-700', badge: 'bg-red-100 text-red-800 border-red-300 animate-pulse' },
};
