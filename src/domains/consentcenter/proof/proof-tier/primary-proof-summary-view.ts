import * as text from "../../../../kit/text.js";
import { PrimaryProofSummary } from "./primary-proof-summary.js";

/** How screens and exports show a primary proof summary. */
export class PrimaryProofSummaryView {
  code: string;
  name: string;
  cost: string;
  thresholdText: string;
  currency: string;
  utmSourceText: string;
  maximum: string;
  variant: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    cost: string,
    thresholdText: string,
    currency: string,
    utmSourceText: string,
    maximum: string,
    variant: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.cost = cost;
    this.thresholdText = thresholdText;
    this.currency = currency;
    this.utmSourceText = utmSourceText;
    this.maximum = maximum;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryProofSummaryView(item: PrimaryProofSummary): PrimaryProofSummaryView {
  return new PrimaryProofSummaryView(
    item.code,
    item.name,
    item.cost.toFixed(2),
    item.threshold.toFixed(2),
    text.truncate(item.currency, 64),
    item.utmSource,
    item.maximum.toFixed(2),
    text.truncate(item.variant, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryProofSummaryViews(items: PrimaryProofSummary[]): PrimaryProofSummaryView[] {
  const views: PrimaryProofSummaryView[] = [];
  for (const item of items) {
    views.push(toPrimaryProofSummaryView(item));
  }
  return views;
}

export function sumPrimaryProofSummaryView(view: PrimaryProofSummaryView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedCost + parsedThreshold + parsedMaximum;
}
