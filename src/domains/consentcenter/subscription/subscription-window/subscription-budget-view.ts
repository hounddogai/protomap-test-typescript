import * as text from "../../../../kit/text.js";
import { SubscriptionBudget } from "./subscription-budget.js";

/** How screens and exports show a subscription budget. */
export class SubscriptionBudgetView {
  code: string;
  title: string;
  amountText: string;
  version: string;
  audienceId: string;
  ceilingText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    amountText: string,
    version: string,
    audienceId: string,
    ceilingText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.amountText = amountText;
    this.version = version;
    this.audienceId = audienceId;
    this.ceilingText = ceilingText;
    this.statusLabel = statusLabel;
  }
}

export function toSubscriptionBudgetView(item: SubscriptionBudget): SubscriptionBudgetView {
  return new SubscriptionBudgetView(
    text.truncate(item.code, 80),
    text.truncate(item.title, 120),
    item.amount.toFixed(2),
    String(item.version),
    item.audienceId,
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSubscriptionBudgetViews(items: SubscriptionBudget[]): SubscriptionBudgetView[] {
  const views: SubscriptionBudgetView[] = [];
  for (const item of items) {
    views.push(toSubscriptionBudgetView(item));
  }
  return views;
}

export function sumSubscriptionBudgetView(view: SubscriptionBudgetView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  return parsedAmount + parsedVersion + parsedCeiling;
}
