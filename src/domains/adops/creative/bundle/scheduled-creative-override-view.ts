import { ScheduledCreativeOverride } from "./scheduled-creative-override.js";

/** How screens and exports show a scheduled creative override. */
export class ScheduledCreativeOverrideView {
  codeText: string;
  name: string;
  pinned: string;
  quantity: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    pinned: string,
    quantity: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.pinned = pinned;
    this.quantity = quantity;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledCreativeOverrideView(item: ScheduledCreativeOverride): ScheduledCreativeOverrideView {
  return new ScheduledCreativeOverrideView(
    item.code,
    item.name,
    `${item.pinned}`,
    String(item.quantity),
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledCreativeOverrideViews(items: ScheduledCreativeOverride[]): ScheduledCreativeOverrideView[] {
  const views: ScheduledCreativeOverrideView[] = [];
  for (const item of items) {
    views.push(toScheduledCreativeOverrideView(item));
  }
  return views;
}

export function sumScheduledCreativeOverrideView(view: ScheduledCreativeOverrideView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedQuantity + parsedDurationMinutes;
}
