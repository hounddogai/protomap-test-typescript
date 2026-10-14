import * as text from "../../../../kit/text.js";
import { WeightedFunnelAdjustment } from "./weighted-funnel-adjustment.js";

/** How screens and exports show a weighted funnel adjustment. */
export class WeightedFunnelAdjustmentView {
  code: string;
  label: string;
  score: string;
  localeText: string;
  frequencyCap: string;
  attempts: string;
  conversionRate: string;
  ownerId: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    score: string,
    localeText: string,
    frequencyCap: string,
    attempts: string,
    conversionRate: string,
    ownerId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.score = score;
    this.localeText = localeText;
    this.frequencyCap = frequencyCap;
    this.attempts = attempts;
    this.conversionRate = conversionRate;
    this.ownerId = ownerId;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedFunnelAdjustmentView(item: WeightedFunnelAdjustment): WeightedFunnelAdjustmentView {
  return new WeightedFunnelAdjustmentView(
    item.code,
    item.label,
    item.score.toFixed(2),
    text.truncate(item.locale, 64),
    String(item.frequencyCap),
    String(item.attempts),
    item.conversionRate.toFixed(2),
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedFunnelAdjustmentViews(items: WeightedFunnelAdjustment[]): WeightedFunnelAdjustmentView[] {
  const views: WeightedFunnelAdjustmentView[] = [];
  for (const item of items) {
    views.push(toWeightedFunnelAdjustmentView(item));
  }
  return views;
}

export function sumWeightedFunnelAdjustmentView(view: WeightedFunnelAdjustmentView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedScore + parsedFrequencyCap + parsedAttempts;
}
