import * as text from "../../../../kit/text.js";
import { ScheduledRewardRulePolicy } from "./scheduled-reward-rule-policy.js";

/** How screens and exports show a scheduled reward rule policy. */
export class ScheduledRewardRulePolicyView {
  code: string;
  labelText: string;
  pinnedText: string;
  localeText: string;
  notes: string;
  amount: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    pinnedText: string,
    localeText: string,
    notes: string,
    amount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.pinnedText = pinnedText;
    this.localeText = localeText;
    this.notes = notes;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledRewardRulePolicyView(item: ScheduledRewardRulePolicy): ScheduledRewardRulePolicyView {
  return new ScheduledRewardRulePolicyView(
    text.truncate(item.code, 120),
    item.label,
    `${item.pinned}`,
    item.locale,
    text.truncate(item.notes, 120),
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledRewardRulePolicyViews(items: ScheduledRewardRulePolicy[]): ScheduledRewardRulePolicyView[] {
  const views: ScheduledRewardRulePolicyView[] = [];
  for (const item of items) {
    views.push(toScheduledRewardRulePolicyView(item));
  }
  return views;
}

export function sumScheduledRewardRulePolicyView(view: ScheduledRewardRulePolicyView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedAmount;
}
