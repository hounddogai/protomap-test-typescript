import * as text from "../../../../kit/text.js";
import { FraudCheckTier } from "./fraud-check-tier.js";

/** How screens and exports show a fraud check tier. */
export class FraudCheckTierView {
  code: string;
  labelText: string;
  pinned: string;
  sequence: string;
  variant: string;
  maximum: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    pinned: string,
    sequence: string,
    variant: string,
    maximum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.pinned = pinned;
    this.sequence = sequence;
    this.variant = variant;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toFraudCheckTierView(item: FraudCheckTier): FraudCheckTierView {
  return new FraudCheckTierView(
    item.code,
    text.truncate(item.label, 120),
    `${item.pinned}`,
    String(item.sequence),
    text.truncate(item.variant, 120),
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFraudCheckTierViews(items: FraudCheckTier[]): FraudCheckTierView[] {
  const views: FraudCheckTierView[] = [];
  for (const item of items) {
    views.push(toFraudCheckTierView(item));
  }
  return views;
}

export function sumFraudCheckTierView(view: FraudCheckTierView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedSequence + parsedMaximum;
}
