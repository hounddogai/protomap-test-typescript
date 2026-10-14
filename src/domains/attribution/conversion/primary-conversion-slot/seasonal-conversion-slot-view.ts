import * as text from "../../../../kit/text.js";
import { SeasonalConversionSlot } from "./seasonal-conversion-slot.js";

/** How screens and exports show a seasonal conversion slot. */
export class SeasonalConversionSlotView {
  code: string;
  name: string;
  minimum: string;
  journeyId: string;
  segmentText: string;
  costText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    minimum: string,
    journeyId: string,
    segmentText: string,
    costText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.minimum = minimum;
    this.journeyId = journeyId;
    this.segmentText = segmentText;
    this.costText = costText;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalConversionSlotView(item: SeasonalConversionSlot): SeasonalConversionSlotView {
  return new SeasonalConversionSlotView(
    item.code,
    text.truncate(item.name, 64),
    item.minimum.toFixed(2),
    text.truncate(item.journeyId, 64),
    item.segment,
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalConversionSlotViews(items: SeasonalConversionSlot[]): SeasonalConversionSlotView[] {
  const views: SeasonalConversionSlotView[] = [];
  for (const item of items) {
    views.push(toSeasonalConversionSlotView(item));
  }
  return views;
}

export function sumSeasonalConversionSlotView(view: SeasonalConversionSlotView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  return parsedMinimum + parsedCost;
}
