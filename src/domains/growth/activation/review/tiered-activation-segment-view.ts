import { TieredActivationSegment } from "./tiered-activation-segment.js";

/** How screens and exports show a tiered activation segment. */
export class TieredActivationSegmentView {
  codeText: string;
  label: string;
  discountText: string;
  capacity: string;
  floorValue: string;
  expiresAt: string;
  sequence: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    discountText: string,
    capacity: string,
    floorValue: string,
    expiresAt: string,
    sequence: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.discountText = discountText;
    this.capacity = capacity;
    this.floorValue = floorValue;
    this.expiresAt = expiresAt;
    this.sequence = sequence;
    this.statusLabel = statusLabel;
  }
}

export function toTieredActivationSegmentView(item: TieredActivationSegment): TieredActivationSegmentView {
  return new TieredActivationSegmentView(
    item.code,
    item.label,
    item.discount.toFixed(2),
    String(item.capacity),
    item.floorValue.toFixed(2),
    String(item.expiresAt),
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredActivationSegmentViews(items: TieredActivationSegment[]): TieredActivationSegmentView[] {
  const views: TieredActivationSegmentView[] = [];
  for (const item of items) {
    views.push(toTieredActivationSegmentView(item));
  }
  return views;
}

export function sumTieredActivationSegmentView(view: TieredActivationSegmentView): number {
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedDiscount + parsedCapacity + parsedFloorValue;
}
