import * as text from "../../../../kit/text.js";
import { WeightedWarmupThreshold } from "./weighted-warmup-threshold.js";

/** How screens and exports show a weighted warmup threshold. */
export class WeightedWarmupThresholdView {
  code: string;
  labelText: string;
  region: string;
  conversionRate: string;
  source: string;
  ceilingText: string;
  durationMinutes: string;
  phoneText: string;
  cost: string;
  checksum: string;
  frequencyCapText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    region: string,
    conversionRate: string,
    source: string,
    ceilingText: string,
    durationMinutes: string,
    phoneText: string,
    cost: string,
    checksum: string,
    frequencyCapText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.region = region;
    this.conversionRate = conversionRate;
    this.source = source;
    this.ceilingText = ceilingText;
    this.durationMinutes = durationMinutes;
    this.phoneText = phoneText;
    this.cost = cost;
    this.checksum = checksum;
    this.frequencyCapText = frequencyCapText;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedWarmupThresholdView(item: WeightedWarmupThreshold): WeightedWarmupThresholdView {
  return new WeightedWarmupThresholdView(
    item.code,
    text.truncate(item.label, 40),
    item.region,
    item.conversionRate.toFixed(2),
    item.source,
    item.ceiling.toFixed(2),
    String(item.durationMinutes),
    item.phone,
    item.cost.toFixed(2),
    item.checksum,
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedWarmupThresholdViews(items: WeightedWarmupThreshold[]): WeightedWarmupThresholdView[] {
  const views: WeightedWarmupThresholdView[] = [];
  for (const item of items) {
    views.push(toWeightedWarmupThresholdView(item));
  }
  return views;
}

export function sumWeightedWarmupThresholdView(view: WeightedWarmupThresholdView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedConversionRate + parsedCeiling + parsedDurationMinutes;
}
