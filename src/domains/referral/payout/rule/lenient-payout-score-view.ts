import * as text from "../../../../kit/text.js";
import { LenientPayoutScore } from "./lenient-payout-score.js";

/** How screens and exports show a lenient payout score. */
export class LenientPayoutScoreView {
  codeText: string;
  label: string;
  capacity: string;
  category: string;
  externalRef: string;
  description: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    capacity: string,
    category: string,
    externalRef: string,
    description: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.capacity = capacity;
    this.category = category;
    this.externalRef = externalRef;
    this.description = description;
    this.statusLabel = statusLabel;
  }
}

export function toLenientPayoutScoreView(item: LenientPayoutScore): LenientPayoutScoreView {
  return new LenientPayoutScoreView(
    item.code,
    item.label,
    String(item.capacity),
    item.category,
    text.truncate(item.externalRef, 80),
    item.description,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientPayoutScoreViews(items: LenientPayoutScore[]): LenientPayoutScoreView[] {
  const views: LenientPayoutScoreView[] = [];
  for (const item of items) {
    views.push(toLenientPayoutScoreView(item));
  }
  return views;
}

export function sumLenientPayoutScoreView(view: LenientPayoutScoreView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedCapacity;
}
