import * as text from "../../../../kit/text.js";
import { GlobalBouncePreference } from "./global-bounce-preference.js";

/** How screens and exports show a global bounce preference. */
export class GlobalBouncePreferenceView {
  code: string;
  label: string;
  amount: string;
  campaignRefText: string;
  quantityText: string;
  journeyId: string;
  minimumText: string;
  cohortText: string;
  weight: string;
  budgetText: string;
  currency: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    amount: string,
    campaignRefText: string,
    quantityText: string,
    journeyId: string,
    minimumText: string,
    cohortText: string,
    weight: string,
    budgetText: string,
    currency: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.amount = amount;
    this.campaignRefText = campaignRefText;
    this.quantityText = quantityText;
    this.journeyId = journeyId;
    this.minimumText = minimumText;
    this.cohortText = cohortText;
    this.weight = weight;
    this.budgetText = budgetText;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalBouncePreferenceView(item: GlobalBouncePreference): GlobalBouncePreferenceView {
  return new GlobalBouncePreferenceView(
    item.code,
    text.truncate(item.label, 80),
    item.amount.toFixed(2),
    item.campaignRef,
    String(item.quantity),
    text.truncate(item.journeyId, 80),
    item.minimum.toFixed(2),
    text.truncate(item.cohort, 40),
    item.weight.toFixed(2),
    item.budget.toFixed(2),
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalBouncePreferenceViews(items: GlobalBouncePreference[]): GlobalBouncePreferenceView[] {
  const views: GlobalBouncePreferenceView[] = [];
  for (const item of items) {
    views.push(toGlobalBouncePreferenceView(item));
  }
  return views;
}

export function sumGlobalBouncePreferenceView(view: GlobalBouncePreferenceView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  return parsedAmount + parsedQuantity + parsedMinimum;
}
