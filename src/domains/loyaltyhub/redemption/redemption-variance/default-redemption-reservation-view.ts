import * as text from "../../../../kit/text.js";
import { DefaultRedemptionReservation } from "./default-redemption-reservation.js";

/** How screens and exports show a default redemption reservation. */
export class DefaultRedemptionReservationView {
  code: string;
  labelText: string;
  retries: string;
  weightText: string;
  sendAtText: string;
  archived: string;
  discountText: string;
  updatedAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    retries: string,
    weightText: string,
    sendAtText: string,
    archived: string,
    discountText: string,
    updatedAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.retries = retries;
    this.weightText = weightText;
    this.sendAtText = sendAtText;
    this.archived = archived;
    this.discountText = discountText;
    this.updatedAtText = updatedAtText;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultRedemptionReservationView(item: DefaultRedemptionReservation): DefaultRedemptionReservationView {
  return new DefaultRedemptionReservationView(
    text.truncate(item.code, 80),
    item.label,
    String(item.retries),
    item.weight.toFixed(2),
    String(item.sendAt),
    `${item.archived}`,
    item.discount.toFixed(2),
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultRedemptionReservationViews(items: DefaultRedemptionReservation[]): DefaultRedemptionReservationView[] {
  const views: DefaultRedemptionReservationView[] = [];
  for (const item of items) {
    views.push(toDefaultRedemptionReservationView(item));
  }
  return views;
}

export function sumDefaultRedemptionReservationView(view: DefaultRedemptionReservationView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  return parsedRetries + parsedWeight + parsedSendAt;
}
