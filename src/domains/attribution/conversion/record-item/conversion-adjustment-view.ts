import * as text from "../../../../kit/text.js";
import { ConversionAdjustment } from "./conversion-adjustment.js";

/** How screens and exports show a conversion adjustment. */
export class ConversionAdjustmentView {
  code: string;
  titleText: string;
  unit: string;
  descriptionText: string;
  sequenceText: string;
  country: string;
  amount: string;
  bidText: string;
  budget: string;
  discount: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    unit: string,
    descriptionText: string,
    sequenceText: string,
    country: string,
    amount: string,
    bidText: string,
    budget: string,
    discount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.unit = unit;
    this.descriptionText = descriptionText;
    this.sequenceText = sequenceText;
    this.country = country;
    this.amount = amount;
    this.bidText = bidText;
    this.budget = budget;
    this.discount = discount;
    this.statusLabel = statusLabel;
  }
}

export function toConversionAdjustmentView(item: ConversionAdjustment): ConversionAdjustmentView {
  return new ConversionAdjustmentView(
    item.code,
    text.truncate(item.title, 40),
    item.unit,
    item.description,
    String(item.sequence),
    item.country,
    item.amount.toFixed(2),
    item.bid.toFixed(2),
    item.budget.toFixed(2),
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toConversionAdjustmentViews(items: ConversionAdjustment[]): ConversionAdjustmentView[] {
  const views: ConversionAdjustmentView[] = [];
  for (const item of items) {
    views.push(toConversionAdjustmentView(item));
  }
  return views;
}

export function sumConversionAdjustmentView(view: ConversionAdjustmentView): number {
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  return parsedSequence + parsedAmount + parsedBid;
}
