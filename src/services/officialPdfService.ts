import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { License } from '../types';

export const officialPdfService = {
  /**
   * Downloads clean, official Form Sor.Or. 3 PDF at 300 DPI
   */
  async downloadOfficialSorOr3PDF(license: License, elementId: string = 'official-certificate-print'): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('ไม่พบแบบฟอร์มเอกสารบนหน้าจอ');
    }

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
    pdf.save(`ใบอนุญาต_สอ3_${license.license_number?.replace(/[\/\s]/g, '_') || 'สส_2569'}.pdf`);
  },

  /**
   * Opens high-definition PDF in browser print preview
   */
  async printOfficialSorOr3PDF(license: License, elementId: string = 'official-certificate-print'): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
      window.print();
      return;
    }

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
    const printWindow = window.open(url, '_blank');
    if (!printWindow) {
      pdf.save(`ใบอนุญาต_สอ3_${license.license_number?.replace(/[\/\s]/g, '_') || 'สส_2569'}.pdf`);
    }
  },
};
