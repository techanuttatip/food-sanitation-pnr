import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Inspection, InspectionItem, InspectionResult } from '../types';

export const STANDARD_10_CHECKLIST: InspectionItem[] = [
  {
    id: 'chk-01',
    organization_id: 'a0000000-0000-0000-0000-000000000001',
    category_name: 'โครงสร้างและสถานที่',
    item_code: 'STR-01',
    title_th: '1. ทำเลที่ตั้งและโครงสร้างอาคารสะอาด แข็งแรง ไม่อยู่ใกล้มลพิษ',
    description_th: 'พื้น ผนัง เพดาน สะอาด ไม่มีรอยแตกร้าว ระบายอากาศได้ดี',
    is_critical: false,
    max_score: 10,
    display_order: 1,
    is_active: true,
  },
  {
    id: 'chk-02',
    organization_id: 'a0000000-0000-0000-0000-000000000001',
    category_name: 'การจัดเก็บอาหาร',
    item_code: 'STR-02',
    title_th: '2. การยกสูงจากพื้นอย่างน้อย 15 ซม. และวางห่างผนัง',
    description_th: 'วางบนพาเลทหรือชั้นวางที่สะอาด ป้องกันความชื้น',
    is_critical: false,
    max_score: 10,
    display_order: 2,
    is_active: true,
  },
  {
    id: 'chk-03',
    organization_id: 'a0000000-0000-0000-0000-000000000001',
    category_name: 'การควบคุมอุณหภูมิ',
    item_code: 'CRT-01',
    title_th: '3. อุณหภูมิห้องเย็น/ตู้แช่ได้มาตรฐาน (แช่เย็น ≤4°C, แช่แข็ง ≤-18°C) ⭐',
    description_th: 'มีเทอร์โมมิเตอร์ตรวจสอบอุณหภูมิและบันทึกสม่ำเสมอ (ข้อกำหนดวิกฤต)',
    is_critical: true,
    max_score: 15,
    display_order: 3,
    is_active: true,
  },
  {
    id: 'chk-04',
    organization_id: 'a0000000-0000-0000-0000-000000000001',
    category_name: 'การป้องกันสัตว์และแมลง',
    item_code: 'CRT-02',
    title_th: '4. ระบบป้องกันและกำจัดสัตว์แมลงนำโรค (มุ้งลวด ม่านริ้ว ตะแกรง) ⭐',
    description_th: 'ไม่มีร่องรอยของหนู แมลงสาบ หรือสัตว์นำโรคในบริเวณสะสมอาหาร (ข้อกำหนดวิกฤต)',
    is_critical: true,
    max_score: 15,
    display_order: 4,
    is_active: true,
  },
  {
    id: 'chk-05',
    organization_id: 'a0000000-0000-0000-0000-000000000001',
    category_name: 'การแยกประเภทอาหาร',
    item_code: 'SEP-01',
    title_th: '5. แยกเก็บอาหารสด อาหารปรุงสุก สารเคมี และวัตถุอันตรายเป็นสัดส่วน',
    description_th: 'มีป้ายบอกชัดเจน ป้องกันการปนเปื้อนข้าม (Cross-contamination)',
    is_critical: false,
    max_score: 10,
    display_order: 5,
    is_active: true,
  },
  {
    id: 'chk-06',
    organization_id: 'a0000000-0000-0000-0000-000000000001',
    category_name: 'สุขวิทยาส่วนบุคคล',
    item_code: 'HYG-01',
    title_th: '6. ผู้สัมผัสอาหารผ่านการอบรมสุขาภิบาลและมีใบรับรองแพทย์',
    description_th: 'แต่งกายสะอาด สวมหมวก/ผ้าคลุมผม และไม่มีโรคติดต่อตามกฎกระทรวง',
    is_critical: false,
    max_score: 10,
    display_order: 6,
    is_active: true,
  },
  {
    id: 'chk-07',
    organization_id: 'a0000000-0000-0000-0000-000000000001',
    category_name: 'ระบบน้ำและสุขอนามัย',
    item_code: 'SAN-01',
    title_th: '7. คุณภาพน้ำใช้สะอาด มีอ่างล้างมือพร้อมสบู่และจุดล้างอุปกรณ์ถูกสุขลักษณะ',
    description_th: 'น้ำประปา/น้ำกรองผ่านเกณฑ์มาตรฐาน อ่างล้างมือแยกต่างหากจากอ่างล้างของ',
    is_critical: false,
    max_score: 10,
    display_order: 7,
    is_active: true,
  },
  {
    id: 'chk-08',
    organization_id: 'a0000000-0000-0000-0000-000000000001',
    category_name: 'การจัดการขยะและน้ำเสีย',
    item_code: 'WST-01',
    title_th: '8. ถังขยะมีฝาปิดมิดชิด มีบ่อดักไขมัน และระบบระบายน้ำเสียไม่อุดตัน',
    description_th: 'ท่อน้ำทิ้งระบายได้ดี ไม่ส่งกลิ่นเหม็นรบกวนชุมชน',
    is_critical: false,
    max_score: 10,
    display_order: 8,
    is_active: true,
  },
  {
    id: 'chk-09',
    organization_id: 'a0000000-0000-0000-0000-000000000001',
    category_name: 'ห้องสุขา',
    item_code: 'TOI-01',
    title_th: '9. ห้องสุขาแยกเป็นสัดส่วน สะอาด ประตูปิดมิดชิด ไม่เปิดตรงสู่บริเวณสะสมอาหาร',
    description_th: 'มีสบู่ล้างมือ กระดาษชำระ และการระบายอากาศดี',
    is_critical: false,
    max_score: 5,
    display_order: 9,
    is_active: true,
  },
  {
    id: 'chk-10',
    organization_id: 'a0000000-0000-0000-0000-000000000001',
    category_name: 'ความปลอดภัยและอัคคีภัย',
    item_code: 'SAF-01',
    title_th: '10. มีถังดับเพลิงสภาพพร้อมใช้ ทางหนีไฟ และชุดปฐมพยาบาลเบื้องต้น',
    description_th: 'ติดตั้งถังดับเพลิงในจุดที่หยิบใช้ง่าย ตรวจสอบแรงดันสม่ำเสมอ',
    is_critical: false,
    max_score: 5,
    display_order: 10,
    is_active: true,
  },
];

