import { calculateDeductions } from './taxEngine';
import {
  ChatMessage,
  EquipmentItem,
  RelocationType,
  TaxCalculationResult,
  TaxInputParameters,
  ToolCallPayload,
} from '../types/tax';

/**
 * Formal Agentic Tool Definition conforming to standard LLM Function Calling Schema
 * (OpenAI / Anthropic / Gemini compatible).
 */
export const CALCULATE_GERMAN_DEDUCTIONS_TOOL = {
  name: 'calculate_german_deductions' as const,
  description:
    'Computes official German tax deductions (Werbungskosten) and estimated tax refund impact for employees and expats according to EStG statutory rules (Homeoffice-Pauschale § 4 Abs. 5 EStG, Umzugskostenpauschale § 9 EStG, and BMF Digital Hardware Depreciation).',
  parameters: {
    type: 'object',
    properties: {
      relocationType: {
        type: 'string',
        enum: ['none', 'single', 'married'],
        description:
          "Job-related relocation status. 'single' claims €964 flat rate; 'married' claims €1,928.",
      },
      additionalDependents: {
        type: 'number',
        description: 'Number of dependents moving with the taxpayer (€643 per dependent).',
      },
      homeOfficeDays: {
        type: 'number',
        description: 'Number of days worked exclusively from home (capped at 210 days @ €6/day).',
      },
      equipmentCosts: {
        type: 'number',
        description: 'Total cost of work equipment, laptops, monitors, or tech gear purchased in EUR.',
      },
      workUsePercentage: {
        type: 'number',
        description: 'Percentage of equipment used for business (e.g. 100 for dev gear, 50 for mixed use).',
      },
      includeInternetAllowance: {
        type: 'boolean',
        description: 'Whether to include remote telecommunications allowance (€20/mo = €240/yr).',
      },
      marginalTaxRate: {
        type: 'number',
        description: 'Estimated marginal tax bracket (e.g. 0.35, 0.40, 0.42). Defaults to 0.40.',
      },
    },
    required: ['relocationType', 'homeOfficeDays', 'equipmentCosts'],
  },
};

/**
 * Pre-defined high-intent prompt chips matching common German tech & expat scenarios.
 */
export const PROMPT_CHIPS = [
  {
    id: 'berlin-expat',
    label: 'Berlin Expat Relocation + Tech Setup',
    icon: 'airplane',
    prompt:
      'I moved to Berlin for a software job as a single engineer, bought a €1,400 MacBook Pro and a €400 monitor, and worked 150 days from home.',
    badge: 'Popular for Expats',
  },
  {
    id: 'remote-fullstack',
    label: 'Remote Fullstack Dev (180 WFH days + Monitor)',
    icon: 'laptop',
    prompt:
      'I am a remote fullstack dev, worked 180 days from home, bought a €650 ultra-wide monitor, and claim the standard internet allowance.',
    badge: 'Remote Tech',
  },
  {
    id: 'freelancer-switch',
    label: 'Freelancer to Full-Time Employee switch',
    icon: 'swap-horizontal',
    prompt:
      'I switched from freelance to a permanent tech role in Hamburg, moved apartments with my spouse, worked 220 home office days, and purchased €2,100 of tech hardware.',
    badge: 'Relocation + High Cap',
  },
];

/**
 * Deterministic intent parser extracting structured parameters from natural language.
 * Ensures the agent works standalone in Expo Web / Snack without requiring external API keys.
 */
