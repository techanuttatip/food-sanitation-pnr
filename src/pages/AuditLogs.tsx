import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { auditService } from '../services/auditService';
import type { AuditLog } from '../types';
import { formatThaiDate } from '../lib/utils';
import { History, Shield, FileCode, Search } from 'lucide-react';
import { Input } from '../components/ui/Input';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const data = await auditService.getAuditLogs();
        setLogs(data);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.entity_name.toLowerCase().includes(search.toLowerCase()) ||
      l.actor_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.actor_email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-gov-700" />
            ประวัติการเปลี่ยนแปลงข้อมูล (Audit Logs)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            บันทึกร่องรอยการสร้าง แก้ไข ลบ และเปลี่ยนสถานะข้อมูลสำคัญในระบบตามมาตรฐานธรรมาภิบาลภาครัฐ
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="info">
            <Shield className="w-3.5 h-3.5 mr-1" />
            Audit Logging Active
          </Badge>
        </div>
      </div>

      <Card className="p-4">
        <Input
          placeholder="ค้นหาตามการกระทำ, ตารางข้อมูล, หรือชื่อผู้ปฏิบัติงาน..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>วันเวลา</TableHead>
              <TableHead>ผู้ดำเนินการ (Actor)</TableHead>
              <TableHead>การกระทำ (Action)</TableHead>
              <TableHead>ตาราง (Entity)</TableHead>
              <TableHead>รหัสเป้าหมาย</TableHead>
              <TableHead>รายละเอียด Snapshot (JSON)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-xs font-mono text-slate-500">
                  {formatThaiDate(log.created_at, { shortMonth: true, includeTime: true })}
                </TableCell>
                <TableCell>
                  <div className="font-semibold text-xs text-slate-900">{log.actor_name || 'ระบบ'}</div>
                  <div className="text-[11px] text-slate-400">{log.actor_email}</div>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                      log.action === 'INSERT'
                        ? 'bg-emerald-100 text-emerald-800'
                        : log.action === 'UPDATE' || log.action === 'STATUS_CHANGE'
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {log.action}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-700 font-semibold">
                  {log.entity_name}
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-500">
                  {log.entity_id}
                </TableCell>
                <TableCell className="max-w-xs">
                  <div className="text-[11px] font-mono bg-slate-50 p-1.5 rounded border border-slate-200 overflow-x-auto text-slate-700 max-h-16">
                    {JSON.stringify(log.new_values || log.old_values || {})}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
