import { TAX_CONSTANTS } from '../constants/taxConstants';
import {
  EquipmentItem,
  RelocationType,
  TaxCalculationResult,
  TaxDeductionItem,
  TaxInputParameters,
} from '../types/tax';

/**
 * Calculates German Home Office allowance (§ 4 Abs. 5 Satz 1 Nr. 6b EStG).
 * €6 per day, capped at 210 days / €1,260 per calendar year.
 */
export function calculateHomeOffice(days: number): {
  amount: number;
  effectiveDays: number;
  isCapped: boolean;
  citation: string;
  formula: string;
} {
  const sanitizedDays = Math.max(0, Math.round(days || 0));
  const effectiveDays = Math.min(sanitizedDays, TAX_CONSTANTS.HOMEOFFICE.MAX_DAYS);
  const isCapped = sanitizedDays > TAX_CONSTANTS.HOMEOFFICE.MAX_DAYS;
  const amount = effectiveDays * TAX_CONSTANTS.HOMEOFFICE.RATE_PER_DAY;

  return {
    amount,
    effectiveDays,
    isCapped,
    citation: TAX_CONSTANTS.HOMEOFFICE.CITATION,
    formula: isCapped
      ? `${effectiveDays} days (capped at max 210) × €${TAX_CONSTANTS.HOMEOFFICE.RATE_PER_DAY.toFixed(2)}/day`
      : `${effectiveDays} days × €${TAX_CONSTANTS.HOMEOFFICE.RATE_PER_DAY.toFixed(2)}/day`,
  };
}

/**
 * Calculates German Job-Related Relocation flat rate (Umzugskostenpauschale).
 * Singles: €964, Married: €1,928, + €643 per dependent (§ 9 Abs. 1 Satz 1 EStG i.V.m. BUKG).
 */
export function calculateRelocation(
  type: RelocationType,
  dependents: number = 0
): {
  amount: number;
  citation: string;
  formula: string;
} {
  const sanitizedDependents = Math.max(0, Math.round(dependents || 0));
  let baseAmount = 0;
  let label = 'No relocation claimed';

  if (type === 'single') {
    baseAmount = TAX_CONSTANTS.RELOCATION.SINGLE_AMOUNT;
    label = `Single flat rate (€${TAX_CONSTANTS.RELOCATION.SINGLE_AMOUNT})`;
  } else if (type === 'married') {
    baseAmount = TAX_CONSTANTS.RELOCATION.MARRIED_AMOUNT;
    label = `Married flat rate (€${TAX_CONSTANTS.RELOCATION.MARRIED_AMOUNT})`;
  }

  const dependentAddition = sanitizedDependents * TAX_CONSTANTS.RELOCATION.PER_DEPENDENT_AMOUNT;
  const totalAmount = baseAmount > 0 ? baseAmount + dependentAddition : 0;

  const formula =
    baseAmount > 0
      ? sanitizedDependents > 0
        ? `${label} + ${sanitizedDependents} dependent(s) @ €${TAX_CONSTANTS.RELOCATION.PER_DEPENDENT_AMOUNT}`
        : label
      : '€0 (No job-related relocation)';

  return {
    amount: totalAmount,
    citation: TAX_CONSTANTS.RELOCATION.CITATION,
    formula,
  };
}

/**
 * Calculates Work Equipment (Arbeitsmittel) deduction under digital depreciation rules.
 * Computer hardware & software qualify for 1-year deemed useful life (BMF 22.02.2022).
 */
export function calculateEquipment(
  totalCost: number,
  workUsePercentage: number = TAX_CONSTANTS.EQUIPMENT.DEFAULT_TECH_WORK_PERCENTAGE,
  items?: EquipmentItem[]
): {
  amount: number;
  effectiveCost: number;
  workPercentage: number;
  citation: string;
  formula: string;
} {
  const percentage = Math.min(100, Math.max(0, workUsePercentage));
  let calculatedAmount = 0;
  let effectiveCost = 0;

  if (items && items.length > 0) {
    calculatedAmount = items.reduce((sum, item) => {
      const itemPercentage = item.workUsePercentage ?? percentage;
      const validPercentage = Math.min(100, Math.max(0, itemPercentage));
      effectiveCost += item.cost;
      return sum + item.cost * (validPercentage / 100);
    }, 0);
  } else {
    effectiveCost = Math.max(0, totalCost || 0);
    calculatedAmount = effectiveCost * (percentage / 100);
  }

  calculatedAmount = Math.round(calculatedAmount * 100) / 100;

  const formula =
    percentage === 100
      ? `€${effectiveCost.toLocaleString('de-DE')} (100% full business write-off)`
      : `€${effectiveCost.toLocaleString('de-DE')} × ${percentage}% business use`;

  return {
    amount: calculatedAmount,
    effectiveCost,
    workPercentage: percentage,
    citation: TAX_CONSTANTS.EQUIPMENT.CITATION,
    formula,
  };
}

/**
 * Main deterministic tax engine calculation according to German EStG statutory rules.
 */
