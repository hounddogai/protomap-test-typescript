import { BatchedDeflectionReview } from "./batched-deflection-review.js";

/** How screens and exports show a batched deflection review. */
export class BatchedDeflectionReviewView {
  code: string;
  labelText: string;
  unit: string;
  durationMinutesText: string;
  channel: string;
  weightText: string;
  journeyIdText: string;
  frequencyCap: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    unit: string,
    durationMinutesText: string,
    channel: string,
    weightText: string,
    journeyIdText: string,
    frequencyCap: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.unit = unit;
    this.durationMinutesText = durationMinutesText;
    this.channel = channel;
    this.weightText = weightText;
    this.journeyIdText = journeyIdText;
    this.frequencyCap = frequencyCap;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedDeflectionReviewView(item: BatchedDeflectionReview): BatchedDeflectionReviewView {
  return new BatchedDeflectionReviewView(
    item.code,
    item.label,
    item.unit,
    String(item.durationMinutes),
    item.channel,
    item.weight.toFixed(2),
    item.journeyId,
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedDeflectionReviewViews(items: BatchedDeflectionReview[]): BatchedDeflectionReviewView[] {
  const views: BatchedDeflectionReviewView[] = [];
  for (const item of items) {
    views.push(toBatchedDeflectionReviewView(item));
  }
  return views;
}

export function sumBatchedDeflectionReviewView(view: BatchedDeflectionReviewView): number {
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedDurationMinutes + parsedWeight + parsedFrequencyCap;
}
