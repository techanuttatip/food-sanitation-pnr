import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format ISO date string or Date object to Thai Buddhist Era (พ.ศ.)
 * e.g. "25 สิงหาคม 2569" or "25 ส.ค. 2569"
 */
export function formatThaiDate(
  dateInput?: string | Date | null,
  options: { shortMonth?: boolean; includeTime?: boolean } = {}
): string {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';

  const thaiMonthsFull = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const thaiMonthsShort = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];

  const day = date.getDate();
  const month = options.shortMonth ? thaiMonthsShort[date.getMonth()] : thaiMonthsFull[date.getMonth()];
  const yearBE = date.getFullYear() + 543;

  if (options.includeTime) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${yearBE} เวลา ${hours}:${minutes} น.`;
  }

  return `${day} ${month} ${yearBE}`;
}

/**
 * Format number to Thai Baht currency string e.g. "1,500.00 บาท"
 */
export function formatCurrency(amount?: number | null, includeUnit: boolean = true): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0.00' + (includeUnit ? ' บาท' : '');
  const formatted = new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return includeUnit ? `${formatted} บาท` : formatted;
}

/**
 * Format phone number to Thai display standard (081-234-5678 or 053-123456)
 */
export function formatPhoneNumber(phone?: string | null): string {
  if (!phone) return '-';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5)}`;
  }
  return phone;
}

/**
 * Format Thai National ID (13 digits: 1-2345-67890-12-3)
 */
export function formatNationalId(id?: string | null, mask: boolean = false): string {
  if (!id) return '-';
  const cleaned = id.replace(/\D/g, '');
  if (cleaned.length !== 13) return id;

  if (mask) {
    return `${cleaned.slice(0, 1)}-XXXX-XXXXX-${cleaned.slice(10, 12)}-${cleaned.slice(12)}`;
  }
  return `${cleaned.slice(0, 1)}-${cleaned.slice(1, 5)}-${cleaned.slice(5, 10)}-${cleaned.slice(10, 12)}-${cleaned.slice(12)}`;
}

/**
 * Validate 13-digit Thai National ID checksum algorithm
 */
export function validateThaiNationalId(id: string): boolean {
  const cleaned = id.replace(/\D/g, '');
  if (cleaned.length !== 13) return false;
  if (/^(\d)\1{12}$/.test(cleaned)) return false; // Reject repeated numbers like 1111111111111

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i), 10) * (13 - i);
  }
  const check = (11 - (sum % 11)) % 10;
  return check === parseInt(cleaned.charAt(12), 10);
}
