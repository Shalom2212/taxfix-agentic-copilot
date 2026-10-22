export type RelocationType = 'none' | 'single' | 'married';

export type EquipmentCategory = 'digital_hardware' | 'software' | 'office_furniture' | 'other';

export interface EquipmentItem {
  id: string;
  name: string;
  cost: number;
  category: EquipmentCategory;
  workUsePercentage?: number; // 0 - 100
}

export interface TaxInputParameters {
  homeOfficeDays: number; // max 210 days
  relocationType: RelocationType;
  additionalDependents?: number; // €643 per dependent
  equipmentCosts?: number; // total lump-sum equipment
  equipmentItems?: EquipmentItem[];
  workUsePercentage?: number; // Default 100% (e.g. tech gear) or 50% for mixed
  includeInternetAllowance?: boolean; // €20/mo max €240/yr (§ 9 Abs. 1 Nr. 6 EStG)
  marginalTaxRate?: number; // e.g. 0.40 (40%)
  annualGrossIncome?: number; // e.g. 75000
}

export interface TaxDeductionItem {
  id: string;
  category: 'homeoffice' | 'relocation' | 'equipment' | 'telecom' | 'other';
  title: string;
  germanTitle: string;
  statutoryCitation: string;
  amount: number;
  breakdownFormula: string;
  taxTip: string;
  isCapped?: boolean;
}

export interface TaxCalculationResult {
  grossWerbungskosten: number; // Total itemized Werbungskosten
  standardPauschbetrag: number; // €1,230 standard Arbeitnehmer-Pauschbetrag
  netDeductionAbovePauschbetrag: number; // Max(0, gross - 1230)
  effectiveTaxDeduction: number; // Total deduction taken into account
  marginalTaxRate: number; // e.g. 0.40
  estimatedRefundBoost: number; // marginalTaxRate * grossWerbungskosten (or net above pauschale)
  items: TaxDeductionItem[];
  statutoryReferences: string[];
  auditSafetyScore: number; // 0 - 100
  auditSafetyNotes: string[];
  calculatedAt: string;
}

export interface ToolCallPayload {
  name: 'calculate_german_deductions';
  parameters: {
    relocationType: RelocationType;
    homeOfficeDays: number;
    equipmentCosts: number;
    additionalDependents?: number;
    equipmentItems?: EquipmentItem[];
    workUsePercentage?: number;
    includeInternetAllowance?: boolean;
    marginalTaxRate?: number;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  toolCall?: {
    name: string;
    parameters: Record<string, any>;
    status: 'pending' | 'success' | 'failed';
    summary?: string;
  };
  calculationSnapshot?: TaxCalculationResult;
}
