import * as text from "../../../../kit/text.js";
import { FlightAudit } from "./flight-audit.js";

/** How screens and exports show a flight audit. */
export class FlightAuditView {
  code: string;
  label: string;
  quantityText: string;
  externalRef: string;
  openRate: string;
  timezone: string;
  archived: string;
  clicks: string;
  locale: string;
  minimum: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    quantityText: string,
    externalRef: string,
    openRate: string,
    timezone: string,
    archived: string,
    clicks: string,
    locale: string,
    minimum: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.quantityText = quantityText;
    this.externalRef = externalRef;
    this.openRate = openRate;
    this.timezone = timezone;
    this.archived = archived;
    this.clicks = clicks;
    this.locale = locale;
    this.minimum = minimum;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toFlightAuditView(item: FlightAudit): FlightAuditView {
  return new FlightAuditView(
    item.code,
    item.label,
    String(item.quantity),
    text.truncate(item.externalRef, 120),
    item.openRate.toFixed(2),
    text.truncate(item.timezone, 120),
    `${item.archived}`,
    String(item.clicks),
    item.locale,
    item.minimum.toFixed(2),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toFlightAuditViews(items: FlightAudit[]): FlightAuditView[] {
  const views: FlightAuditView[] = [];
  for (const item of items) {
    views.push(toFlightAuditView(item));
  }
  return views;
}

export function sumFlightAuditView(view: FlightAuditView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedQuantity + parsedOpenRate + parsedClicks;
}
