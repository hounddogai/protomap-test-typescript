import * as text from "../../../../kit/text.js";
import { FallbackJourneyClaim } from "./fallback-journey-claim.js";

/** How screens and exports show a fallback journey claim. */
export class FallbackJourneyClaimView {
  code: string;
  label: string;
  country: string;
  threshold: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    country: string,
    threshold: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.country = country;
    this.threshold = threshold;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackJourneyClaimView(item: FallbackJourneyClaim): FallbackJourneyClaimView {
  return new FallbackJourneyClaimView(
    item.code,
    text.truncate(item.label, 120),
    text.truncate(item.country, 80),
    item.threshold.toFixed(2),
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackJourneyClaimViews(items: FallbackJourneyClaim[]): FallbackJourneyClaimView[] {
  const views: FallbackJourneyClaimView[] = [];
  for (const item of items) {
    views.push(toFallbackJourneyClaimView(item));
  }
  return views;
}

export function sumFallbackJourneyClaimView(view: FallbackJourneyClaimView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedThreshold;
}
