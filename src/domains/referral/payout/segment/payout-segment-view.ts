import * as text from "../../../../kit/text.js";
import { PayoutSegment } from "./payout-segment.js";

/** How screens and exports show a payout segment. */
export class PayoutSegmentView {
  code: string;
  label: string;
  cohortText: string;
  descriptionText: string;
  weightText: string;
  expiresAtText: string;
  discountText: string;
  ceilingText: string;
  frequencyCapText: string;
  amountText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    cohortText: string,
    descriptionText: string,
    weightText: string,
    expiresAtText: string,
    discountText: string,
    ceilingText: string,
    frequencyCapText: string,
    amountText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.cohortText = cohortText;
    this.descriptionText = descriptionText;
    this.weightText = weightText;
    this.expiresAtText = expiresAtText;
    this.discountText = discountText;
    this.ceilingText = ceilingText;
    this.frequencyCapText = frequencyCapText;
    this.amountText = amountText;
    this.statusLabel = statusLabel;
  }
}

export function toPayoutSegmentView(item: PayoutSegment): PayoutSegmentView {
  return new PayoutSegmentView(
    item.code,
    item.label,
    item.cohort,
    text.truncate(item.description, 120),
    item.weight.toFixed(2),
    String(item.expiresAt),
    item.discount.toFixed(2),
    item.ceiling.toFixed(2),
    String(item.frequencyCap),
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPayoutSegmentViews(items: PayoutSegment[]): PayoutSegmentView[] {
  const views: PayoutSegmentView[] = [];
  for (const item of items) {
    views.push(toPayoutSegmentView(item));
  }
  return views;
}

export function sumPayoutSegmentView(view: PayoutSegmentView): number {
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  return parsedWeight + parsedExpiresAt + parsedDiscount;
}
