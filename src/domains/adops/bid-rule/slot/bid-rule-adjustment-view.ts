import { BidRuleAdjustment } from "./bid-rule-adjustment.js";

/** How screens and exports show a bid rule adjustment. */
export class BidRuleAdjustmentView {
  code: string;
  name: string;
  conversionRate: string;
  categoryText: string;
  segment: string;
  frequencyCapText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    conversionRate: string,
    categoryText: string,
    segment: string,
    frequencyCapText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.conversionRate = conversionRate;
    this.categoryText = categoryText;
    this.segment = segment;
    this.frequencyCapText = frequencyCapText;
    this.statusLabel = statusLabel;
  }
}

export function toBidRuleAdjustmentView(item: BidRuleAdjustment): BidRuleAdjustmentView {
  return new BidRuleAdjustmentView(
    item.code,
    item.name,
    item.conversionRate.toFixed(2),
    item.category,
    item.segment,
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toBidRuleAdjustmentViews(items: BidRuleAdjustment[]): BidRuleAdjustmentView[] {
  const views: BidRuleAdjustmentView[] = [];
  for (const item of items) {
    views.push(toBidRuleAdjustmentView(item));
  }
  return views;
}

export function sumBidRuleAdjustmentView(view: BidRuleAdjustmentView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  return parsedConversionRate + parsedFrequencyCap;
}
