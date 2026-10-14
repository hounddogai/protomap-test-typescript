import * as text from "../../../../kit/text.js";
import { LenientCohortGroup } from "./lenient-cohort-group.js";

/** How screens and exports show a lenient cohort group. */
export class LenientCohortGroupView {
  codeText: string;
  label: string;
  channel: string;
  quantityText: string;
  contactEmail: string;
  reviewer: string;
  ownerId: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    channel: string,
    quantityText: string,
    contactEmail: string,
    reviewer: string,
    ownerId: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.channel = channel;
    this.quantityText = quantityText;
    this.contactEmail = contactEmail;
    this.reviewer = reviewer;
    this.ownerId = ownerId;
    this.statusLabel = statusLabel;
  }
}

export function toLenientCohortGroupView(item: LenientCohortGroup): LenientCohortGroupView {
  return new LenientCohortGroupView(
    text.truncate(item.code, 40),
    item.label,
    item.channel,
    String(item.quantity),
    text.truncate(item.contactEmail, 64),
    item.reviewer,
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientCohortGroupViews(items: LenientCohortGroup[]): LenientCohortGroupView[] {
  const views: LenientCohortGroupView[] = [];
  for (const item of items) {
    views.push(toLenientCohortGroupView(item));
  }
  return views;
}

export function sumLenientCohortGroupView(view: LenientCohortGroupView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  return parsedQuantity;
}
