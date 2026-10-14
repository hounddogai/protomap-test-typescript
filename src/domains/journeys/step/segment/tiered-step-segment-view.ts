import { TieredStepSegment } from "./tiered-step-segment.js";

/** How screens and exports show a tiered step segment. */
export class TieredStepSegmentView {
  code: string;
  labelText: string;
  frequencyCap: string;
  country: string;
  quantityText: string;
  amount: string;
  name: string;
  cost: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    frequencyCap: string,
    country: string,
    quantityText: string,
    amount: string,
    name: string,
    cost: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.frequencyCap = frequencyCap;
    this.country = country;
    this.quantityText = quantityText;
    this.amount = amount;
    this.name = name;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toTieredStepSegmentView(item: TieredStepSegment): TieredStepSegmentView {
  return new TieredStepSegmentView(
    item.code,
    item.label,
    String(item.frequencyCap),
    item.country,
    String(item.quantity),
    item.amount.toFixed(2),
    item.name,
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredStepSegmentViews(items: TieredStepSegment[]): TieredStepSegmentView[] {
  const views: TieredStepSegmentView[] = [];
  for (const item of items) {
    views.push(toTieredStepSegmentView(item));
  }
  return views;
}

export function sumTieredStepSegmentView(view: TieredStepSegmentView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedFrequencyCap + parsedQuantity + parsedAmount;
}
