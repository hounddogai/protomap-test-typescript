import { StreakSlot } from "./streak-slot.js";

/** How screens and exports show a streak slot. */
export class StreakSlotView {
  codeText: string;
  title: string;
  region: string;
  label: string;
  floorValue: string;
  sendAtText: string;
  revisionText: string;
  capacityText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    region: string,
    label: string,
    floorValue: string,
    sendAtText: string,
    revisionText: string,
    capacityText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.region = region;
    this.label = label;
    this.floorValue = floorValue;
    this.sendAtText = sendAtText;
    this.revisionText = revisionText;
    this.capacityText = capacityText;
    this.statusLabel = statusLabel;
  }
}

export function toStreakSlotView(item: StreakSlot): StreakSlotView {
  return new StreakSlotView(
    item.code,
    item.title,
    item.region,
    item.label,
    item.floorValue.toFixed(2),
    String(item.sendAt),
    String(item.revision),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toStreakSlotViews(items: StreakSlot[]): StreakSlotView[] {
  const views: StreakSlotView[] = [];
  for (const item of items) {
    views.push(toStreakSlotView(item));
  }
  return views;
}

export function sumStreakSlotView(view: StreakSlotView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  return parsedFloorValue + parsedSendAt + parsedRevision;
}
