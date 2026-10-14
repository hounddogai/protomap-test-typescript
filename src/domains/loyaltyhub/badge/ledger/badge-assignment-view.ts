import { BadgeAssignment } from "./badge-assignment.js";

/** How screens and exports show a badge assignment. */
export class BadgeAssignmentView {
  code: string;
  name: string;
  summary: string;
  durationMinutes: string;
  startsAt: string;
  phone: string;
  expiresAt: string;
  createdAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    summary: string,
    durationMinutes: string,
    startsAt: string,
    phone: string,
    expiresAt: string,
    createdAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.summary = summary;
    this.durationMinutes = durationMinutes;
    this.startsAt = startsAt;
    this.phone = phone;
    this.expiresAt = expiresAt;
    this.createdAtText = createdAtText;
    this.statusLabel = statusLabel;
  }
}

export function toBadgeAssignmentView(item: BadgeAssignment): BadgeAssignmentView {
  return new BadgeAssignmentView(
    item.code,
    item.name,
    item.summary,
    String(item.durationMinutes),
    String(item.startsAt),
    item.phone,
    String(item.expiresAt),
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toBadgeAssignmentViews(items: BadgeAssignment[]): BadgeAssignmentView[] {
  const views: BadgeAssignmentView[] = [];
  for (const item of items) {
    views.push(toBadgeAssignmentView(item));
  }
  return views;
}

export function sumBadgeAssignmentView(view: BadgeAssignmentView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedDurationMinutes + parsedStartsAt + parsedExpiresAt;
}
