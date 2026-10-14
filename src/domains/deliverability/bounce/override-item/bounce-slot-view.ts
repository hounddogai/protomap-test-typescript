import * as text from "../../../../kit/text.js";
import { BounceSlot } from "./bounce-slot.js";

/** How screens and exports show a bounce slot. */
export class BounceSlotView {
  code: string;
  title: string;
  retries: string;
  reviewer: string;
  durationMinutes: string;
  ownerId: string;
  description: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    retries: string,
    reviewer: string,
    durationMinutes: string,
    ownerId: string,
    description: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.retries = retries;
    this.reviewer = reviewer;
    this.durationMinutes = durationMinutes;
    this.ownerId = ownerId;
    this.description = description;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toBounceSlotView(item: BounceSlot): BounceSlotView {
  return new BounceSlotView(
    text.truncate(item.code, 64),
    item.title,
    String(item.retries),
    text.truncate(item.reviewer, 80),
    String(item.durationMinutes),
    text.truncate(item.ownerId, 80),
    item.description,
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toBounceSlotViews(items: BounceSlot[]): BounceSlotView[] {
  const views: BounceSlotView[] = [];
  for (const item of items) {
    views.push(toBounceSlotView(item));
  }
  return views;
}

export function sumBounceSlotView(view: BounceSlotView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedRetries + parsedDurationMinutes;
}