export function parseIntentFromPrompt(
  prompt: string,
  existingParams?: Partial<TaxInputParameters>
): TaxInputParameters {
  const text = prompt.toLowerCase();

  // 1. Relocation Detection
  let relocationType: RelocationType = existingParams?.relocationType ?? 'none';
  let additionalDependents = existingParams?.additionalDependents ?? 0;

  const hasRelocationKeyword =
    text.includes('moved') ||
    text.includes('relocat') ||
    text.includes('moving') ||
    text.includes('apartment') ||
    text.includes('berlin') ||
    text.includes('munich') ||
    text.includes('hamburg') ||
    text.includes('frankfurt') ||
    text.includes('germany');

  if (hasRelocationKeyword && !text.includes('did not move') && !text.includes('no relocation') && !text.includes('no move')) {
    if (text.includes('married') || text.includes('spouse') || text.includes('wife') || text.includes('husband') || text.includes('partner')) {
      relocationType = 'married';
    } else {
      relocationType = 'single';
    }
  }

  // Dependent cues
  const kidsMatch = text.match(/(\d+)\s*(kids?|children|child|dependents?)/);
  if (kidsMatch) {
    additionalDependents = parseInt(kidsMatch[1], 10);
  }

  // 2. Home Office Days Detection
  let homeOfficeDays = existingParams?.homeOfficeDays ?? 0;
  // Match patterns like "140 days", "180 wfh days", "worked 150 days", "220 home office days", "wfh 120"
  const wfhMatch =
    text.match(/(\d+)\s*(?:days?\s*(?:from\s*home|wfh|home\s*office)?|wfh\s*days?|home\s*office\s*days?)/) ||
    text.match(/(?:worked|wfh|home\s*office)\s*(?:for)?\s*(\d+)\s*days?/);

  if (wfhMatch) {
    homeOfficeDays = parseInt(wfhMatch[1], 10);
  } else if (text.includes('full remote') || text.includes('remote fullstack') || text.includes('fully remote')) {
    // Standard full remote assumption: 180 days (allowing for holidays and sick leave)
    homeOfficeDays = 180;
  }

  // 3. Equipment Costs Detection
  let equipmentCosts = existingParams?.equipmentCosts ?? 0;
  const equipmentItems: EquipmentItem[] = [];

  // Match euro figures: e.g. "€1,200", "€1400", "1200 euro", "€ 650", "2,100 of new hardware"
  const euroMatches = Array.from(
    text.matchAll(/(?:€\s*|eur\s*|euro\s*)?([0-9]{1,3}(?:[,.][0-9]{3})*|[0-9]+)\s*(?:€|eur|euros?|\s*(?:for|on)?\s*(?:a\s*)?(?:macbook|laptop|monitor|desk|chair|hardware|equipment|setup|pc|computer))/gi)
  );

  let extractedSum = 0;
  const processedMatches: number[] = [];

  // Specific item patterns
  const macbookMatch = text.match(/(?:€\s*|eur\s*)?([0-9]{1,2}[,.]?[0-9]{3}|[0-9]{3,4})\s*(?:€|eur)?\s*(?:[\w-]+\s+)*(?:macbook|laptop)/i);
  if (macbookMatch) {
    const val = parseCurrencyNumber(macbookMatch[1]);
    if (val >= 100) {
      equipmentItems.push({
        id: 'eq_laptop',
        name: 'Developer Laptop / MacBook',
        cost: val,
        category: 'digital_hardware',
        workUsePercentage: 100,
      });
      processedMatches.push(val);
      extractedSum += val;
    }
  }

  const monitorMatch = text.match(/(?:€\s*|eur\s*)?([0-9]{1,2}[,.]?[0-9]{3}|[0-9]{2,4})\s*(?:€|eur)?\s*(?:[\w-]+\s+)*(?:monitor|display|screen)/i);
  if (monitorMatch) {
    const val = parseCurrencyNumber(monitorMatch[1]);
    if (val >= 50 && !processedMatches.includes(val)) {
      equipmentItems.push({
        id: 'eq_monitor',
        name: 'External Display / 4K Monitor',
        cost: val,
        category: 'digital_hardware',
        workUsePercentage: 100,
      });
      processedMatches.push(val);
      extractedSum += val;
    }
  }

  const hardwareMatch = text.match(/(?:€\s*|eur\s*)?([0-9]{1,2}[,.]?[0-9]{3}|[0-9]{2,4})\s*(?:€|eur)?\s*(?:of\s*(?:[\w-]+\s+)*)?(?:hardware|tech\s*gear|setup|equipment)/i);
  if (hardwareMatch) {
    const val = parseCurrencyNumber(hardwareMatch[1]);
    if (val >= 100 && !processedMatches.includes(val)) {
      equipmentItems.push({
        id: 'eq_hardware',
        name: 'Tech Hardware & Peripherals',
        cost: val,
        category: 'digital_hardware',
        workUsePercentage: 100,
      });
      processedMatches.push(val);
      extractedSum += val;
    }
  }

  // Fallback to general euro numbers if specific items not captured
  if (extractedSum === 0 && euroMatches.length > 0) {
    for (const match of euroMatches) {
      const val = parseCurrencyNumber(match[1]);
      // Avoid matching days (like 140 or 180) if they match day patterns
      if (val >= 250 && val !== homeOfficeDays) {
        extractedSum += val;
      }
    }
  }

  equipmentCosts = extractedSum > 0 ? extractedSum : equipmentCosts;

  // 4. Telecommunications
  let includeInternetAllowance = existingParams?.includeInternetAllowance ?? false;
  if (text.includes('internet') || text.includes('phone') || text.includes('remote internet') || text.includes('telecom')) {
    includeInternetAllowance = true;
  }

  // 5. Marginal Tax Rate
  let marginalTaxRate = existingParams?.marginalTaxRate ?? 0.40;
  const taxRateMatch = text.match(/(?:marginal\s*tax\s*(?:rate|bracket)?|tax\s*bracket)?\s*(35|38|40|42|45)\s*%/);
  if (taxRateMatch) {
    marginalTaxRate = parseInt(taxRateMatch[1], 10) / 100;
  }

  return {
    homeOfficeDays,
    relocationType,
    additionalDependents,
    equipmentCosts,
    equipmentItems: equipmentItems.length > 0 ? equipmentItems : undefined,
    workUsePercentage: 100,
    includeInternetAllowance,
    marginalTaxRate,
  };
}

