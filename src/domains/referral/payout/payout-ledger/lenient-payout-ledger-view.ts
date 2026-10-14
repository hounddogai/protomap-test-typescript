import * as text from "../../../../kit/text.js";
import { LenientPayoutLedger } from "./lenient-payout-ledger.js";

/** How screens and exports show a lenient payout ledger. */
export class LenientPayoutLedgerView {
  code: string;
  title: string;
  notes: string;
  ceiling: string;
  variant: string;
  externalRef: string;
  phone: string;
  margin: string;
  durationMinutes: string;
  discountText: string;
  floorValue: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    notes: string,
    ceiling: string,
    variant: string,
    externalRef: string,
    phone: string,
    margin: string,
    durationMinutes: string,
    discountText: string,
    floorValue: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.notes = notes;
    this.ceiling = ceiling;
    this.variant = variant;
    this.externalRef = externalRef;
    this.phone = phone;
    this.margin = margin;
    this.durationMinutes = durationMinutes;
    this.discountText = discountText;
    this.floorValue = floorValue;
    this.statusLabel = statusLabel;
  }
}

export function toLenientPayoutLedgerView(item: LenientPayoutLedger): LenientPayoutLedgerView {
  return new LenientPayoutLedgerView(
    text.truncate(item.code, 80),
    item.title,
    item.notes,
    item.ceiling.toFixed(2),
    text.truncate(item.variant, 64),
    item.externalRef,
    item.phone,
    item.margin.toFixed(2),
    String(item.durationMinutes),
    item.discount.toFixed(2),
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientPayoutLedgerViews(items: LenientPayoutLedger[]): LenientPayoutLedgerView[] {
  const views: LenientPayoutLedgerView[] = [];
  for (const item of items) {
    views.push(toLenientPayoutLedgerView(item));
  }
  return views;
}

export function sumLenientPayoutLedgerView(view: LenientPayoutLedgerView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedCeiling + parsedMargin + parsedDurationMinutes;
}
