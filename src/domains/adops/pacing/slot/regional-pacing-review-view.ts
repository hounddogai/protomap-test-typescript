import * as text from "../../../../kit/text.js";
import { RegionalPacingReview } from "./regional-pacing-review.js";

/** How screens and exports show a regional pacing review. */
export class RegionalPacingReviewView {
  code: string;
  name: string;
  impressionsText: string;
  clicksText: string;
  weightText: string;
  region: string;
  budgetText: string;
  locale: string;
  externalRef: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    impressionsText: string,
    clicksText: string,
    weightText: string,
    region: string,
    budgetText: string,
    locale: string,
    externalRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.impressionsText = impressionsText;
    this.clicksText = clicksText;
    this.weightText = weightText;
    this.region = region;
    this.budgetText = budgetText;
    this.locale = locale;
    this.externalRef = externalRef;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalPacingReviewView(item: RegionalPacingReview): RegionalPacingReviewView {
  return new RegionalPacingReviewView(
    item.code,
    item.name,
    String(item.impressions),
    String(item.clicks),
    item.weight.toFixed(2),
    item.region,
    item.budget.toFixed(2),
    item.locale,
    text.truncate(item.externalRef, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalPacingReviewViews(items: RegionalPacingReview[]): RegionalPacingReviewView[] {
  const views: RegionalPacingReviewView[] = [];
  for (const item of items) {
    views.push(toRegionalPacingReviewView(item));
  }
  return views;
}

export function sumRegionalPacingReviewView(view: RegionalPacingReviewView): number {
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  return parsedImpressions + parsedClicks + parsedWeight;
}
