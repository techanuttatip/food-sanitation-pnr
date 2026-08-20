import React, { useState } from 'react';
import { applicationService } from '../../services/applicationService';
import { formatThaiDate } from '../../lib/utils';
import { Building2, Search, CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import type { Application } from '../../types';

export const CitizenTracker: React.FC = () => {
  const [trackingCode, setTrackingCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<Application | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!trackingCode.trim()) return;
    setIsLoading(true);
    setHasSearched(true);
    setResult(null);
    try {
      const apps = await applicationService.getApplications();
      const code = trackingCode.trim().toUpperCase();
      const found = apps.find(
        (a) => a.tracking_code?.toUpperCase() === code || a.application_no?.toUpperCase() === code
      );
      setResult(found || null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { key: 'SUBMITTED', label: 'ยื่นคำขอ' },
    { key: 'DOCUMENT_REVIEW', label: 'ตรวจสอบเอกสาร' },
    { key: 'APPOINTMENT_SCHEDULED', label: 'นัดตรวจสถานที่' },
    { key: 'INSPECTION_PASSED', label: 'ตรวจสุขาภิบาล' },
    { key: 'PAYMENT_VERIFIED', label: 'ชำระค่าธรรมเนียม' },
    { key: 'LICENSE_ISSUED', label: 'อนุมัติออกใบอนุญาต' },
  ];

  const getStepStatus = (stepKey: string, currentStatus: string) => {
    const statusOrder = [
      'DRAFT', 'SUBMITTED', 'DOCUMENT_REVIEW', 'DOCUMENT_INCOMPLETE', 'DOCUMENT_APPROVED',
      'APPOINTMENT_SCHEDULED', 'INSPECTION_IN_PROGRESS', 'INSPECTION_PASSED', 'INSPECTION_FAILED',
      'PAYMENT_PENDING', 'PAYMENT_VERIFIED', 'APPROVAL_PENDING', 'LICENSE_ISSUED', 'REJECTED', 'CANCELLED'
    ];
    
    const currOrder = statusOrder.indexOf(currentStatus);
    const stepOrder = statusOrder.indexOf(stepKey);
    
    if (currOrder > stepOrder) return 'completed';
    if (currOrder === stepOrder) return 'current';
    return 'future';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-800 to-green-950 font-sans text-slate-800 pb-10">
      {/* Section 1: Header */}
      <div className="pt-8 pb-6 px-4 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-3 shadow-lg p-1.5 overflow-hidden">
          <img src="/logo_obt_pnr.png" alt="ตรา อบต.โป่งน้ำร้อน" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">ตรวจสถานะคำขอใบอนุญาต</h1>
        <p className="text-green-200 text-sm">อบต. โป่งน้ำร้อน อ.ฝาง จ.เชียงใหม่</p>
      </div>

      {/* Section 2: Search Card */}
      <div className="bg-white rounded-2xl shadow-xl mx-4 mt-2 p-5">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-green-700" /> กรอกรหัสติดตามคำขอ
        </h2>
        
        <input
          type="text"
          placeholder="เช่น TRK-2569-SEAFOOD"
          className="border-2 border-green-200 focus:border-green-600 focus:outline-none rounded-xl p-4 text-lg w-full mb-3 text-center uppercase"
          value={trackingCode}
          onChange={(e) => setTrackingCode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        
        <button
          onClick={handleSearch}
          disabled={isLoading || !trackingCode.trim()}
          className="w-full bg-green-700 hover:bg-green-800 text-white rounded-xl py-4 font-bold text-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : null}
          {isLoading ? 'กำลังค้นหา...' : 'ตรวจสถานะ'}
        </button>
        
        <p className="text-xs text-slate-500 text-center mt-4">
          หรือกรอกเลขที่คำขอ เช่น APP-2569-0001
        </p>
      </div>

      {/* Section 3: Results */}
      {hasSearched && !isLoading && (
        <div className="mx-4 mt-6">
          {result ? (
            <div className="bg-white rounded-2xl shadow-xl p-5 overflow-hidden">
              <div className="mb-6 pb-4 border-b border-slate-100">
                <h3 className="font-bold text-lg text-slate-800 mb-1">
                  {result.business?.name || 'ไม่ระบุชื่อสถานประกอบการ'}
                </h3>
                <div className="text-sm text-slate-500 space-y-1">
                  <p>เลขที่คำขอ: <span className="text-slate-700">{result.application_no}</span></p>
                  <p>รหัสติดตาม: <span className="text-slate-700">{result.tracking_code}</span></p>
                  <p>วันที่ยื่น: <span className="text-slate-700">{formatThaiDate(result.submitted_date)}</span></p>
                </div>
              </div>

              <div className="relative pl-3">
                {/* Vertical line connecting steps */}
                <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-200"></div>
                
                <div className="space-y-6">
                  {steps.map((step, idx) => {
                    const status = getStepStatus(step.key, result.status);
                    
                    return (
                      <div key={step.key} className="relative flex items-start gap-4">
                        <div className="bg-white relative z-10 pt-0.5">
                          {status === 'completed' ? (
                            <CheckCircle2 className="w-7 h-7 text-green-600 fill-green-100" />
                          ) : status === 'current' ? (
                            <Loader2 className="w-7 h-7 text-amber-500 animate-spin" />
                          ) : (
                            <div className="w-7 h-7 rounded-full border-2 border-slate-300 bg-slate-50 flex items-center justify-center">
                              <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-semibold ${status === 'completed' ? 'text-green-700' : status === 'current' ? 'text-amber-600' : 'text-slate-400'}`}>
                            {step.label}
                          </h4>
                          {status === 'completed' && idx === 0 && (
                            <p className="text-xs text-slate-500 mt-0.5">{formatThaiDate(result.submitted_date)}</p>
                          )}
                          {status === 'current' && (
                            <p className="text-xs text-amber-600 mt-0.5">กำลังดำเนินการ</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center shadow-lg">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-red-700 mb-1">ไม่พบข้อมูล</h3>
              <p className="text-red-500 text-sm">กรุณาตรวจสอบรหัสติดตามหรือเลขที่คำขออีกครั้ง</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
