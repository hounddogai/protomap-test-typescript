import { WeightedRewardRuleGroup } from "./weighted-reward-rule-group.js";

/** How screens and exports show a weighted reward rule group. */
export class WeightedRewardRuleGroupView {
  codeText: string;
  label: string;
  startsAt: string;
  activeText: string;
  budget: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    startsAt: string,
    activeText: string,
    budget: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.startsAt = startsAt;
    this.activeText = activeText;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedRewardRuleGroupView(item: WeightedRewardRuleGroup): WeightedRewardRuleGroupView {
  return new WeightedRewardRuleGroupView(
    item.code,
    item.label,
    String(item.startsAt),
    `${item.active}`,
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedRewardRuleGroupViews(items: WeightedRewardRuleGroup[]): WeightedRewardRuleGroupView[] {
  const views: WeightedRewardRuleGroupView[] = [];
  for (const item of items) {
    views.push(toWeightedRewardRuleGroupView(item));
  }
  return views;
}

export function sumWeightedRewardRuleGroupView(view: WeightedRewardRuleGroupView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedStartsAt + parsedBudget;
}
