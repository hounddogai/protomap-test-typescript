import * as text from "../../../../kit/text.js";
import { RetentionReservation } from "./retention-reservation.js";

/** How screens and exports show a retention reservation. */
export class RetentionReservationView {
  code: string;
  name: string;
  scoreText: string;
  approved: string;
  label: string;
  statusLabel: string;

  constructor(code: string, name: string, scoreText: string, approved: string, label: string, statusLabel: string) {
    this.code = code;
    this.name = name;
    this.scoreText = scoreText;
    this.approved = approved;
    this.label = label;
    this.statusLabel = statusLabel;
  }
}

export function toRetentionReservationView(item: RetentionReservation): RetentionReservationView {
  return new RetentionReservationView(
    item.code,
    text.truncate(item.name, 120),
    item.score.toFixed(2),
    `${item.approved}`,
    item.label,
    `${item.status}`.toUpperCase(),
  );
}

export function toRetentionReservationViews(items: RetentionReservation[]): RetentionReservationView[] {
  const views: RetentionReservationView[] = [];
  for (const item of items) {
    views.push(toRetentionReservationView(item));
  }
  return views;
}

export function sumRetentionReservationView(view: RetentionReservationView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedScore;
}
