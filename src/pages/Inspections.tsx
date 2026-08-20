import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { inspectionService } from '../services/inspectionService';
import { applicationService } from '../services/applicationService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import type { InspectionItem, InspectionResult, Inspection, Application } from '../types';
import { formatThaiDate } from '../lib/utils';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Camera,
  MapPin,
  Save,
  Check,
  History,
  LocateFixed,
  FileCheck,
  User,
} from 'lucide-react';

export const Inspections: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [inspections, setInspections] = useState<(Inspection & { business_name?: string; application_no?: string })[]>([]);
  const [activeTab, setActiveTab] = useState<'evaluate' | 'history'>('evaluate');
  const [isLoading, setIsLoading] = useState(true);

  // Target application to inspect
  const [selectedAppId, setSelectedAppId] = useState('');

  // Evaluation State
  const [scores, setScores] = useState<Record<string, { compliant: boolean; score: number; defectNote?: string }>>({});
  const [inspectorNotes, setInspectorNotes] = useState('');
  const [representativeName, setRepresentativeName] = useState('ผู้ประกอบการ / ผู้จัดการร้าน');
  const [gpsCoords, setGpsCoords] = useState({ lat: '19.9327', lng: '99.1719' });
  const [photoCount, setPhotoCount] = useState(2);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [checklist, historyList, apps] = await Promise.all([
        inspectionService.getChecklistItems(),
        inspectionService.getInspections(),
        applicationService.getApplications(),
      ]);

      setItems(checklist);
      setInspections(historyList);
      setApplications(apps);

      if (apps.length > 0 && !selectedAppId) {
        setSelectedAppId(apps[0].id);
        if (apps[0].business?.owner) {
          setRepresentativeName(`${apps[0].business.owner.first_name} ${apps[0].business.owner.last_name}`);
        }
      }

      // Default scores: all passed initially
      const initialScores: Record<string, { compliant: boolean; score: number; defectNote?: string }> = {};
      checklist.forEach((item) => {
        initialScores[item.id] = { compliant: true, score: item.max_score };
      });
      setScores(initialScores);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedApp = applications.find((a) => a.id === selectedAppId) || applications[0];

  const handleToggleScore = (item: InspectionItem, compliant: boolean) => {
    setScores((prev) => ({
      ...prev,
      [item.id]: {
        compliant,
        score: compliant ? item.max_score : 0,
        defectNote: compliant ? undefined : prev[item.id]?.defectNote || 'ไม่ผ่านเกณฑ์ข้อนี้',
      },
    }));
  };

  const handleDefectNoteChange = (itemId: string, note: string) => {
    setScores((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        defectNote: note,
      },
    }));
  };

  // Calculate live score
  const totalScore = items.reduce((sum, item) => sum + (scores[item.id]?.score || 0), 0);
  const maxPossible = items.reduce((sum, item) => sum + item.max_score, 0);

  // Critical item check
  const hasCriticalFail = items.some(
    (item) => item.is_critical && scores[item.id]?.compliant === false
  );

  let overallResult: InspectionResult = 'PASSED';
  if (hasCriticalFail || totalScore < 60) {
    overallResult = 'FAILED';
  } else if (totalScore < 80) {
    overallResult = 'CONDITIONALLY_PASSED';
  }

  const handleGetLiveGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsCoords({
            lat: pos.coords.latitude.toFixed(6),
            lng: pos.coords.longitude.toFixed(6),
          });
          success('ระบุพิกัด GPS เรียบร้อย', `ละติจูด ${pos.coords.latitude.toFixed(4)}, ลองจิจูด ${pos.coords.longitude.toFixed(4)}`);
        },
        () => {
          setGpsCoords({ lat: '19.932761', lng: '99.171911' });
        }
      );
    }
  };

  const handleSubmitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) {
      error('กรุณาเลือกคำขอก่อนทำแบบประเมิน', '');
      return;
    }

    const findings = items
      .filter((item) => scores[item.id]?.compliant === false)
      .map((item) => ({
        item_id: item.id,
        compliant: false,
        defect_details: scores[item.id]?.defectNote || 'ไม่ผ่านเกณฑ์',
      }));

    try {
      await inspectionService.submitInspection({
        application_id: selectedApp.id,
        business_id: selectedApp.business_id,
        business_name: selectedApp.business?.name || 'สถานประกอบการ',
        application_no: selectedApp.application_no,
        total_score: totalScore,
        max_possible_score: maxPossible,
        result: overallResult,
        summary_remarks: inspectorNotes || 'ผลการตรวจตามแบบประเมินสุขาภิบาล 10 ข้อ',
        representative_name: representativeName,
        gps_latitude: parseFloat(gpsCoords.lat),
        gps_longitude: parseFloat(gpsCoords.lng),
        findings,
      });

      // Advance application workflow
      const nextStatus = overallResult === 'PASSED' ? 'PAYMENT_PENDING' : 'INSPECTION_FAILED';
      await applicationService.updateApplicationStatus(
        selectedApp.id,
        nextStatus,
        `ผลตรวจสุขาภิบาล: ${overallResult} (${totalScore}/${maxPossible} คะแนน)`
      );

      success(
        'บันทึกผลการตรวจสุขาภิบาลสำเร็จ',
        `ผลประเมิน: ${overallResult} (${totalScore}/${maxPossible} คะแนน) ระบบปรับสถานะไปขั้นตอนถัดไปแล้ว`
      );
      await loadData();
      setActiveTab('history');
    } catch (err: any) {
      error('บันทึกผลตรวจไม่สำเร็จ', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-gov-700" />
            ระบบตรวจสุขาภิบาลภาคสนาม (Inspection System ⭐️)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            งานสาธารณสุข อบต.โป่งน้ำร้อน • แบบฟอร์มประเมิน 10 ข้อมาตรฐานตาม พ.ร.บ. สาธารณสุข ๒๕๓๕ พร้อมบันทึกพิกัด GPS
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'evaluate' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('evaluate')}
            leftIcon={<ClipboardCheck className="w-4 h-4" />}
          >
            ทำแบบตรวจประเมิน
          </Button>
          <Button
            variant={activeTab === 'history' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('history')}
            leftIcon={<History className="w-4 h-4" />}
          >
            ประวัติการตรวจ ({inspections.length})
          </Button>
        </div>
      </div>

      {activeTab === 'evaluate' ? (
        <div className="space-y-6">
          {/* Target App Selector & Live HUD */}
          <Card className="p-4 bg-linear-to-r from-gov-50/80 via-white to-blue-50/50 border-gov-300 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <label className="block text-xs font-bold text-slate-800">
                  เลือกคำขอ / สถานประกอบการเป้าหมายที่จะลงตรวจ: *
                </label>
                <select
                  value={selectedAppId}
                  onChange={(e) => setSelectedAppId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-semibold text-xs focus:ring-2 focus:ring-gov-500"
                >
                  {applications.length > 0 ? (
                    applications.map((app) => (
                      <option key={app.id} value={app.id}>
                        🏪 {app.business?.name || 'สถานประกอบการ'} ({app.application_no}) - ม.{app.business?.location?.moo || '1'} {app.business?.location?.village_name || ''}
                      </option>
                    ))
                  ) : (
                    <option value="">ยังไม่มีคำขอในระบบ</option>
                  )}
                </select>

                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span>
                    ที่ตั้ง: หมู่ที่ {selectedApp?.business?.location?.moo || '1'} {selectedApp?.business?.location?.village_name || 'โป่งน้ำร้อน'}
                  </span>
                  <span>•</span>
                  <span>ประเภท: {selectedApp?.business?.business_type || 'สถานที่สะสมอาหาร'}</span>
                </div>
              </div>

              {/* Realtime Score HUD */}
              <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-6 shrink-0">
                <div className="text-center">
                  <span className="text-[11px] text-slate-400 block font-semibold">คะแนนประเมิน</span>
                  <span className="text-3xl font-black text-slate-900 font-mono">
                    {totalScore} <span className="text-xs text-slate-400 font-normal">/ {maxPossible}</span>
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-[11px] text-slate-400 block font-semibold">ผลการประเมิน</span>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border shadow-2xs ${
                      overallResult === 'PASSED'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : overallResult === 'CONDITIONALLY_PASSED'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}
                  >
                    {overallResult === 'PASSED' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    {overallResult === 'CONDITIONALLY_PASSED' && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                    {overallResult === 'FAILED' && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                    {overallResult === 'PASSED' ? 'ผ่านเกณฑ์มาตรฐาน' : overallResult === 'CONDITIONALLY_PASSED' ? 'ผ่านมีเงื่อนไข' : 'ไม่ผ่านเกณฑ์'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* 10-Item Inspection Form */}
          <form onSubmit={handleSubmitEvaluation} className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">
                  รายการประเมินสุขาภิบาล 10 ข้อ (พ.ร.บ. สาธารณสุข ๒๕๓๕)
                </h3>
                <span className="text-xs text-slate-500">แตะปุ่มเพื่อสลับสถานะ ผ่าน / ไม่ผ่าน พร้อมระบุข้อบกพร่อง</span>
              </div>

              <div className="space-y-2.5">
                {items.map((item, idx) => {
                  const isPass = scores[item.id]?.compliant !== false;
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isPass
                          ? 'bg-white border-slate-200'
                          : 'bg-rose-50/50 border-rose-300 ring-1 ring-rose-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 font-mono">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xs font-bold text-slate-900 leading-snug">
                                {item.item_code}. {item.title_th}
                              </h4>
                              {item.is_critical && (
                                <Badge variant="danger" size="sm">
                                  ข้อกำหนดวิกฤต (Critical)
                                </Badge>
                              )}
                              <span className="text-[11px] text-slate-400 font-mono">({item.max_score} คะแนน)</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{item.description_th}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                          <button
                            type="button"
                            onClick={() => handleToggleScore(item, true)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                              isPass
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            ผ่าน
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleScore(item, false)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                              !isPass
                                ? 'bg-rose-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            ไม่ผ่าน
                          </button>
                        </div>
                      </div>

                      {!isPass && (
                        <div className="mt-3 pt-3 border-t border-rose-200/80 animate-in fade-in">
                          <label className="block text-xs font-bold text-rose-900 mb-1">
                            ระบุข้อบกพร่องที่พบ (เพื่อออกคำสั่งปรับปรุงและส่งเข้า LINE):
                          </label>
                          <input
                            type="text"
                            value={scores[item.id]?.defectNote || ''}
                            onChange={(e) => handleDefectNoteChange(item.id, e.target.value)}
                            placeholder="เช่น มีคราบน้ำมันเกาะหนาแน่น หรือ อุณหภูมิวัดได้ 8°C สูงกว่าเกณฑ์ 4°C"
                            className="w-full p-2 border border-rose-300 rounded-lg text-xs bg-white text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Field Meta Section */}
            <Card className="p-5 bg-white border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold text-slate-800">ข้อมูลประกอบการลงตรวจภาคสนาม</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <Input
                  label="ชื่อตัวแทนสถานประกอบการร่วมเดินตรวจ:"
                  value={representativeName}
                  onChange={(e) => setRepresentativeName(e.target.value)}
                  placeholder="เช่น นายสมชาย ใจดีงาม (เจ้าของร้าน)"
                />

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">พิกัด GPS จุดตรวจ:</label>
                    <button
                      type="button"
                      onClick={handleGetLiveGPS}
                      className="text-gov-700 hover:text-gov-800 font-bold flex items-center gap-1 text-[11px]"
                    >
                      <LocateFixed className="w-3.5 h-3.5" />
                      ดึงพิกัดปัจจุบัน
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={gpsCoords.lat} onChange={(e) => setGpsCoords({ ...gpsCoords, lat: e.target.value })} placeholder="Latitude" />
                    <Input value={gpsCoords.lng} onChange={(e) => setGpsCoords({ ...gpsCoords, lng: e.target.value })} placeholder="Longitude" />
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-bold text-slate-800">ความเห็นและข้อเสนอแนะเพิ่มเติมของเจ้าหน้าที่:</label>
                <textarea
                  rows={2}
                  value={inspectorNotes}
                  onChange={(e) => setInspectorNotes(e.target.value)}
                  placeholder="เช่น สถานที่โดยรวมสะอาด มีการจัดเก็บวัตถุดิบเป็นระเบียบตามเกณฑ์มาตรฐานสุขาภิบาล"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-gov-500 focus:outline-none"
                />
              </div>
            </Card>

            {/* Submit Bar */}
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-2xl shadow-xl">
              <div>
                <span className="text-xs text-slate-400 block font-mono">สรุปผลประเมิน</span>
                <span className="text-sm font-bold text-emerald-400">
                  {totalScore}/{maxPossible} คะแนน ({overallResult})
                </span>
              </div>
              <Button type="submit" variant="primary" size="md" leftIcon={<Save className="w-4 h-4" />}>
                บันทึกผลการตรวจสุขาภิบาล
              </Button>
            </div>
          </form>
        </div>
      ) : (
        /* History Tab */
        <div className="space-y-4">
          <Card className="p-0 overflow-hidden bg-white border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>วันที่ตรวจ</TableHead>
                  <TableHead>สถานประกอบการ</TableHead>
                  <TableHead>เลขที่คำขอ</TableHead>
                  <TableHead>คะแนน</TableHead>
                  <TableHead>ผลการตรวจ</TableHead>
                  <TableHead>ผู้ร่วมตรวจ</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inspections.map((ins) => (
                  <TableRow key={ins.id}>
                    <TableCell className="font-mono text-xs">{formatThaiDate(ins.inspection_date)}</TableCell>
                    <TableCell className="font-bold text-slate-900">{ins.business_name}</TableCell>
                    <TableCell className="font-mono text-xs text-gov-800">{ins.application_no}</TableCell>
                    <TableCell className="font-mono font-bold text-xs">{ins.total_score} / {ins.max_possible_score}</TableCell>
                    <TableCell>
                      <Badge variant={ins.result === 'PASSED' ? 'success' : ins.result === 'CONDITIONALLY_PASSED' ? 'warning' : 'danger'}>
                        {ins.result}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">{(ins as any).representative_name || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px] px-2 py-0"
                        leftIcon={<FileCheck className="w-3 h-3" />}
                        onClick={() => {
                          import('../services/pdfExportService').then(({ pdfExportService }) => {
                            pdfExportService.exportInspectionReport({
                              business_name: ins.business_name || '-',
                              business_address: '', // Could be fetched if needed
                              inspection_date: ins.inspection_date,
                              inspector_name: ins.inspector?.first_name ? `${ins.inspector.first_name} ${ins.inspector.last_name}` : 'เจ้าหน้าที่',
                              total_score: ins.total_score,
                              max_score: ins.max_possible_score,
                              result: ins.result,
                              findings: ins.findings?.map((f: any) => ({
                                item_code: f.item?.item_code || '-',
                                title: f.item?.title_th || '-',
                                score: f.score_obtained,
                                max_score: f.item?.max_score || 10,
                                compliant: f.is_compliant,
                                defect: f.defect_details
                              })) || []
                            });
                          });
                        }}
                      >
                        พิมพ์รายงาน
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
    </div>
  );
};
