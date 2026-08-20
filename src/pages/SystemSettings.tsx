import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { settingsService } from '../services/settingsService';
import type { SystemSettings as SystemSettingsType } from '../services/settingsService';
import { Building2, Calculator, Bell, Settings, Save, AlertTriangle, MessageSquare } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

export const SystemSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'org' | 'fees' | 'line' | 'system'>('org');
  const [settings, setSettings] = useState<SystemSettingsType>(settingsService.getSettings());
  const [isSaving, setIsSaving] = useState(false);
  const [calcArea, setCalcArea] = useState<number>(0);
  const { success } = useToast();
  
  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      settingsService.saveSettings(settings);
      success('บันทึกสำเร็จ', 'บันทึกการตั้งค่าระบบเรียบร้อยแล้ว');
      setIsSaving(false);
    }, 500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ตั้งค่าระบบ (System Settings)</h1>
          <p className="text-slate-500 mt-1">จัดการข้อมูลหน่วยงาน อัตราค่าธรรมเนียม และการแจ้งเตือน</p>
        </div>
      </div>

      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('org')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'org' ? 'bg-white text-gov-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <Building2 className="w-4 h-4" /> ข้อมูลหน่วยงาน
        </button>
        <button
          onClick={() => setActiveTab('fees')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'fees' ? 'bg-white text-gov-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <Calculator className="w-4 h-4" /> อัตราค่าธรรมเนียม
        </button>
        <button
          onClick={() => setActiveTab('line')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'line' ? 'bg-white text-gov-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <Bell className="w-4 h-4" /> ตั้งค่า LINE OA
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'system' ? 'bg-white text-gov-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <Settings className="w-4 h-4" /> ข้อมูลระบบ
        </button>
      </div>

      <div className="mt-6">
        {activeTab === 'org' && (
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>ข้อมูลหน่วยงาน (Organization Info)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="ชื่อ อบต. เต็ม" name="organization_name" value={settings.organization_name} onChange={handleChange} />
                  <Input label="ชื่อย่อ" name="organization_short" value={settings.organization_short} onChange={handleChange} />
                  <Input label="อำเภอ" name="district" value={settings.district} onChange={handleChange} />
                  <Input label="จังหวัด" name="province" value={settings.province} onChange={handleChange} />
                  <Input label="เบอร์โทร" name="phone" value={settings.phone} onChange={handleChange} />
                  <Input label="อีเมล" name="email" value={settings.email} onChange={handleChange} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>ข้อมูลผู้มีอำนาจลงนาม</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="ชื่อ-นามสกุล" name="authorized_signer_name" value={settings.authorized_signer_name} onChange={handleChange} />
                  <Input label="ตำแหน่ง" name="authorized_signer_position" value={settings.authorized_signer_position} onChange={handleChange} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Live Preview ส่วนหัวใบอนุญาต</CardTitle></CardHeader>
              <CardContent>
                <div className="border border-slate-200 rounded p-6 text-center bg-slate-50">
                  <h3 className="text-xl font-bold text-slate-900">{settings.organization_name}</h3>
                  <p className="text-slate-600">{settings.district} {settings.province}</p>
                  <p className="text-slate-600">ลงนามโดย: {settings.authorized_signer_name} ({settings.authorized_signer_position})</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSave} isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>บันทึกการตั้งค่า</Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {activeTab === 'fees' && (
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>อัตราค่าธรรมเนียมตามพื้นที่ (ตร.ม.)</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="น้อยกว่า 50 ตร.ม. (บาท)" type="number" name="fee_rate_under_50sqm" value={settings.fee_rate_under_50sqm} onChange={handleChange} />
                  <Input label="50 - 100 ตร.ม. (บาท)" type="number" name="fee_rate_50_to_100sqm" value={settings.fee_rate_50_to_100sqm} onChange={handleChange} />
                  <Input label="101 - 200 ตร.ม. (บาท)" type="number" name="fee_rate_100_to_200sqm" value={settings.fee_rate_100_to_200sqm} onChange={handleChange} />
                  <Input label="มากกว่า 200 ตร.ม. (บาท)" type="number" name="fee_rate_over_200sqm" value={settings.fee_rate_over_200sqm} onChange={handleChange} />
                </div>
                <Input label="คำอธิบายข้อบัญญัติ" name="fee_rate_description" value={settings.fee_rate_description} onChange={handleChange} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Live Fee Calculator</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <Input 
                      label="ระบุพื้นที่ (ตร.ม.)" 
                      type="number" 
                      value={calcArea} 
                      onChange={(e) => setCalcArea(Number(e.target.value))} 
                    />
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 min-w-[200px] text-center">
                    <p className="text-sm text-emerald-600 font-medium">ค่าธรรมเนียมที่ต้องชำระ</p>
                    <p className="text-2xl font-bold text-emerald-700">
                      {calcArea < 50 ? settings.fee_rate_under_50sqm :
                       calcArea <= 100 ? settings.fee_rate_50_to_100sqm :
                       calcArea <= 200 ? settings.fee_rate_100_to_200sqm :
                       settings.fee_rate_over_200sqm} บาท
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSave} isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>บันทึกการตั้งค่า</Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {activeTab === 'line' && (
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>ตั้งค่า LINE OA (LINE Settings)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="LINE OA ID" name="line_oa_id" value={settings.line_oa_id} onChange={handleChange} />
                  <Input label="Channel ID" name="line_channel_id" value={settings.line_channel_id} onChange={handleChange} />
                </div>
                <Input label="Channel Secret" type="password" name="line_channel_secret" value={settings.line_channel_secret} onChange={handleChange} />
                <Input label="Channel Access Token" type="password" name="line_channel_access_token" value={settings.line_channel_access_token} onChange={handleChange} />
                
                <div className="pt-4 border-t border-slate-100">
                  <Input label="แจ้งเตือนก่อนหมดอายุ (วัน)" type="number" name="expiry_reminder_days" value={settings.expiry_reminder_days} onChange={handleChange} />
                  <div className="mt-4 flex items-center">
                    <input 
                      type="checkbox" 
                      id="auto_send" 
                      name="auto_send_notifications"
                      checked={settings.auto_send_notifications}
                      onChange={handleChange}
                      className="w-4 h-4 text-gov-600 border-slate-300 rounded focus:ring-gov-500"
                    />
                    <label htmlFor="auto_send" className="ml-2 text-sm text-slate-700">ส่งการแจ้งเตือนอัตโนมัติ</label>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <Button variant="outline" leftIcon={<MessageSquare className="w-4 h-4" />} onClick={() => success('ส่งข้อความทดสอบ', 'ส่งข้อความสำเร็จ')}>ทดสอบส่งข้อความทดสอบ</Button>
                <Button onClick={handleSave} isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>บันทึกการตั้งค่า</Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>ข้อมูลระบบ (System Info)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="เวอร์ชั่นระบบ" value={settings.system_version} readOnly disabled />
                  <Input label="วันที่เริ่มใช้งาน (Go-live Date)" value={settings.go_live_date} readOnly disabled />
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                  <div className="bg-slate-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-slate-500">ร้านค้าทั้งหมด</p>
                    <p className="text-2xl font-bold text-slate-900">142</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-slate-500">ใบอนุญาต</p>
                    <p className="text-2xl font-bold text-slate-900">89</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-slate-500">ผู้ใช้งานระบบ</p>
                    <p className="text-2xl font-bold text-slate-900">12</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-rose-200">
              <CardHeader><CardTitle className="text-rose-600 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Danger Zone</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">ล้างข้อมูลจำลองทั้งหมดจากระบบ การกระทำนี้ไม่สามารถยกเลิกได้</p>
                <Button variant="danger">Reset Demo Data</Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

