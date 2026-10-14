import * as text from "../../../../kit/text.js";
import { ConversionSummary } from "./conversion-summary.js";

/** How screens and exports show a conversion summary. */
export class ConversionSummaryView {
  code: string;
  label: string;
  source: string;
  budget: string;
  region: string;
  statusLabel: string;

  constructor(code: string, label: string, source: string, budget: string, region: string, statusLabel: string) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.budget = budget;
    this.region = region;
    this.statusLabel = statusLabel;
  }
}

export function toConversionSummaryView(item: ConversionSummary): ConversionSummaryView {
  return new ConversionSummaryView(
    item.code,
    text.truncate(item.label, 120),
    item.source,
    item.budget.toFixed(2),
    item.region,
    `${item.status}`.toUpperCase(),
  );
}

export function toConversionSummaryViews(items: ConversionSummary[]): ConversionSummaryView[] {
  const views: ConversionSummaryView[] = [];
  for (const item of items) {
    views.push(toConversionSummaryView(item));
  }
  return views;
}

export function sumConversionSummaryView(view: ConversionSummaryView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedBudget;
}
