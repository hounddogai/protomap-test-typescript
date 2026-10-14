import * as text from "../../../../kit/text.js";
import { FallbackRetentionBatch } from "./fallback-retention-batch.js";

/** How screens and exports show a fallback retention batch. */
export class FallbackRetentionBatchView {
  code: string;
  label: string;
  campaignRef: string;
  rate: string;
  segmentText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    rate: string,
    segmentText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.rate = rate;
    this.segmentText = segmentText;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackRetentionBatchView(item: FallbackRetentionBatch): FallbackRetentionBatchView {
  return new FallbackRetentionBatchView(
    item.code,
    text.truncate(item.label, 120),
    item.campaignRef,
    item.rate.toFixed(2),
    text.truncate(item.segment, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackRetentionBatchViews(items: FallbackRetentionBatch[]): FallbackRetentionBatchView[] {
  const views: FallbackRetentionBatchView[] = [];
  for (const item of items) {
    views.push(toFallbackRetentionBatchView(item));
  }
  return views;
}

export function sumFallbackRetentionBatchView(view: FallbackRetentionBatchView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedRate;
}
