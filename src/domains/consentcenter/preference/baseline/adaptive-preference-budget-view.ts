import * as text from "../../../../kit/text.js";
import { AdaptivePreferenceBudget } from "./adaptive-preference-budget.js";

/** How screens and exports show a adaptive preference budget. */
export class AdaptivePreferenceBudgetView {
  code: string;
  label: string;
  impressions: string;
  score: string;
  rate: string;
  quantity: string;
  limit: string;
  sendAt: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    impressions: string,
    score: string,
    rate: string,
    quantity: string,
    limit: string,
    sendAt: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.score = score;
    this.rate = rate;
    this.quantity = quantity;
    this.limit = limit;
    this.sendAt = sendAt;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptivePreferenceBudgetView(item: AdaptivePreferenceBudget): AdaptivePreferenceBudgetView {
  return new AdaptivePreferenceBudgetView(
    item.code,
    text.truncate(item.label, 64),
    String(item.impressions),
    item.score.toFixed(2),
    item.rate.toFixed(2),
    String(item.quantity),
    String(item.limit),
    String(item.sendAt),
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptivePreferenceBudgetViews(items: AdaptivePreferenceBudget[]): AdaptivePreferenceBudgetView[] {
  const views: AdaptivePreferenceBudgetView[] = [];
  for (const item of items) {
    views.push(toAdaptivePreferenceBudgetView(item));
  }
  return views;
}

export function sumAdaptivePreferenceBudgetView(view: AdaptivePreferenceBudgetView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedImpressions + parsedScore + parsedRate;
}
