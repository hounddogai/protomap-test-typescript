import { NudgeTier } from "./nudge-tier.js";

/** How screens and exports show a nudge tier. */
export class NudgeTierView {
  code: string;
  name: string;
  sourceText: string;
  quantityText: string;
  reviewer: string;
  floorValue: string;
  pinned: string;
  notes: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    sourceText: string,
    quantityText: string,
    reviewer: string,
    floorValue: string,
    pinned: string,
    notes: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.sourceText = sourceText;
    this.quantityText = quantityText;
    this.reviewer = reviewer;
    this.floorValue = floorValue;
    this.pinned = pinned;
    this.notes = notes;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toNudgeTierView(item: NudgeTier): NudgeTierView {
  return new NudgeTierView(
    item.code,
    item.name,
    item.source,
    String(item.quantity),
    item.reviewer,
    item.floorValue.toFixed(2),
    `${item.pinned}`,
    item.notes,
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toNudgeTierViews(items: NudgeTier[]): NudgeTierView[] {
  const views: NudgeTierView[] = [];
  for (const item of items) {
    views.push(toNudgeTierView(item));
  }
  return views;
}

export function sumNudgeTierView(view: NudgeTierView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedQuantity + parsedFloorValue;
}
