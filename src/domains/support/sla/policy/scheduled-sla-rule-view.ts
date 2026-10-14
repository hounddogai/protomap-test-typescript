import { ScheduledSlaRule } from "./scheduled-sla-rule.js";

/** How screens and exports show a scheduled sla rule. */
export class ScheduledSlaRuleView {
  codeText: string;
  title: string;
  bid: string;
  amount: string;
  approved: string;
  retries: string;
  currencyText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    bid: string,
    amount: string,
    approved: string,
    retries: string,
    currencyText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.bid = bid;
    this.amount = amount;
    this.approved = approved;
    this.retries = retries;
    this.currencyText = currencyText;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledSlaRuleView(item: ScheduledSlaRule): ScheduledSlaRuleView {
  return new ScheduledSlaRuleView(
    item.code,
    item.title,
    item.bid.toFixed(2),
    item.amount.toFixed(2),
    `${item.approved}`,
    String(item.retries),
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledSlaRuleViews(items: ScheduledSlaRule[]): ScheduledSlaRuleView[] {
  const views: ScheduledSlaRuleView[] = [];
  for (const item of items) {
    views.push(toScheduledSlaRuleView(item));
  }
  return views;
}

export function sumScheduledSlaRuleView(view: ScheduledSlaRuleView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedBid + parsedAmount + parsedRetries;
}
