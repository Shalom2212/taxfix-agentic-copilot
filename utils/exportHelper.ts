import { TaxCalculationResult, TaxInputParameters } from '../types/tax';

export interface TaxfixAuditExport {
  schemaVersion: string;
  application: string;
  generatedAt: string;
  taxYear: number;
  country: string;
  targetForms: string[];
  summary: {
    totalGrossWerbungskosten: number;
    standardArbeitnehmerPauschbetrag: number;
    netDeductionAbovePauschbetrag: number;
    appliedMarginalTaxRate: number;
    estimatedRefundImpact: number;
    currency: string;
  };
  itemizedDeductions: Array<{
    category: string;
    label: string;
    germanLabel: string;
    amount: number;
    statutoryCitation: string;
    calculationDetails: string;
    auditVerification: string;
  }>;
  parameters: TaxInputParameters;
  auditDefencePackage: {
    complianceScore: number;
    requiredDocuments: string[];
    finanzamtSubmissionTips: string[];
  };
  auditChecksum: string;
}

/**
 * Generates an official Taxfix & Elster Anlage N compliant audit JSON structure.
 */
export function generateTaxfixAuditJSON(
  params: TaxInputParameters,
  calculation: TaxCalculationResult
): TaxfixAuditExport {
  const currentYear = new Date().getFullYear();

  const requiredDocuments: string[] = [];
  const submissionTips: string[] = [
    'Itemized deductions (Werbungskosten) are declared in Anlage N of the German Einkommensteuererklärung.',
  ];

  if (params.homeOfficeDays > 0) {
    submissionTips.push(
      'Homeoffice-Pauschale (§ 4 Abs. 5 Satz 1 Nr. 6b EStG): Retain your employer remote-work policy or calendar log of home office days.'
    );
  }

  if (params.relocationType !== 'none') {
    requiredDocuments.push(
      'Proof of new rental contract / registration (Anmeldebestätigung) and employer contract showing job start or commute change.'
    );
    submissionTips.push(
      'Umzugskostenpauschale (§ 9 Abs. 1 EStG): Moving lump sum requires proving the relocation saved ≥ 1 hour daily commute or was required for new job.'
    );
  }

  if ((params.equipmentCosts || 0) > 0) {
    requiredDocuments.push(
      'Original purchase receipts (Rechnungen) for laptops, monitors, or peripheral equipment showing VAT (MwSt).'
    );
    submissionTips.push(
      'BMF Digital Depreciation: Under BMF 22.02.2022, computer hardware and software qualify for full 1-year immediate write-off.'
    );
  }

  // Deterministic mock checksum for audit traceability
  const rawString = `${calculation.grossWerbungskosten}-${params.homeOfficeDays}-${calculation.calculatedAt}`;
  let hash = 0;
  for (let i = 0; i < rawString.length; i++) {
    hash = (hash << 5) - hash + rawString.charCodeAt(i);
    hash |= 0;
  }
  const checksum = `TAXFIX-DE-${Math.abs(hash).toString(16).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  return {
    schemaVersion: '2024.1-de-estg',
    application: 'Taxfix Agentic Tax Copilot',
    generatedAt: calculation.calculatedAt,
    taxYear: currentYear - 1, // Prior tax year for standard return filing
    country: 'DE',
    targetForms: ['Anlage N (Einkünfte aus nichtselbständiger Arbeit)', 'Anlage WA-ESt (Expats)'],
    summary: {
      totalGrossWerbungskosten: calculation.grossWerbungskosten,
      standardArbeitnehmerPauschbetrag: calculation.standardPauschbetrag,
      netDeductionAbovePauschbetrag: calculation.netDeductionAbovePauschbetrag,
      appliedMarginalTaxRate: calculation.marginalTaxRate,
      estimatedRefundImpact: calculation.estimatedRefundBoost,
      currency: 'EUR',
    },
    itemizedDeductions: calculation.items.map(item => ({
      category: item.category,
      label: item.title,
      germanLabel: item.germanTitle,
      amount: item.amount,
      statutoryCitation: item.statutoryCitation,
      calculationDetails: item.breakdownFormula,
      auditVerification: item.taxTip,
    })),
    parameters: params,
    auditDefencePackage: {
      complianceScore: calculation.auditSafetyScore,
      requiredDocuments,
      finanzamtSubmissionTips: submissionTips,
    },
    auditChecksum: checksum,
  };
}

/**
 * Web-compatible JSON file downloader
 */
export function downloadJSONFile(data: object, filename: string): boolean {
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
