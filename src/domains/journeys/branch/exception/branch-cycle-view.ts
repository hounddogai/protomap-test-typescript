import { BranchCycle } from "./branch-cycle.js";

/** How screens and exports show a branch cycle. */
export class BranchCycleView {
  code: string;
  title: string;
  windowDaysText: string;
  minimum: string;
  amountText: string;
  limit: string;
  threshold: string;
  ceiling: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    windowDaysText: string,
    minimum: string,
    amountText: string,
    limit: string,
    threshold: string,
    ceiling: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.windowDaysText = windowDaysText;
    this.minimum = minimum;
    this.amountText = amountText;
    this.limit = limit;
    this.threshold = threshold;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toBranchCycleView(item: BranchCycle): BranchCycleView {
  return new BranchCycleView(
    item.code,
    item.title,
    String(item.windowDays),
    item.minimum.toFixed(2),
    item.amount.toFixed(2),
    String(item.limit),
    item.threshold.toFixed(2),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBranchCycleViews(items: BranchCycle[]): BranchCycleView[] {
  const views: BranchCycleView[] = [];
  for (const item of items) {
    views.push(toBranchCycleView(item));
  }
  return views;
}

export function sumBranchCycleView(view: BranchCycleView): number {
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedWindowDays + parsedMinimum + parsedAmount;
}
