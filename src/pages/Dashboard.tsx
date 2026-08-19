import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { businessService } from '../services/businessService';
import type { Business } from '../types';
import {
  Store,
  FileCheck2,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  MapPin,
  Clock,
  Activity,
  Zap,
  BarChart3,
  Wifi,
  WifiOff,
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default icon
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─── Tambon Center ───────────────────────────────────────────────────────────
const TAMBON_CENTER: [number, number] = [19.932761669510985, 99.17191195228278];
const TAMBON_ZOOM = 13;

// ─── Status config ───────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { color: string; label: string; hex: string }> = {
  LICENSED:            { color: 'bg-emerald-500',  label: 'ใบอนุญาตปกติ',        hex: '#10b981' },
  EXPIRING_SOON:       { color: 'bg-amber-400',    label: 'ใกล้หมดอายุ (30 วัน)', hex: '#fbbf24' },
  APPLICATION_PENDING: { color: 'bg-sky-400',      label: 'รอตรวจสุขาภิบาล',     hex: '#38bdf8' },
  REGISTERED:          { color: 'bg-indigo-400',   label: 'ลงทะเบียนแล้ว',       hex: '#818cf8' },
  EXPIRED:             { color: 'bg-rose-500',     label: 'ใบอนุญาตหมดอายุ',     hex: '#ef4444' },
  REVOKED:             { color: 'bg-rose-500',     label: 'ถูกเพิกถอน',           hex: '#ef4444' },
  UNREGISTERED:        { color: 'bg-slate-400',    label: 'ยังไม่ลงทะเบียน',     hex: '#94a3b8' },
  SURVEYED:            { color: 'bg-slate-400',    label: 'สำรวจพบแล้ว',          hex: '#94a3b8' },
};

function makePinIcon(hex: string) {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center">
        <div style="position:absolute;inset:2px;border-radius:50%;background:${hex};opacity:.25;animation:leaflet-pulse 2s ease-in-out infinite"></div>
        <div style="width:24px;height:24px;border-radius:50%;background:${hex};border:3px solid rgba(255,255,255,.9);box-shadow:0 4px 16px ${hex}99;position:relative;z-index:2"></div>
      </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22],
  });
}

// ─── Overpass query to fetch ตำบลโป่งน้ำร้อน boundary ──────────────────────
async function fetchTambonBoundary(): Promise<GeoJSON.GeoJsonObject | null> {
  const query = `[out:json][timeout:20];
relation["name:th"="โป่งน้ำร้อน"]["admin_level"~"7|8"](18,98,21,100);
out geom;`;
  try {
    const res = await fetch(
      `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`
    );
    if (!res.ok) return null;
    const json = await res.json();

    const elements = json.elements as Array<{
      type: string;
      members?: Array<{ type: string; role: string; geometry?: Array<{ lat: number; lon: number }> }>;
    }>;

    if (!elements?.length) return null;
    const rel = elements[0];
    if (!rel.members) return null;

    const outerRings = rel.members
      .filter((m) => m.type === 'way' && m.role === 'outer' && m.geometry?.length)
      .map((m) => (m.geometry || []).map((pt) => [pt.lon, pt.lat] as [number, number]));

    if (!outerRings.length) return null;

    return {
      type: 'Feature',
      geometry: { type: 'MultiPolygon', coordinates: outerRings.map((ring) => [ring]) },
      properties: { name: 'โป่งน้ำร้อน' },
    } as GeoJSON.GeoJsonObject;
  } catch {
    return null;
  }
}

