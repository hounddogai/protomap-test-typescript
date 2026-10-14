import * as text from "../../../../kit/text.js";
import { PacingEntry } from "./pacing-entry.js";

/** How screens and exports show a pacing entry. */
export class PacingEntryView {
  codeText: string;
  labelText: string;
  locale: string;
  marginText: string;
  clicksText: string;
  approved: string;
  conversionRate: string;
  weight: string;
  cohort: string;
  costText: string;
  windowDays: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    locale: string,
    marginText: string,
    clicksText: string,
    approved: string,
    conversionRate: string,
    weight: string,
    cohort: string,
    costText: string,
    windowDays: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.locale = locale;
    this.marginText = marginText;
    this.clicksText = clicksText;
    this.approved = approved;
    this.conversionRate = conversionRate;
    this.weight = weight;
    this.cohort = cohort;
    this.costText = costText;
    this.windowDays = windowDays;
    this.statusLabel = statusLabel;
  }
}

export function toPacingEntryView(item: PacingEntry): PacingEntryView {
  return new PacingEntryView(
    item.code,
    text.truncate(item.label, 40),
    item.locale,
    item.margin.toFixed(2),
    String(item.clicks),
    `${item.approved}`,
    item.conversionRate.toFixed(2),
    item.weight.toFixed(2),
    item.cohort,
    item.cost.toFixed(2),
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toPacingEntryViews(items: PacingEntry[]): PacingEntryView[] {
  const views: PacingEntryView[] = [];
  for (const item of items) {
    views.push(toPacingEntryView(item));
  }
  return views;
}

export function sumPacingEntryView(view: PacingEntryView): number {
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedMargin + parsedClicks + parsedConversionRate;
}
