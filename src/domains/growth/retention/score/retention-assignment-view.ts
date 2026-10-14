import { RetentionAssignment } from "./retention-assignment.js";

/** How screens and exports show a retention assignment. */
export class RetentionAssignmentView {
  code: string;
  label: string;
  ownerIdText: string;
  floorValueText: string;
  minimum: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    ownerIdText: string,
    floorValueText: string,
    minimum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.ownerIdText = ownerIdText;
    this.floorValueText = floorValueText;
    this.minimum = minimum;
    this.statusLabel = statusLabel;
  }
}

export function toRetentionAssignmentView(item: RetentionAssignment): RetentionAssignmentView {
  return new RetentionAssignmentView(
    item.code,
    item.label,
    item.ownerId,
    item.floorValue.toFixed(2),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRetentionAssignmentViews(items: RetentionAssignment[]): RetentionAssignmentView[] {
  const views: RetentionAssignmentView[] = [];
  for (const item of items) {
    views.push(toRetentionAssignmentView(item));
  }
  return views;
}

export function sumRetentionAssignmentView(view: RetentionAssignmentView): number {
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedFloorValue + parsedMinimum;
}
