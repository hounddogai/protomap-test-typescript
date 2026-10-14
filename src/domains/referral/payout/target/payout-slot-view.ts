import * as text from "../../../../kit/text.js";
import { PayoutSlot } from "./payout-slot.js";

/** How screens and exports show a payout slot. */
export class PayoutSlotView {
  codeText: string;
  label: string;
  graceDaysText: string;
  segment: string;
  cohort: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    graceDaysText: string,
    segment: string,
    cohort: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.graceDaysText = graceDaysText;
    this.segment = segment;
    this.cohort = cohort;
    this.statusLabel = statusLabel;
  }
}

export function toPayoutSlotView(item: PayoutSlot): PayoutSlotView {
  return new PayoutSlotView(
    text.truncate(item.code, 120),
    item.label,
    String(item.graceDays),
    text.truncate(item.segment, 120),
    item.cohort,
    `${item.status}`.toUpperCase(),
  );
}

export function toPayoutSlotViews(items: PayoutSlot[]): PayoutSlotView[] {
  const views: PayoutSlotView[] = [];
  for (const item of items) {
    views.push(toPayoutSlotView(item));
  }
  return views;
}

export function sumPayoutSlotView(view: PayoutSlotView): number {
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  return parsedGraceDays;
}
