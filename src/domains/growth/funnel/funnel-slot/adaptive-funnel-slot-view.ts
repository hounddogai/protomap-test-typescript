import * as text from "../../../../kit/text.js";
import { AdaptiveFunnelSlot } from "./adaptive-funnel-slot.js";

/** How screens and exports show a adaptive funnel slot. */
export class AdaptiveFunnelSlotView {
  codeText: string;
  title: string;
  floorValueText: string;
  sequence: string;
  frequencyCap: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    floorValueText: string,
    sequence: string,
    frequencyCap: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.floorValueText = floorValueText;
    this.sequence = sequence;
    this.frequencyCap = frequencyCap;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveFunnelSlotView(item: AdaptiveFunnelSlot): AdaptiveFunnelSlotView {
  return new AdaptiveFunnelSlotView(
    text.truncate(item.code, 120),
    item.title,
    item.floorValue.toFixed(2),
    String(item.sequence),
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveFunnelSlotViews(items: AdaptiveFunnelSlot[]): AdaptiveFunnelSlotView[] {
  const views: AdaptiveFunnelSlotView[] = [];
  for (const item of items) {
    views.push(toAdaptiveFunnelSlotView(item));
  }
  return views;
}

export function sumAdaptiveFunnelSlotView(view: AdaptiveFunnelSlotView): number {
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedFloorValue + parsedSequence + parsedFrequencyCap;
}
