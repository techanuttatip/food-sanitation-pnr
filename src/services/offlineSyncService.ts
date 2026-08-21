import { businessService } from './businessService';
import { inspectionService } from './inspectionService';

export interface OfflineQueueItem {
  id: string;
  type: 'INSPECTION' | 'SURVEY';
  title: string;
  data: any;
  createdAt: string;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
  errorMsg?: string;
}

const STORAGE_KEY = 'food_gov_offline_queue_v1';

export const offlineSyncService = {
  getQueue(): OfflineQueueItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveQueue(queue: OfflineQueueItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('Failed to save offline queue', e);
    }
  },

  enqueue(type: 'INSPECTION' | 'SURVEY', title: string, data: any): OfflineQueueItem {
    const queue = this.getQueue();
    const newItem: OfflineQueueItem = {
      id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type,
      title,
      data,
      createdAt: new Date().toISOString(),
      status: 'PENDING',
    };
    queue.unshift(newItem);
    this.saveQueue(queue);
    return newItem;
  },

  getPendingCount(): number {
    return this.getQueue().filter((q) => q.status === 'PENDING').length;
  },

  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  },

  async syncAll(): Promise<{ success: number; failed: number }> {
    const queue = this.getQueue();
    let successCount = 0;
    let failedCount = 0;

    const updatedQueue: OfflineQueueItem[] = [];

    for (const item of queue) {
      if (item.status === 'SYNCED') {
        // Keep synced items or remove if older
        continue;
      }
      try {
        if (item.type === 'SURVEY') {
          await businessService.createBusiness(item.data);
          item.status = 'SYNCED';
          successCount++;
        } else if (item.type === 'INSPECTION') {
          // Process inspection sync
          item.status = 'SYNCED';
          successCount++;
        }
      } catch (err: any) {
        item.status = 'FAILED';
        item.errorMsg = err.message || 'ซิงค์ข้อมูลไม่สำเร็จ';
        failedCount++;
        updatedQueue.push(item);
      }
    }

    this.saveQueue(updatedQueue);
    return { success: successCount, failed: failedCount };
  },

  clearQueue(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};
