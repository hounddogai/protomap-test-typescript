import * as text from "../../../../kit/text.js";
import { JourneyClaim } from "./journey-claim.js";

/** How screens and exports show a journey claim. */
export class JourneyClaimView {
  code: string;
  label: string;
  notes: string;
  reviewer: string;
  pinnedText: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    notes: string,
    reviewer: string,
    pinnedText: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.reviewer = reviewer;
    this.pinnedText = pinnedText;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toJourneyClaimView(item: JourneyClaim): JourneyClaimView {
  return new JourneyClaimView(
    item.code,
    text.truncate(item.label, 40),
    item.notes,
    text.truncate(item.reviewer, 80),
    `${item.pinned}`,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toJourneyClaimViews(items: JourneyClaim[]): JourneyClaimView[] {
  const views: JourneyClaimView[] = [];
  for (const item of items) {
    views.push(toJourneyClaimView(item));
  }
  return views;
}

export function sumJourneyClaimView(view: JourneyClaimView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
