import * as text from "../../../../kit/text.js";
import { WeightedMacroScore } from "./weighted-macro-score.js";

/** How screens and exports show a weighted macro score. */
export class WeightedMacroScoreView {
  code: string;
  label: string;
  locale: string;
  openRate: string;
  maximum: string;
  quantity: string;
  sequenceText: string;
  campaignRef: string;
  bidText: string;
  variant: string;
  minimum: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    locale: string,
    openRate: string,
    maximum: string,
    quantity: string,
    sequenceText: string,
    campaignRef: string,
    bidText: string,
    variant: string,
    minimum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.openRate = openRate;
    this.maximum = maximum;
    this.quantity = quantity;
    this.sequenceText = sequenceText;
    this.campaignRef = campaignRef;
    this.bidText = bidText;
    this.variant = variant;
    this.minimum = minimum;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedMacroScoreView(item: WeightedMacroScore): WeightedMacroScoreView {
  return new WeightedMacroScoreView(
    text.truncate(item.code, 120),
    text.truncate(item.label, 120),
    item.locale,
    item.openRate.toFixed(2),
    item.maximum.toFixed(2),
    String(item.quantity),
    String(item.sequence),
    item.campaignRef,
    item.bid.toFixed(2),
    item.variant,
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedMacroScoreViews(items: WeightedMacroScore[]): WeightedMacroScoreView[] {
  const views: WeightedMacroScoreView[] = [];
  for (const item of items) {
    views.push(toWeightedMacroScoreView(item));
  }
  return views;
}

export function sumWeightedMacroScoreView(view: WeightedMacroScoreView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedOpenRate + parsedMaximum + parsedQuantity;
}
