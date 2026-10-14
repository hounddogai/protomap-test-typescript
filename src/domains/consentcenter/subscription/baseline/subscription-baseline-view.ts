import * as text from "../../../../kit/text.js";
import { SubscriptionBaseline } from "./subscription-baseline.js";

/** How screens and exports show a subscription baseline. */
export class SubscriptionBaselineView {
  code: string;
  label: string;
  campaignRefText: string;
  segment: string;
  name: string;
  graceDays: string;
  region: string;
  utmSource: string;
  ratioText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    campaignRefText: string,
    segment: string,
    name: string,
    graceDays: string,
    region: string,
    utmSource: string,
    ratioText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRefText = campaignRefText;
    this.segment = segment;
    this.name = name;
    this.graceDays = graceDays;
    this.region = region;
    this.utmSource = utmSource;
    this.ratioText = ratioText;
    this.statusLabel = statusLabel;
  }
}

export function toSubscriptionBaselineView(item: SubscriptionBaseline): SubscriptionBaselineView {
  return new SubscriptionBaselineView(
    item.code,
    item.label,
    text.truncate(item.campaignRef, 80),
    item.segment,
    item.name,
    String(item.graceDays),
    text.truncate(item.region, 120),
    item.utmSource,
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSubscriptionBaselineViews(items: SubscriptionBaseline[]): SubscriptionBaselineView[] {
  const views: SubscriptionBaselineView[] = [];
  for (const item of items) {
    views.push(toSubscriptionBaselineView(item));
  }
  return views;
}

export function sumSubscriptionBaselineView(view: SubscriptionBaselineView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  return parsedGraceDays + parsedRatio;
}
