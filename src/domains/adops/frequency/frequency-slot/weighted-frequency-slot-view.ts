import * as text from "../../../../kit/text.js";
import { WeightedFrequencySlot } from "./weighted-frequency-slot.js";

/** How screens and exports show a weighted frequency slot. */
export class WeightedFrequencySlotView {
  code: string;
  title: string;
  unit: string;
  variantText: string;
  floorValue: string;
  source: string;
  startsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    unit: string,
    variantText: string,
    floorValue: string,
    source: string,
    startsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.unit = unit;
    this.variantText = variantText;
    this.floorValue = floorValue;
    this.source = source;
    this.startsAt = startsAt;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedFrequencySlotView(item: WeightedFrequencySlot): WeightedFrequencySlotView {
  return new WeightedFrequencySlotView(
    item.code,
    item.title,
    item.unit,
    text.truncate(item.variant, 64),
    item.floorValue.toFixed(2),
    item.source,
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedFrequencySlotViews(items: WeightedFrequencySlot[]): WeightedFrequencySlotView[] {
  const views: WeightedFrequencySlotView[] = [];
  for (const item of items) {
    views.push(toWeightedFrequencySlotView(item));
  }
  return views;
}

export function sumWeightedFrequencySlotView(view: WeightedFrequencySlotView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedFloorValue + parsedStartsAt;
}
