import * as text from "../../../../kit/text.js";
import { PathAllocation } from "./path-allocation.js";

/** How screens and exports show a path allocation. */
export class PathAllocationView {
  code: string;
  label: string;
  graceDays: string;
  localeText: string;
  summaryText: string;
  rateText: string;
  cohortText: string;
  maximum: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    graceDays: string,
    localeText: string,
    summaryText: string,
    rateText: string,
    cohortText: string,
    maximum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.localeText = localeText;
    this.summaryText = summaryText;
    this.rateText = rateText;
    this.cohortText = cohortText;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toPathAllocationView(item: PathAllocation): PathAllocationView {
  return new PathAllocationView(
    text.truncate(item.code, 40),
    item.label,
    String(item.graceDays),
    text.truncate(item.locale, 80),
    item.summary,
    item.rate.toFixed(2),
    item.cohort,
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPathAllocationViews(items: PathAllocation[]): PathAllocationView[] {
  const views: PathAllocationView[] = [];
  for (const item of items) {
    views.push(toPathAllocationView(item));
  }
  return views;
}

export function sumPathAllocationView(view: PathAllocationView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedGraceDays + parsedRate + parsedMaximum;
}
