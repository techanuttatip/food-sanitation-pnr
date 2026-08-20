import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { appointmentService } from '../services/appointmentService';
import { applicationService } from '../services/applicationService';
import { useToast } from '../context/ToastContext';
import { formatThaiDate } from '../lib/utils';
import type { Application } from '../types';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building,
  User,
  Phone,
  Plus,
  Search,
  ArrowRight,
  Send,
  RefreshCw,
  MapPin,
  ClipboardCheck,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const AppointmentManager: React.FC<{ onNavigateToInspections: () => void }> = ({ onNavigateToInspections }) => {
  const { success } = useToast();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Create Appointment Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState('');
  const [scheduleDate, setScheduleDate] = useState('2026-03-01');
  const [timeSlot, setTimeSlot] = useState('10:00 - 11:30 น.');
  const [inspectorName, setInspectorName] = useState('นายไพโรจน์ สว่างเวียง (จนท. สาธารณสุข)');
  const [aptNotes, setAptNotes] = useState('');

  // Citizen Reschedule Modal State (Simulation)
  const [reschedulingApt, setReschedulingApt] = useState<any | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('2026-03-08');
  const [rescheduleSlot, setRescheduleSlot] = useState('13:30 - 15:00 น.');
  const [rescheduleReason, setRescheduleReason] = useState('ติดภารกิจเดินทางไปต่างจังหวัด');

  // Calendar State
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const loadData = async () => {
    const [list, apps] = await Promise.all([
      appointmentService.getAppointments(),
      applicationService.getApplications(),
    ]);
    setAppointments(list);
    setApplications(apps);
    if (apps.length > 0 && !selectedAppId) {
      setSelectedAppId(apps[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId) return;

    await appointmentService.createAppointment({
      application_id: selectedAppId,
      scheduled_date: scheduleDate,
      scheduled_time_slot: timeSlot,
      inspector_name: inspectorName,
      notes: aptNotes,
    });
    setIsCreateOpen(false);
    success('สร้างนัดหมายสำเร็จ & ส่ง LINE OA', `นัดตรวจวันที่ ${formatThaiDate(scheduleDate)} (${timeSlot})`);
    loadData();
  };

  const handleConfirmByCitizen = async (id: string, name: string) => {
    await appointmentService.confirmAppointmentByCitizen(id);
    success('ผู้ประกอบการยืนยันนัดหมาย', `บันทึกการยืนยันวันนัดตรวจของ "${name}" เรียบร้อยแล้ว`);
    loadData();
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingApt) return;

    await appointmentService.rescheduleAppointment(
      reschedulingApt.id,
      rescheduleDate,
      rescheduleSlot,
      rescheduleReason
    );

    success(
      'บันทึกการขอเลื่อนนัดหมายเรียบร้อย',
      `เปลี่ยนวันนัดตรวจเป็น ${rescheduleDate} (${rescheduleSlot})`
    );
    setReschedulingApt(null);
    loadData();
  };

  const filteredAppointments = appointments.filter((apt) => {
    const matchSearch =
      apt.business_name?.toLowerCase().includes(search.toLowerCase()) ||
      apt.application_no?.toLowerCase().includes(search.toLowerCase()) ||
      apt.inspector_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || apt.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // --- Calendar Logic ---
  const thaiMonths = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  const thaiDays = ['อา', 'จ.', 'อ.', 'พ.', 'พฤ', 'ศ.', 'ส.'];
  
  const calYear = currentMonth.getFullYear();
  const calMonth = currentMonth.getMonth();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay();
  
  const handlePrevMonth = () => setCurrentMonth(new Date(calYear, calMonth - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(calYear, calMonth + 1, 1));

  const getLocalYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const todayStr = getLocalYMD(new Date());

  const getAppointmentsForDate = (dateStr: string) => appointments.filter(apt => apt.scheduled_date === dateStr);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-amber-500';
      case 'CONFIRMED': return 'bg-emerald-500';
      case 'COMPLETED': return 'bg-sky-500';
      case 'CANCELLED': return 'bg-slate-500';
      case 'RESCHEDULE_REQUESTED': return 'bg-rose-500';
      default: return 'bg-slate-400';
    }
  };

  const renderAppointmentCard = (apt: any) => {
    const statusConfig =
      apt.status === 'CONFIRMED'
        ? { border: 'border-t-emerald-500', pill: 'bg-emerald-100 text-emerald-800', label: '✓ ยืนยันวันนัดแล้ว' }
        : apt.status === 'SCHEDULED'
        ? { border: 'border-t-sky-500', pill: 'bg-sky-100 text-sky-800', label: 'รอยืนยันผ่าน LINE' }
        : { border: 'border-t-slate-500', pill: 'bg-slate-100 text-slate-700', label: 'ตรวจเสร็จสิ้น' };

    return (
      <Card
        key={apt.id}
        className={`border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 border-t-4 ${statusConfig.border} flex flex-col justify-between overflow-hidden bg-white`}
      >
        <div className="p-5 space-y-4">
          {/* Top Row */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {apt.business_name}
              </h3>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">{apt.application_no}</p>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${statusConfig.pill}`}>
              {statusConfig.label}
            </span>
          </div>

          {/* Date & Time Callout */}
          <div className="p-3.5 rounded-xl bg-linear-to-r from-gov-50/70 to-slate-50 border border-gov-100 space-y-1.5 text-xs">
            <div className="flex items-center gap-2 text-gov-900 font-bold">
              <Calendar className="w-4 h-4 text-gov-700" />
              <span>{formatThaiDate(apt.scheduled_date)}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>ช่วงเวลา: <strong>{apt.scheduled_time_slot}</strong></span>
            </div>
          </div>

          {/* Meta details */}
          <div className="space-y-1 text-xs text-slate-600">
            <p className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              ผู้ตรวจ: <strong>{apt.inspector_name}</strong>
            </p>
            <p className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              ที่ตั้ง: <span>{apt.village_name}</span>
            </p>
            <p className="flex items-center gap-1.5 font-mono text-[11px]">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              โทร: <span>{apt.phone_number}</span>
            </p>
            {apt.notes && (
              <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-100">
                หมายเหตุ: {apt.notes}
              </p>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex-1 flex gap-2">
            {apt.status === 'SCHEDULED' && (
              <>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleConfirmByCitizen(apt.id, apt.business_name || '')}
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  className="text-xs flex-1"
                >
                  ยืนยัน (LINE)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReschedulingApt(apt)}
                  className="text-xs flex-1"
                >
                  ขอเลื่อน
                </Button>
              </>
            )}

            {apt.status === 'CONFIRMED' && (
              <Button
                variant="primary"
                size="sm"
                onClick={onNavigateToInspections}
                leftIcon={<ClipboardCheck className="w-3.5 h-3.5" />}
                className="w-full text-xs font-bold bg-gov-700 hover:bg-gov-800"
              >
                ตรวจสุขาภิบาล 10 ข้อ →
              </Button>
            )}

            {apt.status === 'COMPLETED' && (
              <span className="text-xs text-emerald-700 font-semibold py-1">✓ บันทึกผลตรวจเสร็จสิ้นแล้ว</span>
            )}
          </div>

          <button
            type="button"
            title="ลบรายการนัดหมายนี้"
            onClick={async () => {
              if (window.confirm(`ต้องการลบนัดหมายของ "${apt.business_name}" หรือไม่?`)) {
                await appointmentService.deleteAppointment(apt.id);
                success('ลบนัดหมายสำเร็จ', `ลบนัดหมายของ ${apt.business_name}`);
                loadData();
              }
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-gov-700" />
            ระบบตารางนัดหมายตรวจสุขาภิบาล & LINE Automation
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            งานสาธารณสุข อบต.โป่งน้ำร้อน • บริหารตารางนัดตรวจภาคสนามและส่งการแจ้งเตือนกดยืนยันผ่าน LINE OA
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              📋 รายการ
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              📅 ปฏิทิน
            </button>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-md"
          >
            + นัดหมายตรวจสุขาภิบาลใหม่
          </Button>
        </div>
      </div>

      {viewMode === 'list' && (
        <>
          {/* Summary Chips */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-400">นัดหมายทั้งหมด</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5 font-mono">{appointments.length} <span className="text-xs text-slate-400 font-normal">รายการ</span></p>
              </div>
              <Calendar className="w-5 h-5 text-slate-400" />
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-emerald-600">ผู้ประกอบการยืนยันแล้ว</p>
                <p className="text-2xl font-black text-emerald-600 mt-0.5 font-mono">{appointments.filter(a => a.citizen_confirmed).length} <span className="text-xs text-slate-400 font-normal">แห่ง</span></p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-sky-600">รอยืนยันผ่าน LINE</p>
                <p className="text-2xl font-black text-sky-600 mt-0.5 font-mono">{appointments.filter(a => !a.citizen_confirmed && a.status !== 'COMPLETED').length} <span className="text-xs text-slate-400 font-normal">แห่ง</span></p>
              </div>
              <Clock className="w-5 h-5 text-sky-500" />
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-500">ตรวจเสร็จสิ้นแล้ว</p>
                <p className="text-2xl font-black text-slate-700 mt-0.5 font-mono">{appointments.filter(a => a.status === 'COMPLETED').length} <span className="text-xs text-slate-400 font-normal">แห่ง</span></p>
              </div>
              <ClipboardCheck className="w-5 h-5 text-slate-600" />
            </div>
          </div>

          {/* Filter Bar */}
          <Card className="p-4 bg-white shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                placeholder="ค้นหาชื่อร้าน, เลขที่คำขอ, หรือชื่อเจ้าหน้าที่ตรวจ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              />
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: '', label: 'ทุกสถานะนัดหมาย' },
                  { value: 'CONFIRMED', label: '🟢 ยืนยันวันนัดแล้ว (CONFIRMED)' },
                  { value: 'SCHEDULED', label: '🟠 รอยืนยันผ่าน LINE (SCHEDULED)' },
                  { value: 'COMPLETED', label: '🔵 ตรวจเสร็จสิ้นแล้ว (COMPLETED)' },
                ]}
              />
            </div>
          </Card>

          {/* Appointment Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredAppointments.map(renderAppointmentCard)}
          </div>
        </>
      )}

      {viewMode === 'calendar' && (
        <div className="space-y-6">
          <Card className="p-4 bg-white shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {thaiMonths[calMonth]} {calYear + 543}
              </h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePrevMonth} className="p-2">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleNextMonth} className="p-2">
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {thaiDays.map((d) => (
                <div key={d} className="text-center font-bold text-slate-500 text-xs py-2">
                  {d}
                </div>
              ))}
              
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`blank-${i}`} className="p-2 border border-transparent" />
              ))}
              
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isToday = dStr === todayStr;
                const isSelected = dStr === selectedDate;
                const dayAppointments = getAppointmentsForDate(dStr);
                
                return (
                  <div
                    key={day}
                    onClick={() => setSelectedDate(dStr)}
                    className={`min-h-[80px] p-1 border rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'border-gov-500 bg-gov-50 ring-2 ring-gov-200 z-10 relative' : 
                      isToday ? 'border-amber-200 bg-amber-50 ring-2 ring-amber-400 z-10 relative' : 
                      'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`text-sm font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday ? 'bg-amber-500 text-white' : 'text-slate-700'
                      }`}>
                        {day}
                      </span>
                      {dayAppointments.length > 0 && (
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 rounded-sm">
                          {dayAppointments.length}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {dayAppointments.map((apt, idx) => (
                        <div
                          key={idx}
                          className={`w-2 h-2 rounded-full ${getStatusColor(apt.status)}`}
                          title={apt.business_name}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
          
          {selectedDate && (
            <div className="space-y-4">
              <h4 className="text-md font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gov-600" />
                นัดหมายวันที่ {formatThaiDate(selectedDate)}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {getAppointmentsForDate(selectedDate).length > 0 ? (
                  getAppointmentsForDate(selectedDate).map(renderAppointmentCard)
                ) : (
                  <p className="text-sm text-slate-500 col-span-full">ไม่มีนัดหมายในวันนี้</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Appointment Modal */}
      {isCreateOpen && (
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="สร้างนัดหมายลงตรวจสุขาภิบาลภาคสนามใหม่"
          description="ระบบจะส่ง LINE Flex Message นัดหมายไปยังผู้ประกอบการอัตโนมัติ"
          size="md"
        >
          <form onSubmit={handleCreateAppointment} className="space-y-4 text-xs">
            <Select
              label="เลือกคำขอรับใบอนุญาต:"
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              options={
                applications.length > 0
                  ? applications.map((a) => ({
                      value: a.id,
                      label: `${a.business?.name || 'สถานประกอบการ'} (${a.application_no})`,
                    }))
                  : [{ value: '', label: 'ยังไม่มีคำขอในระบบ' }]
              }
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="วันที่นัดหมายลงตรวจ:"
                type="date"
                required
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
              <Select
                label="ช่วงเวลานัดหมาย:"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                options={[
                  { value: '09:00 - 10:30 น.', label: '09:00 - 10:30 น. (ช่วงเช้า 1)' },
                  { value: '10:30 - 12:00 น.', label: '10:30 - 12:00 น. (ช่วงเช้า 2)' },
                  { value: '13:30 - 15:00 น.', label: '13:30 - 15:00 น. (ช่วงบ่าย 1)' },
                  { value: '15:00 - 16:30 น.', label: '15:00 - 16:30 น. (ช่วงบ่าย 2)' },
                ]}
              />
            </div>

            <Input
              label="เจ้าหน้าที่ผู้รับผิดชอบตรวจสุขาภิบาล:"
              required
              value={inspectorName}
              onChange={(e) => setInspectorName(e.target.value)}
            />

            <Input
              label="หมายเหตุการนัดหมาย (ส่งแสดงใน LINE):"
              placeholder="เช่น ขอให้จัดเตรียมเอกสารและมีผู้มีอำนาจพาเดินตรวจ..."
              value={aptNotes}
              onChange={(e) => setAptNotes(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsCreateOpen(false)}>
                ยกเลิก
              </Button>
              <Button type="submit" variant="primary" size="sm" leftIcon={<Send className="w-4 h-4" />}>
                บันทึกนัดหมาย & ส่ง LINE OA
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Citizen Reschedule Web Portal Simulator Modal */}
      {reschedulingApt && (
        <Modal
          isOpen={!!reschedulingApt}
          onClose={() => setReschedulingApt(null)}
          title="แบบฟอร์มขอเลื่อนวันนัดตรวจ (Citizen Reschedule Portal)"
          description={`สำหรับ: ${reschedulingApt.business_name}`}
          size="md"
        >
          <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-slate-700">
              <p>วันนัดเดิม: <strong>{formatThaiDate(reschedulingApt.scheduled_date)} ({reschedulingApt.scheduled_time_slot})</strong></p>
              <p>ผู้ตรวจ: <span>{reschedulingApt.inspector_name}</span></p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="เลือกวันนัดใหม่ที่สะดวก:"
                type="date"
                required
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
              />
              <Select
                label="ช่วงเวลานัดใหม่:"
                value={rescheduleSlot}
                onChange={(e) => setRescheduleSlot(e.target.value)}
                options={[
                  { value: '09:00 - 10:30 น.', label: '09:00 - 10:30 น.' },
                  { value: '10:30 - 12:00 น.', label: '10:30 - 12:00 น.' },
                  { value: '13:30 - 15:00 น.', label: '13:30 - 15:00 น.' },
                  { value: '15:00 - 16:30 น.', label: '15:00 - 16:30 น.' },
                ]}
              />
            </div>

            <Input
              label="เหตุผลความจำเป็นในการขอเลื่อนวันนัด:"
              required
              value={rescheduleReason}
              onChange={(e) => setRescheduleReason(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="secondary" size="sm" onClick={() => setReschedulingApt(null)}>
                ยกเลิก
              </Button>
              <Button type="submit" variant="primary" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />}>
                ส่งคำขอเลื่อนนัดหมาย
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
