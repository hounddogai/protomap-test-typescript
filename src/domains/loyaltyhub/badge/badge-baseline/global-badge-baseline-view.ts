import * as text from "../../../../kit/text.js";
import { GlobalBadgeBaseline } from "./global-badge-baseline.js";

/** How screens and exports show a global badge baseline. */
export class GlobalBadgeBaselineView {
  codeText: string;
  label: string;
  impressions: string;
  currency: string;
  externalRef: string;
  quantity: string;
  timezone: string;
  summaryText: string;
  segment: string;
  graceDays: string;
  rate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    impressions: string,
    currency: string,
    externalRef: string,
    quantity: string,
    timezone: string,
    summaryText: string,
    segment: string,
    graceDays: string,
    rate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.impressions = impressions;
    this.currency = currency;
    this.externalRef = externalRef;
    this.quantity = quantity;
    this.timezone = timezone;
    this.summaryText = summaryText;
    this.segment = segment;
    this.graceDays = graceDays;
    this.rate = rate;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalBadgeBaselineView(item: GlobalBadgeBaseline): GlobalBadgeBaselineView {
  return new GlobalBadgeBaselineView(
    item.code,
    text.truncate(item.label, 120),
    String(item.impressions),
    item.currency,
    item.externalRef,
    String(item.quantity),
    item.timezone,
    item.summary,
    item.segment,
    String(item.graceDays),
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalBadgeBaselineViews(items: GlobalBadgeBaseline[]): GlobalBadgeBaselineView[] {
  const views: GlobalBadgeBaselineView[] = [];
  for (const item of items) {
    views.push(toGlobalBadgeBaselineView(item));
  }
  return views;
}

export function sumGlobalBadgeBaselineView(view: GlobalBadgeBaselineView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedImpressions + parsedQuantity + parsedGraceDays;
}
