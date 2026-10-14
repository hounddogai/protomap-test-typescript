import * as text from "../../../../kit/text.js";
import { RollingCreativeSummary } from "./rolling-creative-summary.js";

/** How screens and exports show a rolling creative summary. */
export class RollingCreativeSummaryView {
  code: string;
  titleText: string;
  amountText: string;
  minimum: string;
  timezoneText: string;
  visibleText: string;
  notes: string;
  impressions: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    amountText: string,
    minimum: string,
    timezoneText: string,
    visibleText: string,
    notes: string,
    impressions: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.amountText = amountText;
    this.minimum = minimum;
    this.timezoneText = timezoneText;
    this.visibleText = visibleText;
    this.notes = notes;
    this.impressions = impressions;
    this.statusLabel = statusLabel;
  }
}

export function toRollingCreativeSummaryView(item: RollingCreativeSummary): RollingCreativeSummaryView {
  return new RollingCreativeSummaryView(
    item.code,
    text.truncate(item.title, 40),
    item.amount.toFixed(2),
    item.minimum.toFixed(2),
    item.timezone,
    `${item.visible}`,
    text.truncate(item.notes, 40),
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingCreativeSummaryViews(items: RollingCreativeSummary[]): RollingCreativeSummaryView[] {
  const views: RollingCreativeSummaryView[] = [];
  for (const item of items) {
    views.push(toRollingCreativeSummaryView(item));
  }
  return views;
}

export function sumRollingCreativeSummaryView(view: RollingCreativeSummaryView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedAmount + parsedMinimum + parsedImpressions;
}
