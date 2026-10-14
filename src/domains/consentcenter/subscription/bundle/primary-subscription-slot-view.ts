import { PrimarySubscriptionSlot } from "./primary-subscription-slot.js";

/** How screens and exports show a primary subscription slot. */
export class PrimarySubscriptionSlotView {
  code: string;
  title: string;
  timezone: string;
  durationMinutes: string;
  label: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    timezone: string,
    durationMinutes: string,
    label: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.timezone = timezone;
    this.durationMinutes = durationMinutes;
    this.label = label;
    this.statusLabel = statusLabel;
  }
}

export function toPrimarySubscriptionSlotView(item: PrimarySubscriptionSlot): PrimarySubscriptionSlotView {
  return new PrimarySubscriptionSlotView(
    item.code,
    item.title,
    item.timezone,
    String(item.durationMinutes),
    item.label,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimarySubscriptionSlotViews(items: PrimarySubscriptionSlot[]): PrimarySubscriptionSlotView[] {
  const views: PrimarySubscriptionSlotView[] = [];
  for (const item of items) {
    views.push(toPrimarySubscriptionSlotView(item));
  }
  return views;
}

export function sumPrimarySubscriptionSlotView(view: PrimarySubscriptionSlotView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedDurationMinutes;
}
