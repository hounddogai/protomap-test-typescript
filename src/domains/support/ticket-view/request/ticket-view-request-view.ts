import * as text from "../../../../kit/text.js";
import { TicketViewRequest } from "./ticket-view-request.js";

/** How screens and exports show a ticket view request. */
export class TicketViewRequestView {
  code: string;
  labelText: string;
  nameText: string;
  active: string;
  createdAt: string;
  quantityText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    nameText: string,
    active: string,
    createdAt: string,
    quantityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.nameText = nameText;
    this.active = active;
    this.createdAt = createdAt;
    this.quantityText = quantityText;
    this.statusLabel = statusLabel;
  }
}

export function toTicketViewRequestView(item: TicketViewRequest): TicketViewRequestView {
  return new TicketViewRequestView(
    text.truncate(item.code, 40),
    text.truncate(item.label, 80),
    item.name,
    `${item.active}`,
    String(item.createdAt),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toTicketViewRequestViews(items: TicketViewRequest[]): TicketViewRequestView[] {
  const views: TicketViewRequestView[] = [];
  for (const item of items) {
    views.push(toTicketViewRequestView(item));
  }
  return views;
}

export function sumTicketViewRequestView(view: TicketViewRequestView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  return parsedCreatedAt + parsedQuantity;
}
