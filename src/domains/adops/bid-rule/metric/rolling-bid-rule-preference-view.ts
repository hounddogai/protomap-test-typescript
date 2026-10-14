import { RollingBidRulePreference } from "./rolling-bid-rule-preference.js";

/** How screens and exports show a rolling bid rule preference. */
export class RollingBidRulePreferenceView {
  code: string;
  title: string;
  name: string;
  impressions: string;
  clicks: string;
  expiresAt: string;
  graceDays: string;
  maximum: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    name: string,
    impressions: string,
    clicks: string,
    expiresAt: string,
    graceDays: string,
    maximum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.name = name;
    this.impressions = impressions;
    this.clicks = clicks;
    this.expiresAt = expiresAt;
    this.graceDays = graceDays;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toRollingBidRulePreferenceView(item: RollingBidRulePreference): RollingBidRulePreferenceView {
  return new RollingBidRulePreferenceView(
    item.code,
    item.title,
    item.name,
    String(item.impressions),
    String(item.clicks),
    String(item.expiresAt),
    String(item.graceDays),
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingBidRulePreferenceViews(items: RollingBidRulePreference[]): RollingBidRulePreferenceView[] {
  const views: RollingBidRulePreferenceView[] = [];
  for (const item of items) {
    views.push(toRollingBidRulePreferenceView(item));
  }
  return views;
}

export function sumRollingBidRulePreferenceView(view: RollingBidRulePreferenceView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedImpressions + parsedClicks + parsedExpiresAt;
}
