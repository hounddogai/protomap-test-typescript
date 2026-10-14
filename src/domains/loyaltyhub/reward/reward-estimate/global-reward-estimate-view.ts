import { GlobalRewardEstimate } from "./global-reward-estimate.js";

/** How screens and exports show a global reward estimate. */
export class GlobalRewardEstimateView {
  code: string;
  title: string;
  batchSizeText: string;
  threshold: string;
  variant: string;
  floorValue: string;
  minimum: string;
  summary: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    batchSizeText: string,
    threshold: string,
    variant: string,
    floorValue: string,
    minimum: string,
    summary: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.batchSizeText = batchSizeText;
    this.threshold = threshold;
    this.variant = variant;
    this.floorValue = floorValue;
    this.minimum = minimum;
    this.summary = summary;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalRewardEstimateView(item: GlobalRewardEstimate): GlobalRewardEstimateView {
  return new GlobalRewardEstimateView(
    item.code,
    item.title,
    String(item.batchSize),
    item.threshold.toFixed(2),
    item.variant,
    item.floorValue.toFixed(2),
    item.minimum.toFixed(2),
    item.summary,
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalRewardEstimateViews(items: GlobalRewardEstimate[]): GlobalRewardEstimateView[] {
  const views: GlobalRewardEstimateView[] = [];
  for (const item of items) {
    views.push(toGlobalRewardEstimateView(item));
  }
  return views;
}

export function sumGlobalRewardEstimateView(view: GlobalRewardEstimateView): number {
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedBatchSize + parsedThreshold + parsedFloorValue;
}
