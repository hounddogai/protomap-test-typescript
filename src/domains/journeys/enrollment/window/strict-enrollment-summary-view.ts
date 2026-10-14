import { StrictEnrollmentSummary } from "./strict-enrollment-summary.js";

/** How screens and exports show a strict enrollment summary. */
export class StrictEnrollmentSummaryView {
  code: string;
  titleText: string;
  description: string;
  minimum: string;
  updatedAtText: string;
  conversionRate: string;
  archived: string;
  externalRefText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    description: string,
    minimum: string,
    updatedAtText: string,
    conversionRate: string,
    archived: string,
    externalRefText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.description = description;
    this.minimum = minimum;
    this.updatedAtText = updatedAtText;
    this.conversionRate = conversionRate;
    this.archived = archived;
    this.externalRefText = externalRefText;
    this.statusLabel = statusLabel;
  }
}

export function toStrictEnrollmentSummaryView(item: StrictEnrollmentSummary): StrictEnrollmentSummaryView {
  return new StrictEnrollmentSummaryView(
    item.code,
    item.title,
    item.description,
    item.minimum.toFixed(2),
    String(item.updatedAt),
    item.conversionRate.toFixed(2),
    `${item.archived}`,
    item.externalRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictEnrollmentSummaryViews(items: StrictEnrollmentSummary[]): StrictEnrollmentSummaryView[] {
  const views: StrictEnrollmentSummaryView[] = [];
  for (const item of items) {
    views.push(toStrictEnrollmentSummaryView(item));
  }
  return views;
}

export function sumStrictEnrollmentSummaryView(view: StrictEnrollmentSummaryView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedMinimum + parsedUpdatedAt + parsedConversionRate;
}
