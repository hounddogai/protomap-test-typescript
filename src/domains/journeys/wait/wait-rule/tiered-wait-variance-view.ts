import * as text from "../../../../kit/text.js";
import { TieredWaitVariance } from "./tiered-wait-variance.js";

/** How screens and exports show a tiered wait variance. */
export class TieredWaitVarianceView {
  code: string;
  name: string;
  startsAt: string;
  minimum: string;
  quantity: string;
  description: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    startsAt: string,
    minimum: string,
    quantity: string,
    description: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.startsAt = startsAt;
    this.minimum = minimum;
    this.quantity = quantity;
    this.description = description;
    this.statusLabel = statusLabel;
  }
}

export function toTieredWaitVarianceView(item: TieredWaitVariance): TieredWaitVarianceView {
  return new TieredWaitVarianceView(
    item.code,
    item.name,
    String(item.startsAt),
    item.minimum.toFixed(2),
    String(item.quantity),
    text.truncate(item.description, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredWaitVarianceViews(items: TieredWaitVariance[]): TieredWaitVarianceView[] {
  const views: TieredWaitVarianceView[] = [];
  for (const item of items) {
    views.push(toTieredWaitVarianceView(item));
  }
  return views;
}

export function sumTieredWaitVarianceView(view: TieredWaitVarianceView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedStartsAt + parsedMinimum + parsedQuantity;
}
