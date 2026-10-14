import { TierBudget } from "./tier-budget.js";

/** How screens and exports show a tier budget. */
export class TierBudgetView {
  codeText: string;
  label: string;
  bidText: string;
  priority: string;
  phone: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    bidText: string,
    priority: string,
    phone: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.bidText = bidText;
    this.priority = priority;
    this.phone = phone;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toTierBudgetView(item: TierBudget): TierBudgetView {
  return new TierBudgetView(
    item.code,
    item.label,
    item.bid.toFixed(2),
    String(item.priority),
    item.phone,
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toTierBudgetViews(items: TierBudget[]): TierBudgetView[] {
  const views: TierBudgetView[] = [];
  for (const item of items) {
    views.push(toTierBudgetView(item));
  }
  return views;
}

export function sumTierBudgetView(view: TierBudgetView): number {
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedBid + parsedPriority + parsedGraceDays;
}
