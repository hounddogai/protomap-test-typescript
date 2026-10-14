import * as text from "../../../../kit/text.js";
import { LenientWaitBaseline } from "./lenient-wait-baseline.js";

/** How screens and exports show a lenient wait baseline. */
export class LenientWaitBaselineView {
  code: string;
  title: string;
  audienceId: string;
  floorValue: string;
  durationMinutes: string;
  regionText: string;
  ownerIdText: string;
  capacity: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    audienceId: string,
    floorValue: string,
    durationMinutes: string,
    regionText: string,
    ownerIdText: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.audienceId = audienceId;
    this.floorValue = floorValue;
    this.durationMinutes = durationMinutes;
    this.regionText = regionText;
    this.ownerIdText = ownerIdText;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toLenientWaitBaselineView(item: LenientWaitBaseline): LenientWaitBaselineView {
  return new LenientWaitBaselineView(
    item.code,
    item.title,
    item.audienceId,
    item.floorValue.toFixed(2),
    String(item.durationMinutes),
    text.truncate(item.region, 64),
    item.ownerId,
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientWaitBaselineViews(items: LenientWaitBaseline[]): LenientWaitBaselineView[] {
  const views: LenientWaitBaselineView[] = [];
  for (const item of items) {
    views.push(toLenientWaitBaselineView(item));
  }
  return views;
}

export function sumLenientWaitBaselineView(view: LenientWaitBaselineView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedFloorValue + parsedDurationMinutes + parsedCapacity;
}
