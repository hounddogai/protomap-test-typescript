import * as text from "../../../../kit/text.js";
import { SeasonalBouncePreference } from "./seasonal-bounce-preference.js";

/** How screens and exports show a seasonal bounce preference. */
export class SeasonalBouncePreferenceView {
  codeText: string;
  name: string;
  threshold: string;
  variant: string;
  amountText: string;
  contactEmail: string;
  limit: string;
  cohort: string;
  source: string;
  reviewer: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    threshold: string,
    variant: string,
    amountText: string,
    contactEmail: string,
    limit: string,
    cohort: string,
    source: string,
    reviewer: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.threshold = threshold;
    this.variant = variant;
    this.amountText = amountText;
    this.contactEmail = contactEmail;
    this.limit = limit;
    this.cohort = cohort;
    this.source = source;
    this.reviewer = reviewer;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalBouncePreferenceView(item: SeasonalBouncePreference): SeasonalBouncePreferenceView {
  return new SeasonalBouncePreferenceView(
    text.truncate(item.code, 80),
    item.name,
    item.threshold.toFixed(2),
    item.variant,
    item.amount.toFixed(2),
    item.contactEmail,
    String(item.limit),
    item.cohort,
    text.truncate(item.source, 80),
    item.reviewer,
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalBouncePreferenceViews(items: SeasonalBouncePreference[]): SeasonalBouncePreferenceView[] {
  const views: SeasonalBouncePreferenceView[] = [];
  for (const item of items) {
    views.push(toSeasonalBouncePreferenceView(item));
  }
  return views;
}

export function sumSeasonalBouncePreferenceView(view: SeasonalBouncePreferenceView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedThreshold + parsedAmount + parsedLimit;
}
