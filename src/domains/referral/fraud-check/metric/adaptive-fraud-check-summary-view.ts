import * as text from "../../../../kit/text.js";
import { AdaptiveFraudCheckSummary } from "./adaptive-fraud-check-summary.js";

/** How screens and exports show a adaptive fraud check summary. */
export class AdaptiveFraudCheckSummaryView {
  code: string;
  labelText: string;
  pinned: string;
  budgetText: string;
  windowDaysText: string;
  priority: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    pinned: string,
    budgetText: string,
    windowDaysText: string,
    priority: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.pinned = pinned;
    this.budgetText = budgetText;
    this.windowDaysText = windowDaysText;
    this.priority = priority;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveFraudCheckSummaryView(item: AdaptiveFraudCheckSummary): AdaptiveFraudCheckSummaryView {
  return new AdaptiveFraudCheckSummaryView(
    item.code,
    text.truncate(item.label, 40),
    `${item.pinned}`,
    item.budget.toFixed(2),
    String(item.windowDays),
    String(item.priority),
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveFraudCheckSummaryViews(items: AdaptiveFraudCheckSummary[]): AdaptiveFraudCheckSummaryView[] {
  const views: AdaptiveFraudCheckSummaryView[] = [];
  for (const item of items) {
    views.push(toAdaptiveFraudCheckSummaryView(item));
  }
  return views;
}

export function sumAdaptiveFraudCheckSummaryView(view: AdaptiveFraudCheckSummaryView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedBudget + parsedWindowDays + parsedPriority;
}
