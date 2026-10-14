import * as text from "../../../../kit/text.js";
import { CappedWarmupReservation } from "./capped-warmup-reservation.js";

/** How screens and exports show a capped warmup reservation. */
export class CappedWarmupReservationView {
  code: string;
  name: string;
  graceDays: string;
  variant: string;
  costText: string;
  audienceId: string;
  margin: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    graceDays: string,
    variant: string,
    costText: string,
    audienceId: string,
    margin: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.variant = variant;
    this.costText = costText;
    this.audienceId = audienceId;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toCappedWarmupReservationView(item: CappedWarmupReservation): CappedWarmupReservationView {
  return new CappedWarmupReservationView(
    item.code,
    text.truncate(item.name, 80),
    String(item.graceDays),
    item.variant,
    item.cost.toFixed(2),
    item.audienceId,
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedWarmupReservationViews(items: CappedWarmupReservation[]): CappedWarmupReservationView[] {
  const views: CappedWarmupReservationView[] = [];
  for (const item of items) {
    views.push(toCappedWarmupReservationView(item));
  }
  return views;
}

export function sumCappedWarmupReservationView(view: CappedWarmupReservationView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedGraceDays + parsedCost + parsedMargin;
}
