import * as text from "../../../../kit/text.js";
import { PlacementAssignment } from "./placement-assignment.js";

/** How screens and exports show a placement assignment. */
export class PlacementAssignmentView {
  code: string;
  nameText: string;
  approved: string;
  contactEmail: string;
  currency: string;
  campaignRefText: string;
  cost: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    approved: string,
    contactEmail: string,
    currency: string,
    campaignRefText: string,
    cost: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.approved = approved;
    this.contactEmail = contactEmail;
    this.currency = currency;
    this.campaignRefText = campaignRefText;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toPlacementAssignmentView(item: PlacementAssignment): PlacementAssignmentView {
  return new PlacementAssignmentView(
    text.truncate(item.code, 64),
    item.name,
    `${item.approved}`,
    text.truncate(item.contactEmail, 64),
    text.truncate(item.currency, 40),
    item.campaignRef,
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPlacementAssignmentViews(items: PlacementAssignment[]): PlacementAssignmentView[] {
  const views: PlacementAssignmentView[] = [];
  for (const item of items) {
    views.push(toPlacementAssignmentView(item));
  }
  return views;
}

export function sumPlacementAssignmentView(view: PlacementAssignmentView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedCost;
}
