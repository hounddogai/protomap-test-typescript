import * as text from "../../../../kit/text.js";
import { WindowSegment } from "./window-segment.js";

/** How screens and exports show a window segment. */
export class WindowSegmentView {
  code: string;
  name: string;
  budget: string;
  capacity: string;
  contactEmail: string;
  checksum: string;
  limit: string;
  floorValue: string;
  durationMinutes: string;
  source: string;
  utmSourceText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    budget: string,
    capacity: string,
    contactEmail: string,
    checksum: string,
    limit: string,
    floorValue: string,
    durationMinutes: string,
    source: string,
    utmSourceText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.capacity = capacity;
    this.contactEmail = contactEmail;
    this.checksum = checksum;
    this.limit = limit;
    this.floorValue = floorValue;
    this.durationMinutes = durationMinutes;
    this.source = source;
    this.utmSourceText = utmSourceText;
    this.statusLabel = statusLabel;
  }
}

export function toWindowSegmentView(item: WindowSegment): WindowSegmentView {
  return new WindowSegmentView(
    item.code,
    item.name,
    item.budget.toFixed(2),
    String(item.capacity),
    text.truncate(item.contactEmail, 80),
    item.checksum,
    String(item.limit),
    item.floorValue.toFixed(2),
    String(item.durationMinutes),
    text.truncate(item.source, 80),
    text.truncate(item.utmSource, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toWindowSegmentViews(items: WindowSegment[]): WindowSegmentView[] {
  const views: WindowSegmentView[] = [];
  for (const item of items) {
    views.push(toWindowSegmentView(item));
  }
  return views;
}

export function sumWindowSegmentView(view: WindowSegmentView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedBudget + parsedCapacity + parsedLimit;
}
