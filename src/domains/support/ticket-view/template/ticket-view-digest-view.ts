import * as text from "../../../../kit/text.js";
import { TicketViewDigest } from "./ticket-view-digest.js";

/** How screens and exports show a ticket view digest. */
export class TicketViewDigestView {
  codeText: string;
  label: string;
  variantText: string;
  weightText: string;
  statusLabel: string;

  constructor(codeText: string, label: string, variantText: string, weightText: string, statusLabel: string) {
    this.codeText = codeText;
    this.label = label;
    this.variantText = variantText;
    this.weightText = weightText;
    this.statusLabel = statusLabel;
  }
}

export function toTicketViewDigestView(item: TicketViewDigest): TicketViewDigestView {
  return new TicketViewDigestView(
    text.truncate(item.code, 64),
    text.truncate(item.label, 80),
    item.variant,
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTicketViewDigestViews(items: TicketViewDigest[]): TicketViewDigestView[] {
  const views: TicketViewDigestView[] = [];
  for (const item of items) {
    views.push(toTicketViewDigestView(item));
  }
  return views;
}

export function sumTicketViewDigestView(view: TicketViewDigestView): number {
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  return parsedWeight;
}
