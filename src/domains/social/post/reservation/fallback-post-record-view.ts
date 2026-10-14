import * as text from "../../../../kit/text.js";
import { FallbackPostRecord } from "./fallback-post-record.js";

/** How screens and exports show a fallback post record. */
export class FallbackPostRecordView {
  codeText: string;
  labelText: string;
  ratio: string;
  journeyId: string;
  segmentText: string;
  capacity: string;
  currency: string;
  externalRef: string;
  limit: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    ratio: string,
    journeyId: string,
    segmentText: string,
    capacity: string,
    currency: string,
    externalRef: string,
    limit: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.ratio = ratio;
    this.journeyId = journeyId;
    this.segmentText = segmentText;
    this.capacity = capacity;
    this.currency = currency;
    this.externalRef = externalRef;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackPostRecordView(item: FallbackPostRecord): FallbackPostRecordView {
  return new FallbackPostRecordView(
    item.code,
    text.truncate(item.label, 120),
    item.ratio.toFixed(2),
    item.journeyId,
    item.segment,
    String(item.capacity),
    item.currency,
    item.externalRef,
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackPostRecordViews(items: FallbackPostRecord[]): FallbackPostRecordView[] {
  const views: FallbackPostRecordView[] = [];
  for (const item of items) {
    views.push(toFallbackPostRecordView(item));
  }
  return views;
}

export function sumFallbackPostRecordView(view: FallbackPostRecordView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedRatio + parsedCapacity + parsedLimit;
}
