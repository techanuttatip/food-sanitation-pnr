import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import QRCode from 'qrcode';
import type { License } from '../types';

function getThaiDateParts(dateStr?: string) {
  if (!dateStr) return { day: '.....', month: '........................', year: '........' };
  const d = new Date(dateStr);
  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  return {
    day: d.getDate().toString(),
    month: months[d.getMonth()],
    year: (d.getFullYear() + 543).toString(),
  };
}

export const officialPdfService = {
  async generateOfficialSorOr3PDF(license: License): Promise<Uint8Array> {
    const [templateResponse, fontRegResponse, fontBoldResponse] = await Promise.all([
      fetch('/templates/form_sor_or_3_template.pdf'),
      fetch('/fonts/Sarabun-Regular.ttf'),
      fetch('/fonts/Sarabun-Bold.ttf'),
    ]);

    if (!templateResponse.ok) {
      throw new Error('ไม่พบไฟล์แม่แบบ PDF (form_sor_or_3_template.pdf)');
    }

    const [templateBytes, fontRegBytes, fontBoldBytes] = await Promise.all([
      templateResponse.arrayBuffer(),
      fontRegResponse.arrayBuffer(),
      fontBoldResponse.arrayBuffer(),
    ]);

    const pdfDoc = await PDFDocument.load(templateBytes);
    pdfDoc.registerFontkit(fontkit);

    const sarabunReg = await pdfDoc.embedFont(fontRegBytes);
    const sarabunBold = await pdfDoc.embedFont(fontBoldBytes);

    const page = pdfDoc.getPage(0);

    const owner = license.business?.owner;
    const loc = license.business?.location;
    const ownerFullName = `${owner?.title_th || ''}${owner?.first_name || 'ผู้ประกอบการ'} ${owner?.last_name || ''}`.trim();
    const bizName = license.business?.name || 'สถานประกอบการสะสมอาหาร';
    const bizType = license.business?.business_type || 'สถานที่สะสมอาหาร';
    const phone = owner?.phone_number || '-';
    const areaSqm = license.business?.area_sqm || 50;
    const feeAmount = areaSqm * 15;
    const feeText = `${feeAmount.toLocaleString('th-TH')} บาทถ้วน`;

    const issued = getThaiDateParts(license.issued_date);
    const expiry = getThaiDateParts(license.expiry_date);

    const inkColor = rgb(0.05, 0.15, 0.45);
    const fontSize = 15;
    const fontBoldSize = 16;

    // เล่มที่ / เลขที่
    page.drawText(license.book_number || '๐๑', {
      x: 130,
      y: 622,
      size: fontBoldSize,
      font: sarabunBold,
      color: inkColor,
    });
    page.drawText(license.license_number || 'สส. ๐๑/๒๕๖๙', {
      x: 215,
      y: 622,
      size: fontBoldSize,
      font: sarabunBold,
      color: inkColor,
    });

    // (๑) เจ้าพนักงานท้องถิ่นอนุญาตให้... สัญชาติ...
    page.drawText(ownerFullName, {
      x: 275,
      y: 594,
      size: fontBoldSize,
      font: sarabunBold,
      color: inkColor,
    });
    page.drawText('ไทย', {
      x: 495,
      y: 594,
      size: fontBoldSize,
      font: sarabunBold,
      color: inkColor,
    });

    // อยู่บ้านเลขที่... หมู่ที่... ตำบล... อำเภอ... จังหวัด...
    page.drawText(loc?.address_no || '๑๒๓', {
      x: 148,
      y: 571,
      size: fontSize,
      font: sarabunBold,
      color: inkColor,
    });
    page.drawText(String(loc?.moo || '๑'), {
      x: 232,
      y: 571,
      size: fontSize,
      font: sarabunBold,
      color: inkColor,
    });
    page.drawText('โป่งน้ำร้อน    ฝาง         เชียงใหม่', {
      x: 320,
      y: 571,
      size: fontSize,
      font: sarabunBold,
      color: inkColor,
    });

    // หมายเลขโทรศัพท์
    page.drawText(phone, {
      x: 175,
      y: 547,
      size: fontSize,
      font: sarabunBold,
      color: inkColor,
    });

    // ชื่อสถานประกอบกิจการ... ประเภท...
    page.drawText(bizName, {
      x: 195,
      y: 524,
      size: fontBoldSize,
      font: sarabunBold,
      color: inkColor,
    });
    page.drawText(bizType, {
      x: 435,
      y: 524,
      size: fontSize,
      font: sarabunBold,
      color: inkColor,
    });

    // ตั้งอยู่เลขที่... หมู่ที่... ตำบล... อำเภอ... จังหวัด...
    page.drawText(loc?.address_no || '๑๒๓', {
      x: 142,
      y: 500,
      size: fontSize,
      font: sarabunBold,
      color: inkColor,
    });
    page.drawText(`${loc?.moo || '๑'} ${loc?.village_name ? `(${loc.village_name})` : ''}`, {
      x: 232,
      y: 500,
      size: fontSize,
      font: sarabunBold,
      color: inkColor,
    });
    page.drawText('โป่งน้ำร้อน    ฝาง         เชียงใหม่', {
      x: 320,
      y: 500,
      size: fontSize,
      font: sarabunBold,
      color: inkColor,
    });

    // หมายเลขโทรศัพท์ (สถานที่)
    page.drawText(phone, {
      x: 175,
      y: 477,
      size: fontSize,
      font: sarabunBold,
      color: inkColor,
    });

    // เสียค่าธรรมเนียมปีละ... บาท (...)
    page.drawText(feeAmount.toLocaleString('th-TH'), {
      x: 205,
      y: 453,
      size: fontBoldSize,
      font: sarabunBold,
      color: inkColor,
    });
    page.drawText(feeText, {
      x: 340,
      y: 453,
      size: fontSize,
      font: sarabunBold,
      color: inkColor,
    });

    // ตามใบเสร็จรับเงินเล่มที่... เลขที่... วันที่...
    page.drawText('๐๑', {
      x: 195,
      y: 430,
      size: fontSize,
      font: sarabunBold,
      color: inkColor,
    });
    page.drawText(`REC-2569-${(license.business?.id || '001').slice(-3)}`, {
      x: 285,
      y: 430,
      size: fontSize,
      font: sarabunBold,
      color: inkColor,
    });
    page.drawText(`${issued.day} ${issued.month} พ.ศ. ${issued.year}`, {
      x: 380,
      y: 430,
      size: fontSize,
      font: sarabunBold,
      color: inkColor,
    });

    // (๔) ออกให้เมื่อวันที่... เดือน... พ.ศ....
    page.drawText(issued.day, {
      x: 300,
      y: 312,
      size: fontSize,
      font: sarabunBold,
      color: inkColor,
    });
    page.drawText(issued.month, {
      x: 350,
      y: 312,
      size: fontSize,
      font: sarabunBold,
      color: inkColor,
    });
    page.drawText(issued.year, {
      x: 450,
      y: 312,
      size: fontSize,
      font: sarabunBold,
      color: inkColor,
    });

    // (๕) สิ้นอายุวันที่... เดือน... พ.ศ....
    page.drawText(expiry.day, {
      x: 300,
      y: 288,
      size: fontSize,
      font: sarabunBold,
      color: inkColor,
    });
    page.drawText(expiry.month, {
      x: 350,
      y: 288,
      size: fontSize,
      font: sarabunBold,
      color: inkColor,
    });
    page.drawText(expiry.year, {
      x: 450,
      y: 288,
      size: fontSize,
      font: sarabunBold,
      color: inkColor,
    });

    // ชื่อผู้มีอำนาจลงนาม
    page.drawText(license.approver_name || 'นายสมเกียรติ สถิตพรเจริญ', {
      x: 385,
      y: 215,
      size: fontBoldSize,
      font: sarabunBold,
      color: inkColor,
    });

    // 5. Stamp Verification QR Code
    try {
      const verifyUrl = `${window.location.origin}/verify/${license.verification_token}`;
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        margin: 1,
        width: 180,
        errorCorrectionLevel: 'H',
      });
      const qrImageBytes = await fetch(qrDataUrl).then((res) => res.arrayBuffer());
      const qrImage = await pdfDoc.embedPng(qrImageBytes);

      page.drawImage(qrImage, {
        x: 75,
        y: 195,
        width: 60,
        height: 60,
      });

      page.drawText('สแกนตรวจใบอนุญาต', {
        x: 65,
        y: 184,
        size: 8.5,
        font: sarabunReg,
        color: rgb(0.2, 0.3, 0.4),
      });
    } catch (qrErr) {
      console.warn('QR code stamping warning:', qrErr);
    }

    return await pdfDoc.save();
  },

  async downloadOfficialSorOr3PDF(license: License): Promise<void> {
    const pdfBytes = await this.generateOfficialSorOr3PDF(license);
    const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ใบอนุญาต_สอ3_${license.license_number?.replace(/[\/\s]/g, '_') || '2569'}.pdf`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 2000);
  },

  async printOfficialSorOr3PDF(license: License): Promise<void> {
    const pdfBytes = await this.generateOfficialSorOr3PDF(license);
    const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    if (!printWindow) {
      await this.downloadOfficialSorOr3PDF(license);
    }
  },
};
