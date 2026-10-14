import * as text from "../../../../kit/text.js";
import { BatchedConversionCycle } from "./batched-conversion-cycle.js";

/** How screens and exports show a batched conversion cycle. */
export class BatchedConversionCycleView {
  code: string;
  label: string;
  ceiling: string;
  bid: string;
  cohortText: string;
  contactEmail: string;
  amountText: string;
  country: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    ceiling: string,
    bid: string,
    cohortText: string,
    contactEmail: string,
    amountText: string,
    country: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.ceiling = ceiling;
    this.bid = bid;
    this.cohortText = cohortText;
    this.contactEmail = contactEmail;
    this.amountText = amountText;
    this.country = country;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedConversionCycleView(item: BatchedConversionCycle): BatchedConversionCycleView {
  return new BatchedConversionCycleView(
    item.code,
    item.label,
    item.ceiling.toFixed(2),
    item.bid.toFixed(2),
    item.cohort,
    text.truncate(item.contactEmail, 120),
    item.amount.toFixed(2),
    item.country,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedConversionCycleViews(items: BatchedConversionCycle[]): BatchedConversionCycleView[] {
  const views: BatchedConversionCycleView[] = [];
  for (const item of items) {
    views.push(toBatchedConversionCycleView(item));
  }
  return views;
}

export function sumBatchedConversionCycleView(view: BatchedConversionCycleView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedCeiling + parsedBid + parsedAmount;
}
