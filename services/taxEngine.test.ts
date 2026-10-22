import { describe, it, expect } from '@jest/globals';
import {
  calculateDeductions,
  calculateEquipment,
  calculateHomeOffice,
  calculateRelocation,
} from './taxEngine';
import { TAX_CONSTANTS } from '../constants/taxConstants';

describe('German Tax Calculation Engine (Werbungskosten)', () => {
  describe('Home Office Allowance (§ 4 Abs. 5 Satz 1 Nr. 6b EStG)', () => {
    it('calculates 0 days correctly', () => {
      const res = calculateHomeOffice(0);
      expect(res.amount).toBe(0);
      expect(res.effectiveDays).toBe(0);
      expect(res.isCapped).toBe(false);
    });

    it('calculates regular home office days (100 days @ €6 = €600)', () => {
      const res = calculateHomeOffice(100);
      expect(res.amount).toBe(600);
      expect(res.effectiveDays).toBe(100);
      expect(res.isCapped).toBe(false);
      expect(res.citation).toContain('§ 4 Abs. 5');
    });

    it('reaches maximum cap exactly at 210 days (€1,260)', () => {
      const res = calculateHomeOffice(210);
      expect(res.amount).toBe(1260);
      expect(res.effectiveDays).toBe(210);
      expect(res.isCapped).toBe(false);
    });

    it('strictly caps days exceeding 210 at 210 days / €1,260', () => {
      const res = calculateHomeOffice(260);
      expect(res.amount).toBe(1260);
      expect(res.effectiveDays).toBe(210);
      expect(res.isCapped).toBe(true);
      expect(res.formula).toContain('capped at max 210');
    });

    it('handles negative or invalid days gracefully', () => {
      const res = calculateHomeOffice(-15);
      expect(res.amount).toBe(0);
      expect(res.effectiveDays).toBe(0);
    });
  });

  describe('Relocation Flat Rate (Umzugskostenpauschale)', () => {
    it('returns 0 for no relocation', () => {
      const res = calculateRelocation('none');
      expect(res.amount).toBe(0);
    });

    it('applies statutory single flat rate (€964)', () => {
      const res = calculateRelocation('single');
      expect(res.amount).toBe(964);
      expect(res.citation).toContain('§ 9 Abs. 1');
    });

    it('applies statutory married flat rate (€1,928)', () => {
      const res = calculateRelocation('married');
      expect(res.amount).toBe(1928);
    });

    it('adds €643 per dependent correctly', () => {
      const res = calculateRelocation('single', 2);
      // €964 + 2 * €643 = €2,250
      expect(res.amount).toBe(964 + 2 * 643);
      expect(res.formula).toContain('2 dependent(s)');
    });
  });

  describe('Work Equipment & Digital Depreciation (Arbeitsmittel)', () => {
    it('depreciates digital hardware 100% in year 1', () => {
      const res = calculateEquipment(1500, 100);
      expect(res.amount).toBe(1500);
      expect(res.workPercentage).toBe(100);
      expect(res.citation).toContain('BMF');
    });

    it('calculates 50% split for mixed private/business use', () => {
      const res = calculateEquipment(1000, 50);
      expect(res.amount).toBe(500);
      expect(res.workPercentage).toBe(50);
    });

    it('handles itemized equipment list correctly', () => {
      const items = [
        { id: '1', name: 'MacBook Pro', cost: 1800, category: 'digital_hardware' as const, workUsePercentage: 100 },
        { id: '2', name: 'Ergonomic Desk', cost: 600, category: 'office_furniture' as const, workUsePercentage: 50 },
      ];
      const res = calculateEquipment(0, 100, items);
      // 1800 * 1.0 + 600 * 0.5 = 2100
      expect(res.amount).toBe(2100);
      expect(res.effectiveCost).toBe(2400);
    });
  });

  describe('Full Tax Calculation Engine integration', () => {
    it('accurately computes Berlin expat relocation + tech setup scenario', () => {
      // Expat single, 140 WFH days, €1,200 MacBook, 40% tax rate
      const result = calculateDeductions({
        relocationType: 'single',
        homeOfficeDays: 140,
        equipmentCosts: 1200,
        marginalTaxRate: 0.40,
      });

      // Home Office: 140 * 6 = 840
      // Relocation: 964
      // Equipment: 1200
      // Total Werbungskosten: 840 + 964 + 1200 = 3004
      expect(result.grossWerbungskosten).toBe(3004);
      expect(result.standardPauschbetrag).toBe(1230);
      expect(result.netDeductionAbovePauschbetrag).toBe(3004 - 1230); // 1774
      // Refund boost: 3004 * 0.40 = 1201.6 -> 1202
      expect(result.estimatedRefundBoost).toBe(1202);
      expect(result.items.length).toBe(3);
      expect(result.statutoryReferences).toHaveLength(3);
      expect(result.auditSafetyScore).toBeGreaterThanOrEqual(90);
    });

    it('caps home office at 210 days in full calculation', () => {
      const result = calculateDeductions({
        relocationType: 'none',
        homeOfficeDays: 250,
        equipmentCosts: 0,
        marginalTaxRate: 0.35,
      });

      // Max 210 * 6 = 1260
      expect(result.grossWerbungskosten).toBe(1260);
      const hoItem = result.items.find(i => i.id === 'ho_pauschale');
      expect(hoItem?.amount).toBe(1260);
      expect(hoItem?.isCapped).toBe(true);
      expect(result.estimatedRefundBoost).toBe(Math.round(1260 * 0.35));
    });

    it('includes optional telecommunication allowance', () => {
      const result = calculateDeductions({
        relocationType: 'none',
        homeOfficeDays: 50,
        equipmentCosts: 0,
        includeInternetAllowance: true,
        marginalTaxRate: 0.40,
      });

      // 50 * 6 = 300 + 240 = 540
      expect(result.grossWerbungskosten).toBe(540);
      expect(result.items.some(i => i.id === 'telecom_pauschale')).toBe(true);
    });
  });
});
