import * as text from "../../../../kit/text.js";
import { RollingPaywallReview } from "./rolling-paywall-review.js";

/** How screens and exports show a rolling paywall review. */
export class RollingPaywallReviewView {
  code: string;
  title: string;
  journeyId: string;
  cohort: string;
  bidText: string;
  visible: string;
  contactEmail: string;
  weight: string;
  regionText: string;
  externalRef: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    journeyId: string,
    cohort: string,
    bidText: string,
    visible: string,
    contactEmail: string,
    weight: string,
    regionText: string,
    externalRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.journeyId = journeyId;
    this.cohort = cohort;
    this.bidText = bidText;
    this.visible = visible;
    this.contactEmail = contactEmail;
    this.weight = weight;
    this.regionText = regionText;
    this.externalRef = externalRef;
    this.statusLabel = statusLabel;
  }
}

export function toRollingPaywallReviewView(item: RollingPaywallReview): RollingPaywallReviewView {
  return new RollingPaywallReviewView(
    item.code,
    item.title,
    item.journeyId,
    item.cohort,
    item.bid.toFixed(2),
    `${item.visible}`,
    text.truncate(item.contactEmail, 120),
    item.weight.toFixed(2),
    item.region,
    text.truncate(item.externalRef, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingPaywallReviewViews(items: RollingPaywallReview[]): RollingPaywallReviewView[] {
  const views: RollingPaywallReviewView[] = [];
  for (const item of items) {
    views.push(toRollingPaywallReviewView(item));
  }
  return views;
}

export function sumRollingPaywallReviewView(view: RollingPaywallReviewView): number {
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedBid + parsedWeight;
}
