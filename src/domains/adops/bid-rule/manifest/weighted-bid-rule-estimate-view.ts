import * as text from "../../../../kit/text.js";
import { WeightedBidRuleEstimate } from "./weighted-bid-rule-estimate.js";

/** How screens and exports show a weighted bid rule estimate. */
export class WeightedBidRuleEstimateView {
  code: string;
  label: string;
  impressions: string;
  locale: string;
  notes: string;
  startsAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    impressions: string,
    locale: string,
    notes: string,
    startsAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.locale = locale;
    this.notes = notes;
    this.startsAtText = startsAtText;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedBidRuleEstimateView(item: WeightedBidRuleEstimate): WeightedBidRuleEstimateView {
  return new WeightedBidRuleEstimateView(
    item.code,
    text.truncate(item.label, 64),
    String(item.impressions),
    text.truncate(item.locale, 120),
    item.notes,
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedBidRuleEstimateViews(items: WeightedBidRuleEstimate[]): WeightedBidRuleEstimateView[] {
  const views: WeightedBidRuleEstimateView[] = [];
  for (const item of items) {
    views.push(toWeightedBidRuleEstimateView(item));
  }
  return views;
}

export function sumWeightedBidRuleEstimateView(view: WeightedBidRuleEstimateView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  return parsedImpressions + parsedStartsAt;
}
