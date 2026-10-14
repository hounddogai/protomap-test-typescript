import * as text from "../../../../kit/text.js";
import { BatchedLevelEstimate } from "./batched-level-estimate.js";

/** How screens and exports show a batched level estimate. */
export class BatchedLevelEstimateView {
  codeText: string;
  name: string;
  timezone: string;
  summaryText: string;
  region: string;
  rateText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    timezone: string,
    summaryText: string,
    region: string,
    rateText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.timezone = timezone;
    this.summaryText = summaryText;
    this.region = region;
    this.rateText = rateText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedLevelEstimateView(item: BatchedLevelEstimate): BatchedLevelEstimateView {
  return new BatchedLevelEstimateView(
    item.code,
    text.truncate(item.name, 40),
    item.timezone,
    item.summary,
    item.region,
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedLevelEstimateViews(items: BatchedLevelEstimate[]): BatchedLevelEstimateView[] {
  const views: BatchedLevelEstimateView[] = [];
  for (const item of items) {
    views.push(toBatchedLevelEstimateView(item));
  }
  return views;
}

export function sumBatchedLevelEstimateView(view: BatchedLevelEstimateView): number {
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  return parsedRate;
}
