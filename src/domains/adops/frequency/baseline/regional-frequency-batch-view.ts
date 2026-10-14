import * as text from "../../../../kit/text.js";
import { RegionalFrequencyBatch } from "./regional-frequency-batch.js";

/** How screens and exports show a regional frequency batch. */
export class RegionalFrequencyBatchView {
  codeText: string;
  nameText: string;
  batchSize: string;
  graceDays: string;
  timezone: string;
  windowDays: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    batchSize: string,
    graceDays: string,
    timezone: string,
    windowDays: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.batchSize = batchSize;
    this.graceDays = graceDays;
    this.timezone = timezone;
    this.windowDays = windowDays;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalFrequencyBatchView(item: RegionalFrequencyBatch): RegionalFrequencyBatchView {
  return new RegionalFrequencyBatchView(
    item.code,
    item.name,
    String(item.batchSize),
    String(item.graceDays),
    text.truncate(item.timezone, 80),
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalFrequencyBatchViews(items: RegionalFrequencyBatch[]): RegionalFrequencyBatchView[] {
  const views: RegionalFrequencyBatchView[] = [];
  for (const item of items) {
    views.push(toRegionalFrequencyBatchView(item));
  }
  return views;
}

export function sumRegionalFrequencyBatchView(view: RegionalFrequencyBatchView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedBatchSize + parsedGraceDays + parsedWindowDays;
}
