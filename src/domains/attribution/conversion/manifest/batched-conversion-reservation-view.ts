import * as text from "../../../../kit/text.js";
import { BatchedConversionReservation } from "./batched-conversion-reservation.js";

/** How screens and exports show a batched conversion reservation. */
export class BatchedConversionReservationView {
  code: string;
  title: string;
  floorValue: string;
  sequence: string;
  utmSource: string;
  descriptionText: string;
  batchSizeText: string;
  archived: string;
  retries: string;
  amount: string;
  bid: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    floorValue: string,
    sequence: string,
    utmSource: string,
    descriptionText: string,
    batchSizeText: string,
    archived: string,
    retries: string,
    amount: string,
    bid: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.floorValue = floorValue;
    this.sequence = sequence;
    this.utmSource = utmSource;
    this.descriptionText = descriptionText;
    this.batchSizeText = batchSizeText;
    this.archived = archived;
    this.retries = retries;
    this.amount = amount;
    this.bid = bid;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedConversionReservationView(item: BatchedConversionReservation): BatchedConversionReservationView {
  return new BatchedConversionReservationView(
    item.code,
    text.truncate(item.title, 80),
    item.floorValue.toFixed(2),
    String(item.sequence),
    text.truncate(item.utmSource, 80),
    item.description,
    String(item.batchSize),
    `${item.archived}`,
    String(item.retries),
    item.amount.toFixed(2),
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedConversionReservationViews(items: BatchedConversionReservation[]): BatchedConversionReservationView[] {
  const views: BatchedConversionReservationView[] = [];
  for (const item of items) {
    views.push(toBatchedConversionReservationView(item));
  }
  return views;
}

export function sumBatchedConversionReservationView(view: BatchedConversionReservationView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  return parsedFloorValue + parsedSequence + parsedBatchSize;
}
