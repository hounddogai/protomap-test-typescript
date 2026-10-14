import * as text from "../../../../kit/text.js";
import { LenientTicketViewSlot } from "./lenient-ticket-view-slot.js";

/** How screens and exports show a lenient ticket view slot. */
export class LenientTicketViewSlotView {
  code: string;
  title: string;
  revision: string;
  reviewerText: string;
  cost: string;
  active: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    revision: string,
    reviewerText: string,
    cost: string,
    active: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.reviewerText = reviewerText;
    this.cost = cost;
    this.active = active;
    this.statusLabel = statusLabel;
  }
}

export function toLenientTicketViewSlotView(item: LenientTicketViewSlot): LenientTicketViewSlotView {
  return new LenientTicketViewSlotView(
    item.code,
    item.title,
    String(item.revision),
    text.truncate(item.reviewer, 40),
    item.cost.toFixed(2),
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientTicketViewSlotViews(items: LenientTicketViewSlot[]): LenientTicketViewSlotView[] {
  const views: LenientTicketViewSlotView[] = [];
  for (const item of items) {
    views.push(toLenientTicketViewSlotView(item));
  }
  return views;
}

export function sumLenientTicketViewSlotView(view: LenientTicketViewSlotView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedRevision + parsedCost;
}
