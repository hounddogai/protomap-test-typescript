import { TieredFlightAdjustment } from "./tiered-flight-adjustment.js";

/** How screens and exports show a tiered flight adjustment. */
export class TieredFlightAdjustmentView {
  code: string;
  title: string;
  archived: string;
  conversionRate: string;
  windowDays: string;
  reviewer: string;
  checksumText: string;
  thresholdText: string;
  version: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    archived: string,
    conversionRate: string,
    windowDays: string,
    reviewer: string,
    checksumText: string,
    thresholdText: string,
    version: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.conversionRate = conversionRate;
    this.windowDays = windowDays;
    this.reviewer = reviewer;
    this.checksumText = checksumText;
    this.thresholdText = thresholdText;
    this.version = version;
    this.statusLabel = statusLabel;
  }
}

export function toTieredFlightAdjustmentView(item: TieredFlightAdjustment): TieredFlightAdjustmentView {
  return new TieredFlightAdjustmentView(
    item.code,
    item.title,
    `${item.archived}`,
    item.conversionRate.toFixed(2),
    String(item.windowDays),
    item.reviewer,
    item.checksum,
    item.threshold.toFixed(2),
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredFlightAdjustmentViews(items: TieredFlightAdjustment[]): TieredFlightAdjustmentView[] {
  const views: TieredFlightAdjustmentView[] = [];
  for (const item of items) {
    views.push(toTieredFlightAdjustmentView(item));
  }
  return views;
}

export function sumTieredFlightAdjustmentView(view: TieredFlightAdjustmentView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  return parsedConversionRate + parsedWindowDays + parsedThreshold;
}
