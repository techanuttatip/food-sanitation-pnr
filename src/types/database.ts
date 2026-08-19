// ==============================================================================
// TypeScript Database Schema Definitions
// ==============================================================================

export type UserRole =
  | 'ADMIN'
  | 'OFFICER'
  | 'SUPER_ADMIN'
  | 'REGISTRATION_OFFICER'
  | 'INSPECTION_OFFICER'
  | 'APPROVER'
  | 'EXECUTIVE';

export type BusinessStatus =
  | 'SURVEYED'
  | 'UNREGISTERED'
  | 'REGISTERED'
  | 'APPLICATION_PENDING'
  | 'LICENSED'
  | 'EXPIRING_SOON'
  | 'EXPIRED'
  | 'REVOKED'
  | 'SUSPENDED';

export type ApplicationType =
  | 'NEW_LICENSE'
  | 'RENEWAL'
  | 'TRANSFER'
  | 'MODIFICATION'
  | 'CANCEL';

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'DOCUMENT_REVIEW'
  | 'DOCUMENT_INCOMPLETE'
  | 'DOCUMENT_APPROVED'
  | 'APPOINTMENT_SCHEDULED'
  | 'INSPECTION_IN_PROGRESS'
  | 'INSPECTION_PASSED'
  | 'INSPECTION_FAILED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_VERIFIED'
  | 'APPROVAL_PENDING'
  | 'LICENSE_ISSUED'
  | 'REJECTED'
  | 'CANCELLED';

export type DocumentStatus =
  | 'MISSING'
  | 'UPLOADED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED';

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'RESCHEDULE_REQUESTED'
  | 'RESCHEDULED'
  | 'COMPLETED'
  | 'CANCELLED';

export type InspectionResult =
  | 'PASSED'
  | 'CONDITIONALLY_PASSED'
  | 'FAILED';

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'VERIFIED'
  | 'OVERDUE'
  | 'CANCELLED'
  | 'REFUNDED';

export type NotificationChannel = 'LINE' | 'SMS' | 'IN_APP' | 'EMAIL';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'READ';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Organization {
  id: string;
  code: string;
  name: string;
  province: string;
  amphoe: string;
  tambon: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  authorized_signer_name?: string;
  authorized_signer_position?: string;
  signature_image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  organization_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  position?: string;
  department?: string;
  avatar_url?: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  roles?: UserRole[];
}

