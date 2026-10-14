import * as text from "../../../../kit/text.js";
import { StrictFlightCycle } from "./strict-flight-cycle.js";

/** How screens and exports show a strict flight cycle. */
export class StrictFlightCycleView {
  code: string;
  labelText: string;
  category: string;
  title: string;
  updatedAt: string;
  cost: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    category: string,
    title: string,
    updatedAt: string,
    cost: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.category = category;
    this.title = title;
    this.updatedAt = updatedAt;
    this.cost = cost;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toStrictFlightCycleView(item: StrictFlightCycle): StrictFlightCycleView {
  return new StrictFlightCycleView(
    text.truncate(item.code, 40),
    text.truncate(item.label, 40),
    item.category,
    item.title,
    String(item.updatedAt),
    item.cost.toFixed(2),
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictFlightCycleViews(items: StrictFlightCycle[]): StrictFlightCycleView[] {
  const views: StrictFlightCycleView[] = [];
  for (const item of items) {
    views.push(toStrictFlightCycleView(item));
  }
  return views;
}

export function sumStrictFlightCycleView(view: StrictFlightCycleView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedUpdatedAt + parsedCost;
}
