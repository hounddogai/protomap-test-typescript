import * as text from "../../../../kit/text.js";
import { FrequencyTier } from "./frequency-tier.js";

/** How screens and exports show a frequency tier. */
export class FrequencyTierView {
  code: string;
  label: string;
  approved: string;
  description: string;
  region: string;
  utmSource: string;
  amount: string;
  source: string;
  weightText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    approved: string,
    description: string,
    region: string,
    utmSource: string,
    amount: string,
    source: string,
    weightText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.approved = approved;
    this.description = description;
    this.region = region;
    this.utmSource = utmSource;
    this.amount = amount;
    this.source = source;
    this.weightText = weightText;
    this.statusLabel = statusLabel;
  }
}

export function toFrequencyTierView(item: FrequencyTier): FrequencyTierView {
  return new FrequencyTierView(
    item.code,
    item.label,
    `${item.approved}`,
    text.truncate(item.description, 40),
    text.truncate(item.region, 40),
    item.utmSource,
    item.amount.toFixed(2),
    item.source,
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFrequencyTierViews(items: FrequencyTier[]): FrequencyTierView[] {
  const views: FrequencyTierView[] = [];
  for (const item of items) {
    views.push(toFrequencyTierView(item));
  }
  return views;
}

export function sumFrequencyTierView(view: FrequencyTierView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  return parsedAmount + parsedWeight;
}
