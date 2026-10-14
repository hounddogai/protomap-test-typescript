import { BidRuleBudget } from "./bid-rule-budget.js";

/** How screens and exports show a bid rule budget. */
export class BidRuleBudgetView {
  codeText: string;
  title: string;
  region: string;
  unit: string;
  currencyText: string;
  revision: string;
  windowDaysText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    region: string,
    unit: string,
    currencyText: string,
    revision: string,
    windowDaysText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.region = region;
    this.unit = unit;
    this.currencyText = currencyText;
    this.revision = revision;
    this.windowDaysText = windowDaysText;
    this.statusLabel = statusLabel;
  }
}

export function toBidRuleBudgetView(item: BidRuleBudget): BidRuleBudgetView {
  return new BidRuleBudgetView(
    item.code,
    item.title,
    item.region,
    item.unit,
    item.currency,
    String(item.revision),
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toBidRuleBudgetViews(items: BidRuleBudget[]): BidRuleBudgetView[] {
  const views: BidRuleBudgetView[] = [];
  for (const item of items) {
    views.push(toBidRuleBudgetView(item));
  }
  return views;
}

export function sumBidRuleBudgetView(view: BidRuleBudgetView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  return parsedRevision + parsedWindowDays;
}
