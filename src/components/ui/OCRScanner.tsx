import React, { useState, useRef } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { ocrService, OCRResult } from '../../services/ocrService';
import { Upload, Search, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface OCRScannerProps {
  onResult: (result: OCRResult) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const OCRScanner: React.FC<OCRScannerProps> = ({ onResult, onClose, isOpen }) => {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setProgress(0);
    }
  };

  const handleScan = async () => {
    if (!image) return;
    setIsScanning(true);
    setProgress(0);
    try {
      const res = await ocrService.extractFromImage(image, setProgress);
      setResult(res);
    } catch (error) {
      console.error("OCR Error", error);
    } finally {
      setIsScanning(false);
    }
  };

  const handleApply = () => {
    if (result) {
      onResult(result);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📷 สแกนบัตรประชาชนด้วย OCR" size="md">
      <div className="space-y-4">
        {!preview ? (
          <div 
            className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-10 h-10 text-slate-400 mb-3" />
            <p className="font-semibold text-slate-700">คลิกหรือลากไฟล์ภาพมาที่นี่</p>
            <p className="text-xs text-slate-500 mt-1">รองรับ JPG, PNG (แนะนำภาพที่ชัดเจน ไม่สะท้อนแสง)</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden bg-black flex justify-center h-48">
              <img src={preview} alt="ID Preview" className="max-h-full max-w-full object-contain" />
              {!isScanning && !result && (
                <button 
                  onClick={() => { setImage(null); setPreview(null); setResult(null); }}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70"
                >
                  ✕
                </button>
              )}
            </div>
            
            {!result && (
              <Button 
                variant="primary" 
                className="w-full" 
                onClick={handleScan}
                disabled={isScanning}
                leftIcon={isScanning ? undefined : <Search className="w-4 h-4" />}
              >
                {isScanning ? 'กำลังสแกน...' : '🔍 เริ่มสแกน OCR'}
              </Button>
            )}

            {isScanning && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-600 font-medium">
                  <span>กำลังประมวลผล...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                  <div className="bg-gov-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            )}
          </div>
        )}

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />

        {result && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            {result.confidence < 30 && (
              <div className="flex items-center gap-2 text-rose-600 bg-rose-50 p-2 rounded-lg text-xs font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <p>ภาพไม่ชัดเจน (ความมั่นใจ {result.confidence.toFixed(1)}%) กรุณาถ่ายใหม่</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-2">
                <span className="text-slate-500 text-xs block mb-1">เลขบัตรประชาชน:</span>
                <div className={`font-mono font-bold text-lg p-2 rounded-lg border ${result.national_id ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                  {result.national_id || 'ไม่พบข้อมูล'}
                </div>
              </div>
              
              <div>
                <span className="text-slate-500 text-xs block mb-1">ชื่อ:</span>
                <div className="font-semibold text-slate-800 bg-white border border-slate-200 p-2 rounded-lg">
                  {result.first_name || '-'}
                </div>
              </div>
              
              <div>
                <span className="text-slate-500 text-xs block mb-1">นามสกุล:</span>
                <div className="font-semibold text-slate-800 bg-white border border-slate-200 p-2 rounded-lg">
                  {result.last_name || '-'}
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-slate-200">
              <span>ความมั่นใจ: {result.confidence.toFixed(1)}%</span>
              <span>ใช้เวลา: {(result.processing_time_ms / 1000).toFixed(2)}s</span>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <button 
                className="w-full flex justify-between items-center p-2 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50"
                onClick={() => setShowRaw(!showRaw)}
              >
                <span>ข้อความดิบ (Raw Text)</span>
                {showRaw ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {showRaw && (
                <div className="p-2 bg-slate-50 border-t border-slate-200 text-[10px] font-mono text-slate-600 max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {result.raw_text}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => { setImage(null); setPreview(null); setResult(null); }}>
                สแกนใหม่
              </Button>
              <Button variant="primary" className="flex-1" onClick={handleApply} leftIcon={<CheckCircle2 className="w-4 h-4" />}>
                ใช้ข้อมูลนี้
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
