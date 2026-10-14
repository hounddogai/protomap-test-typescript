import { LenientRetentionForecast } from "./lenient-retention-forecast.js";

/** How screens and exports show a lenient retention forecast. */
export class LenientRetentionForecastView {
  code: string;
  labelText: string;
  floorValue: string;
  rate: string;
  checksum: string;
  segmentText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    floorValue: string,
    rate: string,
    checksum: string,
    segmentText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.floorValue = floorValue;
    this.rate = rate;
    this.checksum = checksum;
    this.segmentText = segmentText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientRetentionForecastView(item: LenientRetentionForecast): LenientRetentionForecastView {
  return new LenientRetentionForecastView(
    item.code,
    item.label,
    item.floorValue.toFixed(2),
    item.rate.toFixed(2),
    item.checksum,
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientRetentionForecastViews(items: LenientRetentionForecast[]): LenientRetentionForecastView[] {
  const views: LenientRetentionForecastView[] = [];
  for (const item of items) {
    views.push(toLenientRetentionForecastView(item));
  }
  return views;
}

export function sumLenientRetentionForecastView(view: LenientRetentionForecastView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedFloorValue + parsedRate;
}
