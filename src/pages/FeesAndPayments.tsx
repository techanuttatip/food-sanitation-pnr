import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { paymentService } from '../services/paymentService';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { formatThaiDate, formatCurrency } from '../lib/utils';
import {
  CreditCard,
  Search,
  CheckCircle2,
  Receipt,
  QrCode,
  Clock,
  Building2,
  AlertCircle,
  Banknote,
  Calendar,
  FileCheck,
  Trash2,
} from 'lucide-react';

interface FeeItem {
  id: string;
  organization_id?: string;
  application_id?: string;
  business_id?: string;
  application_no?: string;
  business_name?: string;
  fee_type?: string;
  amount: number;
  calculated_area_sqm?: number;
  due_date?: string;
  status: string;
  receipt_number?: string;
  paid_at?: string;
  proof_image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export const FeesAndPayments: React.FC = () => {
  const { hasRole } = useAuth();
  const { success } = useToast();
  const [fees, setFees] = useState<FeeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Payment Verification Modal
  const [verifyingFee, setVerifyingFee] = useState<FeeItem | null>(null);
  const [receiptNumber, setReceiptNumber] = useState('REC-2569/0045');
  const [verificationNotes, setVerificationNotes] = useState('');

  // PromptPay QR Modal
  const [qrFee, setQrFee] = useState<FeeItem | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await paymentService.getFees();
      setFees(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerifyPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingFee) return;

    try {
      await paymentService.verifyPayment(verifyingFee.id, receiptNumber, verificationNotes);
      success(
        'ยืนยันการรับชำระเงินเรียบร้อย',
        `ออกใบเสร็จรับเงิน อบต. เลขที่ ${receiptNumber} สำหรับ ${verifyingFee.business_name} แล้ว`
      );
      setVerifyingFee(null);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredFees = fees.filter((f) => {
    const matchSearch =
      f.business_name?.toLowerCase().includes(search.toLowerCase()) ||
      f.application_no?.toLowerCase().includes(search.toLowerCase()) ||
      f.receipt_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || f.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalAmount = fees.reduce((sum, f) => sum + f.amount, 0);
  const verifiedCount = fees.filter((f) => f.status === 'VERIFIED').length;
  const paidCount = fees.filter((f) => f.status === 'PAID').length;
  const pendingCount = fees.filter((f) => f.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-gov-700" />
            ระบบค่าธรรมเนียมและการชำระเงิน (Fee & Municipal Payment)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            คิดคำนวณตามข้อบัญญัติ อบต. ต.โป่งน้ำร้อน (15 บ./ตร.ม.) พร้อม QR พร้อมเพย์และออกใบเสร็จรับเงิน
          </p>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400">ยอดรวมค่าธรรมเนียม</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5 font-mono">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Banknote className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-emerald-600">ชำระและออกใบเสร็จแล้ว</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5 font-mono">{verifiedCount} <span className="text-xs text-slate-400 font-normal">รายการ</span></p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-sky-600">ส่งสลิปแล้ว (รอตรวจ)</p>
            <p className="text-2xl font-black text-sky-600 mt-0.5 font-mono">{paidCount} <span className="text-xs text-slate-400 font-normal">รายการ</span></p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-amber-600">รอชำระค่าธรรมเนียม</p>
            <p className="text-2xl font-black text-amber-600 mt-0.5 font-mono">{pendingCount} <span className="text-xs text-slate-400 font-normal">รายการ</span></p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-white shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            placeholder="ค้นหาชื่อร้าน, เลขที่คำขอ, หรือเลขที่ใบเสร็จรับเงิน..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'ทุกสถานะการชำระเงิน' },
              { value: 'VERIFIED', label: '🟢 ยืนยันชำระและออกใบเสร็จแล้ว (VERIFIED)' },
              { value: 'PAID', label: '🔵 ส่งสลิปโอนแล้ว / รอตรวจ (PAID)' },
              { value: 'PENDING', label: '🟠 รอชำระเงิน (PENDING)' },
            ]}
          />
        </div>
      </Card>

      {/* Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredFees.map((fee) => {
          const statusStyle =
            fee.status === 'VERIFIED'
              ? { border: 'border-t-emerald-500', badge: 'bg-emerald-100 text-emerald-800', label: 'ชำระและออกใบเสร็จแล้ว' }
              : fee.status === 'PAID'
              ? { border: 'border-t-sky-500', badge: 'bg-sky-100 text-sky-800', label: 'ส่งสลิปแล้ว (รอตรวจ)' }
              : { border: 'border-t-amber-500', badge: 'bg-amber-100 text-amber-800', label: 'รอชำระค่าธรรมเนียม' };

          return (
            <Card
              key={fee.id}
              className={`border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 border-t-4 ${statusStyle.border} flex flex-col justify-between overflow-hidden bg-white`}
            >
              <div className="p-5 space-y-4">
                {/* Header & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {fee.business_name}
                    </h3>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">{fee.application_no}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${statusStyle.badge}`}>
                    {statusStyle.label}
                  </span>
                </div>

                {/* Amount Callout */}
                <div className="p-4 rounded-xl bg-linear-to-r from-gov-50/70 to-slate-50 border border-gov-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block">ยอดค่าธรรมเนียมใบอนุญาต:</span>
                    <span className="text-2xl font-black text-gov-800 font-mono">
                      {formatCurrency(fee.amount)}
                    </span>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <span>{fee.calculated_area_sqm} ตร.ม.</span>
                    <span className="block text-[10px] text-slate-400">(อัตรา 15 บ./ตร.ม.)</span>
                  </div>
                </div>

                {/* Meta details */}
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> กำหนดชำระ:
                    </span>
                    <span className="font-semibold text-slate-800">{formatThaiDate(fee.due_date, { shortMonth: true })}</span>
                  </div>

                  {fee.receipt_number && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-emerald-800">
                      <span className="flex items-center gap-1 font-medium text-slate-500">
                        <FileCheck className="w-3.5 h-3.5 text-emerald-600" /> เลขที่ใบเสร็จ:
                      </span>
                      <strong className="font-mono">{fee.receipt_number}</strong>
                    </div>
                  )}

                  {fee.paid_at && (
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>วันที่ชำระเงิน:</span>
                      <span>{formatThaiDate(fee.paid_at)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQrFee(fee)}
                  leftIcon={<QrCode className="w-3.5 h-3.5" />}
                  className="text-xs flex-1"
                >
                  QR พร้อมเพย์
                </Button>

                {fee.status !== 'VERIFIED' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setVerifyingFee(fee);
                      const yearBE = new Date().getFullYear() + 543;
                      const rand = Math.floor(Math.random() * 900) + 100;
                      setReceiptNumber(`REC-${yearBE}/${rand}`);
                    }}
                    leftIcon={<Receipt className="w-3.5 h-3.5" />}
                    className="text-xs flex-1"
                  >
                    ตรวจสลิป / ออกใบเสร็จ
                  </Button>
                )}

                <button
                  type="button"
                  title="ลบรายการค่าธรรมเนียมนี้"
                  onClick={() => {
                    if (window.confirm(`ต้องการลบรายการค่าธรรมเนียมของ "${fee.business_name}" หรือไม่?`)) {
                      setFees((prev) => prev.filter((f) => f.id !== fee.id));
                      success('ลบค่าธรรมเนียมสำเร็จ', `ลบรายการของ ${fee.business_name}`);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg shrink-0 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* PromptPay QR Modal */}
      {qrFee && (
        <Modal
          isOpen={!!qrFee}
          onClose={() => setQrFee(null)}
          title="QR Code พร้อมเพย์ ชำระค่าธรรมเนียม อบต. โป่งน้ำร้อน"
          size="sm"
          footer={
            <Button variant="secondary" size="sm" onClick={() => setQrFee(null)}>
              ปิดหน้าต่าง
            </Button>
          }
        >
          <div className="flex flex-col items-center justify-center p-4 space-y-4 text-center">
            <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200">
              <QRCodeSVG
                value={`https://promptpay.io/053123456/${qrFee.amount}`}
                size={180}
                level="M"
              />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">บัญชีกองคลัง: อบต. ดอนแก้วพัฒนา</p>
              <p className="text-2xl font-black text-gov-800 mt-1">{formatCurrency(qrFee.amount)}</p>
              <p className="text-[11px] text-slate-400 mt-1">
                สำหรับ: {qrFee.business_name} ({qrFee.application_no})
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* Verify Slip & Issue Receipt Modal */}
      {verifyingFee && (
        <Modal
          isOpen={!!verifyingFee}
          onClose={() => setVerifyingFee(null)}
          title="ตรวจสอบการชำระเงินและออกใบเสร็จรับเงิน อบต."
          description={`สถานประกอบการ: ${verifyingFee.business_name}`}
          size="md"
        >
          <form onSubmit={handleVerifyPayment} className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">ยอดเงินที่ต้องชำระ:</span>
                <span className="font-bold text-slate-900 text-sm font-mono">
                  {formatCurrency(verifyingFee.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ช่องทางชำระเงิน:</span>
                <span className="font-semibold text-slate-800">พร้อมเพย์ QR Code อบต.</span>
              </div>
            </div>

            <Input
              label="เลขที่ใบเสร็จรับเงิน อบต. (Receipt Number)"
              required
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
            />

            <Input
              label="หมายเหตุการตรวจสอบการเงิน:"
              placeholder="เช่น ตรวจสอบยอดเงินโอนเข้าบัญชีกองคลัง อบต. เรียบร้อย..."
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="secondary" size="sm" onClick={() => setVerifyingFee(null)}>
                ยกเลิก
              </Button>
              <Button type="submit" variant="primary" size="sm" leftIcon={<CheckCircle2 className="w-4 h-4" />}>
                ยืนยันการรับเงินและออกใบเสร็จ
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
