import * as text from "../../../../kit/text.js";
import { StrictBidRuleVariance } from "./strict-bid-rule-variance.js";

/** How screens and exports show a strict bid rule variance. */
export class StrictBidRuleVarianceView {
  code: string;
  labelText: string;
  margin: string;
  ceiling: string;
  frequencyCap: string;
  reviewer: string;
  updatedAt: string;
  openRate: string;
  unit: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    margin: string,
    ceiling: string,
    frequencyCap: string,
    reviewer: string,
    updatedAt: string,
    openRate: string,
    unit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.margin = margin;
    this.ceiling = ceiling;
    this.frequencyCap = frequencyCap;
    this.reviewer = reviewer;
    this.updatedAt = updatedAt;
    this.openRate = openRate;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toStrictBidRuleVarianceView(item: StrictBidRuleVariance): StrictBidRuleVarianceView {
  return new StrictBidRuleVarianceView(
    text.truncate(item.code, 80),
    item.label,
    item.margin.toFixed(2),
    item.ceiling.toFixed(2),
    String(item.frequencyCap),
    item.reviewer,
    String(item.updatedAt),
    item.openRate.toFixed(2),
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictBidRuleVarianceViews(items: StrictBidRuleVariance[]): StrictBidRuleVarianceView[] {
  const views: StrictBidRuleVarianceView[] = [];
  for (const item of items) {
    views.push(toStrictBidRuleVarianceView(item));
  }
  return views;
}

export function sumStrictBidRuleVarianceView(view: StrictBidRuleVarianceView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedMargin + parsedCeiling + parsedFrequencyCap;
}
