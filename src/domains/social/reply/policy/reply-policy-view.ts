import * as text from "../../../../kit/text.js";
import { ReplyPolicy } from "./reply-policy.js";

/** How screens and exports show a reply policy. */
export class ReplyPolicyView {
  codeText: string;
  name: string;
  label: string;
  retries: string;
  amount: string;
  title: string;
  rateText: string;
  budget: string;
  attempts: string;
  activeText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    label: string,
    retries: string,
    amount: string,
    title: string,
    rateText: string,
    budget: string,
    attempts: string,
    activeText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.label = label;
    this.retries = retries;
    this.amount = amount;
    this.title = title;
    this.rateText = rateText;
    this.budget = budget;
    this.attempts = attempts;
    this.activeText = activeText;
    this.statusLabel = statusLabel;
  }
}

export function toReplyPolicyView(item: ReplyPolicy): ReplyPolicyView {
  return new ReplyPolicyView(
    text.truncate(item.code, 80),
    item.name,
    item.label,
    String(item.retries),
    item.amount.toFixed(2),
    item.title,
    item.rate.toFixed(2),
    item.budget.toFixed(2),
    String(item.attempts),
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toReplyPolicyViews(items: ReplyPolicy[]): ReplyPolicyView[] {
  const views: ReplyPolicyView[] = [];
  for (const item of items) {
    views.push(toReplyPolicyView(item));
  }
  return views;
}

export function sumReplyPolicyView(view: ReplyPolicyView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  return parsedRetries + parsedAmount + parsedRate;
}
