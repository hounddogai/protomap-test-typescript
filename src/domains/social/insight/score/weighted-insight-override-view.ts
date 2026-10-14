import * as text from "../../../../kit/text.js";
import { WeightedInsightOverride } from "./weighted-insight-override.js";

/** How screens and exports show a weighted insight override. */
export class WeightedInsightOverrideView {
  code: string;
  labelText: string;
  sourceText: string;
  costText: string;
  country: string;
  descriptionText: string;
  currency: string;
  reviewer: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    sourceText: string,
    costText: string,
    country: string,
    descriptionText: string,
    currency: string,
    reviewer: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.sourceText = sourceText;
    this.costText = costText;
    this.country = country;
    this.descriptionText = descriptionText;
    this.currency = currency;
    this.reviewer = reviewer;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedInsightOverrideView(item: WeightedInsightOverride): WeightedInsightOverrideView {
  return new WeightedInsightOverrideView(
    item.code,
    item.label,
    item.source,
    item.cost.toFixed(2),
    text.truncate(item.country, 40),
    item.description,
    text.truncate(item.currency, 40),
    text.truncate(item.reviewer, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedInsightOverrideViews(items: WeightedInsightOverride[]): WeightedInsightOverrideView[] {
  const views: WeightedInsightOverrideView[] = [];
  for (const item of items) {
    views.push(toWeightedInsightOverrideView(item));
  }
  return views;
}

export function sumWeightedInsightOverrideView(view: WeightedInsightOverrideView): number {
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  return parsedCost;
}
