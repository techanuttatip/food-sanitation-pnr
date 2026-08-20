import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Bell, AlertTriangle, Clock, Send, CheckCircle2, RefreshCw, MessageSquare } from 'lucide-react';
import { notificationService, ExpiryNotificationSchedule } from '../services/notificationService';
import { lineService, NotificationLogItem } from '../services/lineService';
import { useToast } from '../context/ToastContext';
import { formatThaiDate } from '../lib/utils';

export const NotificationCenter: React.FC = () => {
  const { success, error } = useToast();
  const [schedule, setSchedule] = useState<ExpiryNotificationSchedule[]>([]);
  const [logs, setLogs] = useState<NotificationLogItem[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [isChecking, setIsChecking] = useState(false);

  const loadData = async () => {
    try {
      const scheduleData = await notificationService.getNotificationSchedule();
      setSchedule(scheduleData);
      
      const logsData = await lineService.getNotificationLogs();
      setLogs(logsData);
    } catch (err) {
      console.error(err);
      error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunDailyCheck = async () => {
    setIsChecking(true);
    try {
      const result = await notificationService.runDailyCheck();
      success(`ส่งแจ้งเตือนสำเร็จ ${result.sentCount} รายการ จากทั้งหมด ${result.totalChecked} รายการ`);
      await loadData();
    } catch (err) {
      console.error(err);
      error('เกิดข้อผิดพลาดในการรันระบบตรวจสอบ');
    } finally {
      setIsChecking(false);
    }
  };

  const handleSendManual = async (item: ExpiryNotificationSchedule) => {
    try {
      await notificationService.sendExpiryReminderLine(item.license, item.business, item.daysRemaining);
      success(`ส่งแจ้งเตือนให้ ${item.business.name} สำเร็จ`);
      await loadData();
    } catch (err) {
      console.error(err);
      error('ไม่สามารถส่งแจ้งเตือนได้ อาจจะยังไม่ได้เชื่อมต่อ LINE');
    }
  };

  const count7Days = schedule.filter(s => s.daysRemaining <= 7).length;
  const count30Days = schedule.filter(s => s.daysRemaining > 7 && s.daysRemaining <= 30).length;
  const sentTodayCount = logs.filter(l => new Date(l.sent_at).toDateString() === new Date().toDateString()).length;
  const pendingCount = schedule.filter(s => !s.isNotified && s.linkedLineAccountId).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-600" />
            ศูนย์แจ้งเตือนและ Notification Engine
          </h1>
          <p className="text-gray-500 mt-1">จัดการและตรวจสอบการส่งแจ้งเตือนอัตโนมัติ</p>
        </div>
        <Button onClick={handleRunDailyCheck} disabled={isChecking} className="flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
          รันตรวจสอบทั้งหมด
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-rose-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">ใบอนุญาตหมดอายุใน 7 วัน</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{count7Days}</h3>
            </div>
            <div className="p-2 bg-rose-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">ใบอนุญาตหมดอายุใน 30 วัน</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{count30Days}</h3>
            </div>
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">ส่งแจ้งเตือนแล้ววันนี้</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{sentTodayCount}</h3>
            </div>
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-sky-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">รอส่งแจ้งเตือน</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{pendingCount}</h3>
            </div>
            <div className="p-2 bg-sky-100 rounded-lg">
              <Send className="w-5 h-5 text-sky-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'upcoming'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('upcoming')}
            >
              รายการแจ้งเตือนใกล้หมดอายุ
              <Badge className="ml-2 bg-blue-100 text-blue-700">{schedule.length}</Badge>
            </button>
            <button
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('history')}
            >
              ประวัติการแจ้งเตือน
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'upcoming' && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อร้าน</TableHead>
                    <TableHead>เลขใบอนุญาต</TableHead>
                    <TableHead>หมดอายุ</TableHead>
                    <TableHead>เหลือกี่วัน</TableHead>
                    <TableHead>สถานะ LINE</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedule.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        ไม่มีใบอนุญาตใกล้หมดอายุใน 30 วัน
                      </TableCell>
                    </TableRow>
                  ) : (
                    schedule.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{item.business.name}</TableCell>
                        <TableCell>{item.license.license_number}</TableCell>
                        <TableCell>{formatThaiDate(item.license.expiry_date)}</TableCell>
                        <TableCell>
                          <Badge variant={item.daysRemaining <= 7 ? 'danger' : 'warning'}>
                            {item.daysRemaining} วัน
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.linkedLineAccountId ? (
                            <div className="flex items-center text-emerald-600 text-sm">
                              <MessageSquare className="w-4 h-4 mr-1" />
                              เชื่อมต่อแล้ว
                            </div>
                          ) : (
                            <div className="flex items-center text-gray-400 text-sm">
                              <AlertTriangle className="w-4 h-4 mr-1" />
                              ยังไม่เชื่อมต่อ
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!item.linkedLineAccountId || item.isNotified}
                            onClick={() => handleSendManual(item)}
                          >
                            {item.isNotified ? 'ส่งแล้ว' : 'ส่งแจ้งเตือน LINE'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>วันที่ส่ง</TableHead>
                    <TableHead>หัวข้อ</TableHead>
                    <TableHead>ร้านค้า</TableHead>
                    <TableHead>ผู้รับ</TableHead>
                    <TableHead>สถานะ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        ไม่มีประวัติการส่งแจ้งเตือน
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{new Date(log.sent_at).toLocaleString('th-TH')}</TableCell>
                        <TableCell className="font-medium">{log.title}</TableCell>
                        <TableCell>{log.business_name}</TableCell>
                        <TableCell>{log.recipient_name}</TableCell>
                        <TableCell>
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">
                            {log.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
