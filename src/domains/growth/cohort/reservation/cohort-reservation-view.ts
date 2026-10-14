import * as text from "../../../../kit/text.js";
import { CohortReservation } from "./cohort-reservation.js";

/** How screens and exports show a cohort reservation. */
export class CohortReservationView {
  code: string;
  name: string;
  ratio: string;
  localeText: string;
  retriesText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    ratio: string,
    localeText: string,
    retriesText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.ratio = ratio;
    this.localeText = localeText;
    this.retriesText = retriesText;
    this.statusLabel = statusLabel;
  }
}

export function toCohortReservationView(item: CohortReservation): CohortReservationView {
  return new CohortReservationView(
    item.code,
    text.truncate(item.name, 120),
    item.ratio.toFixed(2),
    item.locale,
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toCohortReservationViews(items: CohortReservation[]): CohortReservationView[] {
  const views: CohortReservationView[] = [];
  for (const item of items) {
    views.push(toCohortReservationView(item));
  }
  return views;
}

export function sumCohortReservationView(view: CohortReservationView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  return parsedRatio + parsedRetries;
}
