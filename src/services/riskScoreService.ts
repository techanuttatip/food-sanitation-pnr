import type { Business } from '../types';

export interface RiskFactor {
  id: string;
  label: string;
  weight: number;
  value: number; // 0 to 1
  description: string;
}

export interface RiskAssessment {
  business_id: string;
  business_name: string;
  overall_score: number;   // 0-100 (higher = more risky)
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: RiskFactor[];
  last_calculated: string;
}

class RiskScoreService {
  calculateRisk(business: Business, lastInspectionScore?: number, daysSinceLastInspection?: number): RiskAssessment {
    const factors: RiskFactor[] = [];

    // 1. license_expiry: weight 30 - 100 if expired, 70 if expiring in 30d, 0 if valid
    let licenseValue = 0;
    if (business.status === 'EXPIRED' || business.status === 'REVOKED') {
      licenseValue = 1;
    } else if (business.status === 'EXPIRING_SOON') {
      licenseValue = 0.7;
    } else if (business.status === 'UNREGISTERED') {
      licenseValue = 1; // High risk if unregistered
    }
    
    factors.push({
      id: 'license_expiry',
      label: 'สถานะใบอนุญาต',
      weight: 30,
      value: licenseValue,
      description: 'ใบอนุญาตหมดอายุมีความเสี่ยงสูงสุด',
    });

    // 2. inspection_score: weight 30 - inverse of score (if score was 60/100, risk = 40)
    let inspectionScoreValue = 0.5; // Default if no score
    if (lastInspectionScore !== undefined) {
      inspectionScoreValue = Math.max(0, 1 - (lastInspectionScore / 100));
    }
    factors.push({
      id: 'inspection_score',
      label: 'คะแนนการตรวจครั้งล่าสุด',
      weight: 30,
      value: inspectionScoreValue,
      description: 'คะแนนการตรวจยิ่งต่ำ ความเสี่ยงยิ่งสูง',
    });

    // 3. days_since_inspection: weight 20 - 0 if inspected in 90d, 50 if 180d, 100 if never
    let daysSinceValue = 1; // Default never
    if (daysSinceLastInspection !== undefined) {
      if (daysSinceLastInspection <= 90) {
        daysSinceValue = 0;
      } else if (daysSinceLastInspection <= 180) {
        daysSinceValue = 0.5;
      } else {
        daysSinceValue = 1;
      }
    }
    factors.push({
      id: 'days_since_inspection',
      label: 'ระยะเวลาตั้งแต่การตรวจครั้งล่าสุด',
      weight: 20,
      value: daysSinceValue,
      description: 'ยิ่งทิ้งช่วงนาน ความเสี่ยงยิ่งสูง',
    });

    // 4. food_category_risk: weight 10 - HIGH if meat/seafood, MEDIUM if grain, LOW if vegetables
    // Simplified logic: based on business type or name if category not explicit
    let foodRiskValue = 0.5; // default medium
    const name = business.name || '';
    if (name.includes('เนื้อ') || name.includes('หมู') || name.includes('ทะเล')) {
      foodRiskValue = 1.0;
    } else if (name.includes('ผัก') || name.includes('ผลไม้')) {
      foodRiskValue = 0.2;
    }
    factors.push({
      id: 'food_category_risk',
      label: 'ประเภทอาหาร',
      weight: 10,
      value: foodRiskValue,
      description: 'อาหารสดมีความเสี่ยงสูงกว่าอาหารแห้ง/ผัก',
    });

    // 5. area_size: weight 10 - larger area = slightly higher risk
    // Assuming area > 200 = 1, > 100 = 0.5, else 0
    let areaValue = 0;
    if (business.area_sqm) {
      if (business.area_sqm > 200) areaValue = 1;
      else if (business.area_sqm > 100) areaValue = 0.5;
    }
    factors.push({
      id: 'area_size',
      label: 'ขนาดพื้นที่',
      weight: 10,
      value: areaValue,
      description: 'พื้นที่ขนาดใหญ่ควบคุมได้ยากกว่า',
    });

    // Calculate overall score
    let totalWeight = 0;
    let weightedSum = 0;
    for (const f of factors) {
      totalWeight += f.weight;
      weightedSum += (f.weight * f.value);
    }
    
    const overallScore = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
    
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (overallScore > 75) {
      riskLevel = 'CRITICAL';
    } else if (overallScore > 50) {
      riskLevel = 'HIGH';
    } else if (overallScore > 25) {
      riskLevel = 'MEDIUM';
    }

    return {
      business_id: business.id,
      business_name: business.name,
      overall_score: overallScore,
      risk_level: riskLevel,
      factors,
      last_calculated: new Date().toISOString(),
    };
  }

  calculateAllRisks(businesses: Business[]): RiskAssessment[] {
    return businesses.map((b) => this.calculateRisk(b));
  }

  getRiskBadgeColor(level: string): string {
    switch (level) {
      case 'CRITICAL': return 'bg-rose-100 text-rose-700 border-rose-300';
      case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'MEDIUM': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'LOW': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  }
}

export const riskScoreService = new RiskScoreService();
