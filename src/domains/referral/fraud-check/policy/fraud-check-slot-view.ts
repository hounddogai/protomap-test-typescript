import * as text from "../../../../kit/text.js";
import { FraudCheckSlot } from "./fraud-check-slot.js";

/** How screens and exports show a fraud check slot. */
export class FraudCheckSlotView {
  code: string;
  labelText: string;
  durationMinutesText: string;
  segmentText: string;
  channelText: string;
  variant: string;
  cost: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    durationMinutesText: string,
    segmentText: string,
    channelText: string,
    variant: string,
    cost: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.durationMinutesText = durationMinutesText;
    this.segmentText = segmentText;
    this.channelText = channelText;
    this.variant = variant;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toFraudCheckSlotView(item: FraudCheckSlot): FraudCheckSlotView {
  return new FraudCheckSlotView(
    item.code,
    item.label,
    String(item.durationMinutes),
    text.truncate(item.segment, 120),
    item.channel,
    text.truncate(item.variant, 40),
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFraudCheckSlotViews(items: FraudCheckSlot[]): FraudCheckSlotView[] {
  const views: FraudCheckSlotView[] = [];
  for (const item of items) {
    views.push(toFraudCheckSlotView(item));
  }
  return views;
}

export function sumFraudCheckSlotView(view: FraudCheckSlotView): number {
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedDurationMinutes + parsedCost;
}
