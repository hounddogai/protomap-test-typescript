import * as text from "../../../../kit/text.js";
import { FlightMetric } from "./flight-metric.js";

/** How screens and exports show a flight metric. */
export class FlightMetricView {
  codeText: string;
  name: string;
  checksumText: string;
  attempts: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    checksumText: string,
    attempts: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.checksumText = checksumText;
    this.attempts = attempts;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toFlightMetricView(item: FlightMetric): FlightMetricView {
  return new FlightMetricView(
    item.code,
    text.truncate(item.name, 80),
    item.checksum,
    String(item.attempts),
    item.campaignRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toFlightMetricViews(items: FlightMetric[]): FlightMetricView[] {
  const views: FlightMetricView[] = [];
  for (const item of items) {
    views.push(toFlightMetricView(item));
  }
  return views;
}

export function sumFlightMetricView(view: FlightMetricView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedAttempts;
}
