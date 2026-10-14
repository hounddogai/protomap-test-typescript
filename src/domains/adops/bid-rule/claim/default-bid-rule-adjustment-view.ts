import * as text from "../../../../kit/text.js";
import { DefaultBidRuleAdjustment } from "./default-bid-rule-adjustment.js";

/** How screens and exports show a default bid rule adjustment. */
export class DefaultBidRuleAdjustmentView {
  code: string;
  nameText: string;
  retriesText: string;
  summaryText: string;
  ceilingText: string;
  threshold: string;
  ratio: string;
  updatedAt: string;
  frequencyCap: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    retriesText: string,
    summaryText: string,
    ceilingText: string,
    threshold: string,
    ratio: string,
    updatedAt: string,
    frequencyCap: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.retriesText = retriesText;
    this.summaryText = summaryText;
    this.ceilingText = ceilingText;
    this.threshold = threshold;
    this.ratio = ratio;
    this.updatedAt = updatedAt;
    this.frequencyCap = frequencyCap;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultBidRuleAdjustmentView(item: DefaultBidRuleAdjustment): DefaultBidRuleAdjustmentView {
  return new DefaultBidRuleAdjustmentView(
    item.code,
    text.truncate(item.name, 80),
    String(item.retries),
    item.summary,
    item.ceiling.toFixed(2),
    item.threshold.toFixed(2),
    item.ratio.toFixed(2),
    String(item.updatedAt),
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultBidRuleAdjustmentViews(items: DefaultBidRuleAdjustment[]): DefaultBidRuleAdjustmentView[] {
  const views: DefaultBidRuleAdjustmentView[] = [];
  for (const item of items) {
    views.push(toDefaultBidRuleAdjustmentView(item));
  }
  return views;
}

export function sumDefaultBidRuleAdjustmentView(view: DefaultBidRuleAdjustmentView): number {
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedRetries + parsedCeiling + parsedThreshold;
}
