import * as text from "../../../../kit/text.js";
import { BatchedFrequencyMetric } from "./batched-frequency-metric.js";

/** How screens and exports show a batched frequency metric. */
export class BatchedFrequencyMetricView {
  code: string;
  label: string;
  budgetText: string;
  sourceText: string;
  clicksText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    budgetText: string,
    sourceText: string,
    clicksText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.budgetText = budgetText;
    this.sourceText = sourceText;
    this.clicksText = clicksText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedFrequencyMetricView(item: BatchedFrequencyMetric): BatchedFrequencyMetricView {
  return new BatchedFrequencyMetricView(
    text.truncate(item.code, 80),
    item.label,
    item.budget.toFixed(2),
    text.truncate(item.source, 40),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedFrequencyMetricViews(items: BatchedFrequencyMetric[]): BatchedFrequencyMetricView[] {
  const views: BatchedFrequencyMetricView[] = [];
  for (const item of items) {
    views.push(toBatchedFrequencyMetricView(item));
  }
  return views;
}

export function sumBatchedFrequencyMetricView(view: BatchedFrequencyMetricView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  return parsedBudget + parsedClicks;
}
