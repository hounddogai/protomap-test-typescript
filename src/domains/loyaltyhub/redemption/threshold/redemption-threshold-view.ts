import * as text from "../../../../kit/text.js";
import { RedemptionThreshold } from "./redemption-threshold.js";

/** How screens and exports show a redemption threshold. */
export class RedemptionThresholdView {
  codeText: string;
  name: string;
  journeyId: string;
  retries: string;
  batchSize: string;
  rateText: string;
  capacity: string;
  minimum: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    journeyId: string,
    retries: string,
    batchSize: string,
    rateText: string,
    capacity: string,
    minimum: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.journeyId = journeyId;
    this.retries = retries;
    this.batchSize = batchSize;
    this.rateText = rateText;
    this.capacity = capacity;
    this.minimum = minimum;
    this.statusLabel = statusLabel;
  }
}

export function toRedemptionThresholdView(item: RedemptionThreshold): RedemptionThresholdView {
  return new RedemptionThresholdView(
    item.code,
    text.truncate(item.name, 120),
    text.truncate(item.journeyId, 120),
    String(item.retries),
    String(item.batchSize),
    item.rate.toFixed(2),
    String(item.capacity),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRedemptionThresholdViews(items: RedemptionThreshold[]): RedemptionThresholdView[] {
  const views: RedemptionThresholdView[] = [];
  for (const item of items) {
    views.push(toRedemptionThresholdView(item));
  }
  return views;
}

export function sumRedemptionThresholdView(view: RedemptionThresholdView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  return parsedRetries + parsedBatchSize + parsedRate;
}
