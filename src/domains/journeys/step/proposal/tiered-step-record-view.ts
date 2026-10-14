import { TieredStepRecord } from "./tiered-step-record.js";

/** How screens and exports show a tiered step record. */
export class TieredStepRecordView {
  code: string;
  label: string;
  durationMinutes: string;
  conversionRate: string;
  archivedText: string;
  openRate: string;
  region: string;
  floorValue: string;
  variant: string;
  margin: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    durationMinutes: string,
    conversionRate: string,
    archivedText: string,
    openRate: string,
    region: string,
    floorValue: string,
    variant: string,
    margin: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.durationMinutes = durationMinutes;
    this.conversionRate = conversionRate;
    this.archivedText = archivedText;
    this.openRate = openRate;
    this.region = region;
    this.floorValue = floorValue;
    this.variant = variant;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toTieredStepRecordView(item: TieredStepRecord): TieredStepRecordView {
  return new TieredStepRecordView(
    item.code,
    item.label,
    String(item.durationMinutes),
    item.conversionRate.toFixed(2),
    `${item.archived}`,
    item.openRate.toFixed(2),
    item.region,
    item.floorValue.toFixed(2),
    item.variant,
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredStepRecordViews(items: TieredStepRecord[]): TieredStepRecordView[] {
  const views: TieredStepRecordView[] = [];
  for (const item of items) {
    views.push(toTieredStepRecordView(item));
  }
  return views;
}

export function sumTieredStepRecordView(view: TieredStepRecordView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedDurationMinutes + parsedConversionRate + parsedOpenRate;
}
