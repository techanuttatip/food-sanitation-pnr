import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Application, InspectionResult } from '../types';
import { formatThaiDate } from '../lib/utils';

export interface InspectionData {
  business_name: string;
  business_address?: string;
  inspection_date: string;
  inspector_name: string;
  total_score: number;
  max_score: number;
  result: string;
  findings: { item_code: string; title: string; score: number; max_score: number; compliant: boolean; defect?: string; }[];
  remarks?: string;
}

export const pdfExportService = {
  // Export a DOM element to PDF with 300 DPI high-definition rendering
  async exportElementToPDF(elementId: string, filename: string): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) return;

    const originalShadow = element.style.boxShadow;
    const originalBorder = element.style.border;
    element.style.boxShadow = 'none';
    element.style.border = 'none';

    const canvas = await html2canvas(element, {
      scale: 3, // 300 DPI for crisp government typography
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    element.style.boxShadow = originalShadow;
    element.style.border = originalBorder;

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const imgWidth = pageWidth - (margin * 2);
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, Math.min(imgHeight, pageHeight - (margin * 2)));
    pdf.save(filename);
  },

  // Open high-definition PDF in browser print window
  async printElementPDF(elementId: string): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) return;

    const originalShadow = element.style.boxShadow;
    const originalBorder = element.style.border;
    element.style.boxShadow = 'none';
    element.style.border = 'none';

    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    element.style.boxShadow = originalShadow;
    element.style.border = originalBorder;

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const imgWidth = pageWidth - (margin * 2);
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, Math.min(imgHeight, pageHeight - (margin * 2)));
    const blob = pdf.output('blob');
    const url = URL.createObjectURL(blob);
    const printWin = window.open(url, '_blank');
    if (!printWin) {
      pdf.save('ใบอนุญาต_สอ3.pdf');
    }
  },

  // Generate Application Receipt HTML string
  generateApplicationReceiptHTML(app: Application): string {
    const owner = app.business?.owner;
    const ownerName = owner ? `${owner.first_name} ${owner.last_name}` : '-';
    const bizName = app.business?.name || '-';
    const bizAddress = app.business?.location ? `หมู่ ${app.business.location.moo} ${app.business.location.subdistrict} ${app.business.location.district} ${app.business.location.province}` : '-';

    return `
      <div style="max-width: 800px; margin: 0 auto; line-height: 1.6; color: #000; font-family: 'Sarabun', sans-serif;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="/logo_obt_pnr.png" style="width: 70px; height: 70px; object-fit: contain; margin-bottom: 8px;" />
          <h2 style="margin: 0; font-size: 22px; font-weight: bold;">ใบรับคำขอรับใบอนุญาตจัดตั้งสถานที่สะสมอาหาร</h2>
          <p style="margin: 4px 0 0; font-size: 16px;">องค์การบริหารส่วนตำบลโป่งน้ำร้อน อำเภอฝาง จังหวัดเชียงใหม่</p>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 16px;">
          <div><strong>เลขที่รับ:</strong> ${app.application_no}</div>
          <div><strong>วันที่รับ:</strong> ${formatThaiDate(app.submitted_date)}</div>
        </div>

        <div style="margin-bottom: 20px; font-size: 16px;">
          <p><strong>ชื่อผู้ยื่น:</strong> ${ownerName}</p>
          <p><strong>ชื่อสถานประกอบการ:</strong> ${bizName}</p>
          <p><strong>ประเภทกิจการ:</strong> สถานที่สะสมอาหาร</p>
          <p><strong>ที่ตั้ง:</strong> ${bizAddress}</p>
        </div>

        <div style="margin-bottom: 30px;">
          <h4 style="margin-bottom: 10px; font-size: 18px;">เอกสารแนบ</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 16px;">
            <tbody>
              <tr>
                <td style="padding: 5px; width: 30px;">[ x ]</td>
                <td style="padding: 5px;">สำเนาบัตรประจำตัวประชาชน</td>
              </tr>
              <tr>
                <td style="padding: 5px;">[ x ]</td>
                <td style="padding: 5px;">สำเนาทะเบียนบ้าน</td>
              </tr>
              <tr>
                <td style="padding: 5px;">[ x ]</td>
                <td style="padding: 5px;">ใบรับรองแพทย์</td>
              </tr>
              <tr>
                <td style="padding: 5px;">[ x ]</td>
                <td style="padding: 5px;">หลักฐานกรรมสิทธิ์หรือสิทธิครอบครองสถานที่</td>
              </tr>
              <tr>
                <td style="padding: 5px;">[ x ]</td>
                <td style="padding: 5px;">แผนผังแสดงที่ตั้งสถานประกอบการ</td>
              </tr>
              <tr>
                <td style="padding: 5px;">[ x ]</td>
                <td style="padding: 5px;">รูปถ่ายสถานประกอบการ</td>
              </tr>
              <tr>
                <td style="padding: 5px;">[ x ]</td>
                <td style="padding: 5px;">หนังสือมอบอำนาจ (ถ้ามี)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 50px; text-align: center; font-size: 16px;">
          <div style="width: 45%;">
            <p>ลงชื่อ.......................................................ผู้ยื่นคำขอ</p>
            <p style="margin-top: 10px;">(${ownerName})</p>
          </div>
          <div style="width: 45%;">
            <p>ลงชื่อ.......................................................เจ้าหน้าที่ผู้รับคำขอ</p>
            <p style="margin-top: 10px;">(.......................................................)</p>
          </div>
        </div>
      </div>
    `;
  },

  // Generate Inspection Report HTML string  
  generateInspectionReportHTML(inspection: InspectionData): string {
    const findingsHtml = inspection.findings.map(f => `
      <tr>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">${f.item_code}</td>
        <td style="border: 1px solid #000; padding: 8px;">${f.title}${f.defect ? `<br><small style="color: #c53030;">ข้อบกพร่อง: ${f.defect}</small>` : ''}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">${f.score}/${f.max_score}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">${f.compliant ? 'ผ่าน' : 'ไม่ผ่าน'}</td>
      </tr>
    `).join('');

    let resultText = 'ผ่าน';
    if (inspection.result === 'CONDITIONALLY_PASSED') resultText = 'ผ่านแบบมีเงื่อนไข';
    if (inspection.result === 'FAILED') resultText = 'ไม่ผ่าน';

    return `
      <div style="max-width: 800px; margin: 0 auto; line-height: 1.6; color: #000; font-family: 'Sarabun', sans-serif;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="/logo_obt_pnr.png" style="width: 70px; height: 70px; object-fit: contain; margin-bottom: 8px;" />
          <h2 style="margin: 0; font-size: 22px; font-weight: bold;">รายงานผลการตรวจสุขาภิบาลสถานที่สะสมอาหาร</h2>
          <p style="margin: 4px 0 0; font-size: 16px;">องค์การบริหารส่วนตำบลโป่งน้ำร้อน อำเภอฝาง จังหวัดเชียงใหม่</p>
        </div>

        <div style="margin-bottom: 20px; font-size: 16px;">
          <p><strong>ชื่อสถานประกอบการ:</strong> ${inspection.business_name}</p>
          <p><strong>ที่ตั้ง:</strong> ${inspection.business_address || '-'}</p>
          <p><strong>วันที่ตรวจ:</strong> ${formatThaiDate(inspection.inspection_date)}</p>
          <p><strong>ผู้ตรวจ:</strong> ${inspection.inspector_name}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 15px;">
          <thead>
            <tr>
              <th style="border: 1px solid #000; padding: 8px; width: 10%;">รหัส</th>
              <th style="border: 1px solid #000; padding: 8px; width: 60%;">รายการประเมิน</th>
              <th style="border: 1px solid #000; padding: 8px; width: 15%;">คะแนน</th>
              <th style="border: 1px solid #000; padding: 8px; width: 15%;">ผลการตรวจ</th>
            </tr>
          </thead>
          <tbody>
            ${findingsHtml}
          </tbody>
        </table>

        <div style="margin-bottom: 20px; font-size: 16px; border: 1px solid #000; padding: 15px;">
          <p><strong>สรุปคะแนนรวม:</strong> ${inspection.total_score} / ${inspection.max_score} คะแนน</p>
          <p><strong>เกณฑ์การประเมิน:</strong> ${resultText}</p>
          ${inspection.remarks ? `<p><strong>ข้อเสนอแนะ:</strong> ${inspection.remarks}</p>` : ''}
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 50px; text-align: center; font-size: 16px;">
          <div style="width: 45%;">
            <p>ลงชื่อ.......................................................ผู้รับการตรวจ</p>
            <p style="margin-top: 10px;">(ตัวแทนสถานประกอบการ)</p>
          </div>
          <div style="width: 45%;">
            <p>ลงชื่อ.......................................................ผู้ตรวจ</p>
            <p style="margin-top: 10px;">(${inspection.inspector_name})</p>
          </div>
        </div>
      </div>
    `;
  },

  async printHTMLDocument(html: string, title: string): Promise<void> {
    const newWindow = window.open('', '_blank', 'width=800,height=1100');
    if (!newWindow) { alert('กรุณาอนุญาต Popup ในเบราว์เซอร์'); return; }
    newWindow.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title><style>@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');body{font-family:'Sarabun',sans-serif;margin:0;padding:20px}@media print{body{margin:0;padding:10mm}}</style></head><body>${html}</body></html>`);
    newWindow.document.close();
    setTimeout(() => { newWindow.print(); }, 800);
  },
  
  // Export Application Receipt as PDF
  async exportApplicationReceipt(app: Application): Promise<void> {
    const html = this.generateApplicationReceiptHTML(app);
    await this.printHTMLDocument(html, `ใบรับคำขอ-${app.application_no}`);
  },
  
  // Export Inspection Report as PDF
  async exportInspectionReport(inspection: InspectionData): Promise<void> {
    const html = this.generateInspectionReportHTML(inspection);
    await this.printHTMLDocument(html, `รายงานตรวจ-${inspection.business_name}`);
  }
};
