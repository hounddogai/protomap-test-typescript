import * as text from "../../../../kit/text.js";
import { GlobalBounceReservation } from "./global-bounce-reservation.js";

/** How screens and exports show a global bounce reservation. */
export class GlobalBounceReservationView {
  code: string;
  label: string;
  summary: string;
  floorValueText: string;
  budget: string;
  limitText: string;
  margin: string;
  archived: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    summary: string,
    floorValueText: string,
    budget: string,
    limitText: string,
    margin: string,
    archived: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.summary = summary;
    this.floorValueText = floorValueText;
    this.budget = budget;
    this.limitText = limitText;
    this.margin = margin;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalBounceReservationView(item: GlobalBounceReservation): GlobalBounceReservationView {
  return new GlobalBounceReservationView(
    text.truncate(item.code, 40),
    item.label,
    item.summary,
    item.floorValue.toFixed(2),
    item.budget.toFixed(2),
    String(item.limit),
    item.margin.toFixed(2),
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalBounceReservationViews(items: GlobalBounceReservation[]): GlobalBounceReservationView[] {
  const views: GlobalBounceReservationView[] = [];
  for (const item of items) {
    views.push(toGlobalBounceReservationView(item));
  }
  return views;
}

export function sumGlobalBounceReservationView(view: GlobalBounceReservationView): number {
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  return parsedFloorValue + parsedBudget + parsedLimit;
}
