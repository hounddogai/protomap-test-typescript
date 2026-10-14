import * as text from "../../../../kit/text.js";
import { WeightedRetentionAllocation } from "./weighted-retention-allocation.js";

/** How screens and exports show a weighted retention allocation. */
export class WeightedRetentionAllocationView {
  codeText: string;
  title: string;
  conversionRateText: string;
  retries: string;
  checksumText: string;
  version: string;
  summary: string;
  scoreText: string;
  windowDays: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    conversionRateText: string,
    retries: string,
    checksumText: string,
    version: string,
    summary: string,
    scoreText: string,
    windowDays: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.conversionRateText = conversionRateText;
    this.retries = retries;
    this.checksumText = checksumText;
    this.version = version;
    this.summary = summary;
    this.scoreText = scoreText;
    this.windowDays = windowDays;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedRetentionAllocationView(item: WeightedRetentionAllocation): WeightedRetentionAllocationView {
  return new WeightedRetentionAllocationView(
    text.truncate(item.code, 40),
    item.title,
    item.conversionRate.toFixed(2),
    String(item.retries),
    text.truncate(item.checksum, 64),
    String(item.version),
    text.truncate(item.summary, 64),
    item.score.toFixed(2),
    String(item.windowDays),
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedRetentionAllocationViews(items: WeightedRetentionAllocation[]): WeightedRetentionAllocationView[] {
  const views: WeightedRetentionAllocationView[] = [];
  for (const item of items) {
    views.push(toWeightedRetentionAllocationView(item));
  }
  return views;
}

export function sumWeightedRetentionAllocationView(view: WeightedRetentionAllocationView): number {
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedConversionRate + parsedRetries + parsedVersion;
}
