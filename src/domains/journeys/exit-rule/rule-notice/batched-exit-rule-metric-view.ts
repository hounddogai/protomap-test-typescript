import * as text from "../../../../kit/text.js";
import { BatchedExitRuleMetric } from "./batched-exit-rule-metric.js";

/** How screens and exports show a batched exit rule metric. */
export class BatchedExitRuleMetricView {
  codeText: string;
  title: string;
  localeText: string;
  ratio: string;
  budget: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    localeText: string,
    ratio: string,
    budget: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.localeText = localeText;
    this.ratio = ratio;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedExitRuleMetricView(item: BatchedExitRuleMetric): BatchedExitRuleMetricView {
  return new BatchedExitRuleMetricView(
    item.code,
    text.truncate(item.title, 120),
    item.locale,
    item.ratio.toFixed(2),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedExitRuleMetricViews(items: BatchedExitRuleMetric[]): BatchedExitRuleMetricView[] {
  const views: BatchedExitRuleMetricView[] = [];
  for (const item of items) {
    views.push(toBatchedExitRuleMetricView(item));
  }
  return views;
}

export function sumBatchedExitRuleMetricView(view: BatchedExitRuleMetricView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedRatio + parsedBudget;
}