export let localInspections: (Inspection & { business_name?: string; application_no?: string })[] = [];
export const DEMO_INSPECTIONS = localInspections;

export const inspectionService = {
  async getChecklistItems(): Promise<InspectionItem[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('inspection_items')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.warn('Checklist fetch notice:', err);
      }
    }

    return STANDARD_10_CHECKLIST;
  },

  async getInspections(): Promise<typeof localInspections> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('inspections')
          .select('*, application:applications(application_no, business:businesses(name))')
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((insp: any) => ({
            ...insp,
            business_name: insp.application?.business?.name || 'สถานประกอบการ',
            application_no: insp.application?.application_no || '-',
          }));
        }
      } catch (err) {
        console.warn('Inspections fetch notice:', err);
      }
    }

    return localInspections;
  },

  async submitInspection(params: {
    application_id: string;
    business_id: string;
    business_name: string;
    application_no: string;
    total_score: number;
    max_possible_score: number;
    result: InspectionResult;
    summary_remarks: string;
    representative_name: string;
    gps_latitude: number;
    gps_longitude: number;
    findings: { item_id: string; compliant: boolean; defect_details: string }[];
  }): Promise<Inspection> {
    if (isSupabaseConfigured) {
      try {
        const { data: inspData, error: inspError } = await supabase
          .from('inspections')
          .insert({
            organization_id: 'a0000000-0000-0000-0000-000000000001',
            application_id: params.application_id,
            business_id: params.business_id,
            inspector_user_id: 'u001',
            inspection_sequence: 1,
            inspection_date: new Date().toISOString().split('T')[0],
            inspection_time: new Date().toTimeString().split(' ')[0],
            total_score: params.total_score,
            max_possible_score: params.max_possible_score,
            result: params.result,
            summary_remarks: params.summary_remarks,
            business_owner_representative: params.representative_name,
            gps_latitude: params.gps_latitude,
            gps_longitude: params.gps_longitude,
          })
          .select()
          .single();

        if (!inspError && inspData) {
          return inspData;
        }
      } catch (err) {
        console.warn('Supabase submit inspection notice:', err);
      }
    }

    const fallbackInsp: (typeof localInspections)[0] = {
      id: `insp-${Date.now()}`,
      organization_id: 'a0000000-0000-0000-0000-000000000001',
      application_id: params.application_id,
      business_id: params.business_id,
      inspector_user_id: 'u001',
      inspection_sequence: 1,
      application_no: params.application_no,
      business_name: params.business_name,
      inspection_date: new Date().toISOString().split('T')[0],
      inspection_time: '10:00:00',
      total_score: params.total_score,
      max_possible_score: params.max_possible_score,
      result: params.result,
      summary_remarks: params.summary_remarks,
      business_owner_representative: params.representative_name,
      gps_latitude: params.gps_latitude,
      gps_longitude: params.gps_longitude,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    localInspections.unshift(fallbackInsp);
    return fallbackInsp;
  },
};
