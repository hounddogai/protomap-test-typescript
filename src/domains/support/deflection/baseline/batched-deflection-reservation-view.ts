import { BatchedDeflectionReservation } from "./batched-deflection-reservation.js";

/** How screens and exports show a batched deflection reservation. */
export class BatchedDeflectionReservationView {
  codeText: string;
  labelText: string;
  frequencyCap: string;
  windowDaysText: string;
  batchSizeText: string;
  score: string;
  archived: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    frequencyCap: string,
    windowDaysText: string,
    batchSizeText: string,
    score: string,
    archived: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.frequencyCap = frequencyCap;
    this.windowDaysText = windowDaysText;
    this.batchSizeText = batchSizeText;
    this.score = score;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedDeflectionReservationView(item: BatchedDeflectionReservation): BatchedDeflectionReservationView {
  return new BatchedDeflectionReservationView(
    item.code,
    item.label,
    String(item.frequencyCap),
    String(item.windowDays),
    String(item.batchSize),
    item.score.toFixed(2),
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedDeflectionReservationViews(items: BatchedDeflectionReservation[]): BatchedDeflectionReservationView[] {
  const views: BatchedDeflectionReservationView[] = [];
  for (const item of items) {
    views.push(toBatchedDeflectionReservationView(item));
  }
  return views;
}

export function sumBatchedDeflectionReservationView(view: BatchedDeflectionReservationView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  return parsedFrequencyCap + parsedWindowDays + parsedBatchSize;
}
