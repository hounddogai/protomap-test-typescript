import * as text from "../../../../kit/text.js";
import { CappedDeflectionBudget } from "./capped-deflection-budget.js";

/** How screens and exports show a capped deflection budget. */
export class CappedDeflectionBudgetView {
  codeText: string;
  labelText: string;
  clicks: string;
  threshold: string;
  bid: string;
  ceiling: string;
  budget: string;
  openRate: string;
  cost: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    clicks: string,
    threshold: string,
    bid: string,
    ceiling: string,
    budget: string,
    openRate: string,
    cost: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.clicks = clicks;
    this.threshold = threshold;
    this.bid = bid;
    this.ceiling = ceiling;
    this.budget = budget;
    this.openRate = openRate;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toCappedDeflectionBudgetView(item: CappedDeflectionBudget): CappedDeflectionBudgetView {
  return new CappedDeflectionBudgetView(
    item.code,
    text.truncate(item.label, 80),
    String(item.clicks),
    item.threshold.toFixed(2),
    item.bid.toFixed(2),
    item.ceiling.toFixed(2),
    item.budget.toFixed(2),
    item.openRate.toFixed(2),
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedDeflectionBudgetViews(items: CappedDeflectionBudget[]): CappedDeflectionBudgetView[] {
  const views: CappedDeflectionBudgetView[] = [];
  for (const item of items) {
    views.push(toCappedDeflectionBudgetView(item));
  }
  return views;
}

export function sumCappedDeflectionBudgetView(view: CappedDeflectionBudgetView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedClicks + parsedThreshold + parsedBid;
}
