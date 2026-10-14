import * as text from "../../../../kit/text.js";
import { WeightedPayoutTier } from "./weighted-payout-tier.js";

/** How screens and exports show a weighted payout tier. */
export class WeightedPayoutTierView {
  code: string;
  label: string;
  marginText: string;
  endsAt: string;
  externalRefText: string;
  threshold: string;
  expiresAt: string;
  title: string;
  category: string;
  rateText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    marginText: string,
    endsAt: string,
    externalRefText: string,
    threshold: string,
    expiresAt: string,
    title: string,
    category: string,
    rateText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.marginText = marginText;
    this.endsAt = endsAt;
    this.externalRefText = externalRefText;
    this.threshold = threshold;
    this.expiresAt = expiresAt;
    this.title = title;
    this.category = category;
    this.rateText = rateText;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedPayoutTierView(item: WeightedPayoutTier): WeightedPayoutTierView {
  return new WeightedPayoutTierView(
    item.code,
    item.label,
    item.margin.toFixed(2),
    String(item.endsAt),
    text.truncate(item.externalRef, 120),
    item.threshold.toFixed(2),
    String(item.expiresAt),
    text.truncate(item.title, 80),
    item.category,
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedPayoutTierViews(items: WeightedPayoutTier[]): WeightedPayoutTierView[] {
  const views: WeightedPayoutTierView[] = [];
  for (const item of items) {
    views.push(toWeightedPayoutTierView(item));
  }
  return views;
}

export function sumWeightedPayoutTierView(view: WeightedPayoutTierView): number {
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedMargin + parsedEndsAt + parsedThreshold;
}
