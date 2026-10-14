import * as text from "../../../../kit/text.js";
import { SeasonalCreditReservation } from "./seasonal-credit-reservation.js";

/** How screens and exports show a seasonal credit reservation. */
export class SeasonalCreditReservationView {
  codeText: string;
  label: string;
  ratioText: string;
  phone: string;
  margin: string;
  channel: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    ratioText: string,
    phone: string,
    margin: string,
    channel: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.ratioText = ratioText;
    this.phone = phone;
    this.margin = margin;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalCreditReservationView(item: SeasonalCreditReservation): SeasonalCreditReservationView {
  return new SeasonalCreditReservationView(
    item.code,
    item.label,
    item.ratio.toFixed(2),
    item.phone,
    item.margin.toFixed(2),
    text.truncate(item.channel, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalCreditReservationViews(items: SeasonalCreditReservation[]): SeasonalCreditReservationView[] {
  const views: SeasonalCreditReservationView[] = [];
  for (const item of items) {
    views.push(toSeasonalCreditReservationView(item));
  }
  return views;
}

export function sumSeasonalCreditReservationView(view: SeasonalCreditReservationView): number {
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedRatio + parsedMargin;
}
