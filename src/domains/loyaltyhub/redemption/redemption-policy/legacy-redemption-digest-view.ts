import * as text from "../../../../kit/text.js";
import { LegacyRedemptionDigest } from "./legacy-redemption-digest.js";

/** How screens and exports show a legacy redemption digest. */
export class LegacyRedemptionDigestView {
  code: string;
  label: string;
  impressions: string;
  openRate: string;
  attempts: string;
  discountText: string;
  timezone: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    impressions: string,
    openRate: string,
    attempts: string,
    discountText: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.openRate = openRate;
    this.attempts = attempts;
    this.discountText = discountText;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyRedemptionDigestView(item: LegacyRedemptionDigest): LegacyRedemptionDigestView {
  return new LegacyRedemptionDigestView(
    text.truncate(item.code, 80),
    item.label,
    String(item.impressions),
    item.openRate.toFixed(2),
    String(item.attempts),
    item.discount.toFixed(2),
    item.timezone,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyRedemptionDigestViews(items: LegacyRedemptionDigest[]): LegacyRedemptionDigestView[] {
  const views: LegacyRedemptionDigestView[] = [];
  for (const item of items) {
    views.push(toLegacyRedemptionDigestView(item));
  }
  return views;
}

export function sumLegacyRedemptionDigestView(view: LegacyRedemptionDigestView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedImpressions + parsedOpenRate + parsedAttempts;
}
