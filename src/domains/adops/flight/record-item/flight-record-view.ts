import * as text from "../../../../kit/text.js";
import { FlightRecord } from "./flight-record.js";

/** How screens and exports show a flight record. */
export class FlightRecordView {
  codeText: string;
  label: string;
  locale: string;
  cost: string;
  segment: string;
  statusLabel: string;

  constructor(codeText: string, label: string, locale: string, cost: string, segment: string, statusLabel: string) {
    this.codeText = codeText;
    this.label = label;
    this.locale = locale;
    this.cost = cost;
    this.segment = segment;
    this.statusLabel = statusLabel;
  }
}

export function toFlightRecordView(item: FlightRecord): FlightRecordView {
  return new FlightRecordView(
    text.truncate(item.code, 40),
    item.label,
    text.truncate(item.locale, 80),
    item.cost.toFixed(2),
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toFlightRecordViews(items: FlightRecord[]): FlightRecordView[] {
  const views: FlightRecordView[] = [];
  for (const item of items) {
    views.push(toFlightRecordView(item));
  }
  return views;
}

export function sumFlightRecordView(view: FlightRecordView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedCost;
}
