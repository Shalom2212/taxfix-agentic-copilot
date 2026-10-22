/**
 * German Statutory Tax Constants (Werbungskosten)
 * Governed by Einkommensteuergesetz (EStG) and Bundesfinanzministerium (BMF) regulations.
 */

export const TAX_CONSTANTS = {
  // Employee standard deduction (§ 9a EStG)
  ARBEITNEHMER_PAUSCHBETRAG: 1230,

  // Home Office Flat Rate (§ 4 Abs. 5 Satz 1 Nr. 6b Satz 4 i.V.m. § 9 Abs. 5 EStG)
  HOMEOFFICE: {
    RATE_PER_DAY: 6.0, // €6 per day
    MAX_DAYS: 210, // Max 210 days per calendar year
    MAX_ANNUAL_AMOUNT: 1260, // 210 * €6 = €1,260
    CITATION: '§ 4 Abs. 5 Satz 1 Nr. 6b Satz 4 EStG',
    DESCRIPTION: 'Homeoffice-Pauschale: €6 pro Tag, max. 210 Tage (€1.260)',
  },

  // Job-Related Relocation Flat Rate (Umzugskostenpauschale nach BUKG & BMF)
  RELOCATION: {
    SINGLE_AMOUNT: 964, // Valid since March 1, 2024
    MARRIED_AMOUNT: 1928, // 2 * €964
    PER_DEPENDENT_AMOUNT: 643, // Per child / additional household member
    CITATION: '§ 9 Abs. 1 Satz 1 EStG i.V.m. BUKG & BMF BStBl I',
    DESCRIPTION: 'Pauschbetrag für sonstige Umzugsauslagen bei beruflich veranlasstem Wohnungswechsel',
  },

  // Digital Equipment Depreciation (BMF 2022-02-22)
  EQUIPMENT: {
    GWG_THRESHOLD_NET: 800, // Geringwertige Wirtschaftsgüter
    GWG_THRESHOLD_GROSS: 952, // with 19% German VAT
    DIGITAL_USEFUL_LIFE_YEARS: 1, // 1-year deemed useful life (Sofortabschreibung)
    DEFAULT_TECH_WORK_PERCENTAGE: 100, // 100% for full software dev / remote setup
    MIXED_USE_PERCENTAGE: 50, // 50% standard assumption without log
    CITATION: '§ 9 Abs. 1 Nr. 6 EStG & BMF BStBl I 2022 S. 187',
    DESCRIPTION: 'Arbeitsmittel & Sofortabschreibung für Computerhardware und Software',
  },

  // Telecommunications allowance
  TELECOM: {
    MONTHLY_MAX: 20, // 20% of monthly bill, max €20/month
    ANNUAL_MAX: 240, // 12 * €20 = €240
    CITATION: '§ 9 Abs. 1 Nr. 6 EStG i.V.m. R 9.1 LStR',
    DESCRIPTION: 'Beruflicher Anteil Telefon- und Internetkosten (Pauschale 20%, max. 240 €/Jahr)',
  },

  // Marginal Tax Defaults
  TAX_RATES: {
    DEFAULT_MARGINAL_RATE: 0.40, // 40% typical tech bracket (€65k - €85k)
    OPTIONS: [
      { label: '35% (Junior / Expat Entry ~€50k)', value: 0.35 },
      { label: '40% (Mid-Senior Dev ~€75k)', value: 0.40 },
      { label: '42% (Staff / Lead ~€95k+)', value: 0.42 },
      { label: '45% (Executive / Top Bracket €277k+)', value: 0.45 },
    ],
  },
} as const;
