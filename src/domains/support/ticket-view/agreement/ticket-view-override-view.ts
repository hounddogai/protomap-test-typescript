import * as text from "../../../../kit/text.js";
import { TicketViewOverride } from "./ticket-view-override.js";

/** How screens and exports show a ticket view override. */
export class TicketViewOverrideView {
  codeText: string;
  title: string;
  revisionText: string;
  discount: string;
  active: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    revisionText: string,
    discount: string,
    active: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.revisionText = revisionText;
    this.discount = discount;
    this.active = active;
    this.statusLabel = statusLabel;
  }
}

export function toTicketViewOverrideView(item: TicketViewOverride): TicketViewOverrideView {
  return new TicketViewOverrideView(
    item.code,
    text.truncate(item.title, 40),
    String(item.revision),
    item.discount.toFixed(2),
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toTicketViewOverrideViews(items: TicketViewOverride[]): TicketViewOverrideView[] {
  const views: TicketViewOverrideView[] = [];
  for (const item of items) {
    views.push(toTicketViewOverrideView(item));
  }
  return views;
}

export function sumTicketViewOverrideView(view: TicketViewOverrideView): number {
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedRevision + parsedDiscount;
}
