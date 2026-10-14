import { DomainAssignment } from "./domain-assignment.js";

/** How screens and exports show a domain assignment. */
export class DomainAssignmentView {
  codeText: string;
  label: string;
  durationMinutesText: string;
  quantity: string;
  maximumText: string;
  ratio: string;
  weightText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    durationMinutesText: string,
    quantity: string,
    maximumText: string,
    ratio: string,
    weightText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.durationMinutesText = durationMinutesText;
    this.quantity = quantity;
    this.maximumText = maximumText;
    this.ratio = ratio;
    this.weightText = weightText;
    this.statusLabel = statusLabel;
  }
}

export function toDomainAssignmentView(item: DomainAssignment): DomainAssignmentView {
  return new DomainAssignmentView(
    item.code,
    item.label,
    String(item.durationMinutes),
    String(item.quantity),
    item.maximum.toFixed(2),
    item.ratio.toFixed(2),
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDomainAssignmentViews(items: DomainAssignment[]): DomainAssignmentView[] {
  const views: DomainAssignmentView[] = [];
  for (const item of items) {
    views.push(toDomainAssignmentView(item));
  }
  return views;
}

export function sumDomainAssignmentView(view: DomainAssignmentView): number {
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  return parsedDurationMinutes + parsedQuantity + parsedMaximum;
}
