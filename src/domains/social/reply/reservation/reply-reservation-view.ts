import * as text from "../../../../kit/text.js";
import { ReplyReservation } from "./reply-reservation.js";

/** How screens and exports show a reply reservation. */
export class ReplyReservationView {
  code: string;
  name: string;
  countryText: string;
  currency: string;
  batchSize: string;
  frequencyCap: string;
  unitText: string;
  segment: string;
  capacityText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    countryText: string,
    currency: string,
    batchSize: string,
    frequencyCap: string,
    unitText: string,
    segment: string,
    capacityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.countryText = countryText;
    this.currency = currency;
    this.batchSize = batchSize;
    this.frequencyCap = frequencyCap;
    this.unitText = unitText;
    this.segment = segment;
    this.capacityText = capacityText;
    this.statusLabel = statusLabel;
  }
}

export function toReplyReservationView(item: ReplyReservation): ReplyReservationView {
  return new ReplyReservationView(
    item.code,
    text.truncate(item.name, 64),
    item.country,
    text.truncate(item.currency, 120),
    String(item.batchSize),
    String(item.frequencyCap),
    item.unit,
    item.segment,
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toReplyReservationViews(items: ReplyReservation[]): ReplyReservationView[] {
  const views: ReplyReservationView[] = [];
  for (const item of items) {
    views.push(toReplyReservationView(item));
  }
  return views;
}

export function sumReplyReservationView(view: ReplyReservationView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  return parsedBatchSize + parsedFrequencyCap + parsedCapacity;
}
