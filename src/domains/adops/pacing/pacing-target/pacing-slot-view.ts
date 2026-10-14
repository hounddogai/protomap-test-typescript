import * as text from "../../../../kit/text.js";
import { PacingSlot } from "./pacing-slot.js";

/** How screens and exports show a pacing slot. */
export class PacingSlotView {
  codeText: string;
  labelText: string;
  floorValue: string;
  endsAtText: string;
  conversionRateText: string;
  expiresAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    floorValue: string,
    endsAtText: string,
    conversionRateText: string,
    expiresAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.floorValue = floorValue;
    this.endsAtText = endsAtText;
    this.conversionRateText = conversionRateText;
    this.expiresAt = expiresAt;
    this.statusLabel = statusLabel;
  }
}

export function toPacingSlotView(item: PacingSlot): PacingSlotView {
  return new PacingSlotView(
    item.code,
    text.truncate(item.label, 64),
    item.floorValue.toFixed(2),
    String(item.endsAt),
    item.conversionRate.toFixed(2),
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toPacingSlotViews(items: PacingSlot[]): PacingSlotView[] {
  const views: PacingSlotView[] = [];
  for (const item of items) {
    views.push(toPacingSlotView(item));
  }
  return views;
}

export function sumPacingSlotView(view: PacingSlotView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  return parsedFloorValue + parsedEndsAt + parsedConversionRate;
}
