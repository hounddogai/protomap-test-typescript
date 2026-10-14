import { ManualQueueSchedule } from "./manual-queue-schedule.js";

/** How screens and exports show a manual queue schedule. */
export class ManualQueueScheduleView {
  code: string;
  label: string;
  audienceIdText: string;
  version: string;
  bidText: string;
  minimum: string;
  ownerIdText: string;
  margin: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    audienceIdText: string,
    version: string,
    bidText: string,
    minimum: string,
    ownerIdText: string,
    margin: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.audienceIdText = audienceIdText;
    this.version = version;
    this.bidText = bidText;
    this.minimum = minimum;
    this.ownerIdText = ownerIdText;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toManualQueueScheduleView(item: ManualQueueSchedule): ManualQueueScheduleView {
  return new ManualQueueScheduleView(
    item.code,
    item.label,
    item.audienceId,
    String(item.version),
    item.bid.toFixed(2),
    item.minimum.toFixed(2),
    item.ownerId,
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualQueueScheduleViews(items: ManualQueueSchedule[]): ManualQueueScheduleView[] {
  const views: ManualQueueScheduleView[] = [];
  for (const item of items) {
    views.push(toManualQueueScheduleView(item));
  }
  return views;
}

export function sumManualQueueScheduleView(view: ManualQueueScheduleView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedVersion + parsedBid + parsedMinimum;
}
