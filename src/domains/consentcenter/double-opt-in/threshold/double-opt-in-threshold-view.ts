import * as text from "../../../../kit/text.js";
import { DoubleOptInThreshold } from "./double-opt-in-threshold.js";

/** How screens and exports show a double opt in threshold. */
export class DoubleOptInThresholdView {
  code: string;
  title: string;
  impressions: string;
  cohort: string;
  utmSource: string;
  channelText: string;
  name: string;
  activeText: string;
  batchSize: string;
  version: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    impressions: string,
    cohort: string,
    utmSource: string,
    channelText: string,
    name: string,
    activeText: string,
    batchSize: string,
    version: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.impressions = impressions;
    this.cohort = cohort;
    this.utmSource = utmSource;
    this.channelText = channelText;
    this.name = name;
    this.activeText = activeText;
    this.batchSize = batchSize;
    this.version = version;
    this.statusLabel = statusLabel;
  }
}

export function toDoubleOptInThresholdView(item: DoubleOptInThreshold): DoubleOptInThresholdView {
  return new DoubleOptInThresholdView(
    text.truncate(item.code, 120),
    item.title,
    String(item.impressions),
    item.cohort,
    item.utmSource,
    item.channel,
    item.name,
    `${item.active}`,
    String(item.batchSize),
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toDoubleOptInThresholdViews(items: DoubleOptInThreshold[]): DoubleOptInThresholdView[] {
  const views: DoubleOptInThresholdView[] = [];
  for (const item of items) {
    views.push(toDoubleOptInThresholdView(item));
  }
  return views;
}

export function sumDoubleOptInThresholdView(view: DoubleOptInThresholdView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedImpressions + parsedBatchSize + parsedVersion;
}
