import { TieredBounceReservation } from "./tiered-bounce-reservation.js";

/** How screens and exports show a tiered bounce reservation. */
export class TieredBounceReservationView {
  code: string;
  label: string;
  revision: string;
  rate: string;
  pinned: string;
  capacity: string;
  score: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    revision: string,
    rate: string,
    pinned: string,
    capacity: string,
    score: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.rate = rate;
    this.pinned = pinned;
    this.capacity = capacity;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toTieredBounceReservationView(item: TieredBounceReservation): TieredBounceReservationView {
  return new TieredBounceReservationView(
    item.code,
    item.label,
    String(item.revision),
    item.rate.toFixed(2),
    `${item.pinned}`,
    String(item.capacity),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredBounceReservationViews(items: TieredBounceReservation[]): TieredBounceReservationView[] {
  const views: TieredBounceReservationView[] = [];
  for (const item of items) {
    views.push(toTieredBounceReservationView(item));
  }
  return views;
}

export function sumTieredBounceReservationView(view: TieredBounceReservationView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedRevision + parsedRate + parsedCapacity;
}
