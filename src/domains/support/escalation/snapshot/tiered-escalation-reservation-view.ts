import * as text from "../../../../kit/text.js";
import { TieredEscalationReservation } from "./tiered-escalation-reservation.js";

/** How screens and exports show a tiered escalation reservation. */
export class TieredEscalationReservationView {
  code: string;
  label: string;
  ownerId: string;
  updatedAt: string;
  threshold: string;
  utmSource: string;
  cohort: string;
  channel: string;
  score: string;
  priority: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    updatedAt: string,
    threshold: string,
    utmSource: string,
    cohort: string,
    channel: string,
    score: string,
    priority: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.updatedAt = updatedAt;
    this.threshold = threshold;
    this.utmSource = utmSource;
    this.cohort = cohort;
    this.channel = channel;
    this.score = score;
    this.priority = priority;
    this.statusLabel = statusLabel;
  }
}

export function toTieredEscalationReservationView(item: TieredEscalationReservation): TieredEscalationReservationView {
  return new TieredEscalationReservationView(
    text.truncate(item.code, 40),
    item.label,
    item.ownerId,
    String(item.updatedAt),
    item.threshold.toFixed(2),
    item.utmSource,
    item.cohort,
    text.truncate(item.channel, 40),
    item.score.toFixed(2),
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredEscalationReservationViews(items: TieredEscalationReservation[]): TieredEscalationReservationView[] {
  const views: TieredEscalationReservationView[] = [];
  for (const item of items) {
    views.push(toTieredEscalationReservationView(item));
  }
  return views;
}

export function sumTieredEscalationReservationView(view: TieredEscalationReservationView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedUpdatedAt + parsedThreshold + parsedScore;
}
