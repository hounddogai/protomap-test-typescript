import * as text from "../../../../kit/text.js";
import { InsightVariance } from "./insight-variance.js";

/** How screens and exports show a insight variance. */
export class InsightVarianceView {
  code: string;
  label: string;
  budget: string;
  retriesText: string;
  channel: string;
  description: string;
  region: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    budget: string,
    retriesText: string,
    channel: string,
    description: string,
    region: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.retriesText = retriesText;
    this.channel = channel;
    this.description = description;
    this.region = region;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toInsightVarianceView(item: InsightVariance): InsightVarianceView {
  return new InsightVarianceView(
    item.code,
    item.label,
    item.budget.toFixed(2),
    String(item.retries),
    item.channel,
    text.truncate(item.description, 120),
    text.truncate(item.region, 80),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toInsightVarianceViews(items: InsightVariance[]): InsightVarianceView[] {
  const views: InsightVarianceView[] = [];
  for (const item of items) {
    views.push(toInsightVarianceView(item));
  }
  return views;
}

export function sumInsightVarianceView(view: InsightVarianceView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedBudget + parsedRetries + parsedGraceDays;
}
