import * as text from "../../../../kit/text.js";
import { StrictDomainReservation } from "./strict-domain-reservation.js";

/** How screens and exports show a strict domain reservation. */
export class StrictDomainReservationView {
  code: string;
  nameText: string;
  quantity: string;
  label: string;
  batchSizeText: string;
  score: string;
  localeText: string;
  weightText: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    quantity: string,
    label: string,
    batchSizeText: string,
    score: string,
    localeText: string,
    weightText: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.quantity = quantity;
    this.label = label;
    this.batchSizeText = batchSizeText;
    this.score = score;
    this.localeText = localeText;
    this.weightText = weightText;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toStrictDomainReservationView(item: StrictDomainReservation): StrictDomainReservationView {
  return new StrictDomainReservationView(
    item.code,
    item.name,
    String(item.quantity),
    text.truncate(item.label, 80),
    String(item.batchSize),
    item.score.toFixed(2),
    item.locale,
    item.weight.toFixed(2),
    item.campaignRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictDomainReservationViews(items: StrictDomainReservation[]): StrictDomainReservationView[] {
  const views: StrictDomainReservationView[] = [];
  for (const item of items) {
    views.push(toStrictDomainReservationView(item));
  }
  return views;
}

export function sumStrictDomainReservationView(view: StrictDomainReservationView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedQuantity + parsedBatchSize + parsedScore;
}