export function parseCurrencyNumber(raw: string): number {
  if (!raw) return 0;
  let s = raw.trim();
  // 1,400 or 1.400 (thousands separator with 3 trailing zeros/digits)
  if (/^\d{1,3}[,.]\d{3}$/.test(s)) {
    s = s.replace(/[,.]/, '');
    return parseFloat(s) || 0;
  }
  // 1.400,50
  if (/^\d{1,3}\.\d{3},\d{2}$/.test(s)) {
    s = s.replace(/\./g, '').replace(',', '.');
    return parseFloat(s) || 0;
  }
  // 1,400.50
  if (/^\d{1,3},\d{3}\.\d{2}$/.test(s)) {
    s = s.replace(/,/g, '');
    return parseFloat(s) || 0;
  }
  // Standard float / integer
  const clean = s.replace(/,/g, '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

/**
 * Generates an agentic response stream / message object simulating an LLM tool-calling cycle.
 */
export async function executeCopilotQuery(
  userQuery: string,
  currentParams?: Partial<TaxInputParameters>
): Promise<{
  toolCallPayload: ToolCallPayload;
  calculationResult: TaxCalculationResult;
  copilotMessage: ChatMessage;
}> {
  // Simulate asynchronous agent processing delay for realistic UX (350ms)
  await new Promise(resolve => setTimeout(resolve, 350));

  // Parse structured arguments from user prompt
  const parsedParams = parseIntentFromPrompt(userQuery, currentParams);

  // Prepare standard Tool-Call payload
  const toolCallPayload: ToolCallPayload = {
    name: 'calculate_german_deductions',
    parameters: {
      relocationType: parsedParams.relocationType,
      homeOfficeDays: parsedParams.homeOfficeDays,
      equipmentCosts: parsedParams.equipmentCosts || 0,
      additionalDependents: parsedParams.additionalDependents,
      equipmentItems: parsedParams.equipmentItems,
      workUsePercentage: parsedParams.workUsePercentage,
      includeInternetAllowance: parsedParams.includeInternetAllowance,
      marginalTaxRate: parsedParams.marginalTaxRate,
    },
  };

  // Deterministically execute the German tax calculation engine
  const calculationResult = calculateDeductions(parsedParams);

  // Synthesize rich conversational guidance
  const conversationalText = buildAgentExplanation(parsedParams, calculationResult);

  const copilotMessage: ChatMessage = {
    id: `msg_${Date.now()}`,
    sender: 'assistant',
    text: conversationalText,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    toolCall: {
      name: 'calculate_german_deductions',
      parameters: toolCallPayload.parameters,
      status: 'success',
      summary: `Computed €${calculationResult.grossWerbungskosten.toLocaleString('de-DE')} deductions (+€${calculationResult.estimatedRefundBoost.toLocaleString('de-DE')} refund boost)`,
    },
    calculationSnapshot: calculationResult,
  };

  return {
    toolCallPayload,
    calculationResult,
    copilotMessage,
  };
}

/**
 * Builds conversational response explaining statutory deductions in clean English + German tax terminology.
 */
function buildAgentExplanation(
  params: TaxInputParameters,
  res: TaxCalculationResult
): string {
  const bullets: string[] = [];

  // Home office bullet
  if (params.homeOfficeDays > 0) {
    const ho = res.items.find(i => i.id === 'ho_pauschale');
    if (ho) {
      if (ho.isCapped) {
        bullets.push(
          `🏠 **Home Office (€1,260 max reached)**: You logged ${params.homeOfficeDays} days, capped at the legal maximum of 210 days @ €6/day (*§ 4 Abs. 5 Satz 1 Nr. 6b EStG*).`
        );
      } else {
        bullets.push(
          `🏠 **Home Office (€${ho.amount})**: ${params.homeOfficeDays} days @ €6.00/day (*§ 4 Abs. 5 EStG*). No dedicated study room required!`
        );
      }
    }
  }

  // Relocation bullet
  if (params.relocationType !== 'none') {
    const rel = res.items.find(i => i.id === 'umzug_pauschale');
    if (rel) {
      bullets.push(
        `📦 **Relocation Flat Rate (€${rel.amount.toLocaleString('de-DE')})**: Claiming statutory *Umzugskostenpauschale* for ${params.relocationType} expat relocation (*§ 9 Abs. 1 EStG*). No individual moving receipts needed.`
      );
    }
  }

  // Equipment bullet
  if ((params.equipmentCosts || 0) > 0) {
    const eq = res.items.find(i => i.id === 'arbeitsmittel');
    if (eq) {
      bullets.push(
        `💻 **Tech Work Equipment (€${eq.amount.toLocaleString('de-DE')})**: Under the BMF digital depreciation guidelines (*BMF 22.02.2022*), your software hardware is eligible for **100% immediate write-off** in year 1.`
      );
    }
  }

  // Internet bullet
  if (params.includeInternetAllowance) {
    bullets.push(
      `🌐 **Remote Telecommunications (€240)**: Standard €20/month flat rate claimed (*R 9.1 LStR*).`
    );
  }

  const comparisonNote =
    res.grossWerbungskosten > res.standardPauschbetrag
      ? `Your itemized total of **€${res.grossWerbungskosten.toLocaleString('de-DE')}** exceeds the German standard employee allowance (*Arbeitnehmer-Pauschbetrag* of €1,230) by **€${res.netDeductionAbovePauschbetrag.toLocaleString('de-DE')}**!`
      : `Your deductions stand at **€${res.grossWerbungskosten.toLocaleString('de-DE')}**. Note that every German employee automatically receives the €1,230 Pauschbetrag if itemized costs are lower.`;

  return `I parsed your setup and executed statutory deduction calculations via **\`calculate_german_deductions\`**.\n\n` +
    `### Key Deductions Identified:\n` +
    bullets.map(b => `- ${b}`).join('\n') +
    `\n\n${comparisonNote}\n\n` +
    `💡 **Estimated Refund Boost:** **+€${res.estimatedRefundBoost.toLocaleString('de-DE')}** (at a ${(res.marginalTaxRate * 100).toFixed(0)}% marginal tax bracket). Audit safety rating is **${res.auditSafetyScore}%**.`;
}
