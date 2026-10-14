import * as text from "../../../../kit/text.js";
import { ScheduledPathEstimate } from "./scheduled-path-estimate.js";

/** How screens and exports show a scheduled path estimate. */
export class ScheduledPathEstimateView {
  code: string;
  titleText: string;
  label: string;
  segment: string;
  batchSize: string;
  sequence: string;
  currencyText: string;
  reviewer: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    label: string,
    segment: string,
    batchSize: string,
    sequence: string,
    currencyText: string,
    reviewer: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.label = label;
    this.segment = segment;
    this.batchSize = batchSize;
    this.sequence = sequence;
    this.currencyText = currencyText;
    this.reviewer = reviewer;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledPathEstimateView(item: ScheduledPathEstimate): ScheduledPathEstimateView {
  return new ScheduledPathEstimateView(
    item.code,
    text.truncate(item.title, 40),
    item.label,
    item.segment,
    String(item.batchSize),
    String(item.sequence),
    item.currency,
    text.truncate(item.reviewer, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledPathEstimateViews(items: ScheduledPathEstimate[]): ScheduledPathEstimateView[] {
  const views: ScheduledPathEstimateView[] = [];
  for (const item of items) {
    views.push(toScheduledPathEstimateView(item));
  }
  return views;
}

export function sumScheduledPathEstimateView(view: ScheduledPathEstimateView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedBatchSize + parsedSequence;
}
