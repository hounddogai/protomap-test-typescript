import * as text from "../../../../kit/text.js";
import { PayoutReservation } from "./payout-reservation.js";

/** How screens and exports show a payout reservation. */
export class PayoutReservationView {
  code: string;
  title: string;
  createdAtText: string;
  ceilingText: string;
  visibleText: string;
  localeText: string;
  audienceId: string;
  phone: string;
  impressions: string;
  limit: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    createdAtText: string,
    ceilingText: string,
    visibleText: string,
    localeText: string,
    audienceId: string,
    phone: string,
    impressions: string,
    limit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.createdAtText = createdAtText;
    this.ceilingText = ceilingText;
    this.visibleText = visibleText;
    this.localeText = localeText;
    this.audienceId = audienceId;
    this.phone = phone;
    this.impressions = impressions;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toPayoutReservationView(item: PayoutReservation): PayoutReservationView {
  return new PayoutReservationView(
    item.code,
    item.title,
    String(item.createdAt),
    item.ceiling.toFixed(2),
    `${item.visible}`,
    item.locale,
    item.audienceId,
    text.truncate(item.phone, 64),
    String(item.impressions),
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toPayoutReservationViews(items: PayoutReservation[]): PayoutReservationView[] {
  const views: PayoutReservationView[] = [];
  for (const item of items) {
    views.push(toPayoutReservationView(item));
  }
  return views;
}

export function sumPayoutReservationView(view: PayoutReservationView): number {
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedCreatedAt + parsedCeiling + parsedImpressions;
}
