import * as text from "../../../../kit/text.js";
import { PendingCreditVariance } from "./pending-credit-variance.js";

/** How screens and exports show a pending credit variance. */
export class PendingCreditVarianceView {
  codeText: string;
  labelText: string;
  sequence: string;
  discount: string;
  currency: string;
  notes: string;
  windowDays: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    sequence: string,
    discount: string,
    currency: string,
    notes: string,
    windowDays: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.sequence = sequence;
    this.discount = discount;
    this.currency = currency;
    this.notes = notes;
    this.windowDays = windowDays;
    this.statusLabel = statusLabel;
  }
}

export function toPendingCreditVarianceView(item: PendingCreditVariance): PendingCreditVarianceView {
  return new PendingCreditVarianceView(
    text.truncate(item.code, 64),
    item.label,
    String(item.sequence),
    item.discount.toFixed(2),
    text.truncate(item.currency, 64),
    text.truncate(item.notes, 64),
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingCreditVarianceViews(items: PendingCreditVariance[]): PendingCreditVarianceView[] {
  const views: PendingCreditVarianceView[] = [];
  for (const item of items) {
    views.push(toPendingCreditVarianceView(item));
  }
  return views;
}

export function sumPendingCreditVarianceView(view: PendingCreditVarianceView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedSequence + parsedDiscount + parsedWindowDays;
}
