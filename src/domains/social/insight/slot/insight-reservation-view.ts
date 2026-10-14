import * as text from "../../../../kit/text.js";
import { InsightReservation } from "./insight-reservation.js";

/** How screens and exports show a insight reservation. */
export class InsightReservationView {
  code: string;
  title: string;
  timezone: string;
  budgetText: string;
  source: string;
  sendAt: string;
  utmSource: string;
  expiresAt: string;
  checksum: string;
  sequence: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    timezone: string,
    budgetText: string,
    source: string,
    sendAt: string,
    utmSource: string,
    expiresAt: string,
    checksum: string,
    sequence: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.timezone = timezone;
    this.budgetText = budgetText;
    this.source = source;
    this.sendAt = sendAt;
    this.utmSource = utmSource;
    this.expiresAt = expiresAt;
    this.checksum = checksum;
    this.sequence = sequence;
    this.statusLabel = statusLabel;
  }
}

export function toInsightReservationView(item: InsightReservation): InsightReservationView {
  return new InsightReservationView(
    item.code,
    item.title,
    item.timezone,
    item.budget.toFixed(2),
    text.truncate(item.source, 64),
    String(item.sendAt),
    text.truncate(item.utmSource, 64),
    String(item.expiresAt),
    item.checksum,
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toInsightReservationViews(items: InsightReservation[]): InsightReservationView[] {
  const views: InsightReservationView[] = [];
  for (const item of items) {
    views.push(toInsightReservationView(item));
  }
  return views;
}

export function sumInsightReservationView(view: InsightReservationView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedBudget + parsedSendAt + parsedExpiresAt;
}