// ─── Component ───────────────────────────────────────────────────────────────
export const Dashboard: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const mapRef     = useRef<HTMLDivElement>(null);
  const mapInst    = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);
  const [boundaryLoaded, setBoundaryLoaded] = useState<'loading' | 'ok' | 'error'>('loading');
  const [businesses, setBusinesses] = useState<Business[]>([]);

  useEffect(() => {
    businessService.getBusinesses().then(setBusinesses);
  }, []);

  const totalBusinesses = businesses.length;
  const licensedCount   = businesses.filter((b) => b.status === 'LICENSED').length;
  const expiringCount   = businesses.filter((b) => b.status === 'EXPIRING_SOON').length;
  const pendingApps     = businesses.filter((b) => b.status === 'APPLICATION_PENDING' || b.status === 'REGISTERED').length;
  const passRatio       = totalBusinesses > 0 ? Math.round((licensedCount / totalBusinesses) * 100) : 0;

  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;

    const map = L.map(mapRef.current, {
      center: TAMBON_CENTER,
      zoom: TAMBON_ZOOM,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      touchZoom: false,
      doubleClickZoom: false,
      scrollWheelZoom: false,
      boxZoom: false,
      keyboard: false,
    });

    // Satellite tiles
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19 }
    ).addTo(map);

    // Labels overlay
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19, opacity: 0.75 }
    ).addTo(map);

    // Center marker
    const officeIcon = L.divIcon({
      className: '',
      html: `<div style="width:18px;height:18px;border-radius:50%;background:#f59e0b;border:3px solid white;box-shadow:0 0 0 4px #f59e0b55;z-index:100"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
    L.marker(TAMBON_CENTER, { icon: officeIcon })
      .addTo(map)
      .bindPopup(
        `<div style="font-family:sans-serif;padding:2px">
          <b style="color:#f59e0b">🏛️ ที่ทำการ อบต.</b><br>
          <span style="font-size:11px;color:#94a3b8">ตำบลโป่งน้ำร้อน อำเภอฝาง<br>จังหวัดเชียงใหม่</span>
        </div>`,
        { maxWidth: 220 }
      );

    // Dynamic layer for business markers
    const group = L.layerGroup().addTo(map);
    markersLayer.current = group;

    // Fetch tambon boundary from Overpass
    fetchTambonBoundary().then((geojson) => {
      if (!geojson) {
        setBoundaryLoaded('error');
        return;
      }
      L.geoJSON(geojson as GeoJSON.GeoJsonObject, {
        style: {
          color: '#38bdf8',
          weight: 3,
          opacity: 0.9,
          fillColor: '#38bdf8',
          fillOpacity: 0.08,
          dashArray: '6 4',
        },
      }).addTo(map);
      setBoundaryLoaded('ok');
    }).catch(() => setBoundaryLoaded('error'));

    mapInst.current = map;
    return () => { map.remove(); mapInst.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update business markers whenever `businesses` state updates from Supabase
  useEffect(() => {
    if (!markersLayer.current) return;
    markersLayer.current.clearLayers();

    businesses.forEach((b) => {
      const lat = b.location?.latitude || TAMBON_CENTER[0];
      const lng = b.location?.longitude || TAMBON_CENTER[1];
      const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.SURVEYED;
      const icon = makePinIcon(cfg.hex);
      const ownerName = b.owner ? `${b.owner.title_th || ''}${b.owner.first_name} ${b.owner.last_name}` : 'ผู้ประกอบการ';
      const phone = b.owner?.phone_number || '-';
      const feeEstimate = (b.area_sqm || 250) * 15;

      L.marker([lat, lng], { icon })
        .addTo(markersLayer.current!)
        .bindPopup(
          `<div style="font-family:sans-serif;min-width:240px;padding:4px;color:#0f172a">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
              <span style="font-size:10px;font-weight:700;font-family:monospace;color:#0284c7;background:#e0f2fe;padding:2px 6px;border-radius:6px">${b.business_code || 'FS-500408'}</span>
              <span style="display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:700;color:${cfg.hex};background:${cfg.hex}18;padding:2px 8px;border-radius:12px;border:1px solid ${cfg.hex}44">
                <span style="width:6px;height:6px;border-radius:50%;background:${cfg.hex};display:inline-block"></span>
                ${cfg.label}
              </span>
            </div>

            <div style="font-size:14px;font-weight:800;color:#0f172a;line-height:1.3;margin-bottom:4px">🏪 ${b.name}</div>
            
            <div style="font-size:11px;color:#475569;margin-bottom:8px;line-height:1.4">
              <div>👤 <b>เจ้าของ:</b> ${ownerName}</div>
              <div>📱 <b>โทร:</b> ${phone}</div>
              <div>📏 <b>พื้นที่:</b> ${b.area_sqm || 250} ตร.ม. (ค่าธรรมเนียม ~${feeEstimate.toLocaleString()} บ.)</div>
              <div>📍 <b>ที่ตั้ง:</b> ม.${b.location?.moo || '1'} ${b.location?.village_name || ''} ต.โป่งน้ำร้อน</div>
              <div style="font-size:9px;color:#64748b;font-family:monospace;margin-top:2px">GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}</div>
            </div>

            <div style="border-top:1px solid #e2e8f0;padding-top:6px;text-align:right">
              <span style="font-size:10px;font-weight:700;color:#0284c7">อบต.โป่งน้ำร้อน อ.ฝาง</span>
            </div>
          </div>`,
          { maxWidth: 280 }
        );
    });
  }, [businesses]);

  // ─── KPI cards data ─────────────────────────────────────────────────────
  const kpiCards = [
    { label: 'สถานประกอบการทั้งหมด', value: totalBusinesses, suffix: 'แห่ง', Icon: Store,       hex: '#38bdf8', tab: 'businesses',   pct: 100 },
    { label: 'ได้รับใบอนุญาตแล้ว',    value: licensedCount,   suffix: 'แห่ง', Icon: ShieldCheck, hex: '#10b981', tab: 'licenses',     pct: passRatio },
    { label: 'ใกล้หมดอายุ (30 วัน)',  value: expiringCount,   suffix: 'แห่ง', Icon: AlertTriangle, hex: '#fbbf24', tab: 'businesses', pct: totalBusinesses > 0 ? Math.round(expiringCount / totalBusinesses * 100) : 0 },
    { label: 'คำขออยู่ระหว่างดำเนิน', value: pendingApps,     suffix: 'ฉบับ', Icon: FileCheck2,  hex: '#a78bfa', tab: 'applications', pct: 60 },
  ];

  return (
    <div className="relative w-full h-[calc(100vh-61px)] overflow-hidden bg-slate-950">

      {/* ── MAP CANVAS ─────────────────────────────────────────────────────── */}
      <div ref={mapRef} className="absolute inset-0 z-0" />

      {/* ── DARK VIGNETTE overlays ─────────────────────────────────────────── */}
      <div className="absolute inset-0 z-10 pointer-events-none"
           style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(2,6,23,.85) 0%, transparent 70%)' }} />
      <div className="absolute inset-y-0 left-0 w-60 z-10 pointer-events-none"
           style={{ background: 'linear-gradient(to right, rgba(2,6,23,.75), transparent)' }} />
      <div className="absolute inset-y-0 right-0 w-48 z-10 pointer-events-none"
           style={{ background: 'linear-gradient(to left, rgba(2,6,23,.55), transparent)' }} />

      {/* ── TOP-LEFT: HEADER ───────────────────────────────────────────────── */}
      <div className="absolute top-4 left-4 z-20 flex items-start gap-2">
        <div className="bg-slate-950/85 backdrop-blur-lg border border-slate-700/60 rounded-2xl px-4 py-3 shadow-2xl">
          <p className="text-[10px] font-bold text-amber-400 tracking-widest uppercase mb-0.5">งานสาธารณสุข อบต.โป่งน้ำร้อน</p>
          <p className="text-sm font-bold text-white leading-tight">ระบบบริหารสถานที่สะสมอาหาร</p>
          <p className="text-[11px] text-slate-400 mt-0.5">ต.โป่งน้ำร้อน อ.ฝาง จ.เชียงใหม่</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-800/80 border border-slate-700/60 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              19.9328°N, 99.1719°E
            </span>
            {boundaryLoaded === 'ok' && (
              <span className="inline-flex items-center gap-1 text-[10px] text-sky-400 bg-sky-950/70 border border-sky-800/60 px-2 py-0.5 rounded-full">
                <Wifi className="w-2.5 h-2.5" />
                ขอบเขตตำบล Active
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── TOP-RIGHT: STATUS LEGEND ────────────────────────────────────────── */}
      <div className="absolute top-4 right-4 z-20">
        <div className="bg-slate-950/85 backdrop-blur-lg border border-slate-700/60 rounded-2xl p-3 shadow-2xl space-y-1.5 text-[11px] w-48">
          <p className="font-bold text-slate-400 text-[10px] uppercase tracking-wider mb-1">
            สถานะในแผนที่ ({businesses.length} จุด)
          </p>
          {Object.entries(STATUS_CONFIG).slice(0, 5).map(([k, cfg]) => {
            const count = businesses.filter((b) => b.status === k).length;
            return (
              <div key={k} className="flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.color}`} />
                  <span>{cfg.label}</span>
                </div>
                <span className="font-mono text-slate-400 font-bold text-xs">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── BOTTOM: FLOATING KPI CARDS STRIP ───────────────────────────────── */}
      <div className="absolute bottom-4 inset-x-4 z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-5xl mx-auto">
          {kpiCards.map((kpi) => {
            const Icon = kpi.Icon;
            return (
              <button
                key={kpi.label}
                onClick={() => onNavigate(kpi.tab)}
                className="group relative text-left bg-slate-950/90 hover:bg-slate-900/95 backdrop-blur-xl border border-slate-700/60 hover:border-slate-500/80 rounded-2xl p-3.5 shadow-2xl transition-all duration-200 hover:-translate-y-0.5 cursor-pointer overflow-hidden"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-0.5 transition-all group-hover:h-1"
                  style={{ background: kpi.hex }}
                />

                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] font-medium text-slate-400 leading-tight">
                    {kpi.label}
                  </p>
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${kpi.hex}22`, color: kpi.hex }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="mt-1.5 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white font-mono tracking-tight">
                    {kpi.value}
                  </span>
                  <span className="text-xs text-slate-400">{kpi.suffix}</span>
                </div>

                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-1 font-mono text-[9px] text-slate-500">
                    <Activity className="w-2.5 h-2.5 text-emerald-400" />
                    <span>ข้อมูล Realtime</span>
                  </div>
                  <span className="text-slate-400 group-hover:text-amber-400 transition-colors flex items-center gap-0.5">
                    จัดการ <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
