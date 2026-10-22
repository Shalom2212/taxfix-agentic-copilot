import { describe, it, expect } from '@jest/globals';
import {
  executeCopilotQuery,
  parseIntentFromPrompt,
  PROMPT_CHIPS,
} from './copilotService';

describe('Agentic Copilot Service & Intent Parser', () => {
  it('correctly parses Berlin expat prompt chip', () => {
    const chip = PROMPT_CHIPS.find(c => c.id === 'berlin-expat');
    expect(chip).toBeDefined();

    const params = parseIntentFromPrompt(chip!.prompt);
    expect(params.relocationType).toBe('single');
    expect(params.homeOfficeDays).toBe(150);
    // €1,400 + €400 = 1800
    expect(params.equipmentCosts).toBe(1800);
    expect(params.marginalTaxRate).toBe(0.40);
  });

  it('correctly parses remote fullstack developer prompt', () => {
    const chip = PROMPT_CHIPS.find(c => c.id === 'remote-fullstack');
    const params = parseIntentFromPrompt(chip!.prompt);
    expect(params.homeOfficeDays).toBe(180);
    expect(params.equipmentCosts).toBe(650);
    expect(params.includeInternetAllowance).toBe(true);
  });

  it('correctly parses married relocation with partner and capped WFH days', () => {
    const chip = PROMPT_CHIPS.find(c => c.id === 'freelancer-switch');
    const params = parseIntentFromPrompt(chip!.prompt);
    expect(params.relocationType).toBe('married');
    expect(params.homeOfficeDays).toBe(220);
    expect(params.equipmentCosts).toBe(2100);
  });

  it('executes copilot query with tool call payload and returns calculation snapshot', async () => {
    const userPrompt =
      'I moved to Berlin for a software job, bought a €1,200 MacBook, and worked from home 140 days.';
    const result = await executeCopilotQuery(userPrompt);

    expect(result.toolCallPayload.name).toBe('calculate_german_deductions');
    expect(result.toolCallPayload.parameters.relocationType).toBe('single');
    expect(result.toolCallPayload.parameters.homeOfficeDays).toBe(140);
    expect(result.toolCallPayload.parameters.equipmentCosts).toBe(1200);

    // Relocation €964 + WFH (140 * 6 = €840) + Equipment €1200 = €3004
    expect(result.calculationResult.grossWerbungskosten).toBe(3004);
    expect(result.copilotMessage.sender).toBe('assistant');
    expect(result.copilotMessage.toolCall?.name).toBe('calculate_german_deductions');
    expect(result.copilotMessage.text).toContain('calculate_german_deductions');
  });
});
