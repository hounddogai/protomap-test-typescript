import { RegionalEnrollmentReview } from "./regional-enrollment-review.js";

/** How screens and exports show a regional enrollment review. */
export class RegionalEnrollmentReviewView {
  codeText: string;
  titleText: string;
  minimumText: string;
  createdAtText: string;
  conversionRateText: string;
  unit: string;
  checksumText: string;
  ceilingText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    minimumText: string,
    createdAtText: string,
    conversionRateText: string,
    unit: string,
    checksumText: string,
    ceilingText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.minimumText = minimumText;
    this.createdAtText = createdAtText;
    this.conversionRateText = conversionRateText;
    this.unit = unit;
    this.checksumText = checksumText;
    this.ceilingText = ceilingText;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalEnrollmentReviewView(item: RegionalEnrollmentReview): RegionalEnrollmentReviewView {
  return new RegionalEnrollmentReviewView(
    item.code,
    item.title,
    item.minimum.toFixed(2),
    String(item.createdAt),
    item.conversionRate.toFixed(2),
    item.unit,
    item.checksum,
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalEnrollmentReviewViews(items: RegionalEnrollmentReview[]): RegionalEnrollmentReviewView[] {
  const views: RegionalEnrollmentReviewView[] = [];
  for (const item of items) {
    views.push(toRegionalEnrollmentReviewView(item));
  }
  return views;
}

export function sumRegionalEnrollmentReviewView(view: RegionalEnrollmentReviewView): number {
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  return parsedMinimum + parsedCreatedAt + parsedConversionRate;
}
