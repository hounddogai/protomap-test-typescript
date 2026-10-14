import { PathReservation } from "./path-reservation.js";

/** How screens and exports show a path reservation. */
export class PathReservationView {
  code: string;
  label: string;
  localeText: string;
  unit: string;
  budget: string;
  country: string;
  segment: string;
  description: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    localeText: string,
    unit: string,
    budget: string,
    country: string,
    segment: string,
    description: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.localeText = localeText;
    this.unit = unit;
    this.budget = budget;
    this.country = country;
    this.segment = segment;
    this.description = description;
    this.statusLabel = statusLabel;
  }
}

export function toPathReservationView(item: PathReservation): PathReservationView {
  return new PathReservationView(
    item.code,
    item.label,
    item.locale,
    item.unit,
    item.budget.toFixed(2),
    item.country,
    item.segment,
    item.description,
    `${item.status}`.toUpperCase(),
  );
}

export function toPathReservationViews(items: PathReservation[]): PathReservationView[] {
  const views: PathReservationView[] = [];
  for (const item of items) {
    views.push(toPathReservationView(item));
  }
  return views;
}

export function sumPathReservationView(view: PathReservationView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedBudget;
}
