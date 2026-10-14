import * as text from "../../../../kit/text.js";
import { FlightManifest } from "./flight-manifest.js";

/** How screens and exports show a flight manifest. */
export class FlightManifestView {
  codeText: string;
  label: string;
  unitText: string;
  variantText: string;
  graceDaysText: string;
  windowDays: string;
  clicks: string;
  description: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    unitText: string,
    variantText: string,
    graceDaysText: string,
    windowDays: string,
    clicks: string,
    description: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.unitText = unitText;
    this.variantText = variantText;
    this.graceDaysText = graceDaysText;
    this.windowDays = windowDays;
    this.clicks = clicks;
    this.description = description;
    this.statusLabel = statusLabel;
  }
}

export function toFlightManifestView(item: FlightManifest): FlightManifestView {
  return new FlightManifestView(
    item.code,
    text.truncate(item.label, 120),
    text.truncate(item.unit, 64),
    item.variant,
    String(item.graceDays),
    String(item.windowDays),
    String(item.clicks),
    item.description,
    `${item.status}`.toUpperCase(),
  );
}

export function toFlightManifestViews(items: FlightManifest[]): FlightManifestView[] {
  const views: FlightManifestView[] = [];
  for (const item of items) {
    views.push(toFlightManifestView(item));
  }
  return views;
}

export function sumFlightManifestView(view: FlightManifestView): number {
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedGraceDays + parsedWindowDays + parsedClicks;
}
