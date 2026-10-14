import * as text from "../../../../kit/text.js";
import { WindowReservation } from "./window-reservation.js";

/** How screens and exports show a window reservation. */
export class WindowReservationView {
  code: string;
  label: string;
  sendAtText: string;
  maximumText: string;
  quantity: string;
  audienceIdText: string;
  locale: string;
  visible: string;
  timezone: string;
  checksum: string;
  segmentText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    sendAtText: string,
    maximumText: string,
    quantity: string,
    audienceIdText: string,
    locale: string,
    visible: string,
    timezone: string,
    checksum: string,
    segmentText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.sendAtText = sendAtText;
    this.maximumText = maximumText;
    this.quantity = quantity;
    this.audienceIdText = audienceIdText;
    this.locale = locale;
    this.visible = visible;
    this.timezone = timezone;
    this.checksum = checksum;
    this.segmentText = segmentText;
    this.statusLabel = statusLabel;
  }
}

export function toWindowReservationView(item: WindowReservation): WindowReservationView {
  return new WindowReservationView(
    text.truncate(item.code, 40),
    item.label,
    String(item.sendAt),
    item.maximum.toFixed(2),
    String(item.quantity),
    text.truncate(item.audienceId, 40),
    item.locale,
    `${item.visible}`,
    text.truncate(item.timezone, 40),
    item.checksum,
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toWindowReservationViews(items: WindowReservation[]): WindowReservationView[] {
  const views: WindowReservationView[] = [];
  for (const item of items) {
    views.push(toWindowReservationView(item));
  }
  return views;
}

export function sumWindowReservationView(view: WindowReservationView): number {
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedSendAt + parsedMaximum + parsedQuantity;
}
