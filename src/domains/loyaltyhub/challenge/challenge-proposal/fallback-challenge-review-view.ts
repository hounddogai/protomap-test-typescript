import * as text from "../../../../kit/text.js";
import { FallbackChallengeReview } from "./fallback-challenge-review.js";

/** How screens and exports show a fallback challenge review. */
export class FallbackChallengeReviewView {
  code: string;
  labelText: string;
  category: string;
  minimum: string;
  startsAt: string;
  segment: string;
  contactEmail: string;
  threshold: string;
  currencyText: string;
  externalRef: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    category: string,
    minimum: string,
    startsAt: string,
    segment: string,
    contactEmail: string,
    threshold: string,
    currencyText: string,
    externalRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.category = category;
    this.minimum = minimum;
    this.startsAt = startsAt;
    this.segment = segment;
    this.contactEmail = contactEmail;
    this.threshold = threshold;
    this.currencyText = currencyText;
    this.externalRef = externalRef;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackChallengeReviewView(item: FallbackChallengeReview): FallbackChallengeReviewView {
  return new FallbackChallengeReviewView(
    item.code,
    item.label,
    text.truncate(item.category, 40),
    item.minimum.toFixed(2),
    String(item.startsAt),
    text.truncate(item.segment, 64),
    item.contactEmail,
    item.threshold.toFixed(2),
    item.currency,
    item.externalRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackChallengeReviewViews(items: FallbackChallengeReview[]): FallbackChallengeReviewView[] {
  const views: FallbackChallengeReviewView[] = [];
  for (const item of items) {
    views.push(toFallbackChallengeReviewView(item));
  }
  return views;
}

export function sumFallbackChallengeReviewView(view: FallbackChallengeReviewView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedMinimum + parsedStartsAt + parsedThreshold;
}
