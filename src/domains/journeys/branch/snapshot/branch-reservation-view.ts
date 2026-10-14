import { BranchReservation } from "./branch-reservation.js";

/** How screens and exports show a branch reservation. */
export class BranchReservationView {
  code: string;
  title: string;
  floorValue: string;
  durationMinutes: string;
  budget: string;
  endsAt: string;
  score: string;
  utmSource: string;
  ratio: string;
  journeyId: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    floorValue: string,
    durationMinutes: string,
    budget: string,
    endsAt: string,
    score: string,
    utmSource: string,
    ratio: string,
    journeyId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.floorValue = floorValue;
    this.durationMinutes = durationMinutes;
    this.budget = budget;
    this.endsAt = endsAt;
    this.score = score;
    this.utmSource = utmSource;
    this.ratio = ratio;
    this.journeyId = journeyId;
    this.statusLabel = statusLabel;
  }
}

export function toBranchReservationView(item: BranchReservation): BranchReservationView {
  return new BranchReservationView(
    item.code,
    item.title,
    item.floorValue.toFixed(2),
    String(item.durationMinutes),
    item.budget.toFixed(2),
    String(item.endsAt),
    item.score.toFixed(2),
    item.utmSource,
    item.ratio.toFixed(2),
    item.journeyId,
    `${item.status}`.toUpperCase(),
  );
}

export function toBranchReservationViews(items: BranchReservation[]): BranchReservationView[] {
  const views: BranchReservationView[] = [];
  for (const item of items) {
    views.push(toBranchReservationView(item));
  }
  return views;
}

export function sumBranchReservationView(view: BranchReservationView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedFloorValue + parsedDurationMinutes + parsedBudget;
}
