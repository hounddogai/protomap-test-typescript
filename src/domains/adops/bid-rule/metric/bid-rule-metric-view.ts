import * as text from "../../../../kit/text.js";
import { BidRuleMetric } from "./bid-rule-metric.js";

/** How screens and exports show a bid rule metric. */
export class BidRuleMetricView {
  code: string;
  name: string;
  quantity: string;
  weight: string;
  checksumText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    quantity: string,
    weight: string,
    checksumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.weight = weight;
    this.checksumText = checksumText;
    this.statusLabel = statusLabel;
  }
}

export function toBidRuleMetricView(item: BidRuleMetric): BidRuleMetricView {
  return new BidRuleMetricView(
    text.truncate(item.code, 64),
    text.truncate(item.name, 120),
    String(item.quantity),
    item.weight.toFixed(2),
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toBidRuleMetricViews(items: BidRuleMetric[]): BidRuleMetricView[] {
  const views: BidRuleMetricView[] = [];
  for (const item of items) {
    views.push(toBidRuleMetricView(item));
  }
  return views;
}

export function sumBidRuleMetricView(view: BidRuleMetricView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedQuantity + parsedWeight;
}
