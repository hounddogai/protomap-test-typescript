import * as text from "../../../../kit/text.js";
import { FallbackSubscriptionOverride } from "./fallback-subscription-override.js";

/** How screens and exports show a fallback subscription override. */
export class FallbackSubscriptionOverrideView {
  code: string;
  titleText: string;
  impressionsText: string;
  openRate: string;
  budget: string;
  checksum: string;
  region: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    impressionsText: string,
    openRate: string,
    budget: string,
    checksum: string,
    region: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.impressionsText = impressionsText;
    this.openRate = openRate;
    this.budget = budget;
    this.checksum = checksum;
    this.region = region;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackSubscriptionOverrideView(item: FallbackSubscriptionOverride): FallbackSubscriptionOverrideView {
  return new FallbackSubscriptionOverrideView(
    text.truncate(item.code, 40),
    item.title,
    String(item.impressions),
    item.openRate.toFixed(2),
    item.budget.toFixed(2),
    item.checksum,
    item.region,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackSubscriptionOverrideViews(items: FallbackSubscriptionOverride[]): FallbackSubscriptionOverrideView[] {
  const views: FallbackSubscriptionOverrideView[] = [];
  for (const item of items) {
    views.push(toFallbackSubscriptionOverrideView(item));
  }
  return views;
}

export function sumFallbackSubscriptionOverrideView(view: FallbackSubscriptionOverrideView): number {
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedImpressions + parsedOpenRate + parsedBudget;
}
