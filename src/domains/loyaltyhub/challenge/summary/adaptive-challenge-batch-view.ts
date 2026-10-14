import * as text from "../../../../kit/text.js";
import { AdaptiveChallengeBatch } from "./adaptive-challenge-batch.js";

/** How screens and exports show a adaptive challenge batch. */
export class AdaptiveChallengeBatchView {
  codeText: string;
  label: string;
  summary: string;
  cost: string;
  conversionRate: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    summary: string,
    cost: string,
    conversionRate: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.summary = summary;
    this.cost = cost;
    this.conversionRate = conversionRate;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveChallengeBatchView(item: AdaptiveChallengeBatch): AdaptiveChallengeBatchView {
  return new AdaptiveChallengeBatchView(
    text.truncate(item.code, 120),
    item.label,
    item.summary,
    item.cost.toFixed(2),
    item.conversionRate.toFixed(2),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveChallengeBatchViews(items: AdaptiveChallengeBatch[]): AdaptiveChallengeBatchView[] {
  const views: AdaptiveChallengeBatchView[] = [];
  for (const item of items) {
    views.push(toAdaptiveChallengeBatchView(item));
  }
  return views;
}

export function sumAdaptiveChallengeBatchView(view: AdaptiveChallengeBatchView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedCost + parsedConversionRate + parsedGraceDays;
}
