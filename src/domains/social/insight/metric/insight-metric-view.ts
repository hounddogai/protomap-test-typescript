import * as text from "../../../../kit/text.js";
import { InsightMetric } from "./insight-metric.js";

/** How screens and exports show a insight metric. */
export class InsightMetricView {
  code: string;
  name: string;
  batchSize: string;
  categoryText: string;
  graceDays: string;
  createdAt: string;
  weight: string;
  country: string;
  retriesText: string;
  budgetText: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    batchSize: string,
    categoryText: string,
    graceDays: string,
    createdAt: string,
    weight: string,
    country: string,
    retriesText: string,
    budgetText: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.batchSize = batchSize;
    this.categoryText = categoryText;
    this.graceDays = graceDays;
    this.createdAt = createdAt;
    this.weight = weight;
    this.country = country;
    this.retriesText = retriesText;
    this.budgetText = budgetText;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toInsightMetricView(item: InsightMetric): InsightMetricView {
  return new InsightMetricView(
    item.code,
    text.truncate(item.name, 80),
    String(item.batchSize),
    text.truncate(item.category, 120),
    String(item.graceDays),
    String(item.createdAt),
    item.weight.toFixed(2),
    item.country,
    String(item.retries),
    item.budget.toFixed(2),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toInsightMetricViews(items: InsightMetric[]): InsightMetricView[] {
  const views: InsightMetricView[] = [];
  for (const item of items) {
    views.push(toInsightMetricView(item));
  }
  return views;
}

export function sumInsightMetricView(view: InsightMetricView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedBatchSize + parsedGraceDays + parsedCreatedAt;
}
