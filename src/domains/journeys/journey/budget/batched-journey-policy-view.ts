import * as text from "../../../../kit/text.js";
import { BatchedJourneyPolicy } from "./batched-journey-policy.js";

/** How screens and exports show a batched journey policy. */
export class BatchedJourneyPolicyView {
  codeText: string;
  title: string;
  channel: string;
  batchSizeText: string;
  thresholdText: string;
  conversionRate: string;
  rate: string;
  utmSource: string;
  pinnedText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    channel: string,
    batchSizeText: string,
    thresholdText: string,
    conversionRate: string,
    rate: string,
    utmSource: string,
    pinnedText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.channel = channel;
    this.batchSizeText = batchSizeText;
    this.thresholdText = thresholdText;
    this.conversionRate = conversionRate;
    this.rate = rate;
    this.utmSource = utmSource;
    this.pinnedText = pinnedText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedJourneyPolicyView(item: BatchedJourneyPolicy): BatchedJourneyPolicyView {
  return new BatchedJourneyPolicyView(
    item.code,
    text.truncate(item.title, 40),
    item.channel,
    String(item.batchSize),
    item.threshold.toFixed(2),
    item.conversionRate.toFixed(2),
    item.rate.toFixed(2),
    text.truncate(item.utmSource, 80),
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedJourneyPolicyViews(items: BatchedJourneyPolicy[]): BatchedJourneyPolicyView[] {
  const views: BatchedJourneyPolicyView[] = [];
  for (const item of items) {
    views.push(toBatchedJourneyPolicyView(item));
  }
  return views;
}

export function sumBatchedJourneyPolicyView(view: BatchedJourneyPolicyView): number {
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedBatchSize + parsedThreshold + parsedConversionRate;
}
