import * as text from "../../../../kit/text.js";
import { StrictTicketViewWindow } from "./strict-ticket-view-window.js";

/** How screens and exports show a strict ticket view window. */
export class StrictTicketViewWindowView {
  code: string;
  name: string;
  capacity: string;
  graceDays: string;
  categoryText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    capacity: string,
    graceDays: string,
    categoryText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.capacity = capacity;
    this.graceDays = graceDays;
    this.categoryText = categoryText;
    this.statusLabel = statusLabel;
  }
}

export function toStrictTicketViewWindowView(item: StrictTicketViewWindow): StrictTicketViewWindowView {
  return new StrictTicketViewWindowView(
    item.code,
    text.truncate(item.name, 80),
    String(item.capacity),
    String(item.graceDays),
    item.category,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictTicketViewWindowViews(items: StrictTicketViewWindow[]): StrictTicketViewWindowView[] {
  const views: StrictTicketViewWindowView[] = [];
  for (const item of items) {
    views.push(toStrictTicketViewWindowView(item));
  }
  return views;
}

export function sumStrictTicketViewWindowView(view: StrictTicketViewWindowView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedCapacity + parsedGraceDays;
}
