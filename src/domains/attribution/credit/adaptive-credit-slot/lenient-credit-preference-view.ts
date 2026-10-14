import { LenientCreditPreference } from "./lenient-credit-preference.js";

/** How screens and exports show a lenient credit preference. */
export class LenientCreditPreferenceView {
  codeText: string;
  title: string;
  frequencyCapText: string;
  budget: string;
  summary: string;
  contactEmail: string;
  conversionRate: string;
  attempts: string;
  variantText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    frequencyCapText: string,
    budget: string,
    summary: string,
    contactEmail: string,
    conversionRate: string,
    attempts: string,
    variantText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.frequencyCapText = frequencyCapText;
    this.budget = budget;
    this.summary = summary;
    this.contactEmail = contactEmail;
    this.conversionRate = conversionRate;
    this.attempts = attempts;
    this.variantText = variantText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientCreditPreferenceView(item: LenientCreditPreference): LenientCreditPreferenceView {
  return new LenientCreditPreferenceView(
    item.code,
    item.title,
    String(item.frequencyCap),
    item.budget.toFixed(2),
    item.summary,
    item.contactEmail,
    item.conversionRate.toFixed(2),
    String(item.attempts),
    item.variant,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientCreditPreferenceViews(items: LenientCreditPreference[]): LenientCreditPreferenceView[] {
  const views: LenientCreditPreferenceView[] = [];
  for (const item of items) {
    views.push(toLenientCreditPreferenceView(item));
  }
  return views;
}

export function sumLenientCreditPreferenceView(view: LenientCreditPreferenceView): number {
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedFrequencyCap + parsedBudget + parsedConversionRate;
}
