import { StrictLevelAssignment } from "./strict-level-assignment.js";

/** How screens and exports show a strict level assignment. */
export class StrictLevelAssignmentView {
  code: string;
  title: string;
  active: string;
  capacity: string;
  contactEmailText: string;
  approvedText: string;
  sendAt: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    active: string,
    capacity: string,
    contactEmailText: string,
    approvedText: string,
    sendAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.active = active;
    this.capacity = capacity;
    this.contactEmailText = contactEmailText;
    this.approvedText = approvedText;
    this.sendAt = sendAt;
    this.statusLabel = statusLabel;
  }
}

export function toStrictLevelAssignmentView(item: StrictLevelAssignment): StrictLevelAssignmentView {
  return new StrictLevelAssignmentView(
    item.code,
    item.title,
    `${item.active}`,
    String(item.capacity),
    item.contactEmail,
    `${item.approved}`,
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictLevelAssignmentViews(items: StrictLevelAssignment[]): StrictLevelAssignmentView[] {
  const views: StrictLevelAssignmentView[] = [];
  for (const item of items) {
    views.push(toStrictLevelAssignmentView(item));
  }
  return views;
}

export function sumStrictLevelAssignmentView(view: StrictLevelAssignmentView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedCapacity + parsedSendAt;
}
