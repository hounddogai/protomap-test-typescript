import { RewardRuleSchedule } from "./reward-rule-schedule.js";

/** How screens and exports show a reward rule schedule. */
export class RewardRuleScheduleView {
  codeText: string;
  name: string;
  contactEmail: string;
  amount: string;
  ceiling: string;
  margin: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    contactEmail: string,
    amount: string,
    ceiling: string,
    margin: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.contactEmail = contactEmail;
    this.amount = amount;
    this.ceiling = ceiling;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toRewardRuleScheduleView(item: RewardRuleSchedule): RewardRuleScheduleView {
  return new RewardRuleScheduleView(
    item.code,
    item.name,
    item.contactEmail,
    item.amount.toFixed(2),
    item.ceiling.toFixed(2),
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardRuleScheduleViews(items: RewardRuleSchedule[]): RewardRuleScheduleView[] {
  const views: RewardRuleScheduleView[] = [];
  for (const item of items) {
    views.push(toRewardRuleScheduleView(item));
  }
  return views;
}

export function sumRewardRuleScheduleView(view: RewardRuleScheduleView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedAmount + parsedCeiling + parsedMargin;
}
