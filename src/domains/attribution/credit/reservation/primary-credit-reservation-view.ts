import * as text from "../../../../kit/text.js";
import { PrimaryCreditReservation } from "./primary-credit-reservation.js";

/** How screens and exports show a primary credit reservation. */
export class PrimaryCreditReservationView {
  code: string;
  name: string;
  segment: string;
  bid: string;
  score: string;
  impressionsText: string;
  sourceText: string;
  maximumText: string;
  endsAtText: string;
  title: string;
  phone: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    segment: string,
    bid: string,
    score: string,
    impressionsText: string,
    sourceText: string,
    maximumText: string,
    endsAtText: string,
    title: string,
    phone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.segment = segment;
    this.bid = bid;
    this.score = score;
    this.impressionsText = impressionsText;
    this.sourceText = sourceText;
    this.maximumText = maximumText;
    this.endsAtText = endsAtText;
    this.title = title;
    this.phone = phone;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryCreditReservationView(item: PrimaryCreditReservation): PrimaryCreditReservationView {
  return new PrimaryCreditReservationView(
    text.truncate(item.code, 120),
    item.name,
    item.segment,
    item.bid.toFixed(2),
    item.score.toFixed(2),
    String(item.impressions),
    item.source,
    item.maximum.toFixed(2),
    String(item.endsAt),
    item.title,
    item.phone,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryCreditReservationViews(items: PrimaryCreditReservation[]): PrimaryCreditReservationView[] {
  const views: PrimaryCreditReservationView[] = [];
  for (const item of items) {
    views.push(toPrimaryCreditReservationView(item));
  }
  return views;
}

export function sumPrimaryCreditReservationView(view: PrimaryCreditReservationView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedBid + parsedScore + parsedImpressions;
}
