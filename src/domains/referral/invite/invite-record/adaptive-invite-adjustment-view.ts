import * as text from "../../../../kit/text.js";
import { AdaptiveInviteAdjustment } from "./adaptive-invite-adjustment.js";

/** How screens and exports show a adaptive invite adjustment. */
export class AdaptiveInviteAdjustmentView {
  code: string;
  name: string;
  openRate: string;
  currency: string;
  impressions: string;
  threshold: string;
  maximum: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    openRate: string,
    currency: string,
    impressions: string,
    threshold: string,
    maximum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.openRate = openRate;
    this.currency = currency;
    this.impressions = impressions;
    this.threshold = threshold;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveInviteAdjustmentView(item: AdaptiveInviteAdjustment): AdaptiveInviteAdjustmentView {
  return new AdaptiveInviteAdjustmentView(
    text.truncate(item.code, 64),
    item.name,
    item.openRate.toFixed(2),
    item.currency,
    String(item.impressions),
    item.threshold.toFixed(2),
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveInviteAdjustmentViews(items: AdaptiveInviteAdjustment[]): AdaptiveInviteAdjustmentView[] {
  const views: AdaptiveInviteAdjustmentView[] = [];
  for (const item of items) {
    views.push(toAdaptiveInviteAdjustmentView(item));
  }
  return views;
}

export function sumAdaptiveInviteAdjustmentView(view: AdaptiveInviteAdjustmentView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedOpenRate + parsedImpressions + parsedThreshold;
}
