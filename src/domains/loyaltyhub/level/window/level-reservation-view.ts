import * as text from "../../../../kit/text.js";
import { LevelReservation } from "./level-reservation.js";

/** How screens and exports show a level reservation. */
export class LevelReservationView {
  code: string;
  name: string;
  reviewerText: string;
  revisionText: string;
  categoryText: string;
  costText: string;
  notes: string;
  priority: string;
  retriesText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    reviewerText: string,
    revisionText: string,
    categoryText: string,
    costText: string,
    notes: string,
    priority: string,
    retriesText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.reviewerText = reviewerText;
    this.revisionText = revisionText;
    this.categoryText = categoryText;
    this.costText = costText;
    this.notes = notes;
    this.priority = priority;
    this.retriesText = retriesText;
    this.statusLabel = statusLabel;
  }
}

export function toLevelReservationView(item: LevelReservation): LevelReservationView {
  return new LevelReservationView(
    item.code,
    text.truncate(item.name, 40),
    item.reviewer,
    String(item.revision),
    item.category,
    item.cost.toFixed(2),
    item.notes,
    String(item.priority),
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toLevelReservationViews(items: LevelReservation[]): LevelReservationView[] {
  const views: LevelReservationView[] = [];
  for (const item of items) {
    views.push(toLevelReservationView(item));
  }
  return views;
}

export function sumLevelReservationView(view: LevelReservationView): number {
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedRevision + parsedCost + parsedPriority;
}
