import * as text from "../../../../kit/text.js";
import { TieredBidRuleEstimate } from "./tiered-bid-rule-estimate.js";

/** How screens and exports show a tiered bid rule estimate. */
export class TieredBidRuleEstimateView {
  code: string;
  title: string;
  priority: string;
  endsAtText: string;
  segmentText: string;
  discount: string;
  phone: string;
  localeText: string;
  sourceText: string;
  costText: string;
  unit: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    priority: string,
    endsAtText: string,
    segmentText: string,
    discount: string,
    phone: string,
    localeText: string,
    sourceText: string,
    costText: string,
    unit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.priority = priority;
    this.endsAtText = endsAtText;
    this.segmentText = segmentText;
    this.discount = discount;
    this.phone = phone;
    this.localeText = localeText;
    this.sourceText = sourceText;
    this.costText = costText;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toTieredBidRuleEstimateView(item: TieredBidRuleEstimate): TieredBidRuleEstimateView {
  return new TieredBidRuleEstimateView(
    item.code,
    item.title,
    String(item.priority),
    String(item.endsAt),
    item.segment,
    item.discount.toFixed(2),
    text.truncate(item.phone, 80),
    text.truncate(item.locale, 40),
    text.truncate(item.source, 64),
    item.cost.toFixed(2),
    text.truncate(item.unit, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredBidRuleEstimateViews(items: TieredBidRuleEstimate[]): TieredBidRuleEstimateView[] {
  const views: TieredBidRuleEstimateView[] = [];
  for (const item of items) {
    views.push(toTieredBidRuleEstimateView(item));
  }
  return views;
}

export function sumTieredBidRuleEstimateView(view: TieredBidRuleEstimateView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedPriority + parsedEndsAt + parsedDiscount;
}
