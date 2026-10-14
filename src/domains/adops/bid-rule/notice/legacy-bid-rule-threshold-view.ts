import * as text from "../../../../kit/text.js";
import { LegacyBidRuleThreshold } from "./legacy-bid-rule-threshold.js";

/** How screens and exports show a legacy bid rule threshold. */
export class LegacyBidRuleThresholdView {
  codeText: string;
  label: string;
  expiresAt: string;
  country: string;
  graceDaysText: string;
  durationMinutesText: string;
  approved: string;
  startsAt: string;
  cost: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    expiresAt: string,
    country: string,
    graceDaysText: string,
    durationMinutesText: string,
    approved: string,
    startsAt: string,
    cost: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.expiresAt = expiresAt;
    this.country = country;
    this.graceDaysText = graceDaysText;
    this.durationMinutesText = durationMinutesText;
    this.approved = approved;
    this.startsAt = startsAt;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyBidRuleThresholdView(item: LegacyBidRuleThreshold): LegacyBidRuleThresholdView {
  return new LegacyBidRuleThresholdView(
    item.code,
    text.truncate(item.label, 40),
    String(item.expiresAt),
    item.country,
    String(item.graceDays),
    String(item.durationMinutes),
    `${item.approved}`,
    String(item.startsAt),
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyBidRuleThresholdViews(items: LegacyBidRuleThreshold[]): LegacyBidRuleThresholdView[] {
  const views: LegacyBidRuleThresholdView[] = [];
  for (const item of items) {
    views.push(toLegacyBidRuleThresholdView(item));
  }
  return views;
}

export function sumLegacyBidRuleThresholdView(view: LegacyBidRuleThresholdView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  return parsedExpiresAt + parsedGraceDays + parsedDurationMinutes;
}
