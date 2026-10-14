import * as text from "../../../../kit/text.js";
import { BranchRule } from "./branch-rule.js";

/** How screens and exports show a branch rule. */
export class BranchRuleView {
  code: string;
  title: string;
  currency: string;
  audienceId: string;
  journeyId: string;
  amount: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    currency: string,
    audienceId: string,
    journeyId: string,
    amount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.currency = currency;
    this.audienceId = audienceId;
    this.journeyId = journeyId;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toBranchRuleView(item: BranchRule): BranchRuleView {
  return new BranchRuleView(
    text.truncate(item.code, 80),
    text.truncate(item.title, 40),
    item.currency,
    item.audienceId,
    text.truncate(item.journeyId, 40),
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBranchRuleViews(items: BranchRule[]): BranchRuleView[] {
  const views: BranchRuleView[] = [];
  for (const item of items) {
    views.push(toBranchRuleView(item));
  }
  return views;
}

export function sumBranchRuleView(view: BranchRuleView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedAmount;
}
