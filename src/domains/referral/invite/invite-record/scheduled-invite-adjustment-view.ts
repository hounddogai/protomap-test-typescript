import { ScheduledInviteAdjustment } from "./scheduled-invite-adjustment.js";

/** How screens and exports show a scheduled invite adjustment. */
export class ScheduledInviteAdjustmentView {
  code: string;
  name: string;
  priorityText: string;
  locale: string;
  floorValue: string;
  active: string;
  startsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    priorityText: string,
    locale: string,
    floorValue: string,
    active: string,
    startsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.priorityText = priorityText;
    this.locale = locale;
    this.floorValue = floorValue;
    this.active = active;
    this.startsAt = startsAt;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledInviteAdjustmentView(item: ScheduledInviteAdjustment): ScheduledInviteAdjustmentView {
  return new ScheduledInviteAdjustmentView(
    item.code,
    item.name,
    String(item.priority),
    item.locale,
    item.floorValue.toFixed(2),
    `${item.active}`,
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledInviteAdjustmentViews(items: ScheduledInviteAdjustment[]): ScheduledInviteAdjustmentView[] {
  const views: ScheduledInviteAdjustmentView[] = [];
  for (const item of items) {
    views.push(toScheduledInviteAdjustmentView(item));
  }
  return views;
}

export function sumScheduledInviteAdjustmentView(view: ScheduledInviteAdjustmentView): number {
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedPriority + parsedFloorValue + parsedStartsAt;
}
