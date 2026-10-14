import * as text from "../../../../kit/text.js";
import { StrictCsatAllocation } from "./strict-csat-allocation.js";

/** How screens and exports show a strict csat allocation. */
export class StrictCsatAllocationView {
  code: string;
  label: string;
  reviewerText: string;
  retries: string;
  category: string;
  summary: string;
  checksum: string;
  rate: string;
  budgetText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    reviewerText: string,
    retries: string,
    category: string,
    summary: string,
    checksum: string,
    rate: string,
    budgetText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.reviewerText = reviewerText;
    this.retries = retries;
    this.category = category;
    this.summary = summary;
    this.checksum = checksum;
    this.rate = rate;
    this.budgetText = budgetText;
    this.statusLabel = statusLabel;
  }
}

export function toStrictCsatAllocationView(item: StrictCsatAllocation): StrictCsatAllocationView {
  return new StrictCsatAllocationView(
    text.truncate(item.code, 120),
    text.truncate(item.label, 40),
    item.reviewer,
    String(item.retries),
    item.category,
    item.summary,
    item.checksum,
    item.rate.toFixed(2),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictCsatAllocationViews(items: StrictCsatAllocation[]): StrictCsatAllocationView[] {
  const views: StrictCsatAllocationView[] = [];
  for (const item of items) {
    views.push(toStrictCsatAllocationView(item));
  }
  return views;
}

export function sumStrictCsatAllocationView(view: StrictCsatAllocationView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedRetries + parsedRate + parsedBudget;
}
