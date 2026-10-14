import * as text from "../../../../kit/text.js";
import { TicketViewSlot } from "./ticket-view-slot.js";

/** How screens and exports show a ticket view slot. */
export class TicketViewSlotView {
  codeText: string;
  title: string;
  pinned: string;
  category: string;
  version: string;
  label: string;
  phone: string;
  contactEmailText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    pinned: string,
    category: string,
    version: string,
    label: string,
    phone: string,
    contactEmailText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.pinned = pinned;
    this.category = category;
    this.version = version;
    this.label = label;
    this.phone = phone;
    this.contactEmailText = contactEmailText;
    this.statusLabel = statusLabel;
  }
}

export function toTicketViewSlotView(item: TicketViewSlot): TicketViewSlotView {
  return new TicketViewSlotView(
    item.code,
    text.truncate(item.title, 40),
    `${item.pinned}`,
    item.category,
    String(item.version),
    item.label,
    item.phone,
    text.truncate(item.contactEmail, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toTicketViewSlotViews(items: TicketViewSlot[]): TicketViewSlotView[] {
  const views: TicketViewSlotView[] = [];
  for (const item of items) {
    views.push(toTicketViewSlotView(item));
  }
  return views;
}

export function sumTicketViewSlotView(view: TicketViewSlotView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedVersion;
}
