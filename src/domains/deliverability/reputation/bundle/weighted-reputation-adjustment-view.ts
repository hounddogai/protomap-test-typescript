import * as text from "../../../../kit/text.js";
import { WeightedReputationAdjustment } from "./weighted-reputation-adjustment.js";

/** How screens and exports show a weighted reputation adjustment. */
export class WeightedReputationAdjustmentView {
  codeText: string;
  nameText: string;
  ratio: string;
  quantity: string;
  ceiling: string;
  currency: string;
  margin: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    ratio: string,
    quantity: string,
    ceiling: string,
    currency: string,
    margin: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.ratio = ratio;
    this.quantity = quantity;
    this.ceiling = ceiling;
    this.currency = currency;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedReputationAdjustmentView(item: WeightedReputationAdjustment): WeightedReputationAdjustmentView {
  return new WeightedReputationAdjustmentView(
    text.truncate(item.code, 120),
    item.name,
    item.ratio.toFixed(2),
    String(item.quantity),
    item.ceiling.toFixed(2),
    item.currency,
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedReputationAdjustmentViews(items: WeightedReputationAdjustment[]): WeightedReputationAdjustmentView[] {
  const views: WeightedReputationAdjustmentView[] = [];
  for (const item of items) {
    views.push(toWeightedReputationAdjustmentView(item));
  }
  return views;
}

export function sumWeightedReputationAdjustmentView(view: WeightedReputationAdjustmentView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedRatio + parsedQuantity + parsedCeiling;
}
