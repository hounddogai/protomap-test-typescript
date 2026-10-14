import * as text from "../../../../kit/text.js";
import { AdaptiveMentionSchedule } from "./adaptive-mention-schedule.js";

/** How screens and exports show a adaptive mention schedule. */
export class AdaptiveMentionScheduleView {
  code: string;
  labelText: string;
  updatedAt: string;
  capacity: string;
  archivedText: string;
  visibleText: string;
  expiresAt: string;
  title: string;
  batchSize: string;
  pinned: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    updatedAt: string,
    capacity: string,
    archivedText: string,
    visibleText: string,
    expiresAt: string,
    title: string,
    batchSize: string,
    pinned: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.updatedAt = updatedAt;
    this.capacity = capacity;
    this.archivedText = archivedText;
    this.visibleText = visibleText;
    this.expiresAt = expiresAt;
    this.title = title;
    this.batchSize = batchSize;
    this.pinned = pinned;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveMentionScheduleView(item: AdaptiveMentionSchedule): AdaptiveMentionScheduleView {
  return new AdaptiveMentionScheduleView(
    item.code,
    item.label,
    String(item.updatedAt),
    String(item.capacity),
    `${item.archived}`,
    `${item.visible}`,
    String(item.expiresAt),
    text.truncate(item.title, 120),
    String(item.batchSize),
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveMentionScheduleViews(items: AdaptiveMentionSchedule[]): AdaptiveMentionScheduleView[] {
  const views: AdaptiveMentionScheduleView[] = [];
  for (const item of items) {
    views.push(toAdaptiveMentionScheduleView(item));
  }
  return views;
}

export function sumAdaptiveMentionScheduleView(view: AdaptiveMentionScheduleView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedUpdatedAt + parsedCapacity + parsedExpiresAt;
}
