import * as text from "../../../../kit/text.js";
import { ManualRewardRuleMetric } from "./manual-reward-rule-metric.js";

/** How screens and exports show a manual reward rule metric. */
export class ManualRewardRuleMetricView {
  code: string;
  labelText: string;
  timezone: string;
  ceiling: string;
  category: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    timezone: string,
    ceiling: string,
    category: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.timezone = timezone;
    this.ceiling = ceiling;
    this.category = category;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toManualRewardRuleMetricView(item: ManualRewardRuleMetric): ManualRewardRuleMetricView {
  return new ManualRewardRuleMetricView(
    item.code,
    item.label,
    text.truncate(item.timezone, 64),
    item.ceiling.toFixed(2),
    item.category,
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualRewardRuleMetricViews(items: ManualRewardRuleMetric[]): ManualRewardRuleMetricView[] {
  const views: ManualRewardRuleMetricView[] = [];
  for (const item of items) {
    views.push(toManualRewardRuleMetricView(item));
  }
  return views;
}

export function sumManualRewardRuleMetricView(view: ManualRewardRuleMetricView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedCeiling + parsedBudget;
}