export function calculateDeductions(params: TaxInputParameters): TaxCalculationResult {
  const marginalTaxRate =
    params.marginalTaxRate ?? TAX_CONSTANTS.TAX_RATES.DEFAULT_MARGINAL_RATE;
  const items: TaxDeductionItem[] = [];
  const statutoryReferences: string[] = [];

  // 1. Home Office Allowance
  const ho = calculateHomeOffice(params.homeOfficeDays);
  if (ho.amount > 0) {
    items.push({
      id: 'ho_pauschale',
      category: 'homeoffice',
      title: 'Home Office Allowance',
      germanTitle: 'Homeoffice-Pauschale',
      statutoryCitation: ho.citation,
      amount: ho.amount,
      breakdownFormula: ho.formula,
      taxTip:
        'No dedicated room required. Max 210 days/year allowed even if working weekends or extra days.',
      isCapped: ho.isCapped,
    });
    statutoryReferences.push(ho.citation);
  }

  // 2. Relocation Flat Rate
  const rel = calculateRelocation(params.relocationType, params.additionalDependents);
  if (rel.amount > 0) {
    items.push({
      id: 'umzug_pauschale',
      category: 'relocation',
      title: 'Job Relocation Flat Rate',
      germanTitle: 'Umzugskostenpauschale',
      statutoryCitation: rel.citation,
      amount: rel.amount,
      breakdownFormula: rel.formula,
      taxTip:
        'Lump-sum for moving costs (renovation, kitchen hookup, agency fees). No individual receipts required.',
    });
    statutoryReferences.push(rel.citation);
  }

  // 3. Work Equipment & Digital Depreciation
  const eq = calculateEquipment(
    params.equipmentCosts || 0,
    params.workUsePercentage ?? TAX_CONSTANTS.EQUIPMENT.DEFAULT_TECH_WORK_PERCENTAGE,
    params.equipmentItems
  );
  if (eq.amount > 0) {
    items.push({
      id: 'arbeitsmittel',
      category: 'equipment',
      title: 'Tech Equipment Write-Off',
      germanTitle: 'Arbeitsmittel & Digitale Abschreibung',
      statutoryCitation: eq.citation,
      amount: eq.amount,
      breakdownFormula: eq.formula,
      taxTip:
        'Under BMF 2022 guidelines, laptops, monitors, GPUs, and developer software depreciate 100% in year 1.',
    });
    statutoryReferences.push(eq.citation);
  }

  // 4. Telecommunications / Internet Flat Rate (Optional)
  if (params.includeInternetAllowance) {
    const telecomAmount = TAX_CONSTANTS.TELECOM.ANNUAL_MAX;
    items.push({
      id: 'telecom_pauschale',
      category: 'telecom',
      title: 'Remote Internet & Phone Allowance',
      germanTitle: 'Telefon- und Internetkosten',
      statutoryCitation: TAX_CONSTANTS.TELECOM.CITATION,
      amount: telecomAmount,
      breakdownFormula: '12 months × €20.00/month flat allowance',
      taxTip:
        'Finanzamt accepts 20% of monthly telephone/internet bills up to €20/month without itemized logs.',
    });
    statutoryReferences.push(TAX_CONSTANTS.TELECOM.CITATION);
  }

  // Summary figures
  const grossWerbungskosten = items.reduce((sum, item) => sum + item.amount, 0);
  const standardPauschbetrag = TAX_CONSTANTS.ARBEITNEHMER_PAUSCHBETRAG; // €1,230
  const netDeductionAbovePauschbetrag = Math.max(
    0,
    grossWerbungskosten - standardPauschbetrag
  );
  const effectiveTaxDeduction = grossWerbungskosten;

  // Estimated Tax Refund Boost
  // Calculated based on the marginal tax bracket shielding taxable income
  const estimatedRefundBoost = Math.round(grossWerbungskosten * marginalTaxRate);

  // Audit safety notes & score
  const auditNotes: string[] = [];
  let auditScore = 98;

  if (params.homeOfficeDays > 210) {
    auditNotes.push('Home office days automatically capped at statutory maximum of 210 days.');
  } else {
    auditNotes.push('Home office days within standard statutory limits.');
  }

  if (params.relocationType !== 'none') {
    auditNotes.push(
      'Relocation flat rate claimed. Ensure move shortened commute by ≥1 hr or was caused by new employment.'
    );
  }

  if (eq.amount > 0) {
    auditNotes.push(
      'Retain invoice / PDF proof of tech equipment purchase for standard Finanzamt audit defense.'
    );
    if (eq.workPercentage > 90) {
      auditNotes.push(
        '100% work use claimed: Recommended to have an employer confirmation letter stating remote tech duties.'
      );
      auditScore = 95;
    }
  }

  return {
    grossWerbungskosten,
    standardPauschbetrag,
    netDeductionAbovePauschbetrag,
    effectiveTaxDeduction,
    marginalTaxRate,
    estimatedRefundBoost,
    items,
    statutoryReferences: Array.from(new Set(statutoryReferences)),
    auditSafetyScore: auditScore,
    auditSafetyNotes: auditNotes,
    calculatedAt: new Date().toISOString(),
  };
}
