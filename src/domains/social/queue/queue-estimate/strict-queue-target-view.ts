import * as text from "../../../../kit/text.js";
import { StrictQueueTarget } from "./strict-queue-target.js";

/** How screens and exports show a strict queue target. */
export class StrictQueueTargetView {
  codeText: string;
  title: string;
  minimum: string;
  capacity: string;
  phoneText: string;
  audienceId: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    minimum: string,
    capacity: string,
    phoneText: string,
    audienceId: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.minimum = minimum;
    this.capacity = capacity;
    this.phoneText = phoneText;
    this.audienceId = audienceId;
    this.statusLabel = statusLabel;
  }
}

export function toStrictQueueTargetView(item: StrictQueueTarget): StrictQueueTargetView {
  return new StrictQueueTargetView(
    text.truncate(item.code, 40),
    text.truncate(item.title, 120),
    item.minimum.toFixed(2),
    String(item.capacity),
    item.phone,
    item.audienceId,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictQueueTargetViews(items: StrictQueueTarget[]): StrictQueueTargetView[] {
  const views: StrictQueueTargetView[] = [];
  for (const item of items) {
    views.push(toStrictQueueTargetView(item));
  }
  return views;
}

export function sumStrictQueueTargetView(view: StrictQueueTargetView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedMinimum + parsedCapacity;
}
