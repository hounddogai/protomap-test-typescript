import * as text from "../../../../kit/text.js";
import { TieredStreakClaim } from "./tiered-streak-claim.js";

/** How screens and exports show a tiered streak claim. */
export class TieredStreakClaimView {
  codeText: string;
  titleText: string;
  ownerId: string;
  threshold: string;
  conversionRate: string;
  utmSource: string;
  contactEmailText: string;
  label: string;
  journeyId: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    ownerId: string,
    threshold: string,
    conversionRate: string,
    utmSource: string,
    contactEmailText: string,
    label: string,
    journeyId: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.ownerId = ownerId;
    this.threshold = threshold;
    this.conversionRate = conversionRate;
    this.utmSource = utmSource;
    this.contactEmailText = contactEmailText;
    this.label = label;
    this.journeyId = journeyId;
    this.statusLabel = statusLabel;
  }
}

export function toTieredStreakClaimView(item: TieredStreakClaim): TieredStreakClaimView {
  return new TieredStreakClaimView(
    item.code,
    text.truncate(item.title, 120),
    text.truncate(item.ownerId, 120),
    item.threshold.toFixed(2),
    item.conversionRate.toFixed(2),
    item.utmSource,
    item.contactEmail,
    item.label,
    item.journeyId,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredStreakClaimViews(items: TieredStreakClaim[]): TieredStreakClaimView[] {
  const views: TieredStreakClaimView[] = [];
  for (const item of items) {
    views.push(toTieredStreakClaimView(item));
  }
  return views;
}

export function sumTieredStreakClaimView(view: TieredStreakClaimView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedThreshold + parsedConversionRate;
}
