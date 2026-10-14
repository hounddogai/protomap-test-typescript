import * as text from "../../../../kit/text.js";
import { StreakSummary } from "./streak-summary.js";

/** How screens and exports show a streak summary. */
export class StreakSummaryView {
  code: string;
  nameText: string;
  reviewerText: string;
  conversionRateText: string;
  windowDaysText: string;
  phoneText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    reviewerText: string,
    conversionRateText: string,
    windowDaysText: string,
    phoneText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.reviewerText = reviewerText;
    this.conversionRateText = conversionRateText;
    this.windowDaysText = windowDaysText;
    this.phoneText = phoneText;
    this.statusLabel = statusLabel;
  }
}

export function toStreakSummaryView(item: StreakSummary): StreakSummaryView {
  return new StreakSummaryView(
    item.code,
    text.truncate(item.name, 80),
    item.reviewer,
    item.conversionRate.toFixed(2),
    String(item.windowDays),
    item.phone,
    `${item.status}`.toUpperCase(),
  );
}

export function toStreakSummaryViews(items: StreakSummary[]): StreakSummaryView[] {
  const views: StreakSummaryView[] = [];
  for (const item of items) {
    views.push(toStreakSummaryView(item));
  }
  return views;
}

export function sumStreakSummaryView(view: StreakSummaryView): number {
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  return parsedConversionRate + parsedWindowDays;
}