export interface BusinessOwner {
  id: string;
  organization_id: string;
  national_id: string;
  title_th: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  email?: string;
  house_number?: string;
  moo?: string;
  village_name?: string;
  subdistrict: string;
  district: string;
  province: string;
  postal_code?: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessLocation {
  id: string;
  business_id: string;
  address_no: string;
  building_name?: string;
  room_no?: string;
  floor?: string;
  moo: string;
  village_name?: string;
  soi?: string;
  road?: string;
  subdistrict: string;
  district: string;
  province: string;
  postal_code?: string;
  latitude: number;
  longitude: number;
  gps_accuracy_meters?: number;
  landmark?: string;
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: string;
  organization_id: string;
  business_code: string;
  name: string;
  owner_id: string;
  business_type: string;
  food_category: string;
  area_sqm: number;
  capacity_description?: string;
  status: BusinessStatus;
  cover_image_url?: string;
  survey_date?: string;
  surveyor_user_id?: string;
  risk_level: RiskLevel;
  notes?: string;
  created_at: string;
  updated_at: string;
  owner?: BusinessOwner;
  location?: BusinessLocation;
  current_license?: License;
}

export interface Application {
  id: string;
  organization_id: string;
  application_no: string;
  tracking_code: string;
  business_id: string;
  application_type: ApplicationType;
  status: ApplicationStatus;
  submitted_date: string;
  reviewed_by?: string;
  review_date?: string;
  review_notes?: string;
  approved_by?: string;
  approval_date?: string;
  approval_notes?: string;
  rejection_reason?: string;
  fee_amount: number;
  created_at: string;
  updated_at: string;
  business?: Business;
  documents?: ApplicationDocument[];
  appointment?: Appointment;
  inspection?: Inspection;
  license?: License;
  payment?: Payment;
}

export interface DocumentRecord {
  id: string;
  organization_id: string;
  file_name: string;
  file_path: string;
  file_size_bytes: number;
  mime_type: string;
  storage_bucket: string;
  file_hash?: string;
  uploaded_by?: string;
  created_at: string;
}

export interface ApplicationDocument {
  id: string;
  application_id: string;
  document_type: string;
  title_th: string;
  is_required: boolean;
  document_id?: string;
  status: DocumentStatus;
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
  ocr_extracted_data?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  document?: DocumentRecord;
}

export interface Appointment {
  id: string;
  organization_id: string;
  application_id: string;
  business_id: string;
  inspector_id?: string;
  inspector_user_id?: string;
  appointment_date?: string;
  scheduled_date?: string;
  appointment_time_slot?: string;
  scheduled_time_slot?: string;
  status: AppointmentStatus;
  reschedule_count?: number;
  reschedule_reason?: string;
  reschedule_requested_date?: string;
  reschedule_requested_time?: string;
  officer_notes?: string;
  notes?: string;
  citizen_confirmed?: boolean;
  citizen_confirmed_at?: string;
  confirmed_at?: string;
  created_at: string;
  updated_at: string;
  inspector?: UserProfile;
}

export interface InspectionItem {
  id: string;
  organization_id: string;
  category_name: string;
  item_code: string;
  title_th: string;
  description_th?: string;
  is_critical: boolean;
  max_score: number;
  display_order: number;
  is_active: boolean;
}

export interface InspectionFinding {
  id: string;
  inspection_id: string;
  inspection_item_id: string;
  is_compliant: boolean;
  score_obtained: number;
  defect_details?: string;
  corrective_action_required?: string;
  is_resolved: boolean;
  resolved_at?: string;
  resolved_notes?: string;
  created_at: string;
  item?: InspectionItem;
}

export interface InspectionPhoto {
  id: string;
  inspection_id: string;
  finding_id?: string;
  photo_url: string;
  storage_path: string;
  caption?: string;
  photo_type: string;
  latitude?: number;
  longitude?: number;
  captured_at: string;
}

export interface Inspection {
  id: string;
  organization_id: string;
  application_id: string;
  business_id: string;
  appointment_id?: string;
  inspector_user_id: string;
  inspection_date: string;
  inspection_time: string;
  inspection_sequence: number;
  total_score: number;
  max_possible_score: number;
  result: InspectionResult;
  summary_remarks?: string;
  gps_latitude?: number;
  gps_longitude?: number;
  business_owner_representative?: string;
  correction_deadline?: string;
  created_at: string;
  updated_at: string;
  inspector?: UserProfile;
  findings?: InspectionFinding[];
  photos?: InspectionPhoto[];
}

export interface License {
  id: string;
  organization_id: string;
  application_id: string;
  business_id: string;
  license_number: string;
  book_number?: string;
  year_be: number;
  issued_date: string;
  expiry_date: string;
  approved_by_user_id: string;
  approver_name: string;
  approver_position: string;
  pdf_document_id?: string;
  pdf_file_path?: string;
  verification_token: string;
  is_active: boolean;
  revoked_at?: string;
  revocation_reason?: string;
  created_at: string;
  updated_at: string;
  business?: Business;
}

export interface Fee {
  id: string;
  organization_id: string;
  application_id: string;
  business_id: string;
  fee_type: string;
  amount: number;
  calculated_area_sqm?: number;
  due_date: string;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  fee_id: string;
  application_id: string;
  payment_method: string;
  receipt_number?: string;
  amount_paid: number;
  paid_at?: string;
  proof_document_id?: string;
  proof_image_url?: string;
  status: PaymentStatus;
  verified_by?: string;
  verified_at?: string;
  verification_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LineAccount {
  id: string;
  organization_id: string;
  business_id: string;
  line_user_id: string;
  display_name?: string;
  picture_url?: string;
  linked_at: string;
  is_active: boolean;
}

export interface NotificationLog {
  id: string;
  notification_id?: string;
  channel: NotificationChannel;
  recipient_identifier: string;
  event_type: string;
  message_body: string;
  sent_at: string;
  status: NotificationStatus;
  provider_response?: Record<string, unknown>;
  error_message?: string;
}

export interface AuditLog {
  id: string;
  organization_id?: string;
  actor_id?: string;
  actor_email?: string;
  actor_name?: string;
  action: string;
  entity_name: string;
  entity_id: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface SystemSettings {
  id: string;
  organization_id: string;
  fee_rate_per_sqm: number;
  min_fee_amount: number;
  max_fee_amount: number;
  license_validity_years: number;
  days_before_expiry_notify: number;
  auto_sms_backup_enabled: boolean;
  line_oa_channel_id?: string;
  line_oa_channel_secret?: string;
  line_oa_access_token?: string;
  created_at: string;
  updated_at: string;
}
