import { LegacyPlacementSlot } from "./legacy-placement-slot.js";

/** How screens and exports show a legacy placement slot. */
export class LegacyPlacementSlotView {
  code: string;
  label: string;
  threshold: string;
  amount: string;
  ceiling: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    threshold: string,
    amount: string,
    ceiling: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.amount = amount;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyPlacementSlotView(item: LegacyPlacementSlot): LegacyPlacementSlotView {
  return new LegacyPlacementSlotView(
    item.code,
    item.label,
    item.threshold.toFixed(2),
    item.amount.toFixed(2),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyPlacementSlotViews(items: LegacyPlacementSlot[]): LegacyPlacementSlotView[] {
  const views: LegacyPlacementSlotView[] = [];
  for (const item of items) {
    views.push(toLegacyPlacementSlotView(item));
  }
  return views;
}

export function sumLegacyPlacementSlotView(view: LegacyPlacementSlotView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedThreshold + parsedAmount + parsedCeiling;
}
