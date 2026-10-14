import * as text from "../../../../kit/text.js";
import { TieredPathProfile } from "./tiered-path-profile.js";

/** How screens and exports show a tiered path profile. */
export class TieredPathProfileView {
  code: string;
  labelText: string;
  conversionRateText: string;
  weightText: string;
  checksumText: string;
  timezone: string;
  clicks: string;
  unit: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    conversionRateText: string,
    weightText: string,
    checksumText: string,
    timezone: string,
    clicks: string,
    unit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.conversionRateText = conversionRateText;
    this.weightText = weightText;
    this.checksumText = checksumText;
    this.timezone = timezone;
    this.clicks = clicks;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toTieredPathProfileView(item: TieredPathProfile): TieredPathProfileView {
  return new TieredPathProfileView(
    text.truncate(item.code, 120),
    text.truncate(item.label, 120),
    item.conversionRate.toFixed(2),
    item.weight.toFixed(2),
    item.checksum,
    text.truncate(item.timezone, 40),
    String(item.clicks),
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredPathProfileViews(items: TieredPathProfile[]): TieredPathProfileView[] {
  const views: TieredPathProfileView[] = [];
  for (const item of items) {
    views.push(toTieredPathProfileView(item));
  }
  return views;
}

export function sumTieredPathProfileView(view: TieredPathProfileView): number {
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedConversionRate + parsedWeight + parsedClicks;
}
