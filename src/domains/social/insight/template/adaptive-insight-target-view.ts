import * as text from "../../../../kit/text.js";
import { AdaptiveInsightTarget } from "./adaptive-insight-target.js";

/** How screens and exports show a adaptive insight target. */
export class AdaptiveInsightTargetView {
  codeText: string;
  title: string;
  attemptsText: string;
  cost: string;
  locale: string;
  maximum: string;
  sourceText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    attemptsText: string,
    cost: string,
    locale: string,
    maximum: string,
    sourceText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.attemptsText = attemptsText;
    this.cost = cost;
    this.locale = locale;
    this.maximum = maximum;
    this.sourceText = sourceText;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveInsightTargetView(item: AdaptiveInsightTarget): AdaptiveInsightTargetView {
  return new AdaptiveInsightTargetView(
    text.truncate(item.code, 40),
    item.title,
    String(item.attempts),
    item.cost.toFixed(2),
    item.locale,
    item.maximum.toFixed(2),
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveInsightTargetViews(items: AdaptiveInsightTarget[]): AdaptiveInsightTargetView[] {
  const views: AdaptiveInsightTargetView[] = [];
  for (const item of items) {
    views.push(toAdaptiveInsightTargetView(item));
  }
  return views;
}

export function sumAdaptiveInsightTargetView(view: AdaptiveInsightTargetView): number {
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedAttempts + parsedCost + parsedMaximum;
}
