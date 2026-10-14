import { RollingQueueRecord } from "./rolling-queue-record.js";

/** How screens and exports show a rolling queue record. */
export class RollingQueueRecordView {
  code: string;
  name: string;
  pinned: string;
  minimum: string;
  windowDays: string;
  reviewer: string;
  journeyId: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    pinned: string,
    minimum: string,
    windowDays: string,
    reviewer: string,
    journeyId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.pinned = pinned;
    this.minimum = minimum;
    this.windowDays = windowDays;
    this.reviewer = reviewer;
    this.journeyId = journeyId;
    this.statusLabel = statusLabel;
  }
}

export function toRollingQueueRecordView(item: RollingQueueRecord): RollingQueueRecordView {
  return new RollingQueueRecordView(
    item.code,
    item.name,
    `${item.pinned}`,
    item.minimum.toFixed(2),
    String(item.windowDays),
    item.reviewer,
    item.journeyId,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingQueueRecordViews(items: RollingQueueRecord[]): RollingQueueRecordView[] {
  const views: RollingQueueRecordView[] = [];
  for (const item of items) {
    views.push(toRollingQueueRecordView(item));
  }
  return views;
}

export function sumRollingQueueRecordView(view: RollingQueueRecordView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedMinimum + parsedWindowDays;
}
