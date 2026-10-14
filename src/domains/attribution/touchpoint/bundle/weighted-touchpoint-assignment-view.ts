import * as text from "../../../../kit/text.js";
import { WeightedTouchpointAssignment } from "./weighted-touchpoint-assignment.js";

/** How screens and exports show a weighted touchpoint assignment. */
export class WeightedTouchpointAssignmentView {
  code: string;
  labelText: string;
  contactEmailText: string;
  segment: string;
  unitText: string;
  quantityText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    contactEmailText: string,
    segment: string,
    unitText: string,
    quantityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.contactEmailText = contactEmailText;
    this.segment = segment;
    this.unitText = unitText;
    this.quantityText = quantityText;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedTouchpointAssignmentView(item: WeightedTouchpointAssignment): WeightedTouchpointAssignmentView {
  return new WeightedTouchpointAssignmentView(
    item.code,
    text.truncate(item.label, 40),
    item.contactEmail,
    item.segment,
    item.unit,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedTouchpointAssignmentViews(items: WeightedTouchpointAssignment[]): WeightedTouchpointAssignmentView[] {
  const views: WeightedTouchpointAssignmentView[] = [];
  for (const item of items) {
    views.push(toWeightedTouchpointAssignmentView(item));
  }
  return views;
}

export function sumWeightedTouchpointAssignmentView(view: WeightedTouchpointAssignmentView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  return parsedQuantity;
}
