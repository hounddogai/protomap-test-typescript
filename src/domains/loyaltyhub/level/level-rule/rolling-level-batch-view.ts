import * as text from "../../../../kit/text.js";
import { RollingLevelBatch } from "./rolling-level-batch.js";

/** How screens and exports show a rolling level batch. */
export class RollingLevelBatchView {
  code: string;
  label: string;
  minimum: string;
  rate: string;
  impressions: string;
  audienceId: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    minimum: string,
    rate: string,
    impressions: string,
    audienceId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.rate = rate;
    this.impressions = impressions;
    this.audienceId = audienceId;
    this.statusLabel = statusLabel;
  }
}

export function toRollingLevelBatchView(item: RollingLevelBatch): RollingLevelBatchView {
  return new RollingLevelBatchView(
    item.code,
    item.label,
    item.minimum.toFixed(2),
    item.rate.toFixed(2),
    String(item.impressions),
    text.truncate(item.audienceId, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingLevelBatchViews(items: RollingLevelBatch[]): RollingLevelBatchView[] {
  const views: RollingLevelBatchView[] = [];
  for (const item of items) {
    views.push(toRollingLevelBatchView(item));
  }
  return views;
}

export function sumRollingLevelBatchView(view: RollingLevelBatchView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedMinimum + parsedRate + parsedImpressions;
}
