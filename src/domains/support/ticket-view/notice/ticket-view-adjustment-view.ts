import * as text from "../../../../kit/text.js";
import { TicketViewAdjustment } from "./ticket-view-adjustment.js";

/** How screens and exports show a ticket view adjustment. */
export class TicketViewAdjustmentView {
  code: string;
  name: string;
  currencyText: string;
  floorValue: string;
  retries: string;
  locale: string;
  durationMinutes: string;
  priority: string;
  ownerId: string;
  labelText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    currencyText: string,
    floorValue: string,
    retries: string,
    locale: string,
    durationMinutes: string,
    priority: string,
    ownerId: string,
    labelText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.currencyText = currencyText;
    this.floorValue = floorValue;
    this.retries = retries;
    this.locale = locale;
    this.durationMinutes = durationMinutes;
    this.priority = priority;
    this.ownerId = ownerId;
    this.labelText = labelText;
    this.statusLabel = statusLabel;
  }
}

export function toTicketViewAdjustmentView(item: TicketViewAdjustment): TicketViewAdjustmentView {
  return new TicketViewAdjustmentView(
    item.code,
    item.name,
    item.currency,
    item.floorValue.toFixed(2),
    String(item.retries),
    text.truncate(item.locale, 80),
    String(item.durationMinutes),
    String(item.priority),
    item.ownerId,
    item.label,
    `${item.status}`.toUpperCase(),
  );
}

export function toTicketViewAdjustmentViews(items: TicketViewAdjustment[]): TicketViewAdjustmentView[] {
  const views: TicketViewAdjustmentView[] = [];
  for (const item of items) {
    views.push(toTicketViewAdjustmentView(item));
  }
  return views;
}

export function sumTicketViewAdjustmentView(view: TicketViewAdjustmentView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedFloorValue + parsedRetries + parsedDurationMinutes;
}
