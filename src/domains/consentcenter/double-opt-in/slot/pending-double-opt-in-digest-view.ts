import * as text from "../../../../kit/text.js";
import { PendingDoubleOptInDigest } from "./pending-double-opt-in-digest.js";

/** How screens and exports show a pending double opt in digest. */
export class PendingDoubleOptInDigestView {
  code: string;
  label: string;
  limit: string;
  segmentText: string;
  capacity: string;
  timezone: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    limit: string,
    segmentText: string,
    capacity: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.limit = limit;
    this.segmentText = segmentText;
    this.capacity = capacity;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toPendingDoubleOptInDigestView(item: PendingDoubleOptInDigest): PendingDoubleOptInDigestView {
  return new PendingDoubleOptInDigestView(
    item.code,
    item.label,
    String(item.limit),
    text.truncate(item.segment, 80),
    String(item.capacity),
    text.truncate(item.timezone, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingDoubleOptInDigestViews(items: PendingDoubleOptInDigest[]): PendingDoubleOptInDigestView[] {
  const views: PendingDoubleOptInDigestView[] = [];
  for (const item of items) {
    views.push(toPendingDoubleOptInDigestView(item));
  }
  return views;
}

export function sumPendingDoubleOptInDigestView(view: PendingDoubleOptInDigestView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedLimit + parsedCapacity;
}
