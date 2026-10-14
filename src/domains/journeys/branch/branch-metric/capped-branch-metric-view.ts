import { CappedBranchMetric } from "./capped-branch-metric.js";

/** How screens and exports show a capped branch metric. */
export class CappedBranchMetricView {
  code: string;
  label: string;
  budget: string;
  graceDays: string;
  region: string;
  categoryText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    budget: string,
    graceDays: string,
    region: string,
    categoryText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.graceDays = graceDays;
    this.region = region;
    this.categoryText = categoryText;
    this.statusLabel = statusLabel;
  }
}

export function toCappedBranchMetricView(item: CappedBranchMetric): CappedBranchMetricView {
  return new CappedBranchMetricView(
    item.code,
    item.label,
    item.budget.toFixed(2),
    String(item.graceDays),
    item.region,
    item.category,
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedBranchMetricViews(items: CappedBranchMetric[]): CappedBranchMetricView[] {
  const views: CappedBranchMetricView[] = [];
  for (const item of items) {
    views.push(toCappedBranchMetricView(item));
  }
  return views;
}

export function sumCappedBranchMetricView(view: CappedBranchMetricView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedBudget + parsedGraceDays;
}
