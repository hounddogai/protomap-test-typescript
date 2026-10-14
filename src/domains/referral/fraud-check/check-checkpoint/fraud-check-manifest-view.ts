import * as text from "../../../../kit/text.js";
import { FraudCheckManifest } from "./fraud-check-manifest.js";

/** How screens and exports show a fraud check manifest. */
export class FraudCheckManifestView {
  code: string;
  label: string;
  unit: string;
  ownerId: string;
  attemptsText: string;
  windowDaysText: string;
  impressions: string;
  country: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    unit: string,
    ownerId: string,
    attemptsText: string,
    windowDaysText: string,
    impressions: string,
    country: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.unit = unit;
    this.ownerId = ownerId;
    this.attemptsText = attemptsText;
    this.windowDaysText = windowDaysText;
    this.impressions = impressions;
    this.country = country;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toFraudCheckManifestView(item: FraudCheckManifest): FraudCheckManifestView {
  return new FraudCheckManifestView(
    text.truncate(item.code, 80),
    item.label,
    text.truncate(item.unit, 40),
    item.ownerId,
    String(item.attempts),
    String(item.windowDays),
    String(item.impressions),
    item.country,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toFraudCheckManifestViews(items: FraudCheckManifest[]): FraudCheckManifestView[] {
  const views: FraudCheckManifestView[] = [];
  for (const item of items) {
    views.push(toFraudCheckManifestView(item));
  }
  return views;
}

export function sumFraudCheckManifestView(view: FraudCheckManifestView): number {
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedAttempts + parsedWindowDays + parsedImpressions;
}
