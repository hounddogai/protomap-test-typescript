import * as text from "../../../../kit/text.js";
import { FlightNotice } from "./flight-notice.js";

/** How screens and exports show a flight notice. */
export class FlightNoticeView {
  codeText: string;
  name: string;
  score: string;
  capacity: string;
  threshold: string;
  phone: string;
  unit: string;
  revision: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    score: string,
    capacity: string,
    threshold: string,
    phone: string,
    unit: string,
    revision: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.score = score;
    this.capacity = capacity;
    this.threshold = threshold;
    this.phone = phone;
    this.unit = unit;
    this.revision = revision;
    this.statusLabel = statusLabel;
  }
}

export function toFlightNoticeView(item: FlightNotice): FlightNoticeView {
  return new FlightNoticeView(
    item.code,
    item.name,
    item.score.toFixed(2),
    String(item.capacity),
    item.threshold.toFixed(2),
    item.phone,
    text.truncate(item.unit, 64),
    String(item.revision),
    `${item.status}`.toUpperCase(),
  );
}

export function toFlightNoticeViews(items: FlightNotice[]): FlightNoticeView[] {
  const views: FlightNoticeView[] = [];
  for (const item of items) {
    views.push(toFlightNoticeView(item));
  }
  return views;
}

export function sumFlightNoticeView(view: FlightNoticeView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedScore + parsedCapacity + parsedThreshold;
}
