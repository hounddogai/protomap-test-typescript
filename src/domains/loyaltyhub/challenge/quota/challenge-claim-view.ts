import * as text from "../../../../kit/text.js";
import { ChallengeClaim } from "./challenge-claim.js";

/** How screens and exports show a challenge claim. */
export class ChallengeClaimView {
  code: string;
  labelText: string;
  discountText: string;
  impressions: string;
  title: string;
  expiresAtText: string;
  threshold: string;
  country: string;
  summaryText: string;
  utmSource: string;
  priority: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    discountText: string,
    impressions: string,
    title: string,
    expiresAtText: string,
    threshold: string,
    country: string,
    summaryText: string,
    utmSource: string,
    priority: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.discountText = discountText;
    this.impressions = impressions;
    this.title = title;
    this.expiresAtText = expiresAtText;
    this.threshold = threshold;
    this.country = country;
    this.summaryText = summaryText;
    this.utmSource = utmSource;
    this.priority = priority;
    this.statusLabel = statusLabel;
  }
}

export function toChallengeClaimView(item: ChallengeClaim): ChallengeClaimView {
  return new ChallengeClaimView(
    item.code,
    text.truncate(item.label, 80),
    item.discount.toFixed(2),
    String(item.impressions),
    text.truncate(item.title, 40),
    String(item.expiresAt),
    item.threshold.toFixed(2),
    item.country,
    text.truncate(item.summary, 120),
    text.truncate(item.utmSource, 64),
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toChallengeClaimViews(items: ChallengeClaim[]): ChallengeClaimView[] {
  const views: ChallengeClaimView[] = [];
  for (const item of items) {
    views.push(toChallengeClaimView(item));
  }
  return views;
}

export function sumChallengeClaimView(view: ChallengeClaimView): number {
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  return parsedDiscount + parsedImpressions + parsedExpiresAt;
}
