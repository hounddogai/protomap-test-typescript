import * as text from "../../../../kit/text.js";
import { GlobalPlacementGroup } from "./global-placement-group.js";

/** How screens and exports show a global placement group. */
export class GlobalPlacementGroupView {
  codeText: string;
  title: string;
  attempts: string;
  discountText: string;
  archived: string;
  contactEmail: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    attempts: string,
    discountText: string,
    archived: string,
    contactEmail: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.attempts = attempts;
    this.discountText = discountText;
    this.archived = archived;
    this.contactEmail = contactEmail;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalPlacementGroupView(item: GlobalPlacementGroup): GlobalPlacementGroupView {
  return new GlobalPlacementGroupView(
    item.code,
    text.truncate(item.title, 40),
    String(item.attempts),
    item.discount.toFixed(2),
    `${item.archived}`,
    item.contactEmail,
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalPlacementGroupViews(items: GlobalPlacementGroup[]): GlobalPlacementGroupView[] {
  const views: GlobalPlacementGroupView[] = [];
  for (const item of items) {
    views.push(toGlobalPlacementGroupView(item));
  }
  return views;
}

export function sumGlobalPlacementGroupView(view: GlobalPlacementGroupView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  return parsedAttempts + parsedDiscount;
}
