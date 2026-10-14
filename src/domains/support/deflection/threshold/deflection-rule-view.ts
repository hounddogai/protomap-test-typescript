import { DeflectionRule } from "./deflection-rule.js";

/** How screens and exports show a deflection rule. */
export class DeflectionRuleView {
  code: string;
  name: string;
  campaignRefText: string;
  startsAt: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    campaignRefText: string,
    startsAt: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRefText = campaignRefText;
    this.startsAt = startsAt;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toDeflectionRuleView(item: DeflectionRule): DeflectionRuleView {
  return new DeflectionRuleView(
    item.code,
    item.name,
    item.campaignRef,
    String(item.startsAt),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDeflectionRuleViews(items: DeflectionRule[]): DeflectionRuleView[] {
  const views: DeflectionRuleView[] = [];
  for (const item of items) {
    views.push(toDeflectionRuleView(item));
  }
  return views;
}

export function sumDeflectionRuleView(view: DeflectionRuleView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedStartsAt + parsedBudget;
}
