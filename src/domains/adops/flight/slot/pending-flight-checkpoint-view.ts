import * as text from "../../../../kit/text.js";
import { PendingFlightCheckpoint } from "./pending-flight-checkpoint.js";

/** How screens and exports show a pending flight checkpoint. */
export class PendingFlightCheckpointView {
  code: string;
  title: string;
  activeText: string;
  pinned: string;
  capacity: string;
  categoryText: string;
  expiresAt: string;
  endsAt: string;
  ratio: string;
  retries: string;
  description: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    activeText: string,
    pinned: string,
    capacity: string,
    categoryText: string,
    expiresAt: string,
    endsAt: string,
    ratio: string,
    retries: string,
    description: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.activeText = activeText;
    this.pinned = pinned;
    this.capacity = capacity;
    this.categoryText = categoryText;
    this.expiresAt = expiresAt;
    this.endsAt = endsAt;
    this.ratio = ratio;
    this.retries = retries;
    this.description = description;
    this.statusLabel = statusLabel;
  }
}

export function toPendingFlightCheckpointView(item: PendingFlightCheckpoint): PendingFlightCheckpointView {
  return new PendingFlightCheckpointView(
    item.code,
    text.truncate(item.title, 64),
    `${item.active}`,
    `${item.pinned}`,
    String(item.capacity),
    text.truncate(item.category, 64),
    String(item.expiresAt),
    String(item.endsAt),
    item.ratio.toFixed(2),
    String(item.retries),
    item.description,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingFlightCheckpointViews(items: PendingFlightCheckpoint[]): PendingFlightCheckpointView[] {
  const views: PendingFlightCheckpointView[] = [];
  for (const item of items) {
    views.push(toPendingFlightCheckpointView(item));
  }
  return views;
}

export function sumPendingFlightCheckpointView(view: PendingFlightCheckpointView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedCapacity + parsedExpiresAt + parsedEndsAt;
}
