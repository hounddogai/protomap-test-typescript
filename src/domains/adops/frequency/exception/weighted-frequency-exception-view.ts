import * as text from "../../../../kit/text.js";
import { WeightedFrequencyException } from "./weighted-frequency-exception.js";

/** How screens and exports show a weighted frequency exception. */
export class WeightedFrequencyExceptionView {
  code: string;
  label: string;
  ceilingText: string;
  sendAt: string;
  cohort: string;
  campaignRefText: string;
  weight: string;
  amountText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    ceilingText: string,
    sendAt: string,
    cohort: string,
    campaignRefText: string,
    weight: string,
    amountText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.ceilingText = ceilingText;
    this.sendAt = sendAt;
    this.cohort = cohort;
    this.campaignRefText = campaignRefText;
    this.weight = weight;
    this.amountText = amountText;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedFrequencyExceptionView(item: WeightedFrequencyException): WeightedFrequencyExceptionView {
  return new WeightedFrequencyExceptionView(
    text.truncate(item.code, 120),
    item.label,
    item.ceiling.toFixed(2),
    String(item.sendAt),
    text.truncate(item.cohort, 120),
    item.campaignRef,
    item.weight.toFixed(2),
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedFrequencyExceptionViews(items: WeightedFrequencyException[]): WeightedFrequencyExceptionView[] {
  const views: WeightedFrequencyExceptionView[] = [];
  for (const item of items) {
    views.push(toWeightedFrequencyExceptionView(item));
  }
  return views;
}

export function sumWeightedFrequencyExceptionView(view: WeightedFrequencyExceptionView): number {
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedCeiling + parsedSendAt + parsedWeight;
}
