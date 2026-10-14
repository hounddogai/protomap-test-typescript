import * as text from "../../../../kit/text.js";
import { PendingRewardRulePlan } from "./pending-reward-rule-plan.js";

/** How screens and exports show a pending reward rule plan. */
export class PendingRewardRulePlanView {
  codeText: string;
  label: string;
  externalRef: string;
  amount: string;
  descriptionText: string;
  summary: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    externalRef: string,
    amount: string,
    descriptionText: string,
    summary: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.externalRef = externalRef;
    this.amount = amount;
    this.descriptionText = descriptionText;
    this.summary = summary;
    this.statusLabel = statusLabel;
  }
}

export function toPendingRewardRulePlanView(item: PendingRewardRulePlan): PendingRewardRulePlanView {
  return new PendingRewardRulePlanView(
    item.code,
    item.label,
    item.externalRef,
    item.amount.toFixed(2),
    text.truncate(item.description, 80),
    item.summary,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingRewardRulePlanViews(items: PendingRewardRulePlan[]): PendingRewardRulePlanView[] {
  const views: PendingRewardRulePlanView[] = [];
  for (const item of items) {
    views.push(toPendingRewardRulePlanView(item));
  }
  return views;
}

export function sumPendingRewardRulePlanView(view: PendingRewardRulePlanView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedAmount;
}
