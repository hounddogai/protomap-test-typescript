import * as text from "../../../../kit/text.js";
import { FrequencySlot } from "./frequency-slot.js";

/** How screens and exports show a frequency slot. */
export class FrequencySlotView {
  codeText: string;
  label: string;
  externalRef: string;
  pinned: string;
  currencyText: string;
  discount: string;
  activeText: string;
  impressions: string;
  budgetText: string;
  limit: string;
  locale: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    externalRef: string,
    pinned: string,
    currencyText: string,
    discount: string,
    activeText: string,
    impressions: string,
    budgetText: string,
    limit: string,
    locale: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.externalRef = externalRef;
    this.pinned = pinned;
    this.currencyText = currencyText;
    this.discount = discount;
    this.activeText = activeText;
    this.impressions = impressions;
    this.budgetText = budgetText;
    this.limit = limit;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toFrequencySlotView(item: FrequencySlot): FrequencySlotView {
  return new FrequencySlotView(
    text.truncate(item.code, 120),
    item.label,
    text.truncate(item.externalRef, 80),
    `${item.pinned}`,
    text.truncate(item.currency, 40),
    item.discount.toFixed(2),
    `${item.active}`,
    String(item.impressions),
    item.budget.toFixed(2),
    String(item.limit),
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toFrequencySlotViews(items: FrequencySlot[]): FrequencySlotView[] {
  const views: FrequencySlotView[] = [];
  for (const item of items) {
    views.push(toFrequencySlotView(item));
  }
  return views;
}

export function sumFrequencySlotView(view: FrequencySlotView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedDiscount + parsedImpressions + parsedBudget;
}
