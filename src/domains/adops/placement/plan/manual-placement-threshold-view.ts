import * as text from "../../../../kit/text.js";
import { ManualPlacementThreshold } from "./manual-placement-threshold.js";

/** How screens and exports show a manual placement threshold. */
export class ManualPlacementThresholdView {
  code: string;
  label: string;
  batchSize: string;
  minimum: string;
  titleText: string;
  retriesText: string;
  unit: string;
  timezone: string;
  maximumText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    batchSize: string,
    minimum: string,
    titleText: string,
    retriesText: string,
    unit: string,
    timezone: string,
    maximumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.batchSize = batchSize;
    this.minimum = minimum;
    this.titleText = titleText;
    this.retriesText = retriesText;
    this.unit = unit;
    this.timezone = timezone;
    this.maximumText = maximumText;
    this.statusLabel = statusLabel;
  }
}

export function toManualPlacementThresholdView(item: ManualPlacementThreshold): ManualPlacementThresholdView {
  return new ManualPlacementThresholdView(
    item.code,
    text.truncate(item.label, 40),
    String(item.batchSize),
    item.minimum.toFixed(2),
    item.title,
    String(item.retries),
    item.unit,
    item.timezone,
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualPlacementThresholdViews(items: ManualPlacementThreshold[]): ManualPlacementThresholdView[] {
  const views: ManualPlacementThresholdView[] = [];
  for (const item of items) {
    views.push(toManualPlacementThresholdView(item));
  }
  return views;
}

export function sumManualPlacementThresholdView(view: ManualPlacementThresholdView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  return parsedBatchSize + parsedMinimum + parsedRetries;
}
