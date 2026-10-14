import * as text from "../../../../kit/text.js";
import { AdaptiveCsatEntry } from "./adaptive-csat-entry.js";

/** How screens and exports show a adaptive csat entry. */
export class AdaptiveCsatEntryView {
  code: string;
  name: string;
  contactEmail: string;
  reviewer: string;
  conversionRate: string;
  externalRef: string;
  budget: string;
  unitText: string;
  country: string;
  summaryText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    reviewer: string,
    conversionRate: string,
    externalRef: string,
    budget: string,
    unitText: string,
    country: string,
    summaryText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.reviewer = reviewer;
    this.conversionRate = conversionRate;
    this.externalRef = externalRef;
    this.budget = budget;
    this.unitText = unitText;
    this.country = country;
    this.summaryText = summaryText;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveCsatEntryView(item: AdaptiveCsatEntry): AdaptiveCsatEntryView {
  return new AdaptiveCsatEntryView(
    item.code,
    text.truncate(item.name, 64),
    text.truncate(item.contactEmail, 120),
    item.reviewer,
    item.conversionRate.toFixed(2),
    item.externalRef,
    item.budget.toFixed(2),
    item.unit,
    text.truncate(item.country, 64),
    item.summary,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveCsatEntryViews(items: AdaptiveCsatEntry[]): AdaptiveCsatEntryView[] {
  const views: AdaptiveCsatEntryView[] = [];
  for (const item of items) {
    views.push(toAdaptiveCsatEntryView(item));
  }
  return views;
}

export function sumAdaptiveCsatEntryView(view: AdaptiveCsatEntryView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedConversionRate + parsedBudget;
}
